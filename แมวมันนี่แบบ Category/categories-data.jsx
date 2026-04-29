// Category data — Thai labels, organized by group, with cat-themed accent colors
// Colors use warm/orange-leaning oklch palette consistent with fat orange cat brand

const CATEGORIES = {
  expense: [
    { id: 'food', label: 'อาหาร', icon: 'fast-food', color: '#E87A3D', count: 42, total: 4280 },
    { id: 'noodles', label: 'ก๋วยเตี๋ยว', icon: 'noodles', color: '#D9544A', count: 18, total: 1620 },
    { id: 'dessert', label: 'ของหวาน', icon: 'dessert', color: '#E36BA0', count: 12, total: 980 },
    { id: 'fruit', label: 'ผลไม้', icon: 'fruit', color: '#5CB88A', count: 9, total: 540 },
    { id: 'cafe', label: 'กาแฟ', icon: 'cafe', color: '#8B5E3C', count: 28, total: 2240 },
    { id: 'wine', label: 'แอลกอฮอล์', icon: 'wine', color: '#9B3E5E', count: 4, total: 1600 },

    { id: 'car', label: 'รถยนต์', icon: 'car', color: '#3D7AB5', count: 6, total: 3200 },
    { id: 'bus', label: 'รถสาธารณะ', icon: 'bus', color: '#E8A53D', count: 22, total: 880 },
    { id: 'airplane', label: 'เดินทาง', icon: 'airplane', color: '#5BA8C9', count: 1, total: 8500 },

    { id: 'home', label: 'บ้าน', icon: 'home', color: '#A39685', count: 1, total: 12000 },
    { id: 'bulb', label: 'ไฟฟ้า', icon: 'bulb', color: '#E8B43D', count: 1, total: 1240 },
    { id: 'water', label: 'น้ำ', icon: 'water', color: '#4FA3D1', count: 1, total: 380 },
    { id: 'wifi', label: 'อินเทอร์เน็ต', icon: 'wifi', color: '#7A6BC9', count: 1, total: 599 },
    { id: 'flame', label: 'แก๊ส', icon: 'flame', color: '#D9544A', count: 1, total: 320 },
    { id: 'phone', label: 'มือถือ', icon: 'phone-portrait', color: '#5C7A8C', count: 1, total: 459 },
    { id: 'laundry', label: 'ซักรีด', icon: 'laundry', color: '#7DAFC9', count: 5, total: 450 },

    { id: 'cart', label: 'ของใช้', icon: 'cart', color: '#9B7BBF', count: 14, total: 2100 },
    { id: 'shirt', label: 'เสื้อผ้า', icon: 'shirt', color: '#C95C84', count: 3, total: 1850 },
    { id: 'bag', label: 'กระเป๋า', icon: 'bag', color: '#B5894F', count: 2, total: 2400 },
    { id: 'beauty', label: 'ความงาม', icon: 'beauty', color: '#E36BA0', count: 4, total: 1200 },
    { id: 'gift', label: 'ของขวัญ', icon: 'gift', color: '#D9544A', count: 2, total: 1500 },

    { id: 'medkit', label: 'สุขภาพ', icon: 'medkit', color: '#5CB88A', count: 3, total: 980 },
    { id: 'barbell', label: 'ออกกำลังกาย', icon: 'barbell', color: '#8B5E3C', count: 1, total: 690 },

    { id: 'film', label: 'หนัง', icon: 'film', color: '#5C7A8C', count: 2, total: 380 },
    { id: 'game', label: 'เกม', icon: 'game-controller', color: '#7A6BC9', count: 5, total: 890 },
    { id: 'tv', label: 'สตรีมมิ่ง', icon: 'tv', color: '#9B3E5E', count: 3, total: 597 },

    { id: 'school', label: 'การศึกษา', icon: 'school', color: '#3D7AB5', count: 1, total: 3500 },
    { id: 'book', label: 'หนังสือ', icon: 'book', color: '#B5894F', count: 4, total: 1280 },

    { id: 'people', label: 'สังสรรค์', icon: 'people', color: '#E8A53D', count: 6, total: 2400 },
    { id: 'donate', label: 'บริจาค', icon: 'donate', color: '#D9544A', count: 2, total: 500 },
    { id: 'paw', label: 'สัตว์เลี้ยง', icon: 'paw', color: '#E87A3D', count: 8, total: 1640 },

    { id: 'card', label: 'บัตรเครดิต', icon: 'card', color: '#5C7A8C', count: 1, total: 8500 },
    { id: 'receipt', label: 'บิล', icon: 'receipt', color: '#A39685', count: 7, total: 2100 },
    { id: 'other-exp', label: 'อื่นๆ', icon: 'ellipsis-horizontal', color: '#A39685', count: 3, total: 750 },
  ],
  income: [
    { id: 'salary', label: 'เงินเดือน', icon: 'salary', color: '#3E8B68', count: 1, total: 45000 },
    { id: 'briefcase', label: 'งานพิเศษ', icon: 'briefcase', color: '#5C7A8C', count: 3, total: 8500 },
    { id: 'storefront', label: 'ขายของ', icon: 'storefront', color: '#E87A3D', count: 12, total: 6200 },
    { id: 'trending-up', label: 'การลงทุน', icon: 'trending-up', color: '#3E8B68', count: 2, total: 4500 },
    { id: 'gold-coin', label: 'ทอง', icon: 'gold-coin', color: '#E8B43D', count: 1, total: 12000 },
    { id: 'piggy-bank', label: 'ออมทรัพย์', icon: 'piggy-bank', color: '#E36BA0', count: 1, total: 3000 },
    { id: 'gift-in', label: 'ของขวัญ', icon: 'gift', color: '#D9544A', count: 2, total: 2000 },
    { id: 'sparkles', label: 'โบนัส', icon: 'sparkles', color: '#E8B43D', count: 1, total: 8000 },
    { id: 'cash', label: 'เงินคืน', icon: 'cash', color: '#3E8B68', count: 4, total: 920 },
    { id: 'other-inc', label: 'อื่นๆ', icon: 'ellipsis-horizontal', color: '#A39685', count: 1, total: 350 },
  ],
};

