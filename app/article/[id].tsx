import Ionicons from '@expo/vector-icons/Ionicons';
import { useHeaderHeight } from '@react-navigation/elements';
import * as Linking from 'expo-linking';
import { router, Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import {
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
import { ArticleSkeleton } from '../../lib/components/ArticleSkeleton';
import { SentenceStudyPanel } from '../../lib/components/SentenceStudyPanel';
import { resolveImageUrl } from '../../lib/api';
import { formatPublishedDate } from '../../lib/formatPublishedDate';
import {
  ARTICLE_STUDY_EXTRA_BOTTOM_PADDING,
  STUDY_PANEL_HEIGHT,
  webContentHorizontalPadding,
} from '../../lib/constants';
import { webArticleFontScale } from '../../lib/FontContext';
import type { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';
import { useArticle } from '../../lib/useArticle';
import { useArticleTranslations } from '../../lib/useArticleTranslations';

const ARTICLE_REFRESH_MIN_OVERLAY_MS = 250;

/** Space below the transparent header before the article title and metadata. */
const ARTICLE_SCROLL_TOP_EXTRA = 75;

/** Native headline size kept for scale reference. */
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
  const contentPadH = webContentHorizontalPadding(windowWidth);

  const articleTitleFontSize = useMemo(
    () =>
      Math.round(ARTICLE_TITLE_BASE_FONT_SIZE_WEB * webArticleFontScale(windowWidth)),
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
  const [selectedWord, setSelectedWord] = useState<{ word: string; pinyin: string | null } | null>(null);
  const [highlightedWordKey, setHighlightedWordKey] = useState<string | null>(null);
  const [highlightedSentenceKey, setHighlightedSentenceKey] = useState<string | null>(null);
  const [refreshOverlayVisible, setRefreshOverlayVisible] = useState(false);

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

  // Restore selection from share-link query params (word / sentenceKey).
  useEffect(() => {
    restoreSelectionFromParams({
      word: urlWord,
      wordKey: urlWordKey,
      sentenceKey: urlSentenceKey,
    });
  }, [urlWord, urlWordKey, urlSentenceKey, restoreSelectionFromParams]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '',
      headerTransparent: true,
      headerShadowVisible: false,
      headerStyle: { backgroundColor: 'transparent' },
      headerTintColor: theme.text,
      headerBackVisible: false,
      headerLeft: () => null,
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
                listFooter={null}
                onLastSentenceBecameVisible={undefined}
                contentContainerStyle={[
                  styles.scrollContent,
                  {
                    paddingTop: headerHeight + ARTICLE_SCROLL_TOP_EXTRA + 16,
                    paddingHorizontal: contentPadH,
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
                sentenceBookmarkEnabled={false}
                bookmarkedSentenceKey={null}
                onSentenceBookmarkPress={undefined}
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
                  style={[styles.content, { paddingHorizontal: contentPadH }]}
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
            <View
              style={[
                styles.studyPanelOverlay,
                { paddingHorizontal: contentPadH },
              ]}
              pointerEvents="box-none"
            >
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
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
