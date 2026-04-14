import type { Period, PeriodType } from '@/types';
import { THAI_MONTHS, THAI_MONTHS_FULL, formatDateRangeThai } from './format';

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const ALL_START = '1970-01-01';

function mondayOf(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function getCurrentPeriod(type: PeriodType): Period {
  const now = new Date();
  switch (type) {
    case 'week':
      return { type, anchor: toISO(mondayOf(now)) };
    case 'month':
      return { type, anchor: toISO(firstOfMonth(now)) };
    case '3months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { type, anchor: toISO(start) };
    }
    case '6months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return { type, anchor: toISO(start) };
    }
    case 'year':
      return { type, anchor: `${now.getFullYear()}-01-01` };
    case 'all':
      return { type, anchor: ALL_START };
  }
}

export function getPeriodRange(p: Period): { start: string; end: string } {
  const a = new Date(p.anchor);
  switch (p.type) {
    case 'week': {
      const end = new Date(a);
      end.setDate(a.getDate() + 6);
      return { start: toISO(a), end: toISO(end) };
    }
    case 'month': {
      const end = new Date(a.getFullYear(), a.getMonth() + 1, 0);
      return { start: toISO(a), end: toISO(end) };
    }
    case '3months': {
      const end = new Date(a.getFullYear(), a.getMonth() + 3, 0);
      return { start: toISO(a), end: toISO(end) };
    }
    case '6months': {
      const end = new Date(a.getFullYear(), a.getMonth() + 6, 0);
      return { start: toISO(a), end: toISO(end) };
    }
    case 'year':
      return { start: `${a.getFullYear()}-01-01`, end: `${a.getFullYear()}-12-31` };
    case 'all':
      return { start: ALL_START, end: toISO(new Date()) };
  }
}

export function canShiftPeriod(p: Period): boolean {
  return p.type !== 'all';
}

export function shiftPeriod(p: Period, dir: -1 | 1): Period {
  const a = new Date(p.anchor);
  switch (p.type) {
    case 'week': {
      a.setDate(a.getDate() + 7 * dir);
      return { type: 'week', anchor: toISO(a) };
    }
    case 'month': {
      const n = new Date(a.getFullYear(), a.getMonth() + dir, 1);
      return { type: 'month', anchor: toISO(n) };
    }
    case '3months': {
      const n = new Date(a.getFullYear(), a.getMonth() + 3 * dir, 1);
      return { type: '3months', anchor: toISO(n) };
    }
    case '6months': {
      const n = new Date(a.getFullYear(), a.getMonth() + 6 * dir, 1);
      return { type: '6months', anchor: toISO(n) };
    }
    case 'year':
      return { type: 'year', anchor: `${a.getFullYear() + dir}-01-01` };
    case 'all':
      return p;
  }
}

export function formatPeriodLabel(p: Period): string {
  const { start, end } = getPeriodRange(p);
  switch (p.type) {
    case 'week':
      return formatDateRangeThai(start, end);
    case 'month': {
      const a = new Date(p.anchor);
      return `${THAI_MONTHS_FULL[a.getMonth()]} ${a.getFullYear() + 543}`;
    }
    case '3months':
    case '6months': {
      const s = new Date(start);
      const e = new Date(end);
      return `${THAI_MONTHS[s.getMonth()]} ${s.getFullYear() + 543} - ${THAI_MONTHS[e.getMonth()]} ${e.getFullYear() + 543}`;
    }
    case 'year':
      return `ปี ${new Date(p.anchor).getFullYear() + 543}`;
    case 'all':
      return 'ทั้งหมด';
  }
}

export function listRecentAnchors(type: PeriodType, count: number): Period[] {
  const out: Period[] = [];
  let cur = getCurrentPeriod(type);
  for (let i = 0; i < count; i++) {
    out.push(cur);
    cur = shiftPeriod(cur, -1);
  }
  return out;
}

export function periodsEqual(a: Period, b: Period): boolean {
  return a.type === b.type && a.anchor === b.anchor;
}

export function getBarChartBuckets(
  p: Period,
): { start: string; end: string; label: string }[] {
  const buckets: { start: string; end: string; label: string }[] = [];
  const a = new Date(p.anchor);
  switch (p.type) {
    case 'week': {
      for (let i = 0; i < 7; i++) {
        const d = new Date(a);
        d.setDate(a.getDate() + i);
        const iso = toISO(d);
        buckets.push({ start: iso, end: iso, label: String(d.getDate()) });
      }
      return buckets;
    }
    case 'month': {
      const last = new Date(a.getFullYear(), a.getMonth() + 1, 0).getDate();
      let day = 1;
      let idx = 1;
      while (day <= last) {
        const endDay = Math.min(day + 6, last);
        buckets.push({
          start: `${a.getFullYear()}-${pad(a.getMonth() + 1)}-${pad(day)}`,
          end: `${a.getFullYear()}-${pad(a.getMonth() + 1)}-${pad(endDay)}`,
          label: `W${idx}`,
        });
        day = endDay + 1;
        idx++;
      }
      return buckets;
    }
    case '3months': {
      for (let i = 0; i < 3; i++) {
        const s = new Date(a.getFullYear(), a.getMonth() + i, 1);
        const e = new Date(a.getFullYear(), a.getMonth() + i + 1, 0);
        buckets.push({ start: toISO(s), end: toISO(e), label: THAI_MONTHS[s.getMonth()] });
      }
      return buckets;
    }
    case '6months': {
      for (let i = 0; i < 6; i++) {
        const s = new Date(a.getFullYear(), a.getMonth() + i, 1);
        const e = new Date(a.getFullYear(), a.getMonth() + i + 1, 0);
        buckets.push({ start: toISO(s), end: toISO(e), label: THAI_MONTHS[s.getMonth()] });
      }
      return buckets;
    }
    case 'year': {
      for (let i = 0; i < 12; i++) {
        const s = new Date(a.getFullYear(), i, 1);
        const e = new Date(a.getFullYear(), i + 1, 0);
        buckets.push({ start: toISO(s), end: toISO(e), label: THAI_MONTHS[i] });
      }
      return buckets;
    }
    case 'all': {
      const { start, end } = getPeriodRange(p);
      const s = new Date(start);
      const e = new Date(end);
      const months: { y: number; m: number }[] = [];
      let cy = s.getFullYear();
      let cm = s.getMonth();
      while (cy < e.getFullYear() || (cy === e.getFullYear() && cm <= e.getMonth())) {
        months.push({ y: cy, m: cm });
        cm++;
        if (cm > 11) { cm = 0; cy++; }
      }
      const sliced = months.length > 12 ? months.slice(-12) : months;
      for (const { y, m } of sliced) {
        const bs = new Date(y, m, 1);
        const be = new Date(y, m + 1, 0);
        buckets.push({ start: toISO(bs), end: toISO(be), label: THAI_MONTHS[m] });
      }
      return buckets;
    }
  }
}
