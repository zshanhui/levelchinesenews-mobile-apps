import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY_STOP_WORDS, STOP_WORDS_CACHE_TTL_MS } from './constants';

export interface CachedStopwords {
  words: string[];
  cachedAt: string;
}

/** Deduplicate words, preserving first occurrence order. */
export function dedupeWords(words: string[]): string[] {
  return [...new Set(words)];
}

export async function loadCachedStopwords(): Promise<CachedStopwords | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_STOP_WORDS);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedStopwords;
    if (!parsed?.words?.length || !parsed.cachedAt) return null;
    if (!parsed.words.every((w) => typeof w === 'string' && w.length > 0)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveCachedStopwords(words: string[]): Promise<void> {
  const payload: CachedStopwords = {
    words: dedupeWords(words),
    cachedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEY_STOP_WORDS, JSON.stringify(payload));
}

/** True when the cache is older than STOP_WORDS_CACHE_TTL_MS (or has an unparseable date). */
export function isStopwordsCacheStale(cached: CachedStopwords, now: number = Date.now()): boolean {
  const cachedAtMs = new Date(cached.cachedAt).getTime();
  if (Number.isNaN(cachedAtMs)) return true;
  return now - cachedAtMs >= STOP_WORDS_CACHE_TTL_MS;
}
