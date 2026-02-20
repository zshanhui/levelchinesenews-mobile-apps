import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFont } from '../../lib/FontContext';
import { useArticles } from '../../lib/useArticles';
import type { ArticleListItem } from '../../lib/types';
import { theme } from '../../lib/theme';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return '';
  }
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen).trim() + '…';
}

function ArticleCard({
  item,
  onPress,
}: {
  item: ArticleListItem;
  onPress: () => void;
}) {
  const { chineseFontStyle, chineseFontBoldStyle } = useFont();
  const [showTranslated, setShowTranslated] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const displayTitle =
    showTranslated && item.title_translated_en
      ? item.title_translated_en
      : item.title;
  const fullSummary = item.summary_generated_en || null;
  const displaySubtitle = fullSummary
    ? summaryExpanded
      ? fullSummary
      : truncate(fullSummary, 100)
    : null;

  return (
    <View style={styles.card}>
        {item.main_image ? (
          <Image
            source={{ uri: item.main_image }}
            style={styles.thumbnail}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="newspaper-outline" size={32} color={theme.textMuted} />
          </View>
        )}
        <View style={styles.cardContent}>
          {item.title_translated_en ? (
            <Pressable
              onPress={() => setShowTranslated((prev) => !prev)}
              style={styles.titlePressable}
            >
              <Text
                style={[
                  styles.cardTitle,
                  chineseFontBoldStyle,
                  showTranslated && styles.cardTitleTranslated,
                ]}
                numberOfLines={showTranslated ? undefined : 2}
              >
                {displayTitle}
              </Text>
            </Pressable>
          ) : (
            <Text
              style={[styles.cardTitle, chineseFontBoldStyle]}
              numberOfLines={2}
            >
              {displayTitle}
            </Text>
          )}
          {(item.source || item.published_date) && (
            <View style={styles.cardMeta}>
              {item.source && (
                <Text
                  style={[styles.cardSource, chineseFontStyle]}
                >
                  {item.source}
                </Text>
              )}
              {item.published_date && (
                <Text style={styles.cardDate}>
                  {formatDate(item.published_date)}
                </Text>
              )}
            </View>
          )}
          {displaySubtitle ? (
            fullSummary!.length > 100 ? (
              <Pressable
                onPress={() => setSummaryExpanded((prev) => !prev)}
                style={styles.summaryPressable}
              >
                <Text
                  style={[styles.cardSummary, chineseFontStyle]}
                  numberOfLines={summaryExpanded ? undefined : 2}
                >
                  {displaySubtitle}
                </Text>
              </Pressable>
            ) : (
              <Text
                style={[styles.cardSummary, chineseFontStyle]}
                numberOfLines={2}
              >
                {displaySubtitle}
              </Text>
            )
          ) : (
            <Text style={[styles.cardSummaryEmpty, chineseFontStyle]}>
              No summary has been generated for this article yet…
            </Text>
          )}
        </View>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.arrowButton,
            pressed && styles.arrowButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Open article: ${displayTitle}`}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.textMuted}
          />
        </Pressable>
    </View>
  );
}

export default function ArticlesScreen() {
  const {
    items,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    loadInitial,
    refresh,
    loadMore,
  } = useArticles();

  useFocusEffect(
    useCallback(() => {
      loadInitial();
    }, [loadInitial]),
  );

  if (loading && items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.loadingText}>Loading articles…</Text>
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={loadInitial}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ArticleCard
          item={item}
          onPress={() => router.push(`/article/${item.id}`)}
        />
      )}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="newspaper-outline" size={64} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>No articles yet</Text>
          <Text style={styles.emptySubtitle}>
            Add articles from the Create tab by pasting a news URL
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

const styles = StyleSheet.create({
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
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.surfaceElevated,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 12,
    minHeight: 96,
    borderWidth: 1,
    borderColor: theme.border,
  },
  arrowButton: {
    padding: 12,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  arrowButtonPressed: {
    opacity: 0.7,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: theme.border,
  },
  thumbnailPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
    minWidth: 0,
  },
  titlePressable: {
    alignSelf: 'flex-start',
  },
  summaryPressable: {
    alignSelf: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.accentPressed,
  },
  cardTitleTranslated: {
    fontSize: 14,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  cardSource: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  cardDate: {
    fontSize: 12,
    color: theme.textMuted,
  },
  cardSummary: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 4,
  },
  cardSummaryEmpty: {
    fontSize: 13,
    color: theme.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
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
