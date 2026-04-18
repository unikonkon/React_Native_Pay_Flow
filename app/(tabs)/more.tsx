import { MiawMini } from '@/assets/svg';
import { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { getApiKey, setApiKey, deleteApiKey } from '@/lib/api/ai';
import { isBiometricAvailable, getBiometricEnabled, setBiometricEnabled } from '@/lib/utils/auth';
import { getNotificationsEnabled, setNotificationsEnabled } from '@/lib/utils/notifications';
import { AddWalletModal } from '@/components/wallet/AddWalletModal';
import Constants from 'expo-constants';

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
      className="flex-row items-center"
      style={{
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: '#EDE4D3',
      }}
    >
      <View style={{ width: 22, alignItems: 'center' }}>
        <Ionicons name={icon} size={20} color="#6B5F52" />
      </View>
      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 15 }} className="flex-1 text-foreground">{label}</Text>
      {value !== undefined && <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14 }} className="text-muted-foreground">{value}</Text>}
      <Ionicons name="chevron-forward" size={14} color="#A39685" />
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }} className="text-muted-foreground">{title}</Text>
      </View>
      <View className="bg-card" style={{ marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' }}>
        {children}
      </View>
    </>
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
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center" style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 10 }}>
        <MiawMini size={30} />
        <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 22 }} className="text-foreground">ตั้งค่า</Text>
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
      </ScrollView>

      <AddWalletModal
        visible={addWalletVisible}
        onClose={() => setAddWalletVisible(false)}
      />
    </SafeAreaView>
  );
}
