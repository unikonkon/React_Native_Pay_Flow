# MiawMoney Redesign Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the CeasFlow app into MiawMoney brand — new theme system (9 warm variations), SVG mascot assets, redesigned Tab Bar with paw-print indicator, cat-ear FAB, and updated 4 main screens + theme picker.

**Architecture:** CSS-variable-based theming via `global.css` → `tailwind.config.js` → NativeWind. SVG components using `react-native-svg` (already installed). All mascot/decoration SVGs are React components in `assets/svg/` with barrel export.

**Tech Stack:** React Native 0.81, Expo SDK 54, NativeWind v4, Tailwind 3.4, react-native-svg, expo-linear-gradient, react-native-reanimated.

**Spec:** `docs/superpowers/specs/2026-04-17-miawmoney-redesign-phase1-design.md`

---

## File Structure

### New files (11 SVG + 1 barrel)
```
assets/svg/
├── mascot/
│   ├── MiawMini.tsx          — Type A lightweight mascot (32-48px)
│   ├── MiawHero.tsx          — Type B detailed mascot (120-200px)
│   ├── MiawThinking.tsx      — Hero variant: thinking pose with cosmic tail
│   ├── MiawSleeping.tsx      — Hero variant: curled up sleeping
│   └── MiawCelebrating.tsx   — Hero variant: arms up celebrating
├── decorations/
│   ├── GoldCracks.tsx        — Kintsugi gold lines decoration
│   ├── Sparkles.tsx          — Gold sparkle dots
│   ├── CosmicTail.tsx        — Purple-blue gradient flowing tail
│   └── PawPrint.tsx          — Cat paw print shape
└── index.ts                  — Barrel re-export
```

### Modified files (10)
```
global.css                    — Replace 10 theme blocks with 9 MiawMoney variations
tailwind.config.js            — Add brand color tokens
lib/stores/theme-store.ts     — Default theme 'light' → 'warm'
app/_layout.tsx               — Update DARK_THEMES, lock screen branding
app/(tabs)/_layout.tsx        — Tab bar colors + paw print indicator
app/settings/theme.tsx        — New 9 theme entries
components/ui/FAB.tsx         — Cat ears + gradient + 64px
app/(tabs)/index.tsx          — Dashboard mascot + warm styling
app/(tabs)/analytics.tsx      — Summary warm styling
app/(tabs)/more.tsx           — Settings branding updates
```

---

### Task 1: Theme System — global.css

**Files:**
- Modify: `global.css` (replace entire content)

- [ ] **Step 1: Replace global.css with 9 MiawMoney theme blocks**

Replace the entire contents of `global.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* MiawMoney — อบอุ่น (default) */
:root {
  --background: #FBF7F0;
  --foreground: #2B2118;
  --card: #FFFFFF;
  --card-foreground: #2B2118;
  --primary: #E87A3D;
  --primary-foreground: #FFFFFF;
  --secondary: #F8F2E7;
  --secondary-foreground: #2B2118;
  --muted: #F8F2E7;
  --muted-foreground: #A39685;
  --accent: #F5D9B8;
  --accent-foreground: #2B2118;
  --destructive: #E57373;
  --border: #EDE4D3;
  --ring: #E87A3D;
}

/* MiawMoney — อบอุ่น (มืด) */
.warm-dark {
  --background: #1F1913;
  --foreground: #F5EDE0;
  --card: #2B2218;
  --card-foreground: #F5EDE0;
  --primary: #E87A3D;
  --primary-foreground: #FFFFFF;
  --secondary: #3A2E22;
  --secondary-foreground: #F5EDE0;
  --muted: #3A2E22;
  --muted-foreground: #8A7E72;
  --accent: #4A3D30;
  --accent-foreground: #F5EDE0;
  --destructive: #E57373;
  --border: #4A3D30;
  --ring: #E87A3D;
}

/* MiawMoney — ซากุระ */
.sakura {
  --background: #FFF5F5;
  --foreground: #2B2118;
  --card: #FFFFFF;
  --card-foreground: #2B2118;
  --primary: #E87A3D;
  --primary-foreground: #FFFFFF;
  --secondary: #FFF0F0;
  --secondary-foreground: #2B2118;
  --muted: #FFF0F0;
  --muted-foreground: #A39685;
  --accent: #FFE0E8;
  --accent-foreground: #2B2118;
  --destructive: #E57373;
  --border: #F5D5D5;
  --ring: #E87A3D;
}

/* MiawMoney — ซากุระ (มืด) */
.sakura-dark {
  --background: #1F1517;
  --foreground: #F5EDE0;
  --card: #2B1E22;
  --card-foreground: #F5EDE0;
  --primary: #E87A3D;
  --primary-foreground: #FFFFFF;
  --secondary: #3A2530;
  --secondary-foreground: #F5EDE0;
  --muted: #3A2530;
  --muted-foreground: #8A7E72;
  --accent: #4A3338;
  --accent-foreground: #F5EDE0;
  --destructive: #E57373;
  --border: #4A3338;
  --ring: #E87A3D;
}

/* MiawMoney — มหาสมุทร */
.ocean {
  --background: #F0F7FB;
  --foreground: #2B2118;
  --card: #FFFFFF;
  --card-foreground: #2B2118;
  --primary: #E87A3D;
  --primary-foreground: #FFFFFF;
  --secondary: #E8F2F8;
  --secondary-foreground: #2B2118;
  --muted: #E8F2F8;
  --muted-foreground: #A39685;
  --accent: #D0E8F5;
  --accent-foreground: #2B2118;
  --destructive: #E57373;
  --border: #D3E4ED;
  --ring: #E87A3D;
}

/* MiawMoney — มหาสมุทร (มืด) */
.ocean-dark {
  --background: #131A1F;
  --foreground: #F5EDE0;
  --card: #182228;
  --card-foreground: #F5EDE0;
  --primary: #E87A3D;
  --primary-foreground: #FFFFFF;
  --secondary: #1E2E38;
  --secondary-foreground: #F5EDE0;
  --muted: #1E2E38;
  --muted-foreground: #8A7E72;
  --accent: #304A50;
  --accent-foreground: #F5EDE0;
  --destructive: #E57373;
  --border: #304A50;
  --ring: #E87A3D;
}

/* MiawMoney — ป่าไม้ */
.forest {
  --background: #F2F7F0;
  --foreground: #2B2118;
  --card: #FFFFFF;
  --card-foreground: #2B2118;
  --primary: #E87A3D;
  --primary-foreground: #FFFFFF;
  --secondary: #E8F2E5;
  --secondary-foreground: #2B2118;
  --muted: #E8F2E5;
  --muted-foreground: #A39685;
  --accent: #D0E8C8;
  --accent-foreground: #2B2118;
  --destructive: #E57373;
  --border: #D3E4CF;
  --ring: #E87A3D;
}

/* MiawMoney — ป่าไม้ (มืด) */
.forest-dark {
  --background: #151F13;
  --foreground: #F5EDE0;
  --card: #1E2B1A;
  --card-foreground: #F5EDE0;
  --primary: #E87A3D;
  --primary-foreground: #FFFFFF;
  --secondary: #253520;
  --secondary-foreground: #F5EDE0;
  --muted: #253520;
  --muted-foreground: #8A7E72;
  --accent: #334A30;
  --accent-foreground: #F5EDE0;
  --destructive: #E57373;
  --border: #334A30;
  --ring: #E87A3D;
}

/* MiawMoney — เที่ยงคืน (OLED) */
.midnight {
  --background: #14141A;
  --foreground: #F5EDE0;
  --card: #1E1E28;
  --card-foreground: #F5EDE0;
  --primary: #E87A3D;
  --primary-foreground: #FFFFFF;
  --secondary: #252530;
  --secondary-foreground: #F5EDE0;
  --muted: #252530;
  --muted-foreground: #8A7E72;
  --accent: #2E2E3A;
  --accent-foreground: #F5EDE0;
  --destructive: #E57373;
  --border: #2E2E3A;
  --ring: #E87A3D;
}
```

