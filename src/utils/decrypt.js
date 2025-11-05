import { getMasterKey } from './masterKey';

export async function decryptData(encryptedObj) {
  const { encryptedData, iv, salt } = encryptedObj;
  const masterKey = getMasterKey();
  if (!masterKey) {
    throw new Error('Master key is unavailable');
  }

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterKey),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new Uint8Array(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(encryptedData)
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}
