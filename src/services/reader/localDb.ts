import { LocalBook } from '../../types';
import { getAccountScope } from '../../utils/accountStorage';

const DB_NAME = 'LocalNovelsDB';
const STORE_NAME = 'novels_shelf';
const DB_VERSION = 1;

export function getIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = (e: any) => reject(e.target.error);
  });
}

export async function getLocalBooksFromDB(targetScope?: string): Promise<LocalBook[]> {
  try {
    const scope = targetScope || getAccountScope();
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const all: LocalBook[] = request.result || [];
        // Lọc sách offline theo tài khoản người dùng
        const scoped = all.filter(b => !b.accountScope || b.accountScope === scope);
        resolve(scoped);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('IndexedDB getLocalBooks error:', err);
    return [];
  }
}

export async function saveLocalBookToDB(book: LocalBook): Promise<boolean> {
  try {
    const db = await getIndexedDB();
    const scope = book.accountScope || getAccountScope();
    const bookToSave: LocalBook = { ...book, accountScope: scope };
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(bookToSave);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('IndexedDB saveLocalBook error:', err);
    return false;
  }
}

export async function deleteLocalBookFromDB(bookId: string): Promise<boolean> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(bookId);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('IndexedDB deleteLocalBook error:', err);
    return false;
  }
}
