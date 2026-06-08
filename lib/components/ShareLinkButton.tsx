import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo } from 'react';
import { Platform, Pressable, Share, StyleSheet } from 'react-native';
import { buildArticleShareUrl } from '../constants';
import { useTranslation } from '../i18n';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';

const BUTTON_SIZE = 36;
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

export type ShareLinkButtonProps = {
  articleId: string;
  articleTitle?: string | null;
};

export function ShareLinkButton({ articleId, articleTitle }: ShareLinkButtonProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const shareArticle = useCallback(async () => {
    if (!articleId) return;
    void Haptics.selectionAsync().catch(() => {});
    const shareUrl = buildArticleShareUrl(articleId);
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { url: shareUrl, message: articleTitle ?? undefined }
          : { message: shareUrl, title: articleTitle ?? t('article') },
      );
    } catch {
      // User dismissed the share sheet.
    }
  }, [articleId, articleTitle, t]);

  return (
    <Pressable
      onPress={() => void shareArticle()}
      hitSlop={HIT_SLOP}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={t('shareArticle')}
    >
      <Ionicons name="globe-outline" size={24} color={theme.accent} />
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    button: {
      flexShrink: 0,
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    buttonPressed: {
      opacity: 0.82,
    },
  });
}
