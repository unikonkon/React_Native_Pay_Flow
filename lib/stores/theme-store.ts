import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_ADD_MASCOT_ID, DEFAULT_BG_MASCOT_ID } from '@/lib/constants/mascots';

const THEME_KEY = 'app_theme';
const BG_MASCOT_KEY = 'app_bg_mascot';
const ADD_MASCOT_KEY = 'app_add_mascot';

interface ThemeStore {
  currentTheme: string;
  currentBgMascot: string;
  currentAddMascot: string;
  isLoaded: boolean;
  loadTheme: () => Promise<void>;
  setTheme: (theme: string) => Promise<void>;
  setBgMascot: (id: string) => Promise<void>;
  setAddMascot: (id: string) => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  currentTheme: 'warm',
  currentBgMascot: DEFAULT_BG_MASCOT_ID,
  currentAddMascot: DEFAULT_ADD_MASCOT_ID,
  isLoaded: false,

  loadTheme: async () => {
    const [theme, bg, add] = await Promise.all([
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(BG_MASCOT_KEY),
      AsyncStorage.getItem(ADD_MASCOT_KEY),
    ]);
    set({
      currentTheme: theme ?? 'warm',
      currentBgMascot: bg ?? DEFAULT_BG_MASCOT_ID,
      currentAddMascot: add ?? DEFAULT_ADD_MASCOT_ID,
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
}));
