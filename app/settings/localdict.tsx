import { useCallback, useEffect, useMemo, useState } from 'react';
import { Stack } from 'expo-router';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../lib/i18n';
import { useTheme } from '../../lib/ThemeContext';
import {
  deleteLocalDict,
  firstLoadLocalDictFromRemote,
  resetLocalDict,
} from '../../lib/useLocalDictService';
import * as database from '../../lib/localDatabase';

export default function LocalDictSettingsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [progress, setProgress] = useState<number | null>(null);
  const [progressLoaded, setProgressLoaded] = useState<number | null>(null);
  const [progressTotal, setProgressTotal] = useState<number | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [randomEntry, setRandomEntry] = useState<database.DictEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const refreshRowCount = useCallback(async () => {
    const count = await database.getTotalLcnDictEntriesCount();
    setRowCount(count);
  }, []);

  const refreshRandomEntry = useCallback(async () => {
    const entry = await database.getRandomProverbOrChengyuEntry();
    setRandomEntry(entry);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    refreshRowCount();
  }, [refreshRowCount]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const entriesLoaded = (rowCount ?? 0) > 0;
    const notDownloading = progress === null || progress >= 100;
    if (entriesLoaded && notDownloading) {
      refreshRandomEntry();
    } else {
      setRandomEntry(null);
    }
  }, [rowCount, progress, refreshRandomEntry]);

  const handleDownload = useCallback(async () => {
    setError(null);
    setProgress(0);
    setProgressLoaded(0);
    setProgressTotal(null);
    try {
      await resetLocalDict();
      const result = await firstLoadLocalDictFromRemote(
        undefined,
        (pct, loaded, total) => {
          setProgress(pct);
          if (loaded !== undefined) setProgressLoaded(loaded);
          if (total !== undefined) setProgressTotal(total);
        }
      );
      setProgress(100);
      if (result) {
        setRowCount(result.totalInsertedCount);
      } else {
        setError(t('downloadFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('downloadFailed'));
      setProgress(null);
      setProgressLoaded(null);
      setProgressTotal(null);
    }
  }, [t]);

  const handleReset = useCallback(async () => {
    setError(null);
    setIsResetting(true);
    try {
      const [_, __] = await Promise.all([
        deleteLocalDict(),
        new Promise((r) => setTimeout(r, 1000)),
      ]);
      setRowCount(0);
      setProgress(null);
      setProgressLoaded(null);
      setProgressTotal(null);
      setRandomEntry(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('downloadFailed'));
    } finally {
      setIsResetting(false);
    }
  }, [t]);

  const isDownloading = progress !== null && progress < 100;
  const isBusy = isDownloading || isResetting;
  const hasEntries = (rowCount ?? 0) > 0;
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (Platform.OS === 'web') {
    return (
      <>
        <Stack.Screen
          options={{
            title: t('configureLocalDict'),
            headerBackTitle: t('back'),
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.text,
          }}
        />
        <ScrollView
          style={styles.webUnsupportedContainer}
          contentContainerStyle={styles.webUnsupportedContent}
        >
          <Text style={styles.webUnsupportedText}>
            {t('localDatabaseNotSupportedOnWeb')}
          </Text>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t('configureLocalDict'),
          headerBackTitle: t('back'),
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.section}>
          <Text style={styles.description}>
            {t('downloadLocalDictHint')}
          </Text>

          <Pressable
            style={({ pressed }) => [
              hasEntries ? styles.resetButton : styles.downloadButton,
              pressed && (hasEntries ? styles.resetButtonPressed : styles.downloadButtonPressed),
              isBusy && styles.downloadButtonDisabled,
            ]}
            onPress={hasEntries ? handleReset : handleDownload}
            disabled={isBusy}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : isResetting ? (
              <ActivityIndicator size="small" color={theme.error} />
            ) : hasEntries ? (
              <Ionicons name="trash-outline" size={20} color={theme.error} />
            ) : (
              <Ionicons name="cloud-download-outline" size={20} color="#fff" />
            )}
            <Text style={hasEntries ? styles.resetButtonText : styles.downloadButtonText}>
              {isDownloading
                ? t('downloading')
                : isResetting
                  ? t('resetting')
                  : hasEntries
                    ? t('resetLocalDict')
                    : t('downloadLocalDict')}
            </Text>
          </Pressable>

          {progress !== null && (
            <View style={styles.progressSection}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, Math.max(0, progress))}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {progressTotal != null && progressLoaded != null
                  ? `${progressLoaded.toLocaleString()} / ${progressTotal.toLocaleString()} (${Math.round(progress)}%)`
                  : `${Math.round(progress)}%`}
              </Text>
            </View>
          )}

          {rowCount !== null && !isDownloading && (
            <Text style={styles.rowCount}>
              {t('dictEntriesCount', { count: rowCount })}
            </Text>
          )}

          {randomEntry && (
            <View style={styles.randomEntryCard}>
              <View style={styles.randomEntryCardHeader}>
                <Text style={styles.randomEntryLabel}>
                  {t('randomEntrySample')}
                </Text>
                <Pressable
                  onPress={refreshRandomEntry}
                  style={({ pressed }) => [
                    styles.randomEntryRefreshButton,
                    pressed && styles.randomEntryRefreshButtonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('showAnotherRandomEntry')}
                >
                  <Ionicons name="refresh-outline" size={18} color={theme.textMuted} />
                </Pressable>
              </View>
              <Text style={styles.randomEntryHanzi}>
                {randomEntry.simplified}
                {randomEntry.simplified !== randomEntry.traditional && (
                  <Text style={styles.randomEntryTraditional}>
                    {' '}({randomEntry.traditional})
                  </Text>
                )}
              </Text>
              <Text style={styles.randomEntryPinyin}>{randomEntry.pinyin}</Text>
              <Text style={styles.randomEntryDefinitions}>
                {randomEntry.definitions}
              </Text>
            </View>
          )}

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>
      </ScrollView>
    </>
  );
}

