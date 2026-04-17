# MiawMoney (มิวมันนี่) — Revised Design Prompt v2

> **Design a complete mobile expense tracker app called "MiawMoney" (มิวมันนี่) with a cute, hand-painted orange tabby cat theme featuring magical cosmic accents and kintsugi-inspired gold details. Generate a full design system and all core screens optimized for React Native implementation.**

---

## ═══════════════════════════════════════════
## BRAND & MASCOT (ปรับใหม่ตามภาพอ้างอิง)
## ═══════════════════════════════════════════

- **App name:** MiawMoney (มิวมันนี่)
- **Mascot:** A chubby **orange tabby cat** with:
  - **Warm orange fur** (`#E87A3D`) with **darker orange tiger stripes** (`#B8531E`) on back, tail, and forehead
  - **Cream/peach belly and muzzle** (`#F5D9B8`)
  - **Big round glossy black eyes** with **golden-yellow pupils** (`#FFD84A`)
  - **Soft pink blush cheeks** and **pink whiskers** (`#FFB3C7`)
  - A **golden "王" / crown-like mark** on forehead (`#E8B547`) — looks like three horizontal gold strokes
  - **Small pink paw pads** visible on feet
- **Magical accent (replacing pink portal):** A **flowing cosmic tail** that trails behind the cat in:
  - **Deep cosmic purple** (`#6B4A9E`)
  - **Magical blue** (`#4A7FC1`)
  - Scattered **white sparkles** and **tiny stars**
- **Kintsugi gold cracks** (`#E8B547` / `#D4A544`) radiate outward from the mascot — thin golden lightning-like lines with small dots, symbolizing "broken but beautifully repaired" (perfect metaphor for financial healing)
- Tiny **purple flowers** (`#9B7EC7`) and **blue butterflies** (`#5B8DD6`) float around as decoration
- **Illustration style:** Hand-painted / gouache-digital painting, soft gradients, subtle grainy texture, warm and cozy — **NOT flat vector**
- Mascot appears in: splash, onboarding, empty states, achievements, AI insights, loading screens, and small corner accents (never intrusive)

---

## ═══════════════════════════════════════════
## DESIGN PHILOSOPHY
## ═══════════════════════════════════════════

- Ultra-minimalist and breathable — lots of warm off-white space
- Soft, rounded, friendly — no sharp corners anywhere (radius ≥ 16px everywhere)
- Clean typography hierarchy — **numbers are the heroes**
- Cat and gold-crack elements are **decorative accents**, never clutter
- One primary action per screen
- iOS-native feel with custom warm personality
- Warm, cozy, "home-y" feeling — like a paper journal with gold leaf accents

---

## ═══════════════════════════════════════════
## COLOR SYSTEM (ปรับใหม่ทั้งหมด)
## ═══════════════════════════════════════════

### Primary (จากสีมาสคอต)
| Token | Hex | Usage |
|---|---|---|
| `tabby-orange` | `#E87A3D` | Primary brand color, main CTAs, active states |
| `tabby-deep` | `#B8531E` | Hover/pressed state, emphasis text on orange |
| `cream-peach` | `#F5D9B8` | Soft backgrounds, mascot belly tone, badges |

### Magical Accents (จากหางเวทมนตร์)
| Token | Hex | Usage |
|---|---|---|
| `cosmic-purple` | `#6B4A9E` | Secondary highlights, AI feature accents |
| `cosmic-blue` | `#4A7FC1` | Tertiary accent, charts, info states |
| `sparkle-gold` | `#E8B547` | Premium features, achievements, streaks |
| `kintsugi-gold` | `#D4A544` | Divider accents, gold-crack decorations |

### Warm Tones
| Token | Hex | Usage |
|---|---|---|
| `blush-pink` | `#FFB3C7` | Cheek blush, soft highlights, cute accents |
| `whisker-pink` | `#FF9FB8` | Minor accents, badges |
| `pupil-yellow` | `#FFD84A` | Highlight sparks (use very sparingly) |

