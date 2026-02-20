import { StyleSheet, Text, View } from 'react-native';
import { useFont } from '../../lib/FontContext';
import { theme } from '../../lib/theme';

export default function CreateScreen() {
  const { chineseFontStyle } = useFont();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, chineseFontStyle]}>Create</Text>
      <Text style={[styles.subtitle, chineseFontStyle]}>
        Enter a URL to scrape an article
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    color: theme.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
  },
});
