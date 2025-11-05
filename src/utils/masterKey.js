import CryptoJS from 'crypto-js';

const MASTER_KEY_STORAGE_KEY = 'masterKey';

export function ensureMasterKey() {
  if (typeof window === 'undefined') {
    return null;
  }

  let masterKey = window.localStorage.getItem(MASTER_KEY_STORAGE_KEY);
  if (!masterKey) {
    masterKey = CryptoJS.lib.WordArray.random(32).toString();
    window.localStorage.setItem(MASTER_KEY_STORAGE_KEY, masterKey);
  }

  return masterKey;
}

export function getMasterKey() {
  if (typeof window === 'undefined') {
    return null;
  }

  return ensureMasterKey();
}

export function setMasterKey(value) {
  if (typeof window === 'undefined') {
    return null;
  }

  window.localStorage.setItem(MASTER_KEY_STORAGE_KEY, value);
  return value;
}
