import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/lib/stores/theme-store';
import * as Haptics from 'expo-haptics';

const THEMES = [
  { key: 'warm', name: 'อบอุ่น', bg: '#FBF7F0', primary: '#E87A3D', accent: '#F5D9B8' },
  { key: 'warm-dark', name: 'อบอุ่น (มืด)', bg: '#1F1913', primary: '#E87A3D', accent: '#3A2E22' },
  { key: 'sakura', name: 'ซากุระ', bg: '#FFF5F5', primary: '#E87A3D', accent: '#FFE0E8' },
  { key: 'sakura-dark', name: 'ซากุระ (มืด)', bg: '#1F1517', primary: '#E87A3D', accent: '#3A2530' },
  { key: 'ocean', name: 'มหาสมุทร', bg: '#F0F7FB', primary: '#E87A3D', accent: '#D0E8F5' },
  { key: 'ocean-dark', name: 'มหาสมุทร (มืด)', bg: '#131A1F', primary: '#E87A3D', accent: '#1E2E38' },
  { key: 'forest', name: 'ป่าไม้', bg: '#F2F7F0', primary: '#E87A3D', accent: '#D0E8C8' },
  { key: 'forest-dark', name: 'ป่าไม้ (มืด)', bg: '#151F13', primary: '#E87A3D', accent: '#253520' },
  { key: 'midnight', name: 'เที่ยงคืน', bg: '#14141A', primary: '#E87A3D', accent: '#252530' },
];

export default function ThemeScreen() {
  const { currentTheme, setTheme } = useThemeStore();

  const handleSelect = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTheme(key);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-muted-foreground text-sm mb-4">เลือกธีมสำหรับแอป</Text>
        <View className="flex-row flex-wrap gap-3">
          {THEMES.map(theme => {
            const isSelected = currentTheme === theme.key;
            return (
              <Pressable key={theme.key} onPress={() => handleSelect(theme.key)} className={`w-[31%] rounded-2xl overflow-hidden border-2 ${isSelected ? 'border-primary' : 'border-border'}`}>
                <View style={{ backgroundColor: theme.bg }} className="p-3 h-24 justify-between">
                  <View style={{ backgroundColor: theme.accent, opacity: 0.5 }} className="rounded-lg p-2 flex-1 justify-center border border-border">
                    <View className="flex-row items-center">
                      <View style={{ backgroundColor: theme.primary }} className="w-4 h-4 rounded-full mr-2" />
                      <View style={{ backgroundColor: theme.primary, opacity: 0.3 }} className="h-2 flex-1 rounded" />
                    </View>
                  </View>
                </View>
                <View className={`py-2 items-center ${isSelected ? 'bg-primary' : 'bg-card'}`}>
                  {isSelected && <Ionicons name="checkmark-circle" size={16} color="white" style={{ position: 'absolute', top: -8, right: 4 }} />}
                  <Text className={`text-xs font-semibold ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>{theme.name}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
