# MiawMoney Redesign — Phase 1: Foundation

> Phase 1 covers: theme system, SVG mascot assets, Tab Bar, FAB, and 4 main screens.
> Phase 2 (future): remaining 25 components, 9 settings screens, category palette, fonts.

---

## 1. Theme System

### 1.1 Strategy

Replace the existing 9 themes (light, dark, zinc, stone, cyan, sky, teal, gray, neutral) with 9 MiawMoney-branded variations. All themes share **tabby-orange `#E87A3D`** as primary color.

### 1.2 Theme Definitions

All values are CSS custom properties in `global.css`, consumed via `tailwind.config.js`.

#### Shared tokens (all themes)

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#E87A3D` | CTAs, active states, FAB |
| `--primary-foreground` | `#FFFFFF` | Text on primary |
| `--destructive` | `#E57373` | Delete, expense accent |
| `--ring` | `#E87A3D` | Focus ring |

Additional Tailwind color tokens (hardcoded, not CSS vars):

| Token | Value | Usage |
|-------|-------|-------|
| `income` | `#5CB88A` | Income amounts, charts |
| `expense` | `#E57373` | Expense amounts, charts |
| `transfer` | `#6B4A9E` | Transfer type |
| `gold` | `#E8B547` | Sparkle gold, premium badges |
| `kintsugi` | `#D4A544` | Gold crack decorations |
| `cosmic-purple` | `#6B4A9E` | AI accents, cosmic tail |
| `cosmic-blue` | `#4A7FC1` | Charts, info |
| `blush` | `#FFB3C7` | Soft highlights |

#### Per-theme variables

| Theme ID | Name | `--background` | `--card` | `--border` | `--foreground` | `--muted-foreground` | `--secondary` | `--accent` | Dark? |
|----------|------|---------------|----------|------------|---------------|---------------------|--------------|-----------|-------|
| `warm` | อบอุ่น | `#FBF7F0` | `#FFFFFF` | `#EDE4D3` | `#2B2118` | `#A39685` | `#F8F2E7` | `#F5D9B8` | No |
| `warm-dark` | อบอุ่น (มืด) | `#1F1913` | `#2B2218` | `#4A3D30` | `#F5EDE0` | `#8A7E72` | `#3A2E22` | `#4A3D30` | Yes |
| `sakura` | ซากุระ | `#FFF5F5` | `#FFFFFF` | `#F5D5D5` | `#2B2118` | `#A39685` | `#FFF0F0` | `#FFE0E8` | No |
| `sakura-dark` | ซากุระ (มืด) | `#1F1517` | `#2B1E22` | `#4A3338` | `#F5EDE0` | `#8A7E72` | `#3A2530` | `#4A3338` | Yes |
| `ocean` | มหาสมุทร | `#F0F7FB` | `#FFFFFF` | `#D3E4ED` | `#2B2118` | `#A39685` | `#E8F2F8` | `#D0E8F5` | No |
| `ocean-dark` | มหาสมุทร (มืด) | `#131A1F` | `#182228` | `#304A50` | `#F5EDE0` | `#8A7E72` | `#1E2E38` | `#304A50` | Yes |
| `forest` | ป่าไม้ | `#F2F7F0` | `#FFFFFF` | `#D3E4CF` | `#2B2118` | `#A39685` | `#E8F2E5` | `#D0E8C8` | No |
| `forest-dark` | ป่าไม้ (มืด) | `#151F13` | `#1E2B1A` | `#334A30` | `#F5EDE0` | `#8A7E72` | `#253520` | `#334A30` | Yes |
| `midnight` | เที่ยงคืน | `#14141A` | `#1E1E28` | `#2E2E3A` | `#F5EDE0` | `#8A7E72` | `#252530` | `#2E2E3A` | Yes |

#### Derived per-theme variables (computed from above)

- `--card-foreground` = same as `--foreground`
- `--secondary-foreground` = same as `--foreground`
- `--muted` = same as `--secondary`
- `--accent-foreground` = same as `--foreground`

### 1.3 Files to change

