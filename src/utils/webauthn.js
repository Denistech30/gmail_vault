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

export async function enrollFingerprint() {
  try {
    const challenge = randomBase64URL(32);
    const userId = bufferToBase64URL(new TextEncoder().encode(crypto.randomUUID()));

    const resp = await startRegistration({
      rp: { name: 'Gmail Vault', id: window.location.hostname },
      user: {
        id: userId,
        name: 'user@gmail.com',
        displayName: 'Gmail Vault User',
      },
      challenge,
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
      timeout: 60000,
    });

    return resp;
  } catch (err) {
    console.error('Enrollment failed:', err);
    throw new Error('Biometrics not supported. Use HTTPS and a secure device.');
  }
}

export async function authenticateFingerprint() {
  try {
    const challenge = randomBase64URL(32);

    const resp = await startAuthentication({
      challenge,
      rpId: window.location.hostname,
      allowCredentials: [],
      userVerification: 'required',
      timeout: 60000,
    });

    return resp;
  } catch (err) {
    console.error('Authentication failed:', err);
    throw new Error('Fingerprint scan failed. Try again.');
  }
}
