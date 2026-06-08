import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { capitalizeFirstWord } from '../text-utils';
import type { ArticleFontOption } from '../FontContext';
import { useFont } from '../FontContext';
import { useTranslation } from '../i18n';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) {
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
  }
  if (bytes >= 1_000) {
    return `${Math.round(bytes / 1_000)} KB`;
  }
  return `${bytes} B`;
}

export function FontSelectorPanel() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const {
    articleFontOptions,
    selectArticleFont,
    clearRemoteFonts,
    fancyDisplayFontStyle,
  } = useFont();
  const [clearingRemoteFonts, setClearingRemoteFonts] = useState(false);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const getArticleFontSubtitle = (option: ArticleFontOption) => {
    if (!option.isRemote || option.status === 'ready') {
      return t('articleContentFontPreview');
    }
    if (option.status === 'downloading') return t('downloading');
    if (option.status === 'failed') return t('retry');
    return '';
  };

  const handleClearRemoteFonts = async () => {
    if (clearingRemoteFonts) return;

    setClearingRemoteFonts(true);
    try {
      await clearRemoteFonts();
    } catch (err) {
      console.warn('Failed to clear remote fonts:', err);
    } finally {
      setClearingRemoteFonts(false);
    }
  };

  const confirmClearRemoteFonts = () => {
    Alert.alert(
      'Delete downloaded fonts?',
      'This will remove all downloaded reader fonts from local storage. You can download them again later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void handleClearRemoteFonts();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.etchedSection}>
      <View style={styles.sectionLabelRow}>
        <Text style={[styles.sectionLabel, fancyDisplayFontStyle]}>
          {capitalizeFirstWord(t('articleContentFont'))}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear downloaded reader fonts"
          disabled={clearingRemoteFonts}
          onPress={confirmClearRemoteFonts}
          style={({ pressed }) => [
            styles.clearFontsButton,
            pressed && styles.clearFontsButtonPressed,
            clearingRemoteFonts && styles.clearFontsButtonDisabled,
          ]}
        >
          <Ionicons name="trash-outline" size={16} color={theme.error} />
        </Pressable>
      </View>
      <View style={styles.segmentedRow}>
        {articleFontOptions.map((option, index) => {
          const isBusy = option.status === 'downloading';
          const isIdleRemote = option.isRemote && option.status === 'idle';
          const sizeLabel =
            option.downloadSizeBytes != null
              ? formatBytes(option.downloadSizeBytes)
              : null;
          return (
            <Pressable
              key={option.id}
              disabled={isBusy}
              onPress={() => {
                void selectArticleFont(option.id);
              }}
              style={[
                styles.segmentButton,
                index === articleFontOptions.length - 1 &&
                  styles.segmentButtonLast,
                option.isSelected && styles.segmentButtonSelected,
                isIdleRemote && styles.segmentButtonUnavailable,
                isBusy && styles.segmentButtonDisabled,
              ]}
              accessibilityRole="radio"
              accessibilityState={{
                selected: option.isSelected,
                disabled: isBusy,
              }}
              accessibilityLabel={option.label}
            >
              <View style={styles.segmentLabelRow}>
                {isBusy ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.textMuted}
                    style={styles.segmentLoadingIndicator}
                  />
                ) : null}
                <Text
                  style={[
                    styles.segmentLabel,
                    option.isSelected && styles.segmentLabelSelected,
                    (isBusy || isIdleRemote) && styles.segmentLabelDisabled,
                  ]}
                >
                  {option.label}
                </Text>
              </View>
              <View style={styles.segmentSubLabelRow}>
                {isIdleRemote && sizeLabel ? (
                  <Ionicons
                    name="cloud-download-outline"
                    size={12}
                    color={theme.textMuted}
                  />
                ) : null}
                <Text
                  style={[
                    styles.segmentNumbers,
                    option.isSelected && styles.segmentNumbersSelected,
                    option.status === 'failed' && styles.segmentNumbersError,
                    (isBusy || isIdleRemote) && styles.segmentNumbersDisabled,
                  ]}
                >
                  {option.isRemote && sizeLabel
                    ? sizeLabel
                    : getArticleFontSubtitle(option)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    etchedSection: {
      marginTop: 12,
      padding: 12,
      backgroundColor: theme.etchedBg,
      borderRadius: 8,
      borderWidth: 1,
      borderTopColor: theme.etchedBorderLight,
      borderLeftColor: theme.etchedBorderLight,
      borderBottomColor: theme.etchedBorderDark,
      borderRightColor: theme.etchedBorderDark,
    },
    sectionLabel: {
      fontSize: 13,
      color: theme.text,
    },
    sectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    clearFontsButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearFontsButtonPressed: {
      backgroundColor: theme.border,
    },
    clearFontsButtonDisabled: {
      opacity: 0.45,
    },
    segmentedRow: {
      flexDirection: 'row',
      marginTop: 4,
      borderRadius: 10,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    segmentButton: {
      flex: 1,
      paddingVertical: 4,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      borderRightWidth: 1,
      borderRightColor: theme.border,
    },
    segmentButtonLast: {
      borderRightWidth: 0,
    },
    segmentButtonSelected: {
      backgroundColor: theme.accent + '22',
    },
    segmentButtonUnavailable: {
      opacity: 0.6,
    },
    segmentButtonDisabled: {
      opacity: 0.45,
    },
    segmentLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    segmentLoadingIndicator: {
      transform: [{ scale: 0.7 }],
    },
    segmentSubLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    segmentLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    segmentLabelSelected: {
      color: theme.accent,
      fontWeight: '600',
    },
    segmentLabelDisabled: {
      color: theme.textMuted,
    },
    segmentNumbers: {
      fontSize: 10,
      color: theme.textMuted,
    },
    segmentNumbersSelected: {
      color: theme.accent,
    },
    segmentNumbersDisabled: {
      color: theme.textMuted,
    },
    segmentNumbersError: {
      color: theme.error,
    },
  });
}
