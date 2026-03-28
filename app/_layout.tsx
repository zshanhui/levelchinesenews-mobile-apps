import '../lib/i18n';
import { FontProvider } from '../lib/FontContext';
import { NativeLanguageProvider } from '../lib/NativeLanguageContext';
import { I18nSync } from '../lib/i18n/I18nSync';
import { ThemeProvider, useTheme } from '../lib/ThemeContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

function RootContent() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NativeLanguageProvider>
        <FontProvider>
          <I18nSync />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="article/[id]" />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="dictionary-settings" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </FontProvider>
      </NativeLanguageProvider>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootContent />
    </ThemeProvider>
  );
}
