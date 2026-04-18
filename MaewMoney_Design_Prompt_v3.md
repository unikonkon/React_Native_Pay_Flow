# แมวมันนี่ (MaewMoney) — Design Prompt v3
> **Final version — อ้างอิง screenshot จริง + mascot reference**

**Design a complete mobile expense tracker app called "แมวมันนี่" (MaewMoney) featuring a cute orange tabby cat mascot with magical cosmic accents. Ultra-minimal, warm, and easy-to-use. Generate a full design system and all core screens optimized for React Native implementation, matching the reference screenshot layout.**

---

## ═══════════════════════════════════════════
## BRAND
## ═══════════════════════════════════════════

- **App name (Thai):** แมวมันนี่
- **App name (EN):** MaewMoney
- **Tagline:** "บันทึกรายรับรายจ่ายกับมิว 🐾"
- **Package name suggestion:** `com.maewmoney.app`

---

## ═══════════════════════════════════════════
## MASCOT (จากรูปอ้างอิง — ไม่เปลี่ยน)
## ═══════════════════════════════════════════

- **Character:** Chubby orange tabby cat
  - Warm orange fur `#E87A3D` with darker stripes `#B8531E`
  - Cream belly & muzzle `#F5D9B8`
  - Big glossy black eyes with golden pupils `#FFD84A`
  - Pink blush cheeks + pink whiskers `#FFB3C7`
  - Golden "王" mark on forehead (three gold strokes) `#E8B547`
- **Cosmic tail:** Purple `#6B4A9E` → Blue `#4A7FC1` with white sparkles
- **Kintsugi gold cracks** `#E8B547`/`#D4A544` radiating outward
- **Style:** Hand-painted / gouache, soft gradients, grainy texture (NOT flat vector)

### Mascot usage by screen
| Screen | Mascot appearance | Size |
|---|---|---|
| Splash / Onboarding | Full pose + cosmic tail | Large (280px) |
| Dashboard header | Tiny circular face only | 28px avatar |
| Empty state | Full idle pose | Large (200px) |
| AI Insights (Premium) | Corner peek + speech bubble | 80px |
| Achievement | Celebrating pose + sparkles | Medium (160px) |
| FAB button | Two triangular ears silhouette on top | 64px FAB |

---

## ═══════════════════════════════════════════
## SCREEN LAYOUTS (อ้างอิง screenshot ตัวอย่าง)
## ═══════════════════════════════════════════

### 📋 Screen 1: Dashboard "รายการ" (หน้าหลัก) — ตรงตาม screenshot

```
┌─────────────────────────────────────────────┐
│  ⏰ 22:25          ••• 4G [80]              │ ← Status bar
├─────────────────────────────────────────────┤
│  🐱 รายการ                                   │ ← Header (cat avatar + title)
├─────────────────────────────────────────────┤
│  🎒 ทุกกระเป๋า ▾      ← เม.ย. 2569 →         │ ← Wallet + Month picker
├─────────────────────────────────────────────┤
│   รายรับ      รายจ่าย      คงเหลือ            │ ← Summary row (3 columns)
│   411,400    102,131     309,269            │    Green / Coral / Green
├─────────────────────────────────────────────┤
│  รายการใช้บ่อย                                │ ← Frequent items (horizontal scroll)
│  🍜 🍜 🍜 🍜 🍜 🍜 🍜 →                      │    Circular category icons
│ อาหาร อาหาร อาหาร ...                         │    with amount below
│  200  250  120  ...                          │
├─────────────────────────────────────────────┤
│  16 เม.ย.              +19,000  -3,470       │ ← Date header with daily totals
│                                              │
│  ⚫ อื่นๆ                          -500       │
│                                    23:24     │
│                                              │
│  🍷 สังสรรค์                       -100       │
│     สังสรรค์กับเพื่อน                22:28     │
│                                              │
│  🔥 น้ำมัน  ×3                    -2,000  ▾  │ ← Grouped (×N) + expand
│                                              │
│  💼 เงินเดือน                    +18,000     │
│     เงินเดือน                       20:52    │
│                                              │
│  🚗 เดินทาง                        -120      │
│                                    17:11    │
│                                              │
│  ☕ เครื่องดื่ม/กาแฟ  ×2           -160  ▾   │
│                                              │
│  🎮 เกม                           -590      │
│     ซื้อเกม Steam                  11:35     │
│                                              │
│  📈 เงินปันผล                    +...       │
│                                              │
│                              ╭───╮           │
│                              │ + │ 🐱        │ ← FAB with cat ears
│                              ╰───╯           │
├─────────────────────────────────────────────┤
│ 📋รายการ 📊สรุป 💎Premium ⚙️ตั้งค่า           │ ← Bottom nav
└─────────────────────────────────────────────┘
```

