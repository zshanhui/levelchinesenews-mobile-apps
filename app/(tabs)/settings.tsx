import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SettingsContent } from '../../lib/components/SettingsContent';
import { webContentHorizontalPadding } from '../../lib/constants';
import { useTheme } from '../../lib/ThemeContext';

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
      }),
    [theme],
  );

  return (
    <View style={styles.container}>
      <SettingsContent
        contentContainerStyle={{
          paddingHorizontal: webContentHorizontalPadding(windowWidth),
        }}
      />
    </View>
  );
}
