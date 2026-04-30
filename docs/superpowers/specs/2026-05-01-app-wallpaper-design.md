# App Wallpaper Background — Design

**Date:** 2026-05-01
**Status:** Draft — pending user review
**Owner:** dev@iapp.co.th

## 1. Goal

Let users pick a full-screen background image ("wallpaper") that displays
behind app content on the four main tab screens
(`รายการ` / `สรุป` / `Premium` / `ตั้งค่า`). The picker offers 12
preset images grouped into 6 themed categories (2 each: stars, flowers,
mountains, sea, cat-food, kittens) plus a "custom" slot where the user
can pick images from their device gallery and delete them.

A dim/tint overlay sits between the wallpaper and app content so text
remains legible. The overlay strength is user-adjustable via a slider.

## 2. Non-goals

- Wallpaper does not appear on modals (`transaction/add`,
  `CategoryGridModal`, `CategorySettingsModal`, etc.) or on
  Stack-pushed sub-screens (e.g. `settings/wallets`,
  `settings/categories`). Only the four main tab screens.
- No cropping, filters, or image editing — user picks the image as-is.
- No camera capture — gallery only.
- Wallpaper picker does not change the color theme. The user still
  picks color theme and wallpaper independently. The two compose: the
  overlay color is derived from the current color theme's `--background`,
  so changing color theme tints the overlay automatically.

## 3. User-visible behavior

### 3.1 Default state

On first install, no wallpaper is set. The four tab screens render
their existing solid `bg-background` color from the active color theme.
This matches the app's current behavior — adding the feature does not
alter the default look.

### 3.2 Wallpaper selection

In `ตั้งค่า → ธีม` (the existing `ThemeSettingsContent`), a new section
"พื้นหลังของแอป" appears below "ลายตีนแมว". The section is laid out
top-to-bottom as:

1. **"ไม่ใช้" tile** — a standalone tile at the very top of the
   wallpaper section, always visible regardless of whether a
   wallpaper is selected. Tapping it clears the wallpaper selection.
   It is rendered as a single card (not inside any horizontal scroll
   row) so it is always reachable without scrolling.
2. **Overlay strength slider** — values 0–100%, default 50%. Visible
   only when `currentWallpaperId !== null`. The slider's track and
   thumb use the active theme's `--primary` color for visual
   consistency with other controls.
3. **Preset categories** — six labeled sub-sections (one per
   `WallpaperCategory`), each with its Thai label as a small heading
   and two thumbnails laid out in a horizontal scroll row beneath.
4. **Custom section** — labeled "ของคุณ", a horizontal row of the
   user's saved custom wallpapers followed by a `+ เพิ่ม` tile. Each
   custom thumbnail has a small ✕ button at the top-right that, when
   tapped, prompts an `Alert.alert('ลบรูปนี้ใช่ไหม?', ...)` confirmation
   before deleting. The `+ เพิ่ม` tile is rendered after the last
   custom thumbnail and is disabled (greyed out) when the user has
   reached 10 customs.

Tapping any tile (preset or custom) selects it as the current
wallpaper. Selection is reflected immediately on the tab screens
(no page reload needed) because the wallpaper is read from the
Zustand `theme-store` which already drives reactive re-renders.

### 3.3 Adding a custom wallpaper

Tap `+ เพิ่ม` → `expo-image-picker` launches the OS gallery picker
(`mediaTypes: 'images'`, `quality: 0.85`, `allowsEditing: false`).
On success the file is copied into
`${Paths.document}/wallpapers/${uuid}.${ext}` using
`expo-file-system`'s new API (`File`, `Paths`). The custom entry is
appended to `customWallpapers` in the theme store and persisted in
AsyncStorage.

If the user already has 10 custom wallpapers, the `+ เพิ่ม` tile is
disabled and tapping it shows
`Alert.alert('เพิ่มได้สูงสุด 10 รูป', 'กรุณาลบรูปเก่าก่อน')`.

### 3.4 Deleting a custom wallpaper

Tap the ✕ button on a custom thumbnail → a native
`Alert.alert('ลบรูปนี้ใช่ไหม?', ...)` confirms. On confirm the file is
removed from the documents folder and the entry is dropped from
AsyncStorage. If the deleted wallpaper was the currently selected one,
the selection falls back to `null` (i.e. "ไม่ใช้").

### 3.5 Overlay behavior

The overlay is a solid-color view at `position: absolute` filling the
screen. Its color is the current theme's `--background` value
(resolved via `getThemeSwatch(currentTheme).bg`), and its opacity is
`wallpaperOverlayPercent / 100`. So:

- 0 % = wallpaper at full vibrance.
- 50 % = mid-balance (default).
- 100 % = wallpaper completely hidden, looks identical to "ไม่ใช้".

Card components keep their solid `bg-card` background — the wallpaper
shows through only the screen's outer empty space, not through cards.

