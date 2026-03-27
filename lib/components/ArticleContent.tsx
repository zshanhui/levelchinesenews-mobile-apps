import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import type { RefObject } from 'react';
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { i18n, useTranslation } from '../i18n';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Animated,
  InteractionManager,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ScrollView } from 'react-native';
import { useFont } from '../FontContext';
import { getTotalLcnDictEntriesCount } from '../localDatabase';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import type { ParsedParagraph, Sentence, WordSegment } from '../types';
import { SentenceTranslatePanel } from './SentenceTranslatePanel';
import { SentenceTranslateToggle } from './SentenceTranslateToggle';
import { fetchDictEntryByWord } from '../useLocalDictService';

const isWebLocalhost =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const showPlecoButton = Platform.OS !== 'web' || isWebLocalhost;

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
  onClosePanel?: () => void;
  scrollViewRef?: RefObject<ScrollView | null>;
  contentRef?: RefObject<View | null>;
  /** Native: show sentence bookmark on the selected sentence (web hides) */
  sentenceBookmarkEnabled?: boolean;
  /** DB bookmark as "pIdx-sIdx", or null */
  bookmarkedSentenceKey?: string | null;
  onSentenceBookmarkPress?: (sentenceKey: string) => void;
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

function buildPlecoUrl(
  word: string,
  pinyin: string | null,
  articleId: string,
  wordKey: string,
  sentenceKey: string
): string {
  const returnParams = new URLSearchParams({ word, wordKey, sentenceKey });
  const xSuccess = `lcn://article/${articleId}?${returnParams.toString()}`;

  const useSearch = word.length >= 3;
  const baseParams: Record<string, string> = {
    'x-source': i18n.t('plecoSource'),
    'x-success': xSuccess,
  };

  if (useSearch) {
    baseParams.q = word;
    return `plecoapi://x-callback-url/s?${new URLSearchParams(baseParams).toString()}`;
  }

  const dfParams = new URLSearchParams({ hw: word, ...baseParams });
  if (pinyin) dfParams.set('py', pinyin);
  return `plecoapi://x-callback-url/df?${dfParams.toString()}`;
}

