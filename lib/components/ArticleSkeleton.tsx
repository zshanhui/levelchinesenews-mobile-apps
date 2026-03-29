import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from '../i18n';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';

/** Width strings for body-line skeleton bars (mimics wrapped paragraph text). */
const BODY_BLOCKS: string[][] = [
  ['96%', '100%', '88%', '94%', '72%'],
  ['100%', '100%', '65%'],
  ['95%', '92%', '100%', '88%', '90%', '48%'],
];

function createStyles(theme: Theme) {
  const bar = (height: number) => ({
    borderRadius: height / 2,
    backgroundColor: theme.readIndicatorMuted,
  });
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      paddingBottom: 32,
    },
    pad: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    titleLine1: {
      ...bar(24),
      width: '94%',
      height: 24,
      marginBottom: 10,
    },
    titleLine2: {
      ...bar(24),
      width: '68%',
      height: 24,
      marginBottom: 16,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    metaLine: {
      ...bar(11),
      width: '42%',
      height: 11,
    },
    metaLineShort: {
      ...bar(11),
      width: '28%',
      height: 11,
    },
    image: {
      width: '100%',
      aspectRatio: 16 / 10,
      borderRadius: 8,
      backgroundColor: theme.border,
      marginBottom: 16,
    },
    paragraph: {
      gap: 9,
      marginBottom: 18,
    },
    bodyLine: {
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.readIndicatorMuted,
    },
  });
}

/**
 * Article-shaped skeleton (title, meta, hero block, body lines) for initial load and refresh.
 */
export function ArticleSkeleton() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      accessibilityRole="progressbar"
      accessibilityLabel={t('loading')}
    >
      <View style={styles.pad}>
        <View style={styles.titleLine1} />
        <View style={styles.titleLine2} />
        <View style={styles.metaRow}>
          <View style={styles.metaLine} />
          <View style={styles.metaLineShort} />
        </View>
        <View style={styles.image} />
        {BODY_BLOCKS.map((widths, bi) => (
          <View key={bi} style={styles.paragraph}>
            {widths.map((w, li) => (
              <View
                key={li}
                style={[styles.bodyLine, { width: w as `${number}%` }]}
              />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
