import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from '../i18n';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FlashList, type ViewToken } from '@shopify/flash-list';
import {
  Animated,
  Platform,
  Pressable,
  type RefreshControlProps,
  StyleSheet,
  Text,
  type ViewStyle,
  View,
} from 'react-native';
import { NativeLanguage } from '../nativeLanguage';
import { useFont } from '../FontContext';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import type {
  ArticleTranslationsResponse,
  ParsedParagraph,
  Sentence,
  TranslationResponse,
  WordSegment,
} from '../types';
/** Sentence `FlashList` scroll (study highlight, DB bookmark) — see `useArticleSmartScroll` in `lib/scrolling-utils.ts`. */
import { useArticleSmartScroll } from '../scrolling-utils';
import { getCachedSentenceTranslationText } from '../useArticleTranslations';
import { useSentenceTranslationOnExpand } from '../useSentenceTranslationOnExpand';
import { SentenceTranslatePanel } from './SentenceTranslatePanel';
import { SentenceTranslateToggle } from './SentenceTranslateToggle';

/**
 * Touch target for tappable word `Pressable`s = **layout** (glyph + optional pinyin in `WordBlock`)
 * plus this `hitSlop` (extra tappable margin outside the box). Was 10/10/6/6; wider vertical
 * slop helps taps without overlapping neighbors as much as larger horizontal would.
 */
const WORD_SEGMENT_HIT_SLOP = { top: 14, bottom: 14, left: 8, right: 8 } as const;

export interface StudyPanelState {
  word: string;
  pinyin: string | null;
}

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
      const sentenceKey = `${paragraphIndex}:${sentenceIndex}`;
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
  /** Controlled panel state - when provided, parent handles panel rendering */
  selectedWord?: StudyPanelState | null;
  highlightedWordKey?: string | null;
  highlightedSentenceKey?: string | null;
  onWordPress?: (word: string, pinyin: string | null, wordKey: string, sentenceKey: string) => void;
  /** Native: show sentence bookmark on the selected sentence (web hides) */
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
}

const WordBlock = memo(function WordBlock({
  segment,
  showPinyin,
  highlighted,
  fontSize,
  chineseFontStyle,
  wordStyles,
}: {
  segment: WordSegment;
  showPinyin: boolean;
  highlighted: boolean;
  fontSize: number;
  chineseFontStyle: { fontFamily?: string };
  wordStyles: { wordBlock: object; wordBlockHighlightBg: object; pinyin: object; word: object };
}) {
  const text = segment.t;
  const pinyin = segment.p ?? '';

  return (
    <View style={wordStyles.wordBlock}>
      {highlighted ? (
        <View style={wordStyles.wordBlockHighlightBg} pointerEvents="none" />
      ) : null}
      {showPinyin && pinyin ? (
        <Text style={[wordStyles.pinyin, chineseFontStyle]}>{pinyin}</Text>
      ) : null}
      <Text style={[wordStyles.word, chineseFontStyle, { fontSize }]} selectable={true}>{text}</Text>
    </View>
  );
});

function SentenceHighlightOverlay({
  overlayStyle,
}: {
  overlayStyle: object;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [opacity]);
  return (
    <Animated.View
      style={[overlayStyle, { opacity }]}
      pointerEvents="none"
    />
  );
}

function sentenceFullText(sentence: Sentence): string {
  return sentence.f;
}

/**
 * True when the segment should not open the study panel: whitespace, numbers, punctuation,
 * and tokens that are only Latin script (English / loanwords), including apostrophes and hyphens.
 */
