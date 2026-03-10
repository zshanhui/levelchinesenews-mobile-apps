import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { router } from 'expo-router';
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
  MAX_DAILY_PARSES,
  STORAGE_KEY_ARTICLES,
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
  const [myArticles, setMyArticles] = useState<ArticleListItem[]>([]);
  const [dailyCount, setDailyCount] = useState(0);

  useEffect(() => {
    getDailyCount().then(setDailyCount);
    AsyncStorage.getItem(STORAGE_KEY_ARTICLES).then((raw) => {
      if (raw) {
        try { setMyArticles(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const articlesLoaded = myArticles.length > 0 || dailyCount > 0;
  useEffect(() => {
    if (articlesLoaded) {
      AsyncStorage.setItem(STORAGE_KEY_ARTICLES, JSON.stringify(myArticles));
    }
  }, [myArticles, articlesLoaded]);

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
      setMyArticles((prev) => {
        if (prev.some((a) => a.id === result.id)) return prev;
        return [result, ...prev];
      });
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
            prev.map((a) => (a.id === articleId ? updated : a)),
          );
          setLastParsed((prev) =>
            prev && prev.id === articleId
              ? { ...updated, existing: prev.existing }
              : prev,
          );
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

  const renderTabBar = useCallback(() => (
    <View style={styles.tabBar}>
      {(['parse', 'my-articles'] as const).map((tab) => (
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
  ), [activeTab, myArticles.length, styles]);

  if (activeTab === 'my-articles') {
    return (
      <View style={styles.container}>
        {renderTabBar()}
        {myArticles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {t('noArticlesParseFirst')}
            </Text>
          </View>
        ) : (
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={myArticles}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <ArticleCard
                item={item}
                index={index}
                onPress={() => router.push(`/article/${item.id}`)}
                onRequestTranslation={onRequestTranslation}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
          />
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
  });
}
