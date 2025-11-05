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
  // Check support
  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn not supported in this browser');
  }
  if (!window.isSecureContext) {
    throw new Error('HTTPS required. Use Netlify URL, not localhost');
  }

  const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  if (!available) {
    throw new Error('No biometric sensor or not configured');
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));

  const publicKey = {
    challenge,
    rp: { name: 'Gmail Vault' },
    user: {
      id: userId,
      name: 'user@gmail.com',
      displayName: 'Gmail Vault User',
    },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    authenticatorSelection: {
      userVerification: 'preferred', // Relaxed for mobile
    },
    timeout: 60000,
  };

  try {
    const credential = await navigator.credentials.create({ publicKey });
    return credential;
  } catch (err) {
    console.error('Enrollment failed:', err);
    if (err.name === 'NotAllowedError') {
      throw new Error('Permission denied or timeout. Try again or check device lock.');
    }
    throw new Error('Fingerprint enrollment failed. Try again.');
  }
}

export async function authenticateFingerprint() {
  if (!window.PublicKeyCredential) throw new Error('WebAuthn not supported');
  if (!window.isSecureContext) throw new Error('HTTPS required');

  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const publicKey = {
    challenge,
    rpId: window.location.hostname,
    allowCredentials: [],
    userVerification: 'preferred', // Relaxed for mobile
    timeout: 60000,
  };

  try {
    const assertion = await navigator.credentials.get({ publicKey });
    return assertion;
  } catch (err) {
    console.error('Authentication failed:', err);
    if (err.name === 'NotAllowedError') {
      throw new Error('Permission denied or timeout. Try again or check device lock.');
    }
    throw new Error('Fingerprint scan failed. Try again.');
  }
}
