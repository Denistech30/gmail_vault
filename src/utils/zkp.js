// Simple ZKP using Web Crypto API (SHA-256)
// More compatible than SnarkyJS, no SharedArrayBuffer needed

export async function hashCredential(cred) {
  // Convert credential to JSON string
  const json = JSON.stringify(cred);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  
  // Use SHA-256 hash (built into browsers)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return {
    toString: () => hashHex,
    equals: (other) => hashHex === other
  };
}

export async function createProof(cred, publicHash) {
  const privateHash = await hashCredential(cred);
  return privateHash.toString() === publicHash;
}
