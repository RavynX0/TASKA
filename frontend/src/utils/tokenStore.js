// A service worker can't read localStorage, but it can read IndexedDB, so the
// auth token is mirrored here too. This is what lets notification action
// buttons (Start task, Done, 15 min later, ...) call the API directly from
// the service worker, without needing the Taska tab open.
const DB_NAME = "taska-sw-store";
const STORE = "kv";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function setStoredToken(token) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(token, "token");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearStoredToken() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete("token");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