- [ ] **Step 2: Verify the file has exactly 9 theme blocks (1 :root + 8 class selectors)**

Run: `grep -c '{' global.css`
Expected: 9 (one block per theme)

- [ ] **Step 3: Commit**

```bash
git add global.css
git commit -m "feat: replace 9 themes with MiawMoney brand variations"
```

---

### Task 2: Tailwind Config — Add Brand Color Tokens

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1: Update tailwind.config.js colors and remove old font family**

Replace the `colors` object inside `theme.extend` with:

```js
colors: {
  background: 'var(--background)',
  foreground: 'var(--foreground)',
  card: 'var(--card)',
  'card-foreground': 'var(--card-foreground)',
  primary: 'var(--primary)',
  'primary-foreground': 'var(--primary-foreground)',
  secondary: 'var(--secondary)',
  'secondary-foreground': 'var(--secondary-foreground)',
  muted: 'var(--muted)',
  'muted-foreground': 'var(--muted-foreground)',
  accent: 'var(--accent)',
  'accent-foreground': 'var(--accent-foreground)',
  destructive: 'var(--destructive)',
  border: 'var(--border)',
  ring: 'var(--ring)',
  // Semantic
  income: '#5CB88A',
  expense: '#E57373',
  transfer: '#6B4A9E',
  // MiawMoney brand
  gold: '#E8B547',
  kintsugi: '#D4A544',
  'cosmic-purple': '#6B4A9E',
  'cosmic-blue': '#4A7FC1',
  blush: '#FFB3C7',
  tabby: '#E87A3D',
  'tabby-deep': '#B8531E',
  'tabby-cream': '#F5D9B8',
},
```

Note: `income` changes from `#22C55E` to `#5CB88A`, `expense` from `#EF4444` to `#E57373`, `transfer` from `#A855F7` to `#6B4A9E`.

- [ ] **Step 2: Commit**

```bash
git add tailwind.config.js
git commit -m "feat: add MiawMoney brand color tokens to Tailwind config"
```

---

### Task 3: Theme Store + Root Layout

**Files:**
- Modify: `lib/stores/theme-store.ts`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Update theme-store default from 'light' to 'warm'**

In `lib/stores/theme-store.ts`, change two occurrences of `'light'`:

Line 14: `currentTheme: 'light'` → `currentTheme: 'warm'`
Line 19: `saved ?? 'light'` → `saved ?? 'warm'`

- [ ] **Step 2: Update DARK_THEMES in app/_layout.tsx**

In `app/_layout.tsx`, line 24:

Change:
```ts
const DARK_THEMES = ['dark'];
```
To:
```ts
const DARK_THEMES = ['warm-dark', 'sakura-dark', 'ocean-dark', 'forest-dark', 'midnight'];
```

- [ ] **Step 3: Update lock screen branding in app/_layout.tsx**

In `app/_layout.tsx`, update the lock screen (lines 84-95). Change:
- `backgroundColor: '#f5f5f5'` → `backgroundColor: '#FBF7F0'`
- `color="#0891b2"` → `color="#E87A3D"`
- `CeasFlow` → `MiawMoney`
- `backgroundColor: '#0891b2'` → `backgroundColor: '#E87A3D'`

The lock screen block becomes:
```tsx
<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FBF7F0' }}>
  <Ionicons name="lock-closed" size={64} color="#E87A3D" />
  <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 16, color: '#2B2118' }}>MiawMoney</Text>
  <Text style={{ fontSize: 14, color: '#6B5F52', marginTop: 4 }}>กรุณาปลดล็อกเพื่อใช้งาน</Text>
  <Pressable
    onPress={handleUnlock}
    style={{ marginTop: 24, paddingHorizontal: 32, paddingVertical: 12, backgroundColor: '#E87A3D', borderRadius: 999 }}
  >
    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>ปลดล็อก</Text>
  </Pressable>
</View>
```

- [ ] **Step 4: Update className logic for default theme**

In `app/_layout.tsx`, line 101, the current logic skips className for `'light'` theme. Update for `'warm'`:

Change:
```tsx
className={currentTheme !== 'light' ? currentTheme : undefined}
```
To:
```tsx
className={currentTheme !== 'warm' ? currentTheme : undefined}
```

Since `warm` is the `:root` default, it doesn't need a class.

- [ ] **Step 5: Commit**

```bash
git add lib/stores/theme-store.ts app/_layout.tsx
git commit -m "feat: update theme store default and root layout for MiawMoney"
```

---

### Task 4: SVG Decorations — PawPrint, GoldCracks, Sparkles, CosmicTail

