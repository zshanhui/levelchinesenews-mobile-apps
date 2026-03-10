import { useMemo } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { FontSizeLevel, LineSpacingLevel } from '../../lib/FontContext';
import { useFont } from '../../lib/FontContext';
import { NativeLanguageSelector } from '../../lib/components/NativeLanguageSelector';
import { FF_LANGUAGE_SELECTOR } from '../../lib/feature-flags';
import type { Theme } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';
import { envConfig } from '../../lib/api';

const LINE_SPACING_OPTIONS: {
  value: LineSpacingLevel;
  label: string;
  numbers: string;
}[] = [
  { value: 'compact', label: 'compact', numbers: '0px, 8px' },
  { value: 'normal', label: 'normal', numbers: '6px, 24px' },
  { value: 'relaxed', label: 'relaxed', numbers: '14px, 40px' },
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

export default function SettingsScreen() {
  const { theme, isDark, setDark } = useTheme();
  const {
    useNotoSansSC,
    setUseNotoSansSC,
    showPinyin,
    setShowPinyin,
    lineSpacing,
    setLineSpacing,
    chineseFontStyle,
    fontSize,
    setFontSize,
  } = useFont();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, chineseFontStyle]}>settings</Text>
      <Text style={[styles.subtitle, chineseFontStyle]}>
        configure your preferences
      </Text>

      {FF_LANGUAGE_SELECTOR && <NativeLanguageSelector />}

      <View style={[styles.settingRow, styles.settingRowSpaced]}>
        <Text style={[styles.settingLabel, chineseFontStyle]}>
          dark mode (cyberpunk)
        </Text>
        <Switch
          value={isDark}
          onValueChange={setDark}
          trackColor={{ false: theme.border, true: theme.accent + '66' }}
          thumbColor={isDark ? theme.accent : theme.textMuted}
        />
      </View>

      <View style={[styles.settingRow, styles.settingRowSpaced]}>
        <Text style={[styles.settingLabel, chineseFontStyle]}>
          use noto sans sc for chinese
        </Text>
        <Switch
          value={useNotoSansSC}
          onValueChange={setUseNotoSansSC}
          trackColor={{ false: theme.border, true: theme.accent + '66' }}
          thumbColor={useNotoSansSC ? theme.accent : theme.textMuted}
        />
      </View>

      <View style={[styles.settingRow, styles.settingRowSpaced]}>
        <Text style={[styles.settingLabel, chineseFontStyle]}>
          show pinyin in articles
        </Text>
        <Switch
          value={showPinyin}
          onValueChange={setShowPinyin}
          trackColor={{ false: theme.border, true: theme.accent + '66' }}
          thumbColor={showPinyin ? theme.accent : theme.textMuted}
        />
      </View>

      <View style={styles.etchedSection}>
        <Text style={[styles.sectionLabel, chineseFontStyle]}>
          adjust line spacing in article content view
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
                chineseFontStyle,
                lineSpacing === opt.value && styles.segmentLabelSelected,
              ]}
            >
              {opt.label}
            </Text>
            <Text
              style={[
                styles.segmentNumbers,
                chineseFontStyle,
                lineSpacing === opt.value && styles.segmentNumbersSelected,
              ]}
            >
              {opt.numbers}
            </Text>
          </Pressable>
        ))}
        </View>
      </View>

      <View style={styles.etchedSection}>
        <Text style={[styles.sectionLabel, chineseFontStyle]}>
          adjust article font size
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
                chineseFontStyle,
                fontSize === opt.value && styles.segmentLabelSelected,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
        </View>
      </View>

      {process.env.EXPO_PUBLIC_DEBUG === '1' && (
        <View style={styles.debugSection}>
          <Text style={[styles.debugSectionTitle, chineseFontStyle]}>
            Debug – environment variables
          </Text>
          <Text
            style={[styles.debugBlock, chineseFontStyle]}
            selectable
          >
            {[
              `EXPO_PUBLIC_API_URL=${envConfig.apiBaseUrl ?? '(not set)'}`,
              `EXPO_PUBLIC_API_WRITE_URL=${envConfig.apiWriteBaseUrl ?? '(not set)'}`,
              `EXPO_PUBLIC_TEMP_ADMIN_ACCESS_WRITE_KEY=${envConfig.tempAdminAccessWriteKey ?? '(not set)'}`,
              `__DEV__=${__DEV__}`,
            ].join('\n')}
          </Text>
        </View>
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
    paddingVertical: 0,
    paddingHorizontal: 12,
    backgroundColor: theme.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  settingRowSpaced: {
    marginTop: 10,
  },
  settingRowTextGroup: {
    flex: 1,
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
  });
}
