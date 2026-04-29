# PeriodSelector — Calendar Filter Redesign

Date: 2026-04-29
Status: Draft (awaiting user review)
Scope: `components/ui/PeriodSelector.tsx`

## Goal

แทนที่ modal ภายในของ `PeriodSelector` (ปัจจุบันเป็น 4 tabs: สัปดาห์ / เดือน / สรุปยาว / กำหนดเอง) ให้กลายเป็น **ปฏิทินกริดเป็นหลัก + แถบปุ่ม preset ด้านบน** เพื่อให้ผู้ใช้ filter ช่วงเวลาได้รวดเร็วและยืดหยุ่นในหน้าเดียว

## Non-goals

- ไม่เปลี่ยน `Period` / `PeriodType` types
- ไม่เปลี่ยน public API ของ `PeriodSelector` (caller ที่ `app/(tabs)/index.tsx`, `app/(tabs)/analytics.tsx` ไม่ต้องแก้)
- ไม่เพิ่ม third-party calendar library (สร้าง grid เอง)
- ไม่ทำ multi-month view, year picker, swipe gesture, หรือเก็บประวัติช่วงที่เคยเลือก

## Public API (unchanged)

```ts
interface Props {
  period: Period;
  onChange: (p: Period) => void;
  className?: string;
}
```

Trigger chip ภายนอก (ปุ่ม `chevron-back` / label / `chevron-forward`) เหมือนเดิมทุกอย่าง — ส่วนที่เปลี่ยนคือ content ภายใน `<Modal>`

## Modal Layout

```
┌─────────────────────────────────────────┐
│  เลือกช่วงเวลา                    [✕]    │  header
├─────────────────────────────────────────┤
│ [สัปดาห์นี้][เดือนนี้][3ด.][6ด.][1ปี]→  │  preset row (scroll-x)
├─────────────────────────────────────────┤
│        [<]  เมษายน 2569  [>]            │  month nav
│   จ   อ   พ  พฤ   ศ   ส  อา             │  weekday header
│  31   1   2   3   4   5   6             │
│   7   8   9  10  11  12  13             │  6×7 grid
│  14  15  16  17  18  19  20             │
│  21  22  23  24 [25─26─27]              │  range highlight
│  28  29  30   1   2   3   4             │
├─────────────────────────────────────────┤
│        [ ใช้ช่วงเวลานี้ ]                 │  apply
└─────────────────────────────────────────┘
```

## Components (in-file)

ทั้งหมดอยู่ในไฟล์ `components/ui/PeriodSelector.tsx` (~250-300 บรรทัด)

| Component | Responsibility |
|---|---|
| `PeriodSelector` (main, exported) | ถือ state, ประกอบ sub-components, ครอบ Modal |
| `PresetRow` | render chips 6 ปุ่ม horizontal scroll, รับ `onPickPreset(type)` |
| `CalendarHeader` | render `< เดือน(ไทย) ปี(พ.ศ.) >`, รับ `viewMonth` + `onShift(±1)` |
| `CalendarGrid` | render 6×7 ของวัน, รับ `viewMonth`, `pendingStart`, `pendingEnd`, `onTapDay(d)` |

## State

```ts
const [open, setOpen] = useState(false);
const [viewMonth, setViewMonth] = useState<Date>(...);
const [pendingStart, setPendingStart] = useState<Date | null>(...);
const [pendingEnd, setPendingEnd] = useState<Date | null>(...);
```

### Initial state on `handleOpen`

- `pendingStart` / `pendingEnd`: derive จาก `getPeriodRange(period)` (ใช้ได้กับทุก `PeriodType` รวม `all`)
- `viewMonth`: เดือนของ `pendingStart`

## Behavior

### Preset row

ปุ่ม preset 6 ปุ่ม (label คงไว้ภาษาไทย):

| Label | type ที่ส่ง |
|---|---|
| สัปดาห์นี้ | `week` |
| เดือนนี้ | `month` |
| 3 เดือน | `3months` |
| 6 เดือน | `6months` |
| 1 ปี | `year` |
| ทั้งหมด | `all` |

แตะ preset:
1. `Haptics.selectionAsync()`
2. `onChange(getCurrentPeriod(type))`
3. ปิด modal ทันที

### Calendar header

- แสดง `THAI_MONTHS_FULL[viewMonth.getMonth()]` + ` ` + `viewMonth.getFullYear() + 543` (พ.ศ.)
- ปุ่ม `<` / `>` เลื่อน `viewMonth` ทีละ 1 เดือน (ไม่กระทบ `pendingStart` / `pendingEnd`)

### Calendar grid

- คำนวณกริด 42 ช่อง: เริ่มจากวันจันทร์ของสัปดาห์ที่บรรจุวันที่ 1 ของเดือน, ต่อเนื่องไป 42 วัน
- Helper: เพิ่ม `getMonthGrid(viewMonth: Date): Date[]` ใน `lib/utils/period.ts` (export) — เพื่อให้ทดสอบแยกได้และมีจุดเดียวที่จัดการ Mon-start logic (สอดคล้องกับ `mondayOf` ที่ใช้อยู่ในไฟล์เดียวกัน)

#### Day cell states (เรียงตามลำดับ priority สูง → ต่ำ)

