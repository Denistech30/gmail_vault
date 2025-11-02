import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

const bufferToBase64URL = (buffer) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const randomBase64URL = (length = 32) => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(length));
  return bufferToBase64URL(randomBytes);
};

const ensureSecureContext = () => {
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    throw new Error('WebAuthn requires HTTPS. Open this app over https://');
  }
};

export const ensurePlatformAuthenticatorAvailable = async () => {
  ensureSecureContext();

  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn is not supported in this browser.');
  }

  if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
    throw new Error('Platform authenticator check is unavailable in this browser.');
  }

  const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  if (!available) {
    throw new Error('No enrolled biometric authenticator found on this device.');
  }
};

export async function enrollFingerprint() {
  try {
    await ensurePlatformAuthenticatorAvailable();

    const challenge = randomBase64URL(32);
    const userId = bufferToBase64URL(new TextEncoder().encode(crypto.randomUUID()));

    const resp = await startRegistration({
      publicKey: {
        rp: { name: 'Gmail Vault', id: window.location.hostname },
        user: {
          id: userId,
          name: 'user@gmail.com',
          displayName: 'Gmail Vault User',
        },
        challenge,
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'required',
          authenticatorAttachment: 'platform',
        },
        timeout: 60000,
        attestation: 'none',
      },
    });

    return resp;
  } catch (err) {
    console.error('Enrollment failed:', err);
    throw new Error('Biometrics not supported. Use HTTPS and a secure device.');
  }
}

export async function authenticateFingerprint() {
  try {
    await ensurePlatformAuthenticatorAvailable();

    const challenge = randomBase64URL(32);

    const resp = await startAuthentication({
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [],
        userVerification: 'required',
        timeout: 60000,
      },
    });

    return resp;
  } catch (err) {
    console.error('Authentication failed:', err);
    throw new Error('Fingerprint scan failed. Try again.');
  }
}
