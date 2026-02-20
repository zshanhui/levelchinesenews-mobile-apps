import { View, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { theme } from '../lib/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Oops! Not Found',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />
      <View style={styles.container}>
        <Link href="/" style={styles.link}>
          Go back to Home
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
