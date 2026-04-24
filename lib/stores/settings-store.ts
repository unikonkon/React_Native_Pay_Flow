import type { Settings } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const SETTINGS_KEY = "app_settings";

const DEFAULT_SETTINGS: Settings = {
  currency: "THB",
  dateFormat: "DD/MM/YYYY",
  defaultTab: 0,
  defaultWalletId: "wallet-cash",
  categoryColumns: 6,
  categoryRows: 3,
  recCategoryColumns: 6,
  recCategoryRows: 1,
  recTxColumns: 2,
  recTxRows: 2,
  defaultCategoryTab: "select",
  showCommonCategories: true,
  showTopCategories: false,
  showFrequentPills: true,
  commonCategoryLimit: 10,
  topCategoryLimit: 8,
  addTxSheetHeight: 87,
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
      defaultWalletId: get().defaultWalletId,
      categoryColumns: get().categoryColumns,
      categoryRows: get().categoryRows,
      recCategoryColumns: get().recCategoryColumns,
      recCategoryRows: get().recCategoryRows,
      recTxColumns: get().recTxColumns,
      recTxRows: get().recTxRows,
      defaultCategoryTab: get().defaultCategoryTab,
      showCommonCategories: get().showCommonCategories,
      showTopCategories: get().showTopCategories,
      showFrequentPills: get().showFrequentPills,
      commonCategoryLimit: get().commonCategoryLimit,
      topCategoryLimit: get().topCategoryLimit,
      addTxSheetHeight: get().addTxSheetHeight,
    };
    const updated = { ...current, ...partial };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    set(updated);
  },
}));
