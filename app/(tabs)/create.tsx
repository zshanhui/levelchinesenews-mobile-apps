import { useCallback, useEffect, useState } from 'react';
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
import { useFont } from '../../lib/FontContext';
import { theme } from '../../lib/theme';
import { ADMIN_ACCESS_KEY, apiUrl, postWithTimeout } from '../../lib/api';
import { ArticleCard } from '../../lib/components/ArticleCard';
import type { ArticleListItem } from '../../lib/types';

const SUPPORTED_URLS = [
  'https://www.zaobao.com',
];

const MAX_DAILY_PARSES = 10;
const STORAGE_KEY_DAILY = 'daily_parse_count';
const STORAGE_KEY_ARTICLES = 'my_articles';

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
  const { chineseFontStyle } = useFont();
  const [activeTab, setActiveTab] = useState<TabKey>('parse');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastParsed, setLastParsed] = useState<ArticleListItem | null>(null);
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

  const handleFetch = async () => {
    const trimmed = url.trim();
    if (!trimmed || limitReached) return;
    setLoading(true);
    setError(null);
    try {
      const result = await postWithTimeout<ArticleListItem>(
        apiUrl('/scrape'),
        { url: trimmed },
        undefined,
        ADMIN_ACCESS_KEY ? { 'X-Admin-Key': ADMIN_ACCESS_KEY } : undefined,
      );
      const newCount = await incrementDailyCount();
      setDailyCount(newCount);
      setLastParsed(result);
      setMyArticles((prev) => {
        if (prev.some((a) => a.id === result.id)) return prev;
        return [result, ...prev];
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setLastParsed(null);
    setUrl('');
    setError(null);
  };

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
            {tab === 'parse' ? 'parse' : `my articles (${myArticles.length})`}
          </Text>
        </Pressable>
      ))}
    </View>
  ), [activeTab, myArticles.length]);

  if (activeTab === 'my-articles') {
    return (
      <View style={styles.container}>
        {renderTabBar()}
        {myArticles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, chineseFontStyle]}>
              no articles yet — parse one first
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
          <Text style={styles.loadingText}>Scraping…</Text>
        </View>
      </View>
    );
  }

  if (lastParsed) {
    return (
      <View style={styles.container}>
        {renderTabBar()}
        <View style={styles.resultContent}>
          <Text style={[styles.successTitle, chineseFontStyle]}>
            article created
          </Text>

          <ArticleCard
            item={lastParsed}
            onPress={() => router.push(`/article/${lastParsed.id}`)}
          />

          <Pressable
            style={({ pressed }) => [
              styles.resetButton,
              pressed && styles.resetButtonPressed,
            ]}
            onPress={handleReset}
          >
            <Text style={[styles.resetButtonText, chineseFontStyle]}>
              parse another article
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
        <View style={styles.centerContent}>
          <View style={[styles.inputRow, limitReached && styles.inputRowDisabled]}>
            <TextInput
              style={[styles.input, chineseFontStyle]}
              placeholder="https://zaobao.com/..."
              placeholderTextColor={theme.textMuted}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!limitReached}
            />
            <Pressable
              style={({ pressed }) => [
                styles.button,
                limitReached && styles.buttonDisabled,
                pressed && !limitReached && styles.buttonPressed,
              ]}
              onPress={handleFetch}
              disabled={limitReached}
            >
              <Text style={[styles.buttonText, chineseFontStyle]}>🕷️ parse</Text>
            </Pressable>
          </View>

          <Text style={[styles.subtitle, chineseFontStyle]}>
            enter a supported website url to fetch article
          </Text>

          <Text style={styles.dailyLimit}>
            {limitReached
              ? 'daily limit reached — come back tomorrow'
              : `${remaining} of ${MAX_DAILY_PARSES} parses remaining today`}
          </Text>

          <View style={styles.supportedList}>
            <Text style={styles.supportedLabel}>supported sites</Text>
            {SUPPORTED_URLS.map((site) => (
              <Pressable key={site} onPress={() => Linking.openURL(site)}>
                <Text style={styles.supportedUrl}>{site}</Text>
              </Pressable>
            ))}
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  flex: {
    flex: 1,
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
    fontSize: 16,
    color: theme.textSecondary,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 480,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    overflow: 'hidden',
    marginBottom: 16,
  },
  inputRowDisabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
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
    marginBottom: 16,
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
    backgroundColor: theme.accent,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: theme.accentPressed,
  },
  buttonDisabled: {
    backgroundColor: theme.textMuted,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  resultContent: {
    flex: 1,
    padding: 24,
    paddingTop: 24,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  resetButton: {
    marginTop: 24,
    alignSelf: 'center',
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
