import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_ADD_MASCOT_ID, DEFAULT_BG_MASCOT_ID } from '@/lib/constants/mascots';

const THEME_KEY = 'app_theme';
const BG_MASCOT_KEY = 'app_bg_mascot';
const ADD_MASCOT_KEY = 'app_add_mascot';
const PAW_VARIANT_KEY = 'app_paw_variant';

export type PawPrintVariant = 'classic' | 'detailed' | 'outlined' | 'with-claws' | 'heart';

const PAW_VARIANTS: PawPrintVariant[] = ['classic', 'detailed', 'outlined', 'with-claws', 'heart'];

function isValidPawVariant(v: string | null): v is PawPrintVariant {
  return v !== null && (PAW_VARIANTS as string[]).includes(v);
}

interface ThemeStore {
  currentTheme: string;
  currentBgMascot: string;
  currentAddMascot: string;
  pawPrintVariant: PawPrintVariant;
  isLoaded: boolean;
  loadTheme: () => Promise<void>;
  setTheme: (theme: string) => Promise<void>;
  setBgMascot: (id: string) => Promise<void>;
  setAddMascot: (id: string) => Promise<void>;
  setPawPrintVariant: (v: PawPrintVariant) => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  currentTheme: 'warm',
  currentBgMascot: DEFAULT_BG_MASCOT_ID,
  currentAddMascot: DEFAULT_ADD_MASCOT_ID,
  pawPrintVariant: 'classic',
  isLoaded: false,

  loadTheme: async () => {
    const [theme, bg, add, paw] = await Promise.all([
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(BG_MASCOT_KEY),
      AsyncStorage.getItem(ADD_MASCOT_KEY),
      AsyncStorage.getItem(PAW_VARIANT_KEY),
    ]);
    set({
      currentTheme: theme ?? 'warm',
      currentBgMascot: bg ?? DEFAULT_BG_MASCOT_ID,
      currentAddMascot: add ?? DEFAULT_ADD_MASCOT_ID,
      pawPrintVariant: isValidPawVariant(paw) ? paw : 'classic',
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
}));
