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
import { ThemeProvider, useTheme } from '../lib/ThemeContext';
import { Stack, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../lib/i18n';

function WebUnsupportedScreen() {
  const { t } = useTranslation();
  return (
    <View style={webGateStyles.root} accessibilityRole="text">
      <Text style={webGateStyles.brand}>{t('brand')}</Text>
      <Text style={webGateStyles.message}>{t('appNativePlatformsOnly')}</Text>
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

function NativeRootLayout() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
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
      <RootContent />
    </ThemeProvider>
  );
}

function RootLayout() {
  if (Platform.OS === 'web') {
    return <WebUnsupportedScreen />;
  }
  return <NativeRootLayout />;
}

const webGateStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#111814',
  },
  brand: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e8eee9',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: '#a8b5aa',
    textAlign: 'center',
    maxWidth: 360,
  },
});

export default glitchTipEnabled ? Sentry.wrap(RootLayout) : RootLayout;
