import Ionicons from '@expo/vector-icons/Ionicons';
import { memo, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  View,
} from 'react-native';
import { NativeLanguage } from '../nativeLanguage';
import type { Theme } from '../theme';
import type { WordSegment } from '../types';
import { SentenceHelperBar } from './SentenceHelperBar';
import { SentenceTranslatePanel } from './SentenceTranslatePanel';

/**
 * Touch target for tappable word `Pressable`s = **layout** (glyph + optional pinyin in `WordBlock`)
 * plus this `hitSlop` (extra tappable margin outside the box).
 */
const WORD_SEGMENT_HIT_SLOP = { top: 14, bottom: 14, left: 8, right: 8 } as const;

/** Legacy pinyin vs `md` (18px) body — keep proportion when body size changes. */
const WORD_PINYIN_TO_BODY_RATIO = 11 / 18;

/** Filled bookmark when sentence is saved — distinct red on light and dark themes */
const BOOKMARK_SAVED_COLOR = '#c41e1a';

const BOOKMARK_ICON_BOX = 24;
const BOOKMARK_OUTLINE_ICON_SIZE = 22;
const BOOKMARK_SAVED_ICON_SIZE = 20;

export type ArticleSentenceRowStyles = {
  sentenceWrapper: object;
  sentenceHighlightOverlay: object;
  sentenceBookmarkButton: object;
  sentenceBookmarkButtonSaved: object;
  sentenceBookmarkButtonPressed: object;
  sentence: object;
  wordPressable: object;
  /** No margin between segments — used when pinyin is hidden, for stop words, and around
   * punctuation so text reads continuously. */
  wordPressableTight: object;
  wordPressablePressed: object;
  wordBlock: object;
  wordBlockHighlightBg: object;
  pinyin: object;
  word: object;
};

export type ArticleSentenceRowProps = {
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
  onAudioPress: () => void;
  audioIconColor: string;
  audioAccessibilityLabel: string;
  audioLoading: boolean;
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
  /** Stop words never show pinyin even when `showPinyin` is on */
  stopwordsSet?: ReadonlySet<string> | null;
  fontSize: number;
  articleContentFontStyle: { fontFamily?: string };
  articleContentPinyinFontStyle: { fontFamily?: string };
  styles: ArticleSentenceRowStyles;
  accentColor: string;
  bookmarkAccessibilityLabel: string;
  translateAccessibilityLabel: string;
};

