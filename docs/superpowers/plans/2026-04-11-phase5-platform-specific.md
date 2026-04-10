# Phase 5: Platform-Specific Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add haptics polish, Android Material adaptations, local push notifications for budget alerts, and biometric app lock.

**Architecture:** Utility-first — create notification and auth helper modules, then integrate into existing stores and screens. Haptics and ripple effects are surgical additions to existing components.

**Tech Stack:** React Native + Expo, expo-haptics, expo-notifications, expo-local-authentication, expo-navigation-bar, AsyncStorage

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `lib/utils/notifications.ts` | Local push notification helpers |
| `lib/utils/auth.ts` | Biometric authentication helpers |

### Modified files
| File | Changes |
|------|---------|
| `lib/stores/transaction-store.ts` | Trigger budget notification after addTransaction |
| `lib/stores/alert-settings-store.ts` | Add isNotificationsEnabled field |
| `app/_layout.tsx` | StatusBar theme, notification perms, biometric lock screen |
| `app/(tabs)/more.tsx` | Biometric toggle, notifications toggle |
| `app/settings/alerts.tsx` | Notifications toggle |
| `components/transaction/TransactionItem.tsx` | Add haptic + ripple |
| `components/transaction/CategoryPicker.tsx` | Add haptic |
| `components/common/WalletSelector.tsx` | Add haptic |

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
cd "/Users/macbook3lf1/web work/React_Native_Pay_Flow"
npx expo install expo-notifications expo-local-authentication expo-navigation-bar
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install expo-notifications, expo-local-authentication, expo-navigation-bar"
```

---

### Task 2: Add haptic feedback to TransactionItem, CategoryPicker, WalletSelector

**Files:**
- Modify: `components/transaction/TransactionItem.tsx`
- Modify: `components/transaction/CategoryPicker.tsx`
- Modify: `components/common/WalletSelector.tsx`

- [ ] **Step 1: Update TransactionItem.tsx**

Add import at top:
```typescript
import * as Haptics from 'expo-haptics';
```

Replace the `onPress` and `onLongPress` in the Pressable:

```typescript
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(item);
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress?.(item);
      }}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
      className="flex-row items-center py-3 px-4 bg-card border-b border-border"
    >
```

- [ ] **Step 2: Update CategoryPicker.tsx**

Add import at top:
```typescript
import * as Haptics from 'expo-haptics';
```

Update the category Pressable `onPress`:

```typescript
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelect(cat);
                }}
```

- [ ] **Step 3: Update WalletSelector.tsx**

Add import at top:
```typescript
import * as Haptics from 'expo-haptics';
```

Update the wallet Pressable `onPress`:

```typescript
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelect(wallet);
                }}
```

- [ ] **Step 4: Commit**

```bash
git add components/transaction/TransactionItem.tsx components/transaction/CategoryPicker.tsx components/common/WalletSelector.tsx
git commit -m "feat: add haptic feedback and android ripple to interactive components"
```

---

### Task 3: Create notifications utility

**Files:**
- Create: `lib/utils/notifications.ts`

- [ ] **Step 1: Create `lib/utils/notifications.ts`**

```typescript
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatCurrency } from '@/lib/utils/format';

const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled';

// Configure how notifications appear when app is in foreground
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
    trigger: null, // send immediately
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/utils/notifications.ts
git commit -m "feat: create notifications utility for budget alerts"
```

---

### Task 4: Create biometric auth utility

**Files:**
- Create: `lib/utils/auth.ts`

- [ ] **Step 1: Create `lib/utils/auth.ts`**

```typescript
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function authenticate(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'ปลดล็อก CeasFlow',
    fallbackLabel: 'ใช้รหัสผ่าน',
    cancelLabel: 'ยกเลิก',
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function getBiometricEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
  return val === 'true';
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, String(enabled));
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/utils/auth.ts
git commit -m "feat: create biometric authentication utility"
```

---

### Task 5: Integrate budget notification into transaction-store

**Files:**
- Modify: `lib/stores/transaction-store.ts`

- [ ] **Step 1: Add notification trigger after addTransaction**

Add import at top:
```typescript
import { sendBudgetAlert } from '@/lib/utils/notifications';
import { useAlertSettingsStore } from '@/lib/stores/alert-settings-store';
```

Update `addTransaction` — add after `await get().loadTransactions();`:

```typescript
    // Check budget alert
    const alertSettings = useAlertSettingsStore.getState();
    if (alertSettings.isMonthlyTargetEnabled && data.type === 'expense') {
      const monthlyExpense = get().transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      await sendBudgetAlert(monthlyExpense, alertSettings.monthlyExpenseTarget);
    }
```

- [ ] **Step 2: Commit**

```bash
git add lib/stores/transaction-store.ts
git commit -m "feat: trigger budget notification after adding expense transaction"
```

---

### Task 6: Update app/_layout.tsx — StatusBar, notifications, biometric lock

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Rewrite app/_layout.tsx**

Read the current file first. Replace the entire content:

```typescript
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

  // Biometric check
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
        <Stack.Screen name="settings/wallets" options={{ title: 'กระเป๋าเงิน', headerBackTitle: 'กลับ' }} />
        <Stack.Screen name="settings/categories" options={{ title: 'หมวดหมู่', headerBackTitle: 'กลับ' }} />
        <Stack.Screen name="settings/alerts" options={{ title: 'เป้าใช้จ่าย', headerBackTitle: 'กลับ' }} />
        <Stack.Screen name="settings/export" options={{ title: 'ส่งออก', headerBackTitle: 'กลับ' }} />
        <Stack.Screen name="settings/theme" options={{ title: 'ธีม', headerBackTitle: 'กลับ' }} />
      </Stack>
      <StatusBar style={statusBarStyle} />
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: add biometric lock screen, StatusBar theme, notification perms"
```

---

### Task 7: Add biometric and notifications toggles to more.tsx

**Files:**
- Modify: `app/(tabs)/more.tsx`

- [ ] **Step 1: Add biometric and notification toggles**

Read the current file. Add these imports at the top:

```typescript
import { isBiometricAvailable, getBiometricEnabled, setBiometricEnabled } from '@/lib/utils/auth';
import { getNotificationsEnabled, setNotificationsEnabled } from '@/lib/utils/notifications';
```

Inside `SettingsScreen()`, add state and effects (after existing state):

```typescript
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);

  useEffect(() => {
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
```

Add new settings rows in the JSX. After the API Key row, add:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/more.tsx"
git commit -m "feat: add biometric lock and push notification toggles to settings"
```

---

### Task 8: Verify TypeScript compilation

**Files:**
- All modified files

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors. Fix any that appear.

- [ ] **Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve TypeScript errors from Phase 5 changes"
```

---

### Summary

| Task | Description | Files |
|------|------------|-------|
| 1 | Install dependencies | package.json |
| 2 | Haptics + ripple on components | TransactionItem, CategoryPicker, WalletSelector |
| 3 | Notifications utility | notifications.ts (new) |
| 4 | Biometric auth utility | auth.ts (new) |
| 5 | Budget notification in transaction-store | transaction-store.ts |
| 6 | Lock screen + StatusBar theme | _layout.tsx |
| 7 | Biometric + notification toggles | more.tsx |
| 8 | TypeScript verification | all |
