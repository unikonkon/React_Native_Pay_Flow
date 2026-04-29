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
    case '2months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { type, anchor: toISO(start) };
    }
    case '3months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { type, anchor: toISO(start) };
    }
    case '4months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      return { type, anchor: toISO(start) };
    }
    case '6months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return { type, anchor: toISO(start) };
    }
    case 'year':
      return { type, anchor: `${now.getFullYear()}-01-01` };
    case '2years':
      return { type, anchor: `${now.getFullYear() - 1}-01-01` };
    case 'all':
      return { type, anchor: ALL_START };
    case 'custom':
      return { type, anchor: toISO(firstOfMonth(now)), endDate: toISO(now) };
  }
}

export function createCustomPeriod(start: string, end: string): Period {
  return { type: 'custom', anchor: start, endDate: end };
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
    case '2months': {
      const end = new Date(a.getFullYear(), a.getMonth() + 2, 0);
      return { start: toISO(a), end: toISO(end) };
    }
    case '3months': {
      const end = new Date(a.getFullYear(), a.getMonth() + 3, 0);
      return { start: toISO(a), end: toISO(end) };
    }
    case '4months': {
      const end = new Date(a.getFullYear(), a.getMonth() + 4, 0);
      return { start: toISO(a), end: toISO(end) };
    }
    case '6months': {
      const end = new Date(a.getFullYear(), a.getMonth() + 6, 0);
      return { start: toISO(a), end: toISO(end) };
    }
    case 'year':
      return { start: `${a.getFullYear()}-01-01`, end: `${a.getFullYear()}-12-31` };
    case '2years':
      return { start: `${a.getFullYear()}-01-01`, end: `${a.getFullYear() + 1}-12-31` };
    case 'all':
      return { start: ALL_START, end: toISO(new Date()) };
    case 'custom':
      return { start: p.anchor, end: p.endDate ?? toISO(new Date()) };
  }
}

export function canShiftPeriod(p: Period): boolean {
  return p.type !== 'all' && p.type !== 'custom';
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
    case '2months': {
      const n = new Date(a.getFullYear(), a.getMonth() + 2 * dir, 1);
      return { type: '2months', anchor: toISO(n) };
    }
    case '3months': {
      const n = new Date(a.getFullYear(), a.getMonth() + 3 * dir, 1);
      return { type: '3months', anchor: toISO(n) };
    }
    case '4months': {
      const n = new Date(a.getFullYear(), a.getMonth() + 4 * dir, 1);
      return { type: '4months', anchor: toISO(n) };
    }
    case '6months': {
      const n = new Date(a.getFullYear(), a.getMonth() + 6 * dir, 1);
      return { type: '6months', anchor: toISO(n) };
    }
    case 'year':
      return { type: 'year', anchor: `${a.getFullYear() + dir}-01-01` };
    case '2years':
      return { type: '2years', anchor: `${a.getFullYear() + 2 * dir}-01-01` };
    case 'all':
    case 'custom':
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
    case '2months':
    case '3months':
    case '4months':
    case '6months': {
      const s = new Date(start);
      const e = new Date(end);
      return `${THAI_MONTHS[s.getMonth()]} ${s.getFullYear() + 543} - ${THAI_MONTHS[e.getMonth()]} ${e.getFullYear() + 543}`;
    }
    case 'year':
      return `ปี ${new Date(p.anchor).getFullYear() + 543}`;
    case '2years': {
      const s = new Date(start);
      const e = new Date(end);
      return `ปี ${s.getFullYear() + 543} - ${e.getFullYear() + 543}`;
    }
    case 'all':
      return 'ทั้งหมด';
    case 'custom': {
      const cs = new Date(start);
      const ce = new Date(end);
      return formatDateRangeThai(toISO(cs), toISO(ce));
    }
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

/**
 * Return 42 dates (6 weeks × 7 days) starting from the Monday of the week that
 * contains the 1st day of the month of `viewMonth`. Used to render the calendar grid.
 */
export function getMonthGrid(viewMonth: Date): Date[] {
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const day = first.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(first);
  start.setDate(first.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const grid: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    grid.push(d);
  }
  return grid;
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
    case '2months':
    case '3months':
    case '4months':
    case '6months': {
      const monthCount =
        p.type === '2months' ? 2 : p.type === '3months' ? 3 : p.type === '4months' ? 4 : 6;
      for (let i = 0; i < monthCount; i++) {
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
    case '2years': {
      // 24 months across 2 years — show every other month label to keep the axis readable
      for (let i = 0; i < 24; i++) {
        const s = new Date(a.getFullYear(), a.getMonth() + i, 1);
        const e = new Date(a.getFullYear(), a.getMonth() + i + 1, 0);
        const label =
          i % 2 === 0
            ? `${THAI_MONTHS[s.getMonth()]} ${String((s.getFullYear() + 543) % 100).padStart(2, '0')}`
            : '';
        buckets.push({ start: toISO(s), end: toISO(e), label });
      }
      return buckets;
    }
    case 'all':
    case 'custom': {
      const { start, end } = getPeriodRange(p);
      const s = new Date(start);
      const e = new Date(end);
      const diffDays = Math.round((e.getTime() - s.getTime()) / 86400000);
      if (diffDays <= 31) {
        // Day buckets for short custom ranges
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
          const iso = toISO(d);
          buckets.push({ start: iso, end: iso, label: String(d.getDate()) });
        }
        return buckets;
      }
      // Month buckets for longer ranges
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
