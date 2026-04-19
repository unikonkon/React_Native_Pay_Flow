// Premium screen + Settings

// ─────────────────────────────────────────────
// Shared chip helpers used by the Premium screen
// ─────────────────────────────────────────────

function Chip({ on, onClick, children, dark, grow, icon }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  return (
    <button onClick={onClick} style={{
      flex: grow ? 1 : 'initial', minWidth: 0,
      height: 34, padding: '0 14px', borderRadius: 999,
      background: on ? '#fff' : 'transparent',
      border: `1.5px solid ${on ? TOKENS.orange : (dark ? TOKENS.darkHairline : '#D9CFC3')}`,
      color: on ? TOKENS.orangeDeep : textMuted,
      fontFamily: FONT.thai, fontSize: 13, fontWeight: on ? 700 : 500,
      cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      whiteSpace: 'nowrap',
    }}>
      {icon}
      {children}
    </button>
  );
}

// For the top segmented tab (fill style — orange pill)
function SegTab({ on, onClick, children, flex = 1 }) {
  return (
    <button onClick={onClick} style={{
      flex, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
      background: on ? TOKENS.orange : 'transparent',
      color: on ? '#fff' : TOKENS.inkMuted,
      fontFamily: FONT.thai, fontSize: 14.5, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    }}>{children}</button>
  );
}

