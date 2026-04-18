import { PawPrint } from '@/assets/svg';
import { HapticTab } from '@/components/layout/HapticTab';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import Svg, { Line, Circle, Path } from 'react-native-svg';

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
      <Path d="M12 2 L13 5 L16 4 L15 7 L18 8 L15 10 L18 12 L15 14 L16 17 L13 16 L12 19 L11 16 L8 17 L9 14 L6 12 L9 10 L6 8 L9 7 L8 4 L11 5 Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
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
          <PawPrint size={8} color="#E87A3D" />
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: '#E87A3D',
        tabBarInactiveTintColor: '#A39685',
        tabBarLabelStyle: {
          fontFamily: 'IBMPlexSansThai_400Regular',
          fontSize: 11,
        },
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: '#EDE4D3',
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
