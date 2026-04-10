import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/lib/stores/theme-store';
import * as Haptics from 'expo-haptics';

const THEMES = [
  { key: 'light', name: 'สว่าง', bg: '#ffffff', primary: '#171717', card: '#ffffff' },
  { key: 'dark', name: 'มืด', bg: '#0a0a0a', primary: '#fafafa', card: '#171717' },
  { key: 'zinc', name: 'ซิงค์', bg: '#fafafa', primary: '#18181b', card: '#ffffff' },
  { key: 'stone', name: 'สโตน', bg: '#fafaf9', primary: '#1c1917', card: '#ffffff' },
  { key: 'cyan', name: 'ฟ้า', bg: '#ecfeff', primary: '#0891b2', card: '#ffffff' },
  { key: 'sky', name: 'ท้องฟ้า', bg: '#f0f9ff', primary: '#0284c7', card: '#ffffff' },
  { key: 'teal', name: 'เขียวน้ำทะเล', bg: '#f0fdfa', primary: '#0d9488', card: '#ffffff' },
  { key: 'gray', name: 'เทา', bg: '#f9fafb', primary: '#111827', card: '#ffffff' },
  { key: 'neutral', name: 'ธรรมชาติ', bg: '#fafafa', primary: '#0a0a0a', card: '#ffffff' },
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
                  <View style={{ backgroundColor: theme.card }} className="rounded-lg p-2 flex-1 justify-center border border-border">
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
