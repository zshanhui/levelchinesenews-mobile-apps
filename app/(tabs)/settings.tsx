import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { LineSpacingLevel } from '../../lib/FontContext';
import { useFont } from '../../lib/FontContext';
import { theme } from '../../lib/theme';

const LINE_SPACING_OPTIONS: {
  value: LineSpacingLevel;
  label: string;
  numbers: string;
}[] = [
  { value: 'compact', label: 'compact', numbers: '0px, 8px' },
  { value: 'normal', label: 'normal', numbers: '6px, 24px' },
  { value: 'relaxed', label: 'relaxed', numbers: '14px, 40px' },
];

export default function SettingsScreen() {
  const {
    useNotoSansSC,
    setUseNotoSansSC,
    showPinyin,
    setShowPinyin,
    lineSpacing,
    setLineSpacing,
    chineseFontStyle,
  } = useFont();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, chineseFontStyle]}>settings</Text>
      <Text style={[styles.subtitle, chineseFontStyle]}>
        configure your preferences
      </Text>

      <View style={styles.settingRow}>
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

      <View style={[styles.settingRow, styles.settingRowSpaced]}>
        <Text style={[styles.settingLabel, chineseFontStyle]}>
          adjust line spacing in article content view
        </Text>
      </View>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 24,
    paddingTop: 48,
    paddingBottom: 48,
  },
  title: {
    fontSize: 32,
    color: theme.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 32,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  settingRowSpaced: {
    marginTop: 24,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.text,
    flex: 1,
  },
  segmentedRow: {
    flexDirection: 'row',
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
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
    fontSize: 15,
    color: theme.textSecondary,
  },
  segmentLabelSelected: {
    color: theme.accent,
    fontWeight: '600',
  },
  segmentNumbers: {
    fontSize: 11,
    color: theme.textMuted,
  },
  segmentNumbersSelected: {
    color: theme.accent,
  },
});
