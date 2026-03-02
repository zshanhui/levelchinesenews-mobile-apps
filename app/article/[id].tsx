import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArticleContent,
  SentenceStudyPanel,
} from '../../lib/components/ArticleContent';
import { useFont } from '../../lib/FontContext';
import { resolveImageUrl } from '../../lib/api';
import { STUDY_PANEL_HEIGHT } from '../../lib/constants';
import type { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';
import { useArticle } from '../../lib/useArticle';

function formatDateTime(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

export default function ArticleDetailScreen() {
  const { id, word: urlWord, wordKey: urlWordKey, sentenceKey: urlSentenceKey } = useLocalSearchParams<
    { id: string; word?: string; wordKey?: string; sentenceKey?: string }
  >();
  const {
    article,
    loading,
    error,
    usingCache,
    usingSeed,
    refetch,
  } = useArticle(id);

  const { theme } = useTheme();
  const { chineseFontStyle } = useFont();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const SourceLabel = () => {
    if (usingCache) {
      return <Text style={styles.metaText}>cached</Text>;
    }
    if (usingSeed) {
      return <Text style={styles.metaText}>seed</Text>;
    }
    return null;
  };
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

  const restoreSelectionFromParams = useCallback(
    (params: { word?: string; wordKey?: string; sentenceKey?: string }) => {
      const { word, wordKey, sentenceKey } = params;
      if (word && wordKey && sentenceKey) {
        setSelectedWord({ word, pinyin: null });
        setHighlightedWordKey(wordKey);
        setHighlightedSentenceKey(sentenceKey);
      }
    },
    []
  );

  // Restore selection when app opens with return-from-Pleco deep link (e.g. app was killed)
  useEffect(() => {
    restoreSelectionFromParams({
      word: urlWord,
      wordKey: urlWordKey,
      sentenceKey: urlSentenceKey,
    });
  }, [urlWord, urlWordKey, urlSentenceKey, restoreSelectionFromParams]);

  // Restore selection when app returns from background via Pleco x-success URL
  useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => {
      try {
        const url = event.url;
        const parsed = Linking.parse(url);
        const path = parsed.path;
        const articleMatch = path?.match(/^\/?article\/([^/]+)/);
        if (articleMatch && articleMatch[1] === id) {
          const query = parsed.queryParams as Record<string, string> | undefined;
          if (query?.word && query?.wordKey && query?.sentenceKey) {
            restoreSelectionFromParams(query);
          }
        }
      } catch {
        // ignore parse errors
      }
    });
    return () => subscription.remove();
  }, [id, restoreSelectionFromParams]);

  return (
    <>
      <Stack.Screen
        options={{
          title: article?.title ?? 'article',
          headerBackTitle: 'back',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/settings')}
              hitSlop={12}
              style={({ pressed }) => [styles.headerButton, pressed && styles.headerButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
            >
              <Ionicons name="settings-outline" size={24} color={theme.textMuted} />
            </Pressable>
          ),
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
            contentContainerStyle={[
              styles.scrollContent,
              selectedWord ? { paddingBottom: 32 + STUDY_PANEL_HEIGHT } : null,
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              ref={contentRef}
              style={styles.content}
              collapsable={false}
              onPress={selectedWord ? onClosePanel : undefined}
            >
              <Text style={[styles.title, chineseFontStyle]}>{article.title}</Text>
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
                {article.published_date ? (
                  <View style={styles.metaDateRow}>
                    <Text style={styles.metaText}>
                      {formatDateTime(article.published_date)}
                    </Text>
                    {SourceLabel()}
                  </View>
                ) : (
                  SourceLabel()
                )}
              </View>
              {((): React.ReactNode => {
                const imageUri = resolveImageUrl(article.main_image);
                return imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.image}
                    contentFit="cover"
                    accessibilityIgnoresInvertColors
                  />
                ) : null;
              })()}
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
            </Pressable>
          </ScrollView>
          {selectedWord ? (
            <View style={styles.studyPanelOverlay} pointerEvents="box-none">
              <SentenceStudyPanel
                word={selectedWord.word}
                pinyin={selectedWord.pinyin}
                articleId={id ?? ''}
                highlightedWordKey={highlightedWordKey ?? ''}
                highlightedSentenceKey={highlightedSentenceKey ?? ''}
                bottomInset={insets.bottom}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
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
  metaDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 10, // 10% taller than 16:9
    borderRadius: 8,
    backgroundColor: theme.border,
    marginBottom: 16,
  },
  emptyContent: {
    fontSize: 16,
    color: theme.textMuted,
    fontStyle: 'italic',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonPressed: {
    opacity: 0.6,
  },
  studyPanelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  });
}
