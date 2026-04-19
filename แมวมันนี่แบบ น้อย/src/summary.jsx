// Summary (สรุป) — donut chart + breakdown

function SummaryScreen({ dark, range, setRange }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const surface = dark ? TOKENS.darkSurface : '#FFFFFF';
  const hairline = dark ? TOKENS.darkHairline : TOKENS.hairline;
  const [mode, setMode] = React.useState('expense');

  const total = mode === 'expense' ? TOTALS.expense : TOTALS.income;

  return (
    <div style={{ height: '100%', paddingTop: 54, paddingBottom: 82, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '8px 18px 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: FONT.thai, fontSize: 26, fontWeight: 700, color: textInk, letterSpacing: -0.4 }}>
          สรุป
        </div>
        <Sparkle size={12} />
      </div>

      {/* Date range + mode toggle */}
      <div style={{ padding: '6px 18px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <DateRangeBar range={range} setRange={setRange} dark={dark} />
        </div>
        <div style={{ display: 'flex', padding: 3, background: dark ? TOKENS.darkElev : TOKENS.paperDeep, borderRadius: 999, gap: 2, flexShrink: 0 }}>
          {[{ k: 'expense', l: 'จ่าย' }, { k: 'income', l: 'รับ' }].map(t => (
            <button key={t.k} onClick={() => setMode(t.k)} style={{
              padding: '6px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: mode === t.k ? (dark ? TOKENS.darkSurface : '#fff') : 'transparent',
              fontFamily: FONT.thai, fontSize: 13, fontWeight: 600,
              color: mode === t.k ? textInk : textMuted,
              boxShadow: mode === t.k ? '0 1px 2px rgba(42,35,32,0.06)' : 'none',
            }}>{t.l}</button>
          ))}
        </div>
      </div>

      {/* Donut */}
      <div style={{
        margin: '0 16px 14px', padding: '20px 16px 24px', background: surface, borderRadius: 24,
        boxShadow: SHADOWS.card, position: 'relative', overflow: 'hidden',
      }}>
        <KintsugiCrack style={{ top: -8, right: -20, opacity: 0.25 }} />
        <Donut data={CAT_BREAKDOWN} total={total} dark={dark} />
      </div>

      {/* Breakdown list */}
      <div style={{ margin: '0 16px', padding: '4px 0', background: surface, borderRadius: 24, boxShadow: SHADOWS.card, overflow: 'hidden' }}>
        {CAT_BREAKDOWN.map((row, i) => {
          const cat = CATEGORIES[row.cat];
          return (
            <div key={row.cat} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              borderBottom: i < CAT_BREAKDOWN.length - 1 ? `0.5px solid ${hairline}` : 'none',
            }}>
              <CatIcon kind={cat.icon} bg={cat.bg} size={38} dark={dark} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT.thai, fontSize: 14, fontWeight: 600, color: textInk, marginBottom: 5 }}>
                  {cat.label}
                </div>
                <div style={{ height: 4, background: dark ? TOKENS.darkElev : TOKENS.paperDeep, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${row.pct}%`, height: '100%', background: cat.bg, borderRadius: 999 }} />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: FONT.num, fontSize: 14, fontWeight: 700, color: textInk, fontVariantNumeric: 'tabular-nums' }}>
                  {fmtNum(row.amount)}
                </div>
                <div style={{ fontFamily: FONT.num, fontSize: 11, color: textMuted, fontVariantNumeric: 'tabular-nums' }}>
                  {row.pct.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

function Donut({ data, total, dark }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const SIZE = 220, R = 88, CX = SIZE / 2, CY = SIZE / 2, STROKE = 26;
  const circ = 2 * Math.PI * R;

  let offset = 0;
  const segments = data.map((d, i) => {
    const cat = CATEGORIES[d.cat];
    const len = (d.pct / 100) * circ;
    const gap = 3;
    const seg = { len: Math.max(0, len - gap), gap, offset, color: cat.bg };
    offset += len;
    return seg;
  });

  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE, margin: '0 auto' }}>
      <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={dark ? TOKENS.darkElev : TOKENS.paperDeep} strokeWidth={STROKE} />
        {segments.map((s, i) => (
          <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={s.color}
            strokeWidth={STROKE} strokeLinecap="round"
            strokeDasharray={`${s.len} ${circ - s.len}`}
            strokeDashoffset={-s.offset} />
        ))}
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontFamily: FONT.thai, fontSize: 12, color: textMuted, marginBottom: 2 }}>ยอดรวม</div>
        <div style={{ fontFamily: FONT.num, fontSize: 28, fontWeight: 800, color: textInk, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5 }}>
          {fmtNum(total)}
        </div>
        <div style={{ fontFamily: FONT.thai, fontSize: 11, color: textMuted, marginTop: 2 }}>บาท</div>
      </div>
    </div>
  );
}

Object.assign(window, { SummaryScreen });
