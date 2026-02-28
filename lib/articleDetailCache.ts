import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ArticleDetail } from './types';

export const ARTICLE_DETAILS_CACHE_KEY = 'ARTICLE_DETAILS_CACHE';
export const MAX_CACHED_ARTICLE_DETAILS = 100;

export interface CachedArticleDetail {
  article: ArticleDetail;
  cachedAt: string;
}

type CacheMap = Record<string, CachedArticleDetail>;

export async function loadArticleDetail(
  id: string,
): Promise<CachedArticleDetail | null> {
  try {
    const raw = await AsyncStorage.getItem(ARTICLE_DETAILS_CACHE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as CacheMap;
    const entry = map[id];
    if (!entry?.article?.id || !entry.cachedAt) return null;
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
    const raw = await AsyncStorage.getItem(ARTICLE_DETAILS_CACHE_KEY);
    const map: CacheMap = raw ? (JSON.parse(raw) as CacheMap) : {};
    const cachedAt = new Date().toISOString();
    map[id] = { article, cachedAt };

    const ids = Object.keys(map);
    if (ids.length > MAX_CACHED_ARTICLE_DETAILS) {
      const byAge = ids
        .map((k) => ({ id: k, cachedAt: map[k].cachedAt }))
        .sort((a, b) => a.cachedAt.localeCompare(b.cachedAt));
      const toRemove = byAge.slice(0, ids.length - MAX_CACHED_ARTICLE_DETAILS);
      toRemove.forEach(({ id: removedId }) => delete map[removedId]);
    }

    await AsyncStorage.setItem(
      ARTICLE_DETAILS_CACHE_KEY,
      JSON.stringify(map),
    );
  } catch {
    // Ignore cache write failures
  }
}
