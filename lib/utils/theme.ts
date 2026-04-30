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
  'paper-dark',
  'mocha-dark',
  'slate-dark',
  'moss-dark',
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

/**
 * Convert a `#RRGGBB` (or `#RGB`) hex color into an `rgba()` string with the
 * given alpha (0–1). Falls back to fully-opaque white if the hex is invalid.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const h = hex.replace('#', '');
  const expanded = h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h;
  if (expanded.length !== 6) return `rgba(255, 255, 255, ${a})`;
  const r = parseInt(expanded.substring(0, 2), 16);
  const g = parseInt(expanded.substring(2, 4), 16);
  const b = parseInt(expanded.substring(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(255, 255, 255, ${a})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