| File | Change |
|------|--------|
| `global.css` | Replace all 9+1 theme blocks with 9 new MiawMoney theme blocks |
| `tailwind.config.js` | Add hardcoded color tokens (income, expense, transfer, gold, kintsugi, cosmic-purple, cosmic-blue, blush) |
| `lib/stores/theme-store.ts` | Update default theme from `'light'` to `'warm'` |
| `app/_layout.tsx` | Update `DARK_THEMES` array to `['warm-dark', 'sakura-dark', 'ocean-dark', 'forest-dark', 'midnight']` |
| `app/settings/theme.tsx` | Replace 9 theme options with new theme IDs and Thai names |

### 1.4 Theme picker UX

The existing grid of 9 themes stays but with new entries. Each card shows:
- Theme name in Thai
- Color preview: background + primary + accent swatches
- Active state: tabby-orange border ring

---

## 2. SVG Mascot Assets

### 2.1 Architecture

All SVGs are React Native components using `react-native-svg`. Stored in `assets/svg/` with barrel export.

```
assets/svg/
├── mascot/
│   ├── MiawMini.tsx
│   ├── MiawHero.tsx
│   ├── MiawThinking.tsx
│   ├── MiawSleeping.tsx
│   └── MiawCelebrating.tsx
├── decorations/
│   ├── GoldCracks.tsx
│   ├── Sparkles.tsx
│   ├── CosmicTail.tsx
│   └── PawPrint.tsx
└── index.ts
```

### 2.2 Type A — MiawMini

Lightweight SVG for use in cards, headers, tab hints, loading states.

**Default size:** 32-48px (configurable via `size` prop)

**Visual elements:**
- Circle head: fill `#E87A3D`
- Two triangle ears: fill `#E87A3D`, inner ear `#FFB3C7`
- Two round eyes: fill `#1A1A1A`, pupil highlight `#FFD84A`
- Blush cheeks: two circles `#FFB3C7` (opacity 0.6)
- Whiskers: 3 thin lines per side, stroke `#FFB3C7`
- Forehead mark: three short horizontal strokes `#E8B547` (王 pattern)
- Optional small body (when size > 40px)

**Props:**
```ts
interface MiawMiniProps {
  size?: number;           // default 32
  expression?: 'happy' | 'neutral' | 'sad';  // default 'happy'
}
```

**Expression variations:**
- `happy`: curved-up mouth, slightly squinted eyes
- `neutral`: straight mouth, round eyes
- `sad`: curved-down mouth, slightly tilted eyebrows

### 2.3 Type B — MiawHero

Detailed SVG for hero moments (splash, onboarding, empty state, achievement).

**Default size:** 160px (configurable via `size` prop)

**Visual elements (additive on top of Mini):**
- Full chubby body: fill `#E87A3D` with darker tiger stripes `#B8531E`
- Cream belly: `#F5D9B8`
- Four paws with pink paw pads `#FFB3C7`
- Fluffy tail (non-cosmic version)
- Forehead 王 mark: `#E8B547`

**Props:**
```ts
interface MiawHeroProps {
  size?: number;           // default 160
}
```

### 2.4 Type B Variants

**MiawThinking** (AI analysis / loading):
- Base: MiawHero sitting pose
- One paw raised to chin (thinking gesture)
- CosmicTail component attached (purple-blue gradient)
- Sparkles floating around head

**MiawSleeping** (Empty state):
- Base: MiawHero curled up pose
- Eyes closed (two curved lines)
- Small "zzz" text or sleep bubbles
- Subtle GoldCracks radiating behind (opacity 0.15)

**MiawCelebrating** (Achievement / success):
- Base: MiawHero standing pose
- Both paws raised up
- Wide happy mouth
- Sparkles and confetti dots around (cosmic-purple + cosmic-blue)
- GoldCracks burst pattern behind

### 2.5 Decorations

**GoldCracks:**
- Thin lines (1-1.5px stroke) in `#D4A544`
- Radiates from a center point outward with small dots at endpoints
- Props: `width`, `height`, `opacity` (default 0.2), `direction` ('radial' | 'horizontal')

**Sparkles:**
- Small star shapes (4-point or 6-point) in `#E8B547`
- Random positioning within bounds
- Props: `count` (default 5), `size` (default 6), `animated` (boolean, default false)
- When `animated=true`: gentle opacity pulse using reanimated

**CosmicTail:**
- Flowing curved path with gradient: `#6B4A9E` → `#4A7FC1`
- Small white dots (stars) scattered along the path
- Props: `width`, `height`

