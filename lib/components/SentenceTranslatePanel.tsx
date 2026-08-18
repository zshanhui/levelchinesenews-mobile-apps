import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../i18n';
import { googleTranslateTargetLangCode, type NativeLanguage } from '../nativeLanguage';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';

type SentenceTranslatePanelProps = {
  chineseText: string;
  translatedText?: string | null;
  /** POST in progress — show skeleton placeholder instead of translation */
  isTranslating?: boolean;
  /** Failed POST (e.g. offline); shown instead of empty / translation */
  errorMessage?: string | null;
  /** Target language for external Google Translate link (same as API `target_lang`) */
  targetLang: NativeLanguage;
};

/** Muted bars mimicking ~3 lines of translated text (line height aligned with body copy). */
function TranslationSkeleton({ theme }: { theme: Theme }) {
  const styles = useMemo(() => skeletonStyles(theme), [theme]);
  return (
    <View
      style={styles.wrap}
      accessibilityRole="progressbar"
      accessibilityLabel="Translating"
    >
      <View style={[styles.line, styles.lineFull]} />
      <View style={[styles.line, styles.lineMid]} />
      <View style={[styles.line, styles.lineShort]} />
    </View>
  );
}

function skeletonStyles(theme: Theme) {
  /** Softer than `textMuted` so the skeleton stays visible but not heavy on `etchedBg`. */
  const bar = {
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.readIndicatorMuted,
  } as const;
  return StyleSheet.create({
    wrap: {
      gap: 9,
      minHeight: 52,
      alignSelf: 'stretch',
      paddingTop: 2,
    },
    line: bar,
    lineFull: { width: '100%' },
    lineMid: { width: '88%' },
    lineShort: { width: '62%' },
  });
}

export function SentenceTranslatePanel({
  chineseText,
  translatedText,
  isTranslating = false,
  errorMessage,
  targetLang,
}: SentenceTranslatePanelProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const normalizedChineseText = chineseText.trim();
  const trimmedTranslation = translatedText?.trim();
  const hasTranslation = Boolean(trimmedTranslation);

  const openExternalTranslate = useCallback(() => {
    const q = encodeURIComponent(normalizedChineseText);
    const tl = googleTranslateTargetLangCode(targetLang);
    void Linking.openURL(`https://translate.google.com/?sl=zh-CN&tl=${tl}&text=${q}`);
  }, [normalizedChineseText, targetLang]);

  let body: React.ReactNode;
  if (isTranslating) {
    body = <TranslationSkeleton theme={theme} />;
  } else if (errorMessage) {
    body = (
      <Text
        style={[styles.errorText, styles.textSelectableWeb]}
        selectable
        accessibilityRole="alert"
      >
        {errorMessage}
      </Text>
    );
  } else if (hasTranslation) {
    body = (
      <Text
        style={[styles.translation, styles.textSelectableWeb]}
        selectable
      >
        {trimmedTranslation}
      </Text>
    );
  } else {
    body = null;
  }

  return (
    <Pressable
      onPress={() => {}}
      style={styles.touchShield}
      accessible={false}
    >
      <View style={styles.container}>
        {body != null ? <View style={styles.bodySlot}>{body}</View> : null}
        <View style={styles.footerRow}>
          <Text
            style={[styles.footerCaptionText, styles.aiAttribution]}
            pointerEvents="none"
            numberOfLines={2}
          >
            {t('aiTranslatedWithDeepseek')}
          </Text>
          {!isTranslating ? (
            <Pressable
              onPress={openExternalTranslate}
              style={({ pressed }) => [styles.googlePressable, pressed && styles.googlePressablePressed]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Open in Google Translate"
            >
              <View style={styles.googleCornerRow}>
                <Text style={[styles.footerCaptionText, styles.googleTranslateLabel]}>
                  GoogleTranslate
                </Text>
                <Ionicons name="open-outline" size={12} color={theme.textMuted} />
              </View>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    /** Absorbs taps so parent article Pressable does not dismiss the study panel */
    touchShield: {
      alignSelf: 'stretch',
      width: '100%',
      marginTop: 10,
    },
    container: {
      position: 'relative',
      paddingTop: 14,
      paddingHorizontal: 12,
      paddingBottom: 36,
      backgroundColor: theme.etchedBg,
      borderRadius: 10,
      // Inset “groove”: dark on top/left, light on bottom/right → recessed into the page
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderTopColor: theme.etchedBorderDark,
      borderLeftColor: theme.etchedBorderDark,
      borderBottomWidth: 1,
      borderRightWidth: 1,
      borderBottomColor: theme.etchedBorderLight,
      borderRightColor: theme.etchedBorderLight,
    },
    /** Full-width text; Google row is absolutely positioned and does not shrink this column */
    bodySlot: {
      alignSelf: 'stretch',
      width: '100%',
      paddingBottom: 4,
    },
    footerRow: {
      position: 'absolute',
      left: 8,
      right: 8,
      bottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      zIndex: 2,
    },
    footerCaptionText: {
      fontSize: 9,
      lineHeight: 13,
      color: theme.textMuted,
    },
    aiAttribution: {
      flex: 1,
      minWidth: 0,
      opacity: 0.65,
    },
    googlePressable: {
      flexShrink: 0,
      padding: 2,
      opacity: 0.72,
    },
    googlePressablePressed: {
      opacity: 0.45,
    },
    googleCornerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    googleTranslateLabel: {
      opacity: 0.75,
    },
    translation: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 19,
      width: '100%',
    },
    errorText: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.error,
      width: '100%',
    },
    textSelectableWeb: {
      userSelect: 'text',
    },
  });
}
