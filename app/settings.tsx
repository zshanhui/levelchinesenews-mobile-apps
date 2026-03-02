import { Stack } from 'expo-router';
import SettingsScreen from './(tabs)/settings';
import { useTheme } from '../lib/ThemeContext';

export default function SettingsRoute() {
  const { theme } = useTheme();
  return (
    <>
      <Stack.Screen
        options={{
          title: 'settings',
          headerBackTitle: 'back',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />
      <SettingsScreen />
    </>
  );
}
