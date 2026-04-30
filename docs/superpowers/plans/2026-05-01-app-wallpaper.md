# App Wallpaper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-screen wallpaper background (12 presets across 6 categories + custom uploads from gallery, max 10) to the four main tab screens, with a user-adjustable overlay slider for legibility.

**Architecture:** Extend `theme-store` with three new fields (`currentWallpaperId`, `wallpaperOverlayPercent`, `customWallpapers`). Render wallpaper + overlay via a new `<WallpaperBackground>` component that wraps the four tab screens. Custom images are copied into `${Paths.document}/wallpapers/` via `expo-file-system`'s new API and tracked by UUID in AsyncStorage.

**Tech Stack:** Expo SDK 54, React 19.1, NativeWind v4, Zustand 5, AsyncStorage, `expo-file-system/next`, `expo-image-picker` (new dep), TypeScript 5.9 strict.

**Spec:** [docs/superpowers/specs/2026-05-01-app-wallpaper-design.md](../specs/2026-05-01-app-wallpaper-design.md)

**Conventions used in this plan:**
- The codebase has no automated tests. The verification gate at every task is `npx tsc --noEmit` (must produce zero output) plus manual visual check on Android emulator. The TDD steps are replaced with type-check + visual smoke checks.
- The user has set "no auto-commit to git" in memory. **Do not run `git commit` between tasks.** All work stays staged/unstaged for the user to review and commit at their discretion. (If the user explicitly asks for commits during execution, batch-commit at the end.)

---

## Task 1: Install `expo-image-picker` and add permissions

**Files:**
- Modify: `package.json` (added by `expo install`)
- Modify: `app.json:14-19` (iOS infoPlist), `app.json:39-57` (plugins)

**Why:** `expo-image-picker` is required to let the user pick wallpaper images from their phone gallery. It is not currently in `package.json`. We also need to declare `NSPhotoLibraryUsageDescription` for iOS and add the picker to the `plugins` array so its native config is wired during prebuild.

- [ ] **Step 1: Install the dependencies pinned to SDK 54**

Run from the project root:

```bash
npx expo install expo-image-picker @react-native-community/slider
```

Expected: `package.json` gets two new lines under `"dependencies"`, e.g. `"expo-image-picker": "~17.0.x"` and `"@react-native-community/slider": "x.y.z"`. The exact patch versions are whatever Expo's compatibility matrix selects; do not pin manually.

- [ ] **Step 2: Add the iOS photo-library permission string**

Edit `app.json`. Inside `expo.ios.infoPlist` (currently lines 14–19), add `NSPhotoLibraryUsageDescription`:

```json
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.ceasflow.app",
      "infoPlist": {
        "CFBundleLocalizations": [
          "th"
        ],
        "CFBundleDevelopmentRegion": "th",
        "NSPhotoLibraryUsageDescription": "ขออนุญาตเข้าถึงรูปภาพเพื่อใช้เป็นพื้นหลังของแอป"
      }
    },
```

- [ ] **Step 3: Add `expo-image-picker` to the plugins array with the same usage string**

In `app.json`, `expo.plugins` (currently lines 39–57). Append the picker config after `"expo-font"`:

```json
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "backgroundColor": "#000000"
          }
        }
      ],
      "expo-sqlite",
      "expo-secure-store",
      "@react-native-community/datetimepicker",
      "expo-font",
      [
        "expo-image-picker",
        {
          "photosPermission": "ขออนุญาตเข้าถึงรูปภาพเพื่อใช้เป็นพื้นหลังของแอป"
        }
      ]
    ],
```

Note: per project memory `app.json` notes, `expo-haptics` and `expo-file-system` do NOT have config plugins — do not add them. `expo-image-picker` DOES have one.

- [ ] **Step 4: Verify install + types**

```bash
npx tsc --noEmit
```

Expected: zero output. (No source files reference the new package yet, so this just confirms the install did not break the project.)

---

## Task 2: Create wallpaper constants and placeholder PNG assets

**Files:**
- Create: `assets/wallpaper/star-1.png`, `star-2.png`, `flower-1.png`, `flower-2.png`, `mountain-1.png`, `mountain-2.png`, `sea-1.png`, `sea-2.png`, `cat-food-1.png`, `cat-food-2.png`, `kitten-1.png`, `kitten-2.png` (12 placeholder PNGs)
- Create: `lib/constants/wallpapers.ts`

**Why:** `require()` calls embedded in the constants file are resolved by Metro at bundle time, so the files must exist before the constants module compiles. Twelve 1×1 PNGs are enough — the user will drop in real generated images later (same paths, same filenames, no code changes needed).

- [ ] **Step 1: Create the assets directory**

```bash
mkdir -p assets/wallpaper
```

Expected: directory exists (verify with `ls assets/wallpaper`).

- [ ] **Step 2: Create the twelve placeholder PNGs**

Use a single base64-decoded 1×1 transparent PNG written 12 times:

```bash
PNG_B64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
for f in star-1 star-2 flower-1 flower-2 mountain-1 mountain-2 sea-1 sea-2 cat-food-1 cat-food-2 kitten-1 kitten-2; do
  echo "$PNG_B64" | base64 -d > "assets/wallpaper/${f}.png"
done
```

Expected: `ls assets/wallpaper` shows 12 files, each ~70 bytes.

