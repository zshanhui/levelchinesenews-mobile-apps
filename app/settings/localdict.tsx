import { useMemo } from 'react';
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useTranslation } from '../../lib/i18n';
import { useTheme } from '../../lib/ThemeContext';

export default function LocalDictSettingsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <>
      <Stack.Screen
        options={{
          title: t('configureLocalDict'),
          headerBackTitle: t('back'),
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />
      <ScrollView
        style={styles.webUnsupportedContainer}
        contentContainerStyle={styles.webUnsupportedContent}
      >
        <Text style={styles.webUnsupportedText}>
          {t('localDatabaseNotSupportedOnWeb')}
        </Text>
      </ScrollView>
    </>
  );
}

function createStyles(theme: import('../../lib/theme').Theme) {
  return StyleSheet.create({
    webUnsupportedContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    webUnsupportedContent: {
      flexGrow: 1,
      padding: 20,
      paddingBottom: 32,
      justifyContent: 'center',
    },
    webUnsupportedText: {
      fontSize: 15,
      color: theme.textSecondary,
      lineHeight: 22,
      textAlign: 'center',
    },
  });
}
