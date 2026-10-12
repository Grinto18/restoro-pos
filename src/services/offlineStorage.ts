// IndexedDB storage manager for Golden Palace POS offline support

const DB_NAME = 'GoldenPalacePosDB';
const DB_VERSION = 1;

export interface OfflineOrderPayload {
  offlineId: string;
  type: string;
  tableId?: number | null;
  items: any[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paidAmount: number;
  paymentStatus: string;
  paymentMethod?: string;
  idempotencyKey: string;
  createdAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache');
      }
      if (!db.objectStoreNames.contains('offline_orders')) {
        db.createObjectStore('offline_orders', { keyPath: 'offlineId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function setCachedData(key: string, data: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('cache', 'readwrite');
    tx.objectStore('cache').put(data, key);
  } catch (err) {
    console.warn('Failed to cache data to IndexedDB:', err);
  }
}

export async function getCachedData<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('cache', 'readonly');
      const req = tx.objectStore('cache').get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveOfflineOrder(order: OfflineOrderPayload): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('offline_orders', 'readwrite');
    tx.objectStore('offline_orders').put(order);
  } catch (err) {
    console.error('Failed to save offline order to IndexedDB:', err);
  }
}

export async function getOfflineOrders(): Promise<OfflineOrderPayload[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('offline_orders', 'readonly');
      const req = tx.objectStore('offline_orders').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function deleteOfflineOrder(offlineId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('offline_orders', 'readwrite');
    tx.objectStore('offline_orders').delete(offlineId);
  } catch (err) {
    console.error('Failed to delete offline order:', err);
  }
}
