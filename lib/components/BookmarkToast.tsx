import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';

/** Space below safe area for the toast (includes ~20px shift down from earlier layout). */
const TOAST_TOP_BUFFER = 52;

/** Positive px: bubble starts off-screen to the right, then slides in. */
const SLIDE_IN_OFFSET = 160;
const AUTO_DISMISS_MS = 2200;

export type BookmarkToastState = {
  message: string;
  key: number;
};

export type BookmarkToastProps = {
  toast: BookmarkToastState | null;
  onDismiss: () => void;
};

export function BookmarkToast({ toast, onDismiss }: BookmarkToastProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const slideX = useRef(new Animated.Value(0)).current;

  useLayoutEffect(() => {
    if (!toast) return;
    slideX.setValue(SLIDE_IN_OFFSET);
    Animated.timing(slideX, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [toast, slideX]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) {
    return null;
  }

  return (
    <View
      style={[styles.host, { paddingTop: insets.top + TOAST_TOP_BUFFER }]}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      accessibilityLabel={toast.message}
    >
      <Animated.View
        style={[styles.bubbleWrap, { transform: [{ translateX: slideX }] }]}
      >
        <View style={styles.bubble}>
          <Text style={styles.text}>{toast.message}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

function createStyles(theme: Theme, isDark: boolean) {
  return StyleSheet.create({
    host: {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      zIndex: 20,
      alignItems: 'flex-end',
      paddingRight: 12,
    },
    bubbleWrap: {
      maxWidth: '88%',
    },
    bubble: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(19, 29, 19, 0.88)' : 'rgba(255, 255, 255, 0.9)',
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDark ? 0.45 : 0.2,
          shadowRadius: isDark ? 10 : 8,
        },
        android: { elevation: isDark ? 8 : 6 },
        default: {},
      }),
    },
    text: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
      color: isDark ? theme.accent : theme.error,
      textAlign: 'right',
    },
  });
}
