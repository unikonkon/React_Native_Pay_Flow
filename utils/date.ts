const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export function formatDateThai(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = THAI_MONTHS[d.getMonth()];
  return `${day} ${month}`;
}

export function formatMonthYearThai(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  const monthName = THAI_MONTHS_FULL[parseInt(month, 10) - 1];
  const buddhistYear = parseInt(year, 10) + 543;
  return `${monthName} ${buddhistYear}`;
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function shiftMonth(month: string, offset: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
