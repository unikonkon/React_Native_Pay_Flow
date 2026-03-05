import type { Category } from '@/types';

export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'isCustom'>[] = [
  { id: 'exp-food', name: 'อาหาร-เครื่องดื่ม', icon: 'fast-food', color: '#FF6B6B', type: 'expense', sortOrder: 0 },
  { id: 'exp-transport', name: 'เดินทาง', icon: 'car', color: '#4ECDC4', type: 'expense', sortOrder: 1 },
  { id: 'exp-housing', name: 'ที่พัก', icon: 'home', color: '#45B7D1', type: 'expense', sortOrder: 2 },
  { id: 'exp-health', name: 'สุขภาพ', icon: 'medkit', color: '#96CEB4', type: 'expense', sortOrder: 3 },
  { id: 'exp-entertainment', name: 'บันเทิง', icon: 'game-controller', color: '#FFEAA7', type: 'expense', sortOrder: 4 },
  { id: 'exp-clothing', name: 'เสื้อผ้า', icon: 'shirt', color: '#DDA0DD', type: 'expense', sortOrder: 5 },
  { id: 'exp-education', name: 'การศึกษา', icon: 'book', color: '#98D8C8', type: 'expense', sortOrder: 6 },
  { id: 'exp-other', name: 'อื่น ๆ', icon: 'build', color: '#B0B0B0', type: 'expense', sortOrder: 7 },
];

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'isCustom'>[] = [
  { id: 'inc-salary', name: 'เงินเดือน', icon: 'briefcase', color: '#2ECC71', type: 'income', sortOrder: 0 },
  { id: 'inc-extra', name: 'รายได้พิเศษ', icon: 'cash', color: '#27AE60', type: 'income', sortOrder: 1 },
  { id: 'inc-gift', name: 'รับของขวัญ', icon: 'gift', color: '#F39C12', type: 'income', sortOrder: 2 },
  { id: 'inc-invest', name: 'ลงทุน', icon: 'trending-up', color: '#16A085', type: 'income', sortOrder: 3 },
];

export const ALL_DEFAULT_CATEGORIES = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];
