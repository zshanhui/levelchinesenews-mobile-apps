import {
  glitchTipEnabled,
  navigationIntegration,
  Sentry,
} from '../lib/glitchtipInit';
import '../lib/i18n';
import { FontProvider } from '../lib/FontContext';
import { NativeLanguageProvider } from '../lib/NativeLanguageContext';
import { I18nSync } from '../lib/i18n/I18nSync';
import { ThemeProvider, useTheme } from '../lib/ThemeContext';
import { Stack, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

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

function RootLayout() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (glitchTipEnabled && navigationRef && navigationIntegration) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  return (
    <ThemeProvider>
      <RootContent />
    </ThemeProvider>
  );
}

export default glitchTipEnabled ? Sentry.wrap(RootLayout) : RootLayout;
