// Mock data — Thai Buddhist year 2569 (= 2026)
const WALLETS = [
  { id: 'all', label: 'ทุกกระเป๋า' },
  { id: 'cash', label: 'เงินสด' },
  { id: 'kbank', label: 'กสิกรไทย' },
  { id: 'scb', label: 'ไทยพาณิชย์' },
];

const CATEGORIES = {
  food:      { label: 'อาหาร',         icon: 'food',      bg: '#F5D9B8' },
  drink:     { label: 'สังสรรค์',       icon: 'party',     bg: '#F0CFD4' },
  fuel:      { label: 'น้ำมัน',         icon: 'fuel',      bg: '#F5D28A' },
  salary:    { label: 'เงินเดือน',      icon: 'salary',    bg: '#B8DBC8' },
  transport: { label: 'เดินทาง',       icon: 'transport', bg: '#BDD6D9' },
  coffee:    { label: 'เครื่องดื่ม/กาแฟ', icon: 'coffee',    bg: '#D6BFA8' },
  game:      { label: 'เกม',           icon: 'game',      bg: '#F5E09A' },
  invest:    { label: 'เงินปันผล',      icon: 'invest',    bg: '#CBDBB8' },
  other:     { label: 'อื่นๆ',          icon: 'other',     bg: '#D3CBC3' },
  shopping:  { label: 'ช้อปปิ้ง',       icon: 'shopping',  bg: '#E8C9DC' },
  health:    { label: 'สุขภาพ',        icon: 'health',    bg: '#F0B8B8' },
  home:      { label: 'บ้าน',          icon: 'home',      bg: '#C8D4B8' },
  gift:      { label: 'ของขวัญ',        icon: 'gift',      bg: '#E8D0E0' },
  edu:       { label: 'การศึกษา',      icon: 'education', bg: '#C8D0E0' },
  pet:       { label: 'สัตว์เลี้ยง',     icon: 'pet',       bg: '#F5C8A8' },
};

// Frequent items row (matches screenshot)
const FREQUENT = [
  { cat: 'food', amount: 200 },
  { cat: 'food', amount: 250 },
  { cat: 'food', amount: 120 },
  { cat: 'food', amount: 50  },
  { cat: 'food', amount: 40  },
  { cat: 'food', amount: 30  },
  { cat: 'coffee', amount: 80 },
];

// Transactions grouped by date. Matches the dashboard screenshot.
const TRANSACTIONS = [
  {
    date: '16 เม.ย.', day: 16, income: 19000, expense: 3470,
    items: [
      { id: 1, cat: 'other', title: 'อื่นๆ', amount: -500, time: '23:24' },
      { id: 2, cat: 'drink', title: 'สังสรรค์', note: 'สังสรรค์กับเพื่อน', amount: -100, time: '22:28' },
      { id: 3, cat: 'fuel',  title: 'น้ำมัน', amount: -2000, time: '21:05', count: 3, expanded: false, subs: [
        { amount: -800, time: '21:05', note: 'ปั๊ม ปตท.' },
        { amount: -700, time: '14:20', note: 'ปั๊ม บางจาก' },
        { amount: -500, time: '08:12', note: 'ปั๊ม เชลล์' },
      ]},
      { id: 4, cat: 'salary', title: 'เงินเดือน', note: 'เงินเดือน', amount: 18000, time: '20:52' },
      { id: 5, cat: 'transport', title: 'เดินทาง', amount: -120, time: '17:11' },
      { id: 6, cat: 'coffee', title: 'เครื่องดื่ม/กาแฟ', amount: -160, time: '16:30', count: 2, expanded: false, subs: [
        { amount: -90, time: '16:30', note: 'ลาเต้เย็น' },
        { amount: -70, time: '09:15', note: 'อเมริกาโน่' },
      ]},
      { id: 7, cat: 'game', title: 'เกม', note: 'ซื้อเกม Steam', amount: -590, time: '11:35' },
      { id: 8, cat: 'invest', title: 'เงินปันผล', amount: 1000, time: '09:20' },
    ],
  },
  {
    date: '15 เม.ย.', day: 15, income: 0, expense: 890,
    items: [
      { id: 9, cat: 'food', title: 'อาหาร', note: 'ข้าวกล่องเที่ยง', amount: -120, time: '12:10' },
      { id: 10, cat: 'shopping', title: 'ช้อปปิ้ง', note: 'Lazada', amount: -540, time: '20:44' },
      { id: 11, cat: 'coffee', title: 'เครื่องดื่ม/กาแฟ', amount: -80, time: '08:22' },
      { id: 12, cat: 'transport', title: 'เดินทาง', note: 'Bolt', amount: -150, time: '18:05' },
    ],
  },
  {
    date: '14 เม.ย.', day: 14, income: 2400, expense: 340,
    items: [
      { id: 13, cat: 'gift', title: 'ของขวัญ', note: 'ของขวัญวันเกิดแม่', amount: -340, time: '14:00' },
      { id: 14, cat: 'invest', title: 'เงินปันผล', note: 'TISCO', amount: 2400, time: '09:00' },
    ],
  },
];

// Category breakdown for Summary
const CAT_BREAKDOWN = [
  { cat: 'food',      amount: 28400, pct: 27.8 },
  { cat: 'fuel',      amount: 18200, pct: 17.8 },
  { cat: 'shopping',  amount: 14600, pct: 14.3 },
  { cat: 'drink',     amount: 12100, pct: 11.8 },
  { cat: 'coffee',    amount: 9800,  pct: 9.6  },
  { cat: 'transport', amount: 7200,  pct: 7.0  },
  { cat: 'game',      amount: 5900,  pct: 5.8  },
  { cat: 'other',     amount: 5931,  pct: 5.9  },
];

const TOTALS = { income: 411400, expense: 102131, balance: 309269 };

Object.assign(window, { WALLETS, CATEGORIES, FREQUENT, TRANSACTIONS, CAT_BREAKDOWN, TOTALS });