**Files:**
- Create: `assets/svg/decorations/PawPrint.tsx`
- Create: `assets/svg/decorations/GoldCracks.tsx`
- Create: `assets/svg/decorations/Sparkles.tsx`
- Create: `assets/svg/decorations/CosmicTail.tsx`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p "assets/svg/mascot" "assets/svg/decorations"
```

- [ ] **Step 2: Create PawPrint.tsx**

```tsx
import Svg, { Circle } from 'react-native-svg';

interface PawPrintProps {
  size?: number;
  color?: string;
}

export function PawPrint({ size = 12, color = '#E87A3D' }: PawPrintProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      {/* Main pad */}
      <Circle cx="12" cy="16" r="5" fill={color} />
      {/* Toe pads */}
      <Circle cx="7" cy="8" r="2.8" fill={color} />
      <Circle cx="12" cy="5.5" r="2.5" fill={color} />
      <Circle cx="17" cy="8" r="2.8" fill={color} />
      <Circle cx="4.5" cy="12.5" r="2.2" fill={color} />
    </Svg>
  );
}
```

- [ ] **Step 3: Create GoldCracks.tsx**

```tsx
import Svg, { Line, Circle } from 'react-native-svg';

interface GoldCracksProps {
  width?: number;
  height?: number;
  opacity?: number;
  direction?: 'radial' | 'horizontal';
}

export function GoldCracks({ width = 100, height = 40, opacity = 0.2, direction = 'horizontal' }: GoldCracksProps) {
  const color = '#D4A544';

  if (direction === 'horizontal') {
    return (
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line x1="0" y1={height / 2} x2={width * 0.35} y2={height * 0.3} stroke={color} strokeWidth={1} opacity={opacity} />
        <Line x1={width * 0.35} y1={height * 0.3} x2={width * 0.6} y2={height * 0.6} stroke={color} strokeWidth={0.8} opacity={opacity} />
        <Line x1={width * 0.6} y1={height * 0.6} x2={width} y2={height * 0.45} stroke={color} strokeWidth={1} opacity={opacity} />
        <Circle cx={width * 0.35} cy={height * 0.3} r={1.5} fill={color} opacity={opacity} />
        <Circle cx={width * 0.6} cy={height * 0.6} r={1.2} fill={color} opacity={opacity} />
        <Circle cx={width} cy={height * 0.45} r={1} fill={color} opacity={opacity} />
      </Svg>
    );
  }

  // Radial: lines from center outward
  const cx = width / 2;
  const cy = height / 2;
  const lines = [
    { x: cx - width * 0.4, y: cy - height * 0.3 },
    { x: cx + width * 0.35, y: cy - height * 0.35 },
    { x: cx - width * 0.3, y: cy + height * 0.4 },
    { x: cx + width * 0.4, y: cy + height * 0.3 },
    { x: cx - width * 0.15, y: cy - height * 0.45 },
    { x: cx + width * 0.1, y: cy + height * 0.45 },
  ];

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {lines.map((pt, i) => (
        <Line key={`l${i}`} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke={color} strokeWidth={0.8} opacity={opacity} />
      ))}
      {lines.map((pt, i) => (
        <Circle key={`c${i}`} cx={pt.x} cy={pt.y} r={1.2} fill={color} opacity={opacity} />
      ))}
    </Svg>
  );
}
```

- [ ] **Step 4: Create Sparkles.tsx**

```tsx
import Svg, { Path } from 'react-native-svg';
import { View } from 'react-native';

interface SparklesProps {
  count?: number;
  size?: number;
  color?: string;
  width?: number;
  height?: number;
}

function StarShape({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  // 4-point star
  const d = `M${x},${y - s} L${x + s * 0.3},${y - s * 0.3} L${x + s},${y} L${x + s * 0.3},${y + s * 0.3} L${x},${y + s} L${x - s * 0.3},${y + s * 0.3} L${x - s},${y} L${x - s * 0.3},${y - s * 0.3} Z`;
  return <Path d={d} fill={color} />;
}

// Simple seeded random for consistent layout
function seededPositions(count: number, w: number, h: number) {
  const positions: { x: number; y: number; scale: number }[] = [];
  for (let i = 0; i < count; i++) {
    const seed = (i * 7 + 13) % 100;
    positions.push({
      x: (seed / 100) * (w - 12) + 6,
      y: ((i * 31 + 7) % 100) / 100 * (h - 12) + 6,
      scale: 0.6 + (seed % 5) * 0.1,
    });
  }
  return positions;
}

export function Sparkles({ count = 5, size = 6, color = '#E8B547', width = 60, height = 40 }: SparklesProps) {
  const positions = seededPositions(count, width, height);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {positions.map((p, i) => (
          <StarShape key={i} x={p.x} y={p.y} s={size * p.scale} color={color} />
        ))}
      </Svg>
    </View>
  );
}
```

- [ ] **Step 5: Create CosmicTail.tsx**

```tsx
import Svg, { Defs, LinearGradient, Stop, Path, Circle } from 'react-native-svg';

interface CosmicTailProps {
  width?: number;
  height?: number;
}

