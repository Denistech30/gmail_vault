import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

export async function enrollFingerprint() {
  try {
    const resp = await startRegistration({
      rp: { name: 'Gmail Vault', id: window.location.hostname },
      user: { id: crypto.randomUUID(), name: 'user', displayName: 'User' },
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
      attestation: 'direct'
    });
    return resp; // This is the raw credential
  } catch (err) {
    console.error('Enrollment failed:', err);
    throw err;
  }
}

export async function authenticateFingerprint() {
  try {
    const resp = await startAuthentication({
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rpId: window.location.hostname,
      allowCredentials: [],
      userVerification: 'required'
    });
    return resp;
  } catch (err) {
    console.error('Auth failed:', err);
    throw err;
  }
}
