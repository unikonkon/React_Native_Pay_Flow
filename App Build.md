# 📱 CeasFlow — คู่มือ Build APK สำหรับ Android

แอป `CeasFlow` (Expo SDK 54) รองรับการ build ไฟล์ `.apk` เพื่อติดตั้งบนมือถือ Android ได้ 3 วิธี
เลือกวิธีที่เหมาะกับเครื่องของคุณ

- **วิธีที่ 1 — EAS Cloud Build** (ง่ายที่สุด ไม่ต้องติดตั้ง Android SDK)
- **วิธีที่ 2 — EAS Local Build** (build บนเครื่องตัวเอง ต้องมี Android SDK + JDK)
- **วิธีที่ 3 — Gradle โดยตรง** (หลัง `expo prebuild`)

---

## ✅ ข้อมูลแอป

| | |
|---|---|
| ชื่อแอป | CeasFlow |
| Package | `com.ceasflow.app` |
| Version | 1.0.0 (versionCode: 1) |
| Expo SDK | 54 |
| React Native | 0.81.5 |
| New Architecture | เปิดใช้งาน |

---

## 🚀 วิธีที่ 1 — EAS Cloud Build (แนะนำ)

Build บน Cloud ของ Expo — ได้ลิงก์ดาวน์โหลด `.apk` ผ่านเบราว์เซอร์

### ขั้นตอน

```bash
# 1) ติดตั้ง EAS CLI (ครั้งเดียว)
npm install -g eas-cli

# 2) Login เข้า Expo account
eas login

# 3) ตั้งค่าโปรเจกต์ (ครั้งแรกเท่านั้น — จะสร้าง projectId ใน app.json)
eas init

# 4) สั่ง build APK (preview profile → ไฟล์ .apk)
npm run build:android:apk
# หรือ
eas build --platform android --profile preview
```

เมื่อเสร็จแล้ว EAS จะให้ **ลิงก์ดาวน์โหลด `.apk`** — เปิดลิงก์นั้นบนมือถือ Android แล้วกด Install ได้เลย

### Profile ที่ตั้งไว้ใน `eas.json`

| Profile | Build Type | ใช้เมื่อ |
|---|---|---|
| `development` | apk | สำหรับ dev client (ใช้ร่วมกับ `expo start --dev-client`) |
| `preview` | apk | **แจกทดสอบ / ติดตั้งบนมือถือ** |
| `production` | aab | อัปโหลด Google Play |
| `production-apk` | apk | Production build แบบไฟล์ apk |

---

## 🏗 วิธีที่ 2 — EAS Local Build

build บนเครื่องตัวเอง (ไม่ต้องใช้ quota cloud)

### ติดตั้ง Prerequisites (macOS)

```bash
# JDK 17
brew install --cask zulu@17

# Android Studio + SDK
brew install --cask android-studio
# เปิด Android Studio → SDK Manager → ติดตั้ง:
#   - Android SDK Platform 35
#   - Android SDK Build-Tools 35.0.0
#   - NDK 27.x

# ตั้ง environment variables ใน ~/.zshrc
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator' >> ~/.zshrc
source ~/.zshrc
```

### สั่ง build

```bash
npm run build:android:local
# หรือ
eas build --platform android --profile preview --local
```

ไฟล์ `.apk` จะถูกวางใน root โปรเจกต์ (ชื่อเช่น `build-xxxxx.apk`)

---

## 🔧 วิธีที่ 3 — Gradle โดยตรง (Bare Workflow)

เหมาะถ้าต้องการ debug native หรือเพิ่ม native code เอง

```bash
# 1) สร้าง android/ directory จาก Expo config
npm run prebuild:android

# 2) Build release APK ด้วย Gradle
npm run build:android:gradle
```

ไฟล์ APK จะอยู่ที่:
```
android/app/build/outputs/apk/release/app-release.apk
```

### ⚠ Signing APK สำหรับ production

Gradle release build ต้องใช้ keystore ของตัวเอง:

```bash
# สร้าง keystore (ครั้งเดียว)
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore ceasflow-release.keystore \
  -alias ceasflow-key \
  -keyalg RSA -keysize 2048 -validity 10000
```

แล้วใส่ใน `android/gradle.properties`:

