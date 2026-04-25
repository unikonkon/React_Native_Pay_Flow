import { useThemeStore } from '@/lib/stores/theme-store';

export const DARK_THEMES = new Set([
  'warm-dark',
  'sakura-dark',
  'ocean-dark',
  'forest-dark',
  'midnight',
  'plum-dark',
  'honey',
  'emerald-dark',
]);

export function useIsDarkTheme(): boolean {
  const currentTheme = useThemeStore((s) => s.currentTheme);
  return DARK_THEMES.has(currentTheme);
}

/**
 * Pick a color based on current theme mode.
 * Use for inline styles or SVG attributes where NativeWind classes aren't available.
 */
export function useThemeColor(lightColor: string, darkColor: string): string {
  const isDark = useIsDarkTheme();
  return isDark ? darkColor : lightColor;
}
