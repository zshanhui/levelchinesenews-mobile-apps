import * as SQLite from 'expo-sqlite';
import { randomUUID } from './uuid';

const LOCAL_DATABASE_NAME = 'lcnlocal';
const lcnDictTableName = 'lcndict';

let _db: SQLite.SQLiteDatabase | null = null;

async function openFreshDatabase() {
  _db = await SQLite.openDatabaseAsync(LOCAL_DATABASE_NAME);
  return _db;
}

async function isDatabaseConnectionHealthy(db: SQLite.SQLiteDatabase): Promise<boolean> {
  try {
    await db.getFirstAsync<{ ok: number }>('SELECT 1 AS ok');
    return true;
  } catch {
    return false;
  }
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
  if (!_db) {
    return openFreshDatabase();
  }

  const healthy = await isDatabaseConnectionHealthy(_db);
  if (healthy) return _db;

  try {
    await _db.closeAsync();
  } catch {
    // noop: best-effort close before reopening
  }
  return openFreshDatabase();
}

export async function closeLocalDatabase() {
  if (_db) {
    await _db.closeAsync()
    _db = null
  }
}

export interface DictEntry {
  id: string;
  simplified: string;
  traditional: string;
  pinyin: string;
  definitions: string;
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

export async function getDictEntryByWord(chineseWord: string) {
  // chineseWord is either simplified or traditional
  const db = await getLocalDatabase()
  const result = await db.getFirstAsync<DictEntry>(`SELECT * FROM ${lcnDictTableName} WHERE simplified = ? OR traditional = ?`, [chineseWord, chineseWord])
  return result
}

export async function dropLcnDictTable() {
  await execWithReconnectRetry(`DROP TABLE IF EXISTS ${lcnDictTableName}`)
}

export async function migrateLocalDatabaseIfNeeded(db: SQLite.SQLiteDatabase) {
  const DATABASE_VERSION = 1;
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  )
  const currentDbVersion = result?.user_version ?? 0;
  if (currentDbVersion >= DATABASE_VERSION) return;

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
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
