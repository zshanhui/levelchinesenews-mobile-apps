import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';

type SentenceTranslateToggleProps = {
  expanded: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  accentColor: string;
  defaultColor: string;
  buttonStyle: object;
  buttonPressedStyle: object;
};

export function SentenceTranslateToggle({
  expanded,
  onPress,
  accessibilityLabel,
  accentColor,
  defaultColor,
  buttonStyle,
  buttonPressedStyle,
}: SentenceTranslateToggleProps) {
  return (
    <Pressable
      style={({ pressed }) => [buttonStyle, pressed && buttonPressedStyle]}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded }}
    >
      <View
        style={{
          width: 27,
          height: 27,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons
          name="language-outline"
          size={12.75}
          color={expanded ? accentColor : defaultColor}
        />
      </View>
    </Pressable>
  );
}
