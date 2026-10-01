/**
 * Encrypted offline outbox (IndexedDB + WebCrypto AES-GCM).
 *
 * Private writes made without connection (journal entries) wait here until they
 * can be synced. Payloads are encrypted with a non-extractable key that never
 * leaves IndexedDB, so the content is not readable as plain text from storage.
 * This protects against casual inspection of the device storage; it is not a
 * substitute for the device lock.
 */
const DB_NAME = "camino-offline";
const DB_VERSION = 1;
const KEYS = "keys";
const OUTBOX = "outbox";

export interface OutboxRecord<T> {
  id: string;
  kind: string;
  userId: string;
  createdAt: number;
  payload: T;
}

interface StoredRecord {
  id: string;
  kind: string;
  userId: string;
  createdAt: number;
  iv: Uint8Array;
  data: ArrayBuffer;
}

export function isOutboxSupported(): boolean {
  return typeof indexedDB !== "undefined" && typeof crypto !== "undefined" && Boolean(crypto.subtle);
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(KEYS)) db.createObjectStore(KEYS);
      if (!db.objectStoreNames.contains(OUTBOX)) db.createObjectStore(OUTBOX, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  db: IDBDatabase,
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function key(db: IDBDatabase): Promise<CryptoKey> {
  const existing = await tx<CryptoKey | undefined>(db, KEYS, "readonly", (s) => s.get("outbox"));
  if (existing) return existing;
  const created = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  await tx(db, KEYS, "readwrite", (s) => s.put(created, "outbox"));
  return created;
}

export async function enqueue<T>(record: OutboxRecord<T>): Promise<void> {
  const db = await open();
  const k = await key(db);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    k,
    new TextEncoder().encode(JSON.stringify(record.payload)),
  );
  const stored: StoredRecord = {
    id: record.id,
    kind: record.kind,
    userId: record.userId,
    createdAt: record.createdAt,
    iv,
    data,
  };
  await tx(db, OUTBOX, "readwrite", (s) => s.put(stored));
}

export async function pending<T>(kind: string, userId: string): Promise<OutboxRecord<T>[]> {
  if (!isOutboxSupported()) return [];
  const db = await open();
  const all = await tx<StoredRecord[]>(db, OUTBOX, "readonly", (s) => s.getAll());
  const mine = all.filter((r) => r.kind === kind && r.userId === userId).sort((a, b) => a.createdAt - b.createdAt);
  if (!mine.length) return [];
  const k = await key(db);
  return Promise.all(
    mine.map(async (r) => {
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: r.iv as Uint8Array<ArrayBuffer> }, k, r.data);
      return {
        id: r.id,
        kind: r.kind,
        userId: r.userId,
        createdAt: r.createdAt,
        payload: JSON.parse(new TextDecoder().decode(plain)) as T,
      };
    }),
  );
}

export async function remove(id: string): Promise<void> {
  const db = await open();
  await tx(db, OUTBOX, "readwrite", (s) => s.delete(id));
}
