import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  getUserFriendlyErrorMessage,
  searchSentencesByWord,
} from '../../lib/api';
import { useTranslation } from '../../lib/i18n';
import {
  loadRecentSentenceSearches,
  rememberSentenceSearch,
} from '../../lib/recentSentenceSearches';
import {
  isChineseWord,
  splitHighlightSegments,
} from '../../lib/text-utils';
import type { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';
import type { WordSentenceItem, WordSentencesResponse } from '../../lib/types';

const PAGE_SIZE = 25;
const MIN_SENTENCE_LENGTH = 12;

function isLongEnoughSentence(item: WordSentenceItem): boolean {
  return item.sentence_text.length >= MIN_SENTENCE_LENGTH;
}

type SentenceRowStyles = {
  resultCard: object;
  resultCardPressed: object;
  sentenceText: object;
  highlightText: object;
  navHintRow: object;
  navHintText: object;
};

const SentenceExampleRow = memo(function SentenceExampleRow({
  item,
  word,
  arrowColor,
  styles,
}: {
  item: WordSentenceItem;
  word: string;
  arrowColor: string;
  styles: SentenceRowStyles;
}) {
  const segments = useMemo(
    () => splitHighlightSegments(item.sentence_text, word),
    [item.sentence_text, word],
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.resultCard,
        pressed && styles.resultCardPressed,
      ]}
      onPress={() =>
        router.push({
          pathname: '/article/[id]',
          params: {
            id: item.article_id,
            sentenceKey: `${item.paragraph_index}:${item.sentence_index}`,
          },
        })
      }
      accessibilityRole="button"
      accessibilityHint="Opens the article at this sentence"
    >
      <Text style={styles.sentenceText}>
        {segments.map((seg, i) =>
          seg.highlight ? (
            <Text key={i} style={styles.highlightText}>
              {seg.text}
            </Text>
          ) : (
            seg.text
          ),
        )}
      </Text>
      <View style={styles.navHintRow}>
        <Text style={styles.navHintText}>read article</Text>
        <Ionicons name="arrow-forward" size={18} color={arrowColor} />
      </View>
    </Pressable>
  );
});

