import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';

/** Visual is 80% of original; hit area stays full size for tapping. */
const ICON_SIZE = 12.75 * 0.8;

type SentenceTranslateToggleProps = {
  expanded: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  /** Red when a cached translation exists; faded grey when not. */
  iconColor: string;
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
  hitStyle,
  faceStyle,
  facePressedStyle,
}: SentenceTranslateToggleProps) {
  return (
    <Pressable
      style={hitStyle}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded }}
    >
      {({ pressed }) => (
        <View style={[faceStyle, pressed && facePressedStyle]}>
          <Ionicons name="language-outline" size={ICON_SIZE} color={iconColor} />
        </View>
      )}
    </Pressable>
  );
}
