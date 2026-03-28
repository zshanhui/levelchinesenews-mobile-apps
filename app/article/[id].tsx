import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { router, Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import {
  ActivityIndicator,
  Platform,
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
import { resolveImageUrl } from '../../lib/api';
import { showErrorFeedback, showSuccessFeedback } from '../../lib/showErrorFeedback';
import {
  articleDetailToListItem,
  clearSentenceBookmark,
  computeSentenceBookmarkDisplay,
  getReadState,
  getSentenceBookmark,
  setRead,
  upsertArticleMarkedRead,
  upsertSavedArticleWithSentenceBookmark,
} from '../../lib/savedArticlesDb';
import { STUDY_PANEL_HEIGHT } from '../../lib/constants';
import type { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';
import { useArticle } from '../../lib/useArticle';
import { useArticleTranslations } from '../../lib/useArticleTranslations';

function formatPublishedDate(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function ArticleDetailScreen() {
  const {
    id,
    word: urlWord,
    wordKey: urlWordKey,
    sentenceKey: urlSentenceKey,
  } = useLocalSearchParams<{
    id: string;
    word?: string;
    wordKey?: string;
    sentenceKey?: string;
  }>();
  const {
    article,
    loading,
    error,
    usingCache,
    refetch,
  } = useArticle(id);

  const { translations: articleTranslations, translationLang } = useArticleTranslations(
    id,
    Boolean(article),
  );

  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const SourceLabel = () => {
    if (usingCache) {
      return <Text style={styles.metaText}>{t('cached')}</Text>;
    }
    return null;
  };
  const insets = useSafeAreaInsets();
  const [bookmarkedSentenceKey, setBookmarkedSentenceKey] = useState<
    string | null
  >(null);
  const [readState, setReadState] = useState(false);
  const [selectedWord, setSelectedWord] = useState<{ word: string; pinyin: string | null } | null>(null);
  const [highlightedWordKey, setHighlightedWordKey] = useState<string | null>(null);
  const [highlightedSentenceKey, setHighlightedSentenceKey] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const bookmarkedSentenceKeyRef = useRef<string | null>(null);
  bookmarkedSentenceKeyRef.current = bookmarkedSentenceKey;

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

  useEffect(() => {
    if (Platform.OS === 'web' || !id) {
      setReadState(false);
      setBookmarkedSentenceKey(null);
      return;
    }
    setReadState(false);
    setBookmarkedSentenceKey(null);
    let cancelled = false;
    Promise.all([getReadState(id), getSentenceBookmark(id)]).then(
      ([read, bookmarkIdx]) => {
        if (!cancelled) {
          setReadState(read);
          setBookmarkedSentenceKey(
            bookmarkIdx ? `${bookmarkIdx[0]}:${bookmarkIdx[1]}` : null,
          );
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onMarkRead = useCallback(() => {
    if (!id || Platform.OS === 'web' || !article) return;
    void upsertArticleMarkedRead(articleDetailToListItem(article));
    setReadState(true);
    setBookmarkedSentenceKey(null);
  }, [id, article]);

  const onMarkUnread = useCallback(() => {
    if (!id || Platform.OS === 'web') return;
    void setRead(id, false).then(() => setReadState(false));
  }, [id]);

  const onSentenceBookmarkPress = useCallback(
    async (sentenceKey: string) => {
      if (!id || Platform.OS === 'web' || !article) return;
      const parts = sentenceKey.split(':');
      if (parts.length !== 2) return;
      const p = Number(parts[0]);
      const s = Number(parts[1]);
      if (!Number.isInteger(p) || !Number.isInteger(s)) return;
      try {
        if (bookmarkedSentenceKeyRef.current === sentenceKey) {
          await clearSentenceBookmark(id);
          setBookmarkedSentenceKey(null);
          showSuccessFeedback(t('sentenceBookmarkRemoved'));
        } else {
          const display = computeSentenceBookmarkDisplay(
            article.parsed_content,
            p,
            s,
          );
          await upsertSavedArticleWithSentenceBookmark(
            articleDetailToListItem(article),
            [p, s],
            display,
          );
          setBookmarkedSentenceKey(sentenceKey);
          showSuccessFeedback(t('sentenceBookmarkSaved'));
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        showErrorFeedback(t('sentenceBookmarkFailed'), message);
      }
    },
    [id, article, t],
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

  useLayoutEffect(() => {
    navigation.setOptions({
      title: article?.title ?? t('article'),
      headerBackTitle: t('back'),
      headerStyle: { backgroundColor: theme.surface },
      headerTintColor: theme.text,
      headerRight: () => (
        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={12}
          style={({ pressed }) => [styles.headerButton, pressed && styles.headerButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('openSettings')}
        >
          <Ionicons name="settings-outline" size={24} color={theme.textMuted} />
        </Pressable>
      ),
    });
  }, [
    article?.title,
    navigation,
    t,
    theme.surface,
    theme.text,
    theme.textMuted,
    styles.headerButton,
    styles.headerButtonPressed,
  ]);

  return (
    <>
      <Stack.Screen
        options={{
          title: article?.title ?? t('article'),
          headerBackTitle: t('back'),
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />
      {loading && !article ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      ) : error && !article ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>{t('retry')}</Text>
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
              <Text style={styles.title}>{article.title}</Text>
              <View style={styles.metaRow}>
                <View style={styles.meta}>
                  {article.source && (
                    <View style={styles.metaSource}>
                      <Text style={styles.metaText}>{article.source}</Text>
                      {article.source_url ? (
                        <Pressable
                          onPress={() => Linking.openURL(article.source_url!)}
                          hitSlop={8}
                          accessibilityRole="link"
                          accessibilityLabel={t('openSourceArticle')}
                        >
                          <Ionicons name="open-outline" size={16} color={theme.accent} />
                        </Pressable>
                      ) : null}
                    </View>
                  )}
                  {article.published_date ? (
                    <View style={styles.metaDateRow}>
                      <Text style={styles.metaText}>
                        {formatPublishedDate(article.published_date)}
                      </Text>
                      {SourceLabel()}
                    </View>
                  ) : (
                    SourceLabel()
                  )}
                </View>
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
                  sentenceBookmarkEnabled={Platform.OS !== 'web'}
                  bookmarkedSentenceKey={bookmarkedSentenceKey}
                  onSentenceBookmarkPress={onSentenceBookmarkPress}
                  articleTranslations={articleTranslations}
                  translationLang={translationLang}
                />
              ) : (
                <Text style={styles.emptyContent}>
                  {t('noContentAvailable')}
                </Text>
              )}
              {Platform.OS !== 'web' && (
                <View style={styles.markReadFooter}>
                  {readState ? (
                    <View style={styles.markUnreadRow}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.markUnreadButton,
                          pressed && styles.markUnreadButtonPressed,
                        ]}
                        onPress={onMarkUnread}
                        accessibilityRole="button"
                        accessibilityLabel={t('markUnread')}
                      >
                        <Text style={styles.markUnreadButtonLabel}>
                          {t('markUnread')}
                        </Text>
                      </Pressable>
                      <View
                        style={styles.markReadStateIcon}
                        pointerEvents="none"
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={theme.accent}
                        />
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [
                        styles.markReadButton,
                        pressed && styles.markReadButtonPressed,
                      ]}
                      onPress={onMarkRead}
                      accessibilityRole="button"
                      accessibilityLabel={t('markRead')}
                    >
                      <Text style={styles.markReadButtonLabel}>
                        {t('markRead')}
                      </Text>
                    </Pressable>
                  )}
                </View>
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  meta: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
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
  markReadFooter: {
    marginTop: 10,
    width: '100%',
    alignItems: 'flex-end',
  },
  markReadButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.accent,
  },
  markReadButtonPressed: {
    opacity: 0.55,
  },
  markReadButtonLabel: {
    color: theme.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  markUnreadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  markUnreadButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.etchedBg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  markReadStateIcon: {
    justifyContent: 'center',
  },
  markUnreadButtonPressed: {
    opacity: 0.6,
  },
  markUnreadButtonLabel: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '500',
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