- [ ] **Step 3: Create `lib/constants/wallpapers.ts` with the full preset list and helpers**

```ts
import type { ImageSourcePropType } from 'react-native';

export type WallpaperCategory =
  | 'star'
  | 'flower'
  | 'mountain'
  | 'sea'
  | 'cat-food'
  | 'kitten';

export interface WallpaperPreset {
  id: string;
  category: WallpaperCategory;
  name: string;
  source: ImageSourcePropType;
}

export interface CustomWallpaper {
  id: string;
  uri: string;
  addedAt: number;
}

export const WALLPAPER_CATEGORY_LABELS: Record<WallpaperCategory, string> = {
  star: 'ดวงดาว',
  flower: 'ดอกไม้',
  mountain: 'ภูเขา',
  sea: 'ทะเล',
  'cat-food': 'อาหารแมว',
  kitten: 'ลูกแมว',
};

export const WALLPAPER_CATEGORY_ORDER: WallpaperCategory[] = [
  'star',
  'flower',
  'mountain',
  'sea',
  'cat-food',
  'kitten',
];

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  { id: 'star-1',      category: 'star',     name: 'ดวงดาว 1',   source: require('@/assets/wallpaper/star-1.png') },
  { id: 'star-2',      category: 'star',     name: 'ดวงดาว 2',   source: require('@/assets/wallpaper/star-2.png') },
  { id: 'flower-1',    category: 'flower',   name: 'ดอกไม้ 1',  source: require('@/assets/wallpaper/flower-1.png') },
  { id: 'flower-2',    category: 'flower',   name: 'ดอกไม้ 2',  source: require('@/assets/wallpaper/flower-2.png') },
  { id: 'mountain-1',  category: 'mountain', name: 'ภูเขา 1',    source: require('@/assets/wallpaper/mountain-1.png') },
  { id: 'mountain-2',  category: 'mountain', name: 'ภูเขา 2',    source: require('@/assets/wallpaper/mountain-2.png') },
  { id: 'sea-1',       category: 'sea',      name: 'ทะเล 1',     source: require('@/assets/wallpaper/sea-1.png') },
  { id: 'sea-2',       category: 'sea',      name: 'ทะเล 2',     source: require('@/assets/wallpaper/sea-2.png') },
  { id: 'cat-food-1',  category: 'cat-food', name: 'อาหารแมว 1', source: require('@/assets/wallpaper/cat-food-1.png') },
  { id: 'cat-food-2',  category: 'cat-food', name: 'อาหารแมว 2', source: require('@/assets/wallpaper/cat-food-2.png') },
  { id: 'kitten-1',    category: 'kitten',   name: 'ลูกแมว 1',   source: require('@/assets/wallpaper/kitten-1.png') },
  { id: 'kitten-2',    category: 'kitten',   name: 'ลูกแมว 2',   source: require('@/assets/wallpaper/kitten-2.png') },
];

/**
 * Resolve a wallpaper id to an `ImageSourcePropType`.
 * Returns `null` when the id matches neither a preset nor a known custom entry.
 */
export function resolveWallpaperSource(
  id: string | null,
  customs: CustomWallpaper[],
): ImageSourcePropType | null {
  if (!id) return null;
  const preset = WALLPAPER_PRESETS.find((p) => p.id === id);
  if (preset) return preset.source;
  const custom = customs.find((c) => c.id === id);
  if (custom) return { uri: custom.uri };
  return null;
}

export const MAX_CUSTOM_WALLPAPERS = 10;
```

- [ ] **Step 4: Verify the constants module type-checks**

```bash
npx tsc --noEmit
```

Expected: zero output. If Metro complains about any missing PNG, recreate that file from Step 2.

---

## Task 3: Create custom-wallpaper file storage helpers

**Files:**
- Create: `lib/utils/wallpaper-storage.ts`

**Why:** Centralize the file-system side-effects (copying picked images into `${Paths.document}/wallpapers/`, deleting them, naming them with UUIDs) into one module so the store stays focused on state. Pattern matches `lib/utils/data-transfer.ts:254` which already uses the new `expo-file-system/next` API in this codebase.

- [ ] **Step 1: Create the helper module**

```ts
import { Directory, File, Paths } from 'expo-file-system/next';
import { generateId } from '@/lib/utils/id';
import type { CustomWallpaper } from '@/lib/constants/wallpapers';

const WALLPAPER_DIR_NAME = 'wallpapers';

function ensureDir(): Directory {
  const dir = new Directory(Paths.document, WALLPAPER_DIR_NAME);
  if (!dir.exists) dir.create({ idempotent: true });
  return dir;
}

function extFromUri(uri: string): string {
  const lastDot = uri.lastIndexOf('.');
  if (lastDot < 0) return 'jpg';
  const raw = uri.slice(lastDot + 1).toLowerCase();
  // strip query string or fragment if any
  const clean = raw.replace(/[?#].*$/, '');
  if (clean === 'jpeg' || clean === 'jpg' || clean === 'png' || clean === 'webp' || clean === 'heic') {
    return clean === 'jpeg' ? 'jpg' : clean;
  }
  return 'jpg';
}

/**
 * Copy a picked image into the app's documents folder.
 * Returns the new `CustomWallpaper` entry on success.
 * Throws if the source cannot be read.
 */
export async function importCustomWallpaper(srcUri: string): Promise<CustomWallpaper> {
  const dir = ensureDir();
  const id = generateId();
  const ext = extFromUri(srcUri);
  const dest = new File(dir, `${id}.${ext}`);
  const source = new File(srcUri);
  source.copy(dest);
  return { id, uri: dest.uri, addedAt: Date.now() };
}

/**
 * Delete a custom wallpaper file from disk.
 * Silently no-ops if the file is already gone.
 */
export async function deleteCustomWallpaperFile(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // file already missing or unreadable — caller's state cleanup is what matters
  }
}
```

