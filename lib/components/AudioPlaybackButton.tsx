import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, View } from 'react-native';

/** Slightly larger than translate icon; hit area stays full size for tapping. */
const ICON_SIZE = 12.75;

type AudioPlaybackButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
  /** Accent when cached audio exists; faded grey when not. */
  iconColor: string;
  /** Spinner color while `loading`. */
  accentColor: string;
  /** True while playback is starting — control is non-interactive. */
  loading?: boolean;
  /** Outer touch target (e.g. 27×27); keeps easy tap area */
  hitStyle: object;
  /** Inner visible FAB (smaller circle) */
  faceStyle: object;
  facePressedStyle: object;
};

export function AudioPlaybackButton({
  onPress,
  accessibilityLabel,
  iconColor,
  accentColor,
  loading = false,
  hitStyle,
  faceStyle,
  facePressedStyle,
}: AudioPlaybackButtonProps) {
  return (
    <Pressable
      style={hitStyle}
      onPress={() => {
        if (loading) return;
        onPress();
      }}
      disabled={loading}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      accessibilityRole={loading ? 'progressbar' : 'button'}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: loading, busy: loading }}
    >
      {({ pressed }) => (
        <View style={[faceStyle, pressed && !loading && facePressedStyle, loading && { opacity: 0.85 }]}>
          {loading ? (
            <ActivityIndicator size="small" color={accentColor} />
          ) : (
            <Ionicons name="volume-medium-outline" size={ICON_SIZE} color={iconColor} />
          )}
        </View>
      )}
    </Pressable>
  );
}
