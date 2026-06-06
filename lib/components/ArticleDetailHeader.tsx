import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { resolveImageUrl } from '../api';
import { formatPublishedDate } from '../formatPublishedDate';
import { useTranslation } from '../i18n';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { ShareLinkButton } from './ShareLinkButton';

/** Native headline size */
const ARTICLE_TITLE_BASE_FONT_SIZE = 22;

export type ArticleDetailHeaderProps = {
  articleId: string;
  title: string;
  source: string | null;
  sourceUrl: string | null;
  publishedDate: string | null;
  mainImage: string | null;
  usingCache?: boolean;
  titleFontSize?: number;
};

export function ArticleDetailHeader({
  articleId,
  title,
  source,
  sourceUrl,
  publishedDate,
  mainImage,
  usingCache = false,
  titleFontSize = ARTICLE_TITLE_BASE_FONT_SIZE,
}: ArticleDetailHeaderProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const imageUri = resolveImageUrl(mainImage);

  const cachedLabel = usingCache ? (
    <Text style={styles.metaText}>{t('cached')}</Text>
  ) : null;

  return (
    <>
      <Text style={[styles.title, { fontSize: titleFontSize }]}>{title}</Text>
      <View style={styles.metaRow}>
        <View style={styles.meta}>
          {source ? (
            <View style={styles.metaSource}>
              <Text style={styles.metaText}>{source}</Text>
              {sourceUrl ? (
                <Pressable
                  onPress={() => Linking.openURL(sourceUrl)}
                  hitSlop={8}
                  accessibilityRole="link"
                  accessibilityLabel={t('openSourceArticle')}
                >
                  <Ionicons name="open-outline" size={16} color={theme.accent} />
                </Pressable>
              ) : null}
            </View>
          ) : null}
          {publishedDate ? (
            <View style={styles.metaDateRow}>
              <Text style={styles.metaText}>{formatPublishedDate(publishedDate)}</Text>
              {cachedLabel}
            </View>
          ) : (
            cachedLabel
          )}
        </View>
        <ShareLinkButton articleId={articleId} articleTitle={title} />
      </View>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    title: {
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    meta: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 12,
      minWidth: 0,
    },
    metaSource: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaDateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    metaText: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    image: {
      width: '100%',
      aspectRatio: 16 / 10,
      borderRadius: 8,
      backgroundColor: theme.border,
      marginBottom: 16,
    },
  });
}
