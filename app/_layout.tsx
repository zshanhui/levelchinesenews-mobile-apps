import {
  glitchTipEnabled,
  navigationIntegration,
  Sentry,
} from '../lib/glitchtipInit';
import '../lib/i18n';
import { FontProvider } from '../lib/FontContext';
import { getOrCreateInstallationId } from '../lib/localDatabase';
import { setMonitoringInstallationId } from '../lib/monitoring';
import { NativeLanguageProvider } from '../lib/NativeLanguageContext';
import { I18nSync } from '../lib/i18n/I18nSync';
import { WEB_MAX_VIEWPORT_WIDTH } from '../lib/constants';
import { installWebScrollbarStyles } from '../lib/webScrollbarStyles';
import { ThemeProvider, useTheme } from '../lib/ThemeContext';
import { Stack, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';

function WebViewportShell({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }
  return (
    <View style={{ flex: 1, width: '100%', backgroundColor: theme.background }}>
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: WEB_MAX_VIEWPORT_WIDTH,
          alignSelf: 'center',
        }}
      >
        {children}
      </View>
    </View>
  );
}

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
    if (Platform.OS === 'web') {
      installWebScrollbarStyles();
      return;
    }
    getOrCreateInstallationId()
      .then((installationId) => {
        setMonitoringInstallationId(installationId);
      })
      .catch((err) => {
        console.warn('Failed to initialize installation id:', err);
      });
  }, []);

  useEffect(() => {
    if (glitchTipEnabled && navigationRef && navigationIntegration) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  return (
    <ThemeProvider>
      <WebViewportShell>
        <RootContent />
      </WebViewportShell>
    </ThemeProvider>
  );
}

export default glitchTipEnabled ? Sentry.wrap(RootLayout) : RootLayout;