export function SentenceStudyPanel({
  word,
  pinyin,
  articleId,
  highlightedWordKey,
  highlightedSentenceKey,
  bottomInset,
}: {
  word: string;
  pinyin: string | null;
  articleId: string;
  highlightedWordKey: string;
  highlightedSentenceKey: string;
  bottomInset: number;
}) {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { chineseFontStyle } = useFont();
  const [dictEntry, setDictEntry] = useState<{ definitions: string } | null>(null);
  const [lookupComplete, setLookupComplete] = useState(false);
  const [hasLocalDictData, setHasLocalDictData] = useState<boolean | null>(null);
  const [isPlecoInstalled, setIsPlecoInstalled] = useState(false);
  const stackPinyinUnderWord = word.length >= 4;

  useEffect(() => {
    let cancelled = false;
    setDictEntry(null);
    setLookupComplete(false);
    setHasLocalDictData(null);
    const runLookup = async () => {
      try {
        const [entry, totalCount] = await Promise.all([
          fetchDictEntryByWord(word),
          getTotalLcnDictEntriesCount(),
        ]);
        if (cancelled) return;
        setDictEntry(entry ?? null);
        setHasLocalDictData(totalCount > 0);
      } catch (err) {
        if (cancelled) return;
        console.warn(`Study panel lookup warning for "${word}":`, err);
        setDictEntry(null);
        setHasLocalDictData(false);
      } finally {
        if (!cancelled) {
          setLookupComplete(true);
        }
      }
    };
    void runLookup();
    return () => { cancelled = true; };
  }, [word]);

  useEffect(() => {
    let cancelled = false;
    if (!showPlecoButton) {
      setIsPlecoInstalled(false);
      return () => { cancelled = true; };
    }
    const checkPlecoAvailability = async () => {
      try {
        const available = await Linking.canOpenURL('plecoapi://');
        if (!cancelled) {
          setIsPlecoInstalled(available);
        }
      } catch {
        if (!cancelled) {
          setIsPlecoInstalled(false);
        }
      }
    };
    void checkPlecoAvailability();
    return () => { cancelled = true; };
  }, []);

  const openInPleco = useCallback(() => {
    const url = buildPlecoUrl(word, pinyin, articleId, highlightedWordKey, highlightedSentenceKey);
    Linking.openURL(url);
  }, [word, pinyin, articleId, highlightedWordKey, highlightedSentenceKey]);

  const openPlecoWebsite = useCallback(() => {
    Linking.openURL('https://www.pleco.com?from=levelchinesenews.app');
  }, []);

  const openLocalDictSettings = useCallback(() => {
    router.push('/settings/localdict');
  }, [router]);

  return (
    <View style={[styles.panel, { paddingBottom: Math.max(bottomInset, 16) }]}>
      <View style={styles.panelHeader}>
        <View
          style={[
            styles.panelHeaderContent,
            stackPinyinUnderWord ? styles.panelHeaderContentStacked : null,
          ]}
        >
          <Text style={[styles.panelWord, chineseFontStyle]}>{word}</Text>
          {pinyin ? (
            <Text
              style={[
                styles.panelPinyin,
                stackPinyinUnderWord ? styles.panelPinyinUnderWord : null,
                chineseFontStyle,
              ]}
            >
              {pinyin}
            </Text>
          ) : null}
        </View>
        <View style={styles.panelHeaderRight}>
          {showPlecoButton ? (
            <Pressable
              onPress={isPlecoInstalled ? openInPleco : openPlecoWebsite}
              style={({ pressed }) => [
                styles.plecoButton,
                !isPlecoInstalled ? styles.plecoWebsiteButton : null,
                pressed && styles.plecoButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={isPlecoInstalled ? t('openInPleco') : t('openPlecoWebsite')}
            >
              <Text
                style={[
                  styles.plecoButtonText,
                  !isPlecoInstalled ? styles.plecoWebsiteButtonText : null,
                ]}
              >
                {isPlecoInstalled ? t('pleco') : t('getPleco')}
              </Text>
              <Ionicons
                name={isPlecoInstalled ? 'search-outline' : 'open-outline'}
                size={isPlecoInstalled ? 14 : 12}
                color={isPlecoInstalled ? '#fff' : theme.textMuted}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={styles.panelDefinition}>
        {lookupComplete && !hasLocalDictData ? (
          <View style={styles.panelDefinitionMissingDict}>
            <Text style={[styles.panelDefinitionText, styles.panelDefinitionTextMissing, chineseFontStyle]}>
              {t('loadLocalDictFirstHint')}
            </Text>
            <Pressable onPress={openLocalDictSettings} accessibilityRole="button">
              {({ pressed }) => (
                <View style={[styles.panelDefinitionLinkRow, pressed && styles.panelDefinitionLinkRowPressed]}>
                  <Text style={styles.panelDefinitionLink}>{t('setupLocalDict')}</Text>
                  <Ionicons name="arrow-forward-outline" size={14} color={theme.accent} />
                </View>
              )}
            </Pressable>
          </View>
        ) : (
          <Text
            style={[
              styles.panelDefinitionText,
              dictEntry?.definitions ? styles.panelDefinitionTextLoaded : null,
              lookupComplete && !dictEntry?.definitions ? styles.panelDefinitionTextMissing : null,
              chineseFontStyle,
            ]}
          >
            {dictEntry?.definitions ??
              (lookupComplete ? t('wordMissingInLocalDict') : t('nativeLanguageDefinitionPlaceholder'))}
          </Text>
        )}
      </View>
    </View>
  );
}

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
  showPinyin,
  fontSize,
  chineseFontStyle,
  wordStyles,
  accentColor,
  textMutedColor,
  bookmarkAccessibilityLabel,
  translateAccessibilityLabel,
  rowStyles,
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
          const wordKey = `${pIdx}-${sIdx}-${wIdx}`;
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
          <SentenceTranslateToggle
            expanded={sentenceTranslateExpanded}
            onPress={onSentenceTranslatePress}
            accessibilityLabel={translateAccessibilityLabel}
            accentColor={accentColor}
            defaultColor={accentColor}
            buttonStyle={rowStyles.sentenceTranslateButton}
            buttonPressedStyle={rowStyles.sentenceTranslateButtonPressed}
          />
        ) : null}
      </View>
      {isSelected && sentenceTranslateExpanded ? (
        <SentenceTranslatePanel chineseText={sentenceChineseText} />
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
  onClosePanel,
  scrollViewRef,
  contentRef,
  sentenceBookmarkEnabled = false,
  bookmarkedSentenceKey = null,
  onSentenceBookmarkPress,
}: ArticleContentProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { showPinyin, lineSpacing, articleFontSize, chineseFontStyle } = useFont();
  const deferredFontSize = useDeferredValue(articleFontSize);
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const spacing = LINE_SPACING[lineSpacing];
  const selectedSentenceRef = useRef<View | null>(null);
  const bookmarkedSentenceRef = useRef<View | null>(null);
  const [sentenceTranslateExpanded, setSentenceTranslateExpanded] = useState(false);

  useEffect(() => {
    setSentenceTranslateExpanded(false);
  }, [highlightedSentenceKey]);

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

  const handleSentenceTranslatePress = useCallback(() => {
    setSentenceTranslateExpanded((prev) => !prev);
  }, []);

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
    const parts = highlightedWordKey.split('-');
    if (parts.length !== 3) return null;
    const wIdx = Number.parseInt(parts[2]!, 10);
    if (!Number.isFinite(wIdx)) return null;
    return { sentenceKey: `${parts[0]}-${parts[1]}`, wordIndex: wIdx };
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
            const sentenceKey = `${pIdx}-${sIdx}`;
            const isSelected = highlightedSentenceKey === sentenceKey;
            const isSentenceBookmarkedHere =
              bookmarkedSentenceKey != null &&
              bookmarkedSentenceKey === sentenceKey;
            const needsScrollTarget = isSelected || isSentenceBookmarkedHere;
            const highlightedWordIndex =
              highlightedWordLocation?.sentenceKey === sentenceKey
                ? highlightedWordLocation.wordIndex
                : null;
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
  sentenceTranslateButton: {
    marginLeft: 2,
    alignSelf: 'flex-end',
    marginTop: -10,
    marginBottom: 2,
    zIndex: 2,
    width: 27,
    height: 27,
    borderRadius: 13.5,
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
  panel: {
    backgroundColor: theme.surface,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  panelHeaderContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  panelHeaderContentStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  panelHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  panelPinyin: {
    fontSize: 14,
    color: theme.textMuted,
  },
  panelPinyinUnderWord: {
    fontSize: 13,
  },
  panelWord: {
    fontSize: 22,
    color: '#6a0000',
    fontWeight: '700',
  },
  panelDefinition: {
    paddingTop: 8,
  },
  panelDefinitionMissingDict: {
    gap: 8,
  },
  panelDefinitionText: {
    fontSize: 14,
    color: theme.textMuted,
  },
  panelDefinitionTextLoaded: {
    color: theme.textSecondary,
  },
  panelDefinitionTextMissing: {
    color: theme.textMuted,
    fontStyle: 'italic',
  },
  panelDefinitionLink: {
    fontSize: 14,
    color: theme.accent,
    textDecorationLine: 'underline',
  },
  panelDefinitionLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    alignSelf: 'flex-end',
  },
  panelDefinitionLinkRowPressed: {
    opacity: 0.75,
  },
  plecoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#0078c3',
    borderRadius: 8,
  },
  plecoWebsiteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 7,
  },
  plecoButtonPressed: {
    opacity: 0.9,
  },
  plecoButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '400',
  },
  plecoWebsiteButtonText: {
    color: theme.textMuted,
    fontSize: 12,
  },
  });
}