- [ ] **Step 2: Verify it type-checks**

```bash
npx tsc --noEmit
```

Expected: zero output.

---

## Task 4: Extend `theme-store.ts` with wallpaper state and actions

**Files:**
- Modify: `lib/stores/theme-store.ts` (entire file rewritten as a small module)

**Why:** The existing store already centralizes all theme-related persistence and exposes hooks consumed across the app. Adding three more fields and four more actions in the same place keeps theming concerns in one module and makes a single `loadTheme()` parallel-fetch the new keys at boot.

- [ ] **Step 1: Replace the contents of `lib/stores/theme-store.ts` with the extended version**

```ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_ADD_MASCOT_ID, DEFAULT_BG_MASCOT_ID } from '@/lib/constants/mascots';
import {
  MAX_CUSTOM_WALLPAPERS,
  WALLPAPER_PRESETS,
  type CustomWallpaper,
} from '@/lib/constants/wallpapers';
import {
  deleteCustomWallpaperFile,
  importCustomWallpaper,
} from '@/lib/utils/wallpaper-storage';

const THEME_KEY = 'app_theme';
const BG_MASCOT_KEY = 'app_bg_mascot';
const ADD_MASCOT_KEY = 'app_add_mascot';
const PAW_VARIANT_KEY = 'app_paw_variant';
const WALLPAPER_KEY = 'app_wallpaper';                    // '' = no wallpaper
const WALLPAPER_OVERLAY_KEY = 'app_wallpaper_overlay';    // '0'..'100'
const CUSTOM_WALLPAPERS_KEY = 'app_custom_wallpapers';    // JSON CustomWallpaper[]

export type PawPrintVariant = 'classic' | 'detailed' | 'outlined' | 'with-claws' | 'heart';

const PAW_VARIANTS: PawPrintVariant[] = ['classic', 'detailed', 'outlined', 'with-claws', 'heart'];

function isValidPawVariant(v: string | null): v is PawPrintVariant {
  return v !== null && (PAW_VARIANTS as string[]).includes(v);
}

function clampOverlay(n: number): number {
  if (Number.isNaN(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function parseCustomWallpapers(raw: string | null): CustomWallpaper[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is CustomWallpaper =>
        e && typeof e.id === 'string' && typeof e.uri === 'string' && typeof e.addedAt === 'number',
    );
  } catch {
    return [];
  }
}

interface ThemeStore {
  currentTheme: string;
  currentBgMascot: string;
  currentAddMascot: string;
  pawPrintVariant: PawPrintVariant;
  currentWallpaperId: string | null;
  wallpaperOverlayPercent: number;
  customWallpapers: CustomWallpaper[];
  isLoaded: boolean;

  loadTheme: () => Promise<void>;
  setTheme: (theme: string) => Promise<void>;
  setBgMascot: (id: string) => Promise<void>;
  setAddMascot: (id: string) => Promise<void>;
  setPawPrintVariant: (v: PawPrintVariant) => Promise<void>;

  setWallpaper: (id: string | null) => Promise<void>;
  setOverlayPercent: (n: number) => Promise<void>;
  addCustomWallpaper: (srcUri: string) => Promise<CustomWallpaper | null>;
  removeCustomWallpaper: (id: string) => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  currentTheme: 'warm',
  currentBgMascot: DEFAULT_BG_MASCOT_ID,
  currentAddMascot: DEFAULT_ADD_MASCOT_ID,
  pawPrintVariant: 'classic',
  currentWallpaperId: null,
  wallpaperOverlayPercent: 50,
  customWallpapers: [],
  isLoaded: false,

  loadTheme: async () => {
    const [theme, bg, add, paw, wallpaper, overlay, customs] = await Promise.all([
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(BG_MASCOT_KEY),
      AsyncStorage.getItem(ADD_MASCOT_KEY),
      AsyncStorage.getItem(PAW_VARIANT_KEY),
      AsyncStorage.getItem(WALLPAPER_KEY),
      AsyncStorage.getItem(WALLPAPER_OVERLAY_KEY),
      AsyncStorage.getItem(CUSTOM_WALLPAPERS_KEY),
    ]);
    set({
      currentTheme: theme ?? 'warm',
      currentBgMascot: bg ?? DEFAULT_BG_MASCOT_ID,
      currentAddMascot: add ?? DEFAULT_ADD_MASCOT_ID,
      pawPrintVariant: isValidPawVariant(paw) ? paw : 'classic',
      currentWallpaperId: wallpaper && wallpaper.length > 0 ? wallpaper : null,
      wallpaperOverlayPercent: overlay ? clampOverlay(Number(overlay)) : 50,
      customWallpapers: parseCustomWallpapers(customs),
      isLoaded: true,
    });
  },

  setTheme: async (theme) => {
    await AsyncStorage.setItem(THEME_KEY, theme);
    set({ currentTheme: theme });
  },

  setBgMascot: async (id) => {
    await AsyncStorage.setItem(BG_MASCOT_KEY, id);
    set({ currentBgMascot: id });
  },

  setAddMascot: async (id) => {
    await AsyncStorage.setItem(ADD_MASCOT_KEY, id);
    set({ currentAddMascot: id });
  },

  setPawPrintVariant: async (v) => {
    await AsyncStorage.setItem(PAW_VARIANT_KEY, v);
    set({ pawPrintVariant: v });
  },

  setWallpaper: async (id) => {
    await AsyncStorage.setItem(WALLPAPER_KEY, id ?? '');
    set({ currentWallpaperId: id });
  },

  setOverlayPercent: async (n) => {
    const value = clampOverlay(n);
    await AsyncStorage.setItem(WALLPAPER_OVERLAY_KEY, String(value));
    set({ wallpaperOverlayPercent: value });
  },

  addCustomWallpaper: async (srcUri) => {
    const list = get().customWallpapers;
    if (list.length >= MAX_CUSTOM_WALLPAPERS) return null;
    const entry = await importCustomWallpaper(srcUri);
    const next = [...list, entry];
    await AsyncStorage.setItem(CUSTOM_WALLPAPERS_KEY, JSON.stringify(next));
    set({ customWallpapers: next });
    return entry;
  },

  removeCustomWallpaper: async (id) => {
    const list = get().customWallpapers;
    const target = list.find((e) => e.id === id);
    if (!target) return;
    await deleteCustomWallpaperFile(target.uri);
    const next = list.filter((e) => e.id !== id);
    await AsyncStorage.setItem(CUSTOM_WALLPAPERS_KEY, JSON.stringify(next));
    const wasSelected = get().currentWallpaperId === id;
    if (wasSelected) {
      await AsyncStorage.setItem(WALLPAPER_KEY, '');
      set({ customWallpapers: next, currentWallpaperId: null });
    } else {
      set({ customWallpapers: next });
    }
  },
}));

// Re-export so callers can `import { type CustomWallpaper } from '@/lib/stores/theme-store'`
// if they prefer; but the canonical home of the type is `lib/constants/wallpapers.ts`.
export type { CustomWallpaper };
// Re-export for callers that want to know if an id is a preset id without importing the constants module.
export const PRESET_WALLPAPER_IDS = new Set(WALLPAPER_PRESETS.map((p) => p.id));
```

