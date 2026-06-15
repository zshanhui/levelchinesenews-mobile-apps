import { useEffect, useMemo, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { THUMB_MIN_HEIGHT, THUMB_WIDTH } from '../constants';
import { useTranslation } from '../i18n';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';

const SKELETON_ROWS = 6;

/**
 * Placeholder layout matching {@link ArticleCard} while the articles list loads.
 */
export function ArticleListSkeleton() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.92,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View
      style={styles.root}
      accessibilityRole="progressbar"
      accessibilityLabel={t('loadingArticles')}
    >
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {Array.from({ length: SKELETON_ROWS }, (_, i) => (
          <View key={i}>
            <View style={styles.card}>
              <View style={styles.cardTopRow}>
                <Animated.View
                  style={[
                    styles.thumbnail,
                    { height: THUMB_MIN_HEIGHT + 10, opacity: pulse },
                  ]}
                />
                <View style={styles.textColumn}>
                  <Animated.View style={[styles.lineTitle, { opacity: pulse }]} />
                  <Animated.View
                    style={[styles.lineTitleSecond, { opacity: pulse }]}
                  />
                  <Animated.View style={[styles.lineMeta, { opacity: pulse }]} />
                  <Animated.View style={[styles.lineSummary, { opacity: pulse }]} />
                </View>
              </View>
            </View>
            {i < SKELETON_ROWS - 1 ? <View style={styles.separator} /> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: Theme) {
  const block = {
    backgroundColor: theme.border,
    borderRadius: 6,
  };

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
    },
    listContent: {
      paddingTop: 8,
      paddingBottom: 24,
      paddingHorizontal: 2,
      flexGrow: 1,
      backgroundColor: theme.background,
    },
    card: {
      backgroundColor: theme.surfaceElevated,
      borderRadius: 12,
      overflow: 'hidden',
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      width: '100%',
    },
    thumbnail: {
      width: THUMB_WIDTH,
      backgroundColor: theme.border,
      borderRadius: 8,
    },
    textColumn: {
      flex: 1,
      marginLeft: 12,
      marginRight: 12,
      minWidth: 0,
      gap: 8,
      paddingTop: 2,
    },
    lineTitle: {
      height: 16,
      width: '92%',
      ...block,
    },
    lineTitleSecond: {
      height: 14,
      width: '55%',
      ...block,
    },
    lineMeta: {
      height: 11,
      width: '38%',
      ...block,
      borderRadius: 4,
    },
    lineSummary: {
      height: 12,
      width: '100%',
      ...block,
    },
    separator: {
      height: 2,
    },
  });
}
