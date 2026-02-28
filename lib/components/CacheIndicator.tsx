import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

function formatCachedAt(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (isToday) {
      return d.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
    }
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function CacheIndicator({ cachedAt }: { cachedAt: string }) {
  const label = formatCachedAt(cachedAt);
  if (!label) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Cached {label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 8,
    marginLeft: 8,
  },
  text: {
    fontSize: 12,
    color: theme.textMuted,
  },
});