### Key layout specs
- **Header bar:** 44px height, cat avatar 28px (left), title 20px bold
- **Wallet/Month row:** 48px height, pill shape (radius 999) for selector
- **Summary row:** 3 columns equal, 72px height, label 13px + number 22px bold tabular
- **Frequent items:** Horizontal FlatList, 80px height, circular icon 56px
- **Date header:** Sticky, 36px height, bg `#F8F2E7`, date 15px muted + totals right-aligned
- **Transaction row:** 64px height (72px if has subtitle), icon 40px circular
- **FAB:** 56px circular + 2 triangular ears on top (ears 12px tall), offset bottom-right 16px, floats above bottom nav
- **Bottom nav:** 82px total (with safe-area), 4 tabs equal width

---

## ═══════════════════════════════════════════
## NAVIGATION STRUCTURE (4 tabs — ตาม screenshot)
## ═══════════════════════════════════════════

| Tab | Icon | Label Thai | Purpose |
|---|---|---|---|
| 1 | 📋 list | **รายการ** | Dashboard — transactions by date |
| 2 | 📊 pie-chart | **สรุป** | Summary — donut chart + category breakdown |
| 3 | 💎 diamond | **Premium** | Premium features (AI insights, export, themes) |
| 4 | ⚙️ settings | **ตั้งค่า** | Settings |

**Active indicator:** Small orange paw-print 🐾 below the active icon  
**Active color:** `tabby-orange #E87A3D`  
**Inactive color:** `text-muted #A39685`

---

## ═══════════════════════════════════════════
## COLOR SYSTEM (ปรับให้ตรง screenshot)
## ═══════════════════════════════════════════

### Primary brand
| Token | Hex | Usage |
|---|---|---|
| `tabby-orange` | `#E87A3D` | Primary CTAs, FAB, active tab, avatar bg |
| `tabby-deep` | `#B8531E` | Pressed state, emphasis |
| `cream-peach` | `#F5D9B8` | Soft bg, "รายการใช้บ่อย" icons, badges |

### Magical accents
| Token | Hex | Usage |
|---|---|---|
| `cosmic-purple` | `#6B4A9E` | Premium features, "เงินปันผล" category |
| `cosmic-blue` | `#4A7FC1` | Info states, subtle accents |
| `sparkle-gold` | `#E8B547` | Premium badge, achievements |
| `kintsugi-gold` | `#D4A544` | Decorative gold cracks |

### Semantic (ตาม screenshot)
| Token | Hex | Usage |
|---|---|---|
| `income-green` | `#5CB88A` | รายรับ (+18,000, +19,000) |
| `expense-coral` | `#E57373` | รายจ่าย (-500, -2,000) |
| `warning-amber` | `#F0A830` | Alerts |
| `text-income` | `#4A9E75` | Income number emphasis |
| `text-expense` | `#D85F5F` | Expense number emphasis |

### Neutrals (warm paper)
| Token | Hex | Usage |
|---|---|---|
| `bg-paper` | `#FBF7F0` | App background |
| `surface` | `#FFFFFF` | Cards, list items |
| `surface-warm` | `#F8F2E7` | Date header strip bg |
| `border-soft` | `#EDE4D3` | Hairlines between rows |
| `text-primary` | `#2B2118` | Main text (warm black) |
| `text-secondary` | `#6B5F52` | Labels "รายรับ", subtitle |
| `text-muted` | `#A39685` | Time stamps, captions |

