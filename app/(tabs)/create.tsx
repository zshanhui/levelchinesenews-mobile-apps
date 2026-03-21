import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import type { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';
import {
  envConfig,
  apiWriteUrl,
  generateArticleSummary,
  getUserFriendlyErrorMessage,
  postWithTimeout,
} from '../../lib/api';
import { ArticleCard } from '../../lib/components/ArticleCard';
import {
  listSavedArticles,
  migrateFromAsyncStorageIfNeeded,
  upsertSavedArticle,
  type SavedArticleWithMeta,
} from '../../lib/savedArticlesDb';
import { showErrorFeedback } from '../../lib/showErrorFeedback';
import {
  MAX_DAILY_PARSES,
  STORAGE_KEY_DAILY,
  SUPPORTED_URLS,
} from '../../lib/constants';
import type { ArticleListItem, ScrapeResponse } from '../../lib/types';

const translationInFlight = new Map<string, Promise<ArticleListItem | null>>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getDailyCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_DAILY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    if (data.date !== todayKey()) return 0;
    return data.count ?? 0;
  } catch {
    return 0;
  }
}

async function incrementDailyCount(): Promise<number> {
  const date = todayKey();
  const current = await getDailyCount();
  const next = current + 1;
  await AsyncStorage.setItem(STORAGE_KEY_DAILY, JSON.stringify({ date, count: next }));
  return next;
}

type TabKey = 'parse' | 'my-articles';

type MyArticlesReadFilter = 'unread' | 'read';

const MY_ARTICLES_FILTER_SEGMENTS: {
  key: MyArticlesReadFilter;
  labelKey: 'myArticlesFilterUnread' | 'myArticlesFilterFinished';
}[] = [
  { key: 'unread', labelKey: 'myArticlesFilterUnread' },
  { key: 'read', labelKey: 'myArticlesFilterFinished' },
];