```
CEASFLOW_UPLOAD_STORE_FILE=ceasflow-release.keystore
CEASFLOW_UPLOAD_KEY_ALIAS=ceasflow-key
CEASFLOW_UPLOAD_STORE_PASSWORD=xxxxx
CEASFLOW_UPLOAD_KEY_PASSWORD=xxxxx
```

> 💡 ถ้าใช้ EAS Build ไม่ต้องสร้าง keystore เอง — EAS จัดการให้

---

## 📲 ติดตั้ง APK บนมือถือ Android

1. คัดลอกไฟล์ `.apk` ไปที่มือถือ (ผ่านสาย USB, Google Drive, LINE, ฯลฯ)
2. เปิดแอป **ไฟล์** บนมือถือ → แตะไฟล์ `.apk`
3. ถ้าขึ้น "ไม่อนุญาตให้ติดตั้งจากแหล่งที่ไม่รู้จัก" → ไปที่
   **ตั้งค่า → แอป → เข้าถึงพิเศษ → ติดตั้งแอปที่ไม่รู้จัก** → อนุญาต
4. กด **Install** → เสร็จ

### ติดตั้งผ่าน ADB (สาย USB)

```bash
# เปิด USB Debugging บนมือถือ (Developer Options)
adb install ./path/to/app-release.apk
```

---

## 🔄 เพิ่ม Version ก่อน Build ใหม่

แก้ใน `app.json`:

```json
"version": "1.0.1",
"android": {
  "versionCode": 2
}
```

> `versionCode` **ต้องเพิ่มขึ้นทุกครั้ง** (integer) ถ้าจะอัปโหลด Google Play
> หรือให้ EAS จัดการอัตโนมัติ — profile `production-apk` / `production` มี `autoIncrement: true`

---

## 🛠 คำสั่ง npm ที่ตั้งไว้แล้ว

| Command | ทำอะไร |
|---|---|
| `npm run prebuild:android` | สร้าง folder `android/` จาก Expo config |
| `npm run build:android:apk` | EAS cloud build → preview APK |
| `npm run build:android:apk:prod` | EAS cloud build → production APK |
| `npm run build:android:local` | EAS local build → preview APK |
| `npm run build:android:gradle` | Gradle assembleRelease (ต้อง prebuild ก่อน) |

---

## 🐛 ปัญหาที่พบบ่อย

### "Keystore was tampered with, or password was incorrect"
ลบ keystore เก่าแล้ว `eas credentials` → reset

### Build fail: out of memory
เพิ่ม heap ใน `android/gradle.properties`:
```
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### `expo prebuild` ลบไฟล์ที่แก้ native ไว้
ใช้ `--clean` เฉพาะตอนแรก — หลังแก้ native แล้ว อย่ารัน `--clean` ซ้ำ
หรือ commit folder `android/` เข้า git

### `Failed to apply patch for package @types/react`
patch-package fail เพราะ `@types/react` ขึ้น version — ต้อง regenerate:
```bash
# แก้ node_modules/@types/react/index.d.ts ตาม patch เดิม (แล้ว)
rm patches/@types+react+*.patch
npx patch-package @types/react
```
> โปรเจกต์นี้ regenerate แล้วเป็น `patches/@types+react+19.2.14.patch`

### `Command must be re-run to pick up new updates configuration`
หลัง EAS ติดตั้ง `expo-updates` อัตโนมัติ → สั่ง build อีกครั้ง:
```bash
npm run build:android:apk
```

### Expo Go ไม่รองรับฟีเจอร์บางอย่าง
โปรเจกต์นี้ใช้ `expo-notifications`, `expo-sqlite` ต้องใช้ **development build** หรือ **APK build** (ไม่รองรับ Expo Go เต็มตัว)

---

## 📦 ขั้นตอนสรุปสำหรับ build ครั้งแรก

```bash
# 1) ติดตั้ง EAS CLI
npm install -g eas-cli

# 2) Login
eas login

# 3) Init (สร้าง projectId)
eas init

# 4) Build APK
npm run build:android:apk

# 5) รอ ~10-15 นาที → เปิดลิงก์ดาวน์โหลด → ติดตั้งบนมือถือ
```

🎉 เสร็จสิ้น!
