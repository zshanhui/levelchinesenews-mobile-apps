import { Stack } from 'expo-router';
import SettingsScreen from '../(tabs)/settings';
import { useTranslation } from '../../lib/i18n';
import { useTheme } from '../../lib/ThemeContext';

export default function SettingsRoute() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen
        options={{
          title: t('settings'),
          headerBackTitle: t('back'),
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />
      <SettingsScreen />
    </>
  );
}
