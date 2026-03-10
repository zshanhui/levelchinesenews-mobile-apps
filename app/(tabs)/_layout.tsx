import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { useTranslation } from '../../lib/i18n';
import { useTheme } from '../../lib/ThemeContext';

function LogoIcon({ theme }: { theme: { accent: string; text: string } }) {
  const logoColors = [theme.accent, '#8a8278', theme.text];
  const barWidth = 4;
  const heights = [10, 16, 22];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 24 }}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={{
            width: barWidth,
            height: h,
            backgroundColor: logoColors[i],
            borderRadius: 2,
          }}
        />
      ))}
    </View>
  );
}

function AppHeader({ theme }: { theme: { accent: string; text: string } }) {
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <LogoIcon theme={theme} />
      <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text }}>
        {t('brand')}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useTheme();
  const { t } = useTranslation();
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
        },
        sceneStyle: { backgroundColor: theme.background },
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
