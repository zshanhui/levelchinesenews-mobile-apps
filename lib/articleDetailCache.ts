import {
  getLocalDatabase,
  articleDetailCacheTableName,
} from './localDatabase';
import { MAX_CACHED_ARTICLE_DETAILS } from './constants';
import type { ArticleDetail } from './types';

export const ARTICLE_DETAILS_CACHE_KEY = 'ARTICLE_DETAILS_CACHE';
export { MAX_CACHED_ARTICLE_DETAILS };

export interface CachedArticleDetail {
  article: ArticleDetail;
  cachedAt: string;
}

interface CacheRow {
  id: string;
  payload: string;
  cached_at: number;
}

function parsePayload(raw: string | null): CachedArticleDetail | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { article?: unknown; cachedAt?: string };
    if (!parsed?.article || typeof parsed.article !== 'object') return null;
    const article = parsed.article as ArticleDetail;
    if (!article?.id || typeof article.id !== 'string') return null;
    const cachedAt = typeof parsed.cachedAt === 'string' ? parsed.cachedAt : null;
    if (!cachedAt) return null;
    return { article, cachedAt };
  } catch {
    return null;
  }
}

async function evictOldestIfNeeded(db: Awaited<ReturnType<typeof getLocalDatabase>>): Promise<void> {
  const countRow = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM ${articleDetailCacheTableName}`
  );
  const count = countRow?.cnt ?? 0;
  if (count <= MAX_CACHED_ARTICLE_DETAILS) return;

  const toRemove = count - MAX_CACHED_ARTICLE_DETAILS;
  await db.runAsync(
    `DELETE FROM ${articleDetailCacheTableName} WHERE id IN (
      SELECT id FROM ${articleDetailCacheTableName} ORDER BY cached_at ASC LIMIT ?
    )`,
    toRemove
  );
}

export async function loadArticleDetail(
  id: string,
): Promise<CachedArticleDetail | null> {
  try {
    const db = await getLocalDatabase();
    const row = await db.getFirstAsync<CacheRow>(
      `SELECT id, payload, cached_at FROM ${articleDetailCacheTableName} WHERE id = ?`,
      id
    );
    if (!row?.payload) return null;
    const entry = parsePayload(row.payload);
    if (!entry) return null;
    entry.cachedAt = new Date(row.cached_at).toISOString();
    return entry;
  } catch {
    return null;
  }
}

export async function saveArticleDetail(
  id: string,
  article: ArticleDetail,
): Promise<void> {
  try {
    const db = await getLocalDatabase();
    const cachedAt = Date.now();
    const payload = JSON.stringify({
      article,
      cachedAt: new Date(cachedAt).toISOString(),
    });
    await db.runAsync(
      `INSERT INTO ${articleDetailCacheTableName} (id, payload, cached_at)
       VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, cached_at = excluded.cached_at`,
      id,
      payload,
      cachedAt
    );
    await evictOldestIfNeeded(db);
  } catch {
    // Ignore cache write failures
  }
}
