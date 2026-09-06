import * as SQLite from 'expo-sqlite';
import { randomUUID } from './uuid';

const LOCAL_DATABASE_NAME = 'lcnlocal';
const lcnDictTableName = 'lcndict';
export const userSavedArticlesTableName = 'user_saved_articles';
export const articleDetailCacheTableName = 'article_detail_cache';
export const userProfileTableName = 'userprofile';
export const userSavedWordsTableName = 'user_saved_words';
export const userSavedWordExamplesTableName = 'user_saved_word_examples';

/** Highest PRAGMA user_version this build applies. Additive only — never drop user tables. */
export const LOCAL_SCHEMA_VERSION = 5;

let _db: SQLite.SQLiteDatabase | null = null;
let _opening: Promise<SQLite.SQLiteDatabase> | null = null;

async function openFreshDatabase() {
  const db = await SQLite.openDatabaseAsync(LOCAL_DATABASE_NAME);
  await runMigrations(db);
  _db = db;
  return db;
}

async function execWithReconnectRetry(
  sql: string,
  db?: SQLite.SQLiteDatabase
) {
  const currentDb = db ?? await getLocalDatabase();
  try {
    await currentDb.execAsync(sql);
  } catch (err) {
    console.warn('SQLite exec failed, reconnecting and retrying once:', err);
    try {
      await closeLocalDatabase();
    } catch {
      // noop: best-effort close before reopening
    }
    const freshDb = await getLocalDatabase();
    await freshDb.execAsync(sql);
  }
}

export async function getLocalDatabase() {
  if (_opening) return _opening;
  if (_db) return _db;

  _opening = openFreshDatabase().catch((err) => {
    _db = null;
    throw err;
  }).finally(() => {
    _opening = null;
  });
  return _opening;
}

