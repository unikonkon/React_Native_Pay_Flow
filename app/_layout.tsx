import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useDatabase } from '@/hooks/useDatabase';
import { useCategoryStore } from '@/stores/categoryStore';
import { useSettingsStore } from '@/stores/settingsStore';
import 'react-native-reanimated';
import '@/global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { isReady } = useDatabase();
  const loadCategories = useCategoryStore(s => s.loadCategories);
  const loadSettings = useSettingsStore(s => s.loadSettings);

  useEffect(() => {
    if (isReady) {
      loadCategories();
      loadSettings();
    }
  }, [isReady, loadCategories, loadSettings]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