| State | Style |
|---|---|
| start of range | `bg-primary` + ตัวอักษรขาว, มุมโค้งซ้าย (หรือทั้งสี่ถ้า single-day) |
| end of range | `bg-primary` + ตัวอักษรขาว, มุมโค้งขวา |
| in-range (ระหว่าง start และ end) | `bg-primary/15`, ตัวอักษรปกติ, มุมเหลี่ยม |
| today (ไม่อยู่ใน range) | `border border-primary` |
| outside current month | `text-muted-foreground` opacity-40, **disabled tap** |
| ปกติ | `text-foreground` |

### Tap day logic

| สถานะปัจจุบัน | tap วัน D | ผลลัพธ์ |
|---|---|---|
| pendingStart = null | tap D | start = D, end = null |
| start ≠ null, end = null, D ≥ start | tap D | end = D |
| start ≠ null, end = null, D < start | tap D | start = D, end = old start |
| start = end (single day) | tap D | start = D, end = null |
| start และ end ครบ (≠ กัน) | tap D | start = D, end = null (เริ่มใหม่) |

หลัง set state, ไม่ปิด modal — รอผู้ใช้กดปุ่ม "ใช้ช่วงเวลานี้"

### Apply button

- Label: `ใช้ช่วงเวลานี้`
- Disabled เมื่อ `pendingStart === null`
- เมื่อกด:
  1. ถ้า `pendingEnd === null` → treat single-day: `end = start`
  2. `Haptics.selectionAsync()`
  3. `onChange(createCustomPeriod(toISO(start), toISO(end)))`
  4. ปิด modal

> Note: preset เลือก `getCurrentPeriod(type)` (รักษา semantic type เช่น `'month'`, `'year'`); การเลือกผ่านปฏิทินจะส่ง `'custom'` เสมอ — สอดคล้องกับ data model ปัจจุบัน

## Imports diff

**ลบ:**
- `DateTimePicker` จาก `@react-native-community/datetimepicker`
- `listRecentAnchors`, `periodsEqual` จาก `@/lib/utils/period`
- `Platform` จาก `react-native`

**เพิ่ม:**
- `getMonthGrid`, `getPeriodRange` จาก `@/lib/utils/period`
- `THAI_MONTHS_FULL`, (อาจ) `THAI_DAYS_SHORT` จาก `@/lib/utils/format` ถ้ามี — ถ้ายังไม่มีให้กำหนด constant ในไฟล์: `['จ','อ','พ','พฤ','ศ','ส','อา']`

**ใช้ต่อ (ของเดิม):**
- `getCurrentPeriod`, `createCustomPeriod`, `formatPeriodLabel`, `canShiftPeriod`, `shiftPeriod`
- `useIsDarkTheme`, `Haptics`, `Ionicons`, `Modal`, `Pressable`, `ScrollView`, `Text`, `View`

## Theming

ใช้ NativeWind tokens ของโปรเจกต์เพื่อให้ตรงกับ light/dark theme อัตโนมัติ:
- พื้นหลัง modal: `bg-card`
- เส้นขอบ: `border-border`
- ตัวอักษรหลัก: `text-foreground`
- ตัวอักษรรอง: `text-muted-foreground`
- highlight ของ range endpoint: `bg-primary` (สีส้ม `#E87A3D`)
- highlight ระหว่าง range: `bg-primary/15`
- preset chip ที่ active: `bg-primary` + ตัวอักษรขาว
- preset chip ปกติ: `bg-secondary` + ตัวอักษร foreground
- font: `IBMPlexSansThai_*` ตามที่ใช้ใน component เดิม

## File-level changes

| File | Change |
|---|---|
| `components/ui/PeriodSelector.tsx` | rewrite ภายใน, public API เดิม |
| `lib/utils/period.ts` | เพิ่ม export `getMonthGrid(viewMonth: Date): Date[]` |
| ไฟล์อื่น | ไม่แก้ |

## Test plan (manual)

- [ ] เปิด modal จากหน้า home — ปฏิทินโชว์เดือนของ `period` ปัจจุบัน, range highlight ตรงกับ period ปัจจุบัน
- [ ] กด preset แต่ละปุ่ม (6 ปุ่ม) → ตรวจสอบ label ใน trigger chip เปลี่ยนตรง, modal ปิด
- [ ] กด `<` / `>` เปลี่ยนเดือน → grid อัพเดท, pendingStart/End ไม่เปลี่ยน
- [ ] tap วันแรก → cell highlight เป็น start, ปุ่ม apply enabled
- [ ] tap วันที่สอง (หลัง start) → end ตั้งค่า, ระหว่างกลาง highlight bg-primary/15
- [ ] tap วันก่อน start → swap (start ใหม่ = วันที่ tap, end = start เดิม)
- [ ] tap หลัง range ครบ → reset เริ่ม start ใหม่
- [ ] tap วันนอกเดือน (faded) → ไม่ตอบสนอง
- [ ] กด apply → trigger label เปลี่ยนเป็น `formatPeriodLabel('custom')`, modal ปิด
- [ ] ทดสอบทั้ง light + dark theme
- [ ] ทดสอบหน้า analytics ด้วย — caller เดิมทำงานปกติ
- [ ] กด apply เมื่อมีแค่ start (ไม่มี end) → treat เป็น single-day, range = วันเดียว

## Open questions

ไม่มี — design ผ่านการ confirm ครบทุกส่วนแล้ว
