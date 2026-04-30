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

  /**
   * Import a picked image as a custom wallpaper.
   * - Returns `null` if the user already reached `MAX_CUSTOM_WALLPAPERS` (expected, user-recoverable).
   * - Throws if the file-system copy fails (unexpected; caller should surface a generic error).
   */
  addCustomWallpaper: async (srcUri) => {
    const list = get().customWallpapers;
    if (list.length >= MAX_CUSTOM_WALLPAPERS) return null;
    const entry = await importCustomWallpaper(srcUri);
    const next = [...list, entry];
    await AsyncStorage.setItem(CUSTOM_WALLPAPERS_KEY, JSON.stringify(next));
    set({ customWallpapers: next });
    return entry;
  },

  /**
   * Delete a custom wallpaper. The selection-reset check runs after the disk
   * delete so that if the user picked a different wallpaper concurrently, that
   * pick is preserved rather than clobbered.
   */
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

// Re-export for callers that prefer to import the type from the store module.
export type { CustomWallpaper };
// Re-export so callers can ask "is this id a preset?" without importing the constants module.
export const PRESET_WALLPAPER_IDS = new Set(WALLPAPER_PRESETS.map((p) => p.id));
