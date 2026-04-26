import { PawPrintIcon } from '@/components/common/PawPrintIcon';
import { HapticTab } from '@/components/layout/HapticTab';
import { getTabBarBackgroundColor } from '@/lib/constants/themes';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useIsDarkTheme } from '@/lib/utils/theme';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

// Custom SVG tab icons matching prototype
function ListIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="8" y1="7" x2="20" y2="7" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="8" y1="12" x2="20" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="8" y1="17" x2="20" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={4} cy={7} r={1.3} fill={color} />
      <Circle cx={4} cy={12} r={1.3} fill={color} />
      <Circle cx={4} cy={17} r={1.3} fill={color} />
    </Svg>
  );
}

function PieIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3 Q21 3 21 12 L12 12 Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function DiamondIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 9 L8 4 L16 4 L19 9 L12 20 Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Line x1="5" y1="9" x2="19" y2="9" stroke={color} strokeWidth={2} />
      <Line x1="8" y1="4" x2="12" y2="9" stroke={color} strokeWidth={2} />
      <Line x1="16" y1="4" x2="12" y2="9" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function GearIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2} />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TabIcon({ icon, color, focused }: {
  icon: React.ReactNode;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      {icon}
      {focused && (
        <View style={{ marginTop: 2 }}>
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: '#E87A3D',
        tabBarInactiveTintColor: isDark ? '#8A7E72' : '#A39685',
        tabBarLabelStyle: {
          fontFamily: 'IBMPlexSansThai_400Regular',
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: tabBg,
          borderTopWidth: 0.5,
          borderTopColor: isDark ? '#4A3D30' : '#EDE4D3',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'รายการ',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={<ListIcon color={color} />} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'สรุป',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={<PieIcon color={color} />} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-analysis"
        options={{
          title: 'Premium',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={<DiamondIcon color={color} />} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'ตั้งค่า',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={<GearIcon color={color} />} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
