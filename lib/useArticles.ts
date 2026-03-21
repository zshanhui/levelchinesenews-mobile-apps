import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from './i18n';
import { apiReadUrl, fetchWithTimeout, getUserFriendlyErrorMessage } from './api';
import { ARTICLE_REQUEST_TIMEOUT_MS, PAGE_SIZE } from './constants';
import {
  dedupeById,
  loadCachedList,
  saveCachedList,
  updateCachedArticle,
} from './articleListCache';
import type { ArticleListItem, ArticleListResponse } from './types';

export function useArticles() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ArticleListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  const itemsRef = useRef<ArticleListItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const hasMore = items.length < total;

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      const url = apiReadUrl('/articles', {
        page: pageNum,
        page_size: PAGE_SIZE,
        order_by: 'published_date',
        order_desc: true,
      });
      try {
        const data = await fetchWithTimeout<ArticleListResponse>(
          url,
          ARTICLE_REQUEST_TIMEOUT_MS,
        );
        setUsingCache(false);
        setCachedAt(null);
        const newItems = append
          ? [...itemsRef.current, ...data.items]
          : data.items;
        const deduped = dedupeById(newItems);
        setItems(append ? deduped : data.items);
        setTotal(data.total);
        setPage(data.page);
        saveCachedList(deduped, data.total, PAGE_SIZE).catch(() => {});
        return data;
      } catch {
        const cached = await loadCachedList();
        if (cached && cached.items.length > 0) {
          setUsingCache(true);
          setCachedAt(cached.cachedAt);
          setItems(cached.items);
          setTotal(cached.total);
          setPage(Math.ceil(cached.items.length / PAGE_SIZE) || 1);
          return {
            items: cached.items,
            total: cached.total,
            page: 1,
            page_size: PAGE_SIZE,
          } as ArticleListResponse;
        }
        throw new Error('No network and no cache');
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
      setError(getUserFriendlyErrorMessage(err, t('failedToLoadArticles')));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [fetchPage, t]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await fetchPage(1, false);
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err, t('failedToRefresh')));
    } finally {
      setRefreshing(false);
    }
  }, [fetchPage, t]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    setError(null);
    try {
      await fetchPage(page + 1, true);
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err, t('failedToLoadMore')));
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loading, loadingMore, page, t]);

  const updateArticle = useCallback((id: string, patch: Partial<ArticleListItem>) => {
    setItems((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
    updateCachedArticle(id, patch).catch(() => {});
  }, []);

  return {
    items,
    total,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    usingCache,
    cachedAt,
    loadInitial,
    refresh,
    loadMore,
    updateArticle,
  };
}
