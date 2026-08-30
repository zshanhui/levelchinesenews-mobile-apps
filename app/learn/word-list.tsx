import Ionicons from '@expo/vector-icons/Ionicons';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { Stack, router, useFocusEffect } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { useFont } from '../../lib/FontContext';
import { useTranslation } from '../../lib/i18n';
import {
  getFirstExampleSentence,
  listWords,
  removeWord,
  setWordStatus,
  type SavedWordExample,
  type SavedWordListItem,
  type WordStatus,
} from '../../lib/savedWordsDb';
import { formatSentenceKey } from '../../lib/sentenceKeys';
import { showErrorFeedback } from '../../lib/showErrorFeedback';
import type { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';

const STATUS_SEGMENTS: WordStatus[] = ['learned', 'studying'];

const SWIPE_DELETE_WIDTH = 72;

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function moveWordToTop(
  prev: SavedWordListItem[],
  id: string,
  status: WordStatus,
): SavedWordListItem[] {
  const now = Date.now();
  const next = prev.map((w) =>
    w.id === id ? { ...w, status, updatedAt: now } : w,
  );
  const idx = next.findIndex((w) => w.id === id);
  if (idx <= 0) return next;
  const [row] = next.splice(idx, 1);
  return [row!, ...next];
}

const ACCORDION_MS = 220;

function animateAccordion() {
  LayoutAnimation.configureNext({
    duration: ACCORDION_MS,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: { type: LayoutAnimation.Types.easeInEaseOut },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
}

export default function WordListScreen() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [words, setWords] = useState<SavedWordListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<WordStatus>('studying');
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [examples, setExamples] = useState<Record<string, SavedWordExample | null>>(
    {},
  );
  const listRef = useRef<FlashListRef<SavedWordListItem>>(null);

  const loadWords = useCallback(async (opts?: { ignoreIfCancelled?: () => boolean }) => {
    try {
      const list = await listWords();
      if (opts?.ignoreIfCancelled?.()) return;
      setWords(list);
      setLoadError(null);
    } catch (e) {
      if (opts?.ignoreIfCancelled?.()) return;
      const message = e instanceof Error ? e.message : String(e);
      setLoadError(message);
      showErrorFeedback(t('wordListLoadFailed'), message);
    } finally {
      if (!opts?.ignoreIfCancelled?.()) setLoaded(true);
    }
  }, [t]);

  const loadWordsRef = useRef(loadWords);
  loadWordsRef.current = loadWords;
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void loadWordsRef.current({ ignoreIfCancelled: () => cancelled });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const studyingWords = useMemo(
    () => words.filter((w) => w.status === 'studying'),
    [words],
  );
  const learnedWords = useMemo(
    () => words.filter((w) => w.status === 'learned'),
    [words],
  );
  const visibleWords = statusFilter === 'studying' ? studyingWords : learnedWords;

  /** A full list + accordion grow can push the first row above the viewport; pin it back. */
  useEffect(() => {
    if (expandedId == null) return;
    if (visibleWords[0]?.id !== expandedId) return;
    const pinFirstWord = () => {
      try {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      } catch {
        // list may not be ready
      }
    };
    const raf = requestAnimationFrame(pinFirstWord);
    const timer = setTimeout(pinFirstWord, ACCORDION_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [expandedId, visibleWords]);

  const setStatusFilterAndCollapse = useCallback((key: WordStatus) => {
    if (key !== statusFilter) {
      animateAccordion();
      setExpandedId(null);
    }
    setStatusFilter(key);
  }, [statusFilter]);

  const onMarkLearned = useCallback(async (item: SavedWordListItem) => {
    try {
      await setWordStatus(item.id, 'learned');
      setWords((prev) => moveWordToTop(prev, item.id, 'learned'));
    } catch {
      showErrorFeedback(t('markLearnedFailed'));
    }
  }, [t]);

  const onSwitchToStudying = useCallback(async (item: SavedWordListItem) => {
    try {
      await setWordStatus(item.id, 'studying');
      setWords((prev) => moveWordToTop(prev, item.id, 'studying'));
    } catch {
      showErrorFeedback(t('markStudyingFailed'));
    }
  }, [t]);

  const onToggleExample = useCallback(async (item: SavedWordListItem) => {
    if (expandedId === item.id) {
      animateAccordion();
      setExpandedId(null);
      return;
    }
    if (examples[item.id] === undefined) {
      try {
        const example = await getFirstExampleSentence(item.id);
        animateAccordion();
        setExamples((prev) => ({ ...prev, [item.id]: example }));
        setExpandedId(item.id);
      } catch {
        showErrorFeedback(t('loadExampleFailed'));
      }
      return;
    }
    animateAccordion();
    setExpandedId(item.id);
  }, [expandedId, examples, t]);

  const onOpenExample = useCallback((example: SavedWordExample) => {
    router.push({
      pathname: '/article/[id]',
      params: {
        id: example.articleId,
        sentenceKey: formatSentenceKey(example.pidx, example.sidx),
      },
    });
  }, []);

  const onRemove = useCallback(async (item: SavedWordListItem) => {
    try {
      await removeWord(item.id);
      setWords((prev) => prev.filter((w) => w.id !== item.id));
      setExpandedId((id) => (id === item.id ? null : id));
    } catch {
      showErrorFeedback(t('removeWordFailed'));
    }
  }, [t]);

  const renderItem = useCallback(
    ({ item }: { item: SavedWordListItem }) => (
      <WordListRow
        item={item}
        styles={styles}
        expanded={expandedId === item.id}
        example={examples[item.id] ?? null}
        onToggleExample={onToggleExample}
        onOpenExample={onOpenExample}
        onMarkLearned={onMarkLearned}
        onSwitchToStudying={onSwitchToStudying}
        onRemove={onRemove}
      />
    ),
    [
      styles,
      expandedId,
      examples,
      onToggleExample,
      onOpenExample,
      onMarkLearned,
      onSwitchToStudying,
      onRemove,
    ],
  );

  const emptyCopy =
    statusFilter === 'studying' ? t('wordListEmpty') : t('wordListEmptyLearned');

  return (
    <>
      <Stack.Screen
        options={{
          title: t('wordList'),
          headerBackTitle: t('back'),
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />
      <View style={styles.container}>
        <View style={styles.filterBar} accessibilityRole="tablist">
          <View style={styles.filterChips}>
            {STATUS_SEGMENTS.map((key) => {
              const selected = statusFilter === key;
              const count = key === 'studying' ? studyingWords.length : learnedWords.length;
              const chipLabel = t(
                key === 'studying' ? 'wordListStudyingFilter' : 'wordListLearnedFilter',
                { count },
              );
              return (
                <Pressable
                  key={key}
                  style={({ pressed }) => [
                    styles.filterChip,
                    selected && styles.filterChipActive,
                    pressed && styles.filterChipPressed,
                  ]}
                  onPress={() => setStatusFilterAndCollapse(key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  accessibilityLabel={chipLabel}
                >
                  <Text
                    style={[
                      styles.filterChipLabel,
                      selected && styles.filterChipLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {chipLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {!loaded ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : loadError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.errorTitle}>{t('wordListLoadFailed')}</Text>
            <Text style={styles.errorDetail}>{loadError}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}
              onPress={() => {
                setLoaded(false);
                void loadWords();
              }}
              accessibilityRole="button"
              accessibilityLabel={t('retry')}
            >
              <Text style={styles.retryButtonText}>{t('retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <FlashList
            ref={listRef}
            style={styles.list}
            data={visibleWords}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="bookmark-outline" size={64} color={theme.textMuted} />
                <Text style={styles.emptyText}>{emptyCopy}</Text>
              </View>
            }
            contentContainerStyle={
              visibleWords.length === 0 ? styles.emptyListContent : styles.listContent
            }
            extraData={`${expandedId}\0${i18n.language}`}
            showsVerticalScrollIndicator
          />
        )}
      </View>
    </>
  );
}

const WordListRow = memo(function WordListRow({
  item,
  styles,
  expanded,
  example,
  onToggleExample,
  onOpenExample,
  onMarkLearned,
  onSwitchToStudying,
  onRemove,
}: {
  item: SavedWordListItem;
  styles: ReturnType<typeof createStyles>;
  expanded: boolean;
  example: SavedWordExample | null;
  onToggleExample: (item: SavedWordListItem) => void;
  onOpenExample: (example: SavedWordExample) => void;
  onMarkLearned: (item: SavedWordListItem) => void;
  onSwitchToStudying: (item: SavedWordListItem) => void;
  onRemove: (item: SavedWordListItem) => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { articleContentFontStyle, articleContentPinyinFontStyle } = useFont();
  const isStudying = item.status === 'studying';

  const card = (
    <View style={styles.card}>
      <Pressable
        onPress={() => onToggleExample(item)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={item.word}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <View style={styles.rowText}>
          <Text style={[styles.word, articleContentFontStyle]} numberOfLines={1}>
            {item.word}
          </Text>
          {item.pinyin ? (
            <Text
              style={[styles.pinyin, articleContentPinyinFontStyle]}
              numberOfLines={1}
            >
              {item.pinyin}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/learn/sentence-examples',
              params: { q: item.word },
            })
          }
          accessibilityRole="button"
          accessibilityLabel={t('searchSentenceExamples')}
          hitSlop={6}
          style={({ pressed }) => [
            styles.sentenceSearchButton,
            pressed && styles.sentenceSearchButtonPressed,
          ]}
        >
          <Text style={[styles.sentenceSearchHanzi, articleContentFontStyle]}>
            句
          </Text>
          <Ionicons name="search-outline" size={13} color={theme.accent} />
        </Pressable>
        {isStudying ? (
          <Pressable
            onPress={() => onMarkLearned(item)}
            accessibilityRole="button"
            accessibilityLabel={t('markLearned')}
            style={({ pressed }) => [
              styles.statusButton,
              pressed && styles.statusButtonPressed,
            ]}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color={theme.accent} />
            <Text style={styles.statusButtonText}>{t('learned')}</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => onSwitchToStudying(item)}
            accessibilityRole="button"
            accessibilityLabel={t('markStudying')}
            style={({ pressed }) => [
              styles.statusButton,
              pressed && styles.statusButtonPressed,
            ]}
          >
            <Ionicons name="book-outline" size={16} color={theme.accent} />
            <Text style={styles.statusButtonText}>{t('studying')}</Text>
          </Pressable>
        )}
      </Pressable>
      {expanded && example?.sentenceText ? (
        <View style={styles.example}>
          <Text style={[styles.exampleText, articleContentFontStyle]}>
            {example.sentenceText}{' '}
            <Text
              onPress={() => onOpenExample(example)}
              accessibilityRole="link"
              accessibilityLabel={t('readArticle')}
              accessibilityHint={t('readArticleHint')}
              style={styles.readArticleLink}
            >
              {t('readArticle')}
            </Text>
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (!isStudying) return card;

  return (
    <StudyingSwipeRow
      itemId={item.id}
      styles={styles}
      removeLabel={t('removeWord')}
      onRemove={() => onRemove(item)}
    >
      {card}
    </StudyingSwipeRow>
  );
});

function StudyingSwipeRow({
  itemId,
  styles,
  removeLabel,
  onRemove,
  children,
}: {
  itemId: string;
  styles: ReturnType<typeof createStyles>;
  removeLabel: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);
  const openRef = useRef(false);

  useEffect(() => {
    translateX.setValue(0);
    openRef.current = false;
    startX.current = 0;
  }, [itemId, translateX]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.25,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          startX.current = openRef.current ? -SWIPE_DELETE_WIDTH : 0;
        },
        onPanResponderMove: (_, g) => {
          const next = Math.min(0, Math.max(-SWIPE_DELETE_WIDTH, startX.current + g.dx));
          translateX.setValue(next);
        },
        onPanResponderRelease: (_, g) => {
          const next = Math.min(0, Math.max(-SWIPE_DELETE_WIDTH, startX.current + g.dx));
          const shouldOpen = next < -SWIPE_DELETE_WIDTH / 2 || g.vx < -0.5;
          openRef.current = shouldOpen;
          Animated.spring(translateX, {
            toValue: shouldOpen ? -SWIPE_DELETE_WIDTH : 0,
            useNativeDriver: true,
            overshootClamping: true,
            speed: 24,
            bounciness: 0,
          }).start();
        },
        onPanResponderTerminate: () => {
          const shouldOpen = openRef.current;
          Animated.spring(translateX, {
            toValue: shouldOpen ? -SWIPE_DELETE_WIDTH : 0,
            useNativeDriver: true,
            overshootClamping: true,
            speed: 24,
            bounciness: 0,
          }).start();
        },
      }),
    [translateX],
  );

  return (
    <View style={styles.swipeWrap}>
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={removeLabel}
        style={({ pressed }) => [
          styles.swipeDelete,
          pressed && styles.swipeDeletePressed,
        ]}
      >
        <Ionicons name="trash" size={18} color="#fff" />
      </Pressable>
      <Animated.View
        style={[styles.swipeFront, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    filterBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingLeft: 12,
      paddingRight: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
    },
    filterChips: {
      flexDirection: 'row',
      width: '70%',
      gap: 16,
    },
    filterChip: {
      flex: 1,
      minWidth: 0,
      paddingVertical: 8,
      paddingHorizontal: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterChipActive: {
      borderColor: theme.accent,
      backgroundColor: theme.surface,
    },
    filterChipPressed: {
      opacity: 0.75,
    },
    filterChipLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textMuted,
      textAlign: 'center',
    },
    filterChipLabelActive: {
      color: theme.accent,
      fontWeight: '600',
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingBottom: 24,
    },
    separator: {
      height: 6,
    },
    emptyListContent: {
      flexGrow: 1,
    },
    swipeWrap: {
      overflow: 'hidden',
    },
    swipeDelete: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: SWIPE_DELETE_WIDTH,
      backgroundColor: theme.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swipeDeletePressed: {
      opacity: 0.8,
    },
    swipeFront: {
      backgroundColor: theme.surface,
    },
    card: {
      backgroundColor: theme.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingLeft: 16,
      paddingRight: 8,
      backgroundColor: theme.surface,
    },
    rowPressed: {
      backgroundColor: theme.etchedBg,
    },
    example: {
      paddingHorizontal: 16,
      paddingBottom: 10,
      paddingTop: 2,
    },
    exampleText: {
      fontSize: 14,
      lineHeight: 22,
      color: theme.textSecondary,
    },
    readArticleLink: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.accent,
    },
    rowText: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'baseline',
      minWidth: 0,
      marginRight: 4,
      gap: 8,
    },
    word: {
      fontSize: 16,
      lineHeight: 20,
      color: theme.text,
    },
    pinyin: {
      flexShrink: 1,
      fontSize: 13,
      lineHeight: 18,
      color: theme.textMuted,
    },
    sentenceSearchButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 1,
      paddingVertical: 3,
      paddingHorizontal: 6,
      marginRight: 2,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.accent,
    },
    sentenceSearchButtonPressed: {
      opacity: 0.5,
    },
    sentenceSearchHanzi: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '500',
      color: theme.accent,
    },
    statusButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 5,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: theme.surface,
    },
    statusButtonPressed: {
      opacity: 0.5,
    },
    statusButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.accent,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    emptyText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.textMuted,
      textAlign: 'center',
      lineHeight: 22,
    },
    errorTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.error,
      textAlign: 'center',
      marginBottom: 8,
    },
    errorDetail: {
      fontSize: 13,
      color: theme.textMuted,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.accent,
    },
    retryButtonPressed: {
      backgroundColor: theme.surface,
    },
    retryButtonText: {
      fontSize: 15,
      color: theme.accent,
      fontWeight: '600',
    },
  });
}
