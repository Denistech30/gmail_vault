/**
 * Client-side cryptography helpers for Gmail Vault.
 *
 * Security notes:
 * - Raw master keys and fingerprint material never leave the device.
 * - Only encrypted payloads (ciphertext, encryptedMasterKey) should be stored remotely.
 * - If a user loses their fingerprint enrollment without backup, recovery is impossible.
 */

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();
const DEFAULT_PBKDF2_ITERATIONS = 310000;

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function importAesKeyFromBase64(base64Key) {
  const rawKey = base64ToArrayBuffer(base64Key);
  return window.crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

async function deriveFingerprintKey(publicHash) {
  const digest = await window.crypto.subtle.digest(
    "SHA-256",
    TEXT_ENCODER.encode(publicHash)
  );
  return window.crypto.subtle.importKey(
    "raw",
    digest,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

function generateRandomBytes(length) {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return bytes;
}

async function deriveKeyFromPassphrase(passphrase, saltBytes, iterations = DEFAULT_PBKDF2_ITERATIONS) {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    TEXT_ENCODER.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Generates a new 256-bit master key for vault encryption.
 * @returns {string} Base64-encoded master key suitable for storage in localStorage.
 */
export function generateMasterKey() {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return bufferToBase64(bytes.buffer);
}

/**
 * Encrypts plaintext using AES-GCM with the provided master key.
 * @param {string} masterKey - Base64-encoded 256-bit key.
 * @param {string} plaintext - UTF-8 string to encrypt.
 * @returns {Promise<{ iv: string, ciphertext: string }>} Base64 components of the encrypted payload.
 */
export async function encryptData(masterKey, plaintext) {
  const key = await importAesKeyFromBase64(masterKey);
  const ivBytes = new Uint8Array(12);
  window.crypto.getRandomValues(ivBytes);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    TEXT_ENCODER.encode(plaintext)
  );

  return {
    iv: bufferToBase64(ivBytes.buffer),
    ciphertext: bufferToBase64(ciphertext),
  };
}

/**
 * Decrypts AES-GCM ciphertext using the provided master key.
 * @param {string} masterKey - Base64-encoded 256-bit key.
 * @param {{ iv: string, ciphertext: string }} encryptedObj - Base64 components from encryptData.
 * @returns {Promise<string>} Decrypted UTF-8 plaintext string.
 */
export async function decryptData(masterKey, encryptedObj) {
  const key = await importAesKeyFromBase64(masterKey);
  const ivBuffer = base64ToArrayBuffer(encryptedObj.iv);
  const cipherBuffer = base64ToArrayBuffer(encryptedObj.ciphertext);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(ivBuffer) },
    key,
    cipherBuffer
  );

  return TEXT_DECODER.decode(decrypted);
}

/**
 * Encrypts the master key using a key derived from the fingerprint hash.
 * @param {string} masterKey - Base64-encoded master key to wrap.
 * @param {string} publicHash - Fingerprint hash collected during enrollment.
 * @returns {Promise<{ iv: string, encryptedMasterKey: string }>}
 */
export async function encryptMasterKeyWithFingerprint(masterKey, publicHash) {
  const derivedKey = await deriveFingerprintKey(publicHash);
  const ivBytes = new Uint8Array(12);
  window.crypto.getRandomValues(ivBytes);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    derivedKey,
    base64ToArrayBuffer(masterKey)
  );

  return {
    iv: bufferToBase64(ivBytes.buffer),
    encryptedMasterKey: bufferToBase64(encrypted),
  };
}

/**
 * Decrypts the stored master key using the fingerprint-derived key.
 * @param {{ iv: string, encryptedMasterKey: string }} encryptedObj - Wrapped master key components.
 * @param {string} publicHash - Fingerprint hash used to derive the same key.
 * @returns {Promise<string>} Base64-encoded master key.
 */
export async function decryptMasterKeyWithFingerprint(encryptedObj, publicHash) {
  const derivedKey = await deriveFingerprintKey(publicHash);
  const ivBuffer = base64ToArrayBuffer(encryptedObj.iv);
  const payloadBuffer = base64ToArrayBuffer(encryptedObj.encryptedMasterKey);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(ivBuffer) },
    derivedKey,
    payloadBuffer
  );

  return bufferToBase64(decrypted);
}

/**
 * Wraps the master key using a passphrase-derived AES-GCM key.
 * @param {string} masterKey - Base64-encoded master key.
 * @param {string} passphrase - User-provided recovery phrase.
 * @returns {Promise<{ salt: string, iv: string, ciphertext: string, iterations: number }>}
 */
export async function wrapMasterKeyWithPassphrase(masterKey, passphrase) {
  if (!passphrase) {
    throw new Error("Passphrase is required to wrap the master key");
  }

  const saltBytes = generateRandomBytes(16);
  const ivBytes = generateRandomBytes(12);
  const derivedKey = await deriveKeyFromPassphrase(passphrase, saltBytes);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    derivedKey,
    base64ToArrayBuffer(masterKey)
  );

  return {
    salt: bufferToBase64(saltBytes.buffer),
    iv: bufferToBase64(ivBytes.buffer),
    ciphertext: bufferToBase64(encrypted),
    iterations: DEFAULT_PBKDF2_ITERATIONS,
  };
}

/**
 * Unwraps the master key using a passphrase-derived AES-GCM key.
 * @param {{ salt: string, iv: string, ciphertext: string, iterations?: number }} payload
 * @param {string} passphrase - Recovery phrase supplied by the user.
 * @returns {Promise<string>} Base64-encoded master key.
 */
export async function unwrapMasterKeyWithPassphrase(payload, passphrase) {
  if (!payload?.salt || !payload?.iv || !payload?.ciphertext) {
    throw new Error("Passphrase backup payload is incomplete");
  }
  if (!passphrase) {
    throw new Error("Passphrase is required to unwrap the master key");
  }

  const saltBytes = base64ToArrayBuffer(payload.salt);
  const ivBytes = base64ToArrayBuffer(payload.iv);
  const cipherBytes = base64ToArrayBuffer(payload.ciphertext);
  const derivedKey = await deriveKeyFromPassphrase(
    passphrase,
    new Uint8Array(saltBytes),
    payload.iterations || DEFAULT_PBKDF2_ITERATIONS
  );

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(ivBytes) },
    derivedKey,
    cipherBytes
  );

  return bufferToBase64(decrypted);
}

/**
 * Hashes sensitive metadata (e.g., email) for lookup without storing plaintext.
 * @param {string} value - Sensitive string to hash.
 * @returns {Promise<string>} Base64-encoded SHA-256 digest.
 */
export async function hashSensitiveString(value) {
  if (!value) return "";
  const digest = await window.crypto.subtle.digest(
    "SHA-256",
    TEXT_ENCODER.encode(value.trim().toLowerCase())
  );
  return bufferToBase64(digest);
}

/**
 * Generates a salted, iterated hash suitable for storing password fingerprints.
 * @param {string} password - Plaintext password to hash.
 * @returns {Promise<{ salt: string, hash: string, iterations: number }>}
 */
export async function hashPasswordForStorage(password) {
  if (!password) {
    throw new Error("Password is required for hashing");
  }

  const saltBytes = generateRandomBytes(16);
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    TEXT_ENCODER.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const hashBuffer = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: DEFAULT_PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return {
    salt: bufferToBase64(saltBytes.buffer),
    hash: bufferToBase64(hashBuffer),
    iterations: DEFAULT_PBKDF2_ITERATIONS,
  };
}
