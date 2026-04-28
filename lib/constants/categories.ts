import type { Category } from "@/types";

// 16 Essential Expense Categories — เลือกเฉพาะที่จำเป็นสำหรับวัยทำงาน
// (อาหาร, การเดินทาง, ที่อยู่อาศัย/utility, ช้อปปิ้ง, สุขภาพ, บันเทิง,
//  ประกัน/ผ่อน/ภาษี และ "อื่นๆ" สำหรับใช้รวมหมวดที่ไม่เข้าหมวด)
export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, "isCustom">[] = [
  {
    id: "exp-food",
    name: "อาหาร",
    icon: "fast-food",
    color: "#F5A185",
    type: "expense",
    sortOrder: 0,
  },
  {
    id: "exp-drinks",
    name: "เครื่องดื่ม/กาแฟ",
    icon: "cafe",
    color: "#B8856B",
    type: "expense",
    sortOrder: 1,
  },
  {
    id: "exp-transport",
    name: "เดินทาง",
    icon: "car",
    color: "#8AC5C5",
    type: "expense",
    sortOrder: 2,
  },
  {
    id: "exp-family",
    name: "ครอบครัว",
    icon: "people",
    color: "#F5B8BC",
    type: "expense",
    sortOrder: 3,
  },
  {
    id: "exp-rent",
    name: "ค่าเช่า/ผ่อนบ้าน",
    icon: "home",
    color: "#D4A544",
    type: "expense",
    sortOrder: 4,
  },
  {
    id: "exp-phone",
    name: "โทรศัพท์",
    icon: "phone-portrait",
    color: "#4A7FC1",
    type: "expense",
    sortOrder: 5,
  },
  {
    id: "exp-personal",
    name: "ของใช้ส่วนตัว",
    icon: "basket",
    color: "#FFB3C7",
    type: "expense",
    sortOrder: 6,
  },
  {
    id: "exp-shopping",
    name: "ช้อปปิ้ง",
    icon: "bag",
    color: "#F59FB8",
    type: "expense",
    sortOrder: 7,
  },
  {
    id: "exp-health",
    name: "สุขภาพ/ยา",
    icon: "medkit",
    color: "#9FC9A8",
    type: "expense",
    sortOrder: 8,
  },
  {
    id: "exp-entertainment",
    name: "บันเทิง",
    icon: "film",
    color: "#F5D988",
    type: "expense",
    sortOrder: 9,
  },
  {
    id: "exp-date",
    name: "เดท",
    icon: "heart",
    color: "#FFB3C7",
    type: "expense",
    sortOrder: 10,
  },
  {
    id: "exp-travel",
    name: "ท่องเที่ยว",
    icon: "airplane",
    color: "#8AC5C5",
    type: "expense",
    sortOrder: 11,
  },
  {
    id: "exp-insurance",
    name: "ประกัน",
    icon: "shield-checkmark",
    color: "#A39685",
    type: "expense",
    sortOrder: 12,
  },
  {
    id: "exp-installment",
    name: "ผ่อนชำระ",
    icon: "card",
    color: "#6B4A9E",
    type: "expense",
    sortOrder: 13,
  },
  {
    id: "exp-tax",
    name: "ภาษี",
    icon: "business",
    color: "#A39685",
    type: "expense",
    sortOrder: 14,
  },
  {
    id: "exp-other",
    name: "อื่นๆ",
    icon: "ellipsis-horizontal",
    color: "#A39685",
    type: "expense",
    sortOrder: 15,
  },
];

// ===== หมวดหมู่เสริม (ไม่ได้ใช้เป็นค่าเริ่มต้นแล้ว) =====
// เคยอยู่ใน DEFAULT_EXPENSE_CATEGORIES แต่ถูกตัดออกเพื่อให้เหลือ 16 หมวดที่
// จำเป็นสำหรับวัยทำงาน — ใช้เป็นรายการ "หมวดแนะนำ" ในหน้าเพิ่มหมวดเอง
// (AddCategoryModal) เพื่อให้ผู้ใช้กดเลือกแล้วเติม name/icon/color ให้ทันที
export const SUGGESTED_EXPENSE_CATEGORIES: {
  name: string;
  icon: string;
  color: string;
}[] = [
  { name: "ก๋วยเตี๋ยว", icon: "noodles", color: "#B8856B" },
  { name: "ของหวาน", icon: "dessert", color: "#FFB3C7" },
  { name: "ผลไม้", icon: "fruit", color: "#F5A185" },
  { name: "น้ำมัน", icon: "flame", color: "#F0A830" },
  { name: "ค่าไฟ", icon: "bulb", color: "#F0A830" },
  { name: "ค่าน้ำ", icon: "water", color: "#8AC5C5" },
  { name: "ค่าอินเทอร์เน็ต", icon: "wifi", color: "#6B4A9E" },
  { name: "ขนส่งสาธารณะ", icon: "bus", color: "#8AC5C5" },
  { name: "เสื้อผ้า", icon: "shirt", color: "#F59FB8" },
  { name: "ออกกำลังกาย", icon: "barbell", color: "#9FC9A8" },
  { name: "เกม", icon: "game-controller", color: "#F5D988" },
  { name: "Subscription", icon: "tv", color: "#B5A8DB" },
  { name: "สังสรรค์", icon: "wine", color: "#F5B8BC" },
  { name: "ของขวัญ", icon: "gift", color: "#E8B547" },
  { name: "การศึกษา", icon: "school", color: "#B5A8DB" },
  { name: "สัตว์เลี้ยง", icon: "paw", color: "#F5A185" },
  { name: "ค่าซ่อมแซม/บำรุงรักษา", icon: "construct", color: "#4A7FC1" },
  { name: "ทำบุญ/บริจาค", icon: "donate", color: "#F5A185" },
  { name: "ค่าทางด่วน/ที่จอดรถ", icon: "car-sport", color: "#8AC5C5" },
  { name: "ค่าดูแลบุตร/เด็ก", icon: "body", color: "#F59FB8" },
  { name: "ซักผ้า", icon: "laundry", color: "#8AC5C5" },
  { name: "เงินเดือน", icon: "salary", color: "#F0A830" },
  { name: "Amway", icon: "network", color: "#B5A8DB" },
  { name: "ออมเงิน", icon: "savings", color: "#FFB3C7" },
  { name: "ออมทอง", icon: "gold-coin", color: "#E8B547" },
  { name: "หนังสือ", icon: "notebook", color: "#B5A8DB" },
  { name: "อยากสวย", icon: "beauty", color: "#F59FB8" },
];

