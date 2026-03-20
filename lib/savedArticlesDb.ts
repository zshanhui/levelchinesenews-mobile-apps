/**
 * Saved "my articles" persistence via SQLite.
 * Native only — saved articles + read status are not available on web.
 * All exports no-op when Platform.OS === 'web'.
 *
 * Rows include parsed articles and any article marked read from the public feed
 * (see upsertArticleMarkedRead).
 *
 * Article list payload is stored as JSON in `article_list_item` (SQLite TEXT).
 * Datetime columns store Unix epoch milliseconds (INTEGER).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  getLocalDatabase,
  userSavedArticlesTableName,
} from './localDatabase';
import { STORAGE_KEY_ARTICLES } from './constants';
import type { ArticleDetail, ArticleListItem } from './types';

const TABLE = userSavedArticlesTableName;

interface UserSavedArticleRow {
  id: string;
  article_list_item: string;
  saved_datetime: number;
  marked_read_datetime: number | null;
  sentence_bookmarked: string | null;
}

function parseArticleListItemJson(raw: string | null): ArticleListItem | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Partial<ArticleListItem>;
    if (!o || typeof o.id !== 'string') return null;
    return {
      id: o.id,
      title: typeof o.title === 'string' ? o.title : '',
      source: o.source ?? null,
      source_url: o.source_url ?? null,
      main_image: o.main_image ?? null,
      published_date: o.published_date ?? null,
      tags: Array.isArray(o.tags) ? o.tags.map(String) : [],
      title_translated_en: o.title_translated_en ?? null,
      summary_generated_en: o.summary_generated_en ?? null,
      created_at: typeof o.created_at === 'string' ? o.created_at : '',
      updated_at: typeof o.updated_at === 'string' ? o.updated_at : '',
    };
  } catch {
    return null;
  }
}

async function guardWeb(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  return false;
}

export interface SavedArticleWithMeta {
  item: ArticleListItem;
  read: boolean;
}

/** List all saved articles, newest first, with read state. */
export async function listSavedArticles(): Promise<SavedArticleWithMeta[]> {
  if (await guardWeb()) return [];
  const db = await getLocalDatabase();
  const rows = await db.getAllAsync<UserSavedArticleRow>(
    `SELECT * FROM ${TABLE} ORDER BY saved_datetime DESC`
  );
  const out: SavedArticleWithMeta[] = [];
  for (const row of rows) {
    const item = parseArticleListItemJson(row.article_list_item);
    if (!item) continue;
    out.push({
      item,
      read: row.marked_read_datetime != null,
    });
  }
  return out;
}

/** Insert or update a saved article. On conflict, preserve saved_datetime, marked_read_datetime, sentence_bookmarked. */
export async function upsertSavedArticle(item: ArticleListItem): Promise<void> {
  if (await guardWeb()) return;
  const db = await getLocalDatabase();
  const savedDatetime = Date.now();
  const json = JSON.stringify(item);

  await db.runAsync(
    `
    INSERT INTO ${TABLE} (
      id, article_list_item, saved_datetime, marked_read_datetime, sentence_bookmarked
    ) VALUES (?, ?, ?, NULL, NULL)
    ON CONFLICT(id) DO UPDATE SET
      article_list_item = excluded.article_list_item
    `,
    item.id,
    json,
    savedDatetime
  );
}

/** Remove an article from "my articles" (deletes the row). */
export async function removeSavedArticle(articleId: string): Promise<void> {
  if (await guardWeb()) return;
  const db = await getLocalDatabase();
  await db.runAsync(`DELETE FROM ${TABLE} WHERE id = ?`, articleId);
}

/** Strip detail-only fields for JSON storage as a list row. */
export function articleDetailToListItem(article: ArticleDetail): ArticleListItem {
  return {
    id: article.id,
    title: article.title,
    source: article.source,
    source_url: article.source_url,
    main_image: article.main_image,
    published_date: article.published_date,
    tags: article.tags ?? [],
    title_translated_en: article.title_translated_en,
    summary_generated_en: article.summary_generated_en,
    created_at: article.created_at,
    updated_at: article.updated_at,
  };
}

/**
 * Mark an article read and ensure it appears in "my articles".
 * Inserts a new row (e.g. from public feed) or updates list JSON + read time on conflict.
 */
