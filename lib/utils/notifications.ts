import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatCurrency } from '@/lib/utils/format';

const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getNotificationsEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  return val === 'true';
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(enabled));
}

export async function sendBudgetAlert(expense: number, target: number): Promise<void> {
  const enabled = await getNotificationsEnabled();
  if (!enabled || target <= 0) return;

  const percentage = Math.round((expense / target) * 100);
  if (percentage < 80) return;

  const isDanger = percentage >= 100;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: isDanger ? 'เกินเป้าใช้จ่าย!' : 'ใกล้ถึงเป้าใช้จ่าย',
      body: isDanger
        ? `ใช้จ่ายแล้ว ${formatCurrency(expense)} เกินเป้า ${formatCurrency(target)}`
        : `ใช้จ่ายแล้ว ${formatCurrency(expense)} จากเป้า ${formatCurrency(target)} (${percentage}%)`,
      sound: true,
    },
    trigger: null,
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