## 4. Architecture

### 4.1 New files

| File | Purpose |
|---|---|
| `lib/constants/wallpapers.ts` | Preset metadata (id, category, name, source) and category labels. |
| `lib/utils/wallpaper-storage.ts` | Helpers to import/delete custom wallpapers via `expo-file-system` new API. |
| `components/layout/WallpaperBackground.tsx` | Full-screen `<View>` that renders the wallpaper + overlay + children, or just children if no wallpaper. |
| `assets/wallpaper/*.png` | Twelve preset image files (placeholder PNGs created during implementation; user replaces with real images later). |

### 4.2 Modified files

| File | Change |
|---|---|
| `lib/stores/theme-store.ts` | Add `currentWallpaperId`, `wallpaperOverlayPercent`, `customWallpapers`; add setters/CRUD; extend `loadTheme`. |
| `components/settings/ThemeSettingsContent.tsx` | Add "พื้นหลังของแอป" section with slider + preset rows + custom row. |
| `app/(tabs)/index.tsx` | Wrap `<SafeAreaView>` content with `<WallpaperBackground>`. |
| `app/(tabs)/analytics.tsx` | Same wrap. |
| `app/(tabs)/ai-analysis.tsx` | Same wrap. |
| `app/(tabs)/more.tsx` | Same wrap. |
| `package.json` | Add `expo-image-picker` (~17.x compatible with Expo SDK 54). |
| `app.json` | Add iOS `NSPhotoLibraryUsageDescription` and Android permissions if needed by `expo-image-picker`. |

### 4.3 Data model

```ts
// lib/constants/wallpapers.ts
export type WallpaperCategory =
  | 'star' | 'flower' | 'mountain' | 'sea' | 'cat-food' | 'kitten';

export interface WallpaperPreset {
  id: string;                    // 'star-1', 'star-2', 'flower-1', ...
  category: WallpaperCategory;
  name: string;                  // ภาษาไทย: 'ดวงดาว 1' ฯลฯ
  source: ImageSourcePropType;   // require('@/assets/wallpaper/star-1.png')
}

export const WALLPAPER_CATEGORY_LABELS: Record<WallpaperCategory, string> = {
  star: 'ดวงดาว',
  flower: 'ดอกไม้',
  mountain: 'ภูเขา',
  sea: 'ทะเล',
  'cat-food': 'อาหารแมว',
  kitten: 'ลูกแมว',
};

export const WALLPAPER_PRESETS: WallpaperPreset[];   // 12 entries
```

```ts
// lib/stores/theme-store.ts (extension)
export interface CustomWallpaper {
  id: string;        // uuid
  uri: string;       // file://...
  addedAt: number;   // unix ms
}

interface ThemeStore {
  // ... existing ...
  currentWallpaperId: string | null;       // null | preset id | custom uuid
  wallpaperOverlayPercent: number;         // 0..100
  customWallpapers: CustomWallpaper[];     // up to 10

  setWallpaper: (id: string | null) => Promise<void>;
  setOverlayPercent: (n: number) => Promise<void>;
  addCustomWallpaper: (srcUri: string) => Promise<CustomWallpaper | null>;
  removeCustomWallpaper: (id: string) => Promise<void>;
}
```

### 4.4 AsyncStorage keys

| Key | Type | Default |
|---|---|---|
| `app_wallpaper` | `string \| ''` (empty string = null) | `''` |
| `app_wallpaper_overlay` | `string` (numeric 0–100) | `'50'` |
| `app_custom_wallpapers` | `string` (JSON array of `CustomWallpaper`) | `'[]'` |

### 4.5 File-system layout

```
${Paths.document}/
  wallpapers/
    {uuid}.png         ← copied user images
    {uuid}.jpg
    ...
```

The `wallpapers/` directory is created on first import using
`new Directory(Paths.document, 'wallpapers').create({ idempotent: true })`.

### 4.6 WallpaperBackground component contract

```tsx
type Props = { children: React.ReactNode };

function WallpaperBackground({ children }: Props) {
  const wallpaperId   = useThemeStore(s => s.currentWallpaperId);
  const overlayPct    = useThemeStore(s => s.wallpaperOverlayPercent);
  const themeKey      = useThemeStore(s => s.currentTheme);
  const customs       = useThemeStore(s => s.customWallpapers);

  // No wallpaper → plain bg-background container (preserves current look)
  if (!wallpaperId) {
    return <View style={{ flex: 1 }} className="bg-background">{children}</View>;
  }

  const source = resolveWallpaperSource(wallpaperId, customs);
  if (!source) {
    // Wallpaper id no longer resolvable (e.g. custom file deleted) → fall back
    return <View style={{ flex: 1 }} className="bg-background">{children}</View>;
  }

  const overlayColor = getThemeSwatch(themeKey)?.bg ?? '#FBF7F0';

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <Image source={source} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <View style={[
        StyleSheet.absoluteFillObject,
        { backgroundColor: overlayColor, opacity: overlayPct / 100 },
      ]} />
      {children}
    </View>
  );
}
```

