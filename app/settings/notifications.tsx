import { useAlertSettingsStore } from '@/lib/stores/alert-settings-store';
import { formatCurrency } from '@/lib/utils/format';
import {
  getNotificationsEnabled,
  requestNotificationPermissions,
  setNotificationsEnabled,
} from '@/lib/utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAILY_PRESETS = [200, 500, 1000, 2000];
const MONTHLY_PRESETS = [5000, 10000, 20000, 50000];

export default function NotificationsScreen() {
  const {
    isDailyTargetEnabled, dailyExpenseTarget,
    isMonthlyTargetEnabled, monthlyExpenseTarget,
    updateAlertSettings,
  } = useAlertSettingsStore();

  const [pushEnabled, setPushEnabled] = useState(false);
  const [dailyInput, setDailyInput] = useState(String(dailyExpenseTarget || ''));
  const [monthlyInput, setMonthlyInput] = useState(String(monthlyExpenseTarget || ''));

  useEffect(() => {
    getNotificationsEnabled().then(setPushEnabled);
  }, []);

  useEffect(() => {
    setDailyInput(String(dailyExpenseTarget || ''));
  }, [dailyExpenseTarget]);

  useEffect(() => {
    setMonthlyInput(String(monthlyExpenseTarget || ''));
  }, [monthlyExpenseTarget]);

  const handleTogglePush = async (next: boolean) => {
    Haptics.selectionAsync();
    if (next) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'ไม่ได้รับสิทธิ์',
          'แอปยังไม่ได้รับสิทธิ์ในการแจ้งเตือน กรุณาเปิดในตั้งค่าระบบของอุปกรณ์'
        );
        return;
      }
    }
    await setNotificationsEnabled(next);
    setPushEnabled(next);
  };

  const handleToggleDaily = async (next: boolean) => {
    Haptics.selectionAsync();
    await updateAlertSettings({ isDailyTargetEnabled: next });
  };

  const handleToggleMonthly = async (next: boolean) => {
    Haptics.selectionAsync();
    await updateAlertSettings({ isMonthlyTargetEnabled: next });
  };

  const handleSaveDaily = async () => {
    const n = Math.max(0, Math.floor(Number(dailyInput) || 0));
    await updateAlertSettings({ dailyExpenseTarget: n });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSaveMonthly = async () => {
    const n = Math.max(0, Math.floor(Number(monthlyInput) || 0));
    await updateAlertSettings({ monthlyExpenseTarget: n });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePickDaily = (n: number) => {
    Haptics.selectionAsync();
    setDailyInput(String(n));
    updateAlertSettings({ dailyExpenseTarget: n, isDailyTargetEnabled: true });
  };

  const handlePickMonthly = (n: number) => {
    Haptics.selectionAsync();
    setMonthlyInput(String(n));
    updateAlertSettings({ monthlyExpenseTarget: n, isMonthlyTargetEnabled: true });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14,
          flexDirection: 'row', alignItems: 'center', gap: 8,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          className="bg-secondary"
          style={{
            width: 36, height: 36, borderRadius: 18,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={18} color="#A39685" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 20, letterSpacing: -0.3 }}>
            แจ้งเตือนรายจ่าย
          </Text>
          <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5, marginTop: 1 }}>
            ตั้งงบรายวัน รายเดือน และเปิดการแจ้งเตือน
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 32, gap: 14 }}>
        {/* Push toggle */}
        <SectionCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 40, height: 40, borderRadius: 12,
              backgroundColor: '#E87A3D22',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="notifications-outline" size={20} color="#E87A3D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14.5 }}>
                การแจ้งเตือน Push
              </Text>
              <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5, marginTop: 2 }}>
                ส่งแจ้งเตือนเมื่อใช้จ่ายใกล้/เกินงบที่ตั้งไว้
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={handleTogglePush}
              trackColor={{ false: '#E5DCC9', true: '#E87A3D' }}
              thumbColor="#E5DCC9"
            />
          </View>
        </SectionCard>

        {/* Daily target */}
        <TargetCard
          icon="today-outline"
          title="งบรายวัน"
          subtitle="แจ้งเตือนเมื่อใช้จ่ายใกล้หรือเกินงบของวันนี้"
          enabled={isDailyTargetEnabled}
          onToggle={handleToggleDaily}
          input={dailyInput}
          onInputChange={setDailyInput}
          onSave={handleSaveDaily}
          presets={DAILY_PRESETS}
          onPickPreset={handlePickDaily}
          currentValue={dailyExpenseTarget}
        />

        {/* Monthly target */}
        <TargetCard
          icon="calendar-outline"
          title="งบรายเดือน"
          subtitle="แจ้งเตือนเมื่อใช้จ่ายใกล้หรือเกินงบของเดือนนี้"
          enabled={isMonthlyTargetEnabled}
          onToggle={handleToggleMonthly}
          input={monthlyInput}
          onInputChange={setMonthlyInput}
          onSave={handleSaveMonthly}
          presets={MONTHLY_PRESETS}
          onPickPreset={handlePickMonthly}
          currentValue={monthlyExpenseTarget}
        />

        {/* Hint */}
        <View
          style={{
            padding: 12, borderRadius: 12,
            backgroundColor: 'rgba(232,181,71,0.15)',
            flexDirection: 'row', alignItems: 'flex-start', gap: 8,
          }}
        >
          <Ionicons name="information-circle" size={16} color="#E8B547" style={{ marginTop: 1 }} />
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5, color: '#6B5F55', lineHeight: 17, flex: 1 }}>
            แอปจะส่งแจ้งเตือนเมื่อใช้จ่ายถึง 80% ของงบ และเมื่อเกินงบ
            ส่งครั้งเดียวต่อระดับเตือน เพื่อไม่รบกวนคุณ
            แบนเนอร์ในหน้ารายการสามารถปิดได้ และจะกลับมาเมื่อแก้งบใหม่
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ===== Reusable card =====

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="bg-card"
      style={{
        borderRadius: 18, padding: 14,
        shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 12,
        shadowOffset: { width: 0, height: 3 }, elevation: 2,
      }}
    >
      {children}
    </View>
  );
}