function isNonTappableSegment(text: string): boolean {
  if (!text || !text.trim()) return true;
  const t = text.trim();
  if (/^[\d０-９\s\p{P}\p{S}]+$/u.test(t)) return true;
  return /^[\p{Script=Latin}]+(?:['’\-][\p{Script=Latin}]+)*$/u.test(t);
}

const LINE_SPACING = {
  compact: { sentenceMarginBottom: 0, paragraphMarginBottom: 8 },
  normal: { sentenceMarginBottom: 6, paragraphMarginBottom: 24 },
  relaxed: { sentenceMarginBottom: 14, paragraphMarginBottom: 40 },
};

/** Matches `styles.pinyin` fontSize in WordBlock. */
const WORD_PINYIN_FONT_SIZE = 11;

/**
 * Minimum height for a sentence row so the top-right bookmark control and bottom-right
 * translate FAB (both absolutely positioned) stay vertically separated on short sentences.
 * Uses ~2× one flex line of body text (pinyin + hanzi when pinyin is on, else hanzi only).
 */
function minSentenceRowHeight(fontSize: number, showPinyin: boolean): number {
  const chineseLine = Math.ceil(fontSize * 1.28);
  const pinyinLine = showPinyin ? Math.ceil(WORD_PINYIN_FONT_SIZE * 1.25) : 0;
  return 2 * (pinyinLine + chineseLine);
}

/** Filled bookmark when sentence is saved — distinct red on light and dark themes */
const BOOKMARK_SAVED_COLOR = '#c41e1a';

const BOOKMARK_ICON_BOX = 24;
const BOOKMARK_OUTLINE_ICON_SIZE = 22;
const BOOKMARK_SAVED_ICON_SIZE = 20;

/** Reserve horizontal space so wrapped text does not sit under the absolutely positioned translate FAB. */
const SENTENCE_TRANSLATE_FAB_RESERVE = 0;

const SentenceBookmarkAnimatedIcon = memo(function SentenceBookmarkAnimatedIcon({
  saved,
  accentColor,
}: {
  saved: boolean;
  accentColor: string;
}) {
  const progress = useRef(new Animated.Value(saved ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const prevSavedRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    if (prevSavedRef.current === undefined) {
      prevSavedRef.current = saved;
      progress.setValue(saved ? 1 : 0);
      return;
    }
    if (prevSavedRef.current === saved) {
      return;
    }
    prevSavedRef.current = saved;
    scale.setValue(1);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(progress, {
          toValue: saved ? 1 : 0,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1.14,
          friction: 6,
          tension: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [saved, progress, scale]);

  const outlineOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 0],
  });
  const fillOpacity = progress;

  return (
    <View style={{ opacity: 0.7 }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <View
          style={{
            width: BOOKMARK_ICON_BOX,
            height: BOOKMARK_ICON_BOX,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              alignItems: 'center',
              justifyContent: 'center',
              opacity: outlineOpacity,
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons
            name="bookmark-outline"
            size={BOOKMARK_OUTLINE_ICON_SIZE}
            color={accentColor}
          />
        </Animated.View>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              alignItems: 'center',
              justifyContent: 'center',
              opacity: fillOpacity,
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons
            name="bookmark"
            size={BOOKMARK_SAVED_ICON_SIZE}
            color={BOOKMARK_SAVED_COLOR}
          />
        </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
});

type ArticleSentenceRowStyles = {
  sentenceWrapper: object;
  sentenceHighlightOverlay: object;
  sentenceTranslateButton: object;
  sentenceTranslateButtonFace: object;
  sentenceTranslateButtonPressed: object;
  sentenceBookmarkButton: object;
  sentenceBookmarkButtonSaved: object;
  sentenceBookmarkButtonPressed: object;
  sentence: object;
  wordPressable: object;
  /** No margin between segments — used when pinyin is hidden so text reads continuously. */
  wordPressableTight: object;
  wordPressablePressed: object;
};

const MemoArticleSentenceRow = memo(function MemoArticleSentenceRow({
  sentenceKey,
  paragraphIndex,
  sentenceIndex,
  words,
  isSelected,
  isSentenceBookmarkedHere,
  sentenceBookmarkEnabled,
  highlightedWordIndex,
  lineGap,
  blockMarginBottom,
  onWordPress,
  onSentenceBookmarkPress,
  sentenceChineseText,
  sentenceTranslateExpanded,
  onSentenceTranslatePress,
  translateIconColor,
  sentenceCachedTranslation,
  showPinyin,
  fontSize,
  chineseFontStyle,
  wordStyles,
  accentColor,
  bookmarkAccessibilityLabel,
  translateAccessibilityLabel,
  rowStyles,
  sentenceTranslateLoading,
  articleTranslationsGetLoading,
  articleTranslationsLoadingAccessibilityLabel,
  sentenceTranslatePanelErrorMessage,
  translationLang,
}: {
  sentenceKey: string;
  paragraphIndex: number;
  sentenceIndex: number;
  words: WordSegment[];
  isSelected: boolean;
  isSentenceBookmarkedHere: boolean;
  sentenceBookmarkEnabled: boolean;
  highlightedWordIndex: number | null;
  /** Line gap inside wrapped sentence (flex rowGap) */
  lineGap: number;
  /** Space below this sentence block (includes paragraph gap when last in paragraph) */
  blockMarginBottom: number;
  onWordPress: (word: string, pinyin: string | null, wordKey: string, sentenceKey: string) => void;
  onSentenceBookmarkPress?: (sentenceKey: string) => void;
  sentenceChineseText: string;
  sentenceTranslateExpanded: boolean;
  onSentenceTranslatePress: () => void;
  translateIconColor: string;
  sentenceCachedTranslation: string | null;
  /** POST /translations in flight for this sentence — toggle shows spinner */
  sentenceTranslateLoading: boolean;
  /** GET /translations in flight — toggle shows spinner until cache is ready */
  articleTranslationsGetLoading: boolean;
  /** a11y label for GET translations loader (e.g. `t('loading')`) */
  articleTranslationsLoadingAccessibilityLabel: string;
  /** Last POST failure for this sentence (e.g. offline); shown in panel */
  sentenceTranslatePanelErrorMessage: string | null;
  /** Learner target language — Google Translate link `tl=` */
  translationLang: NativeLanguage;
  showPinyin: boolean;
  fontSize: number;
  chineseFontStyle: { fontFamily?: string };
  wordStyles: {
    wordBlock: object;
    wordBlockHighlightBg: object;
    pinyin: object;
    word: object;
  };
  accentColor: string;
  textMutedColor: string;
  bookmarkAccessibilityLabel: string;
  translateAccessibilityLabel: string;
  rowStyles: ArticleSentenceRowStyles;
}) {
  const showBookmarkControl =
    sentenceBookmarkEnabled && (isSelected || isSentenceBookmarkedHere);

  /** Sentences with few segments are too short for sentence-level translate in the UI. */
  const sentenceTranslateEligible = words.length > 5;
  const showTranslateControl = isSelected && sentenceTranslateEligible;

  const sentenceMinHeight = useMemo(
    () => minSentenceRowHeight(fontSize, showPinyin),
    [fontSize, showPinyin],
  );

  const wrapperStyle = useMemo(
    () => [
      rowStyles.sentenceWrapper,
      {
        marginBottom: blockMarginBottom,
      },
    ],
    [rowStyles.sentenceWrapper, blockMarginBottom],
  );

  const sentenceInnerStyle = useMemo(
    () => [
      rowStyles.sentence,
      {
        rowGap: lineGap,
        paddingRight: SENTENCE_TRANSLATE_FAB_RESERVE,
        minHeight: sentenceMinHeight,
      },
    ],
    [rowStyles.sentence, lineGap, sentenceMinHeight],
  );

  return (
    <View
      collapsable={false}
      style={wrapperStyle}
    >
      {isSelected ? (
        <SentenceHighlightOverlay overlayStyle={rowStyles.sentenceHighlightOverlay} />
      ) : null}
      {showBookmarkControl ? (
        <Pressable
          style={({ pressed }) => [
            rowStyles.sentenceBookmarkButton,
            isSentenceBookmarkedHere && rowStyles.sentenceBookmarkButtonSaved,
            pressed && rowStyles.sentenceBookmarkButtonPressed,
          ]}
          onPress={() => onSentenceBookmarkPress?.(sentenceKey)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={bookmarkAccessibilityLabel}
        >
          <SentenceBookmarkAnimatedIcon
            saved={isSentenceBookmarkedHere}
            accentColor={accentColor}
          />
        </Pressable>
      ) : null}
      <View style={sentenceInnerStyle}>
        {words.map((word, wIdx) => {
          const wordKey = `${paragraphIndex}:${sentenceIndex}:${wIdx}`;
          const tappable = !isNonTappableSegment(word.t);
          const highlighted = highlightedWordIndex === wIdx;
          const wordPressableLayout = showPinyin
            ? rowStyles.wordPressable
            : rowStyles.wordPressableTight;
          return tappable ? (
            <Pressable
              key={wIdx}
              onPress={() => onWordPress(word.t, word.p ?? null, wordKey, sentenceKey)}
              hitSlop={WORD_SEGMENT_HIT_SLOP}
              style={({ pressed }) => [
                wordPressableLayout,
                pressed && rowStyles.wordPressablePressed,
              ]}
            >
              <WordBlock
                segment={word}
                showPinyin={showPinyin}
                highlighted={highlighted}
                fontSize={fontSize}
                chineseFontStyle={chineseFontStyle}
                wordStyles={wordStyles}
              />
            </Pressable>
          ) : (
            <Pressable
              key={wIdx}
              style={wordPressableLayout}
              onPress={() => {}}
              accessible={false}
              android_ripple={null}
            >
              <WordBlock
                segment={word}
                showPinyin={showPinyin}
                highlighted={false}
                fontSize={fontSize}
                chineseFontStyle={chineseFontStyle}
                wordStyles={wordStyles}
              />
            </Pressable>
          );
        })}
        {showTranslateControl ? (
          <SentenceTranslateToggle
            expanded={sentenceTranslateExpanded}
            onPress={onSentenceTranslatePress}
            accessibilityLabel={
              sentenceTranslateLoading || articleTranslationsGetLoading
                ? articleTranslationsLoadingAccessibilityLabel
                : translateAccessibilityLabel
            }
            iconColor={translateIconColor}
            accentColor={accentColor}
            loading={sentenceTranslateLoading || articleTranslationsGetLoading}
            hitStyle={rowStyles.sentenceTranslateButton}
            faceStyle={rowStyles.sentenceTranslateButtonFace}
            facePressedStyle={rowStyles.sentenceTranslateButtonPressed}
          />
        ) : null}
      </View>
      {isSelected && sentenceTranslateEligible && sentenceTranslateExpanded ? (
        <SentenceTranslatePanel
          chineseText={sentenceChineseText}
          translatedText={sentenceCachedTranslation}
          isTranslating={sentenceTranslateLoading}
          errorMessage={sentenceTranslatePanelErrorMessage}
          targetLang={translationLang}
        />
      ) : null}
    </View>
  );
});

export function ArticleContent({
  parsedContent,
  listHeader: articleHeader,
  listFooter: articleFooter,
  onLastSentenceBecameVisible,
  contentContainerStyle: contentContainerStyleProp,
  style: styleProp,
  refreshControl,
  selectedWord = null,
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
}: ArticleContentProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { showPinyin, lineSpacing, articleFontSize, chineseFontStyle } = useFont();
  const deferredFontSize = useDeferredValue(articleFontSize);
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
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
    () => ({
      itemVisiblePercentThreshold: 20,
      minimumViewTime: 200,
      waitForInteraction: false,
    }),
    [],
  );

  // List scroll: bookmark + highlight behavior — see `useArticleSmartScroll` in lib/scrolling-utils.ts
  const { listRef } = useArticleSmartScroll<ArticleSentenceListItem>({
    sentenceKeyToIndex,
    bookmarkedSentenceKey: bookmarkedSentenceKey ?? null,
    highlightedSentenceKey: highlightedSentenceKey ?? null,
    hasSelectedWord: selectedWord != null,
    parsedContentLength: parsedContent.length,
    articleId: articleId ?? null,
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

  const wordStylesBundle = useMemo(
    () => ({
      wordBlock: styles.wordBlock,
      wordBlockHighlightBg: styles.wordBlockHighlightBg,
      pinyin: styles.pinyin,
      word: styles.word,
    }),
    [styles.wordBlock, styles.wordBlockHighlightBg, styles.pinyin, styles.word],
  );

  const sentenceRowStyles = useMemo(
    (): ArticleSentenceRowStyles => ({
      sentenceWrapper: styles.sentenceWrapper,
      sentenceHighlightOverlay: styles.sentenceHighlightOverlay,
      sentenceTranslateButton: styles.sentenceTranslateButton,
      sentenceTranslateButtonFace: styles.sentenceTranslateButtonFace,
      sentenceTranslateButtonPressed: styles.sentenceTranslateButtonPressed,
      sentenceBookmarkButton: styles.sentenceBookmarkButton,
      sentenceBookmarkButtonSaved: styles.sentenceBookmarkButtonSaved,
      sentenceBookmarkButtonPressed: styles.sentenceBookmarkButtonPressed,
      sentence: styles.sentence,
      wordPressable: styles.wordPressable,
      wordPressableTight: styles.wordPressableTight,
      wordPressablePressed: styles.wordPressablePressed,
    }),
    [
      styles.sentenceWrapper,
      styles.sentenceHighlightOverlay,
      styles.sentenceTranslateButton,
      styles.sentenceTranslateButtonFace,
      styles.sentenceTranslateButtonPressed,
      styles.sentenceBookmarkButton,
      styles.sentenceBookmarkButtonSaved,
      styles.sentenceBookmarkButtonPressed,
      styles.sentence,
      styles.wordPressable,
      styles.wordPressableTight,
      styles.wordPressablePressed,
    ],
  );

  const highlightedWordLocation = useMemo(() => {
    if (!highlightedWordKey) return null;
    const parts = highlightedWordKey.split(':');
    if (parts.length !== 3) return null;
    const wIdx = Number.parseInt(parts[2]!, 10);
    if (!Number.isFinite(wIdx)) return null;
    return { sentenceKey: `${parts[0]}:${parts[1]}`, wordIndex: wIdx };
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
      const lineGap = spacing.sentenceMarginBottom;
      const blockMarginBottom = isLastInParagraph
        ? spacing.sentenceMarginBottom + spacing.paragraphMarginBottom
        : spacing.sentenceMarginBottom;
      return (
        <MemoArticleSentenceRow
          sentenceKey={sentenceKey}
          paragraphIndex={paragraphIndex}
          sentenceIndex={sentenceIndex}
          words={sentence.w}
          isSelected={isSelected}
          isSentenceBookmarkedHere={isSentenceBookmarkedHere}
          sentenceBookmarkEnabled={sentenceBookmarkEnabled}
          highlightedWordIndex={highlightedWordIndex}
          lineGap={lineGap}
          blockMarginBottom={blockMarginBottom}
          onWordPress={handleWordPress}
          onSentenceBookmarkPress={handleSentenceBookmarkPress}
          sentenceChineseText={sentenceFullText(sentence)}
          sentenceTranslateExpanded={isSelected && sentenceTranslateExpanded}
          onSentenceTranslatePress={handleSentenceTranslatePress}
          translateIconColor={translateIconColor}
          sentenceCachedTranslation={sentenceCachedTranslation}
          showPinyin={showPinyin}
          fontSize={deferredFontSize}
          chineseFontStyle={chineseFontStyle}
          wordStyles={wordStylesBundle}
          accentColor={theme.accent}
          textMutedColor={theme.textSecondary}
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
          rowStyles={sentenceRowStyles}
        />
      );
    },
    [
      articleTranslations,
      articleTranslationsLoading,
      bookmarkedSentenceKey,
      deferredFontSize,
      handleSentenceTranslatePress,
      handleWordPress,
      highlightedSentenceKey,
      highlightedWordLocation,
      handleSentenceBookmarkPress,
      sentenceBookmarkEnabled,
      sentenceRowStyles,
      sentenceTranslateError,
      sentenceTranslateExpanded,
      showPinyin,
      t,
      theme,
      theme.accent,
      theme.error,
      theme.readIndicatorMuted,
      theme.textSecondary,
      translatingSentenceKey,
      translationLangProp,
      wordStylesBundle,
      chineseFontStyle,
      spacing,
    ],
  );

  const listHeaderComposed = useMemo(
    () => (
      <>
        {articleHeader}
        <View style={styles.sentenceListTopSpacer} />
      </>
    ),
    [articleHeader, styles.sentenceListTopSpacer],
  );

  const listFooterComposed = useMemo(() => {
    if (articleFooter == null) {
      return <View style={styles.sentenceListTopSpacer} />;
    }
    return (
      <>
        <View style={styles.sentenceListTopSpacer} />
        {articleFooter}
      </>
    );
  }, [articleFooter, styles.sentenceListTopSpacer]);

  const keyExtractor = useCallback((item: ArticleSentenceListItem) => item.sentenceKey, []);

  const listExtraData = useMemo(
    () =>
      `${highlightedSentenceKey}\0${bookmarkedSentenceKey}\0${highlightedWordKey}\0${String(
        sentenceTranslateExpanded,
      )}`,
    [
      highlightedSentenceKey,
      bookmarkedSentenceKey,
      highlightedWordKey,
      sentenceTranslateExpanded,
    ],
  );

  if (!parsedContent?.length) {
    return null;
  }

  return (
    <FlashList
      ref={listRef}
      style={[styles.listRoot, styleProp]}
      data={flatData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={listHeaderComposed}
      ListFooterComponent={listFooterComposed}
      contentContainerStyle={contentContainerStyleProp}
      extraData={listExtraData}
      refreshControl={refreshControl}
      {...(onLastSentenceBecameVisible
        ? {
            viewabilityConfig: lastSentenceViewabilityConfig,
            onViewableItemsChanged,
          }
        : {})}
      showsVerticalScrollIndicator={true}
    />
  );
}

function createStyles(theme: Theme, isDark: boolean) {
  const bookmarkShadow =
    Platform.OS === 'android'
      ? { elevation: 6 }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.5 : 0.32,
          shadowRadius: 3.5,
        };

  const translateFabShadow =
    Platform.OS === 'android'
      ? { elevation: 2 }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.24 : 0.1,
          shadowRadius: 3,
        };

  return StyleSheet.create({
  listRoot: {
    flex: 1,
  },
  /** Matches former body `paddingVertical` gap after hero / before mark-read. */
  sentenceListTopSpacer: {
    height: 16,
  },
  sentenceWrapper: {
    position: 'relative',
    overflow: 'visible',
  },
  sentenceHighlightOverlay: {
    position: 'absolute',
    zIndex: 0,
    top: -5,
    left: -10,
    right: -10,
    bottom: -5,
    backgroundColor: theme.highlightOverlay,
    borderRadius: 8,
  },
  /** 27×27 touch target; anchored to bottom-right of sentence row (does not participate in flex wrap). */
  sentenceTranslateButton: {
    position: 'absolute',
    right: -10,
    bottom: 0,
    zIndex: 2,
    width: 27,
    height: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /** ~80% of hit area — visible FAB + icon */
  sentenceTranslateButtonFace: {
    width: 27 * 0.8,
    height: 27 * 0.8,
    borderRadius: (27 * 0.8) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.etchedBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    ...translateFabShadow,
  },
  sentenceTranslateButtonPressed: {
    opacity: 0.65,
  },
  sentenceBookmarkButton: {
    position: 'absolute',
    zIndex: 1,
    top: -22,
    right: -10,
    padding: 0,
    backgroundColor: 'transparent',
    ...bookmarkShadow,
  },
  sentenceBookmarkButtonSaved: {
    top: -19,
  },
  sentenceBookmarkButtonPressed: {
    opacity: 0.65,
  },
  sentence: {
    position: 'relative',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  wordPressable: {
    marginRight: 4,
  },
  wordPressableTight: {
    marginRight: 0,
  },
  wordPressablePressed: {
    opacity: 0.7,
  },
  wordBlock: {
    alignItems: 'center',
    position: 'relative',
  },
  wordBlockHighlightBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.highlightBg,
    borderRadius: 4,
    top: -1,
    bottom: -1,
    left: -2,
    right: -2,
  },
  pinyin: {
    fontSize: 11,
    color: theme.textMuted,
  },
  word: {
    fontSize: 18,
    color: theme.text,
  },
  });
}
