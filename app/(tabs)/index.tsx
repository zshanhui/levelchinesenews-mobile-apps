import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { generateArticleSummary } from '../../lib/api';
import type { ArticleListItem } from '../../lib/types';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArticleListFilterShelve } from '../../lib/components/ArticleListFilterShelve';
import { ArticleListSkeleton } from '../../lib/components/ArticleListSkeleton';
import { CacheIndicator } from '../../lib/components/CacheIndicator';
import { ArticleCard } from '../../lib/components/ArticleCard';
import { getReadStatesForArticleIds } from '../../lib/savedArticlesDb';
import { useFont } from '../../lib/FontContext';
import { useArticles } from '../../lib/useArticles';
import type { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';

const translationInFlight = new Map<string, Promise<ArticleListItem | null>>();

export default function ArticlesScreen() {
  const { theme } = useTheme();
  const { fancyDisplayFontStyle } = useFont();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [topicFilterTags, setTopicFilterTags] = useState<string[] | null>(null);
  const [activeTopicKey, setActiveTopicKey] = useState<string | null>(null);
  const topicCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
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
  } = useArticles(topicFilterTags);

  const [readByArticleId, setReadByArticleId] = useState<Record<string, boolean>>(
    {},
  );
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const openFilterSheet = useCallback(() => {
    setFilterSheetOpen(true);
  }, []);

  const closeFilterSheet = useCallback(() => {
    setFilterSheetOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      if (topicCloseTimerRef.current) {
        clearTimeout(topicCloseTimerRef.current);
      }
    };
  }, []);

  const onTopicSelect = useCallback(
    (topicKey: string, tags: string[]) => {
      const topicActive =
        topicFilterTags !== null && topicFilterTags.length > 0;
      if (topicActive && activeTopicKey === topicKey) {
        setActiveTopicKey(null);
        setTopicFilterTags(null);
        if (topicCloseTimerRef.current) {
          clearTimeout(topicCloseTimerRef.current);
          topicCloseTimerRef.current = null;
        }
        closeFilterSheet();
        return;
      }
      setActiveTopicKey(topicKey);
      setTopicFilterTags(tags);
      if (topicCloseTimerRef.current) {
        clearTimeout(topicCloseTimerRef.current);
      }
      topicCloseTimerRef.current = setTimeout(() => {
        topicCloseTimerRef.current = null;
        closeFilterSheet();
      }, 1000);
    },
    [activeTopicKey, closeFilterSheet, topicFilterTags],
  );

  const refreshReadStatesForCurrentItems = useCallback(async () => {
    if (Platform.OS === 'web') {
      setReadByArticleId({});
      return;
    }
    const ids = itemsRef.current.map((i) => i.id);
    if (ids.length === 0) {
      setReadByArticleId({});
      return;
    }
    try {
      const map = await getReadStatesForArticleIds(ids);
      const next: Record<string, boolean> = {};
      for (const [id, read] of map) {
        next[id] = read;
      }
      setReadByArticleId(next);
    } catch {
      setReadByArticleId({});
    }
  }, []);

  useEffect(() => {
    void refreshReadStatesForCurrentItems();
  }, [items, refreshReadStatesForCurrentItems]);

  const onRequestTranslation = useCallback(
    async (articleId: string): Promise<ArticleListItem | null> => {
      const existing = translationInFlight.get(articleId);
      if (existing) return existing;

      const promise = (async () => {
        try {
          const updated = await generateArticleSummary(articleId);
          updateArticle(articleId, updated);
          return updated;
        } catch {
          return null;
        } finally {
          translationInFlight.delete(articleId);
        }
      })();

      translationInFlight.set(articleId, promise);
      return promise;
    },
    [updateArticle],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRightRow}>
          {usingCache && cachedAt ? (
            <CacheIndicator cachedAt={cachedAt} />
          ) : null}
          <Pressable
            style={styles.filterHeaderButton}
            onPress={openFilterSheet}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Open article filters"
          >
            <Ionicons name="funnel-outline" size={22} color={theme.accent} />
          </Pressable>
        </View>
      ),
    });
  }, [
    navigation,
    usingCache,
    cachedAt,
    openFilterSheet,
    styles.filterHeaderButton,
    styles.headerRightRow,
    theme.text,
  ]);

  useFocusEffect(
    useCallback(() => {
      loadInitial();
      void refreshReadStatesForCurrentItems();
    }, [loadInitial, refreshReadStatesForCurrentItems]),
  );

  const showListLoader = (loading && items.length === 0) || sortReloading;

  if (showListLoader) {
    return <ArticleListSkeleton />;
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={loadInitial}>
          <Text style={styles.retryButtonText}>{t('retry')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
    <FlatList
      style={styles.list}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <ArticleCard
          item={item}
          index={index}
          read={
            Platform.OS === 'web'
              ? undefined
              : (readByArticleId[item.id] ?? false)
          }
          onPress={() => router.push(`/article/${item.id}`)}
          onRequestTranslation={onRequestTranslation}
        />
      )}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="newspaper-outline" size={64} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>{t('noArticlesYet')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('addArticlesHint')}
          </Text>
        </View>
      }
      ListFooterComponent={
        items.length > 0 && hasMore ? (
          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.loadMoreButton,
                loadingMore && styles.loadMoreButtonDisabled,
                pressed && !loadingMore && styles.loadMoreButtonPressed,
              ]}
              onPress={() => loadMore()}
              disabled={loadingMore}
              accessibilityRole="button"
              accessibilityState={{ busy: loadingMore }}
              accessibilityLabel={t('loadMore')}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color={theme.accent} />
              ) : (
                <Text style={[styles.loadMoreButtonText, fancyDisplayFontStyle]}>
                  {t('loadMore')}
                </Text>
              )}
            </Pressable>
          </View>
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={theme.accent}
        />
      }
      showsVerticalScrollIndicator={false}
    />
    <ArticleListFilterShelve
      visible={filterSheetOpen}
      onRequestClose={closeFilterSheet}
      orderBy={orderBy}
      onSelectOrderBy={(next) => {
        void setOrderBy(next);
        closeFilterSheet();
      }}
      activeTopicKey={activeTopicKey}
      onTopicSelect={onTopicSelect}
    />
    </>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 12,
  },
  filterHeaderButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: theme.accent,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    backgroundColor: theme.background,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 2,
    flexGrow: 1,
    backgroundColor: theme.background,
  },
  separator: {
    height: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textSecondary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 280,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreButton: {
    minWidth: 200,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  loadMoreButtonDisabled: {
    opacity: 0.75,
  },
  loadMoreButtonPressed: {
    opacity: 0.88,
  },
  loadMoreButtonText: {
    fontSize: 17,
    color: theme.accent,
  },
  });
}
