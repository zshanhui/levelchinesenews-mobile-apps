import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../i18n';
import { useFont } from '../FontContext';
import { useTheme } from '../ThemeContext';
import type { Theme } from '../theme';

const URL_HOME_PAGE = 'https://levelchinese.app';

export type SentenceStudyPanelProps = {
  word: string;
  pinyin: string | null;
  articleId: string;
  highlightedWordKey: string;
  highlightedSentenceKey: string;
  bottomInset: number;
};

export function SentenceStudyPanel({
  word,
  pinyin,
  bottomInset,
}: SentenceStudyPanelProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { chineseFontStyle, chinesePinyinFontStyle } = useFont();
  const stackPinyinUnderWord = word.length >= 4;

  const openHomePageToDownloadApp = useCallback(() => {
    void Linking.openURL(URL_HOME_PAGE);
  }, []);

  return (
    <View style={[styles.panel, { paddingBottom: Math.max(bottomInset, 16) }]}>
      <View style={styles.panelHeader}>
        <View
          style={[
            styles.panelHeaderContent,
            stackPinyinUnderWord ? styles.panelHeaderContentStacked : null,
          ]}
        >
          <Text style={[styles.panelWord, chineseFontStyle]}>{word}</Text>
          {pinyin ? (
            <Text
              style={[
                styles.panelPinyin,
                stackPinyinUnderWord ? styles.panelPinyinUnderWord : null,
                chinesePinyinFontStyle,
              ]}
            >
              {pinyin}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.panelDefinition}>
        <View style={styles.panelDefinitionMissingDict}>
          <Text
            style={[
              styles.panelDefinitionText,
              styles.panelDefinitionTextMissing,
              chineseFontStyle,
            ]}
          >
            {t('localDatabaseNotSupportedOnWeb')}
          </Text>
          <Pressable
            onPress={openHomePageToDownloadApp}
            accessibilityRole="link"
            accessibilityLabel={t('goBackHome')}
          >
            {({ pressed }) => (
              <View
                style={[
                  styles.panelDefinitionLinkRow,
                  pressed && styles.panelDefinitionLinkRowPressed,
                ]}
              >
                <Text style={styles.panelDefinitionLink}>{t('goBackHome')}</Text>
                <Ionicons name="open-outline" size={14} color={theme.accent} />
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: Theme, isDark: boolean) {
  return StyleSheet.create({
    panel: {
      backgroundColor: theme.surface,
      paddingHorizontal: 20,
      paddingTop: 20,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 8,
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    panelHeaderContent: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 10,
    },
    panelHeaderContentStacked: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 2,
    },
    panelPinyin: {
      fontSize: 14,
      color: theme.textMuted,
    },
    panelPinyinUnderWord: {
      fontSize: 13,
    },
    panelWord: {
      fontSize: 22,
      fontWeight: '700',
      color: isDark ? theme.text : theme.accent,
    },
    panelDefinition: {
      paddingTop: 8,
    },
    panelDefinitionMissingDict: {
      gap: 8,
    },
    panelDefinitionText: {
      fontSize: 14,
      color: theme.textMuted,
    },
    panelDefinitionTextMissing: {
      color: theme.textMuted,
      fontStyle: 'italic',
    },
    panelDefinitionLink: {
      fontSize: 14,
      color: theme.accent,
      textDecorationLine: 'underline',
    },
    panelDefinitionLinkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      alignSelf: 'flex-end',
    },
    panelDefinitionLinkRowPressed: {
      opacity: 0.75,
    },
  });
}
