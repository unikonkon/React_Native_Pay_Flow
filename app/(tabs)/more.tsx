import { AddWalletModal } from '@/components/wallet/AddWalletModal';
import { deleteApiKey, getApiKey, setApiKey } from '@/lib/api/ai';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { getBiometricEnabled, isBiometricAvailable, setBiometricEnabled } from '@/lib/utils/auth';
import { getNotificationsEnabled, setNotificationsEnabled } from '@/lib/utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const mascotRun = require('@/assets/mascot-run.png');

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
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: 'rgba(42,35,32,0.08)',
      }}
    >
      <View style={{
        width: 30, height: 30, borderRadius: 9,
        backgroundColor: '#FCE8D4',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={16} color="#C85F28" />
      </View>
      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14.5, color: '#2A2320', flex: 1 }}>{label}</Text>
      {value !== undefined && (
        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#9A8D80' }}>{value}</Text>
      )}
      <Ionicons name="chevron-forward" size={12} color="#9A8D80" />
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
      <Text style={{
        fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#9A8D80',
        paddingHorizontal: 6, paddingBottom: 6, letterSpacing: 0.3,
      }}>{title}</Text>
      <View style={{
        backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
        shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 }, elevation: 2,
      }}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { theme, currency, updateSettings } = useSettingsStore();

  const [apiKeyStatus, setApiKeyStatus] = useState('ตรวจสอบ...');

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [addWalletVisible, setAddWalletVisible] = useState(false);

  useEffect(() => {
    getApiKey().then(key => {
      setApiKeyStatus(key ? `ตั้งค่าแล้ว (****${key.slice(-4)})` : 'ยังไม่ได้ตั้งค่า');
    });
    isBiometricAvailable().then(setBiometricAvailable);
    getBiometricEnabled().then(setBiometricEnabledState);
    getNotificationsEnabled().then(setNotificationsEnabledState);
  }, []);

  const handleBiometricToggle = async () => {
    const newValue = !biometricEnabled;
    await setBiometricEnabled(newValue);
    setBiometricEnabledState(newValue);
  };

  const handleNotificationsToggle = async () => {
    const newValue = !notificationsEnabled;
    await setNotificationsEnabled(newValue);
    setNotificationsEnabledState(newValue);
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

  const handleThemeToggle = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    updateSettings({ theme: next });
  };

  const themeLabel = theme === 'light' ? 'สว่าง' : theme === 'dark' ? 'มืด' : 'ตามระบบ';

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Image source={mascotRun} style={{ width: 40, height: 40 }} resizeMode="contain" />
        <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 26, letterSpacing: -0.4, color: '#2A2320' }}>ตั้งค่า</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Section title="ทั่วไป">
          <SettingsRow icon="color-palette-outline" label="ธีม" value={themeLabel} onPress={handleThemeToggle} />
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
            value={notificationsEnabled ? 'เปิด' : 'ปิด'}
            onPress={handleNotificationsToggle}
          />
          <SettingsRow icon="cash-outline" label="สกุลเงิน" value={`${currency} ฿`} last />
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
        <Text style={{
          fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11,
          color: '#9A8D80', textAlign: 'center', marginTop: 20,
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
