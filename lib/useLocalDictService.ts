
/*
  This service is used to fetch dictionary entries from the local database.
  - DownloadUpdateLocalDictFromRemote - download the dictionary from blob storage (Supabase) url and loads the local database
  - resets the local dict with updated entries
  - fetch dictionary entries for the current article
*/

import { gunzip, gunzipSync } from "fflate";
import * as database from "./localDatabase";

const REMOTE_DICT_URL = 'https://<project>.supabase.co/storage/v1/object/public/<SUPABASE_DICT_BUCKET>/cedict.json'

export async function fetchDictEntryByWord(chineseWord: string) {
  if (chineseWord === '' || !chineseWord) return null;
  try {
    const dictEntry = await database.getDictEntryByWord(chineseWord);
    return dictEntry;
  } catch {
    // TODO we can log this or offer the user to report as missing entry
    console.error(`local db error or not entry found for ${chineseWord}`);
    return null;
  }
}

export async function checkIfLocalDictTableExists(): Promise<boolean> {
  const db = await database.getLocalDatabase();
  return false;
}

export interface CompactRemoteDictEntry {
  t: string; // traditional
  s: string; // simplified
  p: string; // pinyin
  d: string[]; // definitions
}

export async function firstLoadLocalDictFromRemote(
  remoteDictUrl: string = REMOTE_DICT_URL,
  onProgress?: (pct: number) => void): Promise<number> {
  const entries = await downloadLocalDictFromRemoteServer(remoteDictUrl)

  // lcndict assumed to not exist or already dropped if resetting with `resetLocalDict()`
  const exist = await database.checkIfLcnDictExist()
  if (!exist) return 0;

  // batch insert downloaded entries
  const perBatch = 100;
  const placeholders = Array(perBatch).fill('(?,?,?,?,?)').join(',');
  const sql = `INSERT INTO lcndict (id, simplified, traditional, pinyin, definitions) VALUES ${placeholders}`

  const local = await database.getLocalDatabase()
  await local.withExclusiveTransactionAsync(async (txn) => {
    for (let i = 0; i < entries.length; i += perBatch) {
      const batch = entries.slice(i, i + perBatch);
      const params = batch.flatMap(ent => [
        crypto.randomUUID(),
        ent.s,
        ent.t,
        ent.p,
        // map from raw ce-dict compact format
        Array.isArray(ent.d) ? ent.d.join('; ') : String(ent.d ?? '')
      ]);
      await txn.runAsync(sql, params);
      // console.log('dry run: ', sql, params)
      onProgress?.(Math.min(100, (i + batch.length) / entries.length * 100));
      if (i % 10000 === 0 && i > 0) {
        await new Promise(r => setTimeout(r, 0)); // yield
      }
    }
  })

  console.log(`total entries: ${entries.length}`)
  // get total count of dict entries from DB and compare with entries to ensure correctness
  const totalInsertedCount = await database.getTotalLcnDictEntriesCount()
  console.log(`total inserted: ${totalInsertedCount}`)
  return totalInsertedCount;
}

export async function downloadLocalDictFromRemoteServer(remoteDictUrl: string): Promise<CompactRemoteDictEntry[]> {
  const resp = await fetch(remoteDictUrl)
  if (!resp.ok) {
    throw new Error(`failed to fetch dict: ${resp.status} ${resp.statusText}`)
  }

  const buff = await resp.arrayBuffer()
  const compressed = new Uint8Array(buff)
  const decomp = gunzipSync(compressed)
  const dictTextContext = new TextDecoder().decode(decomp)
  const parsedEntries: CompactRemoteDictEntry[] = JSON.parse(dictTextContext);
  console.log(`number of parsed entries: ${parsedEntries.length}`)

  return parsedEntries
}

export async function resetLocalDict() {
  throw new Error('Not implemented');
}

export async function reportMissingDictEntries(chineseWord: string, context: string) {
  /* reports words from article that do not appear in the standard cedict entries
    so we can build up an extended dict with additional definitions over time
  */
  throw new Error('Not implemented');
}
