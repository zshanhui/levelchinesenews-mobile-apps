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
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';

type ArticleListFilterShelveProps = {
  visible: boolean;
  onRequestClose: () => void;
};

export function ArticleListFilterShelve({
  visible,
  onRequestClose,
}: ArticleListFilterShelveProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;
  const sheetHeight = windowHeight * 0.5;

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
          <Text style={styles.title}>Filters</Text>
          <Text style={styles.hint}>Filter options will appear here.</Text>
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
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    hint: {
      fontSize: 14,
      color: theme.textMuted,
      lineHeight: 20,
    },
  });
}
