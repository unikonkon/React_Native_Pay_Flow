// Shared date-range picker. Used by Dashboard (รายการ) and Summary (สรุป).
// Renders:
//   • A compact inline bar with ‹ label › and a preset pill strip
//   • A bottom-sheet modal for picking a preset + custom range

const RANGE_PRESETS = [
  { k: 'day',    l: 'วัน' },
  { k: 'week',   l: 'สัปดาห์' },
  { k: 'month',  l: 'เดือน' },
  { k: 'year',   l: 'ปี' },
  { k: 'custom', l: 'กำหนดเอง' },
];

function formatRangeLabel(range) {
  const { kind, y, m, d, w, start, end } = range;
  if (kind === 'day') {
    return `${d} ${THAI_MONTHS_SHORT[m]} ${y + 543}`;
  }
  if (kind === 'week') {
    return `สัปดาห์ที่ ${w}, ${THAI_MONTHS_SHORT[m]}`;
  }
  if (kind === 'month') {
    return `${THAI_MONTHS_SHORT[m]} ${y + 543}`;
  }
  if (kind === 'year') {
    return `ปี ${y + 543}`;
  }
  if (kind === 'custom') {
    return `${start.d} ${THAI_MONTHS_SHORT[start.m]} – ${end.d} ${THAI_MONTHS_SHORT[end.m]}`;
  }
  return '';
}

// Move the range by ±1 step in its own unit
function shiftRange(range, dir) {
  const r = { ...range };
  if (r.kind === 'day') {
    const dt = new Date(r.y, r.m, r.d);
    dt.setDate(dt.getDate() + dir);
    r.y = dt.getFullYear(); r.m = dt.getMonth(); r.d = dt.getDate();
  } else if (r.kind === 'week') {
    r.w = Math.max(1, r.w + dir);
    if (r.w > 5) { r.w = 1; r.m = (r.m + 1) % 12; if (r.m === 0) r.y += 1; }
    if (r.w < 1) { r.w = 5; r.m = (r.m + 11) % 12; if (r.m === 11) r.y -= 1; }
  } else if (r.kind === 'month') {
    r.m = (r.m + dir + 12) % 12;
    if (r.m === 11 && dir < 0) r.y -= 1;
    if (r.m === 0 && dir > 0) r.y += 1;
  } else if (r.kind === 'year') {
    r.y += dir;
  } else if (r.kind === 'custom') {
    // no-op: custom ranges don't step
  }
  return r;
}