**PawPrint:**
- Cat paw shape: 1 large pad + 4 small toe pads
- Props: `size` (default 12), `color` (default `#E87A3D`), `filled` (default true)

### 2.6 Dependency

Requires `react-native-svg` — already available via Expo (no extra install needed).

---

## 3. Tab Bar

### 3.1 Changes to `app/(tabs)/_layout.tsx`

| Property | Before | After |
|----------|--------|-------|
| `tabBarActiveTintColor` | `#0891b2` (cyan) | `#E87A3D` (tabby-orange) |
| `tabBarInactiveTintColor` | `#999` | `#A39685` (text-muted) |
| `tabBarStyle.borderTopColor` | `#e5e5e5` | `var(--border)` via theme |
| `tabBarStyle.backgroundColor` | default | `var(--card)` via theme |

### 3.2 Paw print active indicator

Add `PawPrint` SVG (8px, filled, tabby-orange) below the active tab icon. Implementation: custom `tabBarIcon` render that includes the paw print when focused.

### 3.3 Tab definitions (unchanged names)

| name | title | icon |
|------|-------|------|
| `index` | รายการ | `list-outline` / `list` |
| `analytics` | สรุป | `pie-chart-outline` / `pie-chart` |
| `ai-analysis` | Premium | `diamond-outline` / `diamond` |
| `more` | ตั้งค่า | `settings-outline` / `settings` |

---

## 4. FAB (Floating Action Button)

### 4.1 Changes to `components/ui/FAB.tsx`

| Property | Before | After |
|----------|--------|-------|
| Size | 56px | 64px |
| Background | `bg-primary` (flat) | LinearGradient `#E87A3D` → `#B8531E` |
| Shadow | default | `0 8px 20px rgba(232,122,61,0.35)` |
| Icon size | default | 28px white |
| Cat ears | none | Two small triangles on top, same gradient |
| Press animation | scale + haptic | `scale(0.92)` + haptic (keep existing) |

### 4.2 Implementation

- Use `expo-linear-gradient` for the gradient background
- Cat ears: two absolute-positioned `View` triangles (CSS border trick) or small SVG triangles above the circle
- The overall shape: circle with two ear bumps above

---

## 5. Screen Updates

### 5.1 Dashboard — `app/(tabs)/index.tsx`

| Element | Change |
|---------|--------|
| Header | Add `MiawMini` (32px) next to title "รายการ" |
| Balance number | `text-3xl` → `text-4xl`, font-bold, color `--foreground` |
| WalletFilter pills | `rounded-full`, active border = tabby-orange |
| PeriodSelector | Active color cyan → tabby-orange |
| FrequentTransactions card | `rounded-2xl` (20px), add subtle `GoldCracks` at corner (opacity 0.15) |
| Transaction items | `rounded-2xl`, warm shadow |
| Empty state | Replace text-only with `MiawSleeping` SVG + speech bubble "ยังไม่มีรายการ — เริ่มบันทึกกับมิวกันเถอะ!" |
| AlertBanner | Accent color → `#F0A830` (warning-amber) |

### 5.2 Summary — `app/(tabs)/analytics.tsx`

| Element | Change |
|---------|--------|
| BalanceCard | `rounded-2xl`, add `Sparkles` (3 sparkles, size 4) near balance number |
| Tab selector | Pill shape, active = tabby-orange bg |
| BarChart colors | income `#5CB88A`, expense `#E57373` |
| PieChart colors | Warm category palette (food `#F5A185`, coffee `#B8856B`, transport `#8AC5C5`, etc.) |
| All cards | `rounded-2xl`, shadow `0 2px 12px rgba(43,33,24,0.06)` |

### 5.3 Premium — `app/(tabs)/ai-analysis.tsx`

| Element | Change |
|---------|--------|
| Paywall hero icon | Diamond icon → `MiawHero` SVG with `CosmicTail` + `GoldCracks` radiating |
| App name | "CeasFlow Premium" → "MiawMoney Premium" |
| Feature dividers | Add `GoldCracks` (horizontal, opacity 0.2) between feature rows |
| Package cards | `rounded-2xl` (20px), selected = tabby-orange border |
| Subscribe button | `rounded-full` (pill), gradient orange, warm shadow |
| "ประหยัด 40%" badge | `bg-green-500` → `#E8B547` (sparkle-gold), text dark |
| Inner tabs (AI/ข้อมูล) | Active color → tabby-orange |
| AI loading animation | Replace icon with `MiawThinking` SVG |

