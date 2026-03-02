import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { resolveImageUrl } from '../api';
import {
  THUMB_MAX_HEIGHT,
  THUMB_MIN_HEIGHT,
  THUMB_WIDTH,
  TRANSLATION_COUNTDOWN_SECONDS,
} from '../constants';
import { useFont } from '../FontContext';
import type { ArticleListItem } from '../types';
import { theme } from '../theme';

function formatDateTime(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen).trim() + '…';
}

const hasTranslation = (item: ArticleListItem) =>
  Boolean(item.title_translated_en && item.summary_generated_en);

export function ArticleCard({
  item,
  onPress,
  onRequestTranslation,
  index = 0,
}: {
  item: ArticleListItem;
  onPress: () => void;
  onRequestTranslation?: (articleId: string) => Promise<ArticleListItem | null>;
  index?: number;
}) {
  const { chineseFontStyle, chineseFontBoldStyle } = useFont();
  const [showTranslated, setShowTranslated] = useState(false);
  const [translating, setTranslating] = useState(false);
  const translatingRef = useRef(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  useEffect(() => {
    if (!translating) {
      setCountdown(null);
      return;
    }
    setCountdown(TRANSLATION_COUNTDOWN_SECONDS);
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [translating]);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
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

  const imageUri = resolveImageUrl(item.main_image);

  useEffect(() => {
    setAspectRatio(null);
  }, [imageUri]);

  const thumbHeight =
    aspectRatio != null
      ? Math.min(
          THUMB_MAX_HEIGHT,
          Math.max(THUMB_MIN_HEIGHT, THUMB_WIDTH / aspectRatio),
        )
      : THUMB_WIDTH;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          imageUri ? styles.thumbnailWrapper : styles.thumbnailPlaceholder,
          { width: THUMB_WIDTH, height: thumbHeight },
          pressed && styles.thumbnailPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`open article: ${displayTitle}`}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={[styles.thumbnail, { width: THUMB_WIDTH, height: thumbHeight }]}
            contentFit="cover"
            onLoad={(e) => {
              const { width, height } = e.source;
              if (width && height) setAspectRatio(width / height);
            }}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Ionicons name="newspaper-outline" size={32} color={theme.textMuted} />
        )}
      </Pressable>
      <Pressable
        style={styles.cardContent}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`open article: ${displayTitle}`}
      >
        <Text
          style={[
            styles.cardTitle,
            chineseFontBoldStyle,
            showTranslated && styles.cardTitleTranslated,
            index % 2 === 1 && styles.cardTitleAlt,
          ]}
          numberOfLines={showTranslated ? undefined : 2}
        >
          {displayTitle}
        </Text>
        {(item.source || item.published_date) && (
          <View style={styles.cardMeta}>
            {item.source && (
              <View style={styles.cardSourceWrapper}>
                <Text style={[styles.cardSource, chineseFontStyle]}>
                  {item.source}
                </Text>
              </View>
            )}
            {item.published_date && (
              <Text style={styles.cardDate}>
                {formatDateTime(item.published_date)}
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
        ) : null}
      </Pressable>
      <Pressable
        onPress={
          hasTranslation(item)
            ? () => setShowTranslated((prev) => !prev)
            : onRequestTranslation && !translating
              ? async () => {
                  if (translatingRef.current) return;
                  translatingRef.current = true;
                  setTranslating(true);
                  setCountdown(TRANSLATION_COUNTDOWN_SECONDS);
                  try {
                    const updated = await onRequestTranslation(item.id);
                    if (updated) {
                      setShowTranslated(true);
                    } else {
                      Alert.alert(
                        'Translation failed',
                        'Could not generate translation. Please try again.',
                      );
                    }
                  } catch {
                    Alert.alert(
                      'Translation failed',
                      'Could not generate translation. Please try again.',
                    );
                  } finally {
                    translatingRef.current = false;
                    setTranslating(false);
                  }
                }
              : undefined
        }
        hitSlop={8}
        style={({ pressed }) => [
          styles.translateButton,
          hasTranslation(item) && pressed && styles.translateButtonPressed,
        ]}
        accessibilityRole={hasTranslation(item) || (onRequestTranslation && !translating) ? 'button' : 'image'}
        accessibilityLabel={
          translating
            ? 'Generating translation…'
            : hasTranslation(item)
              ? showTranslated
                ? 'Show Chinese title'
                : 'Show English translation'
              : 'Request translation'
        }
      >
        {translating ? (
          countdown !== null && countdown > 0 ? (
            <Text style={styles.countdownText}>{countdown}</Text>
          ) : (
            <ActivityIndicator size="small" color={theme.accent} />
          )
        ) : (
          <Ionicons
            name="language-outline"
            size={18}
            color={
              hasTranslation(item)
                ? showTranslated
                  ? theme.accent
                  : theme.textMuted
                : theme.textMuted
            }
            style={!hasTranslation(item) && styles.translateIconUnavailable}
          />
        )}
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
    position: 'relative',
  },
  thumbnailWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.border,
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
  thumbnailPressed: {
    opacity: 0.7,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
    paddingRight: '10%',
    justifyContent: 'center',
    minWidth: 0,
  },
  translateButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  translateButtonPressed: {
    opacity: 0.7,
  },
  translateIconUnavailable: {
    opacity: 0.5,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.accent,
    minWidth: 18,
    textAlign: 'center',
  },
  summaryPressable: {
    alignSelf: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.accentPressed,
  },
  cardTitleAlt: {
    color: theme.cardTitleAlt,
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
  cardSourceWrapper: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardSource: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
    letterSpacing: 0.5,
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
});
