import { StyleSheet, Switch, Text, View } from 'react-native';
import { useFont } from '../../lib/FontContext';
import { theme } from '../../lib/theme';

export default function SettingsScreen() {
  const { useNotoSansSC, setUseNotoSansSC, showPinyin, setShowPinyin, chineseFontStyle } =
    useFont();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, chineseFontStyle]}>Settings</Text>
      <Text style={[styles.subtitle, chineseFontStyle]}>
        Configure your preferences
      </Text>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, chineseFontStyle]}>
          Use Noto Sans SC for Chinese
        </Text>
        <Switch
          value={useNotoSansSC}
          onValueChange={setUseNotoSansSC}
          trackColor={{ false: theme.border, true: theme.accent + '66' }}
          thumbColor={useNotoSansSC ? theme.accent : theme.textMuted}
        />
      </View>
      <Text style={[styles.settingHint, chineseFontStyle]}>
        Noto Sans SC is an optimized font for Simplified Chinese. Turn off to use
        system default.
      </Text>

      <View style={[styles.settingRow, styles.settingRowSpaced]}>
        <Text style={[styles.settingLabel, chineseFontStyle]}>
          Show Pinyin in articles
        </Text>
        <Switch
          value={showPinyin}
          onValueChange={setShowPinyin}
          trackColor={{ false: theme.border, true: theme.accent + '66' }}
          thumbColor={showPinyin ? theme.accent : theme.textMuted}
        />
      </View>
      <Text style={[styles.settingHint, chineseFontStyle]}>
        Display Pinyin romanization above Chinese characters when reading
        articles.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 24,
    paddingTop: 48,
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
  settingHint: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 12,
    marginHorizontal: 4,
  },
});