export function CosmicTail({ width = 80, height = 60 }: CosmicTailProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 80 60">
      <Defs>
        <LinearGradient id="cosmicGrad" x1="0" y1="0" x2="1" y2="0.5">
          <Stop offset="0" stopColor="#6B4A9E" />
          <Stop offset="0.5" stopColor="#5B6DB8" />
          <Stop offset="1" stopColor="#4A7FC1" />
        </LinearGradient>
      </Defs>
      {/* Flowing tail path */}
      <Path
        d="M5,30 Q20,10 40,25 Q55,38 70,15 Q75,8 78,12"
        stroke="url(#cosmicGrad)"
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
        opacity={0.8}
      />
      <Path
        d="M5,30 Q20,10 40,25 Q55,38 70,15 Q75,8 78,12"
        stroke="url(#cosmicGrad)"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        opacity={0.4}
      />
      {/* Star dots */}
      <Circle cx="25" cy="15" r="1.2" fill="white" opacity={0.8} />
      <Circle cx="45" cy="30" r="1" fill="white" opacity={0.7} />
      <Circle cx="60" cy="18" r="1.5" fill="white" opacity={0.9} />
      <Circle cx="72" cy="12" r="0.8" fill="white" opacity={0.6} />
      <Circle cx="35" cy="22" r="0.8" fill="white" opacity={0.5} />
    </Svg>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add assets/svg/decorations/
git commit -m "feat: add SVG decoration components (PawPrint, GoldCracks, Sparkles, CosmicTail)"
```

---

### Task 5: SVG Mascot — MiawMini

**Files:**
- Create: `assets/svg/mascot/MiawMini.tsx`

- [ ] **Step 1: Create MiawMini.tsx**

```tsx
import Svg, { Circle, Ellipse, G, Line, Path, Polygon } from 'react-native-svg';

interface MiawMiniProps {
  size?: number;
  expression?: 'happy' | 'neutral' | 'sad';
}

export function MiawMini({ size = 32, expression = 'happy' }: MiawMiniProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Left ear */}
      <Polygon points="12,24 20,4 28,22" fill="#E87A3D" />
      <Polygon points="16,22 20,10 24,22" fill="#FFB3C7" opacity={0.6} />
      {/* Right ear */}
      <Polygon points="36,22 44,4 52,24" fill="#E87A3D" />
      <Polygon points="40,22 44,10 48,22" fill="#FFB3C7" opacity={0.6} />

      {/* Head */}
      <Circle cx="32" cy="36" r="22" fill="#E87A3D" />

      {/* Forehead 王 mark */}
      <G opacity={0.85}>
        <Line x1="27" y1="20" x2="37" y2="20" stroke="#E8B547" strokeWidth={1.8} strokeLinecap="round" />
        <Line x1="28" y1="23.5" x2="36" y2="23.5" stroke="#E8B547" strokeWidth={1.5} strokeLinecap="round" />
        <Line x1="29" y1="27" x2="35" y2="27" stroke="#E8B547" strokeWidth={1.2} strokeLinecap="round" />
      </G>

      {/* Eyes */}
      {expression === 'happy' ? (
        <>
          {/* Squinted happy eyes */}
          <Path d="M22,34 Q25,31 28,34" stroke="#1A1A1A" strokeWidth={2.2} fill="none" strokeLinecap="round" />
          <Path d="M36,34 Q39,31 42,34" stroke="#1A1A1A" strokeWidth={2.2} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* Round eyes */}
          <Circle cx="25" cy="34" r="3.5" fill="#1A1A1A" />
          <Circle cx="39" cy="34" r="3.5" fill="#1A1A1A" />
          <Circle cx="26" cy="33" r="1.2" fill="#FFD84A" />
          <Circle cx="40" cy="33" r="1.2" fill="#FFD84A" />
        </>
      )}

      {/* Blush cheeks */}
      <Ellipse cx="18" cy="39" rx="4" ry="2.5" fill="#FFB3C7" opacity={0.5} />
      <Ellipse cx="46" cy="39" rx="4" ry="2.5" fill="#FFB3C7" opacity={0.5} />

      {/* Nose */}
      <Ellipse cx="32" cy="38.5" rx="1.8" ry="1.3" fill="#B8531E" />

      {/* Mouth */}
      {expression === 'sad' ? (
        <Path d="M28,44 Q32,41 36,44" stroke="#B8531E" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      ) : expression === 'happy' ? (
        <Path d="M28,42 Q32,46 36,42" stroke="#B8531E" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      ) : (
        <Line x1="29" y1="43" x2="35" y2="43" stroke="#B8531E" strokeWidth={1.2} strokeLinecap="round" />
      )}

      {/* Whiskers */}
      <G opacity={0.4} stroke="#FFB3C7" strokeWidth={0.8}>
        <Line x1="6" y1="35" x2="18" y2="37" />
        <Line x1="5" y1="39" x2="18" y2="39" />
        <Line x1="6" y1="43" x2="18" y2="41" />
        <Line x1="46" y1="37" x2="58" y2="35" />
        <Line x1="46" y1="39" x2="59" y2="39" />
        <Line x1="46" y1="41" x2="58" y2="43" />
      </G>
    </Svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/svg/mascot/MiawMini.tsx
git commit -m "feat: add MiawMini SVG mascot component"
```

---

### Task 6: SVG Mascot — MiawHero + Variants

**Files:**
- Create: `assets/svg/mascot/MiawHero.tsx`
- Create: `assets/svg/mascot/MiawThinking.tsx`
- Create: `assets/svg/mascot/MiawSleeping.tsx`
- Create: `assets/svg/mascot/MiawCelebrating.tsx`

- [ ] **Step 1: Create MiawHero.tsx**

```tsx
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

interface MiawHeroProps {
  size?: number;
}

