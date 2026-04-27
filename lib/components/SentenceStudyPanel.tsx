import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { i18n, useTranslation } from '../i18n';
import { useFont } from '../FontContext';
import { getTotalLcnDictEntriesCount } from '../localDatabase';
import { useTheme } from '../ThemeContext';
import {
  resolveDictLookup,
  type DictLookupMatch,
} from '../useLocalDictService';
import type { Theme } from '../theme';

const isWebLocalhost =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const showPlecoButton = Platform.OS !== 'web' || isWebLocalhost;
const useOptimisticPlecoOpen = true;

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
  const [dictMatches, setDictMatches] = useState<DictLookupMatch[]>([]);
  const [lookupComplete, setLookupComplete] = useState(false);
  const [hasLocalDictData, setHasLocalDictData] = useState<boolean | null>(null);
  const [isPlecoInstalled, setIsPlecoInstalled] = useState(false);
  const stackPinyinUnderWord = word.length >= 4;

  useEffect(() => {
    let cancelled = false;
    setDictMatches([]);
    setLookupComplete(false);
    setHasLocalDictData(null);
    const runLookup = async () => {
      try {
        const [lookupResult, totalCount] = await Promise.all([
          resolveDictLookup(word),
          getTotalLcnDictEntriesCount(),
        ]);
        if (cancelled) return;
        setDictMatches(lookupResult.matches);
        setHasLocalDictData(totalCount > 0);
      } catch (err) {
        if (cancelled) return;
        console.warn(`Study panel lookup warning for "${word}":`, err);
        setDictMatches([]);
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
    if (!showPlecoButton) {
      setIsPlecoInstalled(false);
      return;
    }
    if (useOptimisticPlecoOpen) {
      setIsPlecoInstalled(true);
    };
  }, []);

  const openInPleco = useCallback(async () => {
    const url = buildPlecoUrl(
      word,
      pinyin,
      articleId,
      highlightedWordKey,
      highlightedSentenceKey
    );
    try {
      await Linking.openURL(url);
    } catch {
      await Linking.openURL('https://www.pleco.com?from=levelchinesenews.app');
    }
  }, [word, pinyin, articleId, highlightedWordKey, highlightedSentenceKey]);

  const openLocalDictSettings = useCallback(() => {
    router.push('/settings/localdict');
  }, [router]);

  const showMissingDictSetup = lookupComplete && !hasLocalDictData;
  const showDefinitionText =
    !lookupComplete || dictMatches.some((match) => Boolean(match.entry.definitions));
  const showSplitMatches = dictMatches.length > 1;
  const singleMatch = dictMatches[0] ?? null;
  /** Tighten list + header spacing when many sub-word lines would make the panel very tall. */
  const compactMultiSplit = dictMatches.length >= 3;

  return (
    <View
      style={[
        styles.panel,
        compactMultiSplit && styles.panelCompact,
        { paddingBottom: Math.max(bottomInset, 16) },
      ]}
    >
      <View style={[styles.panelHeader, compactMultiSplit && styles.panelHeaderCompact]}>
        <View
          style={[
            styles.panelHeaderContent,
            stackPinyinUnderWord ? styles.panelHeaderContentStacked : null,
            stackPinyinUnderWord && compactMultiSplit
              ? styles.panelHeaderContentStackedCompact
              : null,
          ]}
        >
          <Text
            style={[
              styles.panelWord,
              compactMultiSplit && styles.panelWordCompact,
              chineseFontStyle,
            ]}
          >
            {word}
          </Text>
          {pinyin ? (
            <Text
              style={[
                styles.panelPinyin,
                stackPinyinUnderWord ? styles.panelPinyinUnderWord : null,
                compactMultiSplit && styles.panelPinyinCompact,
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
              onPress={() => {
                void openInPleco();
              }}
              style={({ pressed }) => [
                styles.plecoButton,
                !isPlecoInstalled ? styles.plecoWebsiteButton : null,
                compactMultiSplit && styles.plecoButtonCompact,
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
      {showMissingDictSetup || showDefinitionText ? (
        <View
          style={[styles.panelDefinition, compactMultiSplit && styles.panelDefinitionCompact]}
        >
          {showMissingDictSetup ? (
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
          ) : showSplitMatches ? (
            <View
              style={[
                styles.panelDefinitionList,
                compactMultiSplit && styles.panelDefinitionListCompact,
              ]}
            >
              {dictMatches.map((match, idx) => (
                <View
                  key={`${match.lookupText}:${match.entry.id}`}
                  style={[
                    styles.panelDefinitionItem,
                    compactMultiSplit && styles.panelDefinitionItemCompact,
                    idx > 0
                      ? [
                          styles.panelDefinitionItemDivider,
                          compactMultiSplit && styles.panelDefinitionItemDividerCompact,
                        ]
                      : null,
                  ]}
                >
                  <View
                    style={[
                      styles.panelDefinitionItemHeader,
                      compactMultiSplit && styles.panelDefinitionItemHeaderCompact,
                    ]}
                  >
                    <Text
                      style={[
                        styles.panelDefinitionItemWord,
                        compactMultiSplit && styles.panelDefinitionItemWordCompact,
                        chineseFontStyle,
                      ]}
                    >
                      {match.lookupText}
                    </Text>
                    {match.entry.pinyin ? (
                      <Text
                        style={[
                          styles.panelDefinitionItemPinyin,
                          compactMultiSplit && styles.panelDefinitionItemPinyinCompact,
                          chineseFontStyle,
                        ]}
                      >
                        {match.entry.pinyin}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.panelDefinitionText,
                      compactMultiSplit && styles.panelDefinitionTextSplitCompact,
                      styles.panelDefinitionTextLoaded,
                      chineseFontStyle,
                    ]}
                  >
                    {match.entry.definitions}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text
              style={[
                styles.panelDefinitionText,
                singleMatch?.entry.definitions ? styles.panelDefinitionTextLoaded : null,
                chineseFontStyle,
              ]}
            >
              {singleMatch?.entry.definitions ?? t('nativeLanguageDefinitionPlaceholder')}
            </Text>
          )}
        </View>
      ) : null}
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
    panelCompact: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    panelHeaderCompact: {
      marginBottom: 6,
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
    panelHeaderContentStackedCompact: {
      gap: 0,
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
    panelPinyinCompact: {
      fontSize: 12,
    },
    panelWord: {
      fontSize: 22,
      fontWeight: '700',
      color: isDark ? theme.text : theme.accent,
    },
    panelWordCompact: {
      fontSize: 20,
    },
    panelDefinition: {
      paddingTop: 8,
    },
    panelDefinitionCompact: {
      paddingTop: 4,
    },
    panelDefinitionMissingDict: {
      gap: 8,
    },
    panelDefinitionList: {
      gap: 12,
    },
    panelDefinitionListCompact: {
      gap: 5,
    },
    panelDefinitionItem: {
      gap: 6,
    },
    panelDefinitionItemCompact: {
      gap: 2,
    },
    panelDefinitionItemDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
      paddingTop: 12,
    },
    panelDefinitionItemDividerCompact: {
      paddingTop: 5,
    },
    panelDefinitionItemHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
      flexWrap: 'wrap',
    },
    panelDefinitionItemHeaderCompact: {
      gap: 5,
    },
    panelDefinitionItemWord: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? theme.text : theme.accent,
    },
    panelDefinitionItemWordCompact: {
      fontSize: 16,
    },
    panelDefinitionItemPinyin: {
      fontSize: 13,
      color: theme.textMuted,
    },
    panelDefinitionItemPinyinCompact: {
      fontSize: 12,
    },
    panelDefinitionText: {
      fontSize: 14,
      color: theme.textMuted,
    },
    panelDefinitionTextSplitCompact: {
      fontSize: 12,
      lineHeight: 16,
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
    plecoButtonCompact: {
      paddingVertical: 5,
      paddingHorizontal: 9,
      gap: 4,
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
