import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArticleContent } from '../../lib/components/ArticleContent';
import { useFont } from '../../lib/FontContext';
import { theme } from '../../lib/theme';
import { useArticle } from '../../lib/useArticle';

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

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { article, loading, error, refetch } = useArticle(id);
  const { chineseFontStyle } = useFont();

  return (
    <>
      <Stack.Screen
        options={{
          title: article?.title ?? 'Article',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />
      {loading && !article ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : error && !article ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : article ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={[styles.title, chineseFontStyle]}>{article.title}</Text>
            {(article.source || article.published_date) && (
              <View style={styles.meta}>
                {article.source && (
                  <View style={styles.metaSource}>
                    <Text style={styles.metaText}>{article.source}</Text>
                    {article.source_url ? (
                      <Pressable
                        onPress={() => Linking.openURL(article.source_url!)}
                        hitSlop={8}
                        accessibilityRole="link"
                        accessibilityLabel="Open source article"
                      >
                        <Ionicons name="open-outline" size={16} color={theme.accent} />
                      </Pressable>
                    ) : null}
                  </View>
                )}
                {article.published_date && (
                  <Text style={styles.metaText}>
                    {formatDate(article.published_date)}
                  </Text>
                )}
              </View>
            )}
            {article.main_image ? (
              <Image
                source={{ uri: article.main_image }}
                style={styles.image}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            ) : null}
            {article.parsed_content?.length ? (
              <ArticleContent parsedContent={article.parsed_content} />
            ) : (
              <Text style={[styles.emptyContent, chineseFontStyle]}>
                No content available
              </Text>
            )}
          </View>
        </ScrollView>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  center: {
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
  scroll: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metaSource: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    backgroundColor: theme.border,
    marginBottom: 16,
  },
  emptyContent: {
    fontSize: 16,
    color: theme.textMuted,
    fontStyle: 'italic',
  },
});