export async function upsertArticleMarkedRead(item: ArticleListItem): Promise<void> {
  if (await guardWeb()) return;
  const db = await getLocalDatabase();
  const now = Date.now();
  const json = JSON.stringify(item);
  await db.runAsync(
    `
    INSERT INTO ${TABLE} (
      id, article_list_item, saved_datetime, marked_read_datetime, sentence_bookmarked
    ) VALUES (?, ?, ?, ?, NULL)
    ON CONFLICT(id) DO UPDATE SET
      article_list_item = excluded.article_list_item,
      marked_read_datetime = excluded.marked_read_datetime
    `,
    item.id,
    json,
    now,
    now
  );
}

/** Set read/finished state for an article. */
export async function setRead(articleId: string, read: boolean): Promise<void> {
  if (await guardWeb()) return;
  const db = await getLocalDatabase();
  const markedRead = read ? Date.now() : null;
  await db.runAsync(
    `UPDATE ${TABLE} SET marked_read_datetime = ? WHERE id = ?`,
    markedRead,
    articleId
  );
}

/** Bookmark a sentence in a saved article. Replaces any existing bookmark. */
export async function bookmarkArticleSentence(
  articleId: string,
  indexes: [number, number]
): Promise<void> {
  if (await guardWeb()) return;
  const db = await getLocalDatabase();
  const bookmarkJson = JSON.stringify(indexes);
  await db.runAsync(
    `UPDATE ${TABLE} SET sentence_bookmarked = ? WHERE id = ?`,
    bookmarkJson,
    articleId
  );
}

/** Check if an article is in the saved list. */
export async function isSavedArticle(articleId: string): Promise<boolean> {
  if (await guardWeb()) return false;
  const db = await getLocalDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT 1 AS count FROM ${TABLE} WHERE id = ?`,
    articleId
  );
  return row != null;
}

/** Whether the article has been marked read. */
export async function getReadState(articleId: string): Promise<boolean> {
  if (await guardWeb()) return false;
  const db = await getLocalDatabase();
  const row = await db.getFirstAsync<{ marked_read_datetime: number | null }>(
    `SELECT marked_read_datetime FROM ${TABLE} WHERE id = ?`,
    articleId
  );
  return row?.marked_read_datetime != null;
}

/** Read flags for many ids in one query (e.g. article feed list). */
export async function getReadStatesForArticleIds(
  ids: string[],
): Promise<Map<string, boolean>> {
  const out = new Map<string, boolean>();
  if (await guardWeb() || ids.length === 0) return out;

  const unique = [...new Set(ids)];
  for (const id of unique) {
    out.set(id, false);
  }

  const db = await getLocalDatabase();
  const placeholders = unique.map(() => '?').join(',');
  const rows = await db.getAllAsync<{
    id: string;
    marked_read_datetime: number | null;
  }>(
    `SELECT id, marked_read_datetime FROM ${TABLE} WHERE id IN (${placeholders})`,
    ...unique
  );
  for (const row of rows) {
    out.set(row.id, row.marked_read_datetime != null);
  }
  return out;
}

/** One-time migration from AsyncStorage. Call after table exists. */
export async function migrateFromAsyncStorageIfNeeded(): Promise<void> {
  if (await guardWeb()) return;
  const raw = await AsyncStorage.getItem(STORAGE_KEY_ARTICLES);
  if (!raw) return;

  let items: unknown[];
  try {
    items = JSON.parse(raw);
    if (!Array.isArray(items)) return;
  } catch {
    return;
  }

  const db = await getLocalDatabase();
  const now = Date.now();

  await db.withTransactionAsync(async () => {
    for (let i = 0; i < items.length; i++) {
      const obj = items[i];
      if (!obj || typeof obj !== 'object' || !('id' in obj)) continue;
      const item = obj as ArticleListItem;
      const savedDatetime = now - i;

      try {
        await db.runAsync(
          `
          INSERT INTO ${TABLE} (
            id, article_list_item, saved_datetime, marked_read_datetime, sentence_bookmarked
          ) VALUES (?, ?, ?, NULL, NULL)
          ON CONFLICT(id) DO NOTHING
          `,
          item.id,
          JSON.stringify(item),
          savedDatetime
        );
      } catch {
        // skip malformed rows
      }
    }
  });

  await AsyncStorage.removeItem(STORAGE_KEY_ARTICLES);
}
