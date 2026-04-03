
/*
  This service is used to fetch dictionary entries from the local database.
  - DownloadUpdateLocalDictFromRemote - download the dictionary from blob storage (Supabase) url and loads the local database
  - resets the local dict with updated entries
  - fetch dictionary entries for the current article
*/

import { gunzipSync } from "fflate";
import * as database from "./localDatabase";
import { envConfig } from "./api";
import { sentryCaptureException } from "./monitoring";
import { randomUUID } from "./uuid";

export async function fetchDictEntryByWord(chineseWord: string) {
  if (chineseWord === '' || !chineseWord) return null;
  try {
    const dictEntry = await database.getDictEntryByWord(chineseWord);
    return dictEntry;
  } catch (err) {
    // TODO we can log this or offer the user to report as missing entry
    console.warn(`Dict lookup warning for "${chineseWord}":`, err);
    return null;
  }
}

export async function checkIfLocalDictTableExists(): Promise<boolean> {
  return database.checkIfLcnDictExist();

}

export interface CompactRemoteDictEntry {
  t: string; // traditional
  s: string; // simplified
  p: string; // pinyin
  d: string[]; // definitions
}

export type ProgressCallback = (pct: number, loaded?: number, total?: number) => void;

function captureLocalDictException(
  exception: unknown,
  stage: 'download' | 'reset' | 'delete',
  extra?: Record<string, unknown>,
) {
  sentryCaptureException(
    exception instanceof Error ? exception : new Error(String(exception)),
    {
      level: 'error',
      tags: {
        feature: 'local_dict',
        stage,
      },
      contexts: {
        local_dict: {
          remote_dict_url: envConfig.remoteBaseChineseEnglishDictUrl ?? '(not set)',
          ...extra,
        },
      },
    },
  );
}

async function bulkInsertDictEntries(
  sqliteDb: Awaited<ReturnType<typeof database.getLocalDatabase>>,
  entries: CompactRemoteDictEntry[],
  onProgress?: ProgressCallback
) {
  const perBatch = 500;
  await sqliteDb.withExclusiveTransactionAsync(async (txn) => {
    for (let i = 0; i < entries.length; i += perBatch) {
      const batch = entries.slice(i, i + perBatch);
      const placeholders = Array(batch.length).fill('(?,?,?,?,?)').join(',');
      const sql = `INSERT INTO lcndict (id, simplified, traditional, pinyin, definitions) VALUES ${placeholders}`;
      const params = batch.flatMap(ent => [
        randomUUID(),
        ent.s,
        ent.t,
        ent.p,
        // map from raw ce-dict compact format
        Array.isArray(ent.d) ? ent.d.join('; ') : String(ent.d ?? '')
      ]);
      await txn.runAsync(sql, params);
      const loaded = i + batch.length;
      onProgress?.(35 + (loaded / entries.length) * 65, loaded, entries.length);
      if (i % 10000 === 0 && i > 0) {
        await new Promise(r => setTimeout(r, 0)); // yield
      }
    }
  });
}

export async function firstLoadLocalDictFromRemote(
  remoteDictUrl: string = envConfig.remoteBaseChineseEnglishDictUrl,
  onProgress?: ProgressCallback
): Promise<{ totalEntries: number, totalInsertedCount: number } | null> {
  try {
    onProgress?.(0, 0, undefined)
    const entries = await downloadLocalDictFromRemoteServer(remoteDictUrl)
    onProgress?.(35, 0, entries.length) // download completed, progress at 35%

    // lcndict assumed to not exist or already dropped if resetting with `resetLocalDict()`
    let sqliteDb = await database.getLocalDatabase()
    const exist = await database.checkIfLcnDictExist()
    if (!exist) {
      await database.ensureLcnDictTableExists(sqliteDb)
    }
    // Re-acquire after potential reconnect during table setup.
    sqliteDb = await database.getLocalDatabase()

    try {
      await bulkInsertDictEntries(sqliteDb, entries, onProgress);
    } catch (insertErr) {
      console.warn('bulk insert failed once, reconnecting and retrying:', insertErr);
      await database.closeLocalDatabase();
      sqliteDb = await database.getLocalDatabase();
      await database.ensureLcnDictTableExists(sqliteDb);
      await bulkInsertDictEntries(sqliteDb, entries, onProgress);
    }
    // creating indexes after bulk inserts for better performance
    await database.createLcnDictIndexes(sqliteDb)

    // get total count of dict entries from DB and compare with entries to ensure correctness
    const totalInsertedCount = await database.getTotalLcnDictEntriesCount()
    console.log(`total entries: ${entries.length}`)
    console.log(`total inserted: ${totalInsertedCount}`)

    onProgress?.(100, entries.length, entries.length)
    return {
      totalEntries: entries.length,
      totalInsertedCount,
    }
  } catch (err) {
    console.error('error during first load of dict from remote: ', err)
    captureLocalDictException(err, 'download', {
      requested_remote_dict_url: remoteDictUrl ?? '(not set)',
    });
    // potentially reset the dict to fix corrupt state?
    return null
  }
}

export async function downloadLocalDictFromRemoteServer(remoteDictUrl: string): Promise<CompactRemoteDictEntry[]> {
  const resp = await fetch(remoteDictUrl)
  if (!resp.ok) {
    throw new Error(`failed to fetch dict: ${resp.status} ${resp.statusText}`)
  }

  try {
    const buff = await resp.arrayBuffer()
    const compressed = new Uint8Array(buff)
    const decomp = gunzipSync(compressed)
    const dictTextContext = new TextDecoder().decode(decomp)
    const parsedEntries: CompactRemoteDictEntry[] = JSON.parse(dictTextContext);
    console.info(`number of parsed entries: ${parsedEntries.length}`)

    return parsedEntries
  } catch (err) {
    const hint = err instanceof SyntaxError ? 'invalid JSON' :
      err instanceof Error && err.message.includes('gzip') ? 'corrupt gzip' : 'parse error';
    throw new Error(`
      Failed to parse dictionary from remote: ${hint}. 
      ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function deleteLocalDict(): Promise<number> {
  try {
    await database.dropLcnDictTable()
    return 1;
  } catch (err) {
    console.warn('Error while deleting local dict table:', err)
    captureLocalDictException(err, 'delete');
    throw err;
  }
}

export async function resetLocalDict() {
  await deleteLocalDict()
  const sqliteDb = await database.getLocalDatabase()
  await database.ensureLcnDictTableExists(sqliteDb)
  return 1;
}

export async function reportMissingDictEntries(chineseWord: string, context: string) {
  /* reports words from article that do not appear in the standard cedict entries
    so we can build up an extended dict with additional definitions over time
  */
  throw new Error('Not implemented');
}