- [ ] **Step 2: Verify the store still compiles and existing consumers still work**

```bash
npx tsc --noEmit
```

Expected: zero output. If anything else in the project (e.g. `app/_layout.tsx`, `ThemeSettingsContent.tsx`) references the store, the existing fields and methods (`currentTheme`, `setTheme`, mascots, paw variant, `loadTheme`, `isLoaded`) are unchanged — only additions.

---

## Task 5: Create `WallpaperBackground.tsx`

**Files:**
- Create: `components/layout/WallpaperBackground.tsx`

**Why:** A small focused component that the four tab screens wrap. Keeps wallpaper composition logic in one place so adding/removing wallpaper from a screen is a one-line change and so the overlay rules cannot drift between screens.

- [ ] **Step 1: Create the component**

```tsx
import { getThemeSwatch } from '@/lib/constants/themes';
import { resolveWallpaperSource } from '@/lib/constants/wallpapers';
import { useThemeStore } from '@/lib/stores/theme-store';
import { Image, StyleSheet, View } from 'react-native';

export function WallpaperBackground({ children }: { children: React.ReactNode }) {
  const wallpaperId = useThemeStore((s) => s.currentWallpaperId);
  const overlayPct = useThemeStore((s) => s.wallpaperOverlayPercent);
  const themeKey = useThemeStore((s) => s.currentTheme);
  const customs = useThemeStore((s) => s.customWallpapers);

  if (!wallpaperId) {
    return (
      <View style={{ flex: 1 }} className="bg-background">
        {children}
      </View>
    );
  }

  const source = resolveWallpaperSource(wallpaperId, customs);
  if (!source) {
    return (
      <View style={{ flex: 1 }} className="bg-background">
        {children}
      </View>
    );
  }

  const overlayColor = getThemeSwatch(themeKey)?.bg ?? '#FBF7F0';

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <Image source={source} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: overlayColor, opacity: overlayPct / 100 },
        ]}
      />
      {children}
    </View>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

```bash
npx tsc --noEmit
```

Expected: zero output.

---

## Task 6: Wrap each of the four tab screens with `<WallpaperBackground>`

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/analytics.tsx`
- Modify: `app/(tabs)/ai-analysis.tsx`
- Modify: `app/(tabs)/more.tsx`

**Why:** The wallpaper renders behind everything except the tab bar. Each screen currently uses `<SafeAreaView className="flex-1 bg-background">` as its outermost element. Wrapping that whole SafeAreaView with `<WallpaperBackground>` puts the image+overlay underneath the screen's children while preserving SafeAreaView's role of avoiding the notch. The SafeAreaView keeps `flex-1` but `bg-background` becomes redundant when wallpaper is showing — keep it anyway because `<WallpaperBackground>` already paints `bg-background` as its own backdrop and the SafeAreaView's `bg-background` is fine to remain (it's painted on top of the overlay, which is what we want when wallpaper is "ไม่ใช้").