export default function CreateScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [activeTab, setActiveTab] = useState<TabKey>('parse');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showIndexing, setShowIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastParsed, setLastParsed] = useState<ScrapeResponse | null>(null);
  const [myArticles, setMyArticles] = useState<SavedArticleWithMeta[]>([]);
  const [myArticlesReadFilter, setMyArticlesReadFilter] =
    useState<MyArticlesReadFilter>('unread');
  const [savedArticlesLoadError, setSavedArticlesLoadError] = useState<string | null>(null);
  const [dailyCount, setDailyCount] = useState(0);

  const { savedUnreadCount, savedFinishedCount } = useMemo(() => {
    let unread = 0;
    let finished = 0;
    for (const a of myArticles) {
      if (a.read) finished += 1;
      else unread += 1;
    }
    return { savedUnreadCount: unread, savedFinishedCount: finished };
  }, [myArticles]);

  const filteredMyArticles = useMemo(
    () =>
      myArticlesReadFilter === 'unread'
        ? myArticles.filter((a) => !a.read)
        : myArticles.filter((a) => a.read),
    [myArticles, myArticlesReadFilter],
  );

  const runSavedArticlesLoad = useCallback(
    async (opts?: { ignoreIfCancelled?: () => boolean }) => {
      if (Platform.OS === 'web') return;
      setSavedArticlesLoadError(null);
      try {
        await migrateFromAsyncStorageIfNeeded();
        const list = await listSavedArticles();
        if (opts?.ignoreIfCancelled?.()) return;
        setMyArticles(list);
      } catch (e) {
        if (opts?.ignoreIfCancelled?.()) return;
        const message = e instanceof Error ? e.message : String(e);
        setSavedArticlesLoadError(message);
        showErrorFeedback(t('savedArticlesLoadFailed'), message);
      }
    },
    [t],
  );

  useEffect(() => {
    getDailyCount().then(setDailyCount);
  }, []);

  const runSavedArticlesLoadRef = useRef(runSavedArticlesLoad);
  runSavedArticlesLoadRef.current = runSavedArticlesLoad;
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') return;
      let cancelled = false;
      void runSavedArticlesLoadRef.current({
        ignoreIfCancelled: () => cancelled,
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const remaining = MAX_DAILY_PARSES - dailyCount;
  const limitReached = remaining <= 0;

  useEffect(() => {
    if (!loading) {
      setShowIndexing(false);
      return;
    }
    const id = setTimeout(() => setShowIndexing(true), 1500);
    return () => clearTimeout(id);
  }, [loading]);

  const handleFetch = async () => {
    const trimmed = url.trim();
    if (!trimmed || limitReached) return;
    setLoading(true);
    setError(null);
    try {
      const result = await postWithTimeout<ScrapeResponse>(
        apiWriteUrl('/scrape'),
        { url: trimmed },
        undefined,
        envConfig.tempAdminAccessWriteKey ? { 'X-Admin-Key': envConfig.tempAdminAccessWriteKey } : undefined,
      );
      if (!result.existing) {
        const newCount = await incrementDailyCount();
        setDailyCount(newCount);
      }
      setLastParsed(result);
      setSavedArticlesLoadError(null);
      setMyArticles((prev) => {
        if (prev.some((a) => a.item.id === result.id)) return prev;
        return [{ item: result, read: false }, ...prev];
      });
      upsertSavedArticle(result);
    } catch (err: unknown) {
      setError(getUserFriendlyErrorMessage(err, t('somethingWentWrong')));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setLastParsed(null);
    setUrl('');
    setError(null);
  };

  const onRequestTranslation = useCallback(
    async (articleId: string): Promise<ArticleListItem | null> => {
      const existing = translationInFlight.get(articleId);
      if (existing) return existing;

      const promise = (async () => {
        try {
          const updated = await generateArticleSummary(articleId);
          setMyArticles((prev) =>
            prev.map((a) =>
              a.item.id === articleId ? { ...a, item: updated } : a
            ),
          );
          setLastParsed((prev) =>
            prev && prev.id === articleId
              ? { ...updated, existing: prev.existing }
              : prev,
          );
          upsertSavedArticle(updated);
          return updated;
        } catch {
          return null;
        } finally {
          translationInFlight.delete(articleId);
        }
      })();

      translationInFlight.set(articleId, promise);
      return promise;
    },
    [],
  );

  const tabs = useMemo<TabKey[]>(
    () => (Platform.OS === 'web' ? ['parse'] : ['parse', 'my-articles']),
    [],
  );

  const renderTabBar = useCallback(() => (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <Pressable
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => setActiveTab(tab)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab && styles.tabTextActive,
            ]}
          >
            {tab === 'parse' ? t('parse') : t('myArticles', { count: myArticles.length })}
          </Text>
        </Pressable>
      ))}
    </View>
  ), [activeTab, myArticles.length, styles, tabs, t]);

  if (activeTab === 'my-articles') {
    return (
      <View style={styles.container}>
        {renderTabBar()}
        {myArticles.length === 0 ? (
          <View style={styles.emptyContainer}>
            {savedArticlesLoadError ? (
              <>
                <Text style={styles.savedArticlesErrorTitle}>
                  {t('savedArticlesLoadFailed')}
                </Text>
                <Text style={styles.savedArticlesErrorDetail}>
                  {savedArticlesLoadError}
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.retrySavedArticlesButton,
                    pressed && styles.retrySavedArticlesButtonPressed,
                  ]}
                  onPress={() => void runSavedArticlesLoad()}
                  accessibilityRole="button"
                  accessibilityLabel={t('retry')}
                >
                  <Text style={styles.retrySavedArticlesButtonText}>
                    {t('retry')}
                  </Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.emptyText}>
                {t('noArticlesParseFirst')}
              </Text>
            )}
          </View>
        ) : (
          <>
            <View
              style={styles.savedArticlesFilterBar}
              accessibilityRole="tablist"
            >
              {MY_ARTICLES_FILTER_SEGMENTS.map(({ key, labelKey }) => {
                const selected = myArticlesReadFilter === key;
                const count =
                  key === 'unread' ? savedUnreadCount : savedFinishedCount;
                const label = t(labelKey, { count });
                return (
                  <Pressable
                    key={key}
                    style={({ pressed }) => [
                      styles.savedArticlesFilterChip,
                      selected && styles.savedArticlesFilterChipActive,
                      pressed && styles.savedArticlesFilterChipPressed,
                    ]}
                    onPress={() => setMyArticlesReadFilter(key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    accessibilityLabel={label}
                  >
                    <Text
                      style={[
                        styles.savedArticlesFilterChipLabel,
                        selected && styles.savedArticlesFilterChipLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {filteredMyArticles.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {myArticlesReadFilter === 'unread'
                    ? t('myArticlesFilterEmptyUnread')
                    : t('myArticlesFilterEmptyRead')}
                </Text>
              </View>
            ) : (
              <FlatList
                style={styles.list}
                contentContainerStyle={styles.listContent}
                data={filteredMyArticles}
                keyExtractor={(entry) => entry.item.id}
                renderItem={({ item: entry, index }) => (
                  <ArticleCard
                    item={entry.item}
                    index={index}
                    read={entry.read}
                    bookmarkSentencePosition={entry.bookmarkSentencePosition}
                    onPress={() => router.push(`/article/${entry.item.id}`)}
                    onRequestTranslation={onRequestTranslation}
                  />
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        )}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        {renderTabBar()}
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={styles.loadingText}>{t('fetching')}</Text>
          {showIndexing && (
            <Text style={styles.loadingText}>{t('indexing')}</Text>
          )}
        </View>
      </View>
    );
  }

  if (lastParsed) {
    return (
      <View style={styles.container}>
        {renderTabBar()}
        <View style={styles.resultContent}>
          <Text style={styles.successTitle}>
            {lastParsed.existing ? t('articleSaved') : t('newArticleCreated')}
          </Text>

          {lastParsed.existing && (
            <Text style={styles.existingNote}>
              {t('articleAlreadyCreated')}
            </Text>
          )}

          <ArticleCard
            item={lastParsed}
            read={Platform.OS === 'web' ? undefined : false}
            onPress={() => router.push(`/article/${lastParsed.id}`)}
            onRequestTranslation={onRequestTranslation}
          />

          <Pressable
            style={({ pressed }) => [
              styles.resetButton,
              pressed && styles.resetButtonPressed,
            ]}
            onPress={handleReset}
          >
            <Text style={styles.resetButtonText}>
              {t('fetchAnotherArticle')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderTabBar()}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.parseContent}>
          <View style={styles.centerContent}>
            <Text style={styles.parseSubtitle}>
              {t('enterUrl')}
            </Text>

            <View style={[styles.inputRow, limitReached && styles.inputRowDisabled]}>
              <TextInput
                style={styles.input}
                placeholder={t('urlPlaceholder')}
                placeholderTextColor={theme.textMuted}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                editable={!limitReached}
                multiline
                numberOfLines={3}
                blurOnSubmit
                returnKeyType="done"
              />
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  limitReached && styles.buttonDisabled,
                  pressed && !limitReached && styles.buttonPressed,
                ]}
                onPress={handleFetch}
                disabled={limitReached}
                accessibilityLabel={t('parseArticleUrl')}
              >
                <Ionicons name="cloud-download-outline" size={24} color="#fff" />
              </Pressable>
            </View>

            <Text style={styles.dailyLimit}>
              {limitReached
                ? t('dailyLimitReached')
                : t('parsesRemaining', { remaining, max: MAX_DAILY_PARSES })}
            </Text>

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </View>

          <View style={styles.supportedList}>
            <Text style={styles.supportedLabel}>{t('supportedSites')}</Text>
            {SUPPORTED_URLS.map((site) => (
              <Pressable key={site} onPress={() => Linking.openURL(site)}>
                <Text style={styles.supportedUrl}>{site}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  flex: {
    flex: 1,
  },
  parseContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  parseSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 24,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.accent,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.textMuted,
  },
  tabTextActive: {
    color: theme.accent,
    fontWeight: '600',
  },
  savedArticlesFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.surface,
  },
  savedArticlesFilterChip: {
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
  savedArticlesFilterChipActive: {
    borderColor: theme.accent,
    backgroundColor: theme.surface,
  },
  savedArticlesFilterChipPressed: {
    opacity: 0.75,
  },
  savedArticlesFilterChipLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textMuted,
    textAlign: 'center',
  },
  savedArticlesFilterChipLabelActive: {
    color: theme.accent,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    width: '100%',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.textMuted,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 480,
    minHeight: 48,
    paddingRight: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  inputRowDisabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    minHeight: 80,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    color: theme.text,
    backgroundColor: 'transparent',
  },
  dailyLimit: {
    fontSize: 13,
    color: theme.textMuted,
    marginBottom: 20,
  },
  supportedList: {
    alignItems: 'center',
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  supportedLabel: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  supportedUrl: {
    fontSize: 14,
    color: theme.accent,
    paddingVertical: 2,
  },
  errorText: {
    fontSize: 14,
    color: theme.error,
    textAlign: 'center',
    marginBottom: 12,
    maxWidth: 480,
  },
  button: {
    height: 48,
    minWidth: 48,
    backgroundColor: theme.accent,
    paddingHorizontal: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  buttonPressed: {
    backgroundColor: theme.accentPressed,
  },
  buttonDisabled: {
    backgroundColor: theme.textMuted,
  },
  resultContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    width: '100%',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  existingNote: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 16,
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.accent,
  },
  resetButtonPressed: {
    backgroundColor: theme.surface,
  },
  resetButtonText: {
    fontSize: 16,
    color: theme.accent,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: theme.textMuted,
    textAlign: 'center',
  },
  savedArticlesErrorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  savedArticlesErrorDetail: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  retrySavedArticlesButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.accent,
  },
  retrySavedArticlesButtonPressed: {
    backgroundColor: theme.surface,
  },
  retrySavedArticlesButtonText: {
    fontSize: 15,
    color: theme.accent,
    fontWeight: '600',
  },
  });
}
