import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ZingoDBSchema extends DBSchema {
  phrases: {
    key: string;
    value: {
      id: string;
      text: string;
      variants?: string[];
      weight: number;
      category: string;
      lang: string;
      tags?: string[];
      hits: number;
      syncedAt: number;
    };
    indexes: { 'by-category': string; 'by-weight': number };
  };
  cards: {
    key: string;
    value: {
      id: string;
      name: string;
      size: number;
      phrases: string[];
      isPreset: boolean;
      createdAt: number;
    };
  };
  sessions: {
    key: string;
    value: {
      id: string;
      cardId: string;
      marked: Record<string, number>;
      startedAt: number;
      completedAt?: number;
      platform: string;
      bingoLines?: string[];
    };
    indexes: { 'by-card': string };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: unknown;
    };
  };
  pendingEvents: {
    key: string;
    value: {
      id: string;
      phraseId: string;
      category: string;
      platform: string;
      anonHash: string;
      userId?: string;
      timestamp: number;
      source: 'manual' | 'speech' | 'text';
      retries: number;
    };
  };
}

let dbInstance: IDBPDatabase<ZingoDBSchema> | null = null;

export async function getDB(): Promise<IDBPDatabase<ZingoDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ZingoDBSchema>('zingo', 1, {
    upgrade(db) {
      const phraseStore = db.createObjectStore('phrases', { keyPath: 'id' });
      phraseStore.createIndex('by-category', 'category');
      phraseStore.createIndex('by-weight', 'weight');

      db.createObjectStore('cards', { keyPath: 'id' });

      const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
      sessionStore.createIndex('by-card', 'cardId');

      db.createObjectStore('settings', { keyPath: 'key' });

      const pendingStore = db.createObjectStore('pendingEvents', { keyPath: 'id' });
      pendingStore.createIndex('by-timestamp', 'timestamp');
    },
  });

  return dbInstance;
}

export async function closeDB() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const db = await getDB();
  const record = await db.get('settings', key);
  return record ? (record.value as T) : defaultValue;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}