export function createArticleSentenceRowStyles(theme: Theme, isDark: boolean) {
  const bookmarkShadow =
    Platform.OS === 'android'
      ? { elevation: 6 }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.5 : 0.32,
          shadowRadius: 3.5,
        };

  return StyleSheet.create({
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

/** True when the segment is an opening mark (（《「『" etc. — Unicode Ps / Pi) — hugs the
 * FOLLOWING word, so the mark itself gets no trailing margin.
 */
function isOpeningPunctuationSegment(text: string): boolean {
  if (!text || !text.trim()) return false;
  return /^[\p{Ps}\p{Pi}]+$/u.test(text.trim());
}

/** True when the segment is only punctuation/symbols (，。、%（）etc.) — rendered flush against
 * the preceding word, with no inter-segment spacing before it.
 */
function isPunctuationSegment(text: string): boolean {
  if (!text || !text.trim()) return false;
  return /^[\p{P}\p{S}]+$/u.test(text.trim());
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

/** Noto Sans SC has taller line boxes than the system UI font; tighten the pinyin↔hanzi stack. */
function notoWordStackTextStyles(
  pinyinFontSize: number,
  bodyFontSize: number,
  useNoto: boolean,
): { pinyin: TextStyle; word: TextStyle } {
  if (!useNoto) return { pinyin: {}, word: {} };
  const androidFontPadding =
    Platform.OS === 'android' ? ({ includeFontPadding: false } as const) : {};
  return {
    pinyin: {
      lineHeight: Math.round(pinyinFontSize * 1.25),
      ...androidFontPadding,
    },
    word: {
      marginTop: -Math.max(1, Math.round(bodyFontSize * 0.1)),
      lineHeight: Math.round(bodyFontSize * 1.8),
      ...androidFontPadding,
    },
  };
}

/**
 * Minimum height for a sentence row so the top-right bookmark control stays clear of
 * wrapped text on short sentences. Uses ~2× one flex line of body text.
 */
function minSentenceRowHeight(fontSize: number, showPinyin: boolean): number {
  const chineseLine = Math.ceil(fontSize * 1.28);
  const pinyinFontSize = Math.round(fontSize * WORD_PINYIN_TO_BODY_RATIO);
  const pinyinLine = showPinyin ? Math.ceil(pinyinFontSize * 1.25) : 0;
  return 2 * (pinyinLine + chineseLine);
}

const WordBlock = memo(function WordBlock({
  segment,
  showPinyin,
  highlighted,
  fontSize,
  articleContentFontStyle,
  articleContentPinyinFontStyle,
  styles,
}: {
  segment: WordSegment;
  showPinyin: boolean;
  highlighted: boolean;
  fontSize: number;
  articleContentFontStyle: { fontFamily?: string };
  articleContentPinyinFontStyle: { fontFamily?: string };
  styles: ArticleSentenceRowStyles;
}) {
  const text = segment.t;
  const pinyin = segment.p ?? '';
  const pinyinFontSize = Math.round(fontSize * WORD_PINYIN_TO_BODY_RATIO);
  const useNoto = articleContentPinyinFontStyle.fontFamily != null;
  const notoStack = notoWordStackTextStyles(pinyinFontSize, fontSize, useNoto);

  return (
    <View style={styles.wordBlock}>
      {highlighted ? (
        <View style={styles.wordBlockHighlightBg} pointerEvents="none" />
      ) : null}
      {showPinyin && pinyin ? (
        <Text
          style={[
            styles.pinyin,
            articleContentPinyinFontStyle,
            { fontSize: pinyinFontSize },
            notoStack.pinyin,
          ]}
        >
          {pinyin}
        </Text>
      ) : null}
      <Text
        style={[styles.word, articleContentFontStyle, { fontSize }, notoStack.word]}
        selectable={true}
      >
        {text}
      </Text>
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

export const ArticleSentenceRow = memo(function ArticleSentenceRow({
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
  onAudioPress,
  audioIconColor,
  audioAccessibilityLabel,
  audioLoading,
  translateIconColor,
  sentenceCachedTranslation,
  showPinyin,
  stopwordsSet = null,
  fontSize,
  articleContentFontStyle,
  articleContentPinyinFontStyle,
  styles,
  accentColor,
  bookmarkAccessibilityLabel,
  translateAccessibilityLabel,
  sentenceTranslateLoading,
  articleTranslationsGetLoading,
  articleTranslationsLoadingAccessibilityLabel,
  sentenceTranslatePanelErrorMessage,
  translationLang,
}: ArticleSentenceRowProps) {
  const showBookmarkControl =
    sentenceBookmarkEnabled && (isSelected || isSentenceBookmarkedHere);

  /** Sentences with few segments are too short for sentence-level translate in the UI. */
  const sentenceTranslateEligible = words.length > 5;

  const sentenceMinHeight = useMemo(
    () => minSentenceRowHeight(fontSize, showPinyin),
    [fontSize, showPinyin],
  );

  const wrapperStyle = useMemo(
    () => [
      styles.sentenceWrapper,
      {
        marginBottom: blockMarginBottom,
      },
    ],
    [styles.sentenceWrapper, blockMarginBottom],
  );

  const sentenceInnerStyle = useMemo(
    () => [
      styles.sentence,
      {
        rowGap: lineGap,
        minHeight: sentenceMinHeight,
      },
    ],
    [styles.sentence, lineGap, sentenceMinHeight],
  );

  return (
    <View
      collapsable={false}
      style={wrapperStyle}
    >
      {isSelected ? (
        <SentenceHighlightOverlay overlayStyle={styles.sentenceHighlightOverlay} />
      ) : null}
      {showBookmarkControl ? (
        <Pressable
          style={({ pressed }) => [
            styles.sentenceBookmarkButton,
            isSentenceBookmarkedHere && styles.sentenceBookmarkButtonSaved,
            pressed && styles.sentenceBookmarkButtonPressed,
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
        {words.map((word, wordIndex) => {
          const wordKey = `${paragraphIndex}:${sentenceIndex}:${wordIndex}`;
          const tappable = !isNonTappableSegment(word.t);
          const highlighted = highlightedWordIndex === wordIndex;
          const nextWord = words[wordIndex + 1];
          // Punctuation hugs its neighbor: drop THIS segment's trailing margin when the
          // next segment is punctuation-only (comma, period, %, closing marks), or when this
          // segment is an opening mark (（《「" — gap belongs after the following word).
          const nextIsPunctuation = nextWord != null && isPunctuationSegment(nextWord.t);
          const nextIsStopWord = nextWord != null && (stopwordsSet?.has(nextWord.t) ?? false);
          const isOpeningPunctuation = isOpeningPunctuationSegment(word.t);
          const isStopWordSegment = stopwordsSet?.has(word.t) ?? false;
          // Stop words are fully gapless: they hug the following word (0 own margin) and
          // the preceding word drops its margin too. Closing/opening punctuation hug likewise.
          const wordPressableLayout =
            showPinyin &&
            !isStopWordSegment &&
            !nextIsStopWord &&
            !nextIsPunctuation &&
            !isOpeningPunctuation
              ? styles.wordPressable
              : styles.wordPressableTight;
          const showWordPinyin = showPinyin && !isStopWordSegment;
          return tappable ? (
            <Pressable
              key={wordIndex}
              onPress={() => onWordPress(word.t, word.p ?? null, wordKey, sentenceKey)}
              hitSlop={WORD_SEGMENT_HIT_SLOP}
              style={({ pressed }) => [
                wordPressableLayout,
                pressed && styles.wordPressablePressed,
              ]}
            >
              <WordBlock
                segment={word}
                showPinyin={showWordPinyin}
                highlighted={highlighted}
                fontSize={fontSize}
                articleContentFontStyle={articleContentFontStyle}
                articleContentPinyinFontStyle={articleContentPinyinFontStyle}
                styles={styles}
              />
            </Pressable>
          ) : (
            <View key={wordIndex} style={wordPressableLayout}>
              <WordBlock
                segment={word}
                showPinyin={showWordPinyin}
                highlighted={false}
                fontSize={fontSize}
                articleContentFontStyle={articleContentFontStyle}
                articleContentPinyinFontStyle={articleContentPinyinFontStyle}
                styles={styles}
              />
            </View>
          );
        })}
      </View>
      {isSelected && sentenceTranslateEligible ? (
        <SentenceHelperBar
          onAudioPress={onAudioPress}
          audioAccessibilityLabel={audioAccessibilityLabel}
          audioIconColor={audioIconColor}
          audioLoading={audioLoading}
          sentenceTranslateExpanded={sentenceTranslateExpanded}
          onSentenceTranslatePress={onSentenceTranslatePress}
          translateAccessibilityLabel={
            sentenceTranslateLoading || articleTranslationsGetLoading
              ? articleTranslationsLoadingAccessibilityLabel
              : translateAccessibilityLabel
          }
          translateIconColor={translateIconColor}
          accentColor={accentColor}
          translateLoading={sentenceTranslateLoading || articleTranslationsGetLoading}
        />
      ) : null}
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
