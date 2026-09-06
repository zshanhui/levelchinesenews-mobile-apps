import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { AudioPlaybackButton } from './AudioPlaybackButton';
import { SentenceTranslateToggle } from './SentenceTranslateToggle';

/** Toggle hit target is 27×27; vertical padding adds breathing room above/below the icon. */
const TOGGLE_HIT_SIZE = 27;
const BAR_PADDING_VERTICAL = 2;
const BAR_PADDING_LEFT = 8;
const BAR_PADDING_RIGHT = 6;
const ACTION_GAP = 8;
const BAR_CORNER_RADIUS = 7;

type SentenceHelperBarProps = {
  onAudioPress: () => void;
  audioAccessibilityLabel: string;
  audioIconColor: string;
  audioLoading?: boolean;
  sentenceTranslateExpanded: boolean;
  onSentenceTranslatePress: () => void;
  translateAccessibilityLabel: string;
  translateIconColor: string;
  accentColor: string;
  translateLoading: boolean;
};

/** One-line action strip between the sentence block and `SentenceTranslatePanel`. */
export function SentenceHelperBar({
  onAudioPress,
  audioAccessibilityLabel,
  audioIconColor,
  audioLoading = false,
  sentenceTranslateExpanded,
  onSentenceTranslatePress,
  translateAccessibilityLabel,
  translateIconColor,
  accentColor,
  translateLoading,
}: SentenceHelperBarProps) {
  const { theme, isDark } = useTheme();
  const barStyles = useMemo(() => createBarStyles(theme, isDark), [theme, isDark]);
  const toggleStyles = useMemo(() => createToggleStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={barStyles.bar}>
      <View style={barStyles.actions}>
        <AudioPlaybackButton
          onPress={onAudioPress}
          accessibilityLabel={audioAccessibilityLabel}
          iconColor={audioIconColor}
          accentColor={accentColor}
          loading={audioLoading}
          hitStyle={toggleStyles.hit}
          faceStyle={toggleStyles.face}
          facePressedStyle={toggleStyles.facePressed}
        />
        <SentenceTranslateToggle
          expanded={sentenceTranslateExpanded}
          onPress={onSentenceTranslatePress}
          accessibilityLabel={translateAccessibilityLabel}
          iconColor={translateIconColor}
          accentColor={accentColor}
          loading={translateLoading}
          hitStyle={toggleStyles.hit}
          faceStyle={toggleStyles.face}
          facePressedStyle={toggleStyles.facePressed}
        />
      </View>
    </View>
  );
}

function createBarStyles(theme: Theme, isDark: boolean) {
  const barShadow =
    Platform.OS === 'android'
      ? { elevation: 2 }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.2 : 0.07,
          shadowRadius: 2.5,
        };

  return StyleSheet.create({
    bar: {
      alignSelf: 'flex-end',
      width: '33%',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      minHeight: TOGGLE_HIT_SIZE + BAR_PADDING_VERTICAL * 2,
      paddingVertical: BAR_PADDING_VERTICAL,
      paddingLeft: BAR_PADDING_LEFT,
      paddingRight: BAR_PADDING_RIGHT,
      /** Lighter than `etchedBg` panels, warmer than pure white — sits on page `background`. */
      backgroundColor: theme.surface,
      borderTopLeftRadius: BAR_CORNER_RADIUS * 3,
      borderTopRightRadius: BAR_CORNER_RADIUS,
      borderBottomRightRadius: BAR_CORNER_RADIUS,
      borderBottomLeftRadius: BAR_CORNER_RADIUS,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      ...barShadow,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ACTION_GAP,
    },
  });
}

function createToggleStyles(theme: Theme, isDark: boolean) {
  const translateFabShadow =
    Platform.OS === 'android'
      ? { elevation: 2 }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.24 : 0.1,
          shadowRadius: 3,
        };

  return StyleSheet.create({
    hit: {
      width: TOGGLE_HIT_SIZE,
      height: TOGGLE_HIT_SIZE,
      justifyContent: 'center',
      alignItems: 'center',
    },
    face: {
      width: TOGGLE_HIT_SIZE * 0.8,
      height: TOGGLE_HIT_SIZE * 0.8,
      borderRadius: (TOGGLE_HIT_SIZE * 0.8) / 2,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.etchedBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      ...translateFabShadow,
    },
    facePressed: {
      opacity: 0.65,
    },
  });
}
