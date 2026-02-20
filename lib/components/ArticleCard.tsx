import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFont } from '../FontContext';
import type { ArticleListItem } from '../types';
import { theme } from '../theme';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return '';
  }
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen).trim() + '…';
}

export function ArticleCard({
  item,
  onPress,
}: {
  item: ArticleListItem;
  onPress: () => void;
}) {
  const { chineseFontStyle, chineseFontBoldStyle } = useFont();
  const [showTranslated, setShowTranslated] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const displayTitle =
    showTranslated && item.title_translated_en
      ? item.title_translated_en
      : item.title;
  const fullSummary = item.summary_generated_en || null;
  const displaySubtitle = fullSummary
    ? summaryExpanded
      ? fullSummary
      : truncate(fullSummary, 100)
    : null;

  return (
    <View style={styles.card}>
      {item.main_image ? (
        <Image
          source={{ uri: item.main_image }}
          style={styles.thumbnail}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Ionicons name="newspaper-outline" size={32} color={theme.textMuted} />
        </View>
      )}
      <View style={styles.cardContent}>
        {item.title_translated_en ? (
          <Pressable
            onPress={() => setShowTranslated((prev) => !prev)}
            style={styles.titlePressable}
          >
            <Text
              style={[
                styles.cardTitle,
                chineseFontBoldStyle,
                showTranslated && styles.cardTitleTranslated,
              ]}
              numberOfLines={showTranslated ? undefined : 2}
            >
              {displayTitle}
            </Text>
          </Pressable>
        ) : (
          <Text
            style={[styles.cardTitle, chineseFontBoldStyle]}
            numberOfLines={2}
          >
            {displayTitle}
          </Text>
        )}
        {(item.source || item.published_date) && (
          <View style={styles.cardMeta}>
            {item.source && (
              <Text style={[styles.cardSource, chineseFontStyle]}>
                {item.source}
              </Text>
            )}
            {item.published_date && (
              <Text style={styles.cardDate}>
                {formatDate(item.published_date)}
              </Text>
            )}
          </View>
        )}
        {displaySubtitle ? (
          fullSummary!.length > 100 ? (
            <Pressable
              onPress={() => setSummaryExpanded((prev) => !prev)}
              style={styles.summaryPressable}
            >
              <Text
                style={[styles.cardSummary, chineseFontStyle]}
                numberOfLines={summaryExpanded ? undefined : 2}
              >
                {displaySubtitle}
              </Text>
            </Pressable>
          ) : (
            <Text
              style={[styles.cardSummary, chineseFontStyle]}
              numberOfLines={2}
            >
              {displaySubtitle}
            </Text>
          )
        ) : (
          <Text style={[styles.cardSummaryEmpty, chineseFontStyle]}>
            no summary has been generated for this article yet…
          </Text>
        )}
      </View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.arrowButton,
          pressed && styles.arrowButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`open article: ${displayTitle}`}
      >
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.surfaceElevated,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 12,
    minHeight: 96,
    borderWidth: 1,
    borderColor: theme.border,
  },
  arrowButton: {
    padding: 12,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  arrowButtonPressed: {
    opacity: 0.7,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: theme.border,
  },
  thumbnailPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
    minWidth: 0,
  },
  titlePressable: {
    alignSelf: 'flex-start',
  },
  summaryPressable: {
    alignSelf: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.accentPressed,
  },
  cardTitleTranslated: {
    fontSize: 14,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  cardSource: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  cardDate: {
    fontSize: 12,
    color: theme.textMuted,
  },
  cardSummary: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 4,
  },
  cardSummaryEmpty: {
    fontSize: 13,
    color: theme.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
