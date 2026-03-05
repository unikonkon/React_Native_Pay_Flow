import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Settings } from '@/types';

const SETTINGS_KEY = 'app_settings';

const DEFAULT_SETTINGS: Settings = {
  currency: 'THB',
  dateFormat: 'DD/MM/YYYY',
  defaultTab: 0,
  theme: 'system',
};

interface SettingsStore extends Settings {
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    const json = await AsyncStorage.getItem(SETTINGS_KEY);
    if (json) {
      const saved = JSON.parse(json) as Partial<Settings>;
      set({ ...DEFAULT_SETTINGS, ...saved, isLoaded: true });
    } else {
      set({ isLoaded: true });
    }
  },

  updateSettings: async (partial) => {
    const current: Settings = {
      currency: get().currency,
      dateFormat: get().dateFormat,
      defaultTab: get().defaultTab,
      theme: get().theme,
    };
    const updated = { ...current, ...partial };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    set(updated);
  },
}));
