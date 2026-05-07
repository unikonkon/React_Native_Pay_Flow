import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { IBMPlexSansThai_400Regular, IBMPlexSansThai_600SemiBold, IBMPlexSansThai_700Bold } from '@expo-google-fonts/ibm-plex-sans-thai';
import { Inter_400Regular, Inter_700Bold, Inter_900Black } from '@expo-google-fonts/inter';
import { useDatabase } from '@/lib/stores/db';
import { useCategoryStore } from '@/lib/stores/category-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useAnalysisStore } from '@/lib/stores/analysis-store';
import { useAiHistoryStore } from '@/lib/stores/ai-history-store';
import { useAlertSettingsStore } from '@/lib/stores/alert-settings-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { getThemeVars } from '@/lib/utils/theme-vars';
import { requestNotificationPermissions } from '@/lib/utils/notifications';
import { authenticate, getBiometricEnabled } from '@/lib/utils/auth';
import 'react-native-reanimated';
import '@/global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

const DARK_THEMES = ['warm-dark', 'sakura-dark', 'ocean-dark', 'forest-dark', 'midnight', 'plum-dark', 'honey', 'emerald-dark', 'paper-dark', 'mocha-dark', 'slate-dark', 'moss-dark', 'obsidian', 'graphite-dark', 'indigo-dark'];

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    IBMPlexSansThai_400Regular,
    IBMPlexSansThai_600SemiBold,
    IBMPlexSansThai_700Bold,
    Inter_400Regular,
    Inter_700Bold,
    Inter_900Black,
  });

  const { isReady } = useDatabase();
  const loadCategories = useCategoryStore(s => s.loadCategories);
  const loadSettings = useSettingsStore(s => s.loadSettings);
  const loadWallets = useWalletStore(s => s.loadWallets);
  const loadAnalysis = useAnalysisStore(s => s.loadAnalysis);
  const loadAiHistories = useAiHistoryStore(s => s.loadHistories);
  const loadAlertSettings = useAlertSettingsStore(s => s.loadAlertSettings);
  const loadTheme = useThemeStore(s => s.loadTheme);
  const loadSelectedWalletId = useTransactionStore(s => s.loadSelectedWalletId);
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
      loadSelectedWalletId();
      requestNotificationPermissions();
    }
  }, [isReady, loadCategories, loadSettings, loadWallets, loadAnalysis, loadAiHistories, loadAlertSettings, loadTheme, loadSelectedWalletId]);

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

  const ready = isReady && !checkingBiometric && fontsLoaded;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  const statusBarStyle = DARK_THEMES.includes(currentTheme) ? 'light' : 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[{ flex: 1 }, getThemeVars(currentTheme)]}>
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
          <Stack.Screen name="settings/wallets" options={{ headerShown: false }} />
          <Stack.Screen name="settings/categories" options={{ title: 'หมวดหมู่', headerBackTitle: 'กลับ' }} />
          <Stack.Screen name="settings/alerts" options={{ title: 'เป้าใช้จ่าย', headerBackTitle: 'กลับ' }} />
          <Stack.Screen name="settings/export" options={{ title: 'ส่งออก', headerBackTitle: 'กลับ' }} />
          <Stack.Screen name="settings/theme" options={{ headerShown: false }} />
          <Stack.Screen name="settings/notifications" options={{ headerShown: false }} />
          <Stack.Screen name="settings/data-transfer" options={{ title: 'ส่งออก / นำเข้าข้อมูล', headerBackTitle: 'กลับ' }} />
        </Stack>
        {isLocked && (
          <View
            className="bg-background"
            style={{
              position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
              justifyContent: 'center', alignItems: 'center',
            }}
          >
            <Ionicons name="lock-closed" size={64} color="#E87A3D" />
            <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 20, marginTop: 16 }}>MiawMoney</Text>
            <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14, marginTop: 4 }}>กรุณาปลดล็อกเพื่อใช้งาน</Text>
            <Pressable
              onPress={handleUnlock}
              className="bg-primary"
              style={{ marginTop: 24, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 }}
            >
              <Text className="text-primary-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16 }}>ปลดล็อก</Text>
            </Pressable>
          </View>
        )}
      </View>
      <StatusBar style={statusBarStyle} />
    </GestureHandlerRootView>
  );
}
