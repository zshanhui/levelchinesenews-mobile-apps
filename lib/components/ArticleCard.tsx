import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../i18n';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { resolveImageUrl } from '../api';
import { formatPublishedDate } from '../formatPublishedDate';
import {
  THUMB_MAX_HEIGHT,
  THUMB_WIDTH,
  TRANSLATION_COUNTDOWN_SECONDS,
} from '../constants';
import type { ArticleListItem } from '../types';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen).trim() + '…';
}

/** Warm newsprint tones for list thumbnails when no image URL is available. */
function newspaperThumbnailGradient(isDark: boolean): [string, string, string] {
  if (isDark) {
    return ['#0f0e0c', '#1f1c18', '#2f2b26'];
  }
  return ['#fcfbf7', '#efe8dc', '#ddd2c2'];
}

const hasTranslation = (item: ArticleListItem) =>
  Boolean(item.title_translated_en && item.summary_generated_en);

/** Match `SentenceTranslateToggle` / sentence row, then shrink 20% for the list card */
const TRANSLATE_LIST_SCALE = 0.8;
const TRANSLATE_FAB_HIT = 27 * TRANSLATE_LIST_SCALE;
const TRANSLATE_FAB_FACE = TRANSLATE_FAB_HIT * 0.8;
/** Same base as `SentenceTranslateToggle`, scaled for the list */
const TRANSLATE_ICON_SIZE = 12.75 * 0.8 * TRANSLATE_LIST_SCALE;

