import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from '../i18n';
import { FlashList, type ViewToken } from '@shopify/flash-list';
import {
  type RefreshControlProps,
  StyleSheet,
  type ViewabilityConfig,
  type ViewStyle,
  View,
} from 'react-native';
import { NativeLanguage } from '../nativeLanguage';
import { useFont } from '../FontContext';
import { useTheme } from '../ThemeContext';
import type {
  ArticleAudioResponse,
  ArticleTranslationsResponse,
  AudioPostResponse,
  ParsedParagraph,
  Sentence,
  TranslationResponse,
} from '../types';
/** Sentence `FlashList` scroll (study highlight, DB bookmark) — see `useArticleSmartScroll` in `lib/scrolling-utils.ts`. */
import { useArticleSmartScroll } from '../scrolling-utils';
import { hasCachedSentenceAudio } from '../useArticleAudio';
import { getCachedSentenceTranslationText } from '../useArticleTranslations';
import { useSentenceAudioOnPress } from '../useSentenceAudioOnPress';
import { useSentenceAudioPlayer } from '../useSentenceAudioPlayer';
import { useLearnedWords } from '../useLearnedWords';
import { useHskHide } from '../useHskHide';
import { useStopwords } from '../useStopwords';
import { useSentenceTranslationOnExpand } from '../useSentenceTranslationOnExpand';
import { formatSentenceKey } from '../sentenceKeys';
import { sentenceFullText } from '../text-utils';
import {
  ArticleSentenceRow,
  createArticleSentenceRowStyles,
} from './ArticleSentenceRow';

/** One list row — flattened from `parsedContent` (paragraphs → sentences). */
export interface ArticleSentenceListItem {
  sentenceKey: string;
  paragraphIndex: number;
  sentenceIndex: number;
  sentence: Sentence;
  isLastInParagraph: boolean;
}

function flattenSentences(
  parsedContent: ParsedParagraph[],
): { flatData: ArticleSentenceListItem[]; sentenceKeyToIndex: Map<string, number> } {
  const flatData: ArticleSentenceListItem[] = [];
  const sentenceKeyToIndex = new Map<string, number>();
  parsedContent.forEach((paragraph, paragraphIndex) => {
    paragraph.s.forEach((sentence, sentenceIndex) => {
      const sentenceKey = formatSentenceKey(paragraphIndex, sentenceIndex);
      sentenceKeyToIndex.set(sentenceKey, flatData.length);
      flatData.push({
        sentenceKey,
        paragraphIndex,
        sentenceIndex,
        sentence,
        isLastInParagraph: sentenceIndex === paragraph.s.length - 1,
      });
    });
  });
  return { flatData, sentenceKeyToIndex };
}

export interface ArticleContentProps {
  parsedContent: ParsedParagraph[];
  /** Title, meta, hero image, etc. — part of the same scroll as body */
  listHeader: ReactNode;
  /** e.g. mark-read footer — same scroll */
  listFooter: ReactNode | null;
  /**
   * Native: fired once the last body sentence row is on screen (sufficiently visible) so callers can
   * reveal footer actions (e.g. mark read) only after the reader reaches the end.
   */
  onLastSentenceBecameVisible?: () => void;
  /** Merged with list body padding (see article screen) */
  contentContainerStyle?: ViewStyle | ViewStyle[];
  style?: ViewStyle;
  refreshControl?: ReactElement<RefreshControlProps>;
  highlightedWordKey?: string | null;
  highlightedSentenceKey?: string | null;
  onWordPress?: (word: string, pinyin: string | null, wordKey: string, sentenceKey: string) => void;
  /** Show sentence bookmark on the selected sentence */
  sentenceBookmarkEnabled?: boolean;
  /** DB bookmark as `paragraph:sentence` (matches API sentence keys), or null */
  bookmarkedSentenceKey?: string | null;
  onSentenceBookmarkPress?: (sentenceKey: string) => void;
  /** Cached sentence translations (GET /translations); used for translate icon color */
  articleTranslations?: ArticleTranslationsResponse | null;
  /** Must match the `lang` used when fetching `articleTranslations` */
  translationLang?: NativeLanguage;
  /** Article UUID — required for on-demand POST /translations when cache misses */
  articleId?: string;
  /** Merge POST result into `articleTranslations` without refetching GET */
  mergeTranslationFromPost?: (res: TranslationResponse) => void;
  /** True while GET /translations is in flight — translate control shows a loader */
  articleTranslationsLoading?: boolean;
  /** Cached sentence audio (GET /audio) */
  articleAudio?: ArticleAudioResponse | null;
  /** True while GET /audio is in flight */
  articleAudioLoading?: boolean;
  /** Merge POST /audio result into `articleAudio` without refetching GET */
  mergeAudioFromPost?: (res: AudioPostResponse) => void;
}