### Semantic
| Token | Hex | Usage |
|---|---|---|
| `income-green` | `#5CB88A` | รายรับ (softer, warm green) |
| `expense-coral` | `#E57373` | รายจ่าย (warm coral, not aggressive red) |
| `warning-amber` | `#F0A830` | Alerts |

### Neutrals (warm paper feel)
| Token | Hex | Usage |
|---|---|---|
| `bg-paper` | `#FBF7F0` | App background (warm off-white, paper-like) |
| `surface` | `#FFFFFF` | Cards, modals |
| `surface-warm` | `#F8F2E7` | Subtle raised surfaces |
| `border-soft` | `#EDE4D3` | Hairlines, dividers |
| `text-primary` | `#2B2118` | Main text (warm black, not pure black) |
| `text-secondary` | `#6B5F52` | Secondary text |
| `text-muted` | `#A39685` | Captions, placeholders |

### Category Palette (ปรับให้เข้าโทน warm/cozy)
| Category | Color | Hex |
|---|---|---|
| 🍜 Food | Warm Coral | `#F5A185` |
| ☕ Coffee | Mocha | `#B8856B` |
| 🚗 Transport | Sky Teal | `#8AC5C5` |
| ⛽ Fuel | Golden Amber | `#F0A830` |
| 🛍 Shopping | Rose Pink | `#F59FB8` |
| 💊 Health | Sage Green | `#9FC9A8` |
| 👨‍👩‍👧 Family | Peach Pink | `#F5B8BC` |
| 🎮 Entertainment | Butter Yellow | `#F5D988` |
| 📄 Bills | Lavender | `#B5A8DB` |

### Dark Mode (เพิ่มเติม)
| Token | Hex |
|---|---|
| `dark-bg` | `#1F1913` (warm deep brown, not black) |
| `dark-surface` | `#2B2218` |
| `dark-surface-raised` | `#3A2E22` |
| `dark-border` | `#4A3D30` |
| `dark-text-primary` | `#F5EDE0` |
| `dark-accent-orange` | `#F59A5E` (slightly brighter for contrast) |

---

## ═══════════════════════════════════════════
## TYPOGRAPHY
## ═══════════════════════════════════════════

- **Headings Thai/EN:** `IBM Plex Sans Thai` Bold / `Sukhumvit Set` Bold
- **Body:** `IBM Plex Sans Thai` Regular / `Inter` Regular
- **Numbers (balances):** `Inter` Black, **tabular-nums**, extra-bold, oversized
- **Scale:** 40 / 32 / 24 / 20 / 17 / 15 / 13 / 11
- **Line-height:** 1.2 (headings), 1.5 (body)
- **Letter-spacing:** -0.02em on large numbers (tight, confident)
- Full Thai + English bilingual support, no font substitution gaps

---

## ═══════════════════════════════════════════
## COMPONENTS (Design System)
## ═══════════════════════════════════════════

### Buttons
- **Primary:** Pill shape (`borderRadius: 999`), `tabby-orange` background, white text, soft shadow `0 4px 14px rgba(232,122,61,0.25)`
- **Secondary:** Pill, transparent bg, `tabby-orange` border + text
- **Ghost:** Text-only, `tabby-orange` color
- Height: 52px (primary), 44px (secondary)

### Cards
- Radius: **20px**
- Shadow: `0 2px 12px rgba(43,33,24,0.06)`
- Border: `1px solid border-soft` (optional, for hairline)
- Padding: 20px default

### Category Icons
- Circular 56×56, flat pastel background from category palette
- White line-glyph inside (2px stroke)
- Active state: scale(1.05) + outer ring in `tabby-orange`

### Bottom Navigation (4 tabs)
- Tabs: **รายการ / สรุป / AI วิเคราะห์ / ตั้งค่า**
- Active indicator: A small **orange cat paw-print** below the icon (🐾 in `tabby-orange`)
- Inactive: `text-muted` monochrome icons
- Background: `surface` with top hairline

