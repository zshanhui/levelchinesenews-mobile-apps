import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../lib/i18n';
import { useTheme } from '../../lib/ThemeContext';
import { darkTheme } from '../../lib/theme';

function triggerTabHaptic() {
  void Haptics.selectionAsync().catch(() => {});
}

/** Extra space below tab icons/labels (safe area is added on top of this). */
const TAB_BAR_EXTRA_BOTTOM_PADDING = 10;

function LogoIcon({ theme }: { theme: { accent: string; text: string } }) {
  const logoColors = [theme.accent, '#8a8278', theme.text];
  const barWidth = 4;
  const heights = [20, 16, 11];
  return (
    // marginBottom ≈ the text's descender space: RN's flex-end alignment lines the bars up
    // with the text box bottom, but capital glyphs sit one descender above that. Lift the
    // bars so their bottom edge optically aligns with the baseline of "CN".
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 20, marginBottom: 3 }}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={{
            width: barWidth,
            height: h,
            backgroundColor: logoColors[i],
            borderRadius: 1.5,
          }}
        />
      ))}
    </View>
  );
}

function AppHeader({
  theme,
}: {
  theme: { accent: string; accentPressed: string; text: string; textMuted: string; background: string };
}) {
  const zhColor =
    theme.background === darkTheme.background ? '#c41e1e' : theme.accentPressed;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
      <LogoIcon theme={theme} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.text,
              lineHeight: 18,
              includeFontPadding: false,
            }}
          >
            CN
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: zhColor,
              lineHeight: 18,
              includeFontPadding: false,
              marginBottom: 1,
            }}
          >
            中文
          </Text>
        </View>
        <Text
          style={{
            fontSize: 10,
            fontWeight: '400',
            color: theme.textMuted,
            lineHeight: 12,
            marginLeft: 3,
            includeFontPadding: false,
          }}
        >
          (preview)
        </Text>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        headerStyle: {
          backgroundColor: theme.surface,
          borderBottomColor: theme.border,
          borderBottomWidth: 1,
        },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        headerTitle: () => <AppHeader theme={theme} />,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          paddingBottom: insets.bottom + TAB_BAR_EXTRA_BOTTOM_PADDING,
        },
        sceneStyle: { backgroundColor: theme.background },
      }}
      screenListeners={{
        tabPress: triggerTabHaptic,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.articles'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'newspaper' : 'newspaper-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: t('tabs.create'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="learn-index-screen"
        options={{
          title: t('tabs.learn'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
