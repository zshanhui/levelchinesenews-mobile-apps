import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { articleTopicDisplayLabel } from '../articleTopicLabels';
import { useNativeLanguage } from '../NativeLanguageContext';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';

export function ArticleTags({ tags }: { tags: string[] | null | undefined }) {
  const { theme } = useTheme();
  const { nativeLanguage } = useNativeLanguage();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const items = useMemo(() => {
    if (!tags?.length) return [];
    const seen = new Set<string>();
    const out: { key: string; label: string }[] = [];
    for (const raw of tags) {
      const tag = raw.trim();
      if (!tag || seen.has(tag)) continue;
      seen.add(tag);
      out.push({
        key: tag,
        label: articleTopicDisplayLabel(tag, nativeLanguage),
      });
    }
    return out;
  }, [nativeLanguage, tags]);

  if (items.length === 0) return null;

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => {
            void Haptics.selectionAsync().catch(() => {});
            router.navigate({ pathname: '/', params: { tag: item.key } });
          }}
          style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
          accessibilityRole="button"
          accessibilityLabel={item.label}
        >
          <Text style={styles.label}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      width: '100%',
    },
    chip: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      backgroundColor: theme.etchedBg,
    },
    chipPressed: {
      opacity: 0.82,
    },
    label: {
      fontSize: 12,
      lineHeight: 16,
      color: theme.textMuted,
    },
  });
}