### FAB (Floating Action Button +)
- Large circular 64×64
- Background: `tabby-orange` with subtle gradient to `tabby-deep`
- **Two tiny triangular cat ears** on top (silhouette, same orange)
- Plus icon inside, white
- Shadow: `0 8px 20px rgba(232,122,61,0.35)`

### Charts
- Donut chart with **soft pastel category colors**
- Rounded ends on each segment (`strokeLinecap: round`)
- 8px gap between segments (no harsh lines)
- Center: large balance number + Thai label beneath
- Optional: tiny gold sparkle dots floating inside donut

### Input / Keyboard
- Rounded keys (radius 16px), generous spacing (8px gutters)
- Key press: subtle scale + haptic
- Calculator keypad: numbers in `text-primary`, operators in `tabby-orange`

### Empty States
- Features the **orange cat mascot** with magical tail
- Speech bubble with rounded-square shape (radius 20px, tail pointing to cat)
- **Gold-crack decorative lines** radiating subtly behind (opacity 0.15)
- Thai copy + cute emoji

### Achievement / Streak Cards
- Cat mascot **celebrating pose** with sparkles
- Gold ribbon/badge with `sparkle-gold`
- Confetti-style purple & blue dots scattered
- Kintsugi gold cracks as celebratory "burst" lines

### Decorative Motifs (ใช้ทั่วทั้งแอพ)
- **Thin gold cracks** (1px, `kintsugi-gold`, opacity 0.2–0.4) as subtle section dividers or card corner accents
- **Tiny sparkles** (★ or ✦) in `sparkle-gold`, randomly placed near totals and achievements
- **Small purple flowers & blue butterflies** (very subtle, opacity 0.3) on onboarding and empty states only

---

## ═══════════════════════════════════════════
## SCREENS TO DESIGN (10 หน้า)
## ═══════════════════════════════════════════

1. **Splash / Onboarding** — Orange cat with full cosmic purple-blue tail, gold cracks radiating, app name "มิวมันนี่" in bold below
2. **Dashboard (รายการ)** — Balance hero number (oversized tabular), "ทุกกระเป๋า" selector, frequent categories row, daily transaction list grouped by date
3. **Summary (สรุป)** — Donut chart with pastel category colors, month picker (Thai Buddhist: "เม.ย. 2569"), category breakdown list with progress bars
4. **Add Transaction modal** — รายจ่าย/รายรับ pill toggle, amount display (large orange number), category grid (3×3), calculator keypad, note field
5. **AI Insights (AI วิเคราะห์)** — Cat mascot in corner with speech bubble giving Thai advice, insight cards with gold-crack borders, trend mini-charts
6. **Settings (ตั้งค่า)** — Grouped list (iOS-style): ทั่วไป / กระเป๋าเงิน / ข้อมูล / เกี่ยวกับ
7. **Wallet Management** — List of wallets with balances, each card has a small colored stripe, add-wallet CTA
8. **Category Picker** — Tabs: แนะนำ / เลือก / ตั้งค่า — circular icons grid (4 per row), selected state with orange ring
9. **Empty State** — "ยังไม่มีรายการ 🐾" with cat mascot illustration (full pose from reference), subtle gold sparkles, "เพิ่มรายการแรก" CTA
10. **Achievement / Streak** — Cat mascot celebrating, "บันทึกต่อเนื่อง 7 วัน!" headline, sparkles, gold ribbon badge, share button

---

## ═══════════════════════════════════════════
## CONTENT (Thai Labels)
## ═══════════════════════════════════════════

