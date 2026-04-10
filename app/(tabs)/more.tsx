import { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { getDb, getAllTransactions } from '@/lib/stores/db';
import { exportToCSV } from '@/lib/utils/export';
import { getApiKey, setApiKey, deleteApiKey } from '@/lib/api/ai';
import { isBiometricAvailable, getBiometricEnabled, setBiometricEnabled } from '@/lib/utils/auth';
import { getNotificationsEnabled, setNotificationsEnabled } from '@/lib/utils/notifications';
import Constants from 'expo-constants';

function SettingsRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-4 bg-card border-b border-border"
    >
      <Ionicons name={icon} size={22} color="#666" />
      <Text className="flex-1 text-foreground ml-3">{label}</Text>
      {value && <Text className="text-muted-foreground mr-1">{value}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={18} color="#ccc" />}
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View className="px-4 py-2 bg-background">
      <Text className="text-muted-foreground text-xs font-semibold uppercase">{title}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { theme, currency, updateSettings } = useSettingsStore();
  const loadTransactions = useTransactionStore(s => s.loadTransactions);

  const [apiKeyStatus, setApiKeyStatus] = useState('ตรวจสอบ...');

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);

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

  const handleExport = async () => {
    try {
      const db = getDb();
      const allTx = await getAllTransactions(db);
      if (allTx.length === 0) {
        Alert.alert('ไม่มีข้อมูล', 'ยังไม่มีรายการสำหรับส่งออก');
        return;
      }
      await exportToCSV(allTx);
    } catch {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถส่งออกข้อมูลได้');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'ล้างข้อมูลทั้งหมด',
      'รายการรายรับ-รายจ่ายทั้งหมดจะถูกลบ ดำเนินการต่อ?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ล้างข้อมูล',
          style: 'destructive',
          onPress: async () => {
            const db = getDb();
            await db.runAsync('DELETE FROM transactions');
            await loadTransactions();
            Alert.alert('สำเร็จ', 'ล้างข้อมูลเรียบร้อยแล้ว');
          },
        },
      ]
    );
  };

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-foreground text-2xl font-bold">ตั้งค่า</Text>
      </View>

      <ScrollView>
        <SectionHeader title="ทั่วไป" />
        <SettingsRow icon="color-palette-outline" label="ธีม" value={themeLabel} onPress={handleThemeToggle} />
        <SettingsRow icon="key-outline" label="Gemini API Key" value={apiKeyStatus} onPress={handleApiKey} />
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
        <SettingsRow icon="cash-outline" label="สกุลเงิน" value={`${currency} ฿`} />

        <SectionHeader title="ข้อมูล" />
        <SettingsRow icon="download-outline" label="ส่งออก Excel" onPress={handleExport} />
        <SettingsRow icon="trash-outline" label="ล้างข้อมูลทั้งหมด" onPress={handleClearData} />

        <SectionHeader title="เกี่ยวกับ" />
        <SettingsRow icon="information-circle-outline" label="เวอร์ชัน" value={appVersion} />
        <SettingsRow icon="logo-github" label="CeasFlow" value="Expense Tracker" />
      </ScrollView>
    </SafeAreaView>
  );
}
