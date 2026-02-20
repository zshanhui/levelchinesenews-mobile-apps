import { useCallback, useEffect, useState } from 'react';
import { apiUrl, fetchWithTimeout } from './api';
import type { ArticleDetail } from './types';

// Seed article details for local dev when API is unavailable
const seedArticleDetails: Record<string, ArticleDetail> = require('../assets/seed-article-details.json');

export function useArticle(id: string | undefined) {
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArticle = useCallback(async () => {
    if (!id) {
      setArticle(null);
      setError('No article ID');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = apiUrl(`/articles/${id}`);
      const data = await fetchWithTimeout<ArticleDetail>(url, 3000);
      setArticle(data);
    } catch {
      // Fall back to seed data for local dev when no network
      const seed = seedArticleDetails[id];
      if (seed) {
        setArticle(seed);
      } else {
        setError('Article not found');
        setArticle(null);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  return { article, loading, error, refetch: fetchArticle };
}