- **Core:** รายรับ · รายจ่าย · คงเหลือ · ทุกกระเป๋า · รายการ · สรุป · ตั้งค่า · บันทึก · เลือกหมวดหมู่
- **Currency:** ฿ (THB) — always prefix, with thousand separators (฿1,234.00)
- **Date:** Thai Buddhist calendar format — "เม.ย. 2569", "วันนี้", "เมื่อวาน"
- **AI copy examples:** "มิวเห็นว่าเดือนนี้ใช้ค่ากาแฟเยอะมาก ☕✨", "เก่งมาก! ประหยัดได้ 15% จากเดือนก่อน 🐾"
- **Empty:** "ยังไม่มีรายการ — เริ่มบันทึกกับมิวกันเถอะ!"

---

## ═══════════════════════════════════════════
## REACT NATIVE IMPLEMENTATION NOTES
## ═══════════════════════════════════════════

### Recommended stack
- **RN:** 0.74+ with New Architecture
- **Navigation:** `@react-navigation/native` + `bottom-tabs` + `native-stack`
- **Styling:** `nativewind` (Tailwind) or `styled-components/native` — map tokens above to theme
- **Animations:** `react-native-reanimated` v3 (for FAB press, tab paw-print transition, mascot bounce)
- **Charts:** `victory-native` or `react-native-svg-charts` with custom rounded donut
- **Icons:** `lucide-react-native` for UI, custom PNG/SVG for category glyphs
- **Mascot illustrations:** Export as **PNG @2x/@3x with transparent bg** (Lottie optional for animated splash)
- **Fonts:** `expo-font` or `react-native-asset` — load IBM Plex Sans Thai + Inter
- **Haptics:** `expo-haptics` on FAB tap, category select, save success

### Theme token file (pseudo)
```ts
export const theme = {
  colors: {
    tabby: { orange: '#E87A3D', deep: '#B8531E', cream: '#F5D9B8' },
    cosmic: { purple: '#6B4A9E', blue: '#4A7FC1' },
    gold: { sparkle: '#E8B547', kintsugi: '#D4A544' },
    warm: { blush: '#FFB3C7', whisker: '#FF9FB8' },
    semantic: { income: '#5CB88A', expense: '#E57373', warning: '#F0A830' },
    bg: { paper: '#FBF7F0', surface: '#FFFFFF', warm: '#F8F2E7' },
    border: '#EDE4D3',
    text: { primary: '#2B2118', secondary: '#6B5F52', muted: '#A39685' },
    category: { food: '#F5A185', coffee: '#B8856B', transport: '#8AC5C5', /* ... */ },
  },
  radius: { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  shadow: {
    card: { shadowColor: '#2B2118', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 2 } },
    cta:  { shadowColor: '#E87A3D', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
  },
} as const;
```

---

## ═══════════════════════════════════════════
## DELIVERABLES
## ═══════════════════════════════════════════

- ✅ Complete design system page (colors, typography, components, spacing, icons, mascot poses)
- ✅ All 10 screens in **light mode** (warm paper background)
- ✅ **Dark mode variants** for Dashboard, Summary, Add Transaction (warm dark brown bg, not pure black)
- ✅ Frame: **iPhone 15 Pro (393 × 852)**
- ✅ Mascot asset set: idle, celebrating, thinking (AI), sleeping (empty state), waving (onboarding)
- ✅ Exportable as React Native component library with theme tokens

---

## สรุปสิ่งที่เปลี่ยนจาก prompt เดิม

| หัวข้อ | เดิม | ใหม่ (ตามรูป) |
|---|---|---|
| สีแมว | Dark teal/navy `#2F4A4F` | **Orange tabby `#E87A3D`** |
| Accent หลัก | Pink swirl/portal | **Purple-blue cosmic tail + gold kintsugi cracks** |
| รอยบนหน้าผาก | Cross-shaped scar | **Golden "王" / triple gold strokes** |
| พื้นหลัง | Cool off-white `#FAFAF7` | **Warm paper `#FBF7F0`** |
| โทนอารมณ์ | Cool & minimal | **Warm, cozy, hand-painted with gold leaf** |
| Dark mode | (ไม่ระบุ) | **Warm dark brown, not pure black** |
| Decorative motifs | Pink sparkles | **Gold cracks + purple flowers + blue butterflies** |