export default function SentenceExamplesScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [query, setQuery] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WordSentencesResponse | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const highlightWord = result?.word ?? '';
  const showRecentSearches = result == null && !loading && recentSearches.length > 0;

  const visibleItems = useMemo(
    () => (result?.items ?? []).filter(isLongEnoughSentence),
    [result],
  );

  const hasMore =
    result != null && result.items.length < result.total;

  useEffect(() => {
    let cancelled = false;
    loadRecentSentenceSearches().then((words) => {
      if (!cancelled) setRecentSearches(words);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const runSearch = useCallback(async (word: string) => {
    const trimmed = word.trim();
    if (!trimmed) {
      setError(null);
      setResult(null);
      return;
    }

    if (!isChineseWord(trimmed)) {
      setResult(null);
      setError('Only single Chinese words can be search (中文). No latin alphabet, numeral, or punctuations.');
      return;
    }

    setQuery(trimmed);
    setLoading(true);
    setError(null);
    try {
      const data = await searchSentencesByWord(trimmed, {
        page: 1,
        pageSize: PAGE_SIZE,
      });
      setResult(data);
      const nextRecent = await rememberSentenceSearch(data.word || trimmed);
      setRecentSearches(nextRecent);
    } catch (err) {
      setResult(null);
      setError(getUserFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!result || loading || loadingMore || !hasMore) return;

    setLoadingMore(true);
    setError(null);
    try {
      const nextPage = result.page + 1;
      const data = await searchSentencesByWord(result.word, {
        page: nextPage,
        pageSize: PAGE_SIZE,
      });
      setResult({
        ...data,
        items: [...result.items, ...data.items],
      });
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loading, loadingMore, result]);

  const renderItem = useCallback(
    ({ item }: { item: WordSentenceItem }) => (
      <SentenceExampleRow
        item={item}
        word={highlightWord}
        arrowColor={theme.accent}
        styles={styles}
      />
    ),
    [highlightWord, styles, theme.accent],
  );

  const listHeader = useMemo(() => {
    if (!result || loading) return null;
    const metaParts: string[] = [];
    if (result.pinyin) metaParts.push(result.pinyin);
    if (result.hsk_level != null) metaParts.push(`HSK ${result.hsk_level}`);
    const countLabel = `${result.total} example${result.total === 1 ? '' : 's'}`;

    return (
      <View style={styles.resultMeta}>
        <View style={styles.resultMetaLeft}>
          <Text style={styles.resultWord}>{result.word}</Text>
          {metaParts.length > 0 ? (
            <Text style={styles.resultMetaText} numberOfLines={1}>
              {metaParts.join(' · ')}
            </Text>
          ) : null}
        </View>
        <Text style={styles.resultCountText}>{countLabel}</Text>
      </View>
    );
  }, [loading, result, styles]);

  const listEmpty = useMemo(() => {
    if (loading || error || result == null || visibleItems.length > 0) return null;
    return (
      <Text style={styles.emptyText}>No sentences found for this word.</Text>
    );
  }, [error, loading, result, styles, visibleItems.length]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Sentence examples',
          headerBackTitle: t('back'),
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />
      <View style={styles.container}>
        <View style={styles.searchRow}>
          <Pressable
            style={[
              styles.inputShell,
              inputFocused && styles.inputShellFocused,
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={theme.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Search a Chinese word"
              placeholderTextColor={theme.textMuted}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onSubmitEditing={() => runSearch(query)}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              editable={!loading}
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => {
                  setQuery('');
                  setResult(null);
                  setError(null);
                }}
                hitSlop={8}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={18} color={theme.textMuted} />
              </Pressable>
            )}
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.searchButton,
              (loading || !query.trim()) && styles.searchButtonDisabled,
              pressed && !loading && query.trim() && styles.searchButtonPressed,
            ]}
            onPress={() => runSearch(query)}
            disabled={loading || !query.trim()}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="search" size={22} color="#fff" />
            )}
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={theme.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {showRecentSearches ? (
          <View style={styles.recentSection}>
            <Text style={styles.recentLabel}>Recent searches</Text>
            <View style={styles.recentChips}>
              {recentSearches.map((word) => (
                <Pressable
                  key={word}
                  style={({ pressed }) => [
                    styles.recentChip,
                    pressed && styles.recentChipPressed,
                  ]}
                  onPress={() => runSearch(word)}
                  accessibilityRole="button"
                  accessibilityLabel={`Search ${word}`}
                >
                  <Text style={styles.recentChipText}>{word}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <FlatList
          data={visibleItems}
          keyExtractor={(item) => item.sentence_id}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={7}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                style={styles.footerLoader}
                color={theme.accent}
              />
            ) : null
          }
        />
      </View>
    </>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    inputShell: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 10,
      minHeight: 44,
    },
    inputShellFocused: {
      borderColor: theme.accent,
    },
    searchIcon: {
      marginRight: 6,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      paddingVertical: 10,
    },
    clearButton: {
      padding: 2,
    },
    searchButton: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchButtonPressed: {
      opacity: 0.85,
    },
    searchButtonDisabled: {
      opacity: 0.45,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 10,
      borderRadius: 8,
      backgroundColor: theme.error + '18',
    },
    errorText: {
      flex: 1,
      fontSize: 13,
      color: theme.error,
    },
    recentSection: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    recentLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 8,
    },
    recentChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    recentChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    recentChipPressed: {
      opacity: 0.75,
      backgroundColor: theme.etchedBg,
    },
    recentChipText: {
      fontSize: 16,
      color: theme.text,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 40,
      flexGrow: 1,
    },
    resultMeta: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 12,
      marginTop: 4,
    },
    resultMetaLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 10,
      minWidth: 0,
    },
    resultWord: {
      fontSize: 22,
      fontWeight: '600',
      color: theme.text,
    },
    resultMetaText: {
      flexShrink: 1,
      fontSize: 13,
      color: theme.textSecondary,
    },
    resultCountText: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    resultCard: {
      backgroundColor: theme.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 10,
    },
    resultCardPressed: {
      opacity: 0.75,
      backgroundColor: theme.etchedBg,
    },
    sentenceText: {
      fontSize: 17,
      lineHeight: 26,
      color: theme.text,
    },
    highlightText: {
      color: theme.accent,
      fontWeight: '700',
    },
    navHintRow: {
      alignSelf: 'flex-end',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
    },
    navHintText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.accent,
    },
    emptyText: {
      marginTop: 24,
      fontSize: 14,
      color: theme.textMuted,
      textAlign: 'center',
    },
    footerLoader: {
      marginVertical: 16,
    },
  });
}