function DateRangeBar({ range, setRange, dark }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const surface = dark ? TOKENS.darkSurface : '#fff';
  const hairline = dark ? TOKENS.darkHairline : TOKENS.hairline;
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: surface, borderRadius: 999,
        border: `0.5px solid ${hairline}`,
        padding: 3, boxShadow: '0 1px 2px rgba(42,35,32,0.04)',
      }}>
        <button onClick={() => setRange(r => shiftRange(r, -1))} style={{
          width: 30, height: 30, borderRadius: '50%', border: 'none',
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="8" height="14" viewBox="0 0 8 14"><path d="M7 1L1 7l6 6" stroke={textInk} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button onClick={() => setOpen(true)} style={{
          flex: 1, height: 30, padding: '0 8px', borderRadius: 999,
          border: 'none', background: 'transparent', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontFamily: FONT.mix, fontSize: 14, fontWeight: 600, color: textInk,
          fontVariantNumeric: 'tabular-nums',
        }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <g stroke={TOKENS.orange} strokeWidth="1.5" strokeLinecap="round">
              <rect x="1.5" y="3" width="11" height="9.5" rx="1.5"/>
              <path d="M1.5 6h11M4.5 1.5v3M9.5 1.5v3"/>
            </g>
          </svg>
          {formatRangeLabel(range)}
          <svg width="9" height="9" viewBox="0 0 10 10" style={{ marginLeft: 1 }}>
            <path d="M2 3.5L5 6.5 8 3.5" stroke={textMuted} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button onClick={() => setRange(r => shiftRange(r, 1))} style={{
          width: 30, height: 30, borderRadius: '50%', border: 'none',
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="8" height="14" viewBox="0 0 8 14"><path d="M1 1l6 6-6 6" stroke={textInk} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {open && (
        <DateRangeSheet
          range={range}
          onClose={() => setOpen(false)}
          onApply={(r) => { setRange(r); setOpen(false); }}
          dark={dark}
        />
      )}
    </>
  );
}

function DateRangeSheet({ range, onClose, onApply, dark }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const surface = dark ? TOKENS.darkSurface : '#fff';
  const hairline = dark ? TOKENS.darkHairline : TOKENS.hairline;

  const [draft, setDraft] = React.useState(range);

  const today = new Date();
  const ty = today.getFullYear(), tm = today.getMonth(), td = today.getDate();

  const setKind = (kind) => {
    const base = {
      day:    { kind: 'day', y: draft.y || ty, m: draft.m ?? tm, d: draft.d || td },
      week:   { kind: 'week', y: draft.y || ty, m: draft.m ?? tm, w: draft.w || 1 },
      month:  { kind: 'month', y: draft.y || ty, m: draft.m ?? tm },
      year:   { kind: 'year', y: draft.y || ty },
      custom: {
        kind: 'custom',
        start: draft.start || { y: ty, m: tm, d: 1 },
        end:   draft.end   || { y: ty, m: tm, d: td },
      },
    };
    setDraft(base[kind]);
  };

  // Quick-pick helpers
  const quick = [
    { l: 'วันนี้',       r: { kind: 'day', y: ty, m: tm, d: td } },
    { l: 'เมื่อวาน',     r: (() => { const dt = new Date(ty, tm, td - 1); return { kind: 'day', y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() }; })() },
    { l: 'สัปดาห์นี้',    r: { kind: 'week', y: ty, m: tm, w: Math.ceil(td / 7) } },
    { l: 'เดือนนี้',      r: { kind: 'month', y: ty, m: tm } },
    { l: 'เดือนที่แล้ว',  r: { kind: 'month', y: tm === 0 ? ty - 1 : ty, m: (tm + 11) % 12 } },
    { l: 'ปีนี้',         r: { kind: 'year', y: ty } },
  ];

  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(42,35,32,0.45)', zIndex: 300,
        animation: 'fade 200ms',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '78%',
        background: surface, borderRadius: '28px 28px 0 0', zIndex: 301,
        animation: 'slideUp 300ms cubic-bezier(0.2,0.8,0.2,1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* handle */}
        <div style={{ padding: '8px 0 4px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: '#D0C6BA', opacity: 0.6 }} />
        </div>

        {/* title row */}
        <div style={{ padding: '4px 18px 12px', display: 'flex', alignItems: 'center' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT.thai, fontSize: 14, color: textMuted, padding: 4 }}>
            ยกเลิก
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontFamily: FONT.thai, fontSize: 17, fontWeight: 700, color: textInk }}>
            เลือกช่วงเวลา
          </div>
          <button onClick={() => onApply(draft)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: FONT.thai, fontSize: 14, color: TOKENS.orange, fontWeight: 700, padding: 4,
          }}>ใช้</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          {/* Preset segmented */}
          <div style={{
            display: 'flex', padding: 3, background: dark ? TOKENS.darkElev : TOKENS.paperDeep,
            borderRadius: 999, marginBottom: 14,
          }}>
            {RANGE_PRESETS.map(p => (
              <button key={p.k} onClick={() => setKind(p.k)} style={{
                flex: 1, padding: '8px 6px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: draft.kind === p.k ? TOKENS.orange : 'transparent',
                color: draft.kind === p.k ? '#fff' : textMuted,
                fontFamily: FONT.thai, fontSize: 12.5, fontWeight: 600,
              }}>{p.l}</button>
            ))}
          </div>

          {/* Quick shortcuts */}
          <div style={{ fontFamily: FONT.thai, fontSize: 12, color: textMuted, fontWeight: 600, marginBottom: 6 }}>ทางลัด</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {quick.map((q, i) => (
              <button key={i} onClick={() => setDraft(q.r)} style={{
                height: 32, padding: '0 12px', borderRadius: 999,
                background: dark ? TOKENS.darkElev : TOKENS.paperDeep,
                border: 'none', cursor: 'pointer',
                fontFamily: FONT.thai, fontSize: 12.5, fontWeight: 600, color: textInk,
              }}>{q.l}</button>
            ))}
          </div>

          {/* Detail editor per kind */}
          <div style={{
            background: dark ? TOKENS.darkElev : TOKENS.paperDeep,
            borderRadius: 18, padding: '14px 14px',
          }}>
            {draft.kind === 'day' && (
              <DayPicker draft={draft} setDraft={setDraft} dark={dark} />
            )}
            {draft.kind === 'week' && (
              <WeekPicker draft={draft} setDraft={setDraft} dark={dark} />
            )}
            {draft.kind === 'month' && (
              <MonthPicker draft={draft} setDraft={setDraft} dark={dark} />
            )}
            {draft.kind === 'year' && (
              <YearPicker draft={draft} setDraft={setDraft} dark={dark} />
            )}
            {draft.kind === 'custom' && (
              <CustomPicker draft={draft} setDraft={setDraft} dark={dark} />
            )}
          </div>

          {/* Live preview */}
          <div style={{
            marginTop: 14, padding: '12px 14px',
            border: `1px dashed ${TOKENS.orange}`, borderRadius: 14,
            background: TOKENS.orangeTint,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><g stroke={TOKENS.orangeDeep} strokeWidth="1.5" strokeLinecap="round"><rect x="1.5" y="3" width="11" height="9.5" rx="1.5"/><path d="M1.5 6h11M4.5 1.5v3M9.5 1.5v3"/></g></svg>
            <div style={{ fontFamily: FONT.thai, fontSize: 12, color: TOKENS.orangeDeep, fontWeight: 600 }}>ช่วงที่เลือก</div>
            <div style={{ flex: 1 }} />
            <div style={{ fontFamily: FONT.mix, fontSize: 14, fontWeight: 700, color: TOKENS.ink, fontVariantNumeric: 'tabular-nums' }}>
              {formatRangeLabel(draft)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Per-kind editors ──────────────────────────────────────────

function Stepper({ value, onChange, formatter = String, min, max, width = 'auto' }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: '#fff', borderRadius: 999, padding: 3,
      border: `0.5px solid ${TOKENS.hairline}`,
    }}>
      <button onClick={() => onChange(min != null ? Math.max(min, value - 1) : value - 1)} style={{
        width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: TOKENS.paperDeep, color: TOKENS.inkMuted, fontWeight: 700, fontSize: 14,
      }}>−</button>
      <div style={{ fontFamily: FONT.num, fontSize: 14, fontWeight: 700, color: TOKENS.ink, minWidth: width, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
        {formatter(value)}
      </div>
      <button onClick={() => onChange(max != null ? Math.min(max, value + 1) : value + 1)} style={{
        width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: TOKENS.paperDeep, color: TOKENS.inkMuted, fontWeight: 700, fontSize: 14,
      }}>+</button>
    </div>
  );
}

function MonthPicker({ draft, setDraft }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
        {THAI_MONTHS_SHORT.map((label, i) => (
          <button key={i} onClick={() => setDraft(d => ({ ...d, m: i }))} style={{
            height: 34, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: draft.m === i ? TOKENS.orange : '#fff',
            color: draft.m === i ? '#fff' : TOKENS.ink,
            fontFamily: FONT.thai, fontSize: 12.5, fontWeight: 600,
          }}>{label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: FONT.thai, fontSize: 13, fontWeight: 600, color: TOKENS.ink }}>ปี</div>
        <Stepper value={draft.y} onChange={v => setDraft(d => ({ ...d, y: v }))} formatter={v => v + 543} width={50} />
      </div>
    </div>
  );
}

function YearPicker({ draft, setDraft }) {
  const current = new Date().getFullYear();
  const years = [];
  for (let y = current - 5; y <= current + 1; y++) years.push(y);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
      {years.map(y => (
        <button key={y} onClick={() => setDraft(d => ({ ...d, y }))} style={{
          height: 40, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: draft.y === y ? TOKENS.orange : '#fff',
          color: draft.y === y ? '#fff' : TOKENS.ink,
          fontFamily: FONT.num, fontSize: 14, fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}>{y + 543}</button>
      ))}
    </div>
  );
}

function WeekPicker({ draft, setDraft }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: FONT.thai, fontSize: 13, fontWeight: 600, color: TOKENS.ink }}>เดือน</div>
        <div style={{ fontFamily: FONT.thai, fontSize: 13, color: TOKENS.ink }}>
          {THAI_MONTHS_SHORT[draft.m]} {draft.y + 543}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 10 }}>
        {[1, 2, 3, 4, 5].map(w => (
          <button key={w} onClick={() => setDraft(d => ({ ...d, w }))} style={{
            height: 40, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: draft.w === w ? TOKENS.orange : '#fff',
            color: draft.w === w ? '#fff' : TOKENS.ink,
            fontFamily: FONT.thai, fontSize: 12.5, fontWeight: 600,
          }}>สัปดาห์ {w}</button>
        ))}
      </div>
    </div>
  );
}

function DayPicker({ draft, setDraft }) {
  const daysInMonth = new Date(draft.y, draft.m + 1, 0).getDate();
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Stepper value={draft.m} onChange={v => setDraft(d => ({ ...d, m: ((v % 12) + 12) % 12 }))} formatter={v => THAI_MONTHS_SHORT[((v % 12) + 12) % 12]} width={40} />
        <Stepper value={draft.y} onChange={v => setDraft(d => ({ ...d, y: v }))} formatter={v => v + 543} width={50} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
          <button key={d} onClick={() => setDraft(s => ({ ...s, d }))} style={{
            height: 32, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: draft.d === d ? TOKENS.orange : '#fff',
            color: draft.d === d ? '#fff' : TOKENS.ink,
            fontFamily: FONT.num, fontSize: 12.5, fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}>{d}</button>
        ))}
      </div>
    </div>
  );
}

function CustomPicker({ draft, setDraft }) {
  const section = (label, side) => {
    const v = draft[side];
    const dim = new Date(v.y, v.m + 1, 0).getDate();
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontFamily: FONT.thai, fontSize: 12.5, color: TOKENS.inkMuted, fontWeight: 600, marginBottom: 6 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Stepper value={v.d} onChange={d => setDraft(s => ({ ...s, [side]: { ...s[side], d: Math.min(d, dim) } }))} min={1} max={dim} width={24} />
          <Stepper value={v.m} onChange={m => setDraft(s => ({ ...s, [side]: { ...s[side], m: ((m % 12) + 12) % 12 } }))} formatter={m => THAI_MONTHS_SHORT[((m % 12) + 12) % 12]} width={40} />
          <Stepper value={v.y} onChange={y => setDraft(s => ({ ...s, [side]: { ...s[side], y } }))} formatter={y => y + 543} width={50} />
        </div>
      </div>
    );
  };
  return (
    <div>
      {section('ตั้งแต่', 'start')}
      {section('ถึง', 'end')}
    </div>
  );
}

Object.assign(window, { DateRangeBar, formatRangeLabel, shiftRange });