### Category icons (จาก screenshot — แต่ละ row ใช้สีต่างกัน)
| Category | Thai | Color | Hex | Icon |
|---|---|---|---|---|
| Food | อาหาร | Warm Coral | `#F5A185` | 🍜 noodle bowl |
| Others | อื่นๆ | Warm Gray | `#A39685` | ⋯ three dots |
| Social | สังสรรค์ | Rose Pink | `#F5B8C4` | 🍷 wine glass |
| Fuel | น้ำมัน | Amber | `#F0A830` | 🔥 flame/drop |
| Salary | เงินเดือน | Sage Green | `#9FC9A8` | 💼 briefcase |
| Transport | เดินทาง | Sky Teal | `#8AC5C5` | 🚗 car |
| Coffee | เครื่องดื่ม/กาแฟ | Mocha | `#B8856B` | ☕ cup |
| Games | เกม | Butter Yellow | `#F5D988` | 🎮 gamepad |
| Dividend | เงินปันผล | Lavender | `#B5A8DB` | 📈 trending up |
| Shopping | ช้อปปิ้ง | Peach Pink | `#F5B8BC` | 🛍 bag |
| Health | สุขภาพ | Mint | `#9FD9B8` | 💊 pill |
| Bills | บิลค่าใช้จ่าย | Periwinkle | `#B3B9FF` | 📄 document |

### Dark mode (warm, not black)
| Token | Hex |
|---|---|
| `dark-bg` | `#1F1913` |
| `dark-surface` | `#2B2218` |
| `dark-surface-raised` | `#3A2E22` |
| `dark-border` | `#4A3D30` |
| `dark-text-primary` | `#F5EDE0` |
| `dark-text-secondary` | `#C4B8A8` |
| `dark-accent-orange` | `#F59A5E` |

---

## ═══════════════════════════════════════════
## TYPOGRAPHY
## ═══════════════════════════════════════════

- **Heading:** `IBM Plex Sans Thai` Bold
- **Body:** `IBM Plex Sans Thai` Regular
- **Numbers (amounts):** `Inter` Black, **tabular-nums**, letter-spacing -0.02em
- **Scale:** 32 / 24 / 22 / 20 / 17 / 15 / 13 / 11

### Specific uses (จาก screenshot)
| Element | Size | Weight | Font |
|---|---|---|---|
| Screen title "รายการ" | 22px | 600 | Sans Thai |
| Summary numbers (411,400) | 22px | 800 | Inter Black (tabular) |
| Summary labels (รายรับ) | 13px | 400 | Sans Thai |
| Month picker (เม.ย. 2569) | 17px | 600 | Sans Thai |
| Category name (อาหาร) | 17px | 500 | Sans Thai |
| Amount (-500) | 17px | 700 | Inter (tabular) |
| Subtitle (สังสรรค์กับเพื่อน) | 13px | 400 | Sans Thai |
| Timestamp (23:24) | 12px | 400 | Inter (tabular) |
| Frequent item name | 12px | 500 | Sans Thai |
| Frequent item amount | 11px | 400 | Inter |
| Date header (16 เม.ย.) | 13px | 500 | Sans Thai |
| Daily totals (+19,000) | 13px | 600 | Inter (tabular) |
| Tab label | 11px | 500 | Sans Thai |

---

## ═══════════════════════════════════════════
## COMPONENTS (precise specs)
## ═══════════════════════════════════════════

### Transaction Row
```
┌────────────────────────────────────────┐
│ [🎨] ชื่อหมวดหมู่  ×N        -1,234    │  ← 64px default
│      คำอธิบายเสริม (ถ้ามี)     HH:MM    │  ← 72px with subtitle
└────────────────────────────────────────┘
```
- Left icon: 40×40 circular, flat pastel bg from category palette, white glyph inside (2px stroke)
- Category name: 17px weight 500, color `text-primary`
- **Group badge ×N:** small pill next to name, bg `bg-paper`, text `text-secondary`, 11px
- Amount: right-aligned, tabular nums, color by type (green/coral)
- Subtitle: 13px `text-secondary`, italic optional
- Timestamp: 12px `text-muted`, bottom-right below amount
- **Expand arrow ▾:** visible only when `×N > 1`, tapping expands to show all
- Tap behavior: row → edit modal, chevron → expand group
- Hairline separator: `0.5px solid border-soft` between rows (skip after date header)

