const DB_NAME = "gmailVaultCache";
const STORE_NAME = "encryptedAccounts";
const DB_VERSION = 1;

function openDatabase() {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(new Error("IndexedDB is not supported in this environment"));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("uid", "uid", { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to open IndexedDB"));
    };
  });
}

export async function cacheEncryptedAccounts(uid, accounts) {
  if (!uid || !Array.isArray(accounts) || accounts.length === 0) return;

  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  accounts.forEach((account) => {
    if (!account?.id) return;
    store.put({
      key: `${uid}:${account.id}`,
      uid,
      account,
      cachedAt: Date.now(),
    });
  });

  return tx.complete;
}

export async function getCachedAccounts(uid) {
  if (!uid) return [];

  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const index = store.index("uid");

  return new Promise((resolve, reject) => {
    const request = index.getAll(IDBKeyRange.only(uid));
    request.onsuccess = () => {
      const results = request.result || [];
      resolve(results.map((entry) => entry.account));
    };
    request.onerror = () => reject(request.error || new Error("Failed to read cache"));
  });
}

export async function clearCachedAccounts(uid) {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  if (uid) {
    const index = store.index("uid");
    const request = index.getAllKeys(IDBKeyRange.only(uid));
    request.onsuccess = () => {
      const keys = request.result || [];
      keys.forEach((key) => {
        store.delete(key);
      });
    };
    request.onerror = () => {
      console.warn("Failed to clear cached accounts for uid", uid, request.error);
    };
  } else {
    store.clear();
  }

  return tx.complete;
}

export async function removeCachedAccount(uid, accountId) {
  if (!uid || !accountId) return;
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.delete(`${uid}:${accountId}`);
  return tx.complete;
}
