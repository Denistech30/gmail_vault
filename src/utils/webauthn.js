import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

export async function enrollFingerprint() {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32)).buffer;

    const resp = await startRegistration({
      rp: { name: 'Gmail Vault', id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(crypto.randomUUID()),
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
    const challenge = crypto.getRandomValues(new Uint8Array(32)).buffer;

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
