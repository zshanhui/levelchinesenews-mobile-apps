/**
 * On-device saved words (study list) via SQLite.
 *
 * Status is per unique surface form; each word has ≥1 example sentence snapshot.
 * No backend. Datetime columns store Unix epoch milliseconds (INTEGER).
 */

import {
  beginLearnedWordsLoad,
  commitLearnedWords,
} from './learnedWordsCache';
import {
  getLocalDatabase,
  userSavedWordExamplesTableName,
  userSavedWordsTableName,
} from './localDatabase';
import { randomUUID } from './uuid';

const WORDS = userSavedWordsTableName;
const EXAMPLES = userSavedWordExamplesTableName;

export type WordStatus = 'studying' | 'learned';

export type SavedWordOccurrence = {
  word: string;
  pinyin: string | null;
  articleId: string;
  pidx: number;
  sidx: number;
  widx: number;
  sentenceText: string;
};

export type SavedWordListItem = {
  id: string;
  word: string;
  pinyin: string | null;
  status: WordStatus;
  createdAt: number;
  updatedAt: number;
};

interface WordRow {
  id: string;
  word: string;
  pinyin: string | null;
  status: WordStatus;
  created_at: number;
  updated_at: number;
}

function rowToListItem(row: WordRow): SavedWordListItem {
  return {
    id: row.id,
    word: row.word,
    pinyin: row.pinyin,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function insertWordAndExample(
  db: Awaited<ReturnType<typeof getLocalDatabase>>,
  occurrence: SavedWordOccurrence,
  status: WordStatus,
): Promise<void> {
  const now = Date.now();
  const wordId = randomUUID();
  const exampleId = randomUUID();
  await db.runAsync(
    `INSERT INTO ${WORDS} (id, word, pinyin, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    wordId,
    occurrence.word,
    occurrence.pinyin,
    status,
    now,
    now,
  );
  await db.runAsync(
    `INSERT INTO ${EXAMPLES} (
       id, word_id, article_id, pidx, sidx, widx, sentence_text, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    exampleId,
    wordId,
    occurrence.articleId,
    occurrence.pidx,
    occurrence.sidx,
    occurrence.widx,
    occurrence.sentenceText,
    now,
  );
}

/** Learned surface forms only — used to build the reader hide Set. */
export async function listLearnedSurfaces(): Promise<string[]> {
  const db = await getLocalDatabase();
  const rows = await db.getAllAsync<{ word: string }>(
    `SELECT word FROM ${WORDS} WHERE status = ?`,
    'learned',
  );
  return (rows ?? []).map((row) => row.word);
}

/** Reload the in-memory learned Set from SQLite. Last call wins if several overlap. */
export async function refreshLearnedWordsCache(): Promise<void> {
  const generation = beginLearnedWordsLoad();
  const words = await listLearnedSurfaces();
  commitLearnedWords(words, generation);
}

async function syncLearnedWordsCache(): Promise<void> {
  try {
    await refreshLearnedWordsCache();
  } catch {
    // Hide-set is best-effort; the next article open reloads from SQLite.
  }
}

/** Insert as studying + example. No-op if the word already exists. */
export async function saveWord(occurrence: SavedWordOccurrence): Promise<void> {
  const db = await getLocalDatabase();
  await db.withTransactionAsync(async () => {
    const existing = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM ${WORDS} WHERE word = ?`,
      occurrence.word,
    );
    if (existing) return;
    await insertWordAndExample(db, occurrence, 'studying');
  });
}

/**
 * New word → learned + example. Studying → learned (no new example).
 * Already learned → no-op.
 */
export async function markLearned(occurrence: SavedWordOccurrence): Promise<void> {
  const db = await getLocalDatabase();
  await db.withTransactionAsync(async () => {
    const existing = await db.getFirstAsync<WordRow>(
      `SELECT id, word, pinyin, status, created_at, updated_at FROM ${WORDS} WHERE word = ?`,
      occurrence.word,
    );
    if (!existing) {
      await insertWordAndExample(db, occurrence, 'learned');
      return;
    }
    if (existing.status === 'learned') return;
    await db.runAsync(
      `UPDATE ${WORDS} SET status = ?, updated_at = ? WHERE id = ?`,
      'learned',
      Date.now(),
      existing.id,
    );
  });
  await syncLearnedWordsCache();
}

export async function setWordStatus(
  wordId: string,
  status: WordStatus,
): Promise<void> {
  const db = await getLocalDatabase();
  await db.runAsync(
    `UPDATE ${WORDS} SET status = ?, updated_at = ? WHERE id = ?`,
    status,
    Date.now(),
    wordId,
  );
  await syncLearnedWordsCache();
}

/** Deletes the word and its examples. */
export async function removeWord(wordId: string): Promise<void> {
  const db = await getLocalDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM ${EXAMPLES} WHERE word_id = ?`, wordId);
    await db.runAsync(`DELETE FROM ${WORDS} WHERE id = ?`, wordId);
  });
  await syncLearnedWordsCache();
}

/** Deletes by exact surface form. No-op if the word is not saved. */
export async function removeWordBySurface(word: string): Promise<void> {
  const db = await getLocalDatabase();
  await db.withTransactionAsync(async () => {
    const row = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM ${WORDS} WHERE word = ?`,
      word,
    );
    if (!row) return;
    await db.runAsync(`DELETE FROM ${EXAMPLES} WHERE word_id = ?`, row.id);
    await db.runAsync(`DELETE FROM ${WORDS} WHERE id = ?`, row.id);
  });
  await syncLearnedWordsCache();
}

/** Deletes one example; deletes the word too if it was the last example. */
export async function removeExample(exampleId: string): Promise<void> {
  const db = await getLocalDatabase();
  await db.withTransactionAsync(async () => {
    const row = await db.getFirstAsync<{ word_id: string }>(
      `SELECT word_id FROM ${EXAMPLES} WHERE id = ?`,
      exampleId,
    );
    if (!row) return;
    await db.runAsync(`DELETE FROM ${EXAMPLES} WHERE id = ?`, exampleId);
    const countRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM ${EXAMPLES} WHERE word_id = ?`,
      row.word_id,
    );
    if ((countRow?.count ?? 0) === 0) {
      await db.runAsync(`DELETE FROM ${WORDS} WHERE id = ?`, row.word_id);
    }
  });
  await syncLearnedWordsCache();
}

export async function listWords(opts?: {
  status?: WordStatus;
}): Promise<SavedWordListItem[]> {
  const db = await getLocalDatabase();
  const rows =
    opts?.status != null
      ? await db.getAllAsync<WordRow>(
        `SELECT id, word, pinyin, status, created_at, updated_at
           FROM ${WORDS} WHERE status = ? ORDER BY updated_at DESC`,
        opts.status,
      )
      : await db.getAllAsync<WordRow>(
        `SELECT id, word, pinyin, status, created_at, updated_at
           FROM ${WORDS} ORDER BY updated_at DESC`,
      );
  return (rows ?? []).map(rowToListItem);
}

/** First stored example for a word (sentence snapshot + article location), or null. */
export type SavedWordExample = {
  articleId: string;
  pidx: number;
  sidx: number;
  widx: number;
  sentenceText: string;
};

export async function getFirstExampleSentence(
  wordId: string,
): Promise<SavedWordExample | null> {
  const db = await getLocalDatabase();
  const row = await db.getFirstAsync<{
    article_id: string;
    pidx: number;
    sidx: number;
    widx: number;
    sentence_text: string;
  }>(
    `SELECT article_id, pidx, sidx, widx, sentence_text
       FROM ${EXAMPLES} WHERE word_id = ? ORDER BY created_at ASC LIMIT 1`,
    wordId,
  );
  if (!row) return null;
  return {
    articleId: row.article_id,
    pidx: row.pidx,
    sidx: row.sidx,
    widx: row.widx,
    sentenceText: row.sentence_text,
  };
}

/** Lookup for the reader later: only the requested surface forms. */
export async function getWordStatusMap(
  words: string[],
): Promise<Map<string, WordStatus>> {
  const out = new Map<string, WordStatus>();
  const unique = [...new Set(words)];
  if (unique.length === 0) return out;

  const db = await getLocalDatabase();
  const placeholders = unique.map(() => '?').join(',');
  const rows = await db.getAllAsync<{ word: string; status: WordStatus }>(
    `SELECT word, status FROM ${WORDS} WHERE word IN (${placeholders})`,
    ...unique,
  );
  for (const row of rows ?? []) {
    out.set(row.word, row.status);
  }
  return out;
}
