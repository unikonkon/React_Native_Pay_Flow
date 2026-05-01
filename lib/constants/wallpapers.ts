import type { ImageSourcePropType } from "react-native";

export type WallpaperCategory =
  | "star"
  | "flower"
  | "mountain"
  | "sea"
  | "cat-food"
  | "kitten"
  | "assets-app";

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
  star: "ดวงดาว",
  flower: "ดอกไม้",
  mountain: "ภูเขา",
  sea: "ทะเล",
  "cat-food": "อาหารแมว",
  kitten: "ลูกแมว",
  "assets-app": "รูปแอป",
};

export const WALLPAPER_CATEGORY_ORDER: WallpaperCategory[] = [
  "star",
  "flower",
  "mountain",
  "sea",
  "cat-food",
  "kitten",
  "assets-app",
];

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: "star-1",
    category: "star",
    name: "ดวงดาว 1",
    source: require("@/assets/wallpaper/star-1.webp"),
  },
  {
    id: "star-2",
    category: "star",
    name: "ดวงดาว 2",
    source: require("@/assets/wallpaper/star-2.webp"),
  },
  {
    id: "flower-1",
    category: "flower",
    name: "ดอกไม้ 1",
    source: require("@/assets/wallpaper/flower-1.webp"),
  },
  {
    id: "flower-2",
    category: "flower",
    name: "ดอกไม้ 2",
    source: require("@/assets/wallpaper/flower-2.webp"),
  },
  {
    id: "mountain-1",
    category: "mountain",
    name: "ภูเขา 1",
    source: require("@/assets/wallpaper/mountain-1.webp"),
  },
  {
    id: "mountain-2",
    category: "mountain",
    name: "ภูเขา 2",
    source: require("@/assets/wallpaper/mountain-2.webp"),
  },
  {
    id: "sea-1",
    category: "sea",
    name: "ทะเล 1",
    source: require("@/assets/wallpaper/sea-1.webp"),
  },
  {
    id: "cat-food-1",
    category: "cat-food",
    name: "อาหารแมว 1",
    source: require("@/assets/wallpaper/cat-food-1.webp"),
  },
  {
    id: "kitten-1",
    category: "kitten",
    name: "ลูกแมว 1",
    source: require("@/assets/wallpaper/kitten-1.webp"),
  },
  // Reuses existing app illustrations from assets/add and assets/bg.
  {
    id: "assets-app-add4",
    category: "assets-app",
    name: "แบบ 4",
    source: require("@/assets/add/add4.png"),
  },
  {
    id: "assets-app-add7",
    category: "assets-app",
    name: "แบบ 7",
    source: require("@/assets/add/add7.png"),
  },
  {
    id: "assets-app-icon",
    category: "assets-app",
    name: "ไอคอน",
    source: require("@/assets/add/iconApp.png"),
  },
  {
    id: "assets-app-bg",
    category: "assets-app",
    name: "พื้นหลัง",
    source: require("@/assets/bg/bg.png"),
  },
  {
    id: "assets-app-bg1",
    category: "assets-app",
    name: "พื้นหลัง 1",
    source: require("@/assets/bg/bg1.png"),
  },
  {
    id: "assets-app-bg2",
    category: "assets-app",
    name: "พื้นหลัง 2",
    source: require("@/assets/bg/bg2.png"),
  },
  {
    id: "assets-app-bg3",
    category: "assets-app",
    name: "พื้นหลัง 3",
    source: require("@/assets/bg/bg3.png"),
  },
  {
    id: "assets-app-bg-empty",
    category: "assets-app",
    name: "ว่าง",
    source: require("@/assets/bg/bgEmty.png"),
  },
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
