import type { RefObject } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import {
  InteractionManager,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ScrollView } from 'react-native';
import type { LineSpacingLevel } from '../FontContext';
import { useFont } from '../FontContext';
import { theme } from '../theme';
import type { ParsedParagraph, WordSegment } from '../types';

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

function WordBlock({
  segment,
  showPinyin,
  highlighted,
}: {
  segment: WordSegment;
  showPinyin: boolean;
  highlighted: boolean;
}) {
  const { chineseFontStyle } = useFont();
  const text = segment.t;
  const pinyin = segment.p ?? '';

  return (
    <View style={styles.wordBlock}>
      {highlighted ? (
        <View style={styles.wordBlockHighlightBg} pointerEvents="none" />
      ) : null}
      {showPinyin && pinyin ? (
        <Text style={[styles.pinyin, chineseFontStyle]}>{pinyin}</Text>
      ) : null}
      <Text style={[styles.word, chineseFontStyle]}>{text}</Text>
    </View>
  );
}

export function SentenceStudyPanel({
  word,
  pinyin,
  bottomInset,
  onClose,
}: {
  word: string;
  pinyin: string | null;
  bottomInset: number;
  onClose: () => void;
}) {
  const { chineseFontStyle } = useFont();

  return (
    <View style={[styles.panel, { paddingBottom: Math.max(bottomInset, 16) }]}>
      <View style={styles.panelHeader}>
        <View style={styles.panelHeaderContent}>
          {pinyin ? (
            <Text style={[styles.panelPinyin, chineseFontStyle]}>{pinyin}</Text>
          ) : null}
          <Text style={[styles.panelWord, chineseFontStyle]}>{word}</Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Close panel"
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </Pressable>
      </View>
      <Text style={[styles.panelNotice, chineseFontStyle]}>
        a local dictionary will be implemented soon...
      </Text>
    </View>
  );
}

/** Returns true if the segment should not be tappable (numbers, punctuation, whitespace) */
function isNumberOrPunctuation(text: string): boolean {
  if (!text || !text.trim()) return true;
  return /^[\d０-９\s\p{P}\p{S}]+$/u.test(text);
}

const LINE_SPACING: Record<
  LineSpacingLevel,
  { sentenceMarginBottom: number; paragraphMarginBottom: number }
> = {
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
  const { showPinyin, lineSpacing } = useFont();
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
          scrollViewRef.current?.measureInWindow((_sx, _sy, _sw, viewportHeight) => {
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
                  isSelected && styles.sentenceWrapperSelected,
                ]}
              >
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
                      />
                    </Pressable>
                  ) : (
                    <View key={wIdx} style={styles.wordPressable}>
                      <WordBlock
                        segment={word}
                        showPinyin={showPinyin}
                        highlighted={false}
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

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  paragraph: {
    flexDirection: 'column',
  },
  sentenceWrapper: {
    position: 'relative',
  },
  sentenceWrapperSelected: {
    marginHorizontal: -4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingLeft: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 26, 26, 0.06)',
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(139, 26, 26, 0.35)',
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
    backgroundColor: 'rgba(139, 26, 26, 0.12)',
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
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  panelHeaderContent: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginTop: -4,
    marginRight: -4,
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  closeButtonText: {
    fontSize: 18,
    color: theme.textMuted,
    fontWeight: '500',
  },
  panelPinyin: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 4,
  },
  panelWord: {
    fontSize: 22,
    color: theme.text,
    fontWeight: '600',
  },
  panelNotice: {
    fontSize: 14,
    color: theme.textMuted,
    fontStyle: 'italic',
  },
});
