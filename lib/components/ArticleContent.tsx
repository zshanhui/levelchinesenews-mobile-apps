import * as Linking from 'expo-linking';
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
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import type { ParsedParagraph, WordSegment } from '../types';
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
      <Text style={[wordStyles.word, chineseFontStyle, { fontSize }]}>{text}</Text>
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
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { chineseFontStyle } = useFont();
  const [dictEntry, setDictEntry] = useState<{ definitions: string } | null>(null);
  const [lookupComplete, setLookupComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDictEntry(null);
    setLookupComplete(false);
    fetchDictEntryByWord(word).then((entry) => {
      if (!cancelled) {
        setDictEntry(entry ?? null);
        setLookupComplete(true);
      }
    });
    return () => { cancelled = true; };
  }, [word]);

  const openInPleco = useCallback(() => {
    const url = buildPlecoUrl(word, pinyin, articleId, highlightedWordKey, highlightedSentenceKey);
    Linking.openURL(url);
  }, [word, pinyin, articleId, highlightedWordKey, highlightedSentenceKey]);

  return (
    <View style={[styles.panel, { paddingBottom: Math.max(bottomInset, 16) }]}>
      <View style={styles.panelHeader}>
        <View style={styles.panelHeaderContent}>
          <Text style={[styles.panelWord, chineseFontStyle]}>{word}</Text>
          {pinyin ? (
            <Text style={[styles.panelPinyin, chineseFontStyle]}>{pinyin}</Text>
          ) : null}
        </View>
        <View style={styles.panelHeaderRight}>
          {showPlecoButton ? (
            <Pressable
              onPress={openInPleco}
              style={({ pressed }) => [styles.plecoButton, pressed && styles.plecoButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel={t('openInPleco')}
            >
              <Text style={styles.plecoButtonText}>{t('pleco')}</Text>
              <Ionicons name="search-outline" size={14} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={styles.panelDefinition}>
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

export function ArticleContent({
  parsedContent,
  selectedWord = null,
  highlightedWordKey = null,
  highlightedSentenceKey = null,
  onWordPress,
  onClosePanel,
  scrollViewRef,
  contentRef,
}: ArticleContentProps) {
  const { theme } = useTheme();
  const { showPinyin, lineSpacing, articleFontSize, chineseFontStyle } = useFont();
  const deferredFontSize = useDeferredValue(articleFontSize);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const spacing = LINE_SPACING[lineSpacing];
  const selectedSentenceRef = useRef<View | null>(null);

  useEffect(() => {
    if (!highlightedSentenceKey || !scrollViewRef?.current || !contentRef?.current) return;
    const task = InteractionManager.runAfterInteractions(() => {
      const sentenceNode = selectedSentenceRef.current;
      if (!sentenceNode) return;
      sentenceNode.measureLayout(
        contentRef.current!,
        (_x, y, _w, height) => {
          (scrollViewRef.current as unknown as View)?.measureInWindow((_sx, _sy, _sw, viewportHeight) => {
            const panelOverlayHeight = 140;
            const visibleHeight = Math.max(100, viewportHeight - panelOverlayHeight);
            const targetY = Math.max(0, y + height / 2 - visibleHeight / 2);
            scrollViewRef.current?.scrollTo({
              y: targetY,
              animated: true,
            });
          });
        },
        () => {}
      );
    });
    return () => task.cancel();
  }, [highlightedSentenceKey, scrollViewRef, contentRef]);

  const handleWordPress = useCallback(
    (wordText: string, pinyinText: string | null, wordKey: string, sentenceKey: string) => {
      onWordPress?.(wordText, pinyinText, wordKey, sentenceKey);
    },
    [onWordPress]
  );

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
            return (
              <View
                key={sIdx}
                ref={isSelected ? (node) => { selectedSentenceRef.current = node; } : undefined}
                collapsable={false}
                style={[
                  styles.sentenceWrapper,
                  {
                    marginBottom: spacing.sentenceMarginBottom,
                  },
                ]}
              >
                {isSelected ? (
                  <SentenceHighlightOverlay overlayStyle={styles.sentenceHighlightOverlay} />
                ) : null}
                <View
                  style={[
                    styles.sentence,
                    {
                      rowGap: spacing.sentenceMarginBottom,
                    },
                  ]}
                >
                {sentence.w.map((word, wIdx) => {
                  const wordKey = `${pIdx}-${sIdx}-${wIdx}`;
                  const tappable = !isNumberOrPunctuation(word.t);
                  return tappable ? (
                    <Pressable
                      key={wIdx}
                      onPress={() => handleWordPress(word.t, word.p ?? null, wordKey, sentenceKey)}
                      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                      style={({ pressed }) => [styles.wordPressable, pressed && styles.wordPressablePressed]}
                    >
                      <WordBlock
                        segment={word}
                        showPinyin={showPinyin}
                        highlighted={highlightedWordKey === wordKey}
                        fontSize={deferredFontSize}
                        chineseFontStyle={chineseFontStyle}
                        wordStyles={{
                          wordBlock: styles.wordBlock,
                          wordBlockHighlightBg: styles.wordBlockHighlightBg,
                          pinyin: styles.pinyin,
                          word: styles.word,
                        }}
                      />
                    </Pressable>
                  ) : (
                    <View key={wIdx} style={styles.wordPressable}>
                      <WordBlock
                        segment={word}
                        showPinyin={showPinyin}
                        highlighted={false}
                        fontSize={deferredFontSize}
                        chineseFontStyle={chineseFontStyle}
                        wordStyles={{
                          wordBlock: styles.wordBlock,
                          wordBlockHighlightBg: styles.wordBlockHighlightBg,
                          pinyin: styles.pinyin,
                          word: styles.word,
                        }}
                      />
                    </View>
                  );
                })}
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function createStyles(theme: Theme) {
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
    top: -5,
    left: -10,
    right: -10,
    bottom: -5,
    backgroundColor: theme.highlightOverlay,
    borderRadius: 8,
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
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
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
  panelWord: {
    fontSize: 22,
    color: theme.text,
    fontWeight: '600',
  },
  panelDefinition: {
    paddingTop: 8,
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
  plecoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#0078c3',
    borderRadius: 8,
  },
  plecoButtonPressed: {
    opacity: 0.9,
  },
  plecoButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '400',
  },
  });
}
