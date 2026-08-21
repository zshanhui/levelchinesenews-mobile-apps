import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from './i18n';
import { apiReadUrl, envConfig, fetchWithTimeout, getUserFriendlyErrorMessage } from './api';
import { ARTICLE_REQUEST_TIMEOUT_MS, PAGE_SIZE } from './constants';
import {
  dedupeById,
  loadCachedList,
  saveCachedList,
  updateCachedArticle,
} from './articleListCache';
import type {
  ArticleListItem,
  ArticleListOrderBy,
  ArticleListResponse,
} from './types';

function tagsQueryParam(tags: string[] | null | undefined): string | undefined {
  if (!tags?.length) return undefined;
  return tags.join(',');
}

function isActiveTopicFilter(tagsFilter: string[] | null | undefined): boolean {
  return Array.isArray(tagsFilter) && tagsFilter.length > 0;
}

/**
 * Paginated `GET /articles` list. Pass `tagsFilter` (topic tag strings) to add `?tags=…` (OR).
 * Topic filtering uses the same `orderBy` / `order_by` as the main list (e.g. Created At).
 * Offline list cache is used only for the **main** list (no topic filter); topic results are
 * never written to or read from that cache.
 */
export function useArticles(tagsFilter: string[] | null = null) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ArticleListItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPageLen, setLastPageLen] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [orderBy, setOrderByState] = useState<ArticleListOrderBy>('published_date');
  const [sortReloading, setSortReloading] = useState(false);
  const orderByRef = useRef<ArticleListOrderBy>('published_date');
  const tagsFilterRef = useRef(tagsFilter);
  /** `undefined` = effect never ran; then stable key `null` | string for topic identity. */
  const tagsFilterKeyRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    tagsFilterRef.current = tagsFilter;
  }, [tagsFilter]);

  const itemsRef = useRef<ArticleListItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const hasMore = lastPageLen === PAGE_SIZE;

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    const topicActive = isActiveTopicFilter(tagsFilterRef.current);
    const tags = tagsQueryParam(tagsFilterRef.current);
    const params: Record<string, string | number | boolean> = {
      page: pageNum,
      page_size: PAGE_SIZE,
      order_by: orderByRef.current,
      order_desc: true,
    };
    if (tags) {
      params.tags = tags;
    }
    const url = apiReadUrl('/articles', params);
    const headers: Record<string, string> = {};
    if (envConfig.tempAdminAccessWriteKey) {
      headers['X-Admin-Key'] = envConfig.tempAdminAccessWriteKey;
    }
    try {
      const data = await fetchWithTimeout<ArticleListResponse>(
        url,
        ARTICLE_REQUEST_TIMEOUT_MS,
        Object.keys(headers).length ? headers : undefined,
      );
      setUsingCache(false);
      setCachedAt(null);
      const newItems = append
        ? [...itemsRef.current, ...data.items]
        : data.items;
      const deduped = dedupeById(newItems);
      setItems(append ? deduped : data.items);
      setLastPageLen(data.items.length);
      setPage(data.page);
      if (!topicActive) {
        saveCachedList(deduped, PAGE_SIZE).catch(() => {});
      }
      return data;
    } catch (err) {
      if (isActiveTopicFilter(tagsFilterRef.current)) {
        throw err;
      }
      const cached = await loadCachedList();
      if (cached && cached.items.length > 0) {
        setUsingCache(true);
        setCachedAt(cached.cachedAt);
        setItems(cached.items);
        const remainder = cached.items.length % PAGE_SIZE;
        setLastPageLen(remainder === 0 ? PAGE_SIZE : remainder);
        setPage(Math.ceil(cached.items.length / PAGE_SIZE) || 1);
        return {
          items: cached.items,
          page: 1,
          page_size: PAGE_SIZE,
        } as ArticleListResponse;
      }
      throw new Error('No network and no cache');
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchPage(1, false);
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err, t('failedToLoadArticles')));
      setItems([]);
      setLastPageLen(0);
      setPage(1);
      setUsingCache(false);
      setCachedAt(null);
    } finally {
      setLoading(false);
    }
  }, [fetchPage, t]);

  useEffect(() => {
    // Stable string for "which topic filter is active": join tags with \0 so we never
    // merge distinct tag lists into the same key (commas could appear inside a tag).
    const key = isActiveTopicFilter(tagsFilter) && tagsFilter
      ? tagsFilter.join('\0')
      : null;
    const prevKey = tagsFilterKeyRef.current;

    if (prevKey === undefined) {
      tagsFilterKeyRef.current = key;
      if (key !== null) {
        setItems([]);
        setLastPageLen(0);
        setUsingCache(false);
        setCachedAt(null);
        void loadInitial();
      }
      return;
    }

    if (prevKey === key) {
      return;
    }

    tagsFilterKeyRef.current = key;
    setItems([]);
    setLastPageLen(0);
    setUsingCache(false);
    setCachedAt(null);
    void loadInitial();
  }, [tagsFilter, loadInitial]);

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

  const setOrderBy = useCallback(
    async (next: ArticleListOrderBy) => {
      if (next === orderByRef.current) return;
      orderByRef.current = next;
      setOrderByState(next);
      setLoading(true);
      setSortReloading(true);
      setError(null);
      try {
        await fetchPage(1, false);
      } catch (err) {
        setError(getUserFriendlyErrorMessage(err, t('failedToLoadArticles')));
        setItems([]);
      } finally {
        setLoading(false);
        setSortReloading(false);
      }
    },
    [fetchPage, t],
  );

  const updateArticle = useCallback((id: string, patch: Partial<ArticleListItem>) => {
    setItems((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
    if (!isActiveTopicFilter(tagsFilterRef.current)) {
      updateCachedArticle(id, patch).catch(() => {});
    }
  }, []);

  return {
    items,
    orderBy,
    setOrderBy,
    sortReloading,
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
