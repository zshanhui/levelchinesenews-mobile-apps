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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputKeyPressEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useNavigation } from 'expo-router';
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

/** Short brand label for a supported-site URL, e.g. https://www.zaobao.com -> "zaobao". */
function siteDisplayName(url: string): string {
  const host = url.replace(/^https?:\/\//, '').split(/[/?#]/)[0].toLowerCase();
  const parts = host.split('.').filter(Boolean);
  // Drop leading subdomain labels such as www / m.
  while (parts.length > 1 && ['www', 'm', 'mobile', 'wap'].includes(parts[0])) {
    parts.shift();
  }
  // Drop trailing TLD segments, including multi-part ones like .com.sg.
  const TLD = new Set([
    'com', 'co', 'net', 'org', 'gov', 'edu', 'info', 'io', 'me',
    'cn', 'sg', 'hk', 'tw', 'my', 'id', 'vn', 'th', 'ph',
    'ru', 'de', 'jp', 'fr', 'es', 'it', 'uk', 'us', 'au', 'ca', 'kr', 'in',
  ]);
  while (parts.length > 1 && TLD.has(parts[parts.length - 1])) {
    parts.pop();
  }
  return parts.join('.') || host;
}

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
  const urlInputRef = useRef<TextInput>(null);
  const urlRef = useRef('');
  const urlBackspaceClearPendingRef = useRef(false);
  const urlBackspaceClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const [inputFocused, setInputFocused] = useState(false);

  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = (navigation as { addListener: (event: string, cb: () => void) => () => void })
      .addListener('tabPress', () => {
        setActiveTab('parse');
        setLastParsed(null);
      });
    return unsubscribe;
  }, [navigation]);

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

  useEffect(() => {
    urlRef.current = url;
  }, [url]);

  useEffect(
    () => () => {
      if (urlBackspaceClearTimerRef.current) {
        clearTimeout(urlBackspaceClearTimerRef.current);
      }
    },
    [],
  );

  const scheduleUrlBackspacePendingReset = useCallback(() => {
    if (urlBackspaceClearTimerRef.current) {
      clearTimeout(urlBackspaceClearTimerRef.current);
    }
    urlBackspaceClearTimerRef.current = setTimeout(() => {
      urlBackspaceClearTimerRef.current = null;
      urlBackspaceClearPendingRef.current = false;
    }, 100);
  }, []);

  const handleUrlChangeText = useCallback((text: string) => {
    if (urlBackspaceClearPendingRef.current) {
      urlBackspaceClearPendingRef.current = false;
      if (urlBackspaceClearTimerRef.current) {
        clearTimeout(urlBackspaceClearTimerRef.current);
        urlBackspaceClearTimerRef.current = null;
      }
      setUrl('');
      return;
    }
    setUrl(text);
  }, []);

  const handleUrlKeyPress = useCallback(
    (e: TextInputKeyPressEvent) => {
      const key = e.nativeEvent.key;
      if (
        (key === 'Backspace' || key === '\b') &&
        urlRef.current.length > 0
      ) {
        urlBackspaceClearPendingRef.current = true;
        scheduleUrlBackspacePendingReset();
        setUrl('');
        e.preventDefault?.();
      }
    },
    [scheduleUrlBackspacePendingReset],
  );

  const runSavedArticlesLoadRef = useRef(runSavedArticlesLoad);
  runSavedArticlesLoadRef.current = runSavedArticlesLoad;
  useFocusEffect(
    useCallback(() => {
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
  const parseDisabled = limitReached || loading || !url.trim();

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

  const tabs = useMemo<TabKey[]>(() => ['parse', 'my-articles'], []);

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

  return (
    <View style={styles.container}>
      {renderTabBar()}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.parseScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.parseContent}>
            {!lastParsed ? (
              <View style={styles.parsePanel}>
                <Text style={styles.parseTitle}>{t('enterUrl')}</Text>

                <Pressable
                  style={[
                    styles.inputShell,
                    inputFocused && styles.inputShellFocused,
                    (limitReached || loading) && styles.inputShellDisabled,
                  ]}
                  onPress={() => urlInputRef.current?.focus()}
                  disabled={limitReached || loading}
                >
                  <TextInput
                    ref={urlInputRef}
                    style={styles.input}
                    placeholder={t('urlPlaceholder')}
                    placeholderTextColor={theme.textMuted}
                    value={url}
                    onChangeText={handleUrlChangeText}
                    onKeyPress={handleUrlKeyPress}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    editable={!limitReached && !loading}
                    multiline
                    numberOfLines={3}
                    scrollEnabled={false}
                    blurOnSubmit
                    returnKeyType="done"
                  />
                </Pressable>

                <Text
                  style={[
                    styles.dailyLimit,
                    limitReached && styles.dailyLimitWarning,
                  ]}
                >
                  {limitReached
                    ? t('dailyLimitReached')
                    : t('parsesRemaining', { remaining, max: MAX_DAILY_PARSES })}
                </Text>

                {error && (
                  <View style={styles.errorBanner}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={18}
                      color={theme.error}
                    />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    parseDisabled && styles.buttonDisabled,
                    pressed && !parseDisabled && styles.buttonPressed,
                  ]}
                  onPress={handleFetch}
                  disabled={parseDisabled}
                  accessibilityLabel={t('parseArticleUrl')}
                >
                  <Ionicons name="cloud-download-outline" size={16} color="#fff" />
                  <Text style={styles.buttonText}>
                    {loading ? t('fetching') : t('parse')}
                  </Text>
                </Pressable>

                {loading && (
                  <View style={styles.loadingPanel}>
                    <ActivityIndicator size="small" color={theme.accent} />
                    <View style={styles.loadingCopy}>
                      <Text style={styles.loadingTitle}>{t('fetching')}</Text>
                      {showIndexing && (
                        <Text style={styles.loadingText}>{t('indexing')}</Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.resultSection}>
                <ArticleCard
                  item={lastParsed}
                  read={false}
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
            )}

            <View style={styles.supportedCard}>
              <Text style={styles.supportedLabel}>{t('supportedSites')}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.supportedLinks}
              >
                {SUPPORTED_URLS.map((site) => (
                  <Pressable
                    key={site}
                    style={({ pressed }) => [
                      styles.supportedChip,
                      pressed && styles.supportedChipPressed,
                    ]}
                    onPress={() => Linking.openURL(site)}
                  >
                    <Text style={styles.supportedUrl} numberOfLines={1}>
                      {siteDisplayName(site)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </ScrollView>
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
    parseScrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 32,
    },
    parseContent: {
      flexGrow: 1,
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',
      gap: 18,
    },
    parsePanel: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.18,
      shadowRadius: 18,
      elevation: 3,
    },
    parseTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 18,
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
      justifyContent: 'flex-end',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
    },
    savedArticlesFilterChip: {
      width: '33%',
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
    inputShell: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginBottom: 12,
    },
    inputShellFocused: {
      borderColor: theme.accent,
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: Platform.OS === 'ios' ? 0.18 : 0,
      shadowRadius: 0,
      elevation: 0,
    },
    inputShellDisabled: {
      opacity: 0.65,
    },
    input: {
      minHeight: 92,
      maxHeight: 128,
      paddingVertical: 10,
      fontSize: 16,
      lineHeight: 24,
      color: theme.text,
      backgroundColor: 'transparent',
      textAlignVertical: 'top',
    },
    dailyLimit: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.textMuted,
      marginBottom: 14,
    },
    dailyLimitWarning: {
      color: theme.error,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.error,
      backgroundColor: theme.surface,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 14,
    },
    errorText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: theme.error,
    },
    button: {
      minHeight: 43,
      borderRadius: 13,
      backgroundColor: theme.accent,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    buttonPressed: {
      backgroundColor: theme.accentPressed,
    },
    buttonDisabled: {
      backgroundColor: theme.textMuted,
    },
    buttonText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#fff',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    loadingPanel: {
      marginTop: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    loadingCopy: {
      flex: 1,
    },
    loadingTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    loadingText: {
      fontSize: 13,
      color: theme.textMuted,
    },
    resultSection: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      gap: 14,
    },
    resetButton: {
      marginTop: 4,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resetButtonPressed: {
      opacity: 0.7,
    },
    resetButtonText: {
      fontSize: 15,
      color: theme.accent,
      fontWeight: '700',
    },
    supportedCard: {
      marginTop: 'auto',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      padding: 16,
      opacity: 0.92,
    },
    supportedLabel: {
      fontSize: 12,
      color: theme.textMuted,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    supportedLinks: {
      flexDirection: 'row',
      gap: 10,
    },
    supportedChip: {
      paddingVertical: 4,
      flexShrink: 0,
    },
    supportedChipPressed: {
      opacity: 0.6,
    },
    supportedUrl: {
      fontSize: 13,
      color: theme.textSecondary,
      textDecorationLine: 'underline',
    },
    list: {
      flex: 1,
    },
    listContent: {
      padding: 12,
      paddingBottom: 24,
    },
    separator: {
      height: 6,
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
