# PeriodSelector Calendar Filter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use `- [ ]` checkbox syntax for tracking.

**Goal:** Replace the tabs-based content of `PeriodSelector` modal with a single-pane calendar grid plus a horizontal scroll row of 6 preset shortcut buttons, while keeping the public component API identical.

**Architecture:** All work lives inside `components/ui/PeriodSelector.tsx` (rewrite of modal content) plus one helper `getMonthGrid()` added to `lib/utils/period.ts`. No new dependencies. Calendar grid is composed from `View` / `Pressable` cells with NativeWind classes; range selection uses two `Date | null` state values; presets call existing `getCurrentPeriod(type)` and close the modal immediately.

**Tech Stack:** React Native 0.81 / React 19 / Expo SDK 54 / NativeWind v4 / TypeScript / `expo-haptics` / `@expo/vector-icons` (already used).

**Special instructions for this run:**
- The project has **no automated test runner** for RN components, so TDD steps are replaced with manual "render-check" steps.
- The user has explicitly requested **no auto git commits** — all commit steps are intentionally omitted.

**Spec:** `docs/superpowers/specs/2026-04-29-period-selector-calendar-design.md`

---

## File Structure

| File | Change kind | Purpose |
|---|---|---|
| `lib/utils/period.ts` | Modify (append) | Add `getMonthGrid(viewMonth: Date): Date[]` returning 42 contiguous days (Mon-start) for the month containing `viewMonth` |
| `components/ui/PeriodSelector.tsx` | Rewrite content | Modal becomes preset row + month-nav + 6×7 grid + apply button. Trigger chip stays the same |

Files **not touched:** `types/index.ts`, `lib/utils/format.ts`, `app/(tabs)/index.tsx`, `app/(tabs)/analytics.tsx`, `package.json`.

---

## Task 1 — Add `getMonthGrid` helper

**Files:**
- Modify: `lib/utils/period.ts` (append at end of file)

- [ ] **Step 1: Append helper to `lib/utils/period.ts`**

```ts
/**
 * Return 42 dates (6 weeks × 7 days) starting from the Monday of the week that
 * contains the 1st day of the month of `viewMonth`. Used to render the calendar grid.
 */
export function getMonthGrid(viewMonth: Date): Date[] {
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const day = first.getDay();
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday-start
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
```

- [ ] **Step 2: Sanity check via repl-style assertions (manual review)**

Read the diff and verify: for `new Date(2026, 3, 15)` (Apr 15, 2026 — Wed), the function should return 42 dates beginning with Mon Mar 30, 2026 and ending Sun May 10, 2026. You can verify by visual inspection of the implementation against this example.

---

## Task 2 — Rewrite `PeriodSelector.tsx`

**Files:**
- Modify (full rewrite of file body): `components/ui/PeriodSelector.tsx`

- [ ] **Step 1: Replace the entire file with the new implementation**

