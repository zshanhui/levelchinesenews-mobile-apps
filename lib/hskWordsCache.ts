import AsyncStorage from '@react-native-async-storage/async-storage';
import { HSK_WORDS_CACHE_TTL_MS, STORAGE_KEY_HSK_WORDS } from './constants';

export interface CachedHskWords {
  words: Record<string, number>;
  cachedAt: string;
}

const HSK_LEVEL_MIN = 1;
const HSK_LEVEL_MAX = 7;

export function isValidHskWordsMap(words: unknown): words is Record<string, number> {
  if (!words || typeof words !== 'object' || Array.isArray(words)) return false;
  const entries = Object.entries(words);
  if (entries.length === 0) return false;
  return entries.every(
    ([word, level]) =>
      word.length > 0 &&
      typeof level === 'number' &&
      Number.isInteger(level) &&
      level >= HSK_LEVEL_MIN &&
      level <= HSK_LEVEL_MAX,
  );
}

export async function loadCachedHskWords(): Promise<CachedHskWords | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_HSK_WORDS);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedHskWords;
    if (!parsed?.cachedAt || !isValidHskWordsMap(parsed.words)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveCachedHskWords(words: Record<string, number>): Promise<void> {
  if (!isValidHskWordsMap(words)) {
    throw new Error('invalid HSK words map');
  }
  const payload: CachedHskWords = {
    words,
    cachedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEY_HSK_WORDS, JSON.stringify(payload));
}

/** True when the cache is older than HSK_WORDS_CACHE_TTL_MS (or has an unparseable date). */
export function isHskWordsCacheStale(
  cached: CachedHskWords,
  now: number = Date.now(),
): boolean {
  const cachedAtMs = new Date(cached.cachedAt).getTime();
  if (Number.isNaN(cachedAtMs)) return true;
  return now - cachedAtMs >= HSK_WORDS_CACHE_TTL_MS;
}
