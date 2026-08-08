const DATABASE_NAME = 'rabbani-pos-offline';
const STORE_NAME = 'local-storage-backup';
const PREFIX = 'rabbani_';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function writeBackup(key: string, value: string | null) {
  if (!key.startsWith(PREFIX) || typeof indexedDB === 'undefined') return;
  try {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    if (value === null) store.delete(key);
    else store.put(value, key);
  } catch {
    // localStorage remains the primary store when IndexedDB is unavailable.
  }
}

export async function restoreOfflineData() {
  if (typeof indexedDB === 'undefined') return;
  try {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAllKeys();
    const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await Promise.all(keys.map(key => new Promise<void>(resolve => {
      const valueRequest = store.get(key);
      valueRequest.onsuccess = () => {
        const storageKey = String(key);
        if (localStorage.getItem(storageKey) === null && typeof valueRequest.result === 'string') {
          localStorage.setItem(storageKey, valueRequest.result);
        }
        resolve();
      };
      valueRequest.onerror = () => resolve();
    })));
  } catch {
    // Start normally with localStorage if backup restoration is unavailable.
  }
}

export function enableOfflineDataBackup() {
  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);
  localStorage.setItem = ((key: string, value: string) => {
    originalSetItem(key, value);
    void writeBackup(key, value);
  }) as typeof localStorage.setItem;
  localStorage.removeItem = ((key: string) => {
    originalRemoveItem(key);
    void writeBackup(key, null);
  }) as typeof localStorage.removeItem;

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(PREFIX)) void writeBackup(key, localStorage.getItem(key));
  }
}