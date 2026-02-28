import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ArticleListItem } from './types';

export const ARTICLE_LIST_CACHE_KEY = 'ARTICLE_LIST_CACHE';
export const MAX_CACHED_ARTICLES = 100;

export interface CachedArticleList {
  items: ArticleListItem[];
  total: number;
  page_size: number;
  cachedAt: string;
}

/** Deduplicate items by id, preserving first occurrence order. */
export function dedupeById(items: ArticleListItem[]): ArticleListItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export async function loadCachedList(): Promise<CachedArticleList | null> {
  try {
    const raw = await AsyncStorage.getItem(ARTICLE_LIST_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedArticleList;
    if (!parsed?.items?.length || !parsed.cachedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveCachedList(
  items: ArticleListItem[],
  total: number,
  pageSize: number,
): Promise<void> {
  const deduped = dedupeById(items);
  const capped = deduped.slice(0, MAX_CACHED_ARTICLES);
  const payload: CachedArticleList = {
    items: capped,
    total,
    page_size: pageSize,
    cachedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(ARTICLE_LIST_CACHE_KEY, JSON.stringify(payload));
}
