import CryptoJS from 'crypto-js';

export function splitIntoShards(cred) {
  const json = JSON.stringify(cred);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  const shard1 = data.slice(0, data.length / 2);
  const shard2 = data.slice(data.length / 2);
  return { shard1: Array.from(shard1), shard2: Array.from(shard2) };
}

export function encryptShard(shard, key) {
  return CryptoJS.AES.encrypt(JSON.stringify(shard), key).toString();
}

export function decryptShard(encrypted, key) {
  const bytes = CryptoJS.AES.decrypt(encrypted, key);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

export function combineShards(shard1, shard2) {
  const combined = new Uint8Array([...shard1, ...shard2]);
  return new TextDecoder().decode(combined);
}
