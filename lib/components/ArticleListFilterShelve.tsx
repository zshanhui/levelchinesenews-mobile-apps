import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ARTICLE_LENGTH_BUCKETS,
  type ArticleLengthBucket,
} from '../articleLength';
import { useTranslation } from '../i18n';
import type { ArticleListOrderBy } from '../types';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { TopicsList } from './TopicsList';

const LENGTH_LABEL_KEY = {
  short: 'articleLengthShort',
  medium: 'articleLengthMedium',
  long: 'articleLengthLong',
} as const;

function splitLengthButtonLabel(label: string): {
  title: string;
  range: string | null;
} {
  const match = label.match(/^(.+?)\s*\((.+)\)$/);
  if (!match) return { title: label, range: null };
  return { title: match[1].trim(), range: match[2].trim() };
}

/** Georgia / system serif — matches sort controls in this sheet. */
const serifTextStyle = Platform.select({
  ios: { fontFamily: 'Georgia' },
  android: { fontFamily: 'serif' },
  default: { fontFamily: 'Georgia' },
});

type ArticleListFilterShelveProps = {
  visible: boolean;
  onRequestClose: () => void;
  orderBy: ArticleListOrderBy;
  onSelectOrderBy: (orderBy: ArticleListOrderBy) => void;
  lengthFilter: ArticleLengthBucket | null;
  onSelectLength: (bucket: ArticleLengthBucket) => void;
  activeTopicKey: string | null;
  onTopicSelect: (topicKey: string, tags: string[]) => void;
  simplified: boolean;
  onToggleSimplified: () => void;
};