export function ArticleCard({
  item,
  onPress,
  onRequestTranslation,
  index = 0,
  read,
  bookmarkSentencePosition,
}: {
  item: ArticleListItem;
  onPress: () => void;
  onRequestTranslation?: (articleId: string) => Promise<ArticleListItem | null>;
  index?: number;
  read?: boolean;
  /** Shown under read checkmark: bookmarked sentence index / total (my articles) */
  bookmarkSentencePosition?: { n: number; t: number };
}) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
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
  const thumbnailGradientColors = useMemo(
    () => newspaperThumbnailGradient(isDark),
    [isDark],
  );

  /**
   * Fixed size — was dynamic from `onLoad` aspect ratio, which made rows jump 80px → 50–70px when
   * images decoded. That relayout (plus FlatList recycling) caused list shake / vibration.
   * Cropping with `contentFit="cover"` matches a stable frame.
   */
  const thumbHeight = THUMB_MAX_HEIGHT;

  /** Match `card` paddingTop — anchor translate to thumbnail row, not card center (avoids shift when summary expands). */
  const CARD_PADDING = 8;
  const translateFromThumbCenter =
    CARD_PADDING + thumbHeight / 2 - 13;
  /** Keep clear space under `readCheckCorner` (top 8, icon 22). */
  const READ_CORNER_TOP = 8;
  const READ_ICON_SIZE = 22;
  const BOOKMARK_FRACTION_GAP = 2;
  const BOOKMARK_FRACTION_TEXT_HEIGHT = 10;
  const checkCornerStackHeight =
    READ_ICON_SIZE +
    (bookmarkSentencePosition != null
      ? BOOKMARK_FRACTION_GAP + BOOKMARK_FRACTION_TEXT_HEIGHT
      : 0);
  const CHECK_TO_TRANSLATE_GAP = 10;
  const minTranslateTopBelowCheck =
    READ_CORNER_TOP + checkCornerStackHeight + CHECK_TO_TRANSLATE_GAP;
  const showReadIndicator = read !== undefined;
  const translateButtonTop = showReadIndicator
    ? Math.max(translateFromThumbCenter, minTranslateTopBelowCheck)
    : translateFromThumbCenter;

  return (
    <View style={styles.card}>
      {showReadIndicator ? (
        <View
          style={styles.readCheckCorner}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons
            name={read ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={22}
            color={read ? theme.accent : theme.readIndicatorMuted}
          />
          {bookmarkSentencePosition != null ? (
            <Text style={styles.bookmarkSentenceFraction}>
              {bookmarkSentencePosition.n}/{bookmarkSentencePosition.t}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={styles.cardTopRow}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            imageUri ? styles.thumbnailWrapper : styles.thumbnailNoImageOuter,
            { width: THUMB_WIDTH, height: thumbHeight },
            pressed && styles.thumbnailPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            read === true
              ? `${t('openArticle', { title: displayTitle })}, ${t('markedReadStatus')}`
              : t('openArticle', { title: displayTitle })
          }
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={[styles.thumbnail, { width: THUMB_WIDTH, height: thumbHeight }]}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <LinearGradient
              colors={thumbnailGradientColors}
              locations={[0, 0.42, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.thumbnailNoImageGradient,
                { width: THUMB_WIDTH, height: thumbHeight },
              ]}
            >
              <View style={styles.thumbnailNoImageInner}>
                <Ionicons
                  name="newspaper-outline"
                  size={item.source ? 22 : 32}
                  color={theme.textMuted}
                />
                {item.source ? (
                  <Text
                    style={styles.thumbnailSourceText}
                    numberOfLines={3}
                    ellipsizeMode="tail"
                  >
                    {item.source}
                  </Text>
                ) : null}
              </View>
            </LinearGradient>
          )}
        </Pressable>
        <Pressable
          style={styles.cardContent}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={
            read === true
              ? `${t('openArticle', { title: displayTitle })}, ${t('markedReadStatus')}`
              : t('openArticle', { title: displayTitle })
          }
        >
          <Text
            style={[
              styles.cardTitle,
              showTranslated && styles.cardTitleTranslated,
              index % 2 === 1 && styles.cardTitleAlt,
              read === true && styles.cardTitleRead,
            ]}
            numberOfLines={showTranslated ? undefined : 2}
          >
            {displayTitle}
          </Text>
          {(item.source ||
            item.published_date ||
            (item.word_count != null && item.word_count > 0)) && (
            <View style={styles.cardMeta}>
              {item.source ? (
                <View style={styles.cardSourceWrapper}>
                  <Text
                    style={styles.cardSource}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.source}
                  </Text>
                </View>
              ) : null}
              {item.source &&
              (item.published_date ||
                (item.word_count != null && item.word_count > 0)) ? (
                <Text style={styles.metaDivider} accessible={false}>
                  |
                </Text>
              ) : null}
              {item.published_date ? (
                <Text style={styles.cardDate} numberOfLines={1}>
                  {formatPublishedDate(item.published_date)}
                </Text>
              ) : null}
              {item.published_date &&
              item.word_count != null &&
              item.word_count > 0 ? (
                <Text style={styles.metaDivider} accessible={false}>
                  |
                </Text>
              ) : null}
              {item.word_count != null && item.word_count > 0 ? (
                <Text
                  style={styles.cardWordCount}
                  numberOfLines={1}
                  accessibilityLabel={`${item.word_count} 单词`}
                >
                  {`${item.word_count} 单词`}
                </Text>
              ) : null}
            </View>
          )}
        </Pressable>
      </View>
      {displaySubtitle ? (
        fullSummary!.length > 100 ? (
          <Pressable
            onPress={() => setSummaryExpanded((prev) => !prev)}
            style={styles.summaryPressable}
            accessibilityRole="button"
            accessibilityLabel={
              summaryExpanded ? 'Show less summary' : 'Show more summary'
            }
          >
            <Text
              style={styles.cardSummary}
              numberOfLines={summaryExpanded ? undefined : 6}
            >
              {displaySubtitle}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.summaryPressable}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={
              read === true
                ? `${t('openArticle', { title: displayTitle })}, ${t('markedReadStatus')}`
                : t('openArticle', { title: displayTitle })
            }
          >
            <Text style={styles.cardSummary}>{displaySubtitle}</Text>
          </Pressable>
        )
      ) : null}
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
                        t('translationFailed'),
                        t('couldNotGenerateTranslation'),
                      );
                    }
                  } catch {
                    Alert.alert(
                      t('translationFailed'),
                      t('couldNotGenerateTranslation'),
                    );
                  } finally {
                    translatingRef.current = false;
                    setTranslating(false);
                  }
                }
              : undefined
        }
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={[styles.translateButtonHit, { top: translateButtonTop }]}
        accessibilityRole={hasTranslation(item) || (onRequestTranslation && !translating) ? 'button' : 'image'}
        accessibilityLabel={
          translating
            ? t('generatingTranslation')
            : hasTranslation(item)
              ? showTranslated
                ? t('showChineseTitle')
                : t('showEnglishTranslation')
              : t('requestTranslation')
        }
      >
        {({ pressed }) => (
          <View
            style={[
              styles.translateButtonFace,
              hasTranslation(item) && pressed && !translating && styles.translateButtonFacePressed,
              translating && styles.translateButtonFaceLoading,
            ]}
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
                size={TRANSLATE_ICON_SIZE}
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
          </View>
        )}
      </Pressable>
    </View>
  );
}

