import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme';

interface ThemeStore {
  currentTheme: string;
  isLoaded: boolean;
  loadTheme: () => Promise<void>;
  setTheme: (theme: string) => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  currentTheme: 'light',
  isLoaded: false,

  loadTheme: async () => {
    const saved = await AsyncStorage.getItem(THEME_KEY);
    set({ currentTheme: saved ?? 'light', isLoaded: true });
  },

  setTheme: async (theme) => {
    await AsyncStorage.setItem(THEME_KEY, theme);
    set({ currentTheme: theme });
  },
}));