export function ArticleListFilterShelve({
  visible,
  onRequestClose,
  orderBy,
  onSelectOrderBy,
  lengthFilter,
  onSelectLength,
  activeTopicKey,
  onTopicSelect,
  simplified,
  onToggleSimplified,
}: ArticleListFilterShelveProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;
  const sheetHeight = windowHeight * 0.67;

  const closeWithAnimation = useCallback(() => {
    Animated.timing(translateY, {
      toValue: sheetHeight,
      duration: 240,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onRequestClose();
    });
  }, [onRequestClose, sheetHeight, translateY]);

  useEffect(() => {
    if (!visible) return;
    translateY.setValue(sheetHeight);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 26,
      stiffness: 280,
    }).start();
  }, [visible, sheetHeight, translateY]);

  const sortButtonHaptic = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
  }, []);

  const onPressSort = useCallback(
    (field: ArticleListOrderBy) => {
      sortButtonHaptic();
      onSelectOrderBy(field);
    },
    [onSelectOrderBy, sortButtonHaptic],
  );

  const onPressLength = useCallback(
    (bucket: ArticleLengthBucket) => {
      sortButtonHaptic();
      onSelectLength(bucket);
    },
    [onSelectLength, sortButtonHaptic],
  );

  const onPressSimplified = useCallback(() => {
    sortButtonHaptic();
    onToggleSimplified();
  }, [onToggleSimplified, sortButtonHaptic]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeWithAnimation}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.backdrop}
          onPress={closeWithAnimation}
          accessibilityRole="button"
          accessibilityLabel="Dismiss filters"
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handle} />
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <Text style={styles.sortLabel}>{t('articleSortBy')}</Text>
          <View style={styles.sortRow}>
            <Pressable
              style={({ pressed }) => [
                styles.sortButton,
                styles.sortButtonFirst,
                orderBy === 'published_date' && styles.sortButtonSelected,
                pressed && styles.sortButtonPressed,
              ]}
              onPress={() => onPressSort('published_date')}
              hitSlop={{ top: 14, bottom: 14, left: 8, right: 4 }}
              android_ripple={{
                color: theme.highlightBg,
                foreground: true,
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: orderBy === 'published_date' }}
              accessibilityLabel={`${t('articleSortBy')}: ${t('articleSortPublishedDate')}`}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  orderBy === 'published_date' && styles.sortButtonTextSelected,
                ]}
              >
                {t('articleSortPublishedDate')}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.sortButton,
                orderBy === 'created_at' && styles.sortButtonSelected,
                pressed && styles.sortButtonPressed,
              ]}
              onPress={() => onPressSort('created_at')}
              hitSlop={{ top: 14, bottom: 14, left: 4, right: 8 }}
              android_ripple={{
                color: theme.highlightBg,
                foreground: true,
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: orderBy === 'created_at' }}
              accessibilityLabel={`${t('articleSortBy')}: ${t('articleSortAddedDate')}`}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  orderBy === 'created_at' && styles.sortButtonTextSelected,
                ]}
              >
                {t('articleSortAddedDate')}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.lengthLabel}>{t('articleSortByLength')}</Text>
          <View style={styles.lengthRow}>
            {ARTICLE_LENGTH_BUCKETS.map((bucket) => {
              const selected = lengthFilter === bucket;
              const label = t(LENGTH_LABEL_KEY[bucket]);
              const { title, range } = splitLengthButtonLabel(label);
              return (
                <Pressable
                  key={bucket}
                  style={({ pressed }) => [
                    styles.lengthButton,
                    selected && styles.sortButtonSelected,
                    pressed && styles.sortButtonPressed,
                  ]}
                  onPress={() => onPressLength(bucket)}
                  hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
                  android_ripple={{
                    color: theme.highlightBg,
                    foreground: true,
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${t('articleSortByLength')}: ${label}`}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      styles.lengthTitleText,
                      selected && styles.sortButtonTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                  {range ? (
                    <Text
                      style={[
                        styles.lengthRangeText,
                        selected && styles.sortButtonTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {range}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.topicsSection}>
            <Text style={styles.topicsLabel}>{t('articleFilterByTopics')}</Text>
            <TopicsList
              activeTopicKey={activeTopicKey}
              onTopicSelect={onTopicSelect}
            />
          </View>

          <View style={styles.simplifiedSection}>
            <Text style={styles.topicsLabel}>{t('articleFilterSimplified')}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.simplifiedButton,
                simplified && styles.sortButtonSelected,
                pressed && styles.sortButtonPressed,
              ]}
              onPress={onPressSimplified}
              hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
              android_ripple={{
                color: theme.highlightBg,
                foreground: true,
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: simplified }}
              accessibilityLabel={`${t('articleFilterSimplified')}: ${t('articleFilterSimplifiedL45')}`}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  simplified && styles.sortButtonTextSelected,
                ]}
              >
                {t('articleFilterSimplifiedL45')}
              </Text>
            </Pressable>
          </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    modalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      backgroundColor: theme.surfaceElevated,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.border,
      marginBottom: 16,
    },
    sheetScroll: {
      flex: 1,
    },
    sheetScrollContent: {
      paddingBottom: 8,
    },
    sortLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 10,
      ...serifTextStyle,
    },
    sortRow: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      alignItems: 'stretch',
    },
    sortButton: {
      width: '33.333333%',
      flexShrink: 0,
      paddingVertical: 18,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 60,
    },
    sortButtonFirst: {
      marginRight: 7,
    },
    sortButtonSelected: {
      borderColor: theme.accent,
      backgroundColor: theme.highlightBg,
    },
    sortButtonPressed: {
      opacity: 0.82,
      transform: [{ scale: 0.98 }],
    },
    sortButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
      ...serifTextStyle,
    },
    sortButtonTextSelected: {
      color: theme.accent,
      fontWeight: '700',
    },
    lengthLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textSecondary,
      marginTop: 22,
      marginBottom: 10,
      ...serifTextStyle,
    },
    lengthRow: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      alignItems: 'stretch',
      gap: 7,
    },
    lengthTitleText: {
      width: '100%',
    },
    lengthButton: {
      flex: 1,
      flexShrink: 1,
      paddingVertical: 14,
      paddingHorizontal: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 60,
    },
    lengthRangeText: {
      marginTop: 2,
      fontSize: 11,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
      width: '100%',
      ...serifTextStyle,
    },
    topicsSection: {
      marginTop: 22,
    },
    topicsLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 10,
      ...serifTextStyle,
    },
    simplifiedSection: {
      marginTop: 22,
    },
    simplifiedButton: {
      alignSelf: 'flex-start',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
  });
}
