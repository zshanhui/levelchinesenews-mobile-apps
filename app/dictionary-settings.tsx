import { Stack } from 'expo-router';
import { Platform, ScrollView, Text, View } from 'react-native';
import { useTranslation } from '../lib/i18n';
import { useTheme } from '../lib/ThemeContext';

export default function DictionarySettingsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  if (Platform.OS === 'web') {
    return (
      <>
        <Stack.Screen
          options={{
            title: t('localDictionarySettings'),
            headerBackTitle: t('back'),
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.text,
          }}
        />
        <ScrollView
          style={{ flex: 1, backgroundColor: theme.background }}
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 15,
              color: theme.textSecondary,
              lineHeight: 22,
              textAlign: 'center',
            }}
          >
            {t('localDatabaseNotSupportedOnWeb')}
          </Text>
        </ScrollView>
      </>
    );
  }
  return (
    <>
      <Stack.Screen
        options={{
          title: t('localDictionarySettings'),
          headerBackTitle: t('back'),
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />
      <View style={{ flex: 1, backgroundColor: theme.background }} />
    </>
  );
}
