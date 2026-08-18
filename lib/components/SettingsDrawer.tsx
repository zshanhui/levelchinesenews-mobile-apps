import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  WEB_SETTINGS_DRAWER_WIDTH,
  WEB_SETTINGS_SHEET_HEIGHT_RATIO,
  WEB_WIDE_LAYOUT_MIN_WIDTH,
} from '../constants';
import { useTranslation } from '../i18n';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { SettingsContent } from './SettingsContent';

type SettingsDrawerProps = {
  visible: boolean;
  onRequestClose: () => void;
};

export function SettingsDrawer({ visible, onRequestClose }: SettingsDrawerProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const fromRight = windowWidth >= WEB_WIDE_LAYOUT_MIN_WIDTH;
  const sheetHeight = Math.round(windowHeight * WEB_SETTINGS_SHEET_HEIGHT_RATIO);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const closeWithAnimation = useCallback(() => {
    Animated.timing(fromRight ? translateX : translateY, {
      toValue: fromRight ? WEB_SETTINGS_DRAWER_WIDTH : sheetHeight,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onRequestClose();
    });
  }, [fromRight, onRequestClose, sheetHeight, translateX, translateY]);

  useEffect(() => {
    if (!visible) return;
    if (fromRight) {
      translateY.setValue(0);
      translateX.setValue(WEB_SETTINGS_DRAWER_WIDTH);
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        damping: 28,
        stiffness: 280,
      }).start();
      return;
    }
    translateX.setValue(0);
    translateY.setValue(sheetHeight);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 28,
      stiffness: 280,
    }).start();
  }, [fromRight, sheetHeight, translateX, translateY, visible]);

  useEffect(() => {
    if (!visible || typeof window === 'undefined') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeWithAnimation();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, closeWithAnimation]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeWithAnimation}
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.backdrop}
          onPress={closeWithAnimation}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
        />
        <Animated.View
          style={[
            styles.panel,
            fromRight ? styles.panelRight : [styles.panelBottom, { height: sheetHeight }],
            {
              paddingTop: fromRight ? Math.max(insets.top, 12) : 8,
              paddingBottom: Math.max(insets.bottom, 12),
              transform: [{ translateX }, { translateY }],
            },
          ]}
        >
          {fromRight ? null : <View style={styles.handle} />}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('settings')}</Text>
            <Pressable
              onPress={closeWithAnimation}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('back')}
            >
              <Ionicons name="close" size={22} color={theme.text} />
            </Pressable>
          </View>
          <SettingsContent contentContainerStyle={styles.panelContent} />
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    modalRoot: {
      flex: 1,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.28)',
    },
    panel: {
      backgroundColor: theme.background,
      shadowColor: '#000',
      shadowOpacity: 0.16,
      shadowRadius: 18,
    },
    panelRight: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: WEB_SETTINGS_DRAWER_WIDTH,
      maxWidth: '100%',
      borderLeftWidth: 1,
      borderLeftColor: theme.border,
      shadowOffset: { width: -6, height: 0 },
    },
    panelBottom: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.border,
      shadowOffset: { width: 0, height: -4 },
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.border,
      marginBottom: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonPressed: {
      opacity: 0.7,
    },
    panelContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
  });
}
