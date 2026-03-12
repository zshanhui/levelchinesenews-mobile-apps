import { useMemo } from 'react';
import { useTranslation } from '../lib/i18n';
import { View, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import type { Theme } from '../lib/theme';
import { useTheme } from '../lib/ThemeContext';

export default function NotFoundScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <>
      <Stack.Screen
        options={{
          title: t('notFound'),
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />
      <View style={styles.container}>
        <Link href="/" style={styles.link}>
          {t('goBackHome')}
        </Link>
      </View>
    </>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: {
    fontSize: 18,
    color: theme.accent,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  });
}