Actually re-stating that more carefully: **remove `bg-background` from the SafeAreaView's className** because when a wallpaper is selected, the SafeAreaView's solid `bg-background` would block it. The `<WallpaperBackground>` already paints `bg-background` in the no-wallpaper branch.

- [ ] **Step 1: Update `app/(tabs)/index.tsx`**

At the top of the file, add to the imports:

```ts
import { WallpaperBackground } from '@/components/layout/WallpaperBackground';
```

Find the JSX block beginning `return (` and `<SafeAreaView className="flex-1 bg-background" edges={['top']}>` (around line 163). Change it to:

```tsx
return (
  <WallpaperBackground>
    <SafeAreaView className="flex-1" edges={['top']}>
      {/* ...existing children... */}
    </SafeAreaView>
  </WallpaperBackground>
);
```

The closing `</SafeAreaView>` stays where it was — only an outer `<WallpaperBackground>` is added around it, and `bg-background` is dropped from the SafeAreaView className.

- [ ] **Step 2: Update `app/(tabs)/analytics.tsx`**

Same pattern. Add the import at the top:

```ts
import { WallpaperBackground } from '@/components/layout/WallpaperBackground';
```

Wrap the SafeAreaView at line ~63 (`<SafeAreaView className="flex-1 bg-background" edges={['top']}>`) the same way:

```tsx
return (
  <WallpaperBackground>
    <SafeAreaView className="flex-1" edges={['top']}>
      {/* ...existing children... */}
    </SafeAreaView>
  </WallpaperBackground>
);
```

- [ ] **Step 3: Update `app/(tabs)/ai-analysis.tsx`**

Add the import:

```ts
import { WallpaperBackground } from '@/components/layout/WallpaperBackground';
```

Wrap the SafeAreaView the same way. (The file may use `SafeAreaView` from `react-native-safe-area-context`; do not change which import — only the className and the surrounding wrapper.) If the screen does not currently have a `SafeAreaView` and instead uses a plain `<View className="flex-1 bg-background">`, then drop `bg-background` from that View and wrap it with `<WallpaperBackground>` exactly the same.

- [ ] **Step 4: Update `app/(tabs)/more.tsx`**

Same pattern. Add import, wrap the outermost `<SafeAreaView className="flex-1 bg-background" edges={['top']}>` (around line 124):

```tsx
return (
  <WallpaperBackground>
    <SafeAreaView className="flex-1" edges={['top']}>
      {/* ...existing children... */}
    </SafeAreaView>
  </WallpaperBackground>
);
```

- [ ] **Step 5: Verify all four screens still compile**

```bash
npx tsc --noEmit
```

Expected: zero output.

- [ ] **Step 6: Visual smoke check on Android emulator (with no wallpaper set)**

Run the app (`npm run android` or via Expo Go / dev client) and confirm the four tab screens look **exactly the same as before this task** — same `bg-background` color, same content layout. This proves the no-wallpaper branch of `<WallpaperBackground>` is doing the right thing.

