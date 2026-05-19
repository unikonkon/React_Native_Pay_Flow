import { PawPrintIcon } from '@/components/common/PawPrintIcon';
import { HapticTab } from '@/components/layout/HapticTab';
import { getTabBarBackgroundColor } from '@/lib/constants/themes';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useIsDarkTheme } from '@/lib/utils/theme';
import { Tabs } from 'expo-router';
import { Image, View, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tab icons sourced from full-color PNG illustrations. Active/inactive state
// is shown via opacity (since the PNGs are multi-color and can't be tinted).
const TAB_ICONS = {
  list: require('@/assets/tab/nav-list.png'),
  summary: require('@/assets/tab/nav-summary.png'),
  premium: require('@/assets/tab/nav-premium.png'),
  settings: require('@/assets/tab/nav-settings.png'),
} as const;

function TabIcon({ source, focused }: {
  source: ImageSourcePropType;
  focused: boolean;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Image
        source={source}
        style={{ width: 28, height: 28, opacity: focused ? 1 : 0.55 }}
        resizeMode="contain"
      />
      {focused && (
        <View>
          <PawPrintIcon size={13} color="#E87A3D" />
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const isDark = useIsDarkTheme();
  const currentTheme = useThemeStore(s => s.currentTheme);
  const tabBg = getTabBarBackgroundColor(currentTheme);
  const insets = useSafeAreaInsets();
  // Compact tab bar — 56px usable area, plus the device's bottom safe inset
  // (home-indicator area on iPhones with no home button).
  const TAB_CONTENT_HEIGHT = 50;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: '#E87A3D',
        tabBarInactiveTintColor: isDark ? '#8A7E72' : '#A39685',
        tabBarLabelStyle: {
          fontFamily: 'IBMPlexSansThai_600SemiBold',
          fontSize: 11,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: tabBg,
          borderTopWidth: 0.5,
          borderTopColor: isDark ? '#4A3D30' : '#EDE4D3',
          height: TAB_CONTENT_HEIGHT + insets.bottom,
          paddingTop: 4,
          paddingBottom: 4 + insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'รายการ',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={TAB_ICONS.list} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'สรุป',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={TAB_ICONS.summary} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-analysis"
        options={{
          title: 'Premium',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={TAB_ICONS.premium} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'ตั้งค่า',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={TAB_ICONS.settings} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
