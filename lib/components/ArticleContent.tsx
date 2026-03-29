import type { RefObject } from 'react';
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from '../i18n';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActivityIndicator,
  Animated,
  InteractionManager,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ScrollView } from 'react-native';
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
import { getCachedSentenceTranslationText } from '../useArticleTranslations';
import { useSentenceTranslationOnExpand } from '../useSentenceTranslationOnExpand';
import { SentenceTranslatePanel } from './SentenceTranslatePanel';
import { SentenceTranslateToggle } from './SentenceTranslateToggle';

export interface StudyPanelState {
  word: string;
  pinyin: string | null;
}

export interface ArticleContentProps {
  parsedContent: ParsedParagraph[];
  /** Controlled panel state - when provided, parent handles panel rendering */
  selectedWord?: StudyPanelState | null;
  highlightedWordKey?: string | null;
  highlightedSentenceKey?: string | null;
  onWordPress?: (word: string, pinyin: string | null, wordKey: string, sentenceKey: string) => void;
  scrollViewRef?: RefObject<ScrollView | null>;
  contentRef?: RefObject<View | null>;
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

/** Returns true if the segment should not be tappable (numbers, punctuation, whitespace) */
function isNumberOrPunctuation(text: string): boolean {
  if (!text || !text.trim()) return true;
  return /^[\d０-９\s\p{P}\p{S}]+$/u.test(text);
}

const LINE_SPACING = {
  compact: { sentenceMarginBottom: 0, paragraphMarginBottom: 8 },
  normal: { sentenceMarginBottom: 6, paragraphMarginBottom: 24 },
  relaxed: { sentenceMarginBottom: 14, paragraphMarginBottom: 40 },
};

const STUDY_PANEL_SCROLL_RESERVE = 140;
const BOOKMARK_ONLY_SCROLL_RESERVE = 32;

/** Filled bookmark when sentence is saved — distinct red on light and dark themes */
const BOOKMARK_SAVED_COLOR = '#c41e1a';

const BOOKMARK_ICON_BOX = 24;

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
          <Ionicons name="bookmark-outline" size={22} color={accentColor} />
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
          <Ionicons name="bookmark" size={22} color={BOOKMARK_SAVED_COLOR} />
        </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
});

function scrollSentenceIntoScrollView(
  sentenceNode: View,
  contentRef: View,
  scrollViewRef: RefObject<ScrollView | null>,
  bottomReserve: number,
) {
  sentenceNode.measureLayout(
    contentRef,
    (_x, y, _w, height) => {
      (scrollViewRef.current as unknown as View)?.measureInWindow(
        (_sx, _sy, _sw, viewportHeight) => {
          const visibleHeight = Math.max(100, viewportHeight - bottomReserve);
          const targetY = Math.max(0, y + height / 2 - visibleHeight / 2);
          scrollViewRef.current?.scrollTo({
            y: targetY,
            animated: true,
          });
        },
      );
    },
    () => {},
  );
}

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
  wordPressablePressed: object;
};

