import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from '../../lib/i18n';
import { useTheme } from '../../lib/ThemeContext';

export default function LocalDictSettingsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen
        options={{
          title: t('localDictionary'),
          headerBackTitle: t('back'),
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />
      <View style={{ flex: 1, backgroundColor: theme.background }} />
    </>
  );
}