export function MiawHero({ size = 160 }: MiawHeroProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ears */}
      <Polygon points="50,70 65,20 80,65" fill="#E87A3D" />
      <Polygon points="56,65 65,30 74,65" fill="#FFB3C7" opacity={0.5} />
      <Polygon points="120,65 135,20 150,70" fill="#E87A3D" />
      <Polygon points="126,65 135,30 144,65" fill="#FFB3C7" opacity={0.5} />

      {/* Body */}
      <Ellipse cx="100" cy="150" rx="45" ry="40" fill="#E87A3D" />
      {/* Tiger stripes on body */}
      <Path d="M75,135 Q80,130 85,135" stroke="#B8531E" strokeWidth={2} fill="none" opacity={0.5} />
      <Path d="M90,128 Q95,123 100,128" stroke="#B8531E" strokeWidth={2} fill="none" opacity={0.5} />
      <Path d="M105,132 Q110,127 115,132" stroke="#B8531E" strokeWidth={2} fill="none" opacity={0.5} />
      {/* Belly */}
      <Ellipse cx="100" cy="158" rx="28" ry="22" fill="#F5D9B8" />

      {/* Head */}
      <Circle cx="100" cy="85" r="35" fill="#E87A3D" />
      {/* Forehead stripes */}
      <Path d="M88,58 Q92,55 96,58" stroke="#B8531E" strokeWidth={1.5} fill="none" opacity={0.5} />
      <Path d="M104,58 Q108,55 112,58" stroke="#B8531E" strokeWidth={1.5} fill="none" opacity={0.5} />

      {/* 王 mark */}
      <G opacity={0.85}>
        <Line x1="90" y1="62" x2="110" y2="62" stroke="#E8B547" strokeWidth={2.5} strokeLinecap="round" />
        <Line x1="92" y1="67" x2="108" y2="67" stroke="#E8B547" strokeWidth={2} strokeLinecap="round" />
        <Line x1="94" y1="72" x2="106" y2="72" stroke="#E8B547" strokeWidth={1.8} strokeLinecap="round" />
      </G>

      {/* Eyes */}
      <Circle cx="87" cy="82" r="5" fill="#1A1A1A" />
      <Circle cx="113" cy="82" r="5" fill="#1A1A1A" />
      <Circle cx="88.5" cy="80.5" r="2" fill="#FFD84A" />
      <Circle cx="114.5" cy="80.5" r="2" fill="#FFD84A" />
      <Circle cx="89.5" cy="79.5" r="0.8" fill="white" />
      <Circle cx="115.5" cy="79.5" r="0.8" fill="white" />

      {/* Blush */}
      <Ellipse cx="75" cy="90" rx="6" ry="3.5" fill="#FFB3C7" opacity={0.45} />
      <Ellipse cx="125" cy="90" rx="6" ry="3.5" fill="#FFB3C7" opacity={0.45} />

      {/* Nose */}
      <Ellipse cx="100" cy="90" rx="3" ry="2" fill="#B8531E" />
      {/* Mouth */}
      <Path d="M93,96 Q100,102 107,96" stroke="#B8531E" strokeWidth={1.5} fill="none" strokeLinecap="round" />

      {/* Whiskers */}
      <G opacity={0.35} stroke="#FFB3C7" strokeWidth={1}>
        <Line x1="55" y1="84" x2="78" y2="88" />
        <Line x1="53" y1="90" x2="78" y2="90" />
        <Line x1="55" y1="96" x2="78" y2="92" />
        <Line x1="122" y1="88" x2="145" y2="84" />
        <Line x1="122" y1="90" x2="147" y2="90" />
        <Line x1="122" y1="92" x2="145" y2="96" />
      </G>

      {/* Paws */}
      <Ellipse cx="70" cy="180" rx="12" ry="8" fill="#E87A3D" />
      <Ellipse cx="130" cy="180" rx="12" ry="8" fill="#E87A3D" />
      {/* Paw pads */}
      <Circle cx="70" cy="182" r="3.5" fill="#FFB3C7" opacity={0.6} />
      <Circle cx="130" cy="182" r="3.5" fill="#FFB3C7" opacity={0.6} />

      {/* Tail */}
      <Path d="M145,155 Q165,140 160,120 Q155,105 165,95" stroke="#E87A3D" strokeWidth={8} fill="none" strokeLinecap="round" />
      <Path d="M145,155 Q165,140 160,120 Q155,105 165,95" stroke="#B8531E" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.3} />
    </Svg>
  );
}
```

- [ ] **Step 2: Create MiawThinking.tsx**

```tsx
import Svg, { Circle, Ellipse, G, Line, Path, Polygon } from 'react-native-svg';
import { View } from 'react-native';
import { CosmicTail } from '../decorations/CosmicTail';
import { Sparkles } from '../decorations/Sparkles';

interface MiawThinkingProps {
  size?: number;
}

