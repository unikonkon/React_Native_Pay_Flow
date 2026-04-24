export interface ThemeSwatch {
  key: string;
  bg: string;
  card: string;
  accent: string;
  primary: string;
  ink: string;
  inkMuted: string;
  /** Hairline/divider color — matches CSS var `--border` in `global.css`. */
  border: string;
  /** Background color of the bottom tab bar — distinct surface on top of content. */
  backgroundColorTab: string;
}

export interface ThemeFamily {
  id: string;
  name: string;
  description: string;
  light?: ThemeSwatch;
  dark?: ThemeSwatch;
}

export const FAMILIES: ThemeFamily[] = [
  {
    id: 'warm',
    name: 'อบอุ่น',
    description: 'สีส้มพีชนุ่ม เหมาะกับความสบายตา',
    light: {
      key: 'warm',
      bg: '#FBF7F0', card: '#FFFFFF', accent: '#F5D9B8', primary: '#E87A3D',
      ink: '#2B2118', inkMuted: '#A39685',
      border: '#EDE4D3',
      backgroundColorTab: '#FFFFFF',
    },
    dark: {
      key: 'warm-dark',
      bg: '#1F1913', card: '#2B2218', accent: '#4A3D30', primary: '#E87A3D',
      ink: '#F5EDE0', inkMuted: '#8A7E72',
      border: '#4A3D30',
      backgroundColorTab: '#332A1E',
    },
  },
  {
    id: 'sakura',
    name: 'ซากุระ',
    description: 'ชมพูหวานแบบดอกซากุระ',
    light: {
      key: 'sakura',
      bg: '#FFF5F5', card: '#FFFFFF', accent: '#FFE0E8', primary: '#E87A3D',
      ink: '#2B2118', inkMuted: '#A39685',
      border: '#F5D5D5',
      backgroundColorTab: '#FFFFFF',
    },
    dark: {
      key: 'sakura-dark',
      bg: '#1F1517', card: '#2B1E22', accent: '#4A3338', primary: '#E87A3D',
      ink: '#F5EDE0', inkMuted: '#8A7E72',
      border: '#4A3338',
      backgroundColorTab: '#36252B',
    },
  },
  {
    id: 'ocean',
    name: 'มหาสมุทร',
    description: 'ฟ้าครามสดชื่นเหมือนทะเล',
    light: {
      key: 'ocean',
      bg: '#F0F7FB', card: '#FFFFFF', accent: '#D0E8F5', primary: '#E87A3D',
      ink: '#2B2118', inkMuted: '#A39685',
      border: '#D3E4ED',
      backgroundColorTab: '#FFFFFF',
    },
    dark: {
      key: 'ocean-dark',
      bg: '#131A1F', card: '#182228', accent: '#304A50', primary: '#E87A3D',
      ink: '#F5EDE0', inkMuted: '#8A7E72',
      border: '#304A50',
      backgroundColorTab: '#1E2B33',
    },
  },
  {
    id: 'forest',
    name: 'ป่าไม้',
    description: 'เขียวอ่อนสงบเงียบแบบธรรมชาติ',
    light: {
      key: 'forest',
      bg: '#F2F7F0', card: '#FFFFFF', accent: '#D0E8C8', primary: '#E87A3D',
      ink: '#2B2118', inkMuted: '#A39685',
      border: '#D3E4CF',
      backgroundColorTab: '#FFFFFF',
    },
    dark: {
      key: 'forest-dark',
      bg: '#151F13', card: '#1E2B1A', accent: '#334A30', primary: '#E87A3D',
      ink: '#F5EDE0', inkMuted: '#8A7E72',
      border: '#334A30',
      backgroundColorTab: '#263721',
    },
  },
  {
    id: 'midnight',
    name: 'เที่ยงคืน',
    description: 'ดำล้วน OLED ประหยัดแบต',
    dark: {
      key: 'midnight',
      bg: '#14141A', card: '#1E1E28', accent: '#2E2E3A', primary: '#E87A3D',
      ink: '#F5EDE0', inkMuted: '#8A7E72',
      border: '#2E2E3A',
      backgroundColorTab: '#242430',
    },
  },
];

/** Lookup a theme's swatch by its key (e.g. 'warm', 'warm-dark', 'midnight'). */
export function getThemeSwatch(themeKey: string): ThemeSwatch | null {
  for (const family of FAMILIES) {
    if (family.light?.key === themeKey) return family.light;
    if (family.dark?.key === themeKey) return family.dark;
  }
  return null;
}

/** Tab bar background color for the given theme key (falls back to warm-light white). */
export function getTabBarBackgroundColor(themeKey: string): string {
  return getThemeSwatch(themeKey)?.backgroundColorTab ?? '#FFFFFF';
}
