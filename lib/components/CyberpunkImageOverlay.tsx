import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

/** Neon blue cyberpunk tint for images in dark mode. */
export function CyberpunkImageOverlay() {
  return (
    <LinearGradient
      colors={[
        'rgba(0, 40, 80, 0.55)',
        'rgba(0, 160, 255, 0.5)',
        'rgba(40, 0, 120, 0.58)',
      ]}
      locations={[0, 0.45, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}
