import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useEffect, useMemo, useRef, useState } from 'react';
import { capitalizeFirstWord } from '../../lib/text-utils';
import { useTranslation } from '../../lib/i18n';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import type {
  FontSizeLevel,
  LineSpacingLevel,
} from '../../lib/FontContext';
import { ARTICLE_FONT_SIZE_MAP, useFont } from '../../lib/FontContext';
import { FontSelectorPanel } from '../../lib/components/FontSelectorPanel';
import { NativeLanguageSelector } from '../../lib/components/NativeLanguageSelector';
import { FF_LANGUAGE_SELECTOR } from '../../lib/feature-flags';
import type { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';
import { envConfig } from '../../lib/api';
import { STORAGE_KEY_ARTICLES } from '../../lib/constants';

const URL_ABOUT_PAGE = 'https://levelchinese.app/about';
const URL_CONTACT_PAGE = 'https://levelchinese.app/contact';
import {
  getOrCreateInstallationId,
  userSavedArticlesTableName,
} from '../../lib/localDatabase';

const LINE_SPACING_OPTIONS: {
  value: LineSpacingLevel;
  labelKey: string;
  numbersKey: string;
}[] = [
  { value: 'compact', labelKey: 'lineSpacingCompact', numbersKey: 'lineSpacingNumbersCompact' },
  { value: 'normal', labelKey: 'lineSpacingNormal', numbersKey: 'lineSpacingNumbersNormal' },
  { value: 'relaxed', labelKey: 'lineSpacingRelaxed', numbersKey: 'lineSpacingNumbersRelaxed' },
];

const FONT_SIZE_LEVELS: FontSizeLevel[] = ['xs', 'sm', 'md', 'lg', 'xl'];

export default function SettingsScreen() {
  const { theme, isDark, setDark } = useTheme();
  const { t } = useTranslation();
  const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? 'dev';
  const shouldEnableDebugPanel = process.env.EXPO_PUBLIC_DEBUG === '1';
  const {
    showPinyin,
    setShowPinyin,
    showWordHighlight,
    setShowWordHighlight,
    lineSpacing,
    setLineSpacing,
    fontSize,
    setFontSize,
    fancyDisplayFontStyle,
  } = useFont();

  const [legacyMyArticlesKeyPresent, setLegacyMyArticlesKeyPresent] = useState<
    boolean | null
  >(null);
  const [installationId, setInstallationId] = useState<string | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(!__DEV__);
  const lastVersionTapAtRef = useRef(0);

  useEffect(() => {
    if (!shouldEnableDebugPanel) return;
    AsyncStorage.getItem(STORAGE_KEY_ARTICLES).then((raw) => {
      setLegacyMyArticlesKeyPresent(raw != null && raw.length > 0);
    });
  }, [shouldEnableDebugPanel]);

  useEffect(() => {
    getOrCreateInstallationId()
      .then(setInstallationId)
      .catch((err) => {
        console.warn('Failed to load installation id for settings:', err);
      });
  }, []);

  const handleVersionPress = () => {
    if (!shouldEnableDebugPanel || !__DEV__) return;

    const now = Date.now();
    if (now - lastVersionTapAtRef.current < 400) {
      setShowDebugPanel((current) => !current);
    }
    lastVersionTapAtRef.current = now;
  };

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={[styles.sectionHeader, styles.sectionHeaderFirst]}>
          <Text style={[styles.sectionHeaderText, fancyDisplayFontStyle]}>
            {capitalizeFirstWord(t('configurePreferences'))}
          </Text>
        </View>

        <View style={[styles.settingRow, styles.settingRowSpaced]}>
          <Text style={[styles.settingLabel, fancyDisplayFontStyle]}>
            {t('darkMode')}
          </Text>
          <Switch
            value={isDark}
            onValueChange={setDark}
            trackColor={{ false: theme.border, true: theme.accent + '66' }}
            thumbColor={isDark ? theme.accent : theme.textMuted}
          />
        </View>

        {FF_LANGUAGE_SELECTOR && <NativeLanguageSelector />}

        <Pressable
          style={({ pressed }) => [
            styles.navRow,
            styles.settingRowSpaced,
            pressed && styles.navRowPressed,
          ]}
          onPress={() => router.push('/settings/localdict')}
        >
          <View style={styles.navRowContent}>
            <View style={styles.navRowIcon}>
              <Ionicons name="book-outline" size={20} color={theme.accent} />
            </View>
            <View style={styles.navRowTextGroup}>
              <Text style={[styles.navRowLabel, fancyDisplayFontStyle]}>
                {capitalizeFirstWord(t('configureLocalDict'))}
              </Text>
              <Text style={styles.navRowDescription}>
                {capitalizeFirstWord(t('downloadAndReset'))}
              </Text>
            </View>
          </View>
          <View style={styles.navRowChevron}>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.textMuted}
            />
          </View>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeaderText, fancyDisplayFontStyle]}>
            {capitalizeFirstWord(t('readerPreferences'))}
          </Text>
        </View>

        <FontSelectorPanel />

        <View style={[styles.settingRow, styles.settingRowSpaced]}>
          <Text style={[styles.settingLabel, fancyDisplayFontStyle]}>
            {capitalizeFirstWord(t('showPinyin'))}
          </Text>
          <Switch
            value={showPinyin}
            onValueChange={setShowPinyin}
            trackColor={{ false: theme.border, true: theme.accent + '66' }}
            thumbColor={showPinyin ? theme.accent : theme.textMuted}
          />
        </View>

        <View style={[styles.settingRow, styles.settingRowSpaced]}>
          <Text style={[styles.settingLabel, fancyDisplayFontStyle]}>
            {capitalizeFirstWord(t('wordBracketHighlight'))}
          </Text>
          <Switch
            value={showWordHighlight}
            onValueChange={setShowWordHighlight}
            trackColor={{ false: theme.border, true: theme.accent + '66' }}
            thumbColor={showWordHighlight ? theme.accent : theme.textMuted}
          />
        </View>

        <View style={styles.etchedSection}>
          <Text style={[styles.sectionLabel, fancyDisplayFontStyle]}>
            {capitalizeFirstWord(t('adjustLineSpacing'))}
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
          <Text style={[styles.sectionLabel, fancyDisplayFontStyle]}>
            {capitalizeFirstWord(t('adjustFontSize'))}
          </Text>
          <View style={styles.segmentedRow}>
            {FONT_SIZE_LEVELS.map((level, index) => (
              <Pressable
                key={level}
                onPress={() => setFontSize(level)}
                style={[
                  styles.segmentButton,
                  index === FONT_SIZE_LEVELS.length - 1 && styles.segmentButtonLast,
                  fontSize === level && styles.segmentButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    fontSize === level && styles.segmentLabelSelected,
                  ]}
                >
                  {ARTICLE_FONT_SIZE_MAP[level]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {shouldEnableDebugPanel && showDebugPanel && (
          <View style={styles.debugSection}>
            <Text style={styles.debugSectionTitle}>
              {t('debugEnvVars')}
            </Text>
            <Text
              style={styles.debugBlock}
              selectable
            >
              {[
                `EXPO_PUBLIC_GLITCHTIP_DSN=${
                  process.env.EXPO_PUBLIC_GLITCHTIP_DSN ? '(configured)' : '(not set)'
                }`,
                `EXPO_PUBLIC_API_URL=${envConfig.apiBaseUrl ?? '(not set)'}`,
                `EXPO_PUBLIC_API_WRITE_URL=${envConfig.apiWriteBaseUrl ?? '(not set)'}`,
                `EXPO_PUBLIC_TEMP_ADMIN_ACCESS_WRITE_KEY=${envConfig.tempAdminAccessWriteKey ?? '(not set)'}`,
                `__DEV__=${__DEV__}`,
                '',
                `MY_ARTICLES_LIST=SQLite table ${userSavedArticlesTableName}`,
                ...(legacyMyArticlesKeyPresent === null
                  ? ['MY_ARTICLES_LEGACY_ASYNCSTORAGE=checking…']
                  : legacyMyArticlesKeyPresent
                    ? [
                        `MY_ARTICLES_LEGACY_ASYNCSTORAGE=present (key ${STORAGE_KEY_ARTICLES}; open Create tab to migrate)`,
                      ]
                    : ['MY_ARTICLES_LEGACY_ASYNCSTORAGE=absent (migrated or never used)']),
              ].join('\n')}
            </Text>
          </View>
        )}

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

        <Pressable
          onPress={handleVersionPress}
          style={({ pressed }) => [styles.versionButton, pressed && styles.versionButtonPressed]}
        >
          <Text style={styles.versionText}>Version {appVersion}</Text>
          {installationId ? (
            <Text style={styles.versionSubtext}>{installationId}</Text>
          ) : null}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    color: theme.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
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
  navRowPressed: {
    opacity: 0.7,
    backgroundColor: theme.etchedBg,
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
  navRowDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  navRowChevron: {
    marginLeft: 8,
    padding: 4,
  },
  settingRowTextGroup: {
    flex: 1,
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
  settingDescription: {
    marginTop: 2,
    fontSize: 11,
    color: theme.textSecondary,
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
  debugSection: {
    marginTop: 24,
  },
  debugSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    marginBottom: 6,
  },
  debugBlock: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: theme.textMuted,
    backgroundColor: theme.etchedBg,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
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
  versionSubtext: {
    fontSize: 8,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  versionButton: {
    marginTop: 24,
    marginBottom: 8,
  },
  versionButtonPressed: {
    opacity: 0.7,
  },
  });
}
