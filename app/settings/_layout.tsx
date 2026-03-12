import { Stack } from 'expo-router';
import { useTheme } from '../../lib/ThemeContext';

export default function SettingsLayout() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.text,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="localdict" />
    </Stack>
  );
}