// ===== Target card (daily / monthly) =====

function TargetCard({
  icon, title, subtitle,
  enabled, onToggle,
  input, onInputChange, onSave,
  presets, onPickPreset,
  currentValue,
}: {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: (next: boolean) => void;
  input: string;
  onInputChange: (v: string) => void;
  onSave: () => void;
  presets: number[];
  onPickPreset: (n: number) => void;
  currentValue: number;
}) {
  const numericInput = Math.floor(Number(input) || 0);
  const dirty = numericInput !== currentValue;

  return (
    <SectionCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: enabled ? '#E87A3D22' : '#E5DCC9',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={icon} size={20} color={enabled ? '#E87A3D' : '#9A8D80'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14.5 }}>
            {title}
          </Text>
          <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5, marginTop: 2 }}>
            {subtitle}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#E5DCC9', true: '#E87A3D' }}
          thumbColor="#E5DCC9"
        />
      </View>

      {/* Amount input */}
      <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 11.5, marginBottom: 6 }}>
        จำนวนเงิน (บาท)
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View
          style={{
            flex: 1, height: 44, borderRadius: 12,
            borderWidth: 1.5, borderColor: 'rgba(42,35,32,0.08)',
            paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6,
          }}
          className="bg-card"
        >
          <Ionicons name="cash-outline" size={16} color="#9A8D80" />
          <TextInput
            value={input}
            onChangeText={onInputChange}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9A8D80"
            style={{
              flex: 1,
              fontFamily: 'Inter_600SemiBold',
              fontSize: 16,
              color: '#2A2320',
              padding: 0,
            }}
          />
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#9A8D80' }}>฿</Text>
        </View>
        <Pressable
          onPress={onSave}
          disabled={!dirty}
          style={({ pressed }) => ({
            paddingHorizontal: 18, height: 44, borderRadius: 12,
            backgroundColor: dirty ? '#E87A3D' : 'rgba(232,122,61,0.4)',
            alignItems: 'center', justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}
          accessibilityRole="button"
          accessibilityLabel="บันทึกงบ"
        >
          <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 13, color: '#fff' }}>
            บันทึก
          </Text>
        </Pressable>
      </View>

      {/* Preset chips */}
      <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {presets.map((n) => {
          const active = currentValue === n;
          return (
            <Pressable
              key={n}
              onPress={() => onPickPreset(n)}
              style={({ pressed }) => ({
                paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
                borderWidth: 1.5,
                borderColor: active ? '#E87A3D' : 'rgba(42,35,32,0.08)',
                backgroundColor: active ? '#FFF6EE' : 'transparent',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: active ? 'IBMPlexSansThai_700Bold' : 'IBMPlexSansThai_400Regular',
                  fontSize: 12,
                  color: active ? '#C85F28' : '#6B5F55',
                }}
              >
                {formatCurrency(n)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SectionCard>
  );
}