function createStyles(theme: import('../../lib/theme').Theme) {
  return StyleSheet.create({
    webUnsupportedContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    webUnsupportedContent: {
      flexGrow: 1,
      padding: 20,
      paddingBottom: 32,
      justifyContent: 'center',
    },
    webUnsupportedText: {
      fontSize: 15,
      color: theme.textSecondary,
      lineHeight: 22,
      textAlign: 'center',
    },
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flexGrow: 1,
      padding: 16,
      paddingBottom: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    section: {
      marginBottom: 24,
      alignItems: 'center',
      width: '100%',
      maxWidth: 400,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    description: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
      textAlign: 'center',
    },
    downloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.accent,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      marginBottom: 16,
      alignSelf: 'center',
    },
    downloadButtonPressed: {
      opacity: 0.9,
    },
    downloadButtonDisabled: {
      opacity: 0.7,
    },
    downloadButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: theme.error,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      marginBottom: 16,
      alignSelf: 'center',
    },
    resetButtonPressed: {
      opacity: 0.9,
    },
    resetButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.error,
    },
    progressSection: {
      marginBottom: 12,
      width: '100%',
      maxWidth: 280,
    },
    progressTrack: {
      height: 8,
      backgroundColor: theme.etchedBg,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 6,
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.accent,
      borderRadius: 4,
    },
    progressLabel: {
      fontSize: 12,
      color: theme.textMuted,
      textAlign: 'center',
    },
    rowCount: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    randomEntryCard: {
      marginTop: 20,
      padding: 16,
      backgroundColor: theme.etchedBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      width: '100%',
      maxWidth: 320,
    },
    randomEntryCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    randomEntryRefreshButton: {
      padding: 4,
    },
    randomEntryRefreshButtonPressed: {
      opacity: 0.7,
    },
    randomEntryLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textMuted,
      textTransform: 'uppercase',
    },
    randomEntryHanzi: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    randomEntryTraditional: {
      fontSize: 18,
      color: theme.textSecondary,
    },
    randomEntryPinyin: {
      fontSize: 14,
      color: theme.textMuted,
      fontStyle: 'italic',
      marginBottom: 8,
    },
    randomEntryDefinitions: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    errorText: {
      fontSize: 14,
      color: theme.error,
      marginTop: 8,
      textAlign: 'center',
    },
  });
}