const ICON_GROUPS = [
  { label: 'อาหาร & เครื่องดื่ม', keys: ['fast-food','noodles','dessert','fruit','cafe','wine'] },
  { label: 'เดินทาง', keys: ['car','car-sport','bus','airplane'] },
  { label: 'บ้าน & สาธารณูปโภค', keys: ['home','bulb','water','wifi','flame','phone-portrait','laundry'] },
  { label: 'ช้อปปิ้ง', keys: ['cart','basket','shirt','bag','pricetag','beauty','gift'] },
  { label: 'สุขภาพ', keys: ['medkit','barbell','body'] },
  { label: 'บันเทิง', keys: ['film','game-controller','tv','sparkles','star'] },
  { label: 'คน & สัตว์เลี้ยง', keys: ['people','heart','paw','donate','heart-hand'] },
  { label: 'การศึกษา', keys: ['school','book','notebook'] },
  { label: 'งาน & ธุรกิจ', keys: ['briefcase','business','salary','storefront','laptop','time','network'] },
  { label: 'เงิน', keys: ['cash','wallet','card','receipt','piggy-bank','savings','gold-coin'] },
  { label: 'การลงทุน', keys: ['trending-up','stats-chart','analytics','shield-checkmark','trophy'] },
  { label: 'อื่นๆ', keys: ['package','construct','ellipsis-horizontal'] },
];

const COLOR_PALETTE = [
  '#E87A3D','#D9544A','#E36BA0','#9B3E5E','#C95C84',
  '#E8A53D','#E8B43D','#B5894F','#8B5E3C','#6B4F35',
  '#5CB88A','#3E8B68','#4FA3D1','#3D7AB5','#5BA8C9',
  '#7A6BC9','#9B7BBF','#5C7A8C','#7DAFC9','#A39685',
];

window.CATEGORIES = CATEGORIES;
window.ICON_GROUPS = ICON_GROUPS;
window.COLOR_PALETTE = COLOR_PALETTE;
