import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '../lib/ThemeContext';

export default function DictionarySettingsScreen() {
  const { theme } = useTheme();
  return (
    <>
      <Stack.Screen
        options={{
          title: 'local dictionary settings',
          headerBackTitle: 'back',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />
      <View style={{ flex: 1, backgroundColor: theme.background }} />
    </>
  );
}
