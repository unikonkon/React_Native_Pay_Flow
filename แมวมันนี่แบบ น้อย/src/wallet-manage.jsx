// Wallet management screen + Add wallet modal

// ─────────────────────────────────────────────
// Shared: a small icon renderer for wallet types
// ─────────────────────────────────────────────
function WalletTypeIcon({ kind, size = 16, color }) {
  const p = { fill: 'none', stroke: color, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const s = size;
  switch (kind) {
    case 'cash':
      return (
        <svg width={s} height={s} viewBox="0 0 18 18">
          <g {...p}>
            <rect x="2" y="5" width="14" height="8" rx="1.5"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="M4.5 7.5v0M13.5 10.5v0"/>
          </g>
        </svg>
      );
    case 'bank':
      return (
        <svg width={s} height={s} viewBox="0 0 18 18">
          <g {...p}>
            <path d="M2 7l7-4 7 4v1H2z"/>
            <path d="M3.5 8v6M7 8v6M11 8v6M14.5 8v6M2 15h14"/>
          </g>
        </svg>
      );
    case 'credit':
      return (
        <svg width={s} height={s} viewBox="0 0 18 18">
          <g {...p}>
            <rect x="1.5" y="4" width="15" height="11" rx="1.5"/>
            <path d="M1.5 8h15M4 12h3"/>
          </g>
        </svg>
      );
    case 'ewallet':
      return (
        <svg width={s} height={s} viewBox="0 0 18 18">
          <g {...p}>
            <rect x="4" y="2" width="10" height="14" rx="1.8"/>
            <path d="M7 5h4M9 13v0"/>
          </g>
        </svg>
      );
    case 'saving':
      return (
        <svg width={s} height={s} viewBox="0 0 18 18">
          <g {...p}>
            <path d="M3 6h10a2 2 0 012 2v5a1 1 0 01-1 1H4a1 1 0 01-1-1z"/>
            <circle cx="12" cy="10" r="0.8" fill={color}/>
            <path d="M6 6V4h3v2"/>
          </g>
        </svg>
      );
    case 'daily':
      return (
        <svg width={s} height={s} viewBox="0 0 18 18">
          <g {...p}>
            <rect x="2.5" y="3.5" width="13" height="11" rx="1.5"/>
            <path d="M2.5 7h13M5.5 2v3M12.5 2v3"/>
          </g>
        </svg>
      );
  }
}

const WALLET_TYPES = [
  { k: 'cash',    l: 'เงินสด',         icon: 'cash'    },
  { k: 'bank',    l: 'ธนาคาร',         icon: 'bank'    },
  { k: 'credit',  l: 'บัตรเครดิต',      icon: 'credit'  },
  { k: 'ewallet', l: 'E-Wallet',       icon: 'ewallet' },
  { k: 'saving',  l: 'บัญชีออมทรัพย์',   icon: 'saving'  },
  { k: 'daily',   l: 'ค่าใช้จ่ายรายวัน', icon: 'daily'   },
];

const WALLET_COLORS = [
  '#53C26E', // green (selected in reference)
  '#3D7EF0', // blue
  '#E25757', // red
  '#E8A93D', // amber
  '#7E6DE0', // purple
  '#E06DAB', // pink
  '#3FB59B', // teal
  '#4A5FE0', // indigo
];

// ─────────────────────────────────────────────
// Manage Wallets screen (main content)
// ─────────────────────────────────────────────
function ManageWalletsScreen({ dark, onOpenAdd }) {
  const textInk   = dark ? TOKENS.darkText  : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const surface   = dark ? TOKENS.darkSurface : '#fff';
  const hairline  = dark ? TOKENS.darkHairline : TOKENS.hairline;

  // Demo wallets
  const wallets = [
    { name: 'เงินสด',        type: 'cash',    color: '#53C26E', balance: 12450,  count: 148, primary: true  },
    { name: 'กสิกรไทย',      type: 'bank',    color: '#3D7EF0', balance: 84320,  count: 62                   },
    { name: 'ไทยพาณิชย์',    type: 'bank',    color: '#7E6DE0', balance: 23500,  count: 41                   },
    { name: 'บัตรเครดิต KTC', type: 'credit',  color: '#E25757', balance: -8640,  count: 29                   },
    { name: 'TrueMoney',    type: 'ewallet', color: '#E8A93D', balance: 512,    count: 17                   },
    { name: 'ออมทรัพย์',      type: 'saving',  color: '#3FB59B', balance: 180000, count: 5                    },
  ];

  const fmt = (n) => {
    const abs = Math.abs(n).toLocaleString('en-US');
    return (n < 0 ? '−฿' : '฿') + abs;
  };
  const typeLabel = (k) => WALLET_TYPES.find(t => t.k === k)?.l;

  const total = wallets.reduce((s, w) => s + w.balance, 0);

  return (
    <div style={{ height: '100%', paddingTop: 54, paddingBottom: 100, overflowY: 'auto' }}>
      {/* Header with back */}
      <div style={{ padding: '8px 14px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: dark ? TOKENS.darkElev : TOKENS.paperDeep, flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 1L3 7l6 6" stroke={textInk} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ flex: 1, fontFamily: FONT.thai, fontSize: 20, fontWeight: 700, color: textInk, letterSpacing: -0.3 }}>
          จัดการกระเป๋าเงิน
        </div>
        <button style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: dark ? TOKENS.darkElev : TOKENS.paperDeep, flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14"><g stroke={textInk} strokeWidth="1.6" strokeLinecap="round" fill="none"><path d="M2 4h10M2 7h10M2 10h6"/></g></svg>
        </button>
      </div>

      {/* Summary */}
      <div style={{
        margin: '0 16px 14px', padding: '14px 16px 16px', borderRadius: 18,
        background: `linear-gradient(135deg, ${TOKENS.orangeTint} 0%, ${TOKENS.cosmicSoft} 110%)`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ fontFamily: FONT.thai, fontSize: 12, color: TOKENS.inkSoft, fontWeight: 500 }}>
          ยอดรวมทุกกระเป๋า
        </div>
        <div style={{ fontFamily: FONT.num, fontSize: 26, fontWeight: 800, color: TOKENS.ink, marginTop: 2, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>
          ฿{total.toLocaleString('en-US')}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
          <div style={{ fontFamily: FONT.thai, fontSize: 11.5, color: TOKENS.inkSoft }}>
            <span style={{ fontWeight: 600, color: TOKENS.ink, fontFamily: FONT.mix }}>{wallets.length}</span> กระเป๋า
          </div>
          <div style={{ width: 1, background: 'rgba(42,35,32,0.15)' }} />
          <div style={{ fontFamily: FONT.thai, fontSize: 11.5, color: TOKENS.inkSoft }}>
            ใช้งาน <span style={{ fontWeight: 600, color: TOKENS.ink, fontFamily: FONT.mix }}>{wallets.reduce((s,w) => s + w.count, 0)}</span> ครั้ง
          </div>
        </div>
      </div>

      {/* Section header */}
      <div style={{
        margin: '0 22px 8px',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ fontFamily: FONT.thai, fontSize: 12, color: textMuted, flex: 1, fontWeight: 600, letterSpacing: 0.3 }}>
          กระเป๋าของฉัน ({wallets.length})
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontFamily: FONT.thai, fontSize: 11.5, color: textMuted,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><g stroke={textMuted} strokeWidth="1.5" strokeLinecap="round"><circle cx="3" cy="3" r="0.7" fill={textMuted}/><circle cx="9" cy="3" r="0.7" fill={textMuted}/><circle cx="3" cy="9" r="0.7" fill={textMuted}/><circle cx="9" cy="9" r="0.7" fill={textMuted}/></g></svg>
          ลากเพื่อจัดลำดับ
        </div>
      </div>

      {/* Wallet list */}
      <div style={{ margin: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {wallets.map((w, i) => (
          <div key={i} style={{
            background: surface, borderRadius: 16, padding: '12px 14px',
            boxShadow: SHADOWS.card,
            display: 'flex', alignItems: 'center', gap: 12,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Left color accent bar */}
            <div style={{
              position: 'absolute', left: 0, top: 10, bottom: 10, width: 3,
              background: w.color, borderRadius: '0 3px 3px 0',
            }} />

            {/* Icon dot */}
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: w.color + '22',
              border: `1.5px solid ${w.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <WalletTypeIcon kind={w.type} size={18} color={w.color} />
            </div>

            {/* Name + type */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontFamily: FONT.thai, fontSize: 14.5, fontWeight: 700, color: textInk, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {w.name}
                </div>
                {w.primary && (
                  <div style={{
                    fontFamily: FONT.thai, fontSize: 10, color: TOKENS.orangeDeep, fontWeight: 700,
                    background: TOKENS.orangeTint, padding: '1px 6px', borderRadius: 999,
                  }}>หลัก</div>
                )}
              </div>
              <div style={{ fontFamily: FONT.thai, fontSize: 11.5, color: textMuted, marginTop: 1 }}>
                {typeLabel(w.type)} · ใช้ <span style={{ fontFamily: FONT.mix }}>{w.count}</span> ครั้ง
              </div>
            </div>

            {/* Balance */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{
                fontFamily: FONT.num, fontSize: 14, fontWeight: 700,
                color: w.balance < 0 ? '#D04040' : textInk,
                fontVariantNumeric: 'tabular-nums', letterSpacing: -0.2,
              }}>
                {fmt(w.balance)}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 3,
              }}>
                <button style={{
                  width: 24, height: 24, borderRadius: 7, border: `1px solid ${hairline}`,
                  background: 'transparent', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><g stroke={textMuted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 1.5l2.5 2.5L4 10.5l-2.5.5.5-2.5z"/></g></svg>
                </button>
                <button style={{
                  width: 24, height: 24, borderRadius: 7, border: `1px solid ${hairline}`,
                  background: 'transparent', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><g stroke="#D04040" strokeWidth="1.4" strokeLinecap="round"><path d="M2.5 3.5h7M4.5 3.5V2h3v1.5M3.5 3.5l.5 6.5h4l.5-6.5M5 5.5v3M7 5.5v3"/></g></svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add button (dashed) */}
        <button onClick={onOpenAdd} style={{
          background: 'transparent', borderRadius: 16, padding: '18px 14px',
          border: `1.5px dashed ${TOKENS.orange}`, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          color: TOKENS.orange, fontFamily: FONT.thai, fontSize: 14.5, fontWeight: 700,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16"><g stroke={TOKENS.orange} strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></g></svg>
          เพิ่มกระเป๋าเงิน
        </button>
      </div>

      {/* Hint footer */}
      <div style={{
        margin: '4px 16px 20px', padding: '10px 12px',
        background: dark ? 'rgba(232,181,71,0.12)' : 'rgba(232,181,71,0.15)',
        borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="8" cy="8" r="7" fill={TOKENS.gold} />
          <path d="M8 4v4.5M8 11.5v0" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
        <div style={{ fontFamily: FONT.thai, fontSize: 11.5, color: TOKENS.inkSoft, lineHeight: 1.45 }}>
          ลบกระเป๋าแล้วรายการธุรกรรมจะย้ายไปที่ "ไม่มีกระเป๋า" คุณสามารถย้ายเองได้ก่อนลบ
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Add Wallet modal
// ─────────────────────────────────────────────
function AddWalletModal({ open, onClose, dark }) {
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState('cash');
  const [color, setColor] = React.useState(WALLET_COLORS[0]);

  const textInk   = dark ? TOKENS.darkText  : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const surface   = dark ? TOKENS.darkSurface : '#fff';
  const hairline  = dark ? TOKENS.darkHairline : TOKENS.hairline;

  if (!open) return null;

  const canAdd = name.trim().length > 0;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'rgba(42,35,32,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 360, background: surface, borderRadius: 20,
        padding: '18px 18px 20px', boxShadow: '0 20px 50px rgba(42,35,32,0.25)',
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ flex: 1, fontFamily: FONT.thai, fontSize: 18, fontWeight: 700, color: textInk }}>
            เพิ่มกระเป๋าเงิน
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke={textInk} strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Name */}
        <div style={{ fontFamily: FONT.thai, fontSize: 13, color: textInk, fontWeight: 600, marginBottom: 6 }}>ชื่อ</div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="ชื่อกระเป๋าเงิน"
          style={{
            width: '100%', height: 42, padding: '0 14px', borderRadius: 10,
            border: `1px solid ${hairline}`, background: 'transparent',
            fontFamily: FONT.thai, fontSize: 14, color: textInk,
            outline: 'none', boxSizing: 'border-box',
          }}
        />

        {/* Type */}
        <div style={{ fontFamily: FONT.thai, fontSize: 13, color: textInk, fontWeight: 600, margin: '14px 0 6px' }}>ประเภท</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {WALLET_TYPES.map(t => {
            const on = type === t.k;
            return (
              <button key={t.k} onClick={() => setType(t.k)} style={{
                height: 36, padding: '0 12px', borderRadius: 999, cursor: 'pointer',
                background: on ? TOKENS.orangeTint : (dark ? TOKENS.darkElev : TOKENS.paperDeep),
                border: on ? `1.5px solid ${TOKENS.orange}` : `1px solid transparent`,
                color: on ? TOKENS.orangeDeep : textInk,
                fontFamily: FONT.thai, fontSize: 13, fontWeight: on ? 700 : 500,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <WalletTypeIcon kind={t.icon} size={14} color={on ? TOKENS.orangeDeep : textMuted} />
                {t.l}
              </button>
            );
          })}
        </div>

        {/* Color */}
        <div style={{ fontFamily: FONT.thai, fontSize: 13, color: textInk, fontWeight: 600, margin: '14px 0 8px' }}>สี</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {WALLET_COLORS.map(c => {
            const on = color === c;
            return (
              <button key={c} onClick={() => setColor(c)} aria-label={`color ${c}`} style={{
                width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: c, padding: 0,
                boxShadow: on ? `0 0 0 2px ${surface}, 0 0 0 4px ${c}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                {on && (
                  <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 7l3 3 7-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                )}
              </button>
            );
          })}
        </div>

        {/* Action */}
        <button onClick={canAdd ? onClose : undefined} disabled={!canAdd} style={{
          marginTop: 18, width: '100%', height: 48, borderRadius: 999, border: 'none',
          background: canAdd ? TOKENS.orange : TOKENS.orangeSoft,
          color: '#fff', fontFamily: FONT.thai, fontSize: 15.5, fontWeight: 700,
          cursor: canAdd ? 'pointer' : 'default',
          boxShadow: canAdd ? SHADOWS.fab : 'none',
          opacity: canAdd ? 1 : 0.85,
        }}>
          เพิ่ม
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { ManageWalletsScreen, AddWalletModal });
