import Constants from 'expo-constants';
import { useMemo } from 'react';
import { useTranslation } from '../i18n';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { FontSizeLevel, LineSpacingLevel } from '../FontContext';
import { useFont } from '../FontContext';
import { NativeLanguageSelector } from './NativeLanguageSelector';
import { FF_LANGUAGE_SELECTOR } from '../feature-flags';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';

const URL_ABOUT_PAGE = 'https://levelchinese.app/about';
const URL_CONTACT_PAGE = 'https://levelchinese.app/contact';

const LINE_SPACING_OPTIONS: {
  value: LineSpacingLevel;
  labelKey: string;
  numbersKey: string;
}[] = [
  { value: 'compact', labelKey: 'lineSpacingCompact', numbersKey: 'lineSpacingNumbersCompact' },
  { value: 'normal', labelKey: 'lineSpacingNormal', numbersKey: 'lineSpacingNumbersNormal' },
  { value: 'relaxed', labelKey: 'lineSpacingRelaxed', numbersKey: 'lineSpacingNumbersRelaxed' },
];

const FONT_SIZE_OPTIONS: {
  value: FontSizeLevel;
  label: string;
}[] = [
  { value: 'xs', label: '14' },
  { value: 'sm', label: '16' },
  { value: 'md', label: '18' },
  { value: 'lg', label: '20' },
  { value: 'xl', label: '22' },
];

export function SettingsContent({
  contentContainerStyle,
}: {
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? 'dev';
  const {
    showPinyin,
    setShowPinyin,
    lineSpacing,
    setLineSpacing,
    fontSize,
    setFontSize,
    fancyDisplayFontStyle,
  } = useFont();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={true}
    >
      <View style={[styles.sectionHeader, styles.sectionHeaderFirst]}>
        <Text style={styles.sectionHeaderText}>{t('configurePreferences')}</Text>
      </View>

      {FF_LANGUAGE_SELECTOR && <NativeLanguageSelector />}

      <View
        style={[styles.navRow, styles.settingRowSpaced, styles.navRowWebDisabled]}
        accessibilityRole="text"
      >
        <View style={styles.navRowContent}>
          <View style={[styles.navRowIcon, styles.navRowIconWeb]}>
            <Ionicons name="book-outline" size={20} color={theme.textMuted} />
          </View>
          <View style={styles.navRowTextGroup}>
            <Text style={styles.navRowLabel}>{t('configureLocalDict')}</Text>
            <Text style={styles.navRowDescriptionWebOnly}>
              {t('localDatabaseNotSupportedOnWeb')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{t('readerPreferences')}</Text>
      </View>

      <View style={[styles.settingRow, styles.settingRowSpaced]}>
        <Text style={styles.settingLabel}>
          {t('showPinyin')}
        </Text>
        <Switch
          value={showPinyin}
          onValueChange={setShowPinyin}
          trackColor={{ false: theme.border, true: theme.accent + '66' }}
          thumbColor={showPinyin ? theme.accent : theme.textMuted}
        />
      </View>

      <View style={styles.etchedSection}>
        <Text style={styles.sectionLabel}>
          {t('adjustLineSpacing')}
        </Text>
        <View style={styles.segmentedRow}>
          {LINE_SPACING_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setLineSpacing(opt.value)}
              style={[
                styles.segmentButton,
                opt.value === 'relaxed' && styles.segmentButtonLast,
                lineSpacing === opt.value && styles.segmentButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  lineSpacing === opt.value && styles.segmentLabelSelected,
                ]}
              >
                {t(opt.labelKey)}
              </Text>
              <Text
                style={[
                  styles.segmentNumbers,
                  lineSpacing === opt.value && styles.segmentNumbersSelected,
                ]}
              >
                {t(opt.numbersKey)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.etchedSection}>
        <Text style={styles.sectionLabel}>
          {t('adjustFontSize')}
        </Text>
        <View style={styles.segmentedRow}>
          {FONT_SIZE_OPTIONS.map((opt, index) => (
            <Pressable
              key={opt.value}
              onPress={() => setFontSize(opt.value)}
              style={[
                styles.segmentButton,
                index === FONT_SIZE_OPTIONS.length - 1 && styles.segmentButtonLast,
                fontSize === opt.value && styles.segmentButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  fontSize === opt.value && styles.segmentLabelSelected,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.footerLinksRow}>
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(URL_ABOUT_PAGE)}
          style={({ pressed }) => [
            styles.footerLinkButton,
            pressed && styles.footerLinkButtonPressed,
          ]}
        >
          <Text style={[styles.footerLinkText, fancyDisplayFontStyle]}>{t('aboutLink')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(URL_CONTACT_PAGE)}
          style={({ pressed }) => [
            styles.footerLinkButton,
            pressed && styles.footerLinkButtonPressed,
          ]}
        >
          <Text style={[styles.footerLinkText, fancyDisplayFontStyle]}>{t('contactLink')}</Text>
        </Pressable>
      </View>

      <View style={styles.versionButton}>
        <Text style={styles.versionText}>web reader v{appVersion}</Text>
      </View>
    </ScrollView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingTop: 20,
      paddingBottom: 24,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 12,
      backgroundColor: theme.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    settingRowSpaced: {
      marginTop: 10,
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: theme.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    navRowContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    navRowIcon: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: theme.accent + '18',
      alignItems: 'center',
      justifyContent: 'center',
    },
    navRowTextGroup: {
      flex: 1,
    },
    navRowLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.text,
    },
    navRowWebDisabled: {
      alignItems: 'flex-start',
    },
    navRowIconWeb: {
      backgroundColor: theme.etchedBg,
    },
    navRowDescriptionWebOnly: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 6,
      lineHeight: 18,
    },
    sectionHeader: {
      marginTop: 24,
      marginBottom: 8,
    },
    sectionHeaderFirst: {
      marginTop: 0,
    },
    sectionHeaderText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionLabel: {
      fontSize: 13,
      color: theme.text,
    },
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
    settingLabel: {
      fontSize: 14,
      color: theme.text,
      flex: 1,
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
    segmentLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    segmentLabelSelected: {
      color: theme.accent,
      fontWeight: '600',
    },
    segmentNumbers: {
      fontSize: 10,
      color: theme.textMuted,
    },
    segmentNumbersSelected: {
      color: theme.accent,
    },
    footerLinksRow: {
      flexDirection: 'row',
      marginTop: 24,
      gap: 10,
    },
    footerLinkButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    footerLinkButtonPressed: {
      opacity: 0.75,
      backgroundColor: theme.etchedBg,
    },
    footerLinkText: {
      fontSize: 16,
      color: theme.accent,
    },
    versionText: {
      fontSize: 12,
      color: theme.textMuted,
      textAlign: 'center',
    },
    versionButton: {
      marginTop: 24,
      marginBottom: 8,
    },
  });
}
