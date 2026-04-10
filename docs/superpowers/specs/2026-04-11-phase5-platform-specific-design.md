# Phase 5: Platform-Specific — Design Spec

**Date:** 2026-04-11
**Scope:** Haptics polish, Android Material adaptations, Push notifications (budget alerts), Biometric lock
**Prerequisite:** Phase 4 complete
**Excluded:** Widget (requires native Swift/Kotlin code)

---

## 1. Haptics Polish

Add haptic feedback to interactive elements that currently lack it:

- `TransactionItem.tsx` — light impact on press, medium impact on long press
- `CategoryPicker.tsx` — selection haptic when choosing a category
- `WalletSelector.tsx` — selection haptic when choosing a wallet
- Delete confirmations — warning notification haptic when confirming destructive actions

Uses existing `expo-haptics` (already installed). Check on iOS only (`process.env.EXPO_OS === 'ios'`).

---

## 2. Android Material Adaptations

### 2.1 StatusBar

In `app/_layout.tsx`, set StatusBar style based on current theme:
- Light themes → `style="dark"` (dark text on light background)
- Dark theme → `style="light"` (light text on dark background)

### 2.2 Navigation Bar Color

Set Android navigation bar color to match theme background using `expo-navigation-bar`:
```typescript
NavigationBar.setBackgroundColorAsync(bgColor);
```

### 2.3 Ripple Effects

Add `android_ripple={{ color: 'rgba(0,0,0,0.1)' }}` to key Pressable components:
- TransactionItem
- SettingsRow in more.tsx
- Tab buttons
- Wallet/Category items in settings

---

## 3. Push Notifications (Budget Alerts)

### 3.1 Notification Helpers (`lib/utils/notifications.ts`)

```typescript
export async function requestNotificationPermissions(): Promise<boolean>
export async function sendBudgetAlert(expense: number, target: number): Promise<void>
export async function cancelAllNotifications(): Promise<void>
```

- `requestNotificationPermissions` — requests permissions via `expo-notifications`
- `sendBudgetAlert` — sends a local notification immediately when expense crosses threshold
  - At 80%: "ใกล้ถึงเป้า — ใช้จ่ายแล้ว XX% ของเป้า ฿XX,XXX"
  - At 100%: "เกินเป้า! — ใช้จ่ายเกินเป้า ฿XX,XXX แล้ว"
- Only sends if notifications are enabled in alert settings

### 3.2 Integration

- `transaction-store.ts` — after `addTransaction()`, check monthly expense vs target → call `sendBudgetAlert()` if threshold crossed
- `app/_layout.tsx` — call `requestNotificationPermissions()` on boot
- `app/settings/alerts.tsx` — add toggle "แจ้งเตือน Push Notification" with AsyncStorage key `'notifications_enabled'`

### 3.3 Alert Settings Extension

Add `isNotificationsEnabled: boolean` to AlertSettings store. When enabled, budget threshold crossings trigger local push notifications.

---

## 4. Biometric Lock

### 4.1 Auth Helpers (`lib/utils/auth.ts`)

```typescript
export async function isBiometricAvailable(): Promise<boolean>
export async function authenticate(): Promise<boolean>
export async function getBiometricEnabled(): Promise<boolean>
export async function setBiometricEnabled(enabled: boolean): Promise<void>
```

- Uses `expo-local-authentication`
- `isBiometricAvailable` checks hardware support
- `authenticate` prompts Face ID / fingerprint with Thai message
- `getBiometricEnabled` / `setBiometricEnabled` use AsyncStorage key `'biometric_enabled'`

### 4.2 Lock Screen in `app/_layout.tsx`

- On app start, if biometric is enabled → show lock screen
- Lock screen: app icon/name + "ปลดล็อก" button
- Button triggers `authenticate()` → success → show app / fail → stay on lock
- Auto-trigger authenticate on mount (so user sees Face ID immediately)

### 4.3 Settings Toggle

Add to `app/(tabs)/more.tsx`:
- Row "ล็อกด้วย Face ID/ลายนิ้วมือ"
- Toggle on → check if biometric available → enable
- Toggle off → disable
- Show row only if `isBiometricAvailable()` returns true

---

## 5. Files Summary

| Action | File | Description |
|--------|------|-------------|
| Create | `lib/utils/notifications.ts` | Local push notification helpers |
| Create | `lib/utils/auth.ts` | Biometric authentication helpers |
| Modify | `lib/stores/transaction-store.ts` | Trigger budget alert after addTransaction |
| Modify | `lib/stores/alert-settings-store.ts` | Add isNotificationsEnabled field |
| Modify | `app/_layout.tsx` | StatusBar theme, notification perms, biometric lock |
| Modify | `app/(tabs)/more.tsx` | Biometric toggle, notification toggle |
| Modify | `app/settings/alerts.tsx` | Notification toggle |
| Modify | `components/transaction/TransactionItem.tsx` | Add haptic feedback |
| Modify | `components/transaction/CategoryPicker.tsx` | Add haptic feedback |
| Modify | `components/common/WalletSelector.tsx` | Add haptic feedback |

---

## 6. Dependencies

- `expo-notifications` — local push notifications
- `expo-local-authentication` — Face ID / fingerprint
- `expo-navigation-bar` — Android navigation bar color (optional, Android only)
