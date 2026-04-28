import { PawPrintIcon } from '@/components/common/PawPrintIcon';
import { HapticTab } from '@/components/layout/HapticTab';
import { getTabBarBackgroundColor } from '@/lib/constants/themes';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useIsDarkTheme } from '@/lib/utils/theme';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// Cat-themed tab icons — fat-cat solid-fill design language matching
// CatCategoryIcon. Goals:
//  • โดดเด่น — solid silhouettes read clearly even at 22-24px
//  • ดูง่าย — minimal stroke noise, single-color silhouettes
//  • ธีมแมวส้มอ้วน — cat ears on top of every icon plus paw stamps,
//    whisker dots, and sparkles sprinkled throughout

// รายการ — bullet list with cat-ear marker + whisker dots
function ListIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Cat-ear flick on top-left */}
      <Path d="M2 4 L1 1 L4 2.5 Z" fill={color} />
      {/* Three bullet rows */}
      <Circle cx={3.7} cy={7} r={1.5} fill={color} />
      <Path d="M7.5 5.8 H21.5 V8.2 H7.5 Z" fill={color} />
      <Circle cx={3.7} cy={12} r={1.5} fill={color} />
      <Path d="M7.5 10.8 H21.5 V13.2 H7.5 Z" fill={color} />
      <Circle cx={3.7} cy={17} r={1.5} fill={color} />
      <Path d="M7.5 15.8 H17 V18.2 H7.5 Z" fill={color} />
      {/* Whisker dots near bottom-right */}
      <Circle cx={19.5} cy={17} r={0.55} fill={color} />
      <Circle cx={21.5} cy={17} r={0.55} fill={color} />
    </Svg>
  );
}

// สรุป — pie chart silhouette w/ cat ears + cut slice outline
function PieIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Cat ears */}
      <Path d="M7 5 L6 1.8 L9.6 3 Z" fill={color} />
      <Path d="M17 5 L18 1.8 L14.4 3 Z" fill={color} />
      {/* Filled 3/4 pie (large slice) */}
      <Path d="M12 12 L20.5 12 A8.5 8.5 0 1 1 12 3.5 Z" fill={color} />
      {/* Cut slice — outline only (looks "eaten") */}
      <Path
        d="M12 12 L12 3.5 A8.5 8.5 0 0 1 20.5 12"
        stroke={color}
        strokeWidth={1.6}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Whisker dots beside the cut slice */}
      <Circle cx={16.5} cy={7} r={0.5} fill={color} />
    </Svg>
  );
}

// Premium — diamond silhouette w/ cat ears + sparkle accents
function DiamondIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Cat ears on diamond top */}
      <Path d="M9 4 L8 0.8 L11.2 2 Z" fill={color} />
      <Path d="M15 4 L16 0.8 L12.8 2 Z" fill={color} />
      {/* Diamond — solid filled */}
      <Path d="M5 9 L8 4 L16 4 L19 9 L12 21 Z" fill={color} />
      {/* Sparkles flanking the gem */}
      <Path d="M2.5 6 l0.4 1 1 0.4 -1 0.4 -0.4 1 -0.4 -1 -1 -0.4 1 -0.4 z" fill={color} />
      <Path d="M21 13 l0.4 1 1 0.4 -1 0.4 -0.4 1 -0.4 -1 -1 -0.4 1 -0.4 z" fill={color} />
      {/* Whisker dot */}
      <Circle cx={6} cy={15} r={0.5} fill={color} />
    </Svg>
  );
}

// ตั้งค่า — gear silhouette w/ cat ears + paw-stamp center
function GearIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Cat ears on top */}
      <Path d="M9 4 L8 0.8 L11.2 2 Z" fill={color} />
      <Path d="M15 4 L16 0.8 L12.8 2 Z" fill={color} />
      {/* Gear w/ 8 chunky teeth + center hole cut via evenodd */}
      <Path
        d="M10 3.8 H14 L14.5 6 L16.8 5.2 L18.8 7.2 L18 9.5 L20.2 10 V14 L18 14.5 L18.8 16.8 L16.8 18.8 L14.5 18 L14 20.2 H10 L9.5 18 L7.2 18.8 L5.2 16.8 L6 14.5 L3.8 14 V10 L6 9.5 L5.2 7.2 L7.2 5.2 L9.5 6 Z M9.5 12 A2.5 2.5 0 1 0 14.5 12 A2.5 2.5 0 1 0 9.5 12 Z"
        fill={color}
        fillRule="evenodd"
      />
      {/* Tiny paw stamp accent in the center hole */}
      <Circle cx={11} cy={11.4} r={0.45} fill={color} />
      <Circle cx={12.5} cy={11} r={0.45} fill={color} />
      <Circle cx={14} cy={11.4} r={0.45} fill={color} />
      <Path d="M11.5 12.4 Q12.5 12.2 13.5 12.4 Q13.6 13 12.5 13 Q11.4 13 11.5 12.4 Z" fill={color} />
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