const LINE_SPACING = {
  compact: { sentenceMarginBottom: 0, paragraphMarginBottom: 8 },
  normal: { sentenceMarginBottom: 6, paragraphMarginBottom: 24 },
  relaxed: { sentenceMarginBottom: 14, paragraphMarginBottom: 40 },
};


export function ArticleContent({
  parsedContent,
  listHeader: articleHeader,
  listFooter: articleFooter,
  onLastSentenceBecameVisible,
  contentContainerStyle: contentContainerStyleProp,
  style: styleProp,
  refreshControl,
  highlightedWordKey = null,
  highlightedSentenceKey = null,
  onWordPress,
  sentenceBookmarkEnabled = false,
  bookmarkedSentenceKey = null,
  onSentenceBookmarkPress,
  articleTranslations = null,
  translationLang: translationLangProp,
  articleId,
  mergeTranslationFromPost,
  articleTranslationsLoading = false,
  articleAudio = null,
  articleAudioLoading = false,
  mergeAudioFromPost,
}: ArticleContentProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { stopwordsSet } = useStopwords();
  const { learnedSet, learnedRevision } = useLearnedWords();
  const { hideSet: hskHideSet, hideRevision: hskHideRevision } = useHskHide();
  const { showPinyin, showWordHighlight, lineSpacing, articleFontSize, articleContentFontStyle, articleContentPinyinFontStyle } =
    useFont();
  const deferredFontSize = useDeferredValue(articleFontSize);
  const listStyles = useMemo(() => createListStyles(), []);
  const rowStyles = useMemo(() => createArticleSentenceRowStyles(theme, isDark), [theme, isDark]);
  const spacing = LINE_SPACING[lineSpacing];
  const { flatData, sentenceKeyToIndex } = useMemo(
    () => flattenSentences(parsedContent),
    [parsedContent],
  );

  const onLastVisibleRef = useRef(onLastSentenceBecameVisible);
  onLastVisibleRef.current = onLastSentenceBecameVisible;
  const lastRowIndexRef = useRef(0);
  lastRowIndexRef.current = Math.max(0, flatData.length - 1);

  /** Stable handler — the list should not get a new `onViewableItemsChanged` every render. */
  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken<ArticleSentenceListItem>[];
      changed: ViewToken<ArticleSentenceListItem>[];
    }) => {
      const last = lastRowIndexRef.current;
      for (const token of viewableItems) {
        if (token.isViewable && token.index === last) {
          onLastVisibleRef.current?.();
          return;
        }
      }
    },
  ).current;

  const lastSentenceViewabilityConfig = useMemo(
    () =>
      ({
        itemVisiblePercentThreshold: 20,
        minimumViewTime: 200,
        waitForInteraction: false,
      }) satisfies ViewabilityConfig,
    [],
  );

  /** Rows where 100% of the cell is inside the list viewport (study scroll skips if focused sentence matches). */
  const fullSentenceViewabilityConfig = useMemo(
    () =>
      ({
        itemVisiblePercentThreshold: 100,
        minimumViewTime: 0,
        waitForInteraction: false,
      }) satisfies ViewabilityConfig,
    [],
  );

  const layoutRestoreKey = `${showPinyin ? '1' : '0'}\0${deferredFontSize}`;

  // List scroll: bookmark + highlight + typography restore — see `useArticleSmartScroll`
  const { listRef, fullyVisibleSentenceKeysRef, topVisibleSentenceKeyRef } =
    useArticleSmartScroll<ArticleSentenceListItem>({
      sentenceKeyToIndex,
      bookmarkedSentenceKey: bookmarkedSentenceKey ?? null,
      highlightedSentenceKey: highlightedSentenceKey ?? null,
      parsedContentLength: parsedContent.length,
      articleId: articleId ?? null,
      sentenceListLength: flatData.length,
      layoutRestoreKey,
    });

  const onFullyVisibleItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken<ArticleSentenceListItem>[];
      changed: ViewToken<ArticleSentenceListItem>[];
    }) => {
      const next = new Set<string>();
      for (const token of viewableItems) {
        if (token.isViewable && token.item?.sentenceKey) {
          next.add(token.item.sentenceKey);
        }
      }
      fullyVisibleSentenceKeysRef.current = next;
    },
    [fullyVisibleSentenceKeysRef],
  );

  const onTopVisibleItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken<ArticleSentenceListItem>[];
      changed: ViewToken<ArticleSentenceListItem>[];
    }) => {
      let topIndex = Number.POSITIVE_INFINITY;
      let topKey: string | null = null;
      for (const token of viewableItems) {
        if (
          !token.isViewable ||
          token.index == null ||
          !token.item?.sentenceKey
        ) {
          continue;
        }
        if (token.index < topIndex) {
          topIndex = token.index;
          topKey = token.item.sentenceKey;
        }
      }
      topVisibleSentenceKeyRef.current = topKey;
    },
    [topVisibleSentenceKeyRef],
  );

  const topSentenceViewabilityConfig = useMemo(
    () =>
      ({
        itemVisiblePercentThreshold: 1,
        minimumViewTime: 0,
        waitForInteraction: false,
      }) satisfies ViewabilityConfig,
    [],
  );

  const viewabilityConfigCallbackPairs = useMemo(() => {
    const fullPair = {
      viewabilityConfig: fullSentenceViewabilityConfig,
      onViewableItemsChanged: onFullyVisibleItemsChanged,
    };
    const topPair = {
      viewabilityConfig: topSentenceViewabilityConfig,
      onViewableItemsChanged: onTopVisibleItemsChanged,
    };
    if (!onLastSentenceBecameVisible) {
      return [fullPair, topPair];
    }
    return [
      {
        viewabilityConfig: lastSentenceViewabilityConfig,
        onViewableItemsChanged,
      },
      fullPair,
      topPair,
    ];
  }, [
    fullSentenceViewabilityConfig,
    lastSentenceViewabilityConfig,
    onFullyVisibleItemsChanged,
    onLastSentenceBecameVisible,
    onTopVisibleItemsChanged,
    onViewableItemsChanged,
    topSentenceViewabilityConfig,
  ]);

  const {
    play: playSentenceAudio,
    stop: stopSentenceAudio,
    playingSentenceKey,
    loadingSentenceKey,
  } = useSentenceAudioPlayer();

  const {
    onAudioPress: handleAudioPress,
    generatingAudioSentenceKey,
    sentenceAudioError,
  } = useSentenceAudioOnPress({
    articleId,
    articleAudio,
    highlightedSentenceKey,
    mergeAudioFromPost,
    playSentenceAudio,
  });

  const {
    sentenceTranslateExpanded,
    translatingSentenceKey,
    sentenceTranslateError,
    onSentenceTranslatePress: handleSentenceTranslatePress,
  } = useSentenceTranslationOnExpand({
    parsedContent,
    highlightedSentenceKey,
    articleTranslations,
    translationLang: translationLangProp,
    articleId,
    mergeTranslationFromPost,
  });

  const handleWordPress = useCallback(
    (wordText: string, pinyinText: string | null, wordKey: string, sentenceKey: string) => {
      onWordPress?.(wordText, pinyinText, wordKey, sentenceKey);
    },
    [onWordPress]
  );

  const handleSentenceBookmarkPress = useCallback(
    (sk: string) => {
      onSentenceBookmarkPress?.(sk);
    },
    [onSentenceBookmarkPress],
  );

  const stopSentenceAudioRef = useRef(stopSentenceAudio);
  stopSentenceAudioRef.current = stopSentenceAudio;

  const prevArticleIdRef = useRef<string | undefined>(articleId);
  useEffect(() => {
    const prev = prevArticleIdRef.current;
    prevArticleIdRef.current = articleId;
    if (prev !== undefined && prev !== articleId) {
      stopSentenceAudioRef.current();
    }
  }, [articleId]);

  useEffect(() => {
    if (!highlightedSentenceKey) {
      stopSentenceAudioRef.current();
    }
  }, [highlightedSentenceKey]);

  useEffect(() => {
    return () => {
      stopSentenceAudioRef.current();
    };
  }, []);

  const highlightedWordLocation = useMemo(() => {
    if (!highlightedWordKey) return null;
    const parts = highlightedWordKey.split(':');
    if (parts.length !== 3) return null;
    const wordIndex = Number.parseInt(parts[2]!, 10);
    if (!Number.isFinite(wordIndex)) return null;
    return { sentenceKey: `${parts[0]}:${parts[1]}`, wordIndex };
  }, [highlightedWordKey]);

  const renderItem = useCallback(
    ({ item }: { item: ArticleSentenceListItem }) => {
      const { sentenceKey, paragraphIndex, sentenceIndex, sentence, isLastInParagraph } = item;
      const isSelected = highlightedSentenceKey === sentenceKey;
      const isSentenceBookmarkedHere =
        bookmarkedSentenceKey != null && bookmarkedSentenceKey === sentenceKey;
      const highlightedWordIndex =
        highlightedWordLocation?.sentenceKey === sentenceKey
          ? highlightedWordLocation.wordIndex
          : null;
      const sentenceCachedTranslation = getCachedSentenceTranslationText(
        articleTranslations,
        translationLangProp,
        sentenceKey,
      );
      const translationAvailable = sentenceCachedTranslation != null;
      const translateIconColor = translationAvailable
        ? theme.error
        : theme.readIndicatorMuted;
      const audioAvailable = hasCachedSentenceAudio(articleAudio, sentenceKey);
      const audioIconColor = audioAvailable ? theme.error : theme.readIndicatorMuted;
      const sentenceAudioGenerating = generatingAudioSentenceKey === sentenceKey;
      const sentenceAudioLoading =
        isSelected &&
        (loadingSentenceKey === sentenceKey ||
          articleAudioLoading ||
          sentenceAudioGenerating);
      const lineGap = spacing.sentenceMarginBottom;
      const blockMarginBottom = isLastInParagraph
        ? spacing.sentenceMarginBottom + spacing.paragraphMarginBottom
        : spacing.sentenceMarginBottom;
      return (
        <ArticleSentenceRow
          sentenceKey={sentenceKey}
          paragraphIndex={paragraphIndex}
          sentenceIndex={sentenceIndex}
          words={sentence.w}
          isSelected={isSelected}
          isSentenceBookmarkedHere={isSentenceBookmarkedHere}
          sentenceBookmarkEnabled={sentenceBookmarkEnabled}
          highlightedWordIndex={highlightedWordIndex}
          wordHighlightEnabled={showWordHighlight}
          lineGap={lineGap}
          blockMarginBottom={blockMarginBottom}
          onWordPress={handleWordPress}
          onSentenceBookmarkPress={handleSentenceBookmarkPress}
          sentenceChineseText={sentenceFullText(sentence)}
          sentenceTranslateExpanded={isSelected && sentenceTranslateExpanded}
          onSentenceTranslatePress={handleSentenceTranslatePress}
          onAudioPress={() => handleAudioPress(sentenceKey)}
          audioIconColor={audioIconColor}
          audioAccessibilityLabel={
            sentenceAudioLoading
              ? t('loading')
              : isSelected && sentenceAudioError
                ? sentenceAudioError
                : playingSentenceKey === sentenceKey
                  ? 'Stop sentence audio'
                  : audioAvailable
                    ? 'Play sentence audio'
                    : 'Generate sentence audio'
          }
          audioLoading={sentenceAudioLoading}
          translateIconColor={translateIconColor}
          sentenceCachedTranslation={sentenceCachedTranslation}
          showPinyin={showPinyin}
          stopwordsSet={stopwordsSet}
          learnedSet={learnedSet}
          hskHideSet={hskHideSet}
          fontSize={deferredFontSize}
          articleContentFontStyle={articleContentFontStyle}
          articleContentPinyinFontStyle={articleContentPinyinFontStyle}
          styles={rowStyles}
          accentColor={theme.accent}
          bookmarkAccessibilityLabel={
            isSentenceBookmarkedHere ? t('removeSentenceBookmark') : t('bookmarkSentence')
          }
          translateAccessibilityLabel={
            sentenceTranslateExpanded && isSelected
              ? 'Hide sentence translation'
              : 'Translate sentence'
          }
          sentenceTranslateLoading={isSelected && translatingSentenceKey === sentenceKey}
          articleTranslationsGetLoading={articleTranslationsLoading}
          articleTranslationsLoadingAccessibilityLabel={t('loading')}
          sentenceTranslatePanelErrorMessage={isSelected ? sentenceTranslateError : null}
          translationLang={translationLangProp ?? NativeLanguage.EN}
        />
      );
    },
    [
      articleAudio,
      articleAudioLoading,
      articleTranslations,
      articleTranslationsLoading,
      bookmarkedSentenceKey,
      deferredFontSize,
      generatingAudioSentenceKey,
      handleAudioPress,
      handleSentenceTranslatePress,
      loadingSentenceKey,
      playingSentenceKey,
      handleWordPress,
      highlightedSentenceKey,
      highlightedWordLocation,
      handleSentenceBookmarkPress,
      sentenceAudioError,
      sentenceBookmarkEnabled,
      rowStyles,
      sentenceTranslateError,
      sentenceTranslateExpanded,
      showPinyin,
      showWordHighlight,
      stopwordsSet,
      learnedSet,
      hskHideSet,
      t,
      theme,
      translatingSentenceKey,
      translationLangProp,
      articleContentFontStyle,
      articleContentPinyinFontStyle,
      spacing,
    ],
  );

  const listHeaderComposed = useMemo(
    () => (
      <>
        {articleHeader}
        <View style={listStyles.sentenceListTopSpacer} />
      </>
    ),
    [articleHeader, listStyles.sentenceListTopSpacer],
  );

  const listFooterComposed = useMemo(() => {
    if (articleFooter == null) {
      return <View style={listStyles.sentenceListTopSpacer} />;
    }
    return (
      <>
        <View style={listStyles.sentenceListTopSpacer} />
        {articleFooter}
      </>
    );
  }, [articleFooter, listStyles.sentenceListTopSpacer]);

  const keyExtractor = useCallback((item: ArticleSentenceListItem) => item.sentenceKey, []);

  /** Fingerprint so rows re-render once when stopwords resolve (pinyin hidden per word). */
  const stopwordsKey = useMemo(
    () => [...stopwordsSet].join('\0'),
    [stopwordsSet],
  );

  // FlashList only re-renders rows when `data` or `extraData` changes. Audio lives
  // outside row items, so fingerprint voice + sentence keys to bust row memoization.
  const articleAudioCacheKey = useMemo(() => {
    if (!articleAudio?.article_sentence) return '0';
    return `${articleAudio.default_voice_id}\0${Object.keys(articleAudio.article_sentence).join('|')}`;
  }, [articleAudio]);

  const listExtraData = useMemo(
    () =>
      `${highlightedSentenceKey}\0${bookmarkedSentenceKey}\0${highlightedWordKey}\0${String(
        sentenceTranslateExpanded,
      )}\0${playingSentenceKey}\0${loadingSentenceKey}\0${generatingAudioSentenceKey}\0${
        sentenceAudioError ?? ''
      }\0${String(articleAudioLoading)}\0${articleAudioCacheKey}\0${stopwordsKey}\0${learnedRevision}\0${hskHideRevision}\0${showPinyin ? '1' : '0'}\0${deferredFontSize}`,
    [
      highlightedSentenceKey,
      bookmarkedSentenceKey,
      highlightedWordKey,
      sentenceTranslateExpanded,
      playingSentenceKey,
      loadingSentenceKey,
      generatingAudioSentenceKey,
      sentenceAudioError,
      articleAudioLoading,
      articleAudioCacheKey,
      stopwordsKey,
      learnedRevision,
      hskHideRevision,
      showPinyin,
      deferredFontSize,
    ],
  );

  if (!parsedContent?.length) {
    return null;
  }

  return (
    <FlashList
      ref={listRef}
      style={StyleSheet.flatten([listStyles.listRoot, styleProp])}
      data={flatData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={listHeaderComposed}
      ListFooterComponent={listFooterComposed}
      contentContainerStyle={contentContainerStyleProp}
      extraData={listExtraData}
      refreshControl={refreshControl}
      viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
      showsVerticalScrollIndicator={true}
    />
  );
}

function createListStyles() {
  return StyleSheet.create({
    listRoot: {
      flex: 1,
    },
    /** Matches former body `paddingVertical` gap after hero / before mark-read. */
    sentenceListTopSpacer: {
      height: 16,
    },
  });
}