### Summary Row (3 columns)
```
┌─────────────┬─────────────┬─────────────┐
│   รายรับ    │  รายจ่าย    │  คงเหลือ    │  ← 13px muted labels
│  411,400   │  102,131   │  309,269    │  ← 22px tabular bold
│   green    │    coral    │   green    │     (color by value sign)
└─────────────┴─────────────┴─────────────┘
```
- No dividers between columns (whitespace only)
- Equal 1/3 width each
- Numbers use `Intl.NumberFormat('th-TH')` — "411,400" with comma separator
- **ทุกกระเป๋า selector:** pill shape, 14px bold + chevron-down, tap → wallet picker bottom sheet
- **Month arrows:** 32×32 tap target, chevron icons, tap → previous/next month

### Frequent Items Row (horizontal scroll)
```
[🎨]  [🎨]  [🎨]  [🎨]  [🎨]  →
อาหาร อาหาร อาหาร อาหาร อาหาร
 200  250  120   50   40
```
- Circular icon 56×56 (larger than transaction icons)
- Horizontal padding 16px between items
- Show label + most recent amount below
- `showsHorizontalScrollIndicator={false}`
- Tap → one-tap add transaction with prefilled category+amount

### FAB (Floating Action Button)
- Position: `absolute`, `bottom: 16px + safeAreaBottom + 82px (nav height)`, `right: 16px`
- Size: 56×56 main circle, orange gradient `#E87A3D → #B8531E`
- **Two triangular ears** on top: each 12×14px, same orange, positioned -6px top
- Plus icon center: 24px, white, stroke 2.5
- Shadow: `0 8px 20px rgba(232,122,61,0.35)`
- Tap → Add Transaction modal (slides up)
- Press animation: `scale(0.92)` + haptic impact medium

### Bottom Nav Bar
- Height: 82px (includes iOS safe area)
- Background: white with `border-top: 0.5px solid border-soft`
- 4 equal tabs, each with icon (24px) + label (11px)
- Active state: icon + label in `tabby-orange`, + **orange paw print 🐾** below (8×8)
- Inactive: `text-muted`
- No ripple/highlight; rely on color + paw print indicator

### Cat Avatar Header (top-left)
- 28×28 circular, bg `cream-peach`
- Simple cat face SVG (just ears + eyes + smile, no body)
- Tap → navigate to profile/settings shortcut

### Date Header (sticky)
- 36px height, bg `surface-warm #F8F2E7`
- Left: date "16 เม.ย." (13px 500 `text-secondary`)
- Right: daily totals "+19,000  -3,470" (13px 600, colored)
- No border, subtle color contrast only

### Grouped Transaction (×N)
```
Default (collapsed):
┌────────────────────────────────────────┐
│ [🔥] น้ำมัน  ×3            -2,000   ▾  │
└────────────────────────────────────────┘

Expanded:
┌────────────────────────────────────────┐
│ [🔥] น้ำมัน  ×3            -2,000   ▴  │
│  ├ -700  ปั๊มเชลล์              09:15   │
│  ├ -800  ปั๊ม PT                13:45   │
│  └ -500  ปั๊มบางจาก             18:22   │
└────────────────────────────────────────┘
```
- Auto-grouping: same category + same day → group into single row
- Sum displayed as total
- Tap ▾ → animate expand with Reanimated `layout` animation
- Sub-items: indent 40px, smaller font 15px

---

## ═══════════════════════════════════════════
## ALL 10 SCREENS (updated)
## ═══════════════════════════════════════════

### 1. Splash / Onboarding (3 slides)
- Slide 1: Full cat mascot + cosmic tail, "แมวมันนี่" title, "บันทึกรายรับรายจ่าย ง่ายเหมือนลูบแมว 🐾"
- Slide 2: Preview screenshot of dashboard with annotations
- Slide 3: "เริ่มต้นใช้งานฟรี" CTA + "เข้าสู่ระบบ" ghost link

