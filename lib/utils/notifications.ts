import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatCurrency, getToday } from '@/lib/utils/format';

const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled';
const LAST_DAILY_ALERT_KEY = 'last_daily_alert';
const LAST_MONTHLY_ALERT_KEY = 'last_monthly_alert';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
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

type AlertTier = 'warn' | 'danger' | null;

function tierForPercent(p: number): AlertTier {
  if (p >= 100) return 'danger';
  if (p >= 80) return 'warn';
  return null;
}

/**
 * ส่ง notification ครั้งเดียวต่อ tier ต่อ period — กันไม่ให้ยิงซ้ำทุกครั้งที่บันทึกรายการ
 */
async function sendAlertOnce(
  storageKey: string,
  periodId: string,
  expense: number,
  target: number,
  titleWarn: string,
  titleDanger: string,
  bodyPrefix: string,
): Promise<void> {
  const enabled = await getNotificationsEnabled();
  if (!enabled || target <= 0) return;

  const percent = Math.round((expense / target) * 100);
  const tier = tierForPercent(percent);
  if (!tier) return;

  const sentKey = `${periodId}:${tier}`;
  const lastSent = await AsyncStorage.getItem(storageKey);
  if (lastSent === sentKey) return;

  const isDanger = tier === 'danger';
  const body = isDanger
    ? `${bodyPrefix}แล้ว ${formatCurrency(expense)} เกินเป้า ${formatCurrency(target)}`
    : `${bodyPrefix}แล้ว ${formatCurrency(expense)} จากเป้า ${formatCurrency(target)} (${percent}%)`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: isDanger ? titleDanger : titleWarn,
      body,
      sound: true,
    },
    trigger: null,
  });

  await AsyncStorage.setItem(storageKey, sentKey);
}

export async function sendBudgetAlert(expense: number, target: number, monthId?: string): Promise<void> {
  const period = monthId ?? new Date().toISOString().slice(0, 7);
  await sendAlertOnce(
    LAST_MONTHLY_ALERT_KEY,
    period,
    expense,
    target,
    'ใกล้ถึงเป้าใช้จ่ายเดือนนี้',
    'เกินเป้าใช้จ่ายเดือนนี้!',
    'เดือนนี้ใช้จ่าย',
  );
}

export async function sendDailyBudgetAlert(expense: number, target: number, dayId?: string): Promise<void> {
  const period = dayId ?? getToday();
  await sendAlertOnce(
    LAST_DAILY_ALERT_KEY,
    period,
    expense,
    target,
    'ใกล้ถึงเป้าใช้จ่ายวันนี้',
    'เกินเป้าใช้จ่ายวันนี้!',
    'วันนี้ใช้จ่าย',
  );
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
