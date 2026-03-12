import { useMemo } from 'react';
import { useTranslation } from '../i18n';
import { StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';

export function SeedIndicator() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('seedData')}</Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 8,
  },
  text: {
    fontSize: 12,
    color: theme.textMuted,
  },
  });
}
