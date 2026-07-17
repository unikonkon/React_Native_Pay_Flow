# Money Maow (แมวมันนี่) 🐱💰

แอปบันทึกรายรับ-รายจ่ายบนมือถือ สร้างด้วย [Expo](https://expo.dev) + React Native รองรับ Android / iOS / Web

## เทคโนโลยีหลัก

- **Expo SDK 54** + **React Native 0.81** + **React 19** + **TypeScript**
- **Expo Router** — file-based routing (Bottom Tabs)
- **NativeWind (Tailwind CSS)** — จัดการสไตล์
- **Zustand** — state management
- **expo-sqlite** — ฐานข้อมูลในเครื่อง
- **Google Generative AI (Gemini)** — วิเคราะห์การเงินด้วย AI
- **react-native-chart-kit / react-native-svg** — กราฟและแผนภูมิ
- **ExcelJS** — นำเข้า/ส่งออกข้อมูล

## ฟีเจอร์

- 📝 บันทึกรายรับ-รายจ่าย พร้อมหมวดหมู่ (ปรับแต่ง/เพิ่มหมวดหมู่เองได้)
- 👛 รองรับหลายกระเป๋าเงิน (Wallet)
- 📊 หน้า Analytics — สรุปยอด, Pie Chart, ปฏิทินค่าใช้จ่าย, เปรียบเทียบรายจ่าย
- 🤖 AI Analysis — วิเคราะห์การเงินและเป้าหมายการออมด้วย Gemini
- 🎨 ธีมและ Wallpaper ปรับแต่งได้ (รองรับ Dark Mode)
- 🔔 การแจ้งเตือน + ตั้งค่า Alert งบประมาณ
- 🔐 ล็อกแอปด้วย Biometric (expo-local-authentication)
- 📤 โอนย้ายข้อมูล นำเข้า/ส่งออก (Excel, ไฟล์ backup)

## โครงสร้าง Project

```
├── app/                      # หน้าจอ (Expo Router — file-based routing)
│   ├── (tabs)/               # แท็บหลัก: หน้าแรก, Analytics, AI Analysis, More
│   ├── transaction/add.tsx   # หน้าเพิ่มรายการ
│   ├── settings/             # ตั้งค่า: ธีม, กระเป๋า, แจ้งเตือน, โอนย้ายข้อมูล
│   └── _layout.tsx           # Root layout
│
├── components/               # UI Components แยกตามโดเมน
│   ├── transaction/          # ฟอร์ม/รายการธุรกรรม, เลือกหมวดหมู่
│   ├── analytics/            # กราฟ, ปฏิทิน, การ์ดสรุปยอด
│   ├── ai/                   # แสดงผลวิเคราะห์ AI
│   ├── wallet/               # จัดการกระเป๋าเงิน
│   ├── settings/             # หน้าตั้งค่าย่อย
│   ├── ui/                   # Component กลาง (FAB, AmountInput, PeriodSelector ฯลฯ)
│   ├── common/               # ของใช้ร่วม (Calculator, ไอคอนแมว, Loading)
│   └── layout/               # Wallpaper, HapticTab
│
├── lib/
│   ├── stores/               # Zustand stores + SQLite (db.ts)
│   ├── constants/            # หมวดหมู่, ธีม, มาสคอต, wallpaper
│   ├── utils/                # format, period, notifications, auth ฯลฯ
│   └── api/ai.ts             # เรียก Gemini API
│
├── hooks/                    # Custom hooks (useSummary)
├── types/                    # TypeScript types กลาง
├── assets/                   # รูปภาพ, ฟอนต์, ไอคอน
├── docs/superpowers/         # เอกสาร spec / plan ของแต่ละ phase
└── patches/                  # patch-package fixes
```

## เริ่มต้นใช้งาน

1. ติดตั้ง dependencies

   ```bash
   npm install
   ```

2. รันแอป (ต้องมีแอป Expo Go ในโทรศัพท์)

   ```bash
   npx expo start
   ```

   หรือรันแยกตาม platform:

   ```bash
   npm run android
   npm run ios
   npm run web
   ```

## Build (EAS)

```bash
npm run build:android:apk        # APK สำหรับทดสอบ (preview)
npm run build:android:apk:prod   # APK production
npm run build:android:local      # build ในเครื่อง
```

## เอกสารเพิ่มเติม

- [MOBILE-APP-ARCHITECTURE.md](MOBILE-APP-ARCHITECTURE.md) — สถาปัตยกรรมแอป
- [App Build.md](App%20Build.md) — ขั้นตอนการ build
- [docs/superpowers/](docs/superpowers/) — spec และ plan ของแต่ละฟีเจอร์