`resolveWallpaperSource(id, customs)` returns:
- the preset's `source` if `id` matches a preset, OR
- `{ uri: customs.find(c => c.id === id)?.uri }` if it's a custom id, OR
- `null` if neither.

### 4.7 Overlay slider — disabled state

The slider is rendered only when `currentWallpaperId !== null`, so the
slider can never produce a visible effect when there is no wallpaper.
This keeps the UI clean and prevents the user from "tweaking nothing".

## 5. Edge cases

| Case | Handling |
|---|---|
| Custom wallpaper file missing on disk (e.g. user wiped app data manually) | `resolveWallpaperSource` returns `null` → `WallpaperBackground` falls back to plain `bg-background`. The stale entry is *not* auto-cleaned during load (cheap to keep; UI still selectable but won't render an image). A future cleanup pass can be added if it becomes a real problem. |
| User selects custom wallpaper, then deletes it | `removeCustomWallpaper` resets `currentWallpaperId` to `null` if the deleted id matches. |
| Picker cancel | `addCustomWallpaper` returns `null` and no state changes. |
| Picker fails (permission denied) | Show `Alert.alert('ขออนุญาตเข้าถึงรูปภาพ', ...)` with an OK button. Permission is requested via `MediaLibrary.requestPermissionsAsync()` from `expo-image-picker`. |
| 10-custom limit reached | `+ เพิ่ม` tile is disabled and shows `Alert.alert('เพิ่มได้สูงสุด 10 รูป')` if pressed. |
| Theme color changed while wallpaper active | Overlay color updates automatically because it's read from the active theme on every render. No extra wiring. |
| App restart | `loadTheme` reads all three new keys in the existing `Promise.all` and restores state. |
| Modals (`transaction/add`) | Wallpaper does NOT show — modals have their own `<GestureHandlerRootView>` and `<View>` layer that does not include `<WallpaperBackground>`. This is intentional per non-goals. |

## 6. Performance considerations

- `<Image>` with a static `require()` source is cached by Metro;
  switching presets is a `setState` plus an image swap.
- For custom wallpapers, the image is loaded from a local file URI;
  `expo-image` is *not* used (we keep `react-native`'s `<Image>` for
  consistency with the rest of the codebase). If perf becomes an issue
  on low-end Android, switching to `expo-image` is a cheap follow-up.
- Overlay opacity changes during slider drag are GPU-cheap (single
  layer composite). We do not animate via Reanimated; React state is
  enough for a settings-screen interaction.

## 7. Testing strategy

Manual smoke-test plan (no automated tests in this codebase yet):

1. Default → no wallpaper → all four tabs look unchanged from before.
2. Pick `ดวงดาว 1` → wallpaper visible on all four tabs, not on
   `transaction/add` modal, not on `settings/wallets`.
3. Slide overlay 0 → 100 % → wallpaper fades out smoothly.
4. Switch color theme (e.g. warm → ocean-dark) → overlay tint shifts
   to the new theme's `--background`. Cards remain solid.
5. Add a custom image from gallery → appears in the custom row,
   selectable.
6. Reach 10-custom limit → `+ เพิ่ม` disabled.
7. Delete a custom wallpaper that's currently selected → selection
   resets to `ไม่ใช้` and the file is gone from
   `${Paths.document}/wallpapers/`.
8. Kill and re-open the app → previously selected wallpaper +
   slider value restored.
9. Repeat all tests on Android emulator (the platform that exposed the
   theme-vars issue earlier — confirm wallpaper composition works
   identically on iOS and Android).

## 8. Out of scope follow-ups (potential future work)

- A separate "ความเข้มของ wallpaper" preset chip (เบา / กลาง / เข้ม)
  layered on top of the slider, for users who don't want to fiddle.
- Auto-clean-up of stale custom-wallpaper entries whose files have
  vanished.
- Per-screen wallpapers (different image on each tab).
- Sharing wallpapers between devices via cloud sync.

## 9. Open implementation details (resolved during plan write-up)

- Exact `expo-image-picker` version compatible with Expo SDK 54
  (`~54.0.x`) — the planning step will pin this against
  `npx expo install expo-image-picker`.
- Whether to use `Paths.document` or `Paths.cache` for wallpaper
  storage — `Paths.document` is the chosen target (durable across
  app updates).

## 10. Image-generation prompts for the 12 presets

Provided separately at the end of implementation as a one-shot list
the user can paste into Midjourney / DALL·E / Flux. The codebase only
needs placeholder 1×1 PNGs at the agreed paths so `require()` succeeds
during Metro bundling.
