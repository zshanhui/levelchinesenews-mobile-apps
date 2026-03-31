import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, View } from 'react-native';

/** Visual is 80% of original; hit area stays full size for tapping. */
const ICON_SIZE = 12.75 * 0.8;

type SentenceTranslateToggleProps = {
  expanded: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  /** Red when a cached translation exists; faded grey when not. */
  iconColor: string;
  /** Spinner color while `loading` (GET or POST translation). */
  accentColor: string;
  /** True while a translation request is in flight — control is non-interactive. */
  loading?: boolean;
  /** Outer touch target (e.g. 27×27); keeps easy tap area */
  hitStyle: object;
  /** Inner visible FAB (smaller circle) */
  faceStyle: object;
  facePressedStyle: object;
};

export function SentenceTranslateToggle({
  expanded,
  onPress,
  accessibilityLabel,
  iconColor,
  accentColor,
  loading = false,
  hitStyle,
  faceStyle,
  facePressedStyle,
}: SentenceTranslateToggleProps) {
  return (
    <Pressable
      style={hitStyle}
      onPress={onPress}
      disabled={loading}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      accessibilityRole={loading ? 'progressbar' : 'button'}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded, disabled: loading, busy: loading }}
    >
      {({ pressed }) => (
        <View style={[faceStyle, pressed && !loading && facePressedStyle, loading && { opacity: 0.85 }]}>
          {loading ? (
            <ActivityIndicator size="small" color={accentColor} />
          ) : (
            <Ionicons name="language-outline" size={ICON_SIZE} color={iconColor} />
          )}
        </View>
      )}
    </Pressable>
  );
}