const MemoArticleSentenceRow = memo(function MemoArticleSentenceRow({
  sentenceKey,
  pIdx,
  sIdx,
  words,
  isSelected,
  isSentenceBookmarkedHere,
  sentenceBookmarkEnabled,
  highlightedWordIndex,
  sentenceMarginBottom,
  wrapperRef,
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
  textMutedColor,
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
  pIdx: number;
  sIdx: number;
  words: WordSegment[];
  isSelected: boolean;
  isSentenceBookmarkedHere: boolean;
  sentenceBookmarkEnabled: boolean;
  highlightedWordIndex: number | null;
  sentenceMarginBottom: number;
  wrapperRef?: (node: View | null) => void;
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

  const showTranslateControl = isSelected;

  const wrapperStyle = useMemo(
    () => [
      rowStyles.sentenceWrapper,
      {
        marginBottom: sentenceMarginBottom,
      },
    ],
    [rowStyles.sentenceWrapper, sentenceMarginBottom],
  );

  const sentenceInnerStyle = useMemo(
    () => [
      rowStyles.sentence,
      {
        rowGap: sentenceMarginBottom,
      },
    ],
    [rowStyles.sentence, sentenceMarginBottom],
  );

  return (
    <View
      ref={wrapperRef}
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
          const wordKey = `${pIdx}:${sIdx}:${wIdx}`;
          const tappable = !isNumberOrPunctuation(word.t);
          const highlighted = highlightedWordIndex === wIdx;
          return tappable ? (
            <Pressable
              key={wIdx}
              onPress={() => onWordPress(word.t, word.p ?? null, wordKey, sentenceKey)}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              style={({ pressed }) => [
                rowStyles.wordPressable,
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
            <View key={wIdx} style={rowStyles.wordPressable}>
              <WordBlock
                segment={word}
                showPinyin={showPinyin}
                highlighted={false}
                fontSize={fontSize}
                chineseFontStyle={chineseFontStyle}
                wordStyles={wordStyles}
              />
            </View>
          );
        })}
        {showTranslateControl ? (
          sentenceTranslateLoading ? (
            <View
              style={rowStyles.sentenceTranslateButton}
              accessibilityRole="progressbar"
              accessibilityLabel="Translating"
            >
              <View style={rowStyles.sentenceTranslateButtonFace}>
                <ActivityIndicator size="small" color={accentColor} />
              </View>
            </View>
          ) : articleTranslationsGetLoading ? (
            <View
              style={rowStyles.sentenceTranslateButton}
              accessibilityRole="progressbar"
              accessibilityLabel={articleTranslationsLoadingAccessibilityLabel}
            >
              <View style={rowStyles.sentenceTranslateButtonFace}>
                <ActivityIndicator size="small" color={accentColor} />
              </View>
            </View>
          ) : (
            <SentenceTranslateToggle
              expanded={sentenceTranslateExpanded}
              onPress={onSentenceTranslatePress}
              accessibilityLabel={translateAccessibilityLabel}
              iconColor={translateIconColor}
              hitStyle={rowStyles.sentenceTranslateButton}
              faceStyle={rowStyles.sentenceTranslateButtonFace}
              facePressedStyle={rowStyles.sentenceTranslateButtonPressed}
            />
          )
        ) : null}
      </View>
      {isSelected && sentenceTranslateExpanded ? (
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
  selectedWord = null,
  highlightedWordKey = null,
  highlightedSentenceKey = null,
  onWordPress,
  scrollViewRef,
  contentRef,
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
  const selectedSentenceRef = useRef<View | null>(null);
  const bookmarkedSentenceRef = useRef<View | null>(null);
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

  useEffect(() => {
    if (!highlightedSentenceKey) {
      selectedSentenceRef.current = null;
    }
  }, [highlightedSentenceKey]);

  useEffect(() => {
    if (!bookmarkedSentenceKey) {
      bookmarkedSentenceRef.current = null;
    }
  }, [bookmarkedSentenceKey]);

  useEffect(() => {
    if (!highlightedSentenceKey || !scrollViewRef?.current || !contentRef?.current) {
      return;
    }
    const bottomReserve = selectedWord
      ? STUDY_PANEL_SCROLL_RESERVE
      : BOOKMARK_ONLY_SCROLL_RESERVE;
    const task = InteractionManager.runAfterInteractions(() => {
      const sentenceNode = selectedSentenceRef.current;
      const content = contentRef.current;
      if (!sentenceNode || !content) return;
      scrollSentenceIntoScrollView(
        sentenceNode,
        content,
        scrollViewRef,
        bottomReserve,
      );
    });
    return () => task.cancel();
  }, [
    highlightedSentenceKey,
    selectedWord,
    scrollViewRef,
    contentRef,
  ]);

  useEffect(() => {
    if (
      !bookmarkedSentenceKey ||
      highlightedSentenceKey ||
      !scrollViewRef?.current ||
      !contentRef?.current
    ) {
      return;
    }
    const content = contentRef.current;
    const tryScroll = () => {
      const sentenceNode = bookmarkedSentenceRef.current;
      if (!sentenceNode || !content) return;
      scrollSentenceIntoScrollView(
        sentenceNode,
        content,
        scrollViewRef,
        BOOKMARK_ONLY_SCROLL_RESERVE,
      );
    };
    let raf: number | null = null;
    const task = InteractionManager.runAfterInteractions(() => {
      tryScroll();
      raf = requestAnimationFrame(tryScroll);
    });
    return () => {
      task.cancel();
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [
    bookmarkedSentenceKey,
    highlightedSentenceKey,
    parsedContent,
    scrollViewRef,
    contentRef,
  ]);

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

  if (!parsedContent?.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      {parsedContent.map((paragraph, pIdx) => (
        <View
          key={pIdx}
          style={[styles.paragraph, { marginBottom: spacing.paragraphMarginBottom }]}
        >
          {paragraph.s.map((sentence, sIdx) => {
            const sentenceKey = `${pIdx}:${sIdx}`;
            const isSelected = highlightedSentenceKey === sentenceKey;
            const isSentenceBookmarkedHere =
              bookmarkedSentenceKey != null &&
              bookmarkedSentenceKey === sentenceKey;
            const needsScrollTarget = isSelected || isSentenceBookmarkedHere;
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
            return (
              <MemoArticleSentenceRow
                key={sentenceKey}
                sentenceKey={sentenceKey}
                pIdx={pIdx}
                sIdx={sIdx}
                words={sentence.w}
                isSelected={isSelected}
                isSentenceBookmarkedHere={isSentenceBookmarkedHere}
                sentenceBookmarkEnabled={sentenceBookmarkEnabled}
                highlightedWordIndex={highlightedWordIndex}
                sentenceMarginBottom={spacing.sentenceMarginBottom}
                wrapperRef={
                  needsScrollTarget
                    ? (node) => {
                        if (isSelected) {
                          selectedSentenceRef.current = node;
                        }
                        if (isSentenceBookmarkedHere) {
                          bookmarkedSentenceRef.current = node;
                        }
                      }
                    : undefined
                }
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
                  isSentenceBookmarkedHere
                    ? t('removeSentenceBookmark')
                    : t('bookmarkSentence')
                }
                translateAccessibilityLabel={
                  sentenceTranslateExpanded && isSelected
                    ? 'Hide sentence translation'
                    : 'Translate sentence'
                }
                sentenceTranslateLoading={translatingSentenceKey === sentenceKey}
                articleTranslationsGetLoading={articleTranslationsLoading}
                articleTranslationsLoadingAccessibilityLabel={t('loading')}
                sentenceTranslatePanelErrorMessage={
                  isSelected ? sentenceTranslateError : null
                }
                translationLang={translationLangProp ?? NativeLanguage.EN}
                rowStyles={sentenceRowStyles}
              />
            );
          })}
        </View>
      ))}
    </View>
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
  container: {
    paddingVertical: 16,
  },
  paragraph: {
    flexDirection: 'column',
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
  /** 27×27 touch target; visual circle is smaller (see `sentenceTranslateButtonFace`) */
  sentenceTranslateButton: {
    marginLeft: 2,
    alignSelf: 'flex-end',
    marginTop: -10,
    marginBottom: 2,
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
    right: -12,
    padding: 2,
    backgroundColor: 'transparent',
    ...bookmarkShadow,
  },
  sentenceBookmarkButtonSaved: {
    top: -17,
  },
  sentenceBookmarkButtonPressed: {
    opacity: 0.65,
  },
  sentence: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  wordPressable: {
    marginRight: 4,
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