```tsx
import {
  canShiftPeriod,
  createCustomPeriod,
  formatPeriodLabel,
  getCurrentPeriod,
  getMonthGrid,
  getPeriodRange,
  shiftPeriod,
} from '@/lib/utils/period';
import { THAI_MONTHS_FULL } from '@/lib/utils/format';
import { useIsDarkTheme } from '@/lib/utils/theme';
import type { Period, PeriodType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

interface Props {
  period: Period;
  onChange: (p: Period) => void;
  className?: string;
}

type PresetType = Extract<PeriodType, 'week' | 'month' | '3months' | '6months' | 'year' | 'all'>;

const PRESETS: { type: PresetType; label: string }[] = [
  { type: 'week', label: 'สัปดาห์นี้' },
  { type: 'month', label: 'เดือนนี้' },
  { type: '3months', label: '3 เดือน' },
  { type: '6months', label: '6 เดือน' },
  { type: 'year', label: '1 ปี' },
  { type: 'all', label: 'ทั้งหมด' },
];

const WEEKDAYS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const stripTime = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export function PeriodSelector({ period, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const isDark = useIsDarkTheme();
  const chevronActive = isDark ? '#A39685' : '#6B5F52';
  const chevronDisabled = isDark ? '#4A3D30' : '#D3CBC3';

  const initialRange = useMemo(() => {
    const r = getPeriodRange(period);
    return { start: stripTime(new Date(r.start)), end: stripTime(new Date(r.end)) };
  }, [period]);

  const [viewMonth, setViewMonth] = useState<Date>(() => initialRange.start);
  const [pendingStart, setPendingStart] = useState<Date | null>(null);
  const [pendingEnd, setPendingEnd] = useState<Date | null>(null);

  const handleOpen = () => {
    const r = getPeriodRange(period);
    const s = stripTime(new Date(r.start));
    const e = stripTime(new Date(r.end));
    setPendingStart(s);
    setPendingEnd(e);
    setViewMonth(new Date(s.getFullYear(), s.getMonth(), 1));
    setOpen(true);
  };

  const handlePickPreset = (t: PresetType) => {
    Haptics.selectionAsync();
    onChange(getCurrentPeriod(t));
    setOpen(false);
  };

  const handleShiftMonth = (dir: -1 | 1) => {
    Haptics.selectionAsync();
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + dir, 1));
  };

  const handleTapDay = (d: Date) => {
    if (!sameMonth(d, viewMonth)) return; // ignore taps on faded out-of-month cells
    Haptics.selectionAsync();
    if (pendingStart === null) {
      setPendingStart(d);
      setPendingEnd(null);
      return;
    }
    if (pendingEnd === null) {
      if (d < pendingStart) {
        setPendingEnd(pendingStart);
        setPendingStart(d);
      } else {
        setPendingEnd(d);
      }
      return;
    }
    // both already set OR start === end: start a fresh selection
    setPendingStart(d);
    setPendingEnd(null);
  };

  const handleApply = () => {
    if (!pendingStart) return;
    const start = pendingStart;
    const end = pendingEnd ?? pendingStart;
    Haptics.selectionAsync();
    onChange(createCustomPeriod(toISO(start), toISO(end)));
    setOpen(false);
  };

  const canShift = canShiftPeriod(period);

  return (
    <View className={className}>
      {/* Trigger chip — unchanged */}
      <View className="flex-row items-center justify-between rounded-full bg-card border border-border">
        <Pressable
          onPress={() => { if (canShift) { Haptics.selectionAsync(); onChange(shiftPeriod(period, -1)); } }}
          disabled={!canShift}
          className="p-2"
        >
          <Ionicons name="chevron-back" size={24} color={canShift ? chevronActive : chevronDisabled} />
        </Pressable>
        <Pressable
          onPress={handleOpen}
          className="w-full flex-row items-center justify-center px-3.5 py-1.5 gap-2 flex-shrink"
        >
          <Ionicons name="calendar-outline" size={16} color="#A39685" style={{ marginRight: 6 }} />
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 16 }} className="text-foreground" numberOfLines={1}>
            {formatPeriodLabel(period)}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#A39685" style={{ marginLeft: 4 }} />
        </Pressable>
        <Pressable
          onPress={() => { if (canShift) { Haptics.selectionAsync(); onChange(shiftPeriod(period, 1)); } }}
          disabled={!canShift}
          className="p-2"
        >
          <Ionicons name="chevron-forward" size={24} color={canShift ? chevronActive : chevronDisabled} />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 bg-black/40 items-center justify-center"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-11/12 max-w-md bg-card rounded-2xl p-4 border border-border"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-3">
              <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18 }} className="text-foreground">
                เลือกช่วงเวลา
              </Text>
              <Pressable onPress={() => setOpen(false)} className="p-1">
                <Ionicons name="close" size={22} color="#A39685" />
              </Pressable>
            </View>

            {/* Preset row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ paddingRight: 8 }}
            >
              {PRESETS.map((p) => {
                const active = period.type === p.type;
                return (
                  <Pressable
                    key={p.type}
                    onPress={() => handlePickPreset(p.type)}
                    className="px-4 py-2 rounded-full mr-2 border"
                    style={{
                      backgroundColor: active ? '#E87A3D' : 'transparent',
                      borderColor: active ? '#E87A3D' : isDark ? '#4A3D30' : '#E5DDD3',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'IBMPlexSansThai_600SemiBold',
                        fontSize: 12,
                        color: active ? '#fff' : isDark ? '#E87A3D' : '#2B2118',
                      }}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Month nav */}
            <View className="flex-row items-center justify-between mb-2">
              <Pressable onPress={() => handleShiftMonth(-1)} className="p-2">
                <Ionicons name="chevron-back" size={20} color={chevronActive} />
              </Pressable>
              <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16 }} className="text-foreground">
                {THAI_MONTHS_FULL[viewMonth.getMonth()]} {viewMonth.getFullYear() + 543}
              </Text>
              <Pressable onPress={() => handleShiftMonth(1)} className="p-2">
                <Ionicons name="chevron-forward" size={20} color={chevronActive} />
              </Pressable>
            </View>

            {/* Weekday header */}
            <View className="flex-row mb-1">
              {WEEKDAYS.map((w) => (
                <View key={w} className="flex-1 items-center py-1">
                  <Text
                    style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 11 }}
                    className="text-muted-foreground"
                  >
                    {w}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar grid */}
            <CalendarGrid
              viewMonth={viewMonth}
              pendingStart={pendingStart}
              pendingEnd={pendingEnd}
              onTapDay={handleTapDay}
              isDark={isDark}
            />

            {/* Apply button */}
            <Pressable
              onPress={handleApply}
              disabled={pendingStart === null}
              className="py-3 rounded-full items-center mt-4"
              style={{
                backgroundColor: pendingStart === null ? (isDark ? '#3A2F25' : '#E5DDD3') : '#E87A3D',
              }}
            >
              <Text
                style={{
                  fontFamily: 'IBMPlexSansThai_700Bold',
                  fontSize: 14,
                  color: pendingStart === null ? (isDark ? '#6B5F52' : '#A39685') : '#fff',
                }}
              >
                ใช้ช่วงเวลานี้
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

interface CalendarGridProps {
  viewMonth: Date;
  pendingStart: Date | null;
  pendingEnd: Date | null;
  onTapDay: (d: Date) => void;
  isDark: boolean;
}

function CalendarGrid({ viewMonth, pendingStart, pendingEnd, onTapDay, isDark }: CalendarGridProps) {
  const grid = useMemo(() => getMonthGrid(viewMonth), [viewMonth]);
  const today = useMemo(() => stripTime(new Date()), []);
  const rangeStart = pendingStart;
  const rangeEnd = pendingEnd ?? pendingStart;

  return (
    <View>
      {Array.from({ length: 6 }).map((_, row) => (
        <View key={row} className="flex-row">
          {grid.slice(row * 7, row * 7 + 7).map((d) => {
            const inMonth = sameMonth(d, viewMonth);
            const isStart = rangeStart !== null && sameDay(d, rangeStart);
            const isEnd = rangeEnd !== null && sameDay(d, rangeEnd);
            const inRange =
              rangeStart !== null && rangeEnd !== null && d > rangeStart && d < rangeEnd;
            const isToday = sameDay(d, today);

            // background
            let bg: string | undefined;
            if (isStart || isEnd) bg = '#E87A3D';
            else if (inRange) bg = isDark ? 'rgba(232,122,61,0.25)' : 'rgba(232,122,61,0.18)';

            // text color
            let textColor: string;
            if (isStart || isEnd) textColor = '#fff';
            else if (!inMonth) textColor = isDark ? '#4A3D30' : '#C8BFB5';
            else textColor = isDark ? '#F5EFE7' : '#2B2118';

            // corner radii: round endpoints, square in-between for visual joining
            const isSingleDay = isStart && isEnd;
            const radius =
              isSingleDay ? 999 :
              isStart ? { topLeft: 999, bottomLeft: 999, topRight: 0, bottomRight: 0 } :
              isEnd ? { topRight: 999, bottomRight: 999, topLeft: 0, bottomLeft: 0 } :
              0;

            const radiusStyle =
              typeof radius === 'number'
                ? { borderRadius: radius }
                : {
                    borderTopLeftRadius: radius.topLeft,
                    borderBottomLeftRadius: radius.bottomLeft,
                    borderTopRightRadius: radius.topRight,
                    borderBottomRightRadius: radius.bottomRight,
                  };

            return (
              <Pressable
                key={d.toISOString()}
                onPress={() => onTapDay(d)}
                disabled={!inMonth}
                className="flex-1 items-center justify-center"
                style={{
                  height: 40,
                  backgroundColor: bg,
                  ...radiusStyle,
                  borderWidth: isToday && !(isStart || isEnd) ? 1 : 0,
                  borderColor: '#E87A3D',
                }}
              >
                <Text
                  style={{
                    fontFamily: isStart || isEnd || isToday
                      ? 'IBMPlexSansThai_700Bold'
                      : 'IBMPlexSansThai_500Medium',
                    fontSize: 14,
                    color: textColor,
                  }}
                >
                  {d.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors related to `components/ui/PeriodSelector.tsx` or `lib/utils/period.ts`. Pre-existing errors elsewhere are out of scope.

- [ ] **Step 3: Manual smoke checks (note in chat for the user to run)**

The dev server must be started by the user (`npx expo start`). After it boots, ask the user to verify the following on the home tab and analytics tab:

1. Trigger chip shows current period label as before; chevron-back / chevron-forward still shift weeks/months.
2. Tap chip → modal opens. Preset row scrolls horizontally; current `period.type` chip is highlighted in primary.
3. Tap any preset → label in chip updates and modal closes immediately.
4. Re-open modal — month nav `< >` shifts the calendar grid only (does not change the highlighted range).
5. Tap two dates → first becomes start (rounded left corner, primary background), second becomes end (rounded right corner). Days between have a faint primary tint.
6. Tap a date earlier than current start → start swaps; old start becomes end.
7. Tap a third date after both endpoints are set → selection resets to that date as new start.
8. Out-of-month (faded) cells do not respond to taps.
9. Apply button is disabled (greyed) when no start picked; enabled once a start exists. Tapping Apply with only start → range applied as single day.
10. Today's date has a primary outline when not part of the active range.
11. Light + dark theme both render legibly.

---

## Self-Review

**1. Spec coverage:**

| Spec section | Implemented in |
|---|---|
| Public API unchanged | Task 2 — Props interface and trigger chip JSX kept verbatim |
| Modal layout (header / preset / month-nav / weekday / grid / apply) | Task 2 — `<Modal>` body |
| State (`viewMonth`, `pendingStart`, `pendingEnd`) | Task 2 — `useState` calls |
| Initial state derivation from `getPeriodRange` | Task 2 — `handleOpen` |
| Preset behavior (apply + close) | Task 2 — `handlePickPreset` |
| Tap day logic table (5 cases) | Task 2 — `handleTapDay` |
| Day cell states (start/end/in-range/today/out-of-month/normal) | Task 2 — `CalendarGrid` |
| Apply button (disabled / single-day fallback) | Task 2 — `handleApply` + button JSX |
| `getMonthGrid` helper added | Task 1 |
| Removed imports (`DateTimePicker`, `Platform`, `listRecentAnchors`, `periodsEqual`) | Task 2 — new import block |
| Theming via NativeWind tokens | Task 2 — `bg-card`, `border-border`, `text-foreground`, etc. |

All sections covered.

**2. Placeholder scan:** No "TBD", no "TODO", no vague handler stubs — every step contains complete code.

**3. Type consistency:** `PresetType` derived from `PeriodType`; `Date | null` used consistently; `getMonthGrid` signature matches helper definition; `createCustomPeriod(start, end)` arg order matches existing util.

**Note on TDD departure:** The project ships no test runner for components, and the user explicitly asked to write code now. The plan substitutes the failing-test step with a manual verification checklist that mirrors each behavior the unit tests would cover. If a test runner is introduced later, those checklist items map 1:1 to test cases.

**Note on commit steps:** Intentionally omitted per user instruction "ไม่ต้อง commit".
