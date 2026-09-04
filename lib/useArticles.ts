import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from './i18n';
import { apiReadUrl, envConfig, fetchWithTimeout, getUserFriendlyErrorMessage } from './api';
import { ARTICLE_REQUEST_TIMEOUT_MS, PAGE_SIZE } from './constants';
import {
  dedupeById,
  loadCachedList,
  paginationFromCachedCount,
  saveCachedList,
  updateCachedArticle,
} from './articleListCache';
import {
  articleLengthBounds,
  type ArticleLengthBucket,
} from './articleLength';
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

function isFilteredList(
  tagsFilter: string[] | null | undefined,
  lengthFilter: ArticleLengthBucket | null | undefined,
  simplified: boolean,
): boolean {
  return isActiveTopicFilter(tagsFilter) || lengthFilter != null || simplified;
}

function listQueryKey(
  tagsFilter: string[] | null | undefined,
  lengthFilter: ArticleLengthBucket | null | undefined,
  simplified: boolean,
): string | null {
  const tags =
    isActiveTopicFilter(tagsFilter) && tagsFilter
      ? tagsFilter.join('\0')
      : '';
  const length = lengthFilter ?? '';
  const simp = simplified ? '1' : '';
  if (!tags && !length && !simp) return null;
  return `${tags}|${length}|${simp}`;
}

/**
 * Paginated `GET /articles` list. Pass `tagsFilter` (topic tag strings) to add `?tags=…` (OR).
 * Pass `lengthFilter` to add `min_words` / `max_words`.
 * Pass `simplified` for `?simplified=1` (L4/L5 simplified feed).
 * Topic/length/simplified filtering uses the same `orderBy` / `order_by` as the main list.
 * Offline list cache is used only for the **main** list (no topic, length, or simplified filter).
 */
export function useArticles(
  tagsFilter: string[] | null = null,
  lengthFilter: ArticleLengthBucket | null = null,
  simplified = false,
) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ArticleListItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPageLen, setLastPageLen] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [orderBy, setOrderByState] = useState<ArticleListOrderBy>('published_date');
  const [sortReloading, setSortReloading] = useState(false);
  const orderByRef = useRef<ArticleListOrderBy>('published_date');
  const tagsFilterRef = useRef(tagsFilter);
  const lengthFilterRef = useRef(lengthFilter);
  const simplifiedRef = useRef(simplified);
  /** `undefined` = effect never ran; then stable key `null` | string for list query identity. */
  const listQueryKeyRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    tagsFilterRef.current = tagsFilter;
  }, [tagsFilter]);

  useEffect(() => {
    lengthFilterRef.current = lengthFilter;
  }, [lengthFilter]);

  useEffect(() => {
    simplifiedRef.current = simplified;
  }, [simplified]);

  const itemsRef = useRef<ArticleListItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const hasMore = lastPageLen === PAGE_SIZE;

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    const filtered = isFilteredList(
      tagsFilterRef.current,
      lengthFilterRef.current,
      simplifiedRef.current,
    );
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
    if (lengthFilterRef.current) {
      const bounds = articleLengthBounds(lengthFilterRef.current);
      params.min_words = bounds.minWords;
      if (bounds.maxWords != null) {
        params.max_words = bounds.maxWords;
      }
    }
    if (simplifiedRef.current) {
      params.simplified = '1';
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
      if (!filtered) {
        saveCachedList(deduped, PAGE_SIZE).catch(() => {});
      }
      return data;
    } catch (err) {
      if (
        isFilteredList(
          tagsFilterRef.current,
          lengthFilterRef.current,
          simplifiedRef.current,
        )
      ) {
        throw err;
      }
      const cached = await loadCachedList();
      if (cached && cached.items.length > 0) {
        setUsingCache(true);
        setCachedAt(cached.cachedAt);
        setItems(cached.items);
        const { lastPageLen: cachedLastPageLen, page: cachedPage } =
          paginationFromCachedCount(cached.items.length, PAGE_SIZE);
        setLastPageLen(cachedLastPageLen);
        setPage(cachedPage);
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
    setError(null);
    let hasItems = itemsRef.current.length > 0;
    if (
      !hasItems &&
      !isFilteredList(
        tagsFilterRef.current,
        lengthFilterRef.current,
        simplifiedRef.current,
      )
    ) {
      const cached = await loadCachedList();
      if (cached && cached.items.length > 0) {
        setUsingCache(true);
        setCachedAt(cached.cachedAt);
        setItems(cached.items);
        const { lastPageLen: cachedLastPageLen, page: cachedPage } =
          paginationFromCachedCount(cached.items.length, PAGE_SIZE);
        setLastPageLen(cachedLastPageLen);
        setPage(cachedPage);
        itemsRef.current = cached.items;
        hasItems = true;
        setLoading(false);
      }
    }
    if (!hasItems) {
      setLoading(true);
    }
    try {
      await fetchPage(1, false);
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err, t('failedToLoadArticles')));
      if (!hasItems) {
        setItems([]);
        setLastPageLen(0);
        setPage(1);
        setUsingCache(false);
        setCachedAt(null);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchPage, t]);

  useEffect(() => {
    const key = listQueryKey(tagsFilter, lengthFilter, simplified);
    const prevKey = listQueryKeyRef.current;

    if (prevKey === undefined) {
      listQueryKeyRef.current = key;
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

    listQueryKeyRef.current = key;
    setItems([]);
    setLastPageLen(0);
    setUsingCache(false);
    setCachedAt(null);
    void loadInitial();
  }, [tagsFilter, lengthFilter, simplified, loadInitial]);

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
    if (
      !isFilteredList(
        tagsFilterRef.current,
        lengthFilterRef.current,
        simplifiedRef.current,
      )
    ) {
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
