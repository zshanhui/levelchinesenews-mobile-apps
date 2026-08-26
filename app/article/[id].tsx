import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArticleContent } from '../../lib/components/ArticleContent';
import { ArticleDetailHeader } from '../../lib/components/ArticleDetailHeader';
import { BottomMediaSourceLink } from '../../lib/components/BottomMediaSourceLink';
import {
  BookmarkToast,
  type BookmarkToastState,
} from '../../lib/components/BookmarkToast';
import { ArticleSkeleton } from '../../lib/components/ArticleSkeleton';
import { isLatinOrNumericSegment } from '../../lib/components/ArticleSentenceRow';
import { SentenceStudyPanel } from '../../lib/components/SentenceStudyPanel';
import { showErrorFeedback } from '../../lib/showErrorFeedback';
import { parseSentenceKey } from '../../lib/sentenceKeys';
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
import { EXTRA_BOTTOM_PADDING } from '../../lib/constants';
import { useFont } from '../../lib/FontContext';
import type { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';
import { useArticle } from '../../lib/useArticle';
import { useArticleAudio } from '../../lib/useArticleAudio';
import { useArticleTranslations } from '../../lib/useArticleTranslations';
import { useStopwords } from '../../lib/useStopwords';

const ARTICLE_REFRESH_MIN_OVERLAY_MS = 250;
const ARTICLE_EXTRA_TOP_PADDING = 10;

/** Floating settings button on the article reader (no nav bar). */
const ARTICLE_FLOATING_BUTTON_SCALE = 0.6;
const SETTINGS_BUTTON_SIZE = Math.round(44 * ARTICLE_FLOATING_BUTTON_SCALE);
const SETTINGS_BUTTON_GLYPH_SIZE = Math.round(24 * ARTICLE_FLOATING_BUTTON_SCALE);
const SETTINGS_BUTTON_HIT_SLOP = {
  top: Math.round(8 * ARTICLE_FLOATING_BUTTON_SCALE),
  bottom: Math.round(8 * ARTICLE_FLOATING_BUTTON_SCALE),
  left: Math.round(12 * ARTICLE_FLOATING_BUTTON_SCALE),
  right: Math.round(16 * ARTICLE_FLOATING_BUTTON_SCALE),
} as const;

type ArticleSkeletonLayerStyles = {
  refreshOverlay: ViewStyle;
  skeletonFrame: ViewStyle;
};

/** Same layout for initial navigation load and pull-to-refresh overlay (absolute fill + inset). */
function ArticleSkeletonLoadingLayer({
  styles,
  accessibilityLabel,
  paddingTop,
}: {
  styles: ArticleSkeletonLayerStyles;
  accessibilityLabel: string;
  paddingTop: number;
}) {
  return (
    <View
      style={[StyleSheet.absoluteFillObject, styles.refreshOverlay]}
      accessibilityViewIsModal
      accessibilityLabel={accessibilityLabel}
    >
      <View
        style={[
          styles.skeletonFrame,
          { paddingTop },
        ]}
      >
        <ArticleSkeleton centerContent />
      </View>
    </View>
  );
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
    refresh,
  } = useArticle(id);

  const {
    translations: articleTranslations,
    translationLang,
    mergeTranslationFromPost,
    loading: articleTranslationsLoading,
    refetch: refetchArticleTranslations,
  } = useArticleTranslations(id, Boolean(article));

  const {
    articleAudio,
    loading: articleAudioLoading,
    refetch: refetchArticleAudio,
    mergeAudioFromPost,
  } = useArticleAudio(id, Boolean(article));

  const { theme } = useTheme();
  const { fancyDisplayFontStyle } = useFont();

  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { bottom: bottomInset, top: topInset } = useSafeAreaInsets();
  const [bookmarkToast, setBookmarkToast] = useState<BookmarkToastState | null>(
    null,
  );
  const dismissBookmarkToast = useCallback(() => setBookmarkToast(null), []);
  const [bookmarkedSentenceKey, setBookmarkedSentenceKey] = useState<
    string | null
  >(null);
  const [readState, setReadState] = useState(false);
  const [selectedWord, setSelectedWord] = useState<{ word: string; pinyin: string | null } | null>(null);
  const [highlightedWordKey, setHighlightedWordKey] = useState<string | null>(null);
  const [highlightedSentenceKey, setHighlightedSentenceKey] = useState<string | null>(null);
  const [refreshOverlayVisible, setRefreshOverlayVisible] = useState(false);
  /** Show mark read/unread only after the list reports the last sentence is on screen. */
  const [markReadFooterVisible, setMarkReadFooterVisible] = useState(false);
  const bookmarkedSentenceKeyRef = useRef<string | null>(null);
  bookmarkedSentenceKeyRef.current = bookmarkedSentenceKey;
  const highlightedWordKeyRef = useRef<string | null>(null);
  highlightedWordKeyRef.current = highlightedWordKey;
  const selectedWordRef = useRef<{
    word: string;
    pinyin: string | null;
  } | null>(null);
  selectedWordRef.current = selectedWord;

  const { isStopWord } = useStopwords();

  const copyWordToClipboard = useCallback(
    (word: string) => {
      Clipboard.setStringAsync(word)
        .then(() =>
          setBookmarkToast((prev) => ({
            message: t('copiedToClipboard'),
            key: (prev?.key ?? 0) + 1,
          })),
        )
        .catch(() => showErrorFeedback(t('copyWordFailed')));
    },
    [t],
  );

  const onWordPress = useCallback(
    (word: string, pinyin: string | null, wordKey: string, sentenceKey: string) => {
      if (isStopWord(word) || isLatinOrNumericSegment(word)) {
        // Stop words (e.g. 的/了/在), English words, and numbers don't open the
        // dict popup and don't get highlighted themselves, but their sentence
        // still gets focused so the sentence helper bar shows.
        setSelectedWord(null);
        setHighlightedWordKey(null);
        setHighlightedSentenceKey(sentenceKey);
        return;
      }
      if (
        selectedWordRef.current != null &&
        highlightedWordKeyRef.current === wordKey
      ) {
        // Re-tapping the already-focused word copies it to the clipboard.
        copyWordToClipboard(word);
        return;
      }
      setSelectedWord({ word, pinyin });
      setHighlightedWordKey(wordKey);
      setHighlightedSentenceKey(sentenceKey);
    },
    [isStopWord, copyWordToClipboard]
  );

  const onClosePanel = useCallback(() => {
    // Dismissing the study panel (swipe or close) only closes the popup — the
    // sentence stays highlighted/focused so the helper bar remains visible.
    setSelectedWord(null);
    setHighlightedWordKey(null);
  }, []);

  const onRefreshArticle = useCallback(async () => {
    setRefreshOverlayVisible(true);
    const started = Date.now();
    try {
      await refresh();
      await Promise.all([refetchArticleTranslations(), refetchArticleAudio()]);
    } finally {
      const elapsed = Date.now() - started;
      const remain = Math.max(0, ARTICLE_REFRESH_MIN_OVERLAY_MS - elapsed);
      await new Promise<void>((resolve) => setTimeout(resolve, remain));
      setRefreshOverlayVisible(false);
    }
  }, [refresh, refetchArticleAudio, refetchArticleTranslations]);

  const restoreSelectionFromParams = useCallback(
    (params: { word?: string; wordKey?: string; sentenceKey?: string }) => {
      const { word, wordKey, sentenceKey } = params;
      const key = Array.isArray(sentenceKey) ? sentenceKey[0] : sentenceKey;
      if (word && wordKey && key) {
        setSelectedWord({ word, pinyin: null });
        setHighlightedWordKey(wordKey);
        setHighlightedSentenceKey(key);
      } else if (key) {
        // Deep link / Learn tab: scroll to sentence without opening the word study panel
        setSelectedWord(null);
        setHighlightedWordKey(null);
        setHighlightedSentenceKey(key);
      }
    },
    []
  );

  useEffect(() => {
    setReadState(false);
    setBookmarkedSentenceKey(null);
    setSelectedWord(null);
    setHighlightedWordKey(null);
    setHighlightedSentenceKey(null);
    if (!id) return;
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
    if (!id || !article) return;
    void upsertArticleMarkedRead(articleDetailToListItem(article));
    setReadState(true);
    setBookmarkedSentenceKey(null);
  }, [id, article]);

  const onMarkUnread = useCallback(() => {
    if (!id) return;
    void setRead(id, false).then(() => setReadState(false));
  }, [id]);

  const onLastSentenceBecameVisible = useCallback(() => {
    setMarkReadFooterVisible(true);
  }, []);

  useEffect(() => {
    setMarkReadFooterVisible(false);
  }, [id]);

  const onSentenceBookmarkPress = useCallback(
    async (sentenceKey: string) => {
      if (!id || !article) return;
      const indices = parseSentenceKey(sentenceKey);
      if (!indices) return;
      const { paragraphIndex: p, sentenceIndex: s } = indices;
      try {
        if (bookmarkedSentenceKeyRef.current === sentenceKey) {
          await clearSentenceBookmark(id);
          setBookmarkedSentenceKey(null);
          setBookmarkToast((prev) => ({
            message: 'bookmark removed',
            key: (prev?.key ?? 0) + 1,
          }));
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
          setBookmarkToast((prev) => ({
            message: 'bookmark saved',
            key: (prev?.key ?? 0) + 1,
          }));
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        showErrorFeedback(t('sentenceBookmarkFailed'), message);
      }
    },
    [id, article, t],
  );

  // Restore selection when app opens with return-from-Pleco deep link (e.g. app was killed),
  // or when Learn tab navigates with sentenceKey for auto-scroll.
  useEffect(() => {
    restoreSelectionFromParams({
      word: urlWord,
      wordKey: urlWordKey,
      sentenceKey: urlSentenceKey,
    });
  }, [id, urlWord, urlWordKey, urlSentenceKey, restoreSelectionFromParams]);

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

  const openSettings = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    router.push('/settings');
  }, []);

  const articleHeaderProps = useMemo(
    () =>
      article
        ? {
            articleId: id,
            title: article.title,
            source: article.source,
            sourceUrl: article.source_url,
            publishedDate: article.published_date,
            mainImage: article.main_image,
            usingCache,
          }
        : null,
    [article, id, usingCache],
  );

  return (
    <View style={styles.screenRoot}>
      <View
        style={[styles.floatingSettingsHost, { top: topInset + 4 }]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={openSettings}
          hitSlop={SETTINGS_BUTTON_HIT_SLOP}
          style={({ pressed }) => [
            styles.settingsButtonBackdrop,
            pressed && styles.settingsButtonBackdropPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('openSettings')}
        >
          <Ionicons
            name="settings-outline"
            size={SETTINGS_BUTTON_GLYPH_SIZE}
            color={theme.accent}
          />
        </Pressable>
      </View>
      {loading && !article ? (
        <View style={styles.articleContainer}>
          <ArticleSkeletonLoadingLayer
            styles={styles}
            accessibilityLabel={t('loading')}
            paddingTop={topInset + ARTICLE_EXTRA_TOP_PADDING}
          />
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
          <BookmarkToast toast={bookmarkToast} onDismiss={dismissBookmarkToast} />
          <View style={styles.articleScrollContainer} collapsable={false}>
            {article.parsed_content?.length && articleHeaderProps ? (
              <ArticleContent
                parsedContent={article.parsed_content}
                listHeader={<ArticleDetailHeader {...articleHeaderProps} />}
                listFooter={
                  <>
                    {markReadFooterVisible ? (
                      <View style={styles.articleBottomBar}>
                        <View style={styles.bottomBarLeft}>
                          {article.source_url ? (
                            <BottomMediaSourceLink
                              sourceUrl={article.source_url}
                              mediaSourceLabel={article.source}
                            />
                          ) : null}
                        </View>
                        <View style={styles.bottomBarRight}>
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
                                <Text
                                  style={[
                                    styles.markUnreadButtonLabel,
                                    fancyDisplayFontStyle,
                                  ]}
                                >
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
                                  size={15}
                                  color={theme.error}
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
                              <Text
                                style={[
                                  styles.markReadButtonLabel,
                                  fancyDisplayFontStyle,
                                ]}
                              >
                                {t('markRead')}
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    ) : null}
                    {article.source_url && !markReadFooterVisible ? (
                      <View style={styles.bottomMediaLinkStandalone}>
                        <BottomMediaSourceLink
                          sourceUrl={article.source_url}
                          mediaSourceLabel={article.source}
                        />
                      </View>
                    ) : null}
                  </>
                }
                onLastSentenceBecameVisible={onLastSentenceBecameVisible}
                contentContainerStyle={[
                  styles.scrollContent,
                  {
                    paddingTop: topInset + 8 + ARTICLE_EXTRA_TOP_PADDING,
                    paddingHorizontal: 20,
                  },
                ]}
                style={styles.scroll}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshOverlayVisible}
                    onRefresh={onRefreshArticle}
                    tintColor={theme.accent}
                  />
                }
                highlightedWordKey={highlightedWordKey}
                highlightedSentenceKey={highlightedSentenceKey}
                onWordPress={onWordPress}
                sentenceBookmarkEnabled
                bookmarkedSentenceKey={bookmarkedSentenceKey}
                onSentenceBookmarkPress={onSentenceBookmarkPress}
                articleTranslations={articleTranslations}
                translationLang={translationLang}
                articleTranslationsLoading={articleTranslationsLoading}
                articleAudio={articleAudio}
                articleAudioLoading={articleAudioLoading}
                articleId={id}
                mergeTranslationFromPost={mergeTranslationFromPost}
                mergeAudioFromPost={mergeAudioFromPost}
              />
            ) : (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                  styles.scrollContent,
                  {
                    paddingTop: topInset + 16 + ARTICLE_EXTRA_TOP_PADDING,
                  },
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshOverlayVisible}
                    onRefresh={onRefreshArticle}
                    tintColor={theme.accent}
                  />
                }
              >
                <Pressable
                  style={styles.content}
                  collapsable={false}
                  onPress={selectedWord ? onClosePanel : undefined}
                >
                  {articleHeaderProps ? <ArticleDetailHeader {...articleHeaderProps} /> : null}
                  <Text style={styles.emptyContent}>
                    {t('noContentAvailable')}
                  </Text>
                  {article.source_url ? (
                    <View style={styles.bottomMediaLinkStandalone}>
                      <BottomMediaSourceLink
                        sourceUrl={article.source_url}
                        mediaSourceLabel={article.source}
                      />
                    </View>
                  ) : null}
                </Pressable>
              </ScrollView>
            )}
          </View>
          {selectedWord && !refreshOverlayVisible ? (
            <View style={styles.studyPanelOverlay} pointerEvents="box-none">
              <SentenceStudyPanel
                word={selectedWord.word}
                pinyin={selectedWord.pinyin}
                articleId={id ?? ''}
                highlightedWordKey={highlightedWordKey ?? ''}
                highlightedSentenceKey={highlightedSentenceKey ?? ''}
                bottomInset={bottomInset}
                onRequestClose={onClosePanel}
              />
            </View>
          ) : null}
          {refreshOverlayVisible ? (
            <ArticleSkeletonLoadingLayer
              styles={styles}
              accessibilityLabel={t('loading')}
              paddingTop={topInset + ARTICLE_EXTRA_TOP_PADDING}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
  screenRoot: {
    flex: 1,
    position: 'relative',
  },
  floatingSettingsHost: {
    position: 'absolute',
    right: 8,
    zIndex: 20,
  },
  center: {
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
  articleContainer: {
    flex: 1,
    position: 'relative',
  },
  /** Wraps virtualized `ArticleContent` — scroll lives on the inner `FlashList`. */
  articleScrollContainer: {
    flex: 1,
  },
  refreshOverlay: {
    backgroundColor: theme.background,
    zIndex: 10,
  },
  /** Same inset + flex shell for list→article load and pull-to-refresh overlay. */
  skeletonFrame: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    paddingBottom: EXTRA_BOTTOM_PADDING,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyContent: {
    fontSize: 16,
    color: theme.textMuted,
    fontStyle: 'italic',
  },
  articleBottomBar: {
    marginTop: 10,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  bottomBarLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  bottomBarRight: {
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  bottomMediaLinkStandalone: {
    marginTop: 20,
    width: '100%',
  },
  markReadButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: `${theme.error}55`,
  },
  markReadButtonPressed: {
    opacity: 0.82,
  },
  markReadButtonLabel: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.error,
    letterSpacing: 0.2,
    textShadowColor: theme.background,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  markUnreadRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  markUnreadButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: theme.etchedBg,
    borderWidth: 1,
    borderColor: `${theme.error}55`,
  },
  markReadStateIcon: {
    justifyContent: 'center',
    paddingBottom: 2,
  },
  markUnreadButtonPressed: {
    opacity: 0.82,
  },
  markUnreadButtonLabel: {
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0.2,
    textShadowColor: theme.background,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  settingsButtonBackdrop: {
    width: SETTINGS_BUTTON_SIZE,
    height: SETTINGS_BUTTON_SIZE,
    borderRadius: SETTINGS_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${theme.surfaceElevated}E8`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  settingsButtonBackdropPressed: {
    opacity: 0.88,
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
