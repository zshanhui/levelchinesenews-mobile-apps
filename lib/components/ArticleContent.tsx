import { useFont } from '../FontContext';
import { theme } from '../theme';
import type { ParsedParagraph, WordSegment } from '../types';
import { StyleSheet, Text, View } from 'react-native';

interface ArticleContentProps {
  parsedContent: ParsedParagraph[];
}

function WordBlock({ segment, showPinyin }: { segment: WordSegment; showPinyin: boolean }) {
  const { chineseFontStyle } = useFont();
  const text = segment.t;
  const pinyin = segment.p ?? '';

  return (
    <View style={styles.wordBlock}>
      {showPinyin && pinyin ? (
        <Text style={[styles.pinyin, chineseFontStyle]}>{pinyin}</Text>
      ) : null}
      <Text style={[styles.word, chineseFontStyle]}>{text}</Text>
    </View>
  );
}

export function ArticleContent({ parsedContent }: ArticleContentProps) {
  const { showPinyin } = useFont();

  if (!parsedContent?.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      {parsedContent.map((paragraph, pIdx) => (
        <View key={pIdx} style={styles.paragraph}>
          {paragraph.s.map((sentence, sIdx) => (
            <View key={sIdx} style={styles.sentence}>
              {sentence.w.map((word, wIdx) => (
                <WordBlock key={wIdx} segment={word} showPinyin={showPinyin} />
              ))}
            </View>
          ))}
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
    marginBottom: 20,
  },
  sentence: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  wordBlock: {
    alignItems: 'center',
    marginRight: 4,
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
