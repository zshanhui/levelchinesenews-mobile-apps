import { useMemo } from 'react';
import { useTranslation } from '../../lib/i18n';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/ThemeContext';

export default function ArticlesScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        flex: { flex: 1 },
        content: {
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: 32,
          justifyContent: 'center',
        },
        text: {
          fontSize: 15,
          lineHeight: 22,
          color: theme.textSecondary,
          textAlign: 'center',
        },
      }),
    [theme],
  );
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.text}>{t('articleFeedNotSupportedOnWeb')}</Text>
      </ScrollView>
    </View>
  );
}