### 2. Dashboard "รายการ" ← ตาม screenshot
- Everything specified above

### 3. Summary "สรุป"
- Month picker header (same as Dashboard)
- Donut chart center: total expense, below: "รายจ่ายทั้งหมด"
- Category breakdown list: icon + name + amount + % + mini bar
- Tap category → filtered transaction list
- Toggle: รายจ่าย / รายรับ pill (top)

### 4. Premium "Premium"
- Cat mascot peek from corner
- Hero: "ปลดล็อกฟีเจอร์พิเศษกับมิว 💎"
- Feature cards:
  - 🤖 **AI วิเคราะห์** — "มิวจะช่วยวิเคราะห์การใช้จ่าย"
  - 📊 **Export รายงาน** — PDF/Excel
  - 🎨 **ธีมพิเศษ** — Dark mode, mascot skins
  - ☁️ **Cloud backup** — Sync ทุกอุปกรณ์
  - 🚫 **ไม่มีโฆษณา**
- Pricing: ฿99/เดือน or ฿899/ปี (save 25%)
- Kintsugi gold card border for pricing plans

### 5. Settings "ตั้งค่า"
iOS-style grouped list:
- **บัญชี** — โปรไฟล์, Sync iCloud, เปลี่ยนรหัส PIN
- **ทั่วไป** — ภาษา (ไทย/EN), สกุลเงิน (฿), รูปแบบวันที่ (พ.ศ./ค.ศ.)
- **กระเป๋าเงิน** — จัดการกระเป๋า, หมวดหมู่
- **ข้อมูล** — Backup, Import/Export, ล้างข้อมูล
- **Premium** — สถานะสมาชิก, จัดการการชำระเงิน
- **เกี่ยวกับ** — เวอร์ชัน, เงื่อนไข, Privacy, ให้คะแนนแอพ

### 6. Add Transaction Modal (slide up, 90% height)
- Top: รายจ่าย / รายรับ pill toggle (2 options only, simpler than v2)
- Amount display: huge number (40px), orange for expense, green for income
- Category horizontal row (select first category quickly) + "เลือกเพิ่ม" link → full picker
- Note input: "เพิ่มคำอธิบาย..." (optional, multiline)
- Date picker: defaults to now, tap to change
- Wallet selector: defaults to current, tap to change
- Calculator keypad at bottom (numbers + operators + clear)
- **บันทึก** button: full-width pill, `tabby-orange`, 52px

### 7. Wallet Management
- List of wallets with:
  - Colored vertical stripe left (2px) in wallet's assigned color
  - Name + current balance
  - Icon (bank, cash, credit-card)
- Swipe-to-delete, long-press to reorder
- "+ เพิ่มกระเป๋า" CTA at bottom

### 8. Category Picker (bottom sheet from Add Transaction)
- Tabs at top: **ทั้งหมด / ใช้บ่อย / หมวดใหม่**
- 4-column grid of circular icons (56×56)
- Selected state: outer orange ring + scale 1.05
- Search bar at top (optional)
- "+ เพิ่มหมวดหมู่" last cell

### 9. Empty State
- Full mascot illustration (idle pose, 200px)
- Headline: "ยังไม่มีรายการ" (22px bold)
- Subtitle: "เริ่มบันทึกรายการแรกกับมิวกันเถอะ 🐾" (15px muted)
- CTA: "เพิ่มรายการแรก" (primary pill button)
- Subtle gold sparkles scattered (opacity 0.2)

### 10. Achievement / Streak
- Mascot celebrating pose (160px), sparkles around
- Headline: "บันทึกต่อเนื่อง 7 วัน!" (24px bold)
- Sub: "เก่งมากเลย! มิวภูมิใจในตัวคุณ 🏆"
- Gold ribbon badge (pentagon shape)
- Streak counter with kintsugi gold cracks decoration
- "แชร์ให้เพื่อน" + "ไปต่อ" CTAs

---

## ═══════════════════════════════════════════
## MOCK DATA FOR DASHBOARD (ตาม screenshot)
## ═══════════════════════════════════════════

