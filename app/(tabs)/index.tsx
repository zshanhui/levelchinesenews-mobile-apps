import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useLayoutEffect, useMemo } from 'react';
import { useTranslation } from '../../lib/i18n';
import { generateArticleSummary } from '../../lib/api';
import type { ArticleListItem } from '../../lib/types';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CacheIndicator } from '../../lib/components/CacheIndicator';
import { ArticleCard } from '../../lib/components/ArticleCard';
import { SeedIndicator } from '../../lib/components/SeedIndicator';
import { useArticles } from '../../lib/useArticles';
import type { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';

const translationInFlight = new Map<string, Promise<ArticleListItem | null>>();

export default function ArticlesScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const {
    items,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    usingCache,
    cachedAt,
    usingSeed,
    loadInitial,
    refresh,
    loadMore,
    updateArticle,
  } = useArticles();

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
      headerRight: () =>
        usingCache && cachedAt ? (
          <CacheIndicator cachedAt={cachedAt} />
        ) : usingSeed ? (
          <SeedIndicator />
        ) : null,
    });
  }, [navigation, usingCache, cachedAt, usingSeed]);

  useFocusEffect(
    useCallback(() => {
      loadInitial();
    }, [loadInitial]),
  );

  if (loading && items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.loadingText}>{t('loadingArticles')}</Text>
      </View>
    );
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
    <FlatList
      style={styles.list}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <ArticleCard
          item={item}
          index={index}
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
        loadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={theme.accent} />
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
      onEndReached={() => hasMore && loadMore()}
      onEndReachedThreshold={0.4}
      showsVerticalScrollIndicator={false}
    />
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.textSecondary,
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
    height: 12,
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
  });
}