### 5.4 Settings — `app/(tabs)/more.tsx`

| Element | Change |
|---------|--------|
| Header | Add `MiawMini` (28px) next to "ตั้งค่า" |
| SettingsRow icon color | `#666` → `#6B5F52` (text-secondary) |
| Chevron color | `#ccc` → `#A39685` (text-muted) |
| SectionHeader text | color → `#A39685` |
| App name | "CeasFlow" → "MiawMoney" |

### 5.5 Theme Picker — `app/settings/theme.tsx`

Replace 9 theme entries with:

| Theme ID | Display name | Preview colors |
|----------|-------------|---------------|
| `warm` | อบอุ่น | paper `#FBF7F0` + orange `#E87A3D` + cream `#F5D9B8` |
| `warm-dark` | อบอุ่น (มืด) | brown `#1F1913` + orange `#E87A3D` + `#3A2E22` |
| `sakura` | ซากุระ | pink `#FFF5F5` + orange `#E87A3D` + `#FFE0E8` |
| `sakura-dark` | ซากุระ (มืด) | `#1F1517` + orange `#E87A3D` + `#3A2530` |
| `ocean` | มหาสมุทร | blue `#F0F7FB` + orange `#E87A3D` + `#D0E8F5` |
| `ocean-dark` | มหาสมุทร (มืด) | `#131A1F` + orange `#E87A3D` + `#1E2E38` |
| `forest` | ป่าไม้ | green `#F2F7F0` + orange `#E87A3D` + `#D0E8C8` |
| `forest-dark` | ป่าไม้ (มืด) | `#151F13` + orange `#E87A3D` + `#253520` |
| `midnight` | เที่ยงคืน | `#14141A` + orange `#E87A3D` + `#252530` |

Each card: 3 color circles preview + Thai name. Active = tabby-orange ring.

---

## 6. Files Changed Summary (Phase 1)

| File | Action | Priority |
|------|--------|----------|
| `global.css` | Rewrite all theme blocks | P0 |
| `tailwind.config.js` | Add new color tokens | P0 |
| `assets/svg/mascot/MiawMini.tsx` | Create new | P0 |
| `assets/svg/mascot/MiawHero.tsx` | Create new | P0 |
| `assets/svg/mascot/MiawThinking.tsx` | Create new | P1 |
| `assets/svg/mascot/MiawSleeping.tsx` | Create new | P1 |
| `assets/svg/mascot/MiawCelebrating.tsx` | Create new | P1 |
| `assets/svg/decorations/GoldCracks.tsx` | Create new | P0 |
| `assets/svg/decorations/Sparkles.tsx` | Create new | P0 |
| `assets/svg/decorations/CosmicTail.tsx` | Create new | P1 |
| `assets/svg/decorations/PawPrint.tsx` | Create new | P0 |
| `assets/svg/index.ts` | Create new | P0 |
| `lib/stores/theme-store.ts` | Change default to `'warm'` | P0 |
| `app/_layout.tsx` | Update DARK_THEMES array | P0 |
| `app/(tabs)/_layout.tsx` | Tab bar colors + paw print | P0 |
| `components/ui/FAB.tsx` | Redesign with ears + gradient | P0 |
| `app/(tabs)/index.tsx` | Dashboard UI updates | P1 |
| `app/(tabs)/analytics.tsx` | Summary UI updates | P1 |
| `app/(tabs)/ai-analysis.tsx` | Premium UI updates | P1 |
| `app/(tabs)/more.tsx` | Settings UI updates | P1 |
| `app/settings/theme.tsx` | Replace theme options | P1 |

**Total: 21 files** (11 new SVG files, 10 existing files modified)

---

## 7. Out of Scope (Phase 2)

- Font change (IBM Plex Sans Thai + Inter)
- Category color palette update in `lib/constants/categories.ts`
- Component-level updates (TransactionForm, CategoryPicker, CalculatorPad, etc.)
- Settings sub-screens (wallets, categories, alerts, data-transfer)
- Add Transaction modal redesign
- Achievement/streak screens
- Animated SVGs (Lottie or reanimated-based mascot animations)
- Onboarding / splash screen
