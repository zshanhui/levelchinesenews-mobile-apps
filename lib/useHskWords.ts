import { fetchHskWords } from './api';
import {
  isValidHskWordsMap,
  loadCachedHskWords,
  saveCachedHskWords,
} from './hskWordsCache';
import { useCallback, useEffect, useState } from 'react';

/**
 * Return the cached HSK index, downloading once if it has never been stored.
 * Does not refetch when a cache already exists.
 */
export async function loadOrDownloadHskWords(): Promise<Record<string, number> | null> {
  const cached = await loadCachedHskWords();
  if (cached) {
    return cached.words;
  }

  try {
    const data = await fetchHskWords();
    if (!isValidHskWordsMap(data.words)) {
      throw new Error('invalid HSK words payload');
    }
    await saveCachedHskWords(data.words);
    return data.words;
  } catch {
    return null;
  }
}

/**
 * Read the on-device HSK index (no network). Empty until the hide-HSK toggle
 * has downloaded the list once.
 */
export function useHskWords() {
  const [words, setWords] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await loadCachedHskWords();
      if (cancelled) return;
      if (cached) setWords(cached.words);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getHskLevel = useCallback(
    (word: string): number | null => {
      if (!word) return null;
      const level = words[word];
      return typeof level === 'number' ? level : null;
    },
    [words],
  );

  return {
    hskWords: words,
    getHskLevel,
    loading,
  };
}
