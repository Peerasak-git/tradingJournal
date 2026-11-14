'use client';

const DB_NAME = 'TradingJournalDB';
const DB_VERSION = 1;
const STORE_NAME = 'trade_images';

// In-memory fallback if IndexedDB is not available
const memoryImageCache = new Map<string, string>();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Save an image (Base64 dataUrl) to IndexedDB.
 * Returns the reference key e.g. "idb://img_xxx"
 */
export async function saveImageToIndexedDB(id: string, dataUrl: string): Promise<string> {
  if (!id || !dataUrl) return dataUrl;
  
  // If it's a remote URL, keep as is
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return dataUrl;
  }

  // Save to memory cache as immediate fallback
  memoryImageCache.set(id, dataUrl);

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id, dataUrl, updatedAt: Date.now() });

      req.onsuccess = () => {
        resolve(`idb://${id}`);
      };

      req.onerror = () => {
        // Fall back to memory cache
        resolve(`idb://${id}`);
      };

      tx.oncomplete = () => {
        db.close();
      };
    });
  } catch (err) {
    console.warn('IndexedDB write failed, stored in memory cache:', err);
    return `idb://${id}`;
  }
}

/**
 * Get an image (Base64 dataUrl) from IndexedDB by reference key or ID.
 */
export async function getImageFromIndexedDB(refOrId: string | null | undefined): Promise<string | null> {
  if (!refOrId) return null;

  // If it's already a full dataUrl or remote URL, return directly
  if (refOrId.startsWith('data:image') || refOrId.startsWith('http://') || refOrId.startsWith('https://')) {
    return refOrId;
  }

  const id = refOrId.startsWith('idb://') ? refOrId.replace('idb://', '') : refOrId;

  // Check memory cache first
  if (memoryImageCache.has(id)) {
    return memoryImageCache.get(id) || null;
  }

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        const result = req.result;
        if (result && result.dataUrl) {
          memoryImageCache.set(id, result.dataUrl);
          resolve(result.dataUrl);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => {
        resolve(memoryImageCache.get(id) || null);
      };

      tx.oncomplete = () => {
        db.close();
      };
    });
  } catch (err) {
    console.warn('IndexedDB read failed:', err);
    return memoryImageCache.get(id) || null;
  }
}

/**
 * Delete an image from IndexedDB.
 */
export async function deleteImageFromIndexedDB(refOrId: string): Promise<void> {
  if (!refOrId) return;
  const id = refOrId.startsWith('idb://') ? refOrId.replace('idb://', '') : refOrId;
  memoryImageCache.delete(id);

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => db.close();
  } catch {}
}