function createStyles(theme: Theme, isDark: boolean) {
  const translateFabShadow = {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.24 : 0.1,
          shadowRadius: 3,
        };

  return StyleSheet.create({
  card: {
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: theme.surfaceElevated,
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 96,
    borderWidth: 1,
    borderColor: theme.border,
    position: 'relative',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  readCheckCorner: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: theme.surfaceElevated,
    borderRadius: 12,
    paddingBottom: 2,
  },
  bookmarkSentenceFraction: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: '600',
    color: theme.textMuted,
    fontVariant: ['tabular-nums'],
  },
  thumbnailWrapper: {
    flexShrink: 0,
    width: THUMB_WIDTH,
    height: THUMB_MAX_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.border,
  },
  thumbnail: {
    width: THUMB_WIDTH,
    height: THUMB_MAX_HEIGHT,
    borderRadius: 8,
    backgroundColor: theme.border,
  },
  thumbnailNoImageOuter: {
    flexShrink: 0,
    width: THUMB_WIDTH,
    height: THUMB_MAX_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnailNoImageGradient: {
    borderRadius: 8,
  },
  thumbnailNoImageInner: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  thumbnailSourceText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
    color: isDark ? theme.textMuted : theme.textSecondary,
  },
  thumbnailPressed: {
    opacity: 0.7,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
    paddingRight: '10%',
    justifyContent: 'flex-start',
    minWidth: 0,
  },
  translateButtonHit: {
    position: 'absolute',
    right: 8,
    zIndex: 1,
    width: TRANSLATE_FAB_HIT,
    height: TRANSLATE_FAB_HIT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  translateButtonFace: {
    width: TRANSLATE_FAB_FACE,
    height: TRANSLATE_FAB_FACE,
    borderRadius: TRANSLATE_FAB_FACE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.etchedBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    ...translateFabShadow,
  },
  translateButtonFacePressed: {
    opacity: 0.65,
  },
  translateButtonFaceLoading: {
    opacity: 0.85,
  },
  translateIconUnavailable: {
    opacity: 0.5,
  },
  countdownText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.accent,
    minWidth: 14,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  summaryPressable: {
    alignSelf: 'stretch',
    width: '100%',
    marginTop: 4,
    paddingTop: 4,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.accentPressed,
  },
  cardTitleAlt: {
    color: theme.cardTitleAlt,
  },
  cardTitleRead: {
    opacity: 0.6,
  },
  cardTitleTranslated: {
    fontSize: 14,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    minWidth: 0,
    width: '100%',
  },
  metaDivider: {
    flexShrink: 0,
    fontSize: 12,
    color: theme.textMuted,
    opacity: 0.55,
    fontWeight: '300',
  },
  cardSourceWrapper: {
    flexShrink: 1,
    minWidth: 0,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardSource: {
    fontSize: 12,
    color: theme.textMuted,
  },
  cardDate: {
    flexShrink: 0,
    fontSize: 12,
    color: theme.textMuted,
  },
  cardWordCount: {
    flexShrink: 0,
    fontSize: 12,
    color: theme.textMuted,
    fontVariant: ['tabular-nums'],
  },
  cardSummary: {
    fontSize: 13,
    color: theme.textSecondary,
    width: '100%',
  },
  });
}