If anything looks different (e.g. the SafeAreaView's missing `bg-background` causes a flash of color), debug by inspecting the React tree before declaring this step done.

---

## Task 7: Build the wallpaper picker UI in `ThemeSettingsContent.tsx`

**Files:**
- Modify: `components/settings/ThemeSettingsContent.tsx`

**Why:** This is where the user already manages theme/mascot/paw settings. Adding a "พื้นหลังของแอป" section to the same scroll view means the user's mental model of "ตั้งค่า → ธีม" stays unified.

**Component sketch:**
- New imports: the wallpaper constants, `expo-image-picker`, `Alert`, and `<Slider>` from `@react-native-community/slider` (installed in Task 1).

- [ ] **Step 1: Add new imports at the top of the file**

Place these alongside the existing imports:

```ts
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';
import {
  MAX_CUSTOM_WALLPAPERS,
  WALLPAPER_CATEGORY_LABELS,
  WALLPAPER_CATEGORY_ORDER,
  WALLPAPER_PRESETS,
  type CustomWallpaper,
  type WallpaperCategory,
} from '@/lib/constants/wallpapers';
```

(`Image`, `Pressable`, `ScrollView`, `Text`, `View` are already imported in this file — don't duplicate; only ensure `Alert`, `ImagePicker`, `Slider`, and the wallpaper constants are added.)

- [ ] **Step 2: Read the new store fields inside `ThemeSettingsContent`**

Inside the `ThemeSettingsContent` component body, alongside the existing `useThemeStore` selector calls:

```ts
const currentWallpaperId = useThemeStore((s) => s.currentWallpaperId);
const setWallpaper = useThemeStore((s) => s.setWallpaper);
const wallpaperOverlayPercent = useThemeStore((s) => s.wallpaperOverlayPercent);
const setOverlayPercent = useThemeStore((s) => s.setOverlayPercent);
const customWallpapers = useThemeStore((s) => s.customWallpapers);
const addCustomWallpaper = useThemeStore((s) => s.addCustomWallpaper);
const removeCustomWallpaper = useThemeStore((s) => s.removeCustomWallpaper);
```

- [ ] **Step 3: Add handlers for the picker / delete / overlay**

Place these inside the component, after the existing `handleSelectPawVariant`:

```ts
const handleSelectWallpaper = (id: string | null) => {
  if (id === currentWallpaperId) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  setWallpaper(id);
};

const handlePickCustomWallpaper = async () => {
  if (customWallpapers.length >= MAX_CUSTOM_WALLPAPERS) {
    Alert.alert('เพิ่มได้สูงสุด 10 รูป', 'กรุณาลบรูปเก่าก่อน');
    return;
  }
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('ขออนุญาตเข้าถึงรูปภาพ', 'กรุณาเปิดสิทธิ์ในการตั้งค่าระบบ');
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    quality: 0.85,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets?.length) return;
  const entry = await addCustomWallpaper(result.assets[0].uri);
  if (entry) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWallpaper(entry.id);
  }
};

const handleDeleteCustomWallpaper = (entry: CustomWallpaper) => {
  Alert.alert(
    'ลบรูปนี้ใช่ไหม?',
    'รูปจะถูกลบออกจากแอป',
    [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          await removeCustomWallpaper(entry.id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ],
  );
};

const handleOverlayChange = (n: number) => {
  setOverlayPercent(Math.round(n));
};

const handleOverlayCommit = (n: number) => {
  Haptics.selectionAsync();
  setOverlayPercent(Math.round(n));
};
```

- [ ] **Step 4: Add the "พื้นหลังของแอป" section JSX before the closing `</ScrollView>`**

Inside the existing `ScrollView` (top-level return), after the "ลายตีนแมว" `<View>` block (the one that ends around line 215 of the current file), and **before** the `</ScrollView>` on line 216, insert:

```tsx
{/* ===== พื้นหลังของแอป ===== */}
<View style={{ marginTop: 22 }}>
  <Text
    className="text-foreground"
    style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16, marginBottom: 4 }}
  >
    พื้นหลังของแอป
  </Text>
  <Text
    className="text-muted-foreground"
    style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5, marginBottom: 12 }}
  >
    เลือกภาพพื้นหลังสำหรับ 4 หน้าหลัก หรือเพิ่มภาพจากเครื่อง
  </Text>

  {/* "ไม่ใช้" tile — standalone, always visible */}
  <Pressable
    onPress={() => handleSelectWallpaper(null)}
    style={({ pressed }) => ({
      opacity: pressed ? 0.7 : 1,
      transform: [{ scale: pressed ? 0.98 : 1 }],
    })}
    accessibilityRole="button"
    accessibilityLabel="ไม่ใช้พื้นหลัง"
  >
    <View
      className="bg-card"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: currentWallpaperId === null ? '#E87A3D' : 'rgba(42,35,32,0.08)',
        marginBottom: 14,
      }}
    >
      <View
        style={{
          width: 56,
          height: 40,
          borderRadius: 8,
          backgroundColor: 'rgba(42,35,32,0.05)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="ban-outline" size={20} color="#9A8D80" />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          className="text-foreground"
          style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14 }}
        >
          ไม่ใช้
        </Text>
        <Text
          className="text-muted-foreground"
          style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11 }}
        >
          ใช้สีพื้นหลังของธีมตามปกติ
        </Text>
      </View>
      {currentWallpaperId === null && (
        <Ionicons name="checkmark-circle" size={20} color="#E87A3D" />
      )}
    </View>
  </Pressable>

  {/* Overlay strength slider — only when a wallpaper is selected */}
  {currentWallpaperId !== null && (
    <View
      className="bg-card"
      style={{
        borderRadius: 14,
        padding: 12,
        marginBottom: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text
          className="text-foreground"
          style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13 }}
        >
          ความเข้มของ overlay
        </Text>
        <Text
          className="text-muted-foreground"
          style={{ fontFamily: 'Inter_700Bold', fontSize: 13, fontVariant: ['tabular-nums'] }}
        >
          {wallpaperOverlayPercent}%
        </Text>
      </View>
      <Slider
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={wallpaperOverlayPercent}
        onValueChange={handleOverlayChange}
        onSlidingComplete={handleOverlayCommit}
        minimumTrackTintColor="#E87A3D"
        maximumTrackTintColor="rgba(42,35,32,0.15)"
        thumbTintColor="#E87A3D"
        accessibilityLabel="ปรับความเข้มของ overlay"
      />
    </View>
  )}

  {/* Preset categories */}
  {WALLPAPER_CATEGORY_ORDER.map((category) => (
    <WallpaperCategoryRow
      key={category}
      category={category}
      currentId={currentWallpaperId}
      onSelect={(id) => handleSelectWallpaper(id)}
    />
  ))}

  {/* Custom uploads */}
  <CustomWallpaperRow
    customs={customWallpapers}
    currentId={currentWallpaperId}
    canAdd={customWallpapers.length < MAX_CUSTOM_WALLPAPERS}
    onSelect={(id) => handleSelectWallpaper(id)}
    onDelete={handleDeleteCustomWallpaper}
    onAdd={handlePickCustomWallpaper}
  />
</View>
```

- [ ] **Step 5: Add the `WallpaperCategoryRow` and `CustomWallpaperRow` helper components at the bottom of the file**

After the existing `ThemeListItem` definition (last function in the file), append:

```tsx
// ===== Wallpaper category row =====

function WallpaperCategoryRow({
  category,
  currentId,
  onSelect,
}: {
  category: WallpaperCategory;
  currentId: string | null;
  onSelect: (id: string) => void;
}) {
  const presets = WALLPAPER_PRESETS.filter((p) => p.category === category);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        className="text-foreground"
        style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, marginBottom: 6, paddingHorizontal: 2 }}
      >
        {WALLPAPER_CATEGORY_LABELS[category]}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingVertical: 4, paddingRight: 4 }}
      >
        {presets.map((p) => {
          const isSelected = p.id === currentId;
          return (
            <Pressable
              key={p.id}
              onPress={() => onSelect(p.id)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
              accessibilityRole="button"
              accessibilityLabel={`เลือกพื้นหลัง ${p.name}`}
            >
              <View
                style={{
                  width: 132,
                  height: 92,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: isSelected ? '#E87A3D' : 'rgba(42,35,32,0.08)',
                  backgroundColor: '#FAF5EC',
                  overflow: 'hidden',
                }}
              >
                <Image source={p.source} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                {isSelected && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: '#E87A3D',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ===== Custom wallpaper row =====

function CustomWallpaperRow({
  customs,
  currentId,
  canAdd,
  onSelect,
  onDelete,
  onAdd,
}: {
  customs: CustomWallpaper[];
  currentId: string | null;
  canAdd: boolean;
  onSelect: (id: string) => void;
  onDelete: (entry: CustomWallpaper) => void;
  onAdd: () => void;
}) {
  return (
    <View style={{ marginTop: 4 }}>
      <Text
        className="text-foreground"
        style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, marginBottom: 6, paddingHorizontal: 2 }}
      >
        ของคุณ
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingVertical: 4, paddingRight: 4 }}
      >
        {customs.map((c) => {
          const isSelected = c.id === currentId;
          return (
            <View key={c.id} style={{ position: 'relative' }}>
              <Pressable
                onPress={() => onSelect(c.id)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                })}
                accessibilityRole="button"
                accessibilityLabel="เลือกพื้นหลังของฉัน"
              >
                <View
                  style={{
                    width: 132,
                    height: 92,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: isSelected ? '#E87A3D' : 'rgba(42,35,32,0.08)',
                    backgroundColor: '#FAF5EC',
                    overflow: 'hidden',
                  }}
                >
                  <Image source={{ uri: c.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  {isSelected && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: '#E87A3D',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}
                </View>
              </Pressable>
              <Pressable
                onPress={() => onDelete(c)}
                hitSlop={8}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#E57373',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel="ลบรูปนี้"
              >
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          );
        })}
        <Pressable
          onPress={onAdd}
          disabled={!canAdd}
          style={({ pressed }) => ({
            opacity: !canAdd ? 0.4 : pressed ? 0.7 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          })}
          accessibilityRole="button"
          accessibilityLabel="เพิ่มพื้นหลังจากเครื่อง"
        >
          <View
            style={{
              width: 132,
              height: 92,
              borderRadius: 12,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: '#E87A3D',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <Ionicons name="add" size={22} color="#E87A3D" />
            <Text
              style={{
                fontFamily: 'IBMPlexSansThai_600SemiBold',
                fontSize: 11.5,
                color: '#E87A3D',
              }}
            >
              เพิ่ม
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 6: Verify the picker compiles**

```bash
npx tsc --noEmit
```

Expected: zero output. The new helper components reference imports already added at Step 1.

---

## Task 8: Manual smoke test on Android emulator (and iOS if available)

**Files:** none

**Why:** The codebase has no automated tests. The acceptance criteria for this feature are visual / behavioral, so a manual checklist is the gate before declaring the feature done.

- [ ] **Step 1: Start the dev build on Android emulator**

```bash
npm run android
```

Expected: app boots into the unlocked tab UI with no console errors.

- [ ] **Step 2: Confirm "no wallpaper" default**

Open `ตั้งค่า → ธีม → พื้นหลังของแอป`. The "ไม่ใช้" tile should be highlighted (orange border + checkmark). The overlay chip group should be hidden.

The four tab screens (รายการ / สรุป / Premium / ตั้งค่า) should look identical to before — same theme background color, no image visible.

- [ ] **Step 3: Pick a preset and verify it shows on all four tabs**

Tap a preset (e.g. ดวงดาว 1). The placeholder PNG (1×1) will stretch to cover the screen — that's expected. The overlay chip group appears with 50% selected.

Switch to each of the four tabs. The wallpaper should be visible behind the cards/lists/buttons, with the overlay tinting it.

Open `transaction/add` (the FAB on the รายการ tab). The wallpaper should NOT appear inside the modal. Close it.

- [ ] **Step 4: Drag the overlay slider 0 → 100 and confirm visual change**

In the picker, drag the slider thumb across the full range. The percentage label next to the title updates live during drag. At 0% the wallpaper is most visible; at 100% it's effectively hidden (looks the same as "ไม่ใช้").

- [ ] **Step 5: Switch color theme and confirm overlay color follows**

While a wallpaper is selected, switch from `อบอุ่น` to `มหาสมุทร (มืด)` in the same screen. The overlay tint should change automatically (warm cream → ocean dark) without further action.

- [ ] **Step 6: Add a custom image from gallery**

Scroll to "ของคุณ", tap `+ เพิ่ม`. Grant the OS permission prompt. Pick any image. The image should appear in the row, become the selected wallpaper, and show on all four tab screens.

- [ ] **Step 7: Reach the 10-image limit**

Repeat Step 6 nine more times to reach 10 customs. The `+ เพิ่ม` tile should turn 40% opacity and become non-interactive. Tap it anyway — an `Alert` should appear: `เพิ่มได้สูงสุด 10 รูป — กรุณาลบรูปเก่าก่อน`.

- [ ] **Step 8: Delete a custom image (currently selected)**

Tap the ✕ on the selected custom thumbnail. Confirm the alert. The thumbnail disappears, and the four tab screens revert to "ไม่ใช้" automatically.

- [ ] **Step 9: Restart the app and verify persistence**

Kill the app from the OS and re-launch. The previously selected wallpaper, overlay percent, and the list of customs should be exactly as left.

- [ ] **Step 10: (Optional, if iOS available) Repeat Steps 1–9 on iOS Simulator**

```bash
npm run ios
```

Expected: identical behavior to Android. (The earlier theme-vars Android-only bug has already been fixed; this confirms wallpaper composition works the same on both platforms.)

---

## Task 9: Provide AI-image-generation prompts for the 12 presets

**Files:** none — this is a deliverable handed to the user, not a code change.

**Why:** The user opted in §2 of the spec to generate the 12 preset images externally. The placeholders shipped in Task 2 are 1×1 transparent PNGs; once the user replaces them with real images at the same paths/filenames, the feature is complete.

- [ ] **Step 1: Hand the user the prompt list below**

Reply to the user with the following content (Thai recap + English prompts since image-gen tools work best in English). The user copies each prompt into Midjourney/DALL·E/Flux to generate, then saves the result as the matching filename in `assets/wallpaper/`.

```
Resolution target: 1290×2796 (iPhone 15 Pro Max) or 1080×2400 (Android), 9:19.5 aspect.
Style guideline (apply to all 12): warm, soft, mobile-wallpaper composition,
edges slightly less detailed than center so app cards/text remain legible.

star-1.png      — "starry night sky, soft pastel galaxy, gentle nebula clouds, calm warm tones, no text, mobile wallpaper, 9:19.5 vertical"
star-2.png      — "deep cosmic background with subtle constellations, navy and indigo, faint glittering stars, minimalist, no text, mobile wallpaper, 9:19.5 vertical"
flower-1.png    — "soft watercolor cherry blossom field, pink and cream pastels, dreamy bokeh, no text, mobile wallpaper, 9:19.5 vertical"
flower-2.png    — "dense daisies and wildflowers in soft sunlight, gentle yellow-green palette, no text, mobile wallpaper, 9:19.5 vertical"
mountain-1.png  — "minimalist mountain range at dawn, layered silhouettes, warm peach gradient sky, no text, mobile wallpaper, 9:19.5 vertical"
mountain-2.png  — "snowy alpine peaks under twilight, cool blue and lavender, soft fog in valleys, no text, mobile wallpaper, 9:19.5 vertical"
sea-1.png       — "tranquil tropical ocean from above, turquoise water with subtle wave patterns, no text, mobile wallpaper, 9:19.5 vertical"
sea-2.png       — "deep sea with soft sunlight beams from the surface, navy gradient, no text, mobile wallpaper, 9:19.5 vertical"
cat-food-1.png  — "cute illustrated cat-food bowls and fish-shaped treats arranged in a soft pattern, warm cream background, kawaii style, no text, mobile wallpaper, 9:19.5 vertical"
cat-food-2.png  — "tin-can and croquette cat treats scattered on a beige plank, soft top-down photo style, no text, mobile wallpaper, 9:19.5 vertical"
kitten-1.png    — "tiny ginger kitten napping on a soft cream blanket, gentle sunlight, photo-realistic but soft focus, no text, mobile wallpaper, 9:19.5 vertical"
kitten-2.png    — "two playful gray kittens with big round eyes on a pastel pink background, illustrated kawaii style, no text, mobile wallpaper, 9:19.5 vertical"
```

- [ ] **Step 2: Once the user provides the 12 real PNGs**

Drop them into `assets/wallpaper/` overwriting the placeholders, restart Metro:

```bash
npx expo start -c
```

The picker will pick up the new images automatically — no code change required.

---

## Self-review notes (already applied during plan write)

- Task 6 originally said "wrap with `<WallpaperBackground>` and keep `bg-background` on SafeAreaView", which contradicted Task 5's no-wallpaper branch already painting `bg-background`. Corrected to "remove `bg-background` from SafeAreaView".
- Task 7 uses `@react-native-community/slider` (added in Task 1) per the spec's requirement of a continuous 0-100 slider. The slider commits its value on `onSlidingComplete` (final position) and updates state continuously via `onValueChange` so the visible % label tracks the drag.
- All `require('@/assets/wallpaper/...')` calls in Task 2 are matched 1:1 with PNGs created by the bash loop in the previous step — verified file-by-file.
- Type names used across tasks are consistent: `WallpaperCategory`, `WallpaperPreset`, `CustomWallpaper`, `MAX_CUSTOM_WALLPAPERS` are defined in Task 2 and referenced unchanged in Tasks 3, 4, 5, 7.
