/**
 * WebAuthn client utilities for Gmail Vault.
 * These helpers prepare native browser credentials that will later be
 * forwarded to the FMZR backend for verification and secure storage.
 */

export function isWebAuthnAvailable() {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator?.credentials !== 'undefined'
  );
}

/**
 * Initiates platform biometric enrollment using WebAuthn.
 * Generates a random challenge and user handle locally; the resulting
 * credential should be serialized (ArrayBuffers → base64url) before sending
 * to the backend for persistence and ZKP setup.
 *
 * @returns {Promise<PublicKeyCredential>} a newly created public-key credential.
 * @throws {Error} if WebAuthn is unavailable or enrollment fails.
 */
export async function startFingerprintEnrollment() {
  if (!isWebAuthnAvailable()) {
    throw new Error('WebAuthn not supported on this device or insecure context');
  }

  const publicKeyOptions = {
    challenge: Uint8Array.from(window.crypto.getRandomValues(new Uint8Array(32))),
    rp: { name: 'Gmail Vault' },
    user: {
      id: Uint8Array.from(window.crypto.getRandomValues(new Uint8Array(16))),
      name: 'gmailvault_user',
      displayName: 'Gmail Vault User',
    },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
    },
    timeout: 60000,
    attestation: 'direct',
  };

  const credential = await navigator.credentials.create({ publicKey: publicKeyOptions });
  if (!credential) {
    throw new Error('Enrollment failed');
  }

  return credential;
}

/**
 * Requests a WebAuthn assertion using the platform authenticator.
 * Returns the assertion to be relayed to the backend for signature
 * verification and ZKP comparison during account recovery.
 *
 * @returns {Promise<PublicKeyCredential>} the assertion challenge response.
 * @throws {Error} if the browser lacks WebAuthn support or verification fails.
 */
export async function verifyFingerprint() {
  if (!isWebAuthnAvailable()) {
    throw new Error('WebAuthn not supported on this device or insecure context');
  }

  const assertionOptions = {
    challenge: Uint8Array.from(window.crypto.getRandomValues(new Uint8Array(32))),
    userVerification: 'required',
  };

  const assertion = await navigator.credentials.get({ publicKey: assertionOptions });
  if (!assertion) {
    throw new Error('Verification failed');
  }

  return assertion;
}
