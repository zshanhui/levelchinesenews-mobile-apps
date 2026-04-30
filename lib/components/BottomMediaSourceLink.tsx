import * as Linking from 'expo-linking';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { useTranslation } from '../i18n';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFont } from '../FontContext';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';

export type BottomMediaSourceLinkProps = {
  sourceUrl: string;
  /** Display name for `{{mediaSource}}`; falls back to translation. */
  mediaSourceLabel?: string | null;
};

/**
 * Footer CTA linking to the original article — Playfair, compact red text with light outline.
 */
export function BottomMediaSourceLink({
  sourceUrl,
  mediaSourceLabel,
}: BottomMediaSourceLinkProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { fancyDisplayFontStyle } = useFont();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const media =
    mediaSourceLabel?.trim() || t('originalArticleSourceFallback');

  return (
    <View style={styles.block} pointerEvents="box-none">
      <Pressable
        onPress={() => void Linking.openURL(sourceUrl)}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed,
        ]}
        accessibilityRole="link"
        accessibilityLabel={t('readOriginalArticleCta', { mediaSource: media })}
      >
        <View style={styles.contentWrap}>
          <Text style={[styles.label, fancyDisplayFontStyle]}>
            {t('readOriginalArticleCta', { mediaSource: media })}
          </Text>
          <View style={styles.iconWrap} pointerEvents="none">
            <Ionicons
              name="link-outline"
              size={15}
              color={theme.error}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    block: {
      minWidth: 0,
      alignSelf: 'stretch',
      width: '100%',
    },
    pressable: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: `${theme.error}55`,
      paddingVertical: 8,
      paddingHorizontal: 10,
      alignSelf: 'stretch',
      width: '100%',
    },
    pressed: {
      opacity: 0.82,
    },
    contentWrap: {
      position: 'relative',
      width: '100%',
    },
    label: {
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'left',
      color: theme.error,
      letterSpacing: 0.2,
      textShadowColor: theme.background,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 3,
      paddingRight: 22,
    },
    iconWrap: {
      position: 'absolute',
      right: 0,
      bottom: 2,
    },
  });
}
