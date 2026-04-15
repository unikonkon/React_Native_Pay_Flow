import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '@/lib/stores/db';
import { useCategoryStore } from '@/lib/stores/category-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useAnalysisStore } from '@/lib/stores/analysis-store';
import { useAiHistoryStore } from '@/lib/stores/ai-history-store';
import { useAlertSettingsStore } from '@/lib/stores/alert-settings-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { requestNotificationPermissions } from '@/lib/utils/notifications';
import { authenticate, getBiometricEnabled } from '@/lib/utils/auth';
import 'react-native-reanimated';
import '@/global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

const DARK_THEMES = ['dark'];

export default function RootLayout() {
  const { isReady } = useDatabase();
  const loadCategories = useCategoryStore(s => s.loadCategories);
  const loadSettings = useSettingsStore(s => s.loadSettings);
  const loadWallets = useWalletStore(s => s.loadWallets);
  const loadAnalysis = useAnalysisStore(s => s.loadAnalysis);
  const loadAiHistories = useAiHistoryStore(s => s.loadHistories);
  const loadAlertSettings = useAlertSettingsStore(s => s.loadAlertSettings);
  const loadTheme = useThemeStore(s => s.loadTheme);
  const currentTheme = useThemeStore(s => s.currentTheme);

  const [isLocked, setIsLocked] = useState(true);
  const [checkingBiometric, setCheckingBiometric] = useState(true);

  useEffect(() => {
    if (isReady) {
      loadCategories();
      loadSettings();
      loadWallets();
      loadAnalysis();
      loadAiHistories();
      loadAlertSettings();
      loadTheme();
      requestNotificationPermissions();
    }
  }, [isReady, loadCategories, loadSettings, loadWallets, loadAnalysis, loadAiHistories, loadAlertSettings, loadTheme]);

  useEffect(() => {
    if (!isReady) return;
    const checkBiometric = async () => {
      const enabled = await getBiometricEnabled();
      if (!enabled) {
        setIsLocked(false);
        setCheckingBiometric(false);
        return;
      }
      setCheckingBiometric(false);
      const success = await authenticate();
      if (success) setIsLocked(false);
    };
    checkBiometric();
  }, [isReady]);

  const handleUnlock = useCallback(async () => {
    const success = await authenticate();
    if (success) setIsLocked(false);
  }, []);

  if (!isReady || checkingBiometric) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isLocked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <Ionicons name="lock-closed" size={64} color="#0891b2" />
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 16, color: '#333' }}>CeasFlow</Text>
        <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>กรุณาปลดล็อกเพื่อใช้งาน</Text>
        <Pressable
          onPress={handleUnlock}
          style={{ marginTop: 24, paddingHorizontal: 32, paddingVertical: 12, backgroundColor: '#0891b2', borderRadius: 12 }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>ปลดล็อก</Text>
        </Pressable>
      </View>
    );
  }

  const statusBarStyle = DARK_THEMES.includes(currentTheme) ? 'light' : 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }} className={currentTheme !== 'light' ? currentTheme : undefined}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="transaction/add"
          options={{
            presentation: 'transparentModal',
            headerShown: false,
            animation: 'none',
          }}
        />
        <Stack.Screen name="settings/wallets" options={{ title: 'กระเป๋าเงิน', headerBackTitle: 'กลับ' }} />
        <Stack.Screen name="settings/categories" options={{ title: 'หมวดหมู่', headerBackTitle: 'กลับ' }} />
        <Stack.Screen name="settings/alerts" options={{ title: 'เป้าใช้จ่าย', headerBackTitle: 'กลับ' }} />
        <Stack.Screen name="settings/export" options={{ title: 'ส่งออก', headerBackTitle: 'กลับ' }} />
        <Stack.Screen name="settings/theme" options={{ title: 'ธีม', headerBackTitle: 'กลับ' }} />
        <Stack.Screen name="settings/data-transfer" options={{ title: 'ส่งออก / นำเข้าข้อมูล', headerBackTitle: 'กลับ' }} />
      </Stack>
      <StatusBar style={statusBarStyle} />
    </GestureHandlerRootView>
  );
}
