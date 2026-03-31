import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { i18n, useTranslation } from '../i18n';
import { useFont } from '../FontContext';
import { getTotalLcnDictEntriesCount } from '../localDatabase';
import { useTheme } from '../ThemeContext';
import { fetchDictEntryByWord } from '../useLocalDictService';
import type { Theme } from '../theme';

const isWebLocalhost =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const showPlecoButton = Platform.OS !== 'web' || isWebLocalhost;

export type SentenceStudyPanelProps = {
  word: string;
  pinyin: string | null;
  articleId: string;
  highlightedWordKey: string;
  highlightedSentenceKey: string;
  bottomInset: number;
};

function buildPlecoUrl(
  word: string,
  pinyin: string | null,
  articleId: string,
  wordKey: string,
  sentenceKey: string
): string {
  const returnParams = new URLSearchParams({ word, wordKey, sentenceKey });
  const xSuccess = `lcn://article/${articleId}?${returnParams.toString()}`;

  const useSearch = word.length >= 2;
  const baseParams: Record<string, string> = {
    'x-source': i18n.t('plecoSource'),
    'x-success': xSuccess,
  };

  if (useSearch) {
    baseParams.q = word;
    return `plecoapi://x-callback-url/s?${new URLSearchParams(baseParams).toString()}`;
  }

  const dfParams = new URLSearchParams({ hw: word, ...baseParams });
  if (pinyin) dfParams.set('py', pinyin);
  return `plecoapi://x-callback-url/df?${dfParams.toString()}`;
}

export function SentenceStudyPanel({
  word,
  pinyin,
  articleId,
  highlightedWordKey,
  highlightedSentenceKey,
  bottomInset,
}: SentenceStudyPanelProps) {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { chineseFontStyle } = useFont();
  const [dictEntry, setDictEntry] = useState<{ definitions: string } | null>(null);
  const [lookupComplete, setLookupComplete] = useState(false);
  const [hasLocalDictData, setHasLocalDictData] = useState<boolean | null>(null);
  const [isPlecoInstalled, setIsPlecoInstalled] = useState(false);
  const stackPinyinUnderWord = word.length >= 4;

  useEffect(() => {
    let cancelled = false;
    setDictEntry(null);
    setLookupComplete(false);
    setHasLocalDictData(null);
    const runLookup = async () => {
      try {
        const [entry, totalCount] = await Promise.all([
          fetchDictEntryByWord(word),
          getTotalLcnDictEntriesCount(),
        ]);
        if (cancelled) return;
        setDictEntry(entry ?? null);
        setHasLocalDictData(totalCount > 0);
      } catch (err) {
        if (cancelled) return;
        console.warn(`Study panel lookup warning for "${word}":`, err);
        setDictEntry(null);
        setHasLocalDictData(false);
      } finally {
        if (!cancelled) {
          setLookupComplete(true);
        }
      }
    };
    void runLookup();
    return () => {
      cancelled = true;
    };
  }, [word]);

  useEffect(() => {
    let cancelled = false;
    if (!showPlecoButton) {
      setIsPlecoInstalled(false);
      return () => {
        cancelled = true;
      };
    }
    const checkPlecoAvailability = async () => {
      try {
        const available = await Linking.canOpenURL('plecoapi://');
        if (!cancelled) {
          setIsPlecoInstalled(available);
        }
      } catch {
        if (!cancelled) {
          setIsPlecoInstalled(false);
        }
      }
    };
    void checkPlecoAvailability();
    return () => {
      cancelled = true;
    };
  }, []);

  const openInPleco = useCallback(() => {
    const url = buildPlecoUrl(
      word,
      pinyin,
      articleId,
      highlightedWordKey,
      highlightedSentenceKey
    );
    Linking.openURL(url);
  }, [word, pinyin, articleId, highlightedWordKey, highlightedSentenceKey]);

  const openPlecoWebsite = useCallback(() => {
    Linking.openURL('https://www.pleco.com?from=levelchinesenews.app');
  }, []);

  const openLocalDictSettings = useCallback(() => {
    router.push('/settings/localdict');
  }, [router]);

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
                chineseFontStyle,
              ]}
            >
              {pinyin}
            </Text>
          ) : null}
        </View>
        <View style={styles.panelHeaderRight}>
          {showPlecoButton ? (
            <Pressable
              onPress={isPlecoInstalled ? openInPleco : openPlecoWebsite}
              style={({ pressed }) => [
                styles.plecoButton,
                !isPlecoInstalled ? styles.plecoWebsiteButton : null,
                pressed && styles.plecoButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                isPlecoInstalled ? t('openInPleco') : t('openPlecoWebsite')
              }
            >
              <Text
                style={[
                  styles.plecoButtonText,
                  !isPlecoInstalled ? styles.plecoWebsiteButtonText : null,
                ]}
              >
                {isPlecoInstalled ? t('pleco') : t('getPleco')}
              </Text>
              <Ionicons
                name={isPlecoInstalled ? 'search-outline' : 'open-outline'}
                size={isPlecoInstalled ? 14 : 12}
                color={isPlecoInstalled ? '#fff' : theme.textMuted}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={styles.panelDefinition}>
        {lookupComplete && !hasLocalDictData ? (
          <View style={styles.panelDefinitionMissingDict}>
            <Text
              style={[
                styles.panelDefinitionText,
                styles.panelDefinitionTextMissing,
                chineseFontStyle,
              ]}
            >
              {t('loadLocalDictFirstHint')}
            </Text>
            <Pressable onPress={openLocalDictSettings} accessibilityRole="button">
              {({ pressed }) => (
                <View
                  style={[
                    styles.panelDefinitionLinkRow,
                    pressed && styles.panelDefinitionLinkRowPressed,
                  ]}
                >
                  <Text style={styles.panelDefinitionLink}>{t('setupLocalDict')}</Text>
                  <Ionicons
                    name="arrow-forward-outline"
                    size={14}
                    color={theme.accent}
                  />
                </View>
              )}
            </Pressable>
          </View>
        ) : (
          <Text
            style={[
              styles.panelDefinitionText,
              dictEntry?.definitions ? styles.panelDefinitionTextLoaded : null,
              lookupComplete && !dictEntry?.definitions
                ? styles.panelDefinitionTextMissing
                : null,
              chineseFontStyle,
            ]}
          >
            {dictEntry?.definitions ??
              (lookupComplete
                ? t('wordMissingInLocalDict')
                : t('nativeLanguageDefinitionPlaceholder'))}
          </Text>
        )}
      </View>
    </View>
  );
}

function createStyles(theme: Theme, _isDark: boolean) {
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
    panelHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
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
      color: '#6a0000',
      fontWeight: '700',
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
    panelDefinitionTextLoaded: {
      color: theme.textSecondary,
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
    plecoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: '#0078c3',
      borderRadius: 8,
    },
    plecoWebsiteButton: {
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 7,
    },
    plecoButtonPressed: {
      opacity: 0.9,
    },
    plecoButtonText: {
      fontSize: 14,
      color: '#fff',
      fontWeight: '400',
    },
    plecoWebsiteButtonText: {
      color: theme.textMuted,
      fontSize: 12,
    },
  });
}
