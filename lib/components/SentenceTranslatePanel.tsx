import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFont } from '../FontContext';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';

type SentenceTranslatePanelProps = {
  /** Full sentence text — use when wiring translate backend */
  chineseText: string;
  translatedText?: string | null;
};

export function SentenceTranslatePanel({
  chineseText,
  translatedText,
}: SentenceTranslatePanelProps) {
  const { theme } = useTheme();
  const { chineseFontStyle, articleFontSize } = useFont();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const normalizedChineseText = chineseText.trim();
  const showPlaceholderText = !translatedText;
  const displayText = translatedText ?? normalizedChineseText;

  const openExternalTranslate = useCallback(() => {
    const q = encodeURIComponent(normalizedChineseText);
    void Linking.openURL(`https://translate.google.com/?sl=zh-CN&tl=en&text=${q}`);
  }, [normalizedChineseText]);

  return (
    <View style={styles.container}>
      <Text
        style={
          showPlaceholderText
            ? [
                styles.placeholderTranslation,
                chineseFontStyle,
                {
                  fontSize: articleFontSize,
                  lineHeight: Math.round(articleFontSize * 1.4),
                },
              ]
            : styles.translation
        }
        selectable={showPlaceholderText}
      >
        {displayText}
      </Text>
      <Pressable
        onPress={openExternalTranslate}
        style={({ pressed }) => [styles.googleCorner, pressed && styles.googleCornerPressed]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Open in Google Translate"
      >
        <Ionicons name="open-outline" size={14} color={theme.textMuted} />
      </Pressable>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      marginTop: 10,
      position: 'relative',
      paddingVertical: 14,
      paddingHorizontal: 12,
      paddingRight: 34,
      paddingBottom: 34,
      backgroundColor: theme.etchedBg,
      borderRadius: 10,
      // Inset “groove”: dark on top/left, light on bottom/right → recessed into the page
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderTopColor: theme.etchedBorderDark,
      borderLeftColor: theme.etchedBorderDark,
      borderBottomWidth: 1,
      borderRightWidth: 1,
      borderBottomColor: theme.etchedBorderLight,
      borderRightColor: theme.etchedBorderLight,
    },
    googleCorner: {
      position: 'absolute',
      right: 8,
      bottom: 8,
      padding: 2,
      opacity: 0.72,
    },
    googleCornerPressed: {
      opacity: 0.45,
    },
    translation: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 19,
    },
    /** Source sentence standing in until backend translation is available */
    placeholderTranslation: {
      color: theme.textMuted,
    },
  });
}