```ts
export const mockTransactions = [
  // 16 เม.ย. 2569
  { id: '1', category: 'others', name: 'อื่นๆ', amount: -500, time: '23:24', date: '2026-04-16' },
  { id: '2', category: 'social', name: 'สังสรรค์', note: 'สังสรรค์กับเพื่อน', amount: -100, time: '22:28', date: '2026-04-16' },
  { id: '3', category: 'fuel', name: 'น้ำมัน', amount: -700, time: '18:22', date: '2026-04-16', groupId: 'g1' },
  { id: '4', category: 'fuel', name: 'น้ำมัน', amount: -800, time: '13:45', date: '2026-04-16', groupId: 'g1' },
  { id: '5', category: 'fuel', name: 'น้ำมัน', amount: -500, time: '09:15', date: '2026-04-16', groupId: 'g1' },
  { id: '6', category: 'salary', name: 'เงินเดือน', note: 'เงินเดือน', amount: 18000, time: '20:52', date: '2026-04-16' },
  { id: '7', category: 'transport', name: 'เดินทาง', amount: -120, time: '17:11', date: '2026-04-16' },
  { id: '8', category: 'coffee', name: 'เครื่องดื่ม/กาแฟ', amount: -80, time: '14:20', date: '2026-04-16', groupId: 'g2' },
  { id: '9', category: 'coffee', name: 'เครื่องดื่ม/กาแฟ', amount: -80, time: '09:30', date: '2026-04-16', groupId: 'g2' },
  { id: '10', category: 'games', name: 'เกม', note: 'ซื้อเกม Steam', amount: -590, time: '11:35', date: '2026-04-16' },
  { id: '11', category: 'dividend', name: 'เงินปันผล', amount: 1000, time: '10:00', date: '2026-04-16' },
];

export const mockSummary = {
  income: 411400,
  expense: 102131,
  balance: 309269,
  month: '2026-04', // เม.ย. 2569
};

export const mockFrequentItems = [
  { id: 'f1', category: 'food', name: 'อาหาร', lastAmount: 200 },
  { id: 'f2', category: 'food', name: 'อาหาร', lastAmount: 250 },
  { id: 'f3', category: 'food', name: 'อาหาร', lastAmount: 120 },
  { id: 'f4', category: 'food', name: 'อาหาร', lastAmount: 50 },
  { id: 'f5', category: 'food', name: 'อาหาร', lastAmount: 40 },
  { id: 'f6', category: 'food', name: 'อาหาร', lastAmount: 30 },
];
```

---

## ═══════════════════════════════════════════
## REACT NATIVE IMPLEMENTATION
## ═══════════════════════════════════════════

### Folder structure
```
maewmoney/
├── src/
│   ├── theme/
│   │   ├── tokens.ts            ← all color/typography/spacing tokens
│   │   ├── ThemeProvider.tsx    ← context with light/dark switching
│   │   └── useTheme.ts
│   ├── components/
│   │   ├── Mascot/              ← react-native-svg cat (variants: idle, celebrating, etc.)
│   │   ├── CategoryIcon.tsx     ← circular icon w/ category color mapping
│   │   ├── TransactionRow.tsx   ← 64/72px row with group support
│   │   ├── SummaryRow.tsx       ← 3-column summary
│   │   ├── MonthPicker.tsx      ← chevron left/right + label
│   │   ├── WalletSelector.tsx   ← pill w/ chevron
│   │   ├── FrequentItems.tsx    ← horizontal FlatList
│   │   ├── DateHeader.tsx       ← sticky section header
│   │   ├── FAB.tsx              ← floating button w/ cat ears
│   │   ├── BottomNav.tsx        ← 4-tab nav w/ paw print
│   │   └── Button.tsx, Pill.tsx ← base primitives
│   ├── screens/
│   │   ├── DashboardScreen.tsx
│   │   ├── SummaryScreen.tsx
│   │   ├── PremiumScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── AddTransactionModal.tsx
│   │   ├── WalletManagementScreen.tsx
│   │   ├── CategoryPickerSheet.tsx
│   │   ├── EmptyStateView.tsx
│   │   └── AchievementModal.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   └── BottomTabNavigator.tsx
│   ├── hooks/
│   │   ├── useTransactions.ts
│   │   └── useGrouping.ts        ← auto-group same category+day
│   ├── stores/
│   │   ├── transactionStore.ts   ← Zustand
│   │   └── walletStore.ts
│   ├── utils/
│   │   ├── formatTHB.ts          ← "411,400"
│   │   ├── formatThaiDate.ts     ← "16 เม.ย. 2569"
│   │   └── buddhistEra.ts
│   └── i18n/
│       ├── th.ts                 ← centralize all Thai strings
│       └── en.ts
└── assets/
    ├── fonts/                    ← IBM Plex Sans Thai + Inter
    └── mascot/
        ├── mascot-idle.svg
        ├── mascot-celebrating.svg
        ├── mascot-sleeping.svg
        ├── mascot-thinking.svg
        └── mascot-waving.svg
```

