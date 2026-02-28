import { useCallback, useState } from 'react';
import { apiUrl, fetchWithTimeout } from './api';
import type { ArticleListItem, ArticleListResponse } from './types';

const PAGE_SIZE = 15;
const REQUEST_TIMEOUT_MS = 8000;

// Seed data for local dev when API is unavailable
const seedData: ArticleListResponse = require('../assets/seed-articles.json');

function getSeedPage(pageNum: number): ArticleListResponse {
  const start = (pageNum - 1) * PAGE_SIZE;
  const pageItems = seedData.items.slice(start, start + PAGE_SIZE);
  return {
    items: pageItems,
    total: seedData.total,
    page: pageNum,
    page_size: PAGE_SIZE,
  };
}

export function useArticles() {
  const [items, setItems] = useState<ArticleListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingSeed, setUsingSeed] = useState(false);

  const hasMore = items.length < total;

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      const url = apiUrl('/articles', {
        page: pageNum,
        page_size: PAGE_SIZE,
        order_by: 'published_date',
        order_desc: true,
      });
      try {
        const data = await fetchWithTimeout<ArticleListResponse>(
          url,
          REQUEST_TIMEOUT_MS,
        );
        setUsingSeed(false);
        if (append) {
          setItems((prev) => [...prev, ...data.items]);
        } else {
          setItems(data.items);
        }
        setTotal(data.total);
        setPage(data.page);
        return data;
      } catch {
        const data = getSeedPage(pageNum);
        setUsingSeed(true);
        if (append) {
          setItems((prev) => [...prev, ...data.items]);
        } else {
          setItems(data.items);
        }
        setTotal(data.total);
        setPage(data.page);
        return data;
      }
    },
    [],
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchPage(1, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await fetchPage(1, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    setError(null);
    try {
      await fetchPage(page + 1, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loading, loadingMore, page]);

  return {
    items,
    total,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    usingSeed,
    loadInitial,
    refresh,
    loadMore,
  };
}
