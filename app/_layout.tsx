import { FontProvider } from '../lib/FontContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <FontProvider>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="article/[id]" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </FontProvider>
  );
}
