import * as Haptics from 'expo-haptics';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { articleTopicDisplayLabel } from '../articleTopicLabels';
import { useTranslation } from '../i18n';
import { NativeLanguage } from '../nativeLanguage';
import { useNativeLanguage } from '../NativeLanguageContext';
import type { Theme } from '../theme';
import { darkTheme } from '../theme';
import { useTheme } from '../ThemeContext';
import { useArticleTopics } from '../useArticleTopics';

const serifTextStyle = Platform.select({
  ios: { fontFamily: 'Georgia' },
  android: { fontFamily: 'serif' },
  default: { fontFamily: 'Georgia' },
});

const TOPICS_PER_ROW_ZH = 5;
const TOPICS_PER_ROW_NON_ZH = 3;
const TOPICS_GRID_GAP = 8;
/** Fixed chip height so every topic control is the same size. */
const TOPIC_CHIP_HEIGHT = 48;

type TopicsListProps = {
  activeTopicKey: string | null;
  onTopicSelect: (topicKey: string, tags: string[]) => void;
};

export function TopicsList({ activeTopicKey, onTopicSelect }: TopicsListProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { nativeLanguage } = useNativeLanguage();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { topics, loading, error } = useArticleTopics();

  const topicButtonHaptic = useCallback(() => {
    if (Platform.OS === 'web') return;
    void Haptics.selectionAsync().catch(() => {});
  }, []);

  /** Same order as `GET /articles/topics` JSON object keys (e.g. `AI时代` first). */
  const entries = useMemo(() => {
    if (!topics) return [];
    return Object.entries(topics);
  }, [topics]);

  const rows = useMemo(() => {
    const perRow =
      nativeLanguage === NativeLanguage.ZH
        ? TOPICS_PER_ROW_ZH
        : TOPICS_PER_ROW_NON_ZH;
    const out: [string, string[]][][] = [];
    for (let i = 0; i < entries.length; i += perRow) {
      out.push(entries.slice(i, i + perRow));
    }
    return out;
  }, [entries, nativeLanguage]);

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (loading && entries.length === 0) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator color={theme.accent} />
        <Text style={styles.muted}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.topicRow}>
          {row.map(([topic, tags]) => {
            const label = articleTopicDisplayLabel(topic, nativeLanguage);
            return (
              <Pressable
                key={topic}
                style={({ pressed }) => [
                  styles.topicButton,
                  activeTopicKey === topic && styles.topicButtonSelected,
                  pressed && styles.topicButtonPressed,
                ]}
                onPress={() => {
                  topicButtonHaptic();
                  onTopicSelect(topic, tags);
                }}
                android_ripple={{
                  color: theme.highlightBg,
                  foreground: true,
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: activeTopicKey === topic }}
                accessibilityLabel={label}
              >
                <Text
                  style={[
                    styles.topicLabel,
                    activeTopicKey === topic && styles.topicLabelSelected,
                  ]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

function createStyles(theme: Theme) {
  const topicLabelColor =
    theme.background === darkTheme.background ? theme.error : theme.accent;

  return StyleSheet.create({
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexDirection: 'column',
      gap: TOPICS_GRID_GAP,
      paddingBottom: 8,
      width: '100%',
    },
    topicRow: {
      flexDirection: 'row',
      gap: TOPICS_GRID_GAP,
      width: '100%',
      alignItems: 'stretch',
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
    },
    muted: {
      fontSize: 13,
      color: theme.textMuted,
      ...serifTextStyle,
    },
    errorText: {
      fontSize: 13,
      color: theme.error,
      paddingVertical: 8,
      ...serifTextStyle,
    },
    topicButton: {
      flex: 1,
      minWidth: 0,
      height: TOPIC_CHIP_HEIGHT,
      paddingHorizontal: 4,
      paddingVertical: 0,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topicButtonPressed: {
      opacity: 0.82,
      transform: [{ scale: 0.99 }],
    },
    topicButtonSelected: {
      borderColor: theme.accent,
      backgroundColor: theme.highlightBg,
    },
    topicLabel: {
      fontSize: 12,
      lineHeight: 15,
      fontWeight: '700',
      color: topicLabelColor,
      textAlign: 'center',
      ...serifTextStyle,
    },
    topicLabelSelected: {
      fontWeight: '800',
    },
  });
}