function PremiumScreen({ dark }) {
  const [tab, setTab] = React.useState('ai'); // 'ai' | 'data'
  return (
    <div style={{ height: '100%', paddingTop: 54, paddingBottom: 82, overflowY: 'auto' }}>
      {/* Title */}
      <div style={{ padding: '8px 18px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="22" height="22" viewBox="0 0 22 22">
          <path d="M6 3h10l4 5-9 11L2 8z" fill={TOKENS.orangeDeep}/>
          <path d="M6 3l5 5M16 3l-5 5M2 8h18" stroke="#fff" strokeWidth="1.2" fill="none"/>
        </svg>
        <div style={{ fontFamily: FONT.thai, fontSize: 26, fontWeight: 800, color: dark ? TOKENS.darkText : TOKENS.ink, letterSpacing: -0.4 }}>
          Premium
        </div>
      </div>

      {/* Top segmented tab */}
      <div style={{
        margin: '0 16px 14px', padding: 4, borderRadius: 14,
        background: dark ? TOKENS.darkElev : TOKENS.paperDeep,
        display: 'flex', gap: 4,
      }}>
        <SegTab on={tab === 'ai'} onClick={() => setTab('ai')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1l1 3 3 1-3 1-1 3-1-3-3-1 3-1zM11 8l.6 1.5L13 10l-1.4.5L11 12l-.6-1.5L9 10l1.4-.5z" fill={tab === 'ai' ? '#fff' : TOKENS.inkMuted}/>
          </svg>
          AI วิเคราะห์
        </SegTab>
        <SegTab on={tab === 'data'} onClick={() => setTab('data')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <g stroke={tab === 'data' ? '#fff' : TOKENS.inkMuted} strokeWidth="1.5" strokeLinecap="round" fill="none">
              <path d="M2 4h8l-2-2M12 10H4l2 2"/>
            </g>
          </svg>
          ข้อมูล
        </SegTab>
      </div>

      {tab === 'ai' ? <AiAnalyzeTab dark={dark} /> : <DataTab dark={dark} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// Tab 1: AI วิเคราะห์
// ─────────────────────────────────────────────
function AiAnalyzeTab({ dark }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const surface = dark ? TOKENS.darkSurface : '#fff';
  const hairline = dark ? TOKENS.darkHairline : TOKENS.hairline;

  const [year, setYear]   = React.useState(2569);
  const [month, setMonth] = React.useState('all');
  const [wallet, setWallet] = React.useState('all');
  const [style, setStyle] = React.useState('summary'); // 'summary' | 'detail'

  const years = [2569, 2568];
  const months = [
    { k: 'all', l: 'ทั้งปี' },
    { k: 1,  l: 'ม.ค.' }, { k: 2,  l: 'ก.พ.' }, { k: 3,  l: 'มี.ค.' }, { k: 4,  l: 'เม.ย.' },
  ];
  const wallets = [
    { k: 'all',   l: 'ทุกกระเป๋า', dot: null },
    { k: 'cash2', l: 'เงินสด (2)', dot: '#82BE89' },
    { k: 'cash',  l: 'เงินสด',      dot: '#82BE89' },
    { k: 'dede',  l: 'เดดก',        dot: '#5FBD8D' },
  ];

  const history = [
    { t: 'มกราคม 2568 — ทุกกระเป๋า', s: 'แบบสรุป', d: '16/4/2569' },
    { t: 'ปี 2568 — ทุกกระเป๋า',      s: 'แบบสรุป', d: '16/4/2569' },
    { t: 'ปี 2568 — ทุกกระเป๋า',      s: 'แบบสรุป', d: '16/4/2569' },
    { t: 'กุมภาพันธ์ 2568 — ทุกกระเป๋า', s: 'แบบสรุป', d: '16/4/2569' },
  ];

  const Section = ({ label, children, scroll }) => (
    <div style={{ margin: '0 16px 14px' }}>
      <div style={{ fontFamily: FONT.thai, fontSize: 14, color: textInk, fontWeight: 700, marginBottom: 8 }}>{label}</div>
      <div style={{
        display: 'flex', gap: 8, flexWrap: scroll ? 'nowrap' : 'wrap',
        overflowX: scroll ? 'auto' : 'visible',
        paddingBottom: scroll ? 2 : 0, scrollbarWidth: 'none',
      }}>{children}</div>
    </div>
  );

  // wallet dot icon
  const walletIcon = (dot) => dot ? (
    <div style={{
      width: 16, height: 16, borderRadius: '50%', background: dot,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT.num, fontSize: 10, fontWeight: 700, color: '#fff',
    }}>W</div>
  ) : null;

  return (
    <>
      <Section label="ปี">
        {years.map(y => (
          <Chip key={y} on={year === y} onClick={() => setYear(y)} dark={dark}>{y}</Chip>
        ))}
      </Section>

      <Section label="เดือน" scroll>
        {months.map(m => (
          <Chip key={m.k} on={month === m.k} onClick={() => setMonth(m.k)} dark={dark}>{m.l}</Chip>
        ))}
      </Section>

      <Section label="กระเป๋าเงิน" scroll>
        {wallets.map(w => (
          <Chip key={w.k} on={wallet === w.k} onClick={() => setWallet(w.k)} dark={dark} icon={walletIcon(w.dot)}>
            {w.l}
          </Chip>
        ))}
      </Section>

      {/* รูปแบบ — bigger segmented (fill style) */}
      <div style={{ margin: '0 16px 14px' }}>
        <div style={{ fontFamily: FONT.thai, fontSize: 14, color: textInk, fontWeight: 700, marginBottom: 8 }}>รูปแบบ</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{k:'summary', l:'วิเคราะห์แบบสรุป'}, {k:'detail', l:'วิเคราะห์แบบละเอียด'}].map(s => (
            <button key={s.k} onClick={() => setStyle(s.k)} style={{
              flex: 1, height: 44, borderRadius: 12, cursor: 'pointer',
              background: style === s.k ? TOKENS.orange : '#fff',
              border: `1.5px solid ${style === s.k ? TOKENS.orange : (dark ? TOKENS.darkHairline : '#D9CFC3')}`,
              color: style === s.k ? '#fff' : textInk,
              fontFamily: FONT.thai, fontSize: 14, fontWeight: 700,
            }}>{s.l}</button>
          ))}
        </div>
      </div>

      {/* เริ่มวิเคราะห์ */}
      <button style={{
        margin: '6px 16px 18px', width: 'calc(100% - 32px)', height: 54,
        background: TOKENS.orange, border: 'none', borderRadius: 14, cursor: 'pointer',
        color: '#fff', fontFamily: FONT.thai, fontSize: 16, fontWeight: 700,
        boxShadow: SHADOWS.fab,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path d="M9 1l1.5 4L15 6.5l-4.5 1.5L9 13l-1.5-5L3 6.5 7.5 5z" fill="#fff"/>
          <path d="M14 11l.7 1.8L17 13.5l-2.3.7L14 16l-.7-1.8-2.3-.7 2.3-.7z" fill="#fff"/>
        </svg>
        เริ่มวิเคราะห์
      </button>

      {/* ประวัติการวิเคราะห์ */}
      <div style={{ margin: '0 16px 14px', display: 'flex', alignItems: 'center' }}>
        <div style={{ fontFamily: FONT.thai, fontSize: 15, color: textInk, fontWeight: 700, flex: 1 }}>ประวัติการวิเคราะห์</div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: TOKENS.orange, fontFamily: FONT.thai, fontSize: 13, fontWeight: 600, padding: 0, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          ดูทั้งหมด (18) <svg width="7" height="10" viewBox="0 0 7 10"><path d="M1 1l5 4-5 4" stroke={TOKENS.orange} strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div style={{ margin: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {history.map((h, i) => (
          <button key={i} style={{
            background: surface, borderRadius: 16, padding: '14px 14px',
            border: 'none', cursor: 'pointer', textAlign: 'left',
            boxShadow: SHADOWS.card, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: TOKENS.orangeTint, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <g stroke={TOKENS.orangeDeep} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 1h6l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z"/>
                  <path d="M9 1v3h3M4 7h6M4 10h4"/>
                </g>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT.thai, fontSize: 14, color: textInk, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {h.t}
              </div>
              <div style={{ fontFamily: FONT.thai, fontSize: 11.5, color: textMuted, marginTop: 2 }}>
                {h.s} · {h.d}
              </div>
            </div>
            <svg width="7" height="12" viewBox="0 0 7 12"><path d="M1 1l5 5-5 5" stroke={textMuted} strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>
          </button>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Tab 2: ข้อมูล (Export / Import)
// ─────────────────────────────────────────────
function DataTab({ dark }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const surface = dark ? TOKENS.darkSurface : '#fff';
  const hairline = dark ? TOKENS.darkHairline : TOKENS.hairline;

  const [dir, setDir]     = React.useState('export'); // 'export' | 'import'
  const [format, setFmt]  = React.useState('txt');    // 'txt' | 'xlsx'

  const summary = [
    { k: 'wallet',   l: 'กระเป๋าเงิน',        v: '3 รายการ',     icon: 'wallet' },
    { k: 'cats',     l: 'หมวดหมู่',           v: '45 รายการ',    icon: 'grid' },
    { k: 'tx',       l: 'ธุรกรรม',            v: '10000 รายการ', icon: 'doc' },
    { k: 'ai',       l: 'การวิเคราะห์',        v: '327 รายการ',   icon: 'trend' },
    { k: 'aiHist',   l: 'ประวัติ AI',          v: '18 รายการ',    icon: 'sparkle' },
    { k: 'settings', l: 'ตั้งค่าแอป',          v: '✓',            icon: 'gear' },
    { k: 'alerts',   l: 'ตั้งค่าการแจ้งเตือน', v: '0 รายการ',     icon: 'bell' },
  ];

  const renderIcon = (kind) => {
    const p = { fill: 'none', stroke: textMuted, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
    switch (kind) {
      case 'wallet':  return <svg width="16" height="16" viewBox="0 0 16 16"><g {...p}><path d="M2 5a2 2 0 012-2h9v10H4a2 2 0 01-2-2z"/><path d="M13 5h-2a2 2 0 000 4h2"/></g></svg>;
      case 'grid':    return <svg width="16" height="16" viewBox="0 0 16 16"><g {...p}><rect x="2" y="2" width="4.5" height="4.5"/><rect x="9.5" y="2" width="4.5" height="4.5"/><rect x="2" y="9.5" width="4.5" height="4.5"/><rect x="9.5" y="9.5" width="4.5" height="4.5"/></g></svg>;
      case 'doc':     return <svg width="16" height="16" viewBox="0 0 16 16"><g {...p}><path d="M3 1.5h7l3 3v10H3z"/><path d="M10 1.5v3h3M5 8h6M5 11h4"/></g></svg>;
      case 'trend':   return <svg width="16" height="16" viewBox="0 0 16 16"><g {...p}><path d="M2 12l4-4 3 3 5-6"/><path d="M10 5h4v4"/></g></svg>;
      case 'sparkle': return <svg width="16" height="16" viewBox="0 0 16 16"><g {...p}><path d="M8 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/></g></svg>;
      case 'gear':    return <svg width="16" height="16" viewBox="0 0 16 16"><g {...p}><circle cx="8" cy="8" r="2"/><path d="M8 2v2M8 12v2M2 8h2M12 8h2M4 4l1.5 1.5M10.5 10.5L12 12M12 4l-1.5 1.5M5.5 10.5L4 12"/></g></svg>;
      case 'bell':    return <svg width="16" height="16" viewBox="0 0 16 16"><g {...p}><path d="M4 6a4 4 0 018 0v3l1.5 2h-11L4 9z"/><path d="M6.5 13a1.5 1.5 0 003 0"/></g></svg>;
    }
  };

  return (
    <>
      {/* Export / Import toggle */}
      <div style={{
        margin: '0 16px 10px', padding: 4, borderRadius: 12,
        background: dark ? TOKENS.darkElev : TOKENS.paperDeep,
        display: 'flex', gap: 4,
      }}>
        {[{k:'export', l:'ส่งออก', ic: '↑'}, {k:'import', l:'นำเข้า', ic: '↓'}].map(d => (
          <button key={d.k} onClick={() => setDir(d.k)} style={{
            flex: 1, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: dir === d.k ? TOKENS.orange : 'transparent',
            color: dir === d.k ? '#fff' : textMuted,
            fontFamily: FONT.thai, fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <g stroke={dir === d.k ? '#fff' : textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                {d.k === 'export'
                  ? <><path d="M7 2v7M4 5l3-3 3 3"/><path d="M2 10v1a1 1 0 001 1h8a1 1 0 001-1v-1"/></>
                  : <><path d="M7 9V2M4 6l3 3 3-3"/><path d="M2 10v1a1 1 0 001 1h8a1 1 0 001-1v-1"/></>
                }
              </g>
            </svg>
            {d.l}
          </button>
        ))}
      </div>

      {/* Format toggle */}
      <div style={{
        margin: '0 16px 14px', display: 'flex', gap: 10,
      }}>
        {[{k:'txt', l:'TXT (JSON)'}, {k:'xlsx', l:'Excel (.xlsx)'}].map(f => (
          <button key={f.k} onClick={() => setFmt(f.k)} style={{
            flex: 1, height: 40, borderRadius: 10, cursor: 'pointer',
            background: format === f.k ? TOKENS.orangeTint : 'transparent',
            border: `1.5px solid ${format === f.k ? TOKENS.orange : (dark ? TOKENS.darkHairline : '#D9CFC3')}`,
            color: format === f.k ? TOKENS.orangeDeep : textMuted,
            fontFamily: FONT.thai, fontSize: 13.5, fontWeight: 700,
          }}>{f.l}</button>
        ))}
      </div>

      {/* Summary card */}
      <div style={{
        margin: '0 16px 12px', background: surface, borderRadius: 14,
        boxShadow: SHADOWS.card, padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <svg width="16" height="16" viewBox="0 0 16 16"><g fill="none" stroke={textInk} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 1.5h7l3 3v10H3z"/><path d="M10 1.5v3h3M5 8h6M5 11h4"/></g></svg>
          <div style={{ fontFamily: FONT.thai, fontSize: 14.5, fontWeight: 700, color: textInk }}>
            {dir === 'export' ? 'ข้อมูลที่จะส่งออก' : 'ข้อมูลที่จะนำเข้า'}
          </div>
        </div>
        {summary.map((row, i) => (
          <div key={row.k} style={{
            display: 'flex', alignItems: 'center', padding: '8px 0',
            borderBottom: i < summary.length - 1 ? `0.5px solid ${hairline}` : 'none',
          }}>
            <div style={{ width: 20, height: 20, marginRight: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {renderIcon(row.icon)}
            </div>
            <div style={{ flex: 1, fontFamily: FONT.thai, fontSize: 13.5, color: textInk }}>{row.l}</div>
            <div style={{ fontFamily: FONT.mix, fontSize: 13, color: textMuted, fontVariantNumeric: 'tabular-nums' }}>{row.v}</div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div style={{
        margin: '0 16px 14px', padding: '10px 12px',
        background: dark ? 'rgba(100,120,220,0.15)' : '#EFF1F8',
        borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          background: '#5A6AD8', flexShrink: 0, marginTop: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT.mix, color: '#fff', fontSize: 11, fontWeight: 700,
        }}>i</div>
        <div style={{ fontFamily: FONT.thai, fontSize: 11.5, color: dark ? textMuted : '#4A5578', lineHeight: 1.45 }}>
          {dir === 'export'
            ? (format === 'txt'
                ? 'ข้อมูลจะถูกส่งออกเป็นไฟล์ .txt (JSON) รวมข้อมูลทั้งหมดในแอป สามารถใช้นำเข้ากลับได้'
                : 'ข้อมูลจะถูกส่งออกเป็นไฟล์ Excel (.xlsx) เปิดดูได้ใน Excel / Google Sheets')
            : 'เลือกไฟล์สำรองที่เคยส่งออกไว้ เพื่อนำข้อมูลกลับมาใช้งาน (ข้อมูลปัจจุบันจะถูกทับ)'
          }
        </div>
      </div>

      {/* Action button */}
      <button style={{
        margin: '4px 16px 20px', width: 'calc(100% - 32px)', height: 54,
        background: TOKENS.orange, border: 'none', borderRadius: 14, cursor: 'pointer',
        color: '#fff', fontFamily: FONT.thai, fontSize: 15.5, fontWeight: 700,
        boxShadow: SHADOWS.fab,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <g stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {dir === 'export'
              ? <><path d="M9 2v9M5 6l4-4 4 4"/><path d="M3 13v1a2 2 0 002 2h8a2 2 0 002-2v-1"/></>
              : <><path d="M9 11V2M5 7l4 4 4-4"/><path d="M3 13v1a2 2 0 002 2h8a2 2 0 002-2v-1"/></>
            }
          </g>
        </svg>
        {dir === 'export' ? `ส่งออกข้อมูลทั้งหมด (.${format})` : `นำเข้าข้อมูลจากไฟล์ .${format}`}
      </button>
    </>
  );
}

function PlanCard({ active, onClick, title, price, per, note, highlight, dark }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  return (
    <button onClick={onClick} style={{
      padding: '14px 14px 16px', borderRadius: 20, cursor: 'pointer', textAlign: 'left',
      background: active ? (dark ? TOKENS.darkElev : '#fff') : 'transparent',
      border: `2px solid ${active ? TOKENS.orange : (dark ? TOKENS.darkHairline : TOKENS.hairline)}`,
      boxShadow: active ? SHADOWS.card : 'none', position: 'relative',
    }}>
      {highlight && (
        <div style={{
          position: 'absolute', top: -10, right: 10,
          background: TOKENS.gold, color: TOKENS.ink,
          fontFamily: FONT.thai, fontSize: 10, fontWeight: 700,
          padding: '3px 8px', borderRadius: 999,
        }}>คุ้มสุด ★</div>
      )}
      <div style={{ fontFamily: FONT.thai, fontSize: 13, color: textMuted, fontWeight: 500 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 4 }}>
        <div style={{ fontFamily: FONT.num, fontSize: 24, fontWeight: 800, color: textInk, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5 }}>
          {price}
        </div>
        <div style={{ fontFamily: FONT.thai, fontSize: 12, color: textMuted }}>{per}</div>
      </div>
      <div style={{ fontFamily: FONT.thai, fontSize: 11, color: highlight ? TOKENS.orangeDeep : textMuted, marginTop: 6, fontWeight: highlight ? 600 : 400 }}>
        {note}
      </div>
    </button>
  );
}

function FeatureIcon({ kind, color }) {
  const p = { fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (kind) {
    case 'ai':
      return <svg width="20" height="20" viewBox="0 0 20 20"><g {...p}><path d="M10 2v2M10 16v2M4 10H2M18 10h-2M5 5l1 1M14 14l1 1M15 5l-1 1M5 15l1-1"/><circle cx="10" cy="10" r="4"/></g></svg>;
    case 'export':
      return <svg width="20" height="20" viewBox="0 0 20 20"><g {...p}><path d="M10 13V3M6 7l4-4 4 4"/><path d="M3 13v3a2 2 0 002 2h10a2 2 0 002-2v-3"/></g></svg>;
    case 'theme':
      return <svg width="20" height="20" viewBox="0 0 20 20"><g {...p}><circle cx="10" cy="10" r="7"/><path d="M10 3v14M3 10h14"/></g></svg>;
    case 'cloud':
      return <svg width="20" height="20" viewBox="0 0 20 20"><g {...p}><path d="M5 14a3 3 0 010-6 5 5 0 019-1 3.5 3.5 0 012 6.5z"/></g></svg>;
    case 'noad':
      return <svg width="20" height="20" viewBox="0 0 20 20"><g {...p}><circle cx="10" cy="10" r="7"/><path d="M5 5l10 10"/></g></svg>;
  }
}

function SettingsScreen({ dark, onToggleDark }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const surface = dark ? TOKENS.darkSurface : '#FFFFFF';
  const hairline = dark ? TOKENS.darkHairline : TOKENS.hairline;

  const sections = [
    { title: 'ทั่วไป', items: [
      { label: 'ธีม', icon: 'theme', detail: dark ? 'มืด' : 'สว่าง', onToggle: onToggleDark },
      { label: 'Gemini API Key', icon: 'key', detail: 'ตั้งค่าแล้ว (****hwN0)' },
      { label: 'AI วิเคราะห์', icon: 'sparkles', detail: 'พร้อมใช้งาน' },
      { label: 'ล็อกด้วย Face ID/ลายนิ้วมือ', icon: 'faceid', detail: 'ปิด' },
      { label: 'แจ้งเตือน Push', icon: 'bell', detail: 'ปิด' },
      { label: 'สกุลเงิน', icon: 'money', detail: 'THB ฿' },
    ]},
    { title: 'กระเป๋าเงิน', items: [
      { label: 'สร้างกระเป๋าใหม่', icon: 'plus' },
      { label: 'จัดการกระเป๋าเงิน', icon: 'wallet' },
    ]},
    { title: 'เกี่ยวกับ', items: [
      { label: 'เวอร์ชัน', icon: 'info', detail: '1.0.0' },
      { label: 'แมวมันนี่', icon: 'paw', detail: 'MaewMoney' },
    ]},
  ];

  return (
    <div style={{ height: '100%', paddingTop: 54, paddingBottom: 82, overflowY: 'auto' }}>
      <div style={{ padding: '8px 18px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="assets/mascot-run.png" style={{ width: 40, height: 40, objectFit: 'contain' }} />
        </div>
        <div style={{ fontFamily: FONT.thai, fontSize: 26, fontWeight: 700, color: textInk, letterSpacing: -0.4 }}>
          ตั้งค่า
        </div>
      </div>

      {sections.map((sec, si) => (
        <div key={si} style={{ margin: '0 16px 14px' }}>
          <div style={{ fontFamily: FONT.thai, fontSize: 12, color: textMuted, padding: '0 6px 6px', fontWeight: 600, letterSpacing: 0.3 }}>
            {sec.title}
          </div>
          <div style={{ background: surface, borderRadius: 20, overflow: 'hidden', boxShadow: SHADOWS.card }}>
            {sec.items.map((it, i) => (
              <div key={i} onClick={it.onToggle} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderBottom: i < sec.items.length - 1 ? `0.5px solid ${hairline}` : 'none',
                cursor: it.onToggle ? 'pointer' : 'default',
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: dark ? TOKENS.darkElev : TOKENS.orangeTint,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <SettingIcon kind={it.icon} color={TOKENS.orangeDeep} />
                </div>
                <div style={{ fontFamily: FONT.thai, fontSize: 14.5, color: textInk, flex: 1 }}>{it.label}</div>
                {it.premium && <Sparkle size={10} color={TOKENS.gold} />}
                {it.detail && <div style={{ fontFamily: FONT.mix, fontSize: 13, color: textMuted }}>{it.detail}</div>}
                {it.toggle ? (
                  <div style={{
                    width: 40, height: 24, borderRadius: 999,
                    background: it.value ? TOKENS.orange : (dark ? TOKENS.darkElev : '#d9d0c4'),
                    position: 'relative', transition: 'background 200ms', flexShrink: 0,
                  }}>
                    <div style={{
                      position: 'absolute', top: 2, left: it.value ? 18 : 2,
                      width: 20, height: 20, borderRadius: '50%', background: '#fff',
                      transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                ) : (
                  <svg width="7" height="12" viewBox="0 0 7 12"><path d="M1 1l5 5-5 5" stroke={textMuted} strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ textAlign: 'center', fontFamily: FONT.thai, fontSize: 11, color: textMuted, margin: '20px 0' }}>
        แมวมันนี่ v1.0.0 · ทำด้วย <span style={{ color: TOKENS.orange }}>♥</span> โดย iApp
      </div>
    </div>
  );
}

function SettingIcon({ kind, color }) {
  const p = { fill: 'none', stroke: color, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const map = {
    user:   <g {...p}><circle cx="8" cy="6" r="3"/><path d="M2 14c1-3 3.5-4 6-4s5 1 6 4"/></g>,
    wallet: <g {...p}><rect x="2" y="4" width="12" height="9" rx="1.5"/><path d="M2 7h12"/><circle cx="11" cy="10" r="0.8" fill={color}/></g>,
    folder: <g {...p}><path d="M2 4h4l2 2h6v7H2z"/></g>,
    moon:   <g {...p}><path d="M13 9a5 5 0 11-6-6 4 4 0 006 6z"/></g>,
    bell:   <g {...p}><path d="M8 2a4 4 0 00-4 4v3l-1 2h10l-1-2V6a4 4 0 00-4-4zM6 13a2 2 0 004 0"/></g>,
    lang:   <g {...p}><circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12"/></g>,
    money:  <g {...p}><circle cx="8" cy="8" r="6"/><path d="M6 6h3a1.5 1.5 0 010 3H6m0 0h3a1.5 1.5 0 010 3H6V4"/></g>,
    cloud:  <g {...p}><path d="M4 11a2.5 2.5 0 010-5 4 4 0 017-1 3 3 0 011 5.5z"/></g>,
    export: <g {...p}><path d="M8 10V3M5 6l3-3 3 3M2 10v3h12v-3"/></g>,
    trash:  <g {...p}><path d="M3 5h10M6 5V3h4v2M4.5 5l1 9h5l1-9"/></g>,
    theme:  <g {...p}><circle cx="8" cy="8" r="6"/><circle cx="5.2" cy="6" r="0.9" fill={color} stroke="none"/><circle cx="10.5" cy="5.5" r="0.9" fill={color} stroke="none"/><circle cx="11.5" cy="9.2" r="0.9" fill={color} stroke="none"/><path d="M8 14c-1.5 0-2.2-1.3-1.2-2.4.8-.9.2-2.1-1-2.3"/></g>,
    key:    <g {...p}><circle cx="5" cy="8" r="2.5"/><path d="M7.5 8H14M12 8v2.2M14 8v2.5"/></g>,
    sparkles: <g {...p}><path d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l1.8 1.8M10.2 10.2L12 12M12 4l-1.8 1.8M5.8 10.2L4 12"/></g>,
    faceid: <g {...p}><path d="M3 5V3h2M13 5V3h-2M3 11v2h2M13 11v2h-2M6 6.5v1M10 6.5v1M8 6.5v2.5h-1M6.5 10.5c1 .8 2.5 1 3 0"/></g>,
    plus:   <g {...p}><circle cx="8" cy="8" r="6"/><path d="M8 5v6M5 8h6"/></g>,
    info:   <g {...p}><circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 4.7v.6"/></g>,
    paw:    <g {...p}><ellipse cx="4" cy="7" rx="1.3" ry="1.7"/><ellipse cx="12" cy="7" rx="1.3" ry="1.7"/><ellipse cx="6.2" cy="4.3" rx="1.1" ry="1.4"/><ellipse cx="9.8" cy="4.3" rx="1.1" ry="1.4"/><path d="M8 8.5c-2.4 0-4 2-3.5 3.8.3 1.2 1.8 1.4 3.5.4 1.7 1 3.2.8 3.5-.4.5-1.8-1.1-3.8-3.5-3.8z"/></g>,
  };
  return <svg width="16" height="16" viewBox="0 0 16 16">{map[kind]}</svg>;
}

// ─────────────────────────────────────────────
// Premium UPGRADE screen (sales / subscribe)
// Kept as a separate screen – not wired to the bottom nav
// ─────────────────────────────────────────────

function PremiumUpgradeScreen({ dark }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const surface = dark ? TOKENS.darkSurface : '#FFFFFF';
  const [plan, setPlan] = React.useState('year');

  const features = [
    { t: 'AI วิเคราะห์การใช้จ่าย', d: 'มิวช่วยดูพฤติกรรมการใช้เงิน ทุกสัปดาห์', icon: 'ai' },
    { t: 'Export รายงาน PDF/Excel', d: 'ส่งให้นักบัญชีหรือเก็บเป็นหลักฐาน', icon: 'export' },
    { t: 'ธีมพิเศษ + มิวเปลี่ยนชุด', d: '12 ธีม และชุดมิวตามฤดูกาล', icon: 'theme' },
    { t: 'Cloud backup อัตโนมัติ', d: 'ข้อมูลปลอดภัย ซิงก์ทุกอุปกรณ์', icon: 'cloud' },
    { t: 'ไม่มีโฆษณา', d: 'ใช้งานลื่นไหล ไม่รบกวน', icon: 'noad' },
  ];

  return (
    <div style={{ height: '100%', paddingTop: 54, paddingBottom: 82, overflowY: 'auto' }}>
      {/* Hero */}
      <div style={{
        position: 'relative', margin: '8px 16px 14px', padding: '22px 20px 24px',
        background: `linear-gradient(155deg, ${TOKENS.orangeTint} 0%, ${TOKENS.cosmicSoft} 100%)`,
        borderRadius: 28, overflow: 'hidden',
      }}>
        <KintsugiCrack style={{ top: 10, left: -10, opacity: 0.55, transform: 'scale(1.3)' }} />
        <KintsugiCrack style={{ bottom: -10, right: -20, opacity: 0.4 }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(255,255,255,0.5)', borderRadius: 999, backdropFilter: 'blur(8px)' }}>
            <Sparkle size={10} />
            <div style={{ fontFamily: FONT.thai, fontSize: 12, fontWeight: 600, color: TOKENS.cosmic }}>มิว Premium</div>
          </div>
          <div style={{ fontFamily: FONT.thai, fontSize: 26, fontWeight: 800, color: TOKENS.ink, marginTop: 10, letterSpacing: -0.4, lineHeight: 1.15 }}>
            ปลดล็อกพลังทั้งหมด<br/>ของมิวกันเถอะ
          </div>
          <div style={{ fontFamily: FONT.thai, fontSize: 13, color: TOKENS.inkSoft, marginTop: 6, maxWidth: 210 }}>
            บันทึกไม่จำกัด พร้อมฟีเจอร์สุดคุ้มอีก 5 อย่าง
          </div>
        </div>
        <img src="assets/mascot-plus.png" style={{
          position: 'absolute', right: -22, bottom: -18, width: 168, height: 108, objectFit: 'contain',
          objectPosition: '70% 50%', transform: 'rotate(-8deg)', zIndex: 1,
        }} />
      </div>

      {/* Features */}
      <div style={{ margin: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {features.map((f, i) => (
          <div key={i} style={{
            background: surface, borderRadius: 20, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: SHADOWS.card, position: 'relative', overflow: 'hidden',
          }}>
            <KintsugiCrack style={{ top: -30, right: -40, opacity: 0.2 }} />
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: i % 2 === 0 ? TOKENS.orangeTint : TOKENS.cosmicSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <FeatureIcon kind={f.icon} color={i % 2 === 0 ? TOKENS.orangeDeep : TOKENS.cosmic} />
            </div>
            <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <div style={{ fontFamily: FONT.thai, fontSize: 14.5, fontWeight: 600, color: textInk }}>{f.t}</div>
              <div style={{ fontFamily: FONT.thai, fontSize: 12, color: textMuted, marginTop: 2 }}>{f.d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div style={{ margin: '4px 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <PlanCard active={plan === 'month'} onClick={() => setPlan('month')} dark={dark}
          title="รายเดือน" price="฿99" per="/ เดือน" note="ยกเลิกได้ทุกเมื่อ" />
        <PlanCard active={plan === 'year'} onClick={() => setPlan('year')} dark={dark}
          title="รายปี" price="฿899" per="/ ปี" note="ประหยัด 25%" highlight />
      </div>

      <button style={{
        margin: '8px 16px 12px', height: 52, width: 'calc(100% - 32px)',
        background: TOKENS.orange, border: 'none', borderRadius: 999, cursor: 'pointer',
        color: '#fff', fontFamily: FONT.thai, fontSize: 16, fontWeight: 700,
        boxShadow: SHADOWS.fab, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        เริ่มใช้ Premium <PawPrint size={14} color="#fff" />
      </button>
      <div style={{ textAlign: 'center', fontFamily: FONT.thai, fontSize: 11, color: textMuted, marginBottom: 16 }}>
        ทดลองฟรี 7 วัน • ยกเลิกได้ก่อนคิดเงิน
      </div>
    </div>
  );
}

Object.assign(window, { PremiumScreen, PremiumUpgradeScreen, SettingsScreen });