### Tech stack (confirmed)
```json
{
  "dependencies": {
    "react-native": "0.74.x",
    "expo": "~52.0.0",
    "@react-navigation/native": "^7.x",
    "@react-navigation/bottom-tabs": "^7.x",
    "@react-navigation/native-stack": "^7.x",
    "react-native-svg": "^15.x",
    "react-native-reanimated": "~3.x",
    "react-native-gesture-handler": "~2.x",
    "zustand": "^4.x",
    "victory-native": "^41.x",
    "dayjs": "^1.11.x",
    "expo-haptics": "~13.x",
    "expo-font": "~13.x",
    "expo-linear-gradient": "~13.x",
    "lucide-react-native": "^0.x",
    "nativewind": "^4.x"
  }
}
```

### Theme token file (complete, ready to paste)
```ts
// src/theme/tokens.ts
export const tokens = {
  colors: {
    tabby: {
      orange: '#E87A3D',
      deep: '#B8531E',
      cream: '#F5D9B8',
    },
    cosmic: {
      purple: '#6B4A9E',
      blue: '#4A7FC1',
    },
    gold: {
      sparkle: '#E8B547',
      kintsugi: '#D4A544',
    },
    warm: {
      blush: '#FFB3C7',
      whisker: '#FF9FB8',
      pupil: '#FFD84A',
    },
    semantic: {
      income: '#5CB88A',
      expense: '#E57373',
      warning: '#F0A830',
      textIncome: '#4A9E75',
      textExpense: '#D85F5F',
    },
    bg: {
      paper: '#FBF7F0',
      surface: '#FFFFFF',
      warm: '#F8F2E7',
    },
    border: {
      soft: '#EDE4D3',
    },
    text: {
      primary: '#2B2118',
      secondary: '#6B5F52',
      muted: '#A39685',
    },
    category: {
      food: '#F5A185',
      others: '#A39685',
      social: '#F5B8C4',
      fuel: '#F0A830',
      salary: '#9FC9A8',
      transport: '#8AC5C5',
      coffee: '#B8856B',
      games: '#F5D988',
      dividend: '#B5A8DB',
      shopping: '#F5B8BC',
      health: '#9FD9B8',
      bills: '#B3B9FF',
    },
    dark: {
      bg: '#1F1913',
      surface: '#2B2218',
      surfaceRaised: '#3A2E22',
      border: '#4A3D30',
      textPrimary: '#F5EDE0',
      textSecondary: '#C4B8A8',
      accentOrange: '#F59A5E',
    },
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
    pill: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  typography: {
    fontFamily: {
      sansThai: 'IBMPlexSansThai',
      sansThaiBold: 'IBMPlexSansThai-Bold',
      inter: 'Inter',
      interBlack: 'Inter-Black',
    },
    sizes: {
      xs: 11,
      sm: 13,
      base: 15,
      md: 17,
      lg: 20,
      xl: 22,
      xxl: 24,
      display: 32,
      hero: 40,
    },
  },
  shadow: {
    card: {
      shadowColor: '#2B2118',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    cta: {
      shadowColor: '#E87A3D',
      shadowOpacity: 0.25,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    fab: {
      shadowColor: '#E87A3D',
      shadowOpacity: 0.35,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 10,
    },
  },
} as const;

export type Tokens = typeof tokens;
export type CategoryKey = keyof typeof tokens.colors.category;
```

