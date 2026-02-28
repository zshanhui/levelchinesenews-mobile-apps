import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export function SeedIndicator() {
  return (
    <View style={styles.container}>
      <Ionicons name="leaf-outline" size={16} color={theme.textMuted} />
      <Text style={styles.text}>Seed data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 8,
  },
  text: {
    fontSize: 12,
    color: theme.textMuted,
  },
});
