import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import type { Theme } from '../lib/theme';
import { useTheme } from '../lib/ThemeContext';

export default function NotFoundScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <>
      <Stack.Screen
        options={{
          title: 'oops! not found',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />
      <View style={styles.container}>
        <Link href="/" style={styles.link}>
          go back to home
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
