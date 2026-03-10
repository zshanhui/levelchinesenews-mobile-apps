import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from './i18n';
import { apiReadUrl, fetchWithTimeout, getUserFriendlyErrorMessage } from './api';
import { ARTICLE_REQUEST_TIMEOUT_MS } from './constants';
import {
  loadArticleDetail,
  saveArticleDetail,
} from './articleDetailCache';
import type { ArticleDetail } from './types';

// Seed article details for local dev when API is unavailable
const seedArticleDetails: Record<string, ArticleDetail> = require('../assets/seed-article-details.json');

export function useArticle(id: string | undefined) {
  const { t } = useTranslation();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [usingSeed, setUsingSeed] = useState(false);

  const fetchArticle = useCallback(async () => {
    if (!id) {
      setArticle(null);
      setError('No article ID');
      setUsingCache(false);
      setCachedAt(null);
      setUsingSeed(false);
      return;
    }
    setLoading(true);
    setError(null);

    const cached = await loadArticleDetail(id);
    if (cached) {
      setArticle(cached.article);
      setUsingCache(true);
      setCachedAt(cached.cachedAt);
      setUsingSeed(false);
      setLoading(false);
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
      setUsingSeed(false);
      saveArticleDetail(id, data).catch(() => { });
    } catch (err) {
      const seed = seedArticleDetails[id];
      if (seed) {
        setArticle(seed);
        setUsingCache(false);
        setCachedAt(null);
        setUsingSeed(true);
      } else {
        setError(getUserFriendlyErrorMessage(err, t('articleNotFound')));
        setArticle(null);
        setUsingCache(false);
        setCachedAt(null);
        setUsingSeed(false);
      }
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
    usingSeed,
    refetch: fetchArticle,
  };
}
