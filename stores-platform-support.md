# `lib/stores/` — Platform Support Report

ผลการตรวจสอบเวอร์ชัน iOS / Android ที่รองรับ สำหรับโค้ดทั้งหมดใน `lib/stores/`

**วันที่ตรวจสอบ:** 2026-05-08
**สโคป:** `lib/stores/*.ts` (8 ไฟล์)

---

## สรุป

| แพลตฟอร์ม | เวอร์ชันต่ำสุดที่รองรับ |
|---|---|
| **iOS** | **15.1+** |
| **Android** | **7.0+ (API 24)** |

ค่าทั้งหมดมาจาก default ของ Expo SDK 54 / React Native 0.81 — `app.json` **ไม่ได้** override `ios.deploymentTarget` หรือ `android.minSdkVersion`

---

## ไฟล์ที่ตรวจสอบ

```
lib/stores/
├── ai-history-store.ts
├── alert-settings-store.ts
├── analysis-store.ts
├── category-store.ts
├── db.ts
├── settings-store.ts
├── theme-store.ts
├── transaction-store.ts
└── wallet-store.ts
```

### Platform-checking code

```
$ grep -rn "Platform\.\|Platform.OS\|Platform.Version" lib/stores/
(no matches)
```

→ ไม่มีไฟล์ใดใน `lib/stores/` ที่มีโลจิกแยกตาม OS หรือเวอร์ชัน เวอร์ชันที่รองรับจึงถูกกำหนดโดย **dependencies** ที่ stores import เข้ามาเท่านั้น

---

## Dependency Matrix

| Store | Native Library | เวอร์ชันที่ pin ไว้ |
|---|---|---|
| `db.ts` | `expo-sqlite` | `~16.0.10` |
| `wallet-store.ts` | (ผ่าน `db.ts`) | — |
| `analysis-store.ts` | (ผ่าน `db.ts`) | — |
| `category-store.ts` | (ผ่าน `db.ts`) | — |
| `ai-history-store.ts` | (ผ่าน `db.ts`) | — |
| `transaction-store.ts` | `@react-native-async-storage/async-storage` + `db.ts` | `2.2.0` |
| `alert-settings-store.ts` | `@react-native-async-storage/async-storage` | `2.2.0` |
| `settings-store.ts` | `@react-native-async-storage/async-storage` | `2.2.0` |
| `theme-store.ts` | `@react-native-async-storage/async-storage` | `2.2.0` |

### Stack ของโปรเจกต์ (จาก `package.json`)

| Package | Version |
|---|---|
| `expo` | `~54.0.34` |
| `react-native` | `0.81.5` |
| `react` | `19.1.0` |
| `expo-sqlite` | `~16.0.10` |
| `@react-native-async-storage/async-storage` | `2.2.0` |
| `expo-secure-store` | `~15.0.8` (ใช้นอก stores) |

---

## เวอร์ชันต่ำสุดของแต่ละ Library

| Library | iOS ต่ำสุด | Android ต่ำสุด |
|---|---|---|
| **Expo SDK 54** (floor ของโปรเจกต์) | **15.1** | **API 24 (Android 7.0)** |
| React Native 0.81 | 15.1 | API 24 |
| `expo-sqlite ~16.0.10` | ตาม Expo SDK 54 | ตาม Expo SDK 54 |
| `@react-native-async-storage/async-storage 2.2.0` | 13.4 | API 21 (ถูก Expo กดขึ้นเป็น 24) |
| `expo-secure-store ~15.0.8` | ตาม Expo SDK 54 | ตาม Expo SDK 54 |

> AsyncStorage รองรับเวอร์ชันต่ำกว่าได้ในตัวเอง แต่ floor ที่แท้จริงของแอปคือค่าของ Expo SDK ซึ่งสูงกว่า

---

## หลักฐาน

### `app.json` (เฉพาะส่วน iOS / Android)

```jsonc
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.ceasflow.app",
  "infoPlist": { /* ... */ }
  // ❌ ไม่มี deploymentTarget override
},
"android": {
  "package": "com.ceasflow.app",
  "versionCode": 1,
  "permissions": [ /* ... */ ]
  // ❌ ไม่มี minSdkVersion override
}
```

### Expo SDK 54 defaults

- **iOS deployment target:** 15.1 (Expo SDK 54 ตัด iOS 14 ทิ้งแล้ว)
- **Android `minSdkVersion`:** 24
- **Android `targetSdkVersion`:** 35

---

## หมายเหตุสำคัญ

### 1. New Architecture เปิดอยู่

`app.json` ตั้ง `"newArchEnabled": true` — `expo-sqlite` ทำงานผ่าน **JSI (TurboModule)** บนทุกแพลตฟอร์ม ไม่ใช่ legacy bridge

ผลกระทบ:
- iOS / Android ที่รองรับ ยังคงเป็น 15.1 / API 24
- แต่ stack pressure จาก JSI calls สูงกว่าบนอุปกรณ์ที่ RAM/stack จำกัด — เป็นที่มาของบั๊ก first-launch บน Android ที่เพิ่งแก้ไปใน [`db.ts`](../lib/stores/db.ts) และ [`transaction-store.ts`](../lib/stores/transaction-store.ts)

### 2. ถ้าจะลด minSdk ต่ำกว่านี้ (เช่น Android 5–6)

ต้อง:
1. เพิ่ม plugin `expo-build-properties` ใน `app.json` เพื่อ override `minSdkVersion`
2. ทดสอบว่า `expo-sqlite` + JSI + Hermes ยังทำงานได้บนเวอร์ชันนั้น
3. เลี่ยงการใช้ฟีเจอร์ที่อาศัย API ใหม่ (เช่น edge-to-edge ของ Android 11+)

**ไม่แนะนำ** กับ stack ปัจจุบัน — Expo SDK 54 + New Arch ออกแบบมาสำหรับ API 24+ เป็นหลัก

### 3. ฟีเจอร์ที่อาจมีพฤติกรรมต่างกันในแต่ละเวอร์ชัน OS

แม้ stores ไม่เช็ค Platform แต่ utility ภายนอก stores มีบางส่วนที่ขึ้นกับเวอร์ชัน:
- **`expo-secure-store`** (auth) — ใช้ Keychain (iOS) / Keystore (Android) ทำงานทุกเวอร์ชันที่รองรับ
- **`expo-haptics`** — Android < 8 ไม่มี haptic feedback ละเอียด
- **`expo-notifications`** — Android 13+ ต้องขอ runtime permission `POST_NOTIFICATIONS`

ส่วนเหล่านี้อยู่ **นอก** `lib/stores/` จึงไม่กระทบสรุปด้านบน

---

## คำตอบสั้น

> `lib/stores/` รองรับ **iOS 15.1+** และ **Android 7.0+ (API 24+)** ตามค่าดีฟอลต์ของ Expo SDK 54 ไม่มีโค้ดใน stores ที่บังคับเวอร์ชันสูงขึ้นหรือต่ำลงด้วยตัวเอง
