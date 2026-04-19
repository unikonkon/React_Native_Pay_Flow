// Dashboard (รายการ) — matches screenshot layout

function Dashboard({ dark = false, onOpenAdd, onOpenCategory, wallet, setWallet, range, setRange }) {
  const [expanded, setExpanded] = React.useState({});
  const [openWallet, setOpenWallet] = React.useState(false);
  const [openSwipeId, setOpenSwipeId] = React.useState(null);
  const [deleted, setDeleted] = React.useState({});
  const [toast, setToast] = React.useState(null);
  const handleDuplicate = (item) => {
    setToast({ kind: 'dup', text: `ทำสำเนา ${item.title} แล้ว` });
    setTimeout(() => setToast(null), 1800);
  };
  const handleDelete = (item) => {
    setDeleted(d => ({ ...d, [item.id + (item.sub ? '-' + item.subIndex : '')]: true }));
    setToast({ kind: 'del', text: `ลบรายการ ${item.title} แล้ว` });
    setTimeout(() => setToast(null), 1800);
  };
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const surface = dark ? TOKENS.darkSurface : '#FFFFFF';
  const hairline = dark ? TOKENS.darkHairline : TOKENS.hairline;

  return (
    <div style={{ height: '100%', paddingTop: 54, paddingBottom: 82, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '8px 18px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img src="assets/mascot-run.png" style={{ width: 44, height: 34, objectFit: 'contain' }} />
        </div>
        <div style={{ fontFamily: FONT.thai, fontSize: 22, fontWeight: 700, color: textInk, letterSpacing: -0.2 }}>รายการ</div>
        <div style={{ flex: 1 }} />
        <button style={{
          width: 34, height: 34, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18"><g fill="none" stroke={textMuted} strokeWidth="1.6" strokeLinecap="round"><circle cx="8" cy="8" r="5.5"/><path d="M12.5 12.5L16 16"/></g></svg>
        </button>
      </div>

      {/* Wallet + date range pickers */}
      <div style={{ padding: '4px 18px 14px', display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        <button onClick={() => setOpenWallet(o => !o)} style={{
          height: 34, padding: '0 12px', borderRadius: 999, background: surface,
          border: `0.5px solid ${hairline}`, fontFamily: FONT.mix, fontSize: 13.5,
          fontWeight: 500, color: textInk, display: 'inline-flex', alignItems: 'center', gap: 6,
          cursor: 'pointer', boxShadow: '0 1px 2px rgba(42,35,32,0.04)', flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={TOKENS.orange} strokeWidth="1.6"><rect x="1.5" y="3" width="11" height="8" rx="1.5"/><circle cx="10" cy="7" r="0.9" fill={TOKENS.orange}/></svg>
          {WALLETS.find(w => w.id === wallet)?.label}
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 3.5L5 6.5 8 3.5" stroke={textMuted} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <div style={{ flex: 1 }}>
          <DateRangeBar range={range} setRange={setRange} dark={dark} />
        </div>

        {openWallet && (
          <div style={{
            position: 'absolute', top: 42, left: 18, zIndex: 20, minWidth: 170,
            background: surface, borderRadius: 16, padding: 6,
            border: `0.5px solid ${hairline}`,
            boxShadow: SHADOWS.cardHover,
          }}>
            {WALLETS.map(w => (
              <button key={w.id} onClick={() => { setWallet(w.id); setOpenWallet(false); }} style={{
                display: 'flex', alignItems: 'center', width: '100%', padding: '9px 10px',
                background: wallet === w.id ? (dark ? TOKENS.darkElev : TOKENS.orangeTint) : 'transparent',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                fontFamily: FONT.mix, fontSize: 14, color: textInk, textAlign: 'left',
              }}>{w.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* Summary 3-column */}
      <div style={{ padding: '0 18px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, position: 'relative' }}>
        <KintsugiCrack style={{ top: -4, right: -10, opacity: 0.18 }} />
        <SummaryCol label="รายรับ" amount={TOTALS.income}  color={TOKENS.income}  dark={dark} />
        <SummaryCol label="รายจ่าย" amount={TOTALS.expense} color={TOKENS.expense} dark={dark} />
        <SummaryCol label="คงเหลือ" amount={TOTALS.balance} color={TOKENS.income}  dark={dark} showSparkle />
      </div>

      {/* Frequent items */}
      <div style={{ padding: '0 0 6px' }}>
        <div style={{ fontFamily: FONT.thai, fontSize: 13, color: textMuted, padding: '0 18px 8px', fontWeight: 500 }}>
          รายการใช้บ่อย
        </div>
        <div style={{ display: 'flex', gap: 14, padding: '0 18px 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {FREQUENT.map((f, i) => {
            const cat = CATEGORIES[f.cat];
            return (
              <div key={i} onClick={onOpenAdd} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer' }}>
                <CatIcon kind={cat.icon} bg={cat.bg} size={52} />
                <div style={{ fontFamily: FONT.thai, fontSize: 12, color: textInk, fontWeight: 500 }}>{cat.label}</div>
                <div style={{ fontFamily: FONT.num, fontSize: 12, color: textMuted, fontVariantNumeric: 'tabular-nums', marginTop: -4 }}>{f.amount}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transactions list */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
        {TRANSACTIONS.map(group => (
          <div key={group.date}>
            <DayHeader group={group} dark={dark} />
            {group.items.map(item => (
              !deleted[item.id] && <TxRow
                key={item.id} item={item} dark={dark}
                expanded={!!expanded[item.id]}
                onToggle={() => item.subs && setExpanded(e => ({ ...e, [item.id]: !e[item.id] }))}
                openId={openSwipeId} setOpenId={setOpenSwipeId}
                onDuplicate={handleDuplicate} onDelete={handleDelete}
              />
            ))}
          </div>
        ))}
      </div>

      {toast && (
        <div style={{
          position: 'absolute', bottom: 98, left: '50%', transform: 'translateX(-50%)',
          background: toast.kind === 'del' ? '#D14F3F' : '#3B7AE0', color: '#fff',
          padding: '10px 18px', borderRadius: 999,
          fontFamily: FONT.thai, fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(42,35,32,0.2)', zIndex: 50,
          animation: 'fade 200ms',
        }}>{toast.text}</div>
      )}
    </div>
  );
}

function SummaryCol({ label, amount, color, dark, showSparkle }) {
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  return (
    <div style={{ textAlign: 'center', position: 'relative' }}>
      <div style={{ fontFamily: FONT.thai, fontSize: 13, color: textMuted, fontWeight: 500, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{
        fontFamily: FONT.num, fontSize: 22, fontWeight: 800, color,
        fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3,
      }}>
        {fmtNum(amount)}
        {showSparkle && <span style={{ position: 'absolute', top: 18, right: 8 }}><Sparkle size={8} /></span>}
      </div>
    </div>
  );
}

function DayHeader({ group, dark }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const hairline = dark ? TOKENS.darkHairline : TOKENS.hairline;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 18px 6px', borderTop: `0.5px solid ${hairline}`,
      marginTop: 8,
    }}>
      <div style={{ fontFamily: FONT.thai, fontSize: 13, fontWeight: 600, color: textInk, fontVariantNumeric: 'tabular-nums' }}>
        {group.date}
      </div>
      <div style={{ flex: 1 }} />
      {group.income > 0 && (
        <div style={{ fontFamily: FONT.num, fontSize: 12, color: TOKENS.income, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          +{fmtNum(group.income)}
        </div>
      )}
      {group.expense > 0 && (
        <div style={{ fontFamily: FONT.num, fontSize: 12, color: TOKENS.expense, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          −{fmtNum(group.expense)}
        </div>
      )}
    </div>
  );
}

// Swipe-to-reveal wrapper. Shows two action buttons (duplicate blue + delete red)
// when user drags the row left. Tap elsewhere or drag back right to close.
function SwipeRow({ children, onDuplicate, onDelete, openId, setOpenId, id, height, radius = 18, margin = '6px 14px' }) {
  const ACTION_W = 64;
  const REVEAL = ACTION_W * 2 + 8; // two buttons + small gap
  const [drag, setDrag] = React.useState(0);
  const startX = React.useRef(0);
  const startY = React.useRef(0);
  const dragging = React.useRef(false);
  const locked = React.useRef(false); // horizontal intent confirmed
  const isOpen = openId === id;

  React.useEffect(() => {
    if (!isOpen) setDrag(0);
  }, [isOpen]);

  const onDown = (clientX, clientY) => {
    startX.current = clientX;
    startY.current = clientY;
    dragging.current = true;
    locked.current = false;
  };
  const onMove = (clientX, clientY, e) => {
    if (!dragging.current) return;
    const dx = clientX - startX.current;
    const dy = clientY - startY.current;
    if (!locked.current) {
      if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) locked.current = true;
      else if (Math.abs(dy) > 10) { dragging.current = false; return; }
      else return;
    }
    const base = isOpen ? -REVEAL : 0;
    let next = base + dx;
    if (next > 0) next = 0;
    if (next < -REVEAL - 20) next = -REVEAL - 20;
    if (e && e.cancelable) e.preventDefault();
    setDrag(next);
  };
  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (!locked.current) return;
    if (drag < -REVEAL / 2) { setDrag(-REVEAL); setOpenId(id); }
    else { setDrag(0); setOpenId(null); }
  };

  return (
    <div style={{ position: 'relative', margin, height, marginBottom: 6, marginTop: 6 }}>
      {/* Action buttons behind */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, right: 0,
        display: 'flex', gap: 4, alignItems: 'stretch',
        paddingLeft: 4,
      }}>
        <button onClick={(e) => { e.stopPropagation(); onDuplicate?.(); setOpenId(null); }} style={{
          width: ACTION_W, border: 'none', cursor: 'pointer',
          background: '#3B7AE0', borderRadius: radius,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 2px rgba(42,35,32,0.08)',
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="5" width="11" height="11" rx="2"/>
            <path d="M3 13V4a1 1 0 011-1h9"/>
          </svg>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete?.(); setOpenId(null); }} style={{
          width: ACTION_W, border: 'none', cursor: 'pointer',
          background: '#D14F3F', borderRadius: radius,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 2px rgba(42,35,32,0.08)',
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h12M8 6V4h4v2M6 6l1 11h6l1-11"/>
          </svg>
        </button>
      </div>

      {/* Draggable foreground */}
      <div
        style={{
          transform: `translateX(${drag}px)`,
          transition: dragging.current ? 'none' : 'transform 260ms cubic-bezier(0.2,0.8,0.2,1)',
          willChange: 'transform',
          touchAction: 'pan-y',
        }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); onDown(e.clientX, e.clientY); }}
        onPointerMove={(e) => onMove(e.clientX, e.clientY, e)}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {children}
      </div>
    </div>
  );
}

function TxRow({ item, expanded, onToggle, dark, openId, setOpenId, onDuplicate, onDelete }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const surface = dark ? TOKENS.darkSurface : '#FFFFFF';
  const amountColor = item.amount >= 0 ? TOKENS.income : TOKENS.expense;
  const cat = CATEGORIES[item.cat];

  return (
    <div>
      <SwipeRow
        id={`row-${item.id}`} openId={openId} setOpenId={setOpenId}
        onDuplicate={() => onDuplicate?.(item)} onDelete={() => onDelete?.(item)}
      >
        <div onClick={(e) => {
          if (openId === `row-${item.id}`) { setOpenId(null); return; }
          if (item.subs) onToggle?.();
        }} style={{
          padding: '12px 14px',
          background: surface, borderRadius: 18, boxShadow: SHADOWS.card,
          display: 'flex', alignItems: 'center', gap: 12, cursor: item.subs ? 'pointer' : 'default',
          userSelect: 'none',
        }}>
          <CatIcon kind={cat.icon} bg={cat.bg} size={42} dark={dark} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <div style={{ fontFamily: FONT.thai, fontSize: 15, fontWeight: 600, color: textInk }}>
                {item.title}
              </div>
              {item.count && (
                <div style={{
                  fontFamily: FONT.num, fontSize: 11, fontWeight: 600,
                  color: TOKENS.expense, background: TOKENS.expenseSoft,
                  padding: '1px 6px', borderRadius: 999,
                }}>×{item.count}</div>
              )}
            </div>
            {item.note && (
              <div style={{ fontFamily: FONT.thai, fontSize: 12, color: textMuted, marginTop: 1 }}>
                {item.note}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <div style={{
              fontFamily: FONT.num, fontSize: 15, fontWeight: 700, color: amountColor,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {item.amount >= 0 ? '+' : '−'}{fmtNum(item.amount)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ fontFamily: FONT.num, fontSize: 11, color: textMuted, fontVariantNumeric: 'tabular-nums' }}>
                {item.time}
              </div>
              {item.subs && (
                <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>
                  <path d="M2 3.5L5 6.5 8 3.5" stroke={textMuted} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
        </div>
      </SwipeRow>

      {expanded && item.subs && (
        <div style={{ margin: '0 14px 8px' }}>
          {item.subs.map((s, i) => (
            <SwipeRow
              key={i}
              id={`sub-${item.id}-${i}`} openId={openId} setOpenId={setOpenId}
              radius={12}
              margin="2px 0 2px 58px"
              onDuplicate={() => onDuplicate?.({ ...item, amount: s.amount, time: s.time, note: s.note, sub: true })}
              onDelete={() => onDelete?.({ ...item, amount: s.amount, time: s.time, note: s.note, sub: true, subIndex: i })}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                background: dark ? 'transparent' : 'transparent',
                fontFamily: FONT.mix, fontSize: 13,
                borderBottom: i < item.subs.length - 1 ? `0.5px solid ${dark ? TOKENS.darkHairline : TOKENS.hairline}` : 'none',
                userSelect: 'none',
              }}>
                <div style={{ color: textMuted, fontFamily: FONT.thai }}>—</div>
                <div style={{ color: textInk, flex: 1, fontFamily: FONT.thai }}>{s.note}</div>
                <div style={{ color: TOKENS.expense, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  −{fmtNum(s.amount)}
                </div>
                <div style={{ color: textMuted, fontSize: 11, width: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{s.time}</div>
              </div>
            </SwipeRow>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Dashboard });
