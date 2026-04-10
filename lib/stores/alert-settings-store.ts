import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AlertSettings, CategoryLimit } from '@/types';

const ALERT_SETTINGS_KEY = 'alert_settings';

const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  monthlyExpenseTarget: 0,
  isMonthlyTargetEnabled: false,
  categoryLimits: [],
  isCategoryLimitsEnabled: false,
};

interface AlertSettingsStore extends AlertSettings {
  isLoaded: boolean;
  loadAlertSettings: () => Promise<void>;
  updateAlertSettings: (partial: Partial<AlertSettings>) => Promise<void>;
  addCategoryLimit: (categoryId: string, limit: number) => Promise<void>;
  removeCategoryLimit: (categoryId: string) => Promise<void>;
}

export const useAlertSettingsStore = create<AlertSettingsStore>((set, get) => ({
  ...DEFAULT_ALERT_SETTINGS,
  isLoaded: false,

  loadAlertSettings: async () => {
    const json = await AsyncStorage.getItem(ALERT_SETTINGS_KEY);
    if (json) {
      const saved = JSON.parse(json) as Partial<AlertSettings>;
      set({ ...DEFAULT_ALERT_SETTINGS, ...saved, isLoaded: true });
    } else {
      set({ isLoaded: true });
    }
  },

  updateAlertSettings: async (partial) => {
    const current: AlertSettings = {
      monthlyExpenseTarget: get().monthlyExpenseTarget,
      isMonthlyTargetEnabled: get().isMonthlyTargetEnabled,
      categoryLimits: get().categoryLimits,
      isCategoryLimitsEnabled: get().isCategoryLimitsEnabled,
    };
    const updated = { ...current, ...partial };
    await AsyncStorage.setItem(ALERT_SETTINGS_KEY, JSON.stringify(updated));
    set(updated);
  },

  addCategoryLimit: async (categoryId, limit) => {
    const limits = [...get().categoryLimits.filter(l => l.categoryId !== categoryId), { categoryId, limit }];
    await get().updateAlertSettings({ categoryLimits: limits });
  },

  removeCategoryLimit: async (categoryId) => {
    const limits = get().categoryLimits.filter(l => l.categoryId !== categoryId);
    await get().updateAlertSettings({ categoryLimits: limits });
  },
}));
