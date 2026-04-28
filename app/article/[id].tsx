import Ionicons from '@expo/vector-icons/Ionicons';
import { useHeaderHeight } from '@react-navigation/elements';
import * as Linking from 'expo-linking';
import { router, Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArticleContent } from '../../lib/components/ArticleContent';
import {
  BookmarkToast,
  type BookmarkToastState,
} from '../../lib/components/BookmarkToast';
import { ArticleSkeleton } from '../../lib/components/ArticleSkeleton';
import { SentenceStudyPanel } from '../../lib/components/SentenceStudyPanel';
import { resolveImageUrl } from '../../lib/api';
import { formatPublishedDate } from '../../lib/formatPublishedDate';
import { showErrorFeedback } from '../../lib/showErrorFeedback';
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
import {
  ARTICLE_STUDY_EXTRA_BOTTOM_PADDING,
  STUDY_PANEL_HEIGHT,
} from '../../lib/constants';
import { webArticleFontScale } from '../../lib/FontContext';
import type { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';
import { useArticle } from '../../lib/useArticle';
import { useArticleTranslations } from '../../lib/useArticleTranslations';

const ARTICLE_REFRESH_MIN_OVERLAY_MS = 250;

/** Space below the transparent header before the article title and metadata. */
const ARTICLE_SCROLL_TOP_EXTRA = 75;

/** Native headline size */
const ARTICLE_TITLE_BASE_FONT_SIZE = 22;
/** Web headline before viewport scaling (`webArticleFontScale`). */
const ARTICLE_TITLE_BASE_FONT_SIZE_WEB = 28;

/** Extra inset below the header for skeleton (list load + pull-to-refresh). */
const SKELETON_TOP_EXTRA = 20;

type ArticleSkeletonLayerStyles = {
  refreshOverlay: ViewStyle;
  skeletonFrame: ViewStyle;
};

/** Same layout for initial navigation load and pull-to-refresh overlay (absolute fill + inset). */
function ArticleSkeletonLoadingLayer({
  styles,
  headerHeight,
  accessibilityLabel,
}: {
  styles: ArticleSkeletonLayerStyles;
  headerHeight: number;
  accessibilityLabel: string;
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
          { paddingTop: headerHeight + SKELETON_TOP_EXTRA },
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

  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const { width: windowWidth } = useWindowDimensions();
  const { theme } = useTheme();

  const articleTitleFontSize = useMemo(
    () =>
      Platform.OS === 'web'
        ? Math.round(ARTICLE_TITLE_BASE_FONT_SIZE_WEB * webArticleFontScale(windowWidth))
        : ARTICLE_TITLE_BASE_FONT_SIZE,
    [windowWidth],
  );
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const SourceLabel = () => {
    if (usingCache) {
      return <Text style={styles.metaText}>{t('cached')}</Text>;
    }
    return null;
  };
  const insets = useSafeAreaInsets();
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

  const onRefreshArticle = useCallback(async () => {
    setRefreshOverlayVisible(true);
    const started = Date.now();
    try {
      await refresh();
      await refetchArticleTranslations();
    } finally {
      const elapsed = Date.now() - started;
      const remain = Math.max(0, ARTICLE_REFRESH_MIN_OVERLAY_MS - elapsed);
      await new Promise<void>((resolve) => setTimeout(resolve, remain));
      setRefreshOverlayVisible(false);
    }
  }, [refresh, refetchArticleTranslations]);

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

  const onLastSentenceBecameVisible = useCallback(() => {
    setMarkReadFooterVisible(true);
  }, []);

  useEffect(() => {
    setMarkReadFooterVisible(false);
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
      title: '',
      headerTransparent: true,
      headerShadowVisible: false,
      headerStyle: { backgroundColor: 'transparent' },
      headerTintColor: theme.text,
      ...(Platform.OS === 'web' ? { headerBackVisible: false } : {}),
      headerLeft:
        Platform.OS === 'web'
          ? () => null
          : () => (
              <Pressable
                onPress={() => router.back()}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.headerIconBackdrop,
                  pressed && styles.headerIconBackdropPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('back')}
              >
                <Ionicons
                  name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
                  size={24}
                  color={theme.text}
                />
              </Pressable>
            ),
      headerRight: () => (
        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={10}
          style={({ pressed }) => [
            styles.headerIconBackdrop,
            pressed && styles.headerIconBackdropPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('openSettings')}
        >
          <Ionicons name="settings-outline" size={22} color={theme.text} />
        </Pressable>
      ),
    });
  }, [
    navigation,
    t,
    theme.text,
    styles.headerIconBackdrop,
    styles.headerIconBackdropPressed,
  ]);

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: theme.text,
        }}
      />
      {loading && !article ? (
        <View style={styles.articleContainer}>
          <ArticleSkeletonLoadingLayer
            styles={styles}
            headerHeight={headerHeight}
            accessibilityLabel={t('loading')}
          />
        </View>
      ) : error && !article ? (
        <View
          style={[styles.center, { paddingTop: headerHeight + ARTICLE_SCROLL_TOP_EXTRA }]}
        >
          <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>{t('retry')}</Text>
          </Pressable>
        </View>
      ) : article ? (
        <View style={styles.articleContainer}>
          <BookmarkToast toast={bookmarkToast} onDismiss={dismissBookmarkToast} />
          <Pressable
            style={styles.articleScrollContainer}
            collapsable={false}
            onPress={selectedWord ? onClosePanel : undefined}
          >
            {article.parsed_content?.length ? (
              <ArticleContent
                parsedContent={article.parsed_content}
                listHeader={(
                  <>
                    <Text style={[styles.title, { fontSize: articleTitleFontSize }]}>
                      {article.title}
                    </Text>
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
                  </>
                )}
                listFooter={
                  Platform.OS !== 'web' && markReadFooterVisible ? (
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
                  ) : null
                }
                onLastSentenceBecameVisible={
                  Platform.OS !== 'web' ? onLastSentenceBecameVisible : undefined
                }
                contentContainerStyle={[
                  styles.scrollContent,
                  {
                    paddingTop: headerHeight + ARTICLE_SCROLL_TOP_EXTRA + 16,
                    paddingHorizontal: 20,
                  },
                  selectedWord
                    ? {
                        paddingBottom:
                          32 +
                          STUDY_PANEL_HEIGHT +
                          ARTICLE_STUDY_EXTRA_BOTTOM_PADDING,
                      }
                    : {},
                ]}
                style={styles.scroll}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshOverlayVisible}
                    onRefresh={onRefreshArticle}
                    tintColor={theme.accent}
                  />
                }
                selectedWord={selectedWord}
                highlightedWordKey={highlightedWordKey}
                highlightedSentenceKey={highlightedSentenceKey}
                onWordPress={onWordPress}
                sentenceBookmarkEnabled={Platform.OS !== 'web'}
                bookmarkedSentenceKey={bookmarkedSentenceKey}
                onSentenceBookmarkPress={onSentenceBookmarkPress}
                articleTranslations={articleTranslations}
                translationLang={translationLang}
                articleTranslationsLoading={articleTranslationsLoading}
                articleId={id}
                mergeTranslationFromPost={mergeTranslationFromPost}
              />
            ) : (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                  styles.scrollContent,
                  { paddingTop: headerHeight + ARTICLE_SCROLL_TOP_EXTRA },
                  selectedWord
                    ? {
                        paddingBottom:
                          32 +
                          STUDY_PANEL_HEIGHT +
                          ARTICLE_STUDY_EXTRA_BOTTOM_PADDING,
                      }
                    : {},
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
                  <Text style={[styles.title, { fontSize: articleTitleFontSize }]}>
                      {article.title}
                    </Text>
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
                  <Text style={styles.emptyContent}>
                    {t('noContentAvailable')}
                  </Text>
                </Pressable>
              </ScrollView>
            )}
          </Pressable>
          {selectedWord && !refreshOverlayVisible ? (
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
          {refreshOverlayVisible ? (
            <ArticleSkeletonLoadingLayer
              styles={styles}
              headerHeight={headerHeight}
              accessibilityLabel={t('loading')}
            />
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
    paddingBottom: 32,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
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
  headerIconBackdrop: {
    width: 30,
    height: 30,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
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
  headerIconBackdropPressed: {
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
