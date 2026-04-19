// Design tokens for แมวมันนี่ (MaewMoney)
const TOKENS = {
  // Warm paper palette
  paper: '#FBF7F0',
  paperDeep: '#F5EEE0',
  ink: '#2A2320',
  inkSoft: '#6B5F55',
  inkMuted: '#9A8D80',
  hairline: 'rgba(42,35,32,0.08)',

  // Brand
  orange: '#E87A3D',
  orangeDeep: '#C85F28',
  orangeSoft: '#F5D9B8',
  orangeTint: '#FCE8D4',

  cosmic: '#6B4A9E',
  cosmicSoft: '#D8CCEC',

  gold: '#E8B547',
  goldSoft: '#F5E3B4',

  // Semantic
  income: '#3E8B68',
  incomeSoft: '#CBE5D8',
  expense: '#C65A4E',
  expenseSoft: '#F0D0CB',

  // Category pastels
  catFood: '#F5D9B8',
  catDrink: '#D9C7A8',
  catParty: '#F0CFD4',
  catFuel: '#F5D28A',
  catSalary: '#B8DBC8',
  catTransport: '#BDD6D9',
  catCoffee: '#D6BFA8',
  catGame: '#F5E09A',
  catInvest: '#CBDBB8',
  catOther: '#D3CBC3',

  // Dark mode
  darkBg: '#1F1913',
  darkSurface: '#2B2218',
  darkElev: '#362C20',
  darkText: '#F5EDE0',
  darkMuted: '#A89789',
  darkHairline: 'rgba(245,237,224,0.08)',
  darkOrange: '#F59A5E',
};

const SHADOWS = {
  card: '0 1px 2px rgba(42,35,32,0.04), 0 4px 16px rgba(42,35,32,0.05)',
  cardHover: '0 2px 4px rgba(42,35,32,0.06), 0 12px 28px rgba(42,35,32,0.08)',
  fab: '0 4px 12px rgba(232,122,61,0.35), 0 12px 28px rgba(232,122,61,0.22)',
  sheet: '0 -4px 24px rgba(42,35,32,0.12)',
};

const FONT = {
  thai: '"IBM Plex Sans Thai", "Noto Sans Thai", system-ui, sans-serif',
  num: '"Inter", ui-sans-serif, system-ui, sans-serif',
  mix: '"IBM Plex Sans Thai", "Inter", system-ui, sans-serif',
};

// Thai Buddhist month shortcodes
const THAI_MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

// Format Thai number with grouping
function fmtNum(n) {
  const s = Math.abs(n).toLocaleString('en-US');
  return s;
}
function fmtSigned(n, { plusGreen = true } = {}) {
  if (n >= 0) return '+' + fmtNum(n);
  return '-' + fmtNum(n);
}

Object.assign(window, { TOKENS, SHADOWS, FONT, THAI_MONTHS_SHORT, fmtNum, fmtSigned });
