/**
 * Web: no SQLite — avoids bundling expo-sqlite / wa-sqlite.wasm. Mirrors
 * `localDatabase` exports with safe no-ops and in-memory / localStorage fallbacks
 * where the app still needs a stable value (e.g. installation id).
 */
import { randomUUID } from './uuid';

export const userSavedArticlesTableName = 'user_saved_articles';
export const articleDetailCacheTableName = 'article_detail_cache';
export const userProfileTableName = 'userprofile';

const webMockDb = {
  getFirstAsync: async <T>(): Promise<T | null> => null,
  runAsync: async () => {},
  execAsync: async () => {},
  closeAsync: async () => {},
  withExclusiveTransactionAsync: async (fn: (txn: typeof webMockDb) => Promise<void>) => {
    await fn(webMockDb);
  },
} as const;

let _db: typeof webMockDb | null = null;

export async function getLocalDatabase() {
  if (!_db) {
    _db = webMockDb;
  }
  return _db;
}

export async function closeLocalDatabase() {
  _db = null;
}

export interface DictEntry {
  id: string;
  simplified: string;
  traditional: string;
  pinyin: string;
  definitions: string;
}

export interface UserProfile {
  id: string;
  installation_id: string;
  created_at: number;
  updated_at: number;
}

export async function insertDictEntry(_entry: DictEntry) {
  return randomUUID();
}

export async function getDictEntryByWord(_chineseWord: string) {
  return null;
}

export async function dropLcnDictTable() {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function migrateLocalDatabaseIfNeeded(_db: any) {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runMigrations(_db: any) {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ensureLcnDictTableExists(_db: any) {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createLcnDictIndexes(_db: any) {}

export async function checkIfLcnDictExist() {
  return false;
}

export async function getTotalLcnDictEntriesCount(): Promise<number> {
  return 0;
}

export async function getRandomDictEntry(): Promise<DictEntry | null> {
  return null;
}

export async function getRandomProverbOrChengyuEntry(): Promise<DictEntry | null> {
  return null;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  return null;
}

/** Web: no anonymous install id — native-only for monitoring / settings. */
export async function getOrCreateInstallationId(): Promise<string> {
  return '';
}
