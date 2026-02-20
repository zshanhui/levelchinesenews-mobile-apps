import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArticleContent,
  SentenceStudyPanel,
} from '../../lib/components/ArticleContent';
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
  const insets = useSafeAreaInsets();
  const [selectedWord, setSelectedWord] = useState<{ word: string; pinyin: string | null } | null>(null);
  const [highlightedWordKey, setHighlightedWordKey] = useState<string | null>(null);
  const [highlightedSentenceKey, setHighlightedSentenceKey] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);

  const onWordPress = useCallback(
    (word: string, pinyin: string | null, wordKey: string, sentenceKey: string) => {
      setSelectedWord({ word, pinyin });
      setHighlightedWordKey(wordKey);
      setHighlightedSentenceKey(sentenceKey);
    },
    []
  );

  const onClosePanel = useCallback(() => {
    setSelectedWord(null);
    setHighlightedWordKey(null);
    setHighlightedSentenceKey(null);
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: article?.title ?? 'article',
          headerBackTitle: 'back',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />
      {loading && !article ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={styles.loadingText}>loading…</Text>
        </View>
      ) : error && !article ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>retry</Text>
          </Pressable>
        </View>
      ) : article ? (
        <View style={styles.articleContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View ref={contentRef} style={styles.content} collapsable={false}>
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
                          accessibilityLabel="open source article"
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
                <ArticleContent
                  parsedContent={article.parsed_content}
                  selectedWord={selectedWord}
                  highlightedWordKey={highlightedWordKey}
                  highlightedSentenceKey={highlightedSentenceKey}
                  onWordPress={onWordPress}
                  onClosePanel={onClosePanel}
                  scrollViewRef={scrollViewRef}
                  contentRef={contentRef}
                />
              ) : (
                <Text style={[styles.emptyContent, chineseFontStyle]}>
                  no content available
                </Text>
              )}
            </View>
          </ScrollView>
          {selectedWord ? (
            <View style={styles.studyPanelOverlay} pointerEvents="box-none">
              <SentenceStudyPanel
                word={selectedWord.word}
                pinyin={selectedWord.pinyin}
                bottomInset={insets.bottom}
                onClose={onClosePanel}
              />
            </View>
          ) : null}
        </View>
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
  articleContainer: {
    flex: 1,
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
  studyPanelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
