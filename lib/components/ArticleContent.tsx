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
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
