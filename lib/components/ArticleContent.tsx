import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { LineSpacingLevel } from '../FontContext';
import { useFont } from '../FontContext';
import { theme } from '../theme';
import type { ParsedParagraph, WordSegment } from '../types';

interface ArticleContentProps {
  parsedContent: ParsedParagraph[];
}

function WordBlock({
  segment,
  showPinyin,
  highlighted,
  sentenceUnderlined,
}: {
  segment: WordSegment;
  showPinyin: boolean;
  highlighted: boolean;
  sentenceUnderlined: boolean;
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
      <Text
        style={[
          styles.word,
          chineseFontStyle,
          sentenceUnderlined && styles.wordUnderlined,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function SentenceStudyPanel({
  word,
  pinyin,
  bottomInset,
}: {
  word: string;
  pinyin: string | null;
  bottomInset: number;
}) {
  const { chineseFontStyle } = useFont();

  return (
    <View style={[styles.panel, { paddingBottom: Math.max(bottomInset, 16) }]}>
      {pinyin ? (
        <Text style={[styles.panelPinyin, chineseFontStyle]}>{pinyin}</Text>
      ) : null}
      <Text style={[styles.panelWord, chineseFontStyle]}>{word}</Text>
      <Text style={[styles.panelNotice, chineseFontStyle]}>
        a local dictionary will be implemented soon...
      </Text>
    </View>
  );
}

const LINE_SPACING: Record<
  LineSpacingLevel,
  { sentenceMarginBottom: number; paragraphMarginBottom: number }
> = {
  compact: { sentenceMarginBottom: 0, paragraphMarginBottom: 8 },
  normal: { sentenceMarginBottom: 6, paragraphMarginBottom: 24 },
  relaxed: { sentenceMarginBottom: 14, paragraphMarginBottom: 40 },
};

export function ArticleContent({ parsedContent }: ArticleContentProps) {
  const { showPinyin, lineSpacing } = useFont();
  const spacing = LINE_SPACING[lineSpacing];
  const insets = useSafeAreaInsets();
  const [selectedWord, setSelectedWord] = useState<{ word: string; pinyin: string | null } | null>(null);
  const [highlightedWordKey, setHighlightedWordKey] = useState<string | null>(null);
  const [highlightedSentenceKey, setHighlightedSentenceKey] = useState<string | null>(null);

  const onWordPress = useCallback(
    (wordText: string, pinyinText: string | null, wordKey: string, sentenceKey: string) => {
      setSelectedWord({ word: wordText, pinyin: pinyinText });
      setHighlightedWordKey(wordKey);
      setHighlightedSentenceKey(sentenceKey);
    },
    []
  );

  const closePanel = useCallback(() => {
    setSelectedWord(null);
    setHighlightedWordKey(null);
    setHighlightedSentenceKey(null);
  }, []);

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
            return (
              <View
                key={sIdx}
                style={[
                  styles.sentence,
                  {
                    marginBottom: spacing.sentenceMarginBottom,
                    rowGap: spacing.sentenceMarginBottom,
                  },
                ]}
              >
                {sentence.w.map((word, wIdx) => {
                  const wordKey = `${pIdx}-${sIdx}-${wIdx}`;
                  return (
                    <Pressable
                      key={wIdx}
                      onPress={() => onWordPress(word.t, word.p ?? null, wordKey, sentenceKey)}
                      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                      style={({ pressed }) => [styles.wordPressable, pressed && styles.wordPressablePressed]}
                    >
                      <WordBlock
                        segment={word}
                        showPinyin={showPinyin}
                        highlighted={highlightedWordKey === wordKey}
                        sentenceUnderlined={highlightedSentenceKey === sentenceKey}
                      />
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>
      ))}

      <Modal
        visible={selectedWord !== null}
        transparent
        animationType="slide"
        onRequestClose={closePanel}
      >
        <View style={styles.sheetContainer}>
          <Pressable style={styles.sheetBackdrop} onPress={closePanel} />
          {selectedWord ? (
            <View style={styles.panelWrapper}>
              <SentenceStudyPanel
                word={selectedWord.word}
                pinyin={selectedWord.pinyin}
                bottomInset={insets.bottom}
              />
            </View>
          ) : null}
        </View>
      </Modal>
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
  wordUnderlined: {
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(139, 26, 26, 0.5)',
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  panelWrapper: {
    width: '100%',
    alignSelf: 'stretch',
  },
  panel: {
    backgroundColor: theme.surface,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.border,
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
    marginBottom: 8,
  },
  panelNotice: {
    fontSize: 14,
    color: theme.textMuted,
    fontStyle: 'italic',
  },
});
