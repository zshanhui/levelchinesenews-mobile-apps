import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFont } from '../../lib/FontContext';
import { useTranslation } from '../../lib/i18n';
import type { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';

export default function LearnIndexScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { fancyDisplayFontStyle } = useFont();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Pressable
          style={({ pressed }) => [
            styles.navRow,
            pressed && styles.navRowPressed,
          ]}
          onPress={() => router.push('/learn/sentence-examples')}
        >
          <View style={styles.navRowContent}>
            <View style={styles.navRowIcon}>
              <Ionicons name="chatbubbles-outline" size={20} color={theme.accent} />
            </View>
            <Text style={[styles.navRowLabel, fancyDisplayFontStyle]}>
              Sentence examples
            </Text>
          </View>
          <View style={styles.navRowChevron}>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </View>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.navRow,
            pressed && styles.navRowPressed,
          ]}
          onPress={() => router.push('/learn/word-list')}
        >
          <View style={styles.navRowContent}>
            <View style={styles.navRowIcon}>
              <Ionicons name="list-outline" size={20} color={theme.accent} />
            </View>
            <Text style={[styles.navRowLabel, fancyDisplayFontStyle]}>
              {t('wordList')}
            </Text>
          </View>
          <View style={styles.navRowChevron}>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 16,
      gap: 10,
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: theme.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    navRowPressed: {
      opacity: 0.7,
      backgroundColor: theme.etchedBg,
    },
    navRowContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    navRowIcon: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: theme.accent + '18',
      alignItems: 'center',
      justifyContent: 'center',
    },
    navRowLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.text,
      flex: 1,
    },
    navRowChevron: {
      marginLeft: 8,
      padding: 4,
    },
  });
}
