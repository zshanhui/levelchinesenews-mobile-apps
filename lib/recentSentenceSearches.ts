import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MAX_RECENT_SENTENCE_SEARCHES,
  STORAGE_KEY_RECENT_SENTENCE_SEARCHES,
} from './constants';
import { isChineseWord } from './text-utils';

export async function loadRecentSentenceSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_RECENT_SENTENCE_SEARCHES);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((w): w is string => typeof w === 'string' && isChineseWord(w))
      .slice(0, MAX_RECENT_SENTENCE_SEARCHES);
  } catch {
    return [];
  }
}

/** Prepend `word` to recent searches (deduped), capped at max. */
export async function rememberSentenceSearch(word: string): Promise<string[]> {
  const trimmed = word.trim();
  if (!isChineseWord(trimmed)) {
    return loadRecentSentenceSearches();
  }

  const existing = await loadRecentSentenceSearches();
  const next = [
    trimmed,
    ...existing.filter((w) => w !== trimmed),
  ].slice(0, MAX_RECENT_SENTENCE_SEARCHES);

  try {
    await AsyncStorage.setItem(
      STORAGE_KEY_RECENT_SENTENCE_SEARCHES,
      JSON.stringify(next),
    );
  } catch {
    // ignore persistence failures
  }
  return next;
}