export async function closeLocalDatabase() {
  const db = _db;
  _db = null;
  _opening = null;
  if (db) {
    await db.closeAsync();
  }
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

export async function insertDictEntry(entry: DictEntry) {
  const db = await getLocalDatabase();
  const id = randomUUID();
  await db.runAsync(
    `
      INSERT INTO ${lcnDictTableName} (id, simplified, traditional, pinyin, definitions)
      VALUES (?, ?, ?, ?, ?)
    `,
    id, entry.simplified, entry.traditional, entry.pinyin, entry.definitions
  );
  return id;
}

export async function getDictEntriesByWord(chineseWord: string): Promise<DictEntry[]> {
  // chineseWord is either simplified or traditional. Returns ALL matching rows —
  // polyphonic words (e.g. 行 hang2/xing2) have multiple CEDICT entries — ordered
  // by rowid so the original dataset order is preserved.
  const db = await getLocalDatabase()
  const result = await db.getAllAsync<DictEntry>(`SELECT * FROM ${lcnDictTableName} WHERE simplified = ? OR traditional = ? ORDER BY rowid`, [chineseWord, chineseWord])
  return result ?? []
}

export async function dropLcnDictTable() {
  await execWithReconnectRetry(`DROP TABLE IF EXISTS ${lcnDictTableName}`)
}

export async function migrateLocalDatabaseIfNeeded(db: SQLite.SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentDbVersion = result?.user_version ?? 0;
  if (currentDbVersion >= LOCAL_SCHEMA_VERSION) return;
  await runMigrations(db);
}

/** Runs all migrations; called on DB open. Idempotent. */
export async function runMigrations(db: SQLite.SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const current = result?.user_version ?? 0;

  if (current < 1) {
    await db.execAsync('PRAGMA user_version = 1');
  }

  // user_saved_articles: single migration (feature not shipped before this schema).
  if (current < 2) {
    await execWithReconnectRetry(`
      CREATE TABLE IF NOT EXISTS ${userSavedArticlesTableName} (
        id TEXT PRIMARY KEY,
        article_list_item TEXT NOT NULL,
        saved_datetime INTEGER NOT NULL,
        marked_read_datetime INTEGER,
        sentence_bookmarked TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_user_saved_articles_saved_datetime ON ${userSavedArticlesTableName} (saved_datetime DESC);
    `, db);
    await db.execAsync('PRAGMA user_version = 2');
  }

  // article_detail_cache: SQLite-backed article detail cache for scaling.
  if (current < 3) {
    await execWithReconnectRetry(`
      CREATE TABLE IF NOT EXISTS ${articleDetailCacheTableName} (
        id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        cached_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_article_detail_cache_cached_at ON ${articleDetailCacheTableName} (cached_at ASC);
    `, db);
    await db.execAsync('PRAGMA user_version = 3');
  }

  if (current < 4) {
    await execWithReconnectRetry(`
      CREATE TABLE IF NOT EXISTS ${userProfileTableName} (
        id TEXT PRIMARY KEY,
        installation_id TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `, db);
    await db.execAsync('PRAGMA user_version = 4');
  }

  // user_saved_words + examples: on-device study list (no backend).
  if (current < 5) {
    await execWithReconnectRetry(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS ${userSavedWordsTableName} (
        id TEXT PRIMARY KEY,
        word TEXT NOT NULL UNIQUE,
        pinyin TEXT,
        status TEXT NOT NULL CHECK (status IN ('studying', 'learned')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_user_saved_words_status ON ${userSavedWordsTableName} (status);
      CREATE INDEX IF NOT EXISTS idx_user_saved_words_created_at ON ${userSavedWordsTableName} (created_at DESC);
      CREATE TABLE IF NOT EXISTS ${userSavedWordExamplesTableName} (
        id TEXT PRIMARY KEY,
        word_id TEXT NOT NULL REFERENCES ${userSavedWordsTableName}(id) ON DELETE CASCADE,
        article_id TEXT NOT NULL,
        pidx INTEGER NOT NULL,
        sidx INTEGER NOT NULL,
        widx INTEGER NOT NULL,
        sentence_text TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE (article_id, pidx, sidx, widx)
      );
      CREATE INDEX IF NOT EXISTS idx_user_saved_word_examples_word_id ON ${userSavedWordExamplesTableName} (word_id);
    `, db);
    await db.execAsync('PRAGMA user_version = 5');
  }

  await db.execAsync('PRAGMA foreign_keys = ON');
}

export async function ensureLcnDictTableExists(db: SQLite.SQLiteDatabase) {
  await execWithReconnectRetry(`
    CREATE TABLE IF NOT EXISTS ${lcnDictTableName} (
      id TEXT PRIMARY KEY,
      simplified TEXT NOT NULL,
      traditional TEXT NOT NULL,
      pinyin TEXT NOT NULL DEFAULT '',
      definitions TEXT NOT NULL DEFAULT ''
    );
  `, db)
}

export async function createLcnDictIndexes(db: SQLite.SQLiteDatabase) {
  await execWithReconnectRetry(`
    CREATE INDEX IF NOT EXISTS idx_lcndict_simplified ON ${lcnDictTableName} (simplified);
    CREATE INDEX IF NOT EXISTS idx_lcndict_traditional ON ${lcnDictTableName} (traditional);
  `, db);
}

export async function checkIfLcnDictExist() {
  try {
    const db = await getLocalDatabase()
    const tableExists = await db.getFirstAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type= 'table' AND name=?`, [lcnDictTableName]
    )
    return tableExists !== null
  } catch (err) {
    console.warn('checkIfLcnDictExist warning:', err);
    return false;
  }
}

export async function getTotalLcnDictEntriesCount(): Promise<number> {
  try {
    const exists = await checkIfLcnDictExist();
    if (!exists) return 0;

    const db = await getLocalDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM ${lcnDictTableName}`
    );
    return result?.count ?? 0;
  } catch (err) {
    console.warn('getTotalLcnDictEntriesCount warning:', err);
    return 0;
  }
}

export async function getRandomDictEntry(): Promise<DictEntry | null> {
  const exists = await checkIfLcnDictExist();
  if (!exists) return null;

  const db = await getLocalDatabase();
  const result = await db.getFirstAsync<DictEntry>(
    `SELECT * FROM ${lcnDictTableName} ORDER BY RANDOM() LIMIT 1`
  );
  return result ?? null;
}

export async function getRandomProverbOrChengyuEntry(): Promise<DictEntry | null> {
  const exists = await checkIfLcnDictExist();
  if (!exists) return null;

  const db = await getLocalDatabase();
  const result = await db.getFirstAsync<DictEntry>(
    `SELECT * FROM ${lcnDictTableName}
     WHERE simplified GLOB '????*'
     ORDER BY RANDOM()
     LIMIT 1`
  );
  return result ?? null;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const db = await getLocalDatabase();
  const result = await db.getFirstAsync<UserProfile>(
    `SELECT * FROM ${userProfileTableName} ORDER BY created_at ASC LIMIT 1`
  );
  return result ?? null;
}

export async function getOrCreateInstallationId(): Promise<string> {
  const db = await getLocalDatabase();
  const existingProfile = await db.getFirstAsync<UserProfile>(
    `SELECT * FROM ${userProfileTableName} ORDER BY created_at ASC LIMIT 1`
  );
  if (existingProfile?.installation_id) {
    return existingProfile.installation_id;
  }

  const installationId = randomUUID();
  const now = Date.now();
  await db.runAsync(
    `
      INSERT OR IGNORE INTO ${userProfileTableName} (id, installation_id, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `,
    'local',
    installationId,
    now,
    now
  );
  const insertedProfile = await db.getFirstAsync<UserProfile>(
    `SELECT * FROM ${userProfileTableName} WHERE id = ? LIMIT 1`,
    ['local']
  );
  return insertedProfile?.installation_id ?? installationId;
}
