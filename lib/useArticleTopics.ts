import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from './i18n';
import { apiReadUrl, fetchWithTimeout, getUserFriendlyErrorMessage } from './api';
import { ARTICLE_REQUEST_TIMEOUT_MS } from './constants';
import type { ArticleTopicsResponse } from './types';

/** Fetches preset article topic → tag mappings (`GET /articles/topics`). */
export function useArticleTopics() {
  const { t } = useTranslation();
  const [data, setData] = useState<ArticleTopicsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = apiReadUrl('/articles/topics');
      const res = await fetchWithTimeout<ArticleTopicsResponse>(
        url,
        ARTICLE_REQUEST_TIMEOUT_MS,
      );
      setData(res);
    } catch (err) {
      setData(null);
      setError(getUserFriendlyErrorMessage(err, t('somethingWentWrong')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchTopics();
  }, [fetchTopics]);

  return {
    /** Raw response; null before first success or after a failed fetch. */
    data,
    /** Convenience: `data?.topics` */
    topics: data?.topics ?? null,
    loading,
    error,
    refetch: fetchTopics,
  };
}
