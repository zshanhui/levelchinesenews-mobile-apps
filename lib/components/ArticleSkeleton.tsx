import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from '../i18n';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';

const PULSE_MIN = 0.42;
const PULSE_MAX = 1;
const PULSE_DURATION_MS = 850;

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
    scrollContentCentered: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    pad: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    padWhenCentered: {
      paddingTop: 0,
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

type ArticleSkeletonProps = {
  /**
   * When true, vertically centers the skeleton block when it fits in the viewport
   * (initial load and pull-to-refresh overlay).
   */
  centerContent?: boolean;
};

/**
 * Article-shaped skeleton (title, meta, hero block, body lines) for initial load and refresh.
 */
export function ArticleSkeleton({ centerContent = false }: ArticleSkeletonProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const pulseOpacity = useRef(new Animated.Value(PULSE_MIN)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, {
          toValue: PULSE_MAX,
          duration: PULSE_DURATION_MS,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: PULSE_MIN,
          duration: PULSE_DURATION_MS,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseOpacity]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        centerContent && styles.scrollContentCentered,
      ]}
      showsVerticalScrollIndicator={false}
      accessibilityRole="progressbar"
      accessibilityLabel={t('loading')}
    >
      <Animated.View
        style={[
          styles.pad,
          centerContent && styles.padWhenCentered,
          { opacity: pulseOpacity },
        ]}
      >
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
      </Animated.View>
    </ScrollView>
  );
}
