import { View, Text, Pressable, ScrollView, Switch, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAlertSettingsStore } from '@/lib/stores/alert-settings-store';
import { useCategoryStore } from '@/lib/stores/category-store';
import { formatCurrency } from '@/lib/utils/format';
import { useState } from 'react';

export default function AlertsScreen() {
  const {
    isMonthlyTargetEnabled, monthlyExpenseTarget,
    isCategoryLimitsEnabled, categoryLimits,
    updateAlertSettings, addCategoryLimit, removeCategoryLimit,
  } = useAlertSettingsStore();

  const categories = useCategoryStore(s => s.categories);
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const [targetInput, setTargetInput] = useState(monthlyExpenseTarget > 0 ? String(monthlyExpenseTarget) : '');

  const handleTargetSave = () => {
    const value = parseFloat(targetInput) || 0;
    updateAlertSettings({ monthlyExpenseTarget: value });
  };

  const handleAddLimit = () => {
    const available = expenseCategories.filter(c => !categoryLimits.some(l => l.categoryId === c.id));
    if (available.length === 0) {
      Alert.alert('ครบแล้ว', 'ตั้งเป้าทุกหมวดหมู่แล้ว');
      return;
    }
    Alert.prompt(
      'ตั้งเป้าหมวดหมู่',
      `เลือก: ${available.map((c, i) => `${i + 1}.${c.name}`).join(' ')}\nใส่: หมายเลข,จำนวนเงิน (เช่น 1,5000)`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'เพิ่ม', onPress: (input?: string) => {
          if (!input) return;
          const parts = input.split(',');
          const idx = parseInt(parts[0]) - 1;
          const limit = parseFloat(parts[1]);
          if (idx >= 0 && idx < available.length && limit > 0) {
            addCategoryLimit(available[idx].id, limit);
          }
        }},
      ],
      'plain-text'
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView>
        <View className="px-4 py-2 bg-background">
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12 }} className="text-muted-foreground">เป้ารายจ่ายรายเดือน</Text>
        </View>
        <View className="px-4 py-4 bg-card border-b border-border">
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }} className="text-foreground">เปิดใช้งาน</Text>
            <Switch value={isMonthlyTargetEnabled} onValueChange={(v) => updateAlertSettings({ isMonthlyTargetEnabled: v })} trackColor={{ true: '#E87A3D' }} />
          </View>
          {isMonthlyTargetEnabled && (
            <View className="flex-row items-center">
              <Text className="text-foreground text-lg mr-2">฿</Text>
              <TextInput value={targetInput} onChangeText={setTargetInput} onBlur={handleTargetSave} placeholder="0" placeholderTextColor="#999" keyboardType="decimal-pad" className="flex-1 text-foreground text-lg border-b border-border py-1" />
            </View>
          )}
        </View>

        <View className="px-4 py-2 bg-background mt-4">
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12 }} className="text-muted-foreground">เป้าตามหมวดหมู่</Text>
        </View>
        <View className="px-4 py-4 bg-card border-b border-border">
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }} className="text-foreground">เปิดใช้งาน</Text>
            <Switch value={isCategoryLimitsEnabled} onValueChange={(v) => updateAlertSettings({ isCategoryLimitsEnabled: v })} trackColor={{ true: '#E87A3D' }} />
          </View>
        </View>

        {isCategoryLimitsEnabled && (
          <>
            {categoryLimits.map(limit => {
              const cat = categories.find(c => c.id === limit.categoryId);
              if (!cat) return null;
              return (
                <Pressable key={limit.categoryId} onLongPress={() => {
                  Alert.alert('ลบเป้า', `ลบเป้า "${cat.name}" ?`, [
                    { text: 'ยกเลิก', style: 'cancel' },
                    { text: 'ลบ', style: 'destructive', onPress: () => removeCategoryLimit(limit.categoryId) },
                  ]);
                }} className="flex-row items-center px-4 py-3 bg-card border-b border-border">
                  <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: cat.color }}>
                    <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={16} color="white" />
                  </View>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 15 }} className="text-foreground flex-1">{cat.name}</Text>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, fontVariant: ['tabular-nums'] }} className="text-foreground">{formatCurrency(limit.limit)}</Text>
                </Pressable>
              );
            })}
            <Pressable onPress={handleAddLimit} className="flex-row items-center justify-center px-4 py-3 bg-card border-b border-border">
              <Ionicons name="add-circle-outline" size={20} color="#E87A3D" />
              <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }} className="text-primary ml-2">เพิ่มเป้าหมวดหมู่</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
