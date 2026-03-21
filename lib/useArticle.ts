import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from './i18n';
import { apiReadUrl, fetchWithTimeout, getUserFriendlyErrorMessage } from './api';
import {
  ARTICLE_DETAIL_CACHE_TTL_MS,
  ARTICLE_REQUEST_TIMEOUT_MS,
} from './constants';
import {
  loadArticleDetail,
  saveArticleDetail,
} from './articleDetailCache';
import type { ArticleDetail } from './types';

function isCacheFresh(cachedAt: string): boolean {
  const age = Date.now() - new Date(cachedAt).getTime();
  return age < ARTICLE_DETAIL_CACHE_TTL_MS && age >= 0;
}

export function useArticle(id: string | undefined) {
  const { t } = useTranslation();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  const fetchArticle = useCallback(async () => {
    if (!id) {
      setArticle(null);
      setError('No article ID');
      setUsingCache(false);
      setCachedAt(null);
      return;
    }
    setLoading(true);
    setError(null);

    const cached = await loadArticleDetail(id);
    if (cached) {
      setArticle(cached.article);
      setUsingCache(true);
      setCachedAt(cached.cachedAt);
      setLoading(false);

      if (isCacheFresh(cached.cachedAt)) {
        return;
      }

      try {
        const url = apiReadUrl(`/articles/${id}`);
        const data = await fetchWithTimeout<ArticleDetail>(url, ARTICLE_REQUEST_TIMEOUT_MS);
        setArticle(data);
        setUsingCache(false);
        setCachedAt(null);
        saveArticleDetail(id, data).catch(() => { });
      } catch {
        // Keep showing cached data on network failure
      }
      return;
    }

    try {
      const url = apiReadUrl(`/articles/${id}`);
      const data = await fetchWithTimeout<ArticleDetail>(url, ARTICLE_REQUEST_TIMEOUT_MS);
      setArticle(data);
      setUsingCache(false);
      setCachedAt(null);
      saveArticleDetail(id, data).catch(() => { });
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err, t('articleNotFound')));
      setArticle(null);
      setUsingCache(false);
      setCachedAt(null);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  return {
    article,
    loading,
    error,
    usingCache,
    cachedAt,
    refetch: fetchArticle,
  };
}