---

## ═══════════════════════════════════════════
## I18N STRINGS (Thai, centralized)
## ═══════════════════════════════════════════

```ts
// src/i18n/th.ts
export const th = {
  app: {
    name: 'แมวมันนี่',
    tagline: 'บันทึกรายรับรายจ่ายกับมิว 🐾',
  },
  tabs: {
    list: 'รายการ',
    summary: 'สรุป',
    premium: 'Premium',
    settings: 'ตั้งค่า',
  },
  dashboard: {
    allWallets: 'ทุกกระเป๋า',
    income: 'รายรับ',
    expense: 'รายจ่าย',
    balance: 'คงเหลือ',
    frequentItems: 'รายการใช้บ่อย',
    today: 'วันนี้',
    yesterday: 'เมื่อวาน',
  },
  addTransaction: {
    expense: 'รายจ่าย',
    income: 'รายรับ',
    selectCategory: 'เลือกหมวดหมู่',
    note: 'เพิ่มคำอธิบาย...',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
  },
  empty: {
    title: 'ยังไม่มีรายการ',
    subtitle: 'เริ่มบันทึกรายการแรกกับมิวกันเถอะ 🐾',
    cta: 'เพิ่มรายการแรก',
  },
  achievement: {
    streak: (days: number) => `บันทึกต่อเนื่อง ${days} วัน!`,
    congrats: 'เก่งมากเลย! มิวภูมิใจในตัวคุณ 🏆',
  },
  premium: {
    title: 'ปลดล็อกฟีเจอร์พิเศษกับมิว 💎',
    features: {
      ai: 'AI วิเคราะห์',
      export: 'Export รายงาน',
      themes: 'ธีมพิเศษ',
      cloud: 'Cloud backup',
      adFree: 'ไม่มีโฆษณา',
    },
    pricing: {
      monthly: '฿99/เดือน',
      yearly: '฿899/ปี',
      save: 'ประหยัด 25%',
    },
  },
} as const;
```

---

## ═══════════════════════════════════════════
## DELIVERABLES
## ═══════════════════════════════════════════

- ✅ Design system tokens file (`tokens.ts` ready to paste)
- ✅ All 10 screens matching reference screenshot layout
- ✅ Mascot SVG components (5 variants)
- ✅ Light + Dark mode for Dashboard, Summary, Add Transaction
- ✅ Frame: iPhone 15 Pro (393 × 852) with Dynamic Island
- ✅ Auto-grouping transaction logic (`useGrouping.ts` hook)
- ✅ Thai Buddhist calendar date helper
- ✅ Currency formatter (Intl.NumberFormat, th-TH)

---

## สรุปการเปลี่ยนแปลงจาก v2 → v3

| ส่วน | v2 (MiawMoney) | v3 (แมวมันนี่) — ตาม screenshot |
|---|---|---|
| ชื่อ | MiawMoney (มิวมันนี่) | **แมวมันนี่ (MaewMoney)** |
| Tab 3 | AI วิเคราะห์ | **Premium** 💎 |
| Summary | 1 ค่า (balance อย่างเดียว) | **3 columns** (รายรับ/รายจ่าย/คงเหลือ) |
| Header avatar | ไม่มี | **วงกลมแมวส้ม 28px** มุมซ้ายบน |
| Transaction grouping | ไม่มี | **Auto-group ×N** + expand dropdown |
| Frequent items | ไม่ชัดเจน | **Horizontal scroll row** เด่นชัด |
| Date header | "วันนี้"/"เมื่อวาน" | **"16 เม.ย." + daily totals** ขวา |
| Month picker | ไม่ชัดเจน | **← เม.ย. 2569 →** ชัดเจน |
| AI feature | Standalone tab | **ย้ายไปอยู่ใน Premium** |
| Mock data | ทั่วไป | **ตรงกับตัวเลขใน screenshot** |
| i18n | แค่คำพูด | **ไฟล์ th.ts สำเร็จรูป** |
| Theme tokens | pseudo-code | **TypeScript ไฟล์สมบูรณ์พร้อม paste** |
