import { Stack } from 'expo-router';
import { ScrollView, Text } from 'react-native';
import { useTranslation } from '../lib/i18n';
import { useTheme } from '../lib/ThemeContext';

export default function DictionarySettingsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
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
