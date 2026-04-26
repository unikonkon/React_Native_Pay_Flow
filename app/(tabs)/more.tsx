import { AddWalletModal } from '@/components/wallet/AddWalletModal';
import { deleteApiKey, getApiKey, setApiKey } from '@/lib/api/ai';
import { getBgMascotSource } from '@/lib/constants/mascots';
import { useAlertSettingsStore } from '@/lib/stores/alert-settings-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { getBiometricEnabled, isBiometricAvailable, setBiometricEnabled } from '@/lib/utils/auth';
import { getNotificationsEnabled } from '@/lib/utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const THEME_LABELS: Record<string, string> = {
  'warm': 'อบอุ่น',
  'warm-dark': 'อบอุ่น (มืด)',
  'sakura': 'ซากุระ',
  'sakura-dark': 'ซากุระ (มืด)',
  'ocean': 'มหาสมุทร',
  'ocean-dark': 'มหาสมุทร (มืด)',
  'forest': 'ป่าไม้',
  'forest-dark': 'ป่าไม้ (มืด)',
  'midnight-light': 'เที่ยงคืน (สว่าง)',
  'midnight': 'เที่ยงคืน (มืด)',
  'plum': 'ลีลัค',
  'plum-dark': 'ลีลัค (มืด)',
  'honey-light': 'น้ำผึ้ง (สว่าง)',
  'honey': 'น้ำผึ้ง (มืด)',
  'emerald': 'มรกต',
  'emerald-dark': 'มรกต (มืด)',
};

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={last ? '' : 'border-b border-border'}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}
    >
      <View style={{
        width: 30, height: 30, borderRadius: 9,
        backgroundColor: '#E87A3D22',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={16} color="#E87A3D" />
      </View>
      <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14.5, flex: 1 }}>{label}</Text>
      {value !== undefined && (
        <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }}>{value}</Text>
      )}
      <Ionicons name="chevron-forward" size={12} color="#A39685" />
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
      <Text className="text-muted-foreground" style={{
        fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12,
        paddingHorizontal: 6, paddingBottom: 6, letterSpacing: 0.3,
      }}>{title}</Text>
      <View className="bg-card" style={{
        borderRadius: 20, overflow: 'hidden',
        shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 }, elevation: 2,
      }}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const currentTheme = useThemeStore(s => s.currentTheme);
  const bgMascotId = useThemeStore(s => s.currentBgMascot);
  const mascotRun = getBgMascotSource(bgMascotId);

  const [apiKeyStatus, setApiKeyStatus] = useState('ตรวจสอบ...');

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [addWalletVisible, setAddWalletVisible] = useState(false);

  const isDailyTargetEnabled = useAlertSettingsStore(s => s.isDailyTargetEnabled);
  const isMonthlyTargetEnabled = useAlertSettingsStore(s => s.isMonthlyTargetEnabled);

  useEffect(() => {
    getApiKey().then(key => {
      setApiKeyStatus(key ? `ตั้งค่าแล้ว (****${key.slice(-4)})` : 'ยังไม่ได้ตั้งค่า');
    });
    isBiometricAvailable().then(setBiometricAvailable);
    getBiometricEnabled().then(setBiometricEnabledState);
  }, []);

  // Re-sync push enabled state every time this tab regains focus
  // (so toggling in /settings/notifications reflects here when user navigates back)
  useFocusEffect(
    useCallback(() => {
      getNotificationsEnabled().then(setNotificationsEnabledState);
    }, [])
  );

  const notificationStatus = (() => {
    const targets = [
      isDailyTargetEnabled ? 'รายวัน' : null,
      isMonthlyTargetEnabled ? 'รายเดือน' : null,
    ].filter(Boolean) as string[];

    if (targets.length === 0) {
      return notificationsEnabled ? 'เปิด · ยังไม่ตั้งงบ' : 'ปิดอยู่';
    }

    const prefix = notificationsEnabled ? 'Push · ' : 'ในแอป · ';
    return prefix + targets.join(' · ');
  })();

  const handleBiometricToggle = async () => {
    const newValue = !biometricEnabled;
    await setBiometricEnabled(newValue);
    setBiometricEnabledState(newValue);
  };


  const handleApiKey = () => {
    Alert.prompt(
      'Gemini API Key',
      'ใส่ API Key จาก Google AI Studio',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ลบ Key', style: 'destructive', onPress: async () => {
          await deleteApiKey();
          setApiKeyStatus('ยังไม่ได้ตั้งค่า');
        }},
        { text: 'บันทึก', onPress: async (key?: string) => {
          if (key?.trim()) {
            await setApiKey(key.trim());
            setApiKeyStatus(`ตั้งค่าแล้ว (****${key.trim().slice(-4)})`);
          }
        }},
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const themeLabel = THEME_LABELS[currentTheme] ?? 'อบอุ่น';

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Image source={mascotRun} style={{ width: 40, height: 40 }} resizeMode="contain" />
        <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 26, letterSpacing: -0.4 }}>ตั้งค่า</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Section title="ทั่วไป">
          <SettingsRow icon="color-palette-outline" label="ธีม" value={themeLabel} onPress={() => router.push('/settings/theme')} />
          <SettingsRow icon="key-outline" label="Gemini API Key" value={apiKeyStatus} onPress={handleApiKey} />
          <SettingsRow icon="sparkles-outline" label="AI วิเคราะห์" value={apiKeyStatus.startsWith('ตั้งค่าแล้ว') ? 'พร้อมใช้งาน' : 'ยังไม่ได้ตั้งค่า'} />
          {biometricAvailable && (
            <SettingsRow
              icon="finger-print-outline"
              label="ล็อกด้วย Face ID/ลายนิ้วมือ"
              value={biometricEnabled ? 'เปิด' : 'ปิด'}
              onPress={handleBiometricToggle}
            />
          )}
          <SettingsRow
            icon="notifications-outline"
            label="แจ้งเตือน Push"
            value={notificationStatus}
            onPress={() => router.push('/settings/notifications')}
          />
          {/* <SettingsRow icon="cash-outline" label="สกุลเงิน" value={`${currency} ฿`} last /> */}
        </Section>

        <Section title="กระเป๋าเงิน">
          <SettingsRow
            icon="add-circle-outline"
            label="สร้างกระเป๋าใหม่"
            onPress={() => setAddWalletVisible(true)}
          />
          <SettingsRow
            icon="wallet-outline"
            label="จัดการกระเป๋าเงิน"
            onPress={() => router.push('/settings/wallets')}
            last
          />
        </Section>

        <Section title="เกี่ยวกับ">
          <SettingsRow icon="information-circle-outline" label="เวอร์ชัน" value={appVersion} />
          <SettingsRow icon="paw-outline" label="แมวมันนี่" value="MaewMoney" last />
        </Section>

        {/* Footer */}
        <Text className="text-muted-foreground" style={{
          fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11,
          textAlign: 'center', marginTop: 20,
        }}>
          แมวมันนี่ v{appVersion} · ทำด้วย <Text style={{ color: '#E87A3D' }}>♥</Text> โดย Faraday
        </Text>
      </ScrollView>

      <AddWalletModal
        visible={addWalletVisible}
        onClose={() => setAddWalletVisible(false)}
      />
    </SafeAreaView>
  );
}
