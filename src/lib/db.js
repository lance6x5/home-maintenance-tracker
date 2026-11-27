/**
 * Tiny promise wrapper around IndexedDB. Falls back to localStorage if
 * IndexedDB is unavailable (e.g. some private-browsing modes).
 * NOTE: public/reminder-sw.js reads the same database — keep names in sync.
 */
export const DB_NAME = 'home-maintenance-tracker';
export const STORE = 'tasks';
const DB_VERSION = 1;
const LS_KEY = 'hmt-tasks-fallback';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

/** Run a transaction; `fn` receives the object store and may return a request. */
async function tx(mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const req = fn(store);
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

// ---- localStorage fallback ----
function lsRead() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}
function lsWrite(tasks) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Could not save to localStorage', e);
    throw e;
  }
}

export async function getAllTasks() {
  try {
    return await tx('readonly', (s) => s.getAll());
  } catch (e) {
    console.warn('IndexedDB read failed, using localStorage fallback', e);
    return lsRead();
  }
}

export async function putTask(task) {
  try {
    await tx('readwrite', (s) => s.put(task));
  } catch (e) {
    console.warn('IndexedDB write failed, using localStorage fallback', e);
    const all = lsRead().filter((t) => t.id !== task.id);
    lsWrite([...all, task]);
  }
}

export async function deleteTask(id) {
  try {
    await tx('readwrite', (s) => s.delete(id));
  } catch (e) {
    console.warn('IndexedDB delete failed, using localStorage fallback', e);
    lsWrite(lsRead().filter((t) => t.id !== id));
  }
}

/** Replace every stored task (used by import). */
export async function replaceAllTasks(tasks) {
  try {
    await tx('readwrite', (s) => {
      s.clear();
      for (const t of tasks) s.put(t);
    });
  } catch (e) {
    console.warn('IndexedDB replace failed, using localStorage fallback', e);
    lsWrite(tasks);
  }
}

export async function clearAllTasks() {
  try {
    await tx('readwrite', (s) => s.clear());
  } catch (e) {
    console.warn('IndexedDB clear failed', e);
  }
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}
