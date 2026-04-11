import type { Category } from '@/types';

// 30 Expense Categories (ตามเอกสาร MOBILE-APP-ARCHITECTURE.md section 9.1)
export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'isCustom'>[] = [
  { id: 'exp-food', name: 'อาหาร', icon: 'fast-food', color: '#FF6B6B', type: 'expense', sortOrder: 0 },
  { id: 'exp-drinks', name: 'เครื่องดื่ม/กาแฟ', icon: 'cafe', color: '#8B4513', type: 'expense', sortOrder: 1 },
  { id: 'exp-transport', name: 'เดินทาง', icon: 'car', color: '#4ECDC4', type: 'expense', sortOrder: 2 },
  { id: 'exp-fuel', name: 'น้ำมัน', icon: 'flame', color: '#F59E0B', type: 'expense', sortOrder: 3 },
  { id: 'exp-public-transport', name: 'ขนส่งสาธารณะ', icon: 'bus', color: '#3B82F6', type: 'expense', sortOrder: 4 },
  { id: 'exp-rent', name: 'ค่าเช่า/ผ่อนบ้าน', icon: 'home', color: '#45B7D1', type: 'expense', sortOrder: 5 },
  { id: 'exp-electricity', name: 'ค่าไฟ', icon: 'bulb', color: '#FACC15', type: 'expense', sortOrder: 6 },
  { id: 'exp-water', name: 'ค่าน้ำ', icon: 'water', color: '#06B6D4', type: 'expense', sortOrder: 7 },
  { id: 'exp-internet', name: 'ค่าอินเทอร์เน็ต', icon: 'wifi', color: '#0EA5E9', type: 'expense', sortOrder: 8 },
  { id: 'exp-phone', name: 'โทรศัพท์', icon: 'phone-portrait', color: '#6366F1', type: 'expense', sortOrder: 9 },
  { id: 'exp-personal', name: 'ของใช้ส่วนตัว', icon: 'basket', color: '#A78BFA', type: 'expense', sortOrder: 10 },
  { id: 'exp-clothing', name: 'เสื้อผ้า', icon: 'shirt', color: '#DDA0DD', type: 'expense', sortOrder: 11 },
  { id: 'exp-shopping', name: 'ช้อปปิ้ง', icon: 'bag', color: '#EC4899', type: 'expense', sortOrder: 12 },
  { id: 'exp-health', name: 'สุขภาพ/ยา', icon: 'medkit', color: '#96CEB4', type: 'expense', sortOrder: 13 },
  { id: 'exp-exercise', name: 'ออกกำลังกาย', icon: 'barbell', color: '#84CC16', type: 'expense', sortOrder: 14 },
  { id: 'exp-entertainment', name: 'บันเทิง', icon: 'film', color: '#FFEAA7', type: 'expense', sortOrder: 15 },
  { id: 'exp-games', name: 'เกม', icon: 'game-controller', color: '#A855F7', type: 'expense', sortOrder: 16 },
  { id: 'exp-subscription', name: 'Subscription', icon: 'tv', color: '#DC2626', type: 'expense', sortOrder: 17 },
  { id: 'exp-family', name: 'ครอบครัว', icon: 'people', color: '#F472B6', type: 'expense', sortOrder: 18 },
  { id: 'exp-date', name: 'เดท', icon: 'heart', color: '#E11D48', type: 'expense', sortOrder: 19 },
  { id: 'exp-social', name: 'สังสรรค์', icon: 'wine', color: '#BE185D', type: 'expense', sortOrder: 20 },
  { id: 'exp-gifts', name: 'ของขวัญ', icon: 'gift', color: '#F97316', type: 'expense', sortOrder: 21 },
  { id: 'exp-education', name: 'การศึกษา', icon: 'school', color: '#98D8C8', type: 'expense', sortOrder: 22 },
  { id: 'exp-books', name: 'หนังสือ', icon: 'book', color: '#14B8A6', type: 'expense', sortOrder: 23 },
  { id: 'exp-travel', name: 'ท่องเที่ยว', icon: 'airplane', color: '#0891B2', type: 'expense', sortOrder: 24 },
  { id: 'exp-insurance', name: 'ประกัน', icon: 'shield-checkmark', color: '#64748B', type: 'expense', sortOrder: 25 },
  { id: 'exp-installment', name: 'ผ่อนชำระ', icon: 'card', color: '#7C3AED', type: 'expense', sortOrder: 26 },
  { id: 'exp-tax', name: 'ภาษี', icon: 'business', color: '#475569', type: 'expense', sortOrder: 27 },
  { id: 'exp-pets', name: 'สัตว์เลี้ยง', icon: 'paw', color: '#D97706', type: 'expense', sortOrder: 28 },
  { id: 'exp-other', name: 'อื่นๆ', icon: 'ellipsis-horizontal', color: '#B0B0B0', type: 'expense', sortOrder: 29 },
];

// 14 Income Categories (ตามเอกสาร MOBILE-APP-ARCHITECTURE.md section 9.2)
export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'isCustom'>[] = [
  { id: 'inc-salary', name: 'เงินเดือน', icon: 'briefcase', color: '#2ECC71', type: 'income', sortOrder: 0 },
  { id: 'inc-bonus', name: 'โบนัส', icon: 'sparkles', color: '#FACC15', type: 'income', sortOrder: 1 },
  { id: 'inc-overtime', name: 'ค่าล่วงเวลา', icon: 'time', color: '#F59E0B', type: 'income', sortOrder: 2 },
  { id: 'inc-commission', name: 'ค่าคอมมิชชั่น', icon: 'stats-chart', color: '#10B981', type: 'income', sortOrder: 3 },
  { id: 'inc-side-income', name: 'รายได้เสริม', icon: 'wallet', color: '#27AE60', type: 'income', sortOrder: 4 },
  { id: 'inc-freelance', name: 'ฟรีแลนซ์', icon: 'laptop', color: '#06B6D4', type: 'income', sortOrder: 5 },
  { id: 'inc-selling', name: 'ขายของ', icon: 'storefront', color: '#8B5CF6', type: 'income', sortOrder: 6 },
  { id: 'inc-dividend', name: 'เงินปันผล', icon: 'trending-up', color: '#16A085', type: 'income', sortOrder: 7 },
  { id: 'inc-interest', name: 'ดอกเบี้ย', icon: 'cash', color: '#14B8A6', type: 'income', sortOrder: 8 },
  { id: 'inc-investment-profit', name: 'กำไรจากการลงทุน', icon: 'analytics', color: '#0891B2', type: 'income', sortOrder: 9 },
  { id: 'inc-tax-refund', name: 'เงินคืนภาษี', icon: 'receipt', color: '#84CC16', type: 'income', sortOrder: 10 },
  { id: 'inc-gift-received', name: 'ได้รับเงิน/ของขวัญ', icon: 'gift', color: '#F39C12', type: 'income', sortOrder: 11 },
  { id: 'inc-reward', name: 'รางวัล', icon: 'trophy', color: '#EAB308', type: 'income', sortOrder: 12 },
  { id: 'inc-other', name: 'อื่นๆ', icon: 'ellipsis-horizontal', color: '#94A3B8', type: 'income', sortOrder: 13 },
];

export const ALL_DEFAULT_CATEGORIES = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];