export function MiawThinking({ size = 160 }: MiawThinkingProps) {
  return (
    <View style={{ width: size + 40, height: size, alignItems: 'center' }}>
      {/* Sparkles above head */}
      <View style={{ position: 'absolute', top: 0, left: size * 0.15, zIndex: 1 }}>
        <Sparkles count={4} size={5} width={size * 0.7} height={30} />
      </View>

      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* Ears */}
        <Polygon points="50,70 65,20 80,65" fill="#E87A3D" />
        <Polygon points="56,65 65,30 74,65" fill="#FFB3C7" opacity={0.5} />
        <Polygon points="120,65 135,20 150,70" fill="#E87A3D" />
        <Polygon points="126,65 135,30 144,65" fill="#FFB3C7" opacity={0.5} />

        {/* Body */}
        <Ellipse cx="100" cy="150" rx="45" ry="40" fill="#E87A3D" />
        <Ellipse cx="100" cy="158" rx="28" ry="22" fill="#F5D9B8" />

        {/* Head */}
        <Circle cx="100" cy="85" r="35" fill="#E87A3D" />

        {/* 王 mark */}
        <G opacity={0.85}>
          <Line x1="90" y1="62" x2="110" y2="62" stroke="#E8B547" strokeWidth={2.5} strokeLinecap="round" />
          <Line x1="92" y1="67" x2="108" y2="67" stroke="#E8B547" strokeWidth={2} strokeLinecap="round" />
          <Line x1="94" y1="72" x2="106" y2="72" stroke="#E8B547" strokeWidth={1.8} strokeLinecap="round" />
        </G>

        {/* Thinking eyes — looking up */}
        <Circle cx="87" cy="80" r="5" fill="#1A1A1A" />
        <Circle cx="113" cy="80" r="5" fill="#1A1A1A" />
        <Circle cx="89" cy="78" r="2" fill="#FFD84A" />
        <Circle cx="115" cy="78" r="2" fill="#FFD84A" />

        {/* Blush */}
        <Ellipse cx="75" cy="90" rx="6" ry="3.5" fill="#FFB3C7" opacity={0.45} />
        <Ellipse cx="125" cy="90" rx="6" ry="3.5" fill="#FFB3C7" opacity={0.45} />

        {/* Nose + small mouth */}
        <Ellipse cx="100" cy="90" rx="3" ry="2" fill="#B8531E" />
        <Path d="M96,96 Q100,98 104,96" stroke="#B8531E" strokeWidth={1.2} fill="none" strokeLinecap="round" />

        {/* Whiskers */}
        <G opacity={0.35} stroke="#FFB3C7" strokeWidth={1}>
          <Line x1="55" y1="84" x2="78" y2="88" />
          <Line x1="53" y1="90" x2="78" y2="90" />
          <Line x1="122" y1="88" x2="145" y2="84" />
          <Line x1="122" y1="90" x2="147" y2="90" />
        </G>

        {/* Right paw raised to chin (thinking) */}
        <Ellipse cx="130" cy="105" rx="10" ry="8" fill="#E87A3D" />
        <Circle cx="130" cy="107" r="3" fill="#FFB3C7" opacity={0.5} />
        {/* Left paw resting */}
        <Ellipse cx="70" cy="180" rx="12" ry="8" fill="#E87A3D" />
        <Ellipse cx="130" cy="180" rx="12" ry="8" fill="#E87A3D" />
      </Svg>

      {/* Cosmic tail */}
      <View style={{ position: 'absolute', right: -20, bottom: size * 0.15 }}>
        <CosmicTail width={70} height={50} />
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Create MiawSleeping.tsx**

```tsx
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Text as SvgText } from 'react-native-svg';

interface MiawSleepingProps {
  size?: number;
}

export function MiawSleeping({ size = 160 }: MiawSleepingProps) {
  return (
    <Svg width={size} height={size * 0.7} viewBox="0 0 200 140">
      {/* Curled body */}
      <Ellipse cx="100" cy="90" rx="60" ry="40" fill="#E87A3D" />
      {/* Tiger stripes */}
      <Path d="M60,80 Q65,75 70,80" stroke="#B8531E" strokeWidth={2} fill="none" opacity={0.4} />
      <Path d="M80,72 Q85,67 90,72" stroke="#B8531E" strokeWidth={2} fill="none" opacity={0.4} />
      {/* Belly peeking */}
      <Ellipse cx="110" cy="100" rx="25" ry="18" fill="#F5D9B8" />

      {/* Head resting on paws */}
      <Circle cx="65" cy="75" r="28" fill="#E87A3D" />

      {/* Ears (folded) */}
      <Polygon points="42,55 50,35 58,52" fill="#E87A3D" />
      <Polygon points="46,52 50,40 54,52" fill="#FFB3C7" opacity={0.5} />
      <Polygon points="72,52 80,35 88,55" fill="#E87A3D" />
      <Polygon points="76,52 80,40 84,52" fill="#FFB3C7" opacity={0.5} />

      {/* 王 mark */}
      <G opacity={0.7}>
        <Line x1="57" y1="52" x2="73" y2="52" stroke="#E8B547" strokeWidth={2} strokeLinecap="round" />
        <Line x1="59" y1="56" x2="71" y2="56" stroke="#E8B547" strokeWidth={1.5} strokeLinecap="round" />
      </G>

      {/* Closed eyes */}
      <Path d="M52,72 Q55,69 58,72" stroke="#1A1A1A" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M72,72 Q75,69 78,72" stroke="#1A1A1A" strokeWidth={2} fill="none" strokeLinecap="round" />

      {/* Blush */}
      <Ellipse cx="48" cy="78" rx="4" ry="2.5" fill="#FFB3C7" opacity={0.45} />
      <Ellipse cx="82" cy="78" rx="4" ry="2.5" fill="#FFB3C7" opacity={0.45} />

      {/* Nose */}
      <Ellipse cx="65" cy="77" rx="2" ry="1.5" fill="#B8531E" />

      {/* Paws under head */}
      <Ellipse cx="55" cy="95" rx="10" ry="6" fill="#E87A3D" />
      <Ellipse cx="75" cy="95" rx="10" ry="6" fill="#E87A3D" />
      <Circle cx="55" cy="96" r="2.5" fill="#FFB3C7" opacity={0.5} />
      <Circle cx="75" cy="96" r="2.5" fill="#FFB3C7" opacity={0.5} />

      {/* Tail curled around */}
      <Path d="M155,85 Q170,60 155,45 Q140,35 130,50" stroke="#E87A3D" strokeWidth={7} fill="none" strokeLinecap="round" />

      {/* Zzz */}
      <SvgText x="100" y="40" fill="#A39685" fontSize={14} fontWeight="bold" opacity={0.5}>z</SvgText>
      <SvgText x="115" y="28" fill="#A39685" fontSize={18} fontWeight="bold" opacity={0.4}>z</SvgText>
      <SvgText x="132" y="15" fill="#A39685" fontSize={22} fontWeight="bold" opacity={0.3}>z</SvgText>
    </Svg>
  );
}
```

- [ ] **Step 4: Create MiawCelebrating.tsx**

```tsx
import Svg, { Circle, Ellipse, G, Line, Path, Polygon } from 'react-native-svg';
import { View } from 'react-native';
import { Sparkles } from '../decorations/Sparkles';

interface MiawCelebratingProps {
  size?: number;
}

export function MiawCelebrating({ size = 160 }: MiawCelebratingProps) {
  return (
    <View style={{ width: size + 20, height: size + 20, alignItems: 'center' }}>
      {/* Sparkles and confetti */}
      <View style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
        <Sparkles count={6} size={6} width={size + 20} height={size * 0.4} />
      </View>

      <Svg width={size} height={size} viewBox="0 0 200 200" style={{ marginTop: 10 }}>
        {/* Ears */}
        <Polygon points="50,70 65,20 80,65" fill="#E87A3D" />
        <Polygon points="56,65 65,30 74,65" fill="#FFB3C7" opacity={0.5} />
        <Polygon points="120,65 135,20 150,70" fill="#E87A3D" />
        <Polygon points="126,65 135,30 144,65" fill="#FFB3C7" opacity={0.5} />

        {/* Body */}
        <Ellipse cx="100" cy="150" rx="45" ry="40" fill="#E87A3D" />
        <Ellipse cx="100" cy="158" rx="28" ry="22" fill="#F5D9B8" />

        {/* Head */}
        <Circle cx="100" cy="85" r="35" fill="#E87A3D" />

        {/* 王 mark */}
        <G opacity={0.85}>
          <Line x1="90" y1="62" x2="110" y2="62" stroke="#E8B547" strokeWidth={2.5} strokeLinecap="round" />
          <Line x1="92" y1="67" x2="108" y2="67" stroke="#E8B547" strokeWidth={2} strokeLinecap="round" />
          <Line x1="94" y1="72" x2="106" y2="72" stroke="#E8B547" strokeWidth={1.8} strokeLinecap="round" />
        </G>

        {/* Happy squinted eyes */}
        <Path d="M82,82 Q87,77 92,82" stroke="#1A1A1A" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <Path d="M108,82 Q113,77 118,82" stroke="#1A1A1A" strokeWidth={2.5} fill="none" strokeLinecap="round" />

        {/* Big blush */}
        <Ellipse cx="75" cy="90" rx="7" ry="4" fill="#FFB3C7" opacity={0.5} />
        <Ellipse cx="125" cy="90" rx="7" ry="4" fill="#FFB3C7" opacity={0.5} />

        {/* Nose */}
        <Ellipse cx="100" cy="90" rx="3" ry="2" fill="#B8531E" />
        {/* Wide happy mouth */}
        <Path d="M90,96 Q100,106 110,96" stroke="#B8531E" strokeWidth={1.8} fill="none" strokeLinecap="round" />

        {/* Whiskers */}
        <G opacity={0.35} stroke="#FFB3C7" strokeWidth={1}>
          <Line x1="55" y1="84" x2="78" y2="88" />
          <Line x1="53" y1="90" x2="78" y2="90" />
          <Line x1="122" y1="88" x2="145" y2="84" />
          <Line x1="122" y1="90" x2="147" y2="90" />
        </G>

        {/* Arms raised up! */}
        <Ellipse cx="55" cy="115" rx="10" ry="8" fill="#E87A3D" transform="rotate(-30 55 115)" />
        <Circle cx="48" cy="108" r="3" fill="#FFB3C7" opacity={0.5} />
        <Ellipse cx="145" cy="115" rx="10" ry="8" fill="#E87A3D" transform="rotate(30 145 115)" />
        <Circle cx="152" cy="108" r="3" fill="#FFB3C7" opacity={0.5} />

        {/* Paws at bottom */}
        <Ellipse cx="80" cy="182" rx="12" ry="8" fill="#E87A3D" />
        <Ellipse cx="120" cy="182" rx="12" ry="8" fill="#E87A3D" />

        {/* Confetti dots */}
        <Circle cx="40" cy="45" r="3" fill="#6B4A9E" opacity={0.6} />
        <Circle cx="160" cy="50" r="2.5" fill="#4A7FC1" opacity={0.6} />
        <Circle cx="50" cy="30" r="2" fill="#E8B547" opacity={0.7} />
        <Circle cx="150" cy="35" r="2" fill="#FFB3C7" opacity={0.6} />
        <Circle cx="170" cy="70" r="1.8" fill="#6B4A9E" opacity={0.5} />
        <Circle cx="30" cy="65" r="2.2" fill="#4A7FC1" opacity={0.5} />
      </Svg>
    </View>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add assets/svg/mascot/
git commit -m "feat: add MiawHero, MiawThinking, MiawSleeping, MiawCelebrating SVG components"
```

---

### Task 7: SVG Barrel Export

**Files:**
- Create: `assets/svg/index.ts`

- [ ] **Step 1: Create barrel export**

```ts
// Mascot
export { MiawMini } from './mascot/MiawMini';
export { MiawHero } from './mascot/MiawHero';
export { MiawThinking } from './mascot/MiawThinking';
export { MiawSleeping } from './mascot/MiawSleeping';
export { MiawCelebrating } from './mascot/MiawCelebrating';

// Decorations
export { GoldCracks } from './decorations/GoldCracks';
export { Sparkles } from './decorations/Sparkles';
export { CosmicTail } from './decorations/CosmicTail';
export { PawPrint } from './decorations/PawPrint';
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add assets/svg/index.ts
git commit -m "feat: add SVG barrel export"
```

---

### Task 8: Tab Bar — Colors + PawPrint Indicator

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Rewrite _layout.tsx with paw print indicator**

Replace the entire file with:

```tsx
import { HapticTab } from '@/components/layout/HapticTab';
import { PawPrint } from '@/assets/svg';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

function TabIcon({ name, color, size, focused }: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Ionicons name={name} size={size} color={color} />
      {focused && (
        <View style={{ marginTop: 2 }}>
          <PawPrint size={8} color="#E87A3D" />
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: '#E87A3D',
        tabBarInactiveTintColor: '#A39685',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#EDE4D3',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'รายการ',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? 'list' : 'list-outline'} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'สรุป',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? 'pie-chart' : 'pie-chart-outline'} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-analysis"
        options={{
          title: 'Premium',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? 'diamond' : 'diamond-outline'} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'ตั้งค่า',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? 'settings' : 'settings-outline'} color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/_layout.tsx"
git commit -m "feat: update tab bar with MiawMoney colors and paw print indicator"
```

---

### Task 9: FAB — Cat Ears + Gradient

**Files:**
- Modify: `components/ui/FAB.tsx`

- [ ] **Step 1: Rewrite FAB.tsx with cat ears and gradient**

Replace the entire file with:

```tsx
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface FABProps {
  onPress: () => void;
}

export function FAB({ onPress }: FABProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      className="absolute bottom-6 right-6"
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.92 : 1 }] })}
    >
      {/* Cat ears */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: -8, zIndex: 1 }}>
        <View style={{
          width: 0, height: 0,
          borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 14,
          borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#E87A3D',
          marginRight: 20,
        }} />
        <View style={{
          width: 0, height: 0,
          borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 14,
          borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#E87A3D',
        }} />
      </View>
      {/* Main circle */}
      <LinearGradient
        colors={['#E87A3D', '#B8531E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#E87A3D',
          shadowOpacity: 0.35,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </LinearGradient>
    </Pressable>
  );
}
```

- [ ] **Step 2: Verify expo-linear-gradient is available**

Run: `grep 'expo-linear-gradient' package.json`

If NOT found, run: `npx expo install expo-linear-gradient`

- [ ] **Step 3: Commit**

```bash
git add components/ui/FAB.tsx
git commit -m "feat: redesign FAB with cat ears and gradient"
```

---

### Task 10: Theme Picker — 9 New Themes

**Files:**
- Modify: `app/settings/theme.tsx`

- [ ] **Step 1: Rewrite theme.tsx with MiawMoney themes**

Replace the `THEMES` array (lines 7-17) with:

```ts
const THEMES = [
  { key: 'warm', name: 'อบอุ่น', bg: '#FBF7F0', primary: '#E87A3D', accent: '#F5D9B8' },
  { key: 'warm-dark', name: 'อบอุ่น (มืด)', bg: '#1F1913', primary: '#E87A3D', accent: '#3A2E22' },
  { key: 'sakura', name: 'ซากุระ', bg: '#FFF5F5', primary: '#E87A3D', accent: '#FFE0E8' },
  { key: 'sakura-dark', name: 'ซากุระ (มืด)', bg: '#1F1517', primary: '#E87A3D', accent: '#3A2530' },
  { key: 'ocean', name: 'มหาสมุทร', bg: '#F0F7FB', primary: '#E87A3D', accent: '#D0E8F5' },
  { key: 'ocean-dark', name: 'มหาสมุทร (มืด)', bg: '#131A1F', primary: '#E87A3D', accent: '#1E2E38' },
  { key: 'forest', name: 'ป่าไม้', bg: '#F2F7F0', primary: '#E87A3D', accent: '#D0E8C8' },
  { key: 'forest-dark', name: 'ป่าไม้ (มืด)', bg: '#151F13', primary: '#E87A3D', accent: '#253520' },
  { key: 'midnight', name: 'เที่ยงคืน', bg: '#14141A', primary: '#E87A3D', accent: '#252530' },
];
```

Also update the preview card to show 3 color swatches. Replace lines 36-43 (the card View) with:

```tsx
<View style={{ backgroundColor: theme.bg }} className="p-3 h-24 justify-between">
  <View style={{ backgroundColor: theme.accent, opacity: 0.5 }} className="rounded-lg p-2 flex-1 justify-center border border-border">
    <View className="flex-row items-center">
      <View style={{ backgroundColor: theme.primary }} className="w-4 h-4 rounded-full mr-2" />
      <View style={{ backgroundColor: theme.primary, opacity: 0.3 }} className="h-2 flex-1 rounded" />
    </View>
  </View>
</View>
```

The property name `card` in the original `THEMES` array is no longer used — we use `accent` instead. The rest of the component logic (selection, haptics) stays the same.

- [ ] **Step 2: Commit**

```bash
git add app/settings/theme.tsx
git commit -m "feat: replace theme picker with 9 MiawMoney theme options"
```

---

### Task 11: Dashboard Screen Updates

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Add MiawMini import and update header**

Add import at the top of the file:
```ts
import { MiawMini } from '@/assets/svg';
```

Then wrap the balance section header area. After line 134 (`<SafeAreaView className="flex-1 bg-background">`), the first `<View>` block starts at line 135. Add the MiawMini to the header by inserting before the WalletFilter row (line 138):

```tsx
<View className="flex-row items-center mb-2">
  <MiawMini size={28} />
  <Text className="text-foreground text-xl font-bold ml-2">รายการ</Text>
</View>
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "feat: add MiawMini mascot to dashboard header"
```

---

### Task 12: Analytics Screen Updates

**Files:**
- Modify: `app/(tabs)/analytics.tsx`

- [ ] **Step 1: Add MiawMini import and header**

Add import at the top:
```ts
import { MiawMini, Sparkles } from '@/assets/svg';
```

Add a header with MiawMini before the PeriodSelector. Insert after `<ScrollView>` (line 82):

```tsx
<View className="flex-row items-center px-4 pt-2 pb-1">
  <MiawMini size={28} />
  <Text className="text-foreground text-xl font-bold ml-2">สรุป</Text>
</View>
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/analytics.tsx"
git commit -m "feat: add MiawMini mascot to analytics header"
```

---

### Task 13: Premium Screen Updates

**Files:**
- Modify: `app/(tabs)/ai-analysis.tsx`

- [ ] **Step 1: Add MiawMoney mascot imports**

Add import at the top of `app/(tabs)/ai-analysis.tsx`:
```ts
import { MiawHero, MiawThinking, GoldCracks } from '@/assets/svg';
```

- [ ] **Step 2: Update paywall hero**

In the `PremiumPaywall` component, find the hero section (the diamond icon area). Replace:

```tsx
<View className="w-20 h-20 rounded-full bg-primary/15 items-center justify-center mb-4">
  <Ionicons name="diamond" size={40} color="#0891b2" />
</View>
<Text className="text-foreground text-2xl font-bold mb-1">CeasFlow Premium</Text>
```

With:

```tsx
<View className="mb-4">
  <MiawHero size={140} />
</View>
<GoldCracks width={200} height={20} opacity={0.15} direction="horizontal" />
<Text className="text-foreground text-2xl font-bold mb-1 mt-2">MiawMoney Premium</Text>
```

- [ ] **Step 3: Update "ประหยัด 40%" badge color**

Find the badge `<View className="absolute -top-2.5 right-3 bg-green-500`:

Change `bg-green-500` to `bg-gold` (uses our new Tailwind token):

```tsx
<View className="absolute -top-2.5 right-3 bg-gold px-2 py-0.5 rounded-full">
  <Text className="text-white text-[10px] font-bold">ประหยัด 40%</Text>
</View>
```

- [ ] **Step 4: Update AI loading to use MiawThinking**

In the `AiLoadingView` component, replace the inner icon view:

Find:
```tsx
<View className="w-16 h-16 rounded-full bg-primary/15 items-center justify-center">
  <Ionicons name={step.icon} size={32} color="#0891b2" />
</View>
```

Replace with:
```tsx
<MiawThinking size={100} />
```

Note: Remove the `Animated.View style={glowStyle}` wrapper around this since MiawThinking handles its own layout. The loading step text below still rotates.

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/ai-analysis.tsx"
git commit -m "feat: update Premium screen with MiawMoney mascots and branding"
```

---

### Task 14: Settings Screen Updates

**Files:**
- Modify: `app/(tabs)/more.tsx`

- [ ] **Step 1: Add MiawMini import and update header + branding**

Add import at the top:
```ts
import { MiawMini } from '@/assets/svg';
```

Update the header (line 110-112). Replace:
```tsx
<View className="px-4 pt-4 pb-2">
  <Text className="text-foreground text-2xl font-bold">ตั้งค่า</Text>
</View>
```

With:
```tsx
<View className="px-4 pt-4 pb-2 flex-row items-center">
  <MiawMini size={28} />
  <Text className="text-foreground text-2xl font-bold ml-2">ตั้งค่า</Text>
</View>
```

- [ ] **Step 2: Update SettingsRow colors**

In the `SettingsRow` component, change:
- Icon color: `color="#666"` → `color="#6B5F52"`
- Chevron color: `color="#ccc"` → `color="#A39685"`

- [ ] **Step 3: Update app branding**

Find the line with "CeasFlow" (line 149):
```tsx
<SettingsRow icon="logo-github" label="CeasFlow" value="Expense Tracker" />
```

Change to:
```tsx
<SettingsRow icon="logo-github" label="MiawMoney" value="มิวมันนี่" />
```

- [ ] **Step 4: Commit**

```bash
git add "app/(tabs)/more.tsx"
git commit -m "feat: update settings screen with MiawMoney branding"
```

---

### Task 15: Final TypeScript Verification

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 2: Fix any type errors if found**

Address errors related to imports, missing types, or SVG component props.

- [ ] **Step 3: Run app to verify visually**

Run: `npx expo start`

Verify:
- Default theme is warm (paper background `#FBF7F0`)
- Tab bar shows tabby-orange active color with paw print
- FAB has cat ears and orange gradient
- Dashboard/Analytics/Settings headers show MiawMini
- Premium paywall shows MiawHero
- Theme picker shows 9 new themes
- Dark themes work correctly (switch to `warm-dark` or `midnight`)

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve type errors and polish MiawMoney Phase 1"
```
