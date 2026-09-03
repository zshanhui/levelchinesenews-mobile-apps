import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from '../i18n';
import { useTheme } from '../ThemeContext';
import type { Theme } from '../theme';

const ACTION_PANEL_SLIDE_MS = 240;

export type WordActionPanelProps = {
  showSave: boolean;
  showMarkLearned: boolean;
  showRemove: boolean;
  onSaveWord: () => void | Promise<void>;
  onMarkLearned: () => void | Promise<void>;
  onRemoveWord: () => void | Promise<void>;
  /** Called after the exit slide finishes so the parent can unmount the panel. */
  onRequestClose: () => void;
};

/**
 * Overlay that slides in from the right on top of the dictionary study panel,
 * offering word-level study actions (save / mark learned / remove). Styled like the
 * host panel (same surface color + radius) so it reads as a layer above it.
 */
export function WordActionPanel({
  showSave,
  showMarkLearned,
  showRemove,
  onSaveWord,
  onMarkLearned,
  onRemoveWord,
  onRequestClose,
}: WordActionPanelProps) {
  const { width: windowWidth } = useWindowDimensions();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const flagsRef = useRef({ showSave, showMarkLearned, showRemove });
  const flags = flagsRef.current;
  const translateX = useRef(new Animated.Value(windowWidth)).current;
  const closingRef = useRef(false);
  const onRequestCloseRef = useRef(onRequestClose);
  onRequestCloseRef.current = onRequestClose;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: 0,
      duration: ACTION_PANEL_SLIDE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [translateX]);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    Animated.timing(translateX, {
      toValue: windowWidth,
      duration: ACTION_PANEL_SLIDE_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onRequestCloseRef.current();
      }
    });
  }, [translateX, windowWidth]);

  const runThenClose = useCallback(
    (action: () => void | Promise<void>) => {
      void Promise.resolve(action())
        .then(() => close())
        .catch(() => {});
    },
    [close],
  );

  const hasAny = flags.showSave || flags.showMarkLearned || flags.showRemove;
  if (!hasAny) {
    return null;
  }

  return (
    <Animated.View style={[styles.host, { transform: [{ translateX }] }]}>
      <View style={styles.card}>
        <View style={styles.actionPair}>
          {flags.showMarkLearned ? (
            <Pressable
              onPress={() => runThenClose(onMarkLearned)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionCell, pressed && styles.pressed]}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={theme.learnedGreen} />
              <Text style={[styles.actionLabel, styles.actionCellLabel]} numberOfLines={2}>
                {t('markLearned')}
              </Text>
            </Pressable>
          ) : null}
          {flags.showSave ? (
            <Pressable
              onPress={() => runThenClose(onSaveWord)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionCell, pressed && styles.pressed]}
            >
              <Ionicons name="bookmark-outline" size={18} color={theme.bookmarkGold} />
              <Text style={[styles.actionLabel, styles.actionCellLabel]} numberOfLines={2}>
                {t('saveWord')}
              </Text>
            </Pressable>
          ) : flags.showRemove ? (
            <Pressable
              onPress={() => runThenClose(onRemoveWord)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionCell, pressed && styles.pressed]}
            >
              <Ionicons name="trash-outline" size={18} color={theme.error} />
              <Text
                style={[styles.actionLabel, styles.actionCellLabel, styles.actionLabelDanger]}
                numberOfLines={2}
              >
                {t('removeWord')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

function createStyles(theme: Theme, _isDark: boolean) {
  return StyleSheet.create({
    /**
     * Transparent host spanning the dictionary panel; centers the card
     * vertically (and keeps equal side margins).
     */
    host: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    /** Elevated, shadowed card that visually floats above the dict panel. */
    card: {
      backgroundColor: theme.surfaceElevated,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 14,
      elevation: 12,
    },
    actionPair: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 20,
    },
    actionCell: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 44,
      paddingHorizontal: 4,
    },
    actionLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.accent,
    },
    actionCellLabel: {
      flexShrink: 1,
      textAlign: 'center',
    },
    actionLabelDanger: {
      color: theme.error,
    },
    pressed: {
      opacity: 0.6,
    },
  });
}