// 14 Income Categories (ตามเอกสาร MOBILE-APP-ARCHITECTURE.md section 9.2)
export const DEFAULT_INCOME_CATEGORIES: Omit<Category, "isCustom">[] = [
  {
    id: "inc-salary",
    name: "เงินเดือน",
    icon: "briefcase",
    color: "#3E8B68",
    type: "income",
    sortOrder: 0,
  },
  {
    id: "inc-bonus",
    name: "โบนัส",
    icon: "sparkles",
    color: "#E8B547",
    type: "income",
    sortOrder: 1,
  },
  {
    id: "inc-overtime",
    name: "ค่าล่วงเวลา",
    icon: "time",
    color: "#F0A830",
    type: "income",
    sortOrder: 2,
  },
  {
    id: "inc-commission",
    name: "ค่าคอมมิชชั่น",
    icon: "stats-chart",
    color: "#3E8B68",
    type: "income",
    sortOrder: 3,
  },
  {
    id: "inc-side-income",
    name: "รายได้เสริม",
    icon: "wallet",
    color: "#3E8B68",
    type: "income",
    sortOrder: 4,
  },
  {
    id: "inc-freelance",
    name: "ฟรีแลนซ์",
    icon: "laptop",
    color: "#4A7FC1",
    type: "income",
    sortOrder: 5,
  },
  {
    id: "inc-selling",
    name: "ขายของ",
    icon: "storefront",
    color: "#F5A185",
    type: "income",
    sortOrder: 6,
  },
  {
    id: "inc-dividend",
    name: "เงินปันผล",
    icon: "trending-up",
    color: "#6B4A9E",
    type: "income",
    sortOrder: 7,
  },
  {
    id: "inc-interest",
    name: "ดอกเบี้ย",
    icon: "cash",
    color: "#3E8B68",
    type: "income",
    sortOrder: 8,
  },
  {
    id: "inc-investment-profit",
    name: "กำไรจากการลงทุน",
    icon: "analytics",
    color: "#8AC5C5",
    type: "income",
    sortOrder: 9,
  },
  {
    id: "inc-tax-refund",
    name: "เงินคืนภาษี",
    icon: "receipt",
    color: "#E8B547",
    type: "income",
    sortOrder: 10,
  },
  {
    id: "inc-gift-received",
    name: "ได้รับเงิน/ของขวัญ",
    icon: "gift",
    color: "#FFB3C7",
    type: "income",
    sortOrder: 11,
  },
  {
    id: "inc-reward",
    name: "รางวัล",
    icon: "trophy",
    color: "#E8B547",
    type: "income",
    sortOrder: 12,
  },
  {
    id: "inc-other",
    name: "อื่นๆ",
    icon: "ellipsis-horizontal",
    color: "#A39685",
    type: "income",
    sortOrder: 13,
  },
];

export const ALL_DEFAULT_CATEGORIES = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];

// ===== Color palette for the category color picker =====
// Curated warm/pastel palette pulled from the colors actually used across
// DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, and
// SUGGESTED_EXPENSE_CATEGORIES — keeps user-created categories visually
// cohesive with the seeded defaults instead of clashing saturated hues.
// Grouped by hue family for a tidy 3×6 grid in `AddCategoryModal`.
export const CATEGORY_COLOR_OPTIONS: string[] = [
  // warm / orange / yellow
  '#F5A185', '#E87A3D', '#F0A830', '#E8B547', '#D4A544', '#F5D988',
  // brown / pink / red
  '#B8856B', '#F59FB8', '#FFB3C7', '#F5B8BC', '#E11D48', '#9FC9A8',
  // green / blue / purple / neutral
  '#5CB88A', '#3E8B68', '#8AC5C5', '#4A7FC1', '#B5A8DB', '#6B4A9E',
];
