import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchStopwords, getUserFriendlyErrorMessage } from './api';
import { isStopwordsCacheStale, loadCachedStopwords, saveCachedStopwords } from './stopwordsCache';

/**
 * App-level stopwords from `GET /api/v1/config/stopwords` with AsyncStorage
 * offline caching. Cached words are applied immediately on mount; the remote
 * API is refetched at most once per day (only when the cache is missing or
 * older than `STOP_WORDS_CACHE_TTL_MS`). A failed refetch silently keeps the
 * cached list.
 */
export function useStopwords() {
  const [words, setWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await loadCachedStopwords();
      if (cancelled) return;
      if (cached) {
        setWords(cached.words);
        setUsingCache(true);
      }

      if (cached && !isStopwordsCacheStale(cached)) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchStopwords();
        if (cancelled) return;
        setWords(data.stopwords);
        setUsingCache(false);
        setError(null);
        saveCachedStopwords(data.stopwords).catch(() => {});
      } catch (err) {
        if (cancelled) return;
        // Only surface an error when nothing (cached or otherwise) is available.
        if (!cached) {
          setError(getUserFriendlyErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Memoized Set for O(1) membership checks; identity stable per `words`. */
  const stopwordsSet = useMemo(() => new Set(words), [words]);

  const isStopWord = useCallback(
    (word: string) => (word ? stopwordsSet.has(word) : false),
    [stopwordsSet],
  );

  return {
    /** Raw stopword strings; empty until cache/remote resolves. */
    stopwords: words,
    stopwordsSet,
    isStopWord,
    loading,
    /** Set only when no words are available (no cache + fetch failed). */
    error,
    /** True when the current list came from the offline cache. */
    usingCache,
  };
}
