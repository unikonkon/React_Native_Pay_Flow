// Splash + Empty state + Add modal (3-tab: แนะนำ / เลือก / ตั้งค่า) + Category picker

function SplashScreen({ dark, onStart }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  return (
    <div style={{
      height: '100%', background: dark ? TOKENS.darkBg : TOKENS.paper,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      paddingTop: 54, paddingBottom: 32, position: 'relative', overflow: 'hidden',
    }}>
      <svg width="100%" height="100%" viewBox="0 0 393 600" style={{ position: 'absolute', top: 100, left: 0, opacity: 0.5, pointerEvents: 'none' }}>
        <g stroke={TOKENS.gold} fill="none" strokeLinecap="round">
          <path d="M196 50 L220 120 L180 200 L240 280 L160 360 L220 440" strokeWidth="1.4"/>
          <path d="M220 120 L270 140 M240 280 L290 250 M220 440 L280 460" strokeWidth="1"/>
          <path d="M180 200 L110 220 M160 360 L90 340" strokeWidth="1"/>
        </g>
      </svg>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2, width: '100%' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: -40, borderRadius: '50%', background: `radial-gradient(circle, ${TOKENS.cosmicSoft}88 0%, transparent 70%)`, filter: 'blur(20px)' }} />
          <img src="assets/mascot-cosmic.png" style={{ position: 'relative', width: 340, height: 230, objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(107,74,158,0.25))' }} />
          <div style={{ position: 'absolute', top: 30, left: 20 }}><Sparkle size={14} /></div>
          <div style={{ position: 'absolute', top: 10, right: 60 }}><Sparkle size={10} /></div>
          <div style={{ position: 'absolute', bottom: 40, right: 10 }}><Sparkle size={12} color={TOKENS.cosmic} /></div>
        </div>
      </div>
      <div style={{ padding: '0 32px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <div style={{ fontFamily: FONT.thai, fontSize: 40, fontWeight: 800, color: textInk, letterSpacing: -0.8, lineHeight: 1 }}>แมวมันนี่</div>
        <div style={{ fontFamily: FONT.thai, fontSize: 15, color: textMuted, marginTop: 12 }}>
          บันทึกรายรับรายจ่ายกับมิว <PawPrint size={13} color={TOKENS.orange} />
        </div>
        <button onClick={onStart} style={{
          marginTop: 32, height: 54, width: '100%', borderRadius: 999, border: 'none',
          background: TOKENS.orange, color: '#fff', fontFamily: FONT.thai, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: SHADOWS.fab,
        }}>เริ่มต้นใช้งานฟรี</button>
        <div style={{ marginTop: 14, fontFamily: FONT.thai, fontSize: 12, color: textMuted }}>
          มีบัญชีอยู่แล้ว? <span style={{ color: TOKENS.orange, fontWeight: 600 }}>เข้าสู่ระบบ</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ dark, onAdd }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  return (
    <div style={{ height: '100%', padding: '54px 24px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <img src="assets/mascot-run.png" style={{ width: 220, height: 150, objectFit: 'contain', marginBottom: 12 }} />
      <div style={{ fontFamily: FONT.thai, fontSize: 22, fontWeight: 700, color: textInk }}>ยังไม่มีรายการ</div>
      <div style={{ fontFamily: FONT.thai, fontSize: 14, color: textMuted, marginTop: 8, maxWidth: 260 }}>
        เริ่มบันทึกรายการแรกกับมิวกันเถอะ <PawPrint size={13} color={TOKENS.orange} />
      </div>
      <button onClick={onAdd} style={{
        marginTop: 24, height: 48, padding: '0 28px', borderRadius: 999, border: 'none',
        background: TOKENS.orange, color: '#fff', fontFamily: FONT.thai, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: SHADOWS.fab,
      }}>+ เพิ่มรายการแรก</button>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Add Transaction Modal — original design (88% sheet + calculator keypad)
// ───────────────────────────────────────────────────────────────

function AddTransactionModal({ open, onClose, dark }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const surface = dark ? TOKENS.darkSurface : '#fff';
  const hairline = dark ? TOKENS.darkHairline : TOKENS.hairline;

  const [mode, setMode] = React.useState('expense');
  const [amount, setAmount] = React.useState('0');
  const [cat, setCat] = React.useState('food');
  const [note, setNote] = React.useState('');
  const [showPicker, setShowPicker] = React.useState(false);
  const [showConfig, setShowConfig] = React.useState(false);
  const [showAllFreq, setShowAllFreq] = React.useState(false);

  // Persisted layout preferences for the ตั้งค่า overlay
  const [cfg, setCfg] = React.useState({
    pickCols: 6, pickRows: 3,
    favCatCols: 5, favCatRows: 1,
    favItemCols: 4, favItemRows: 4,
    defaultTab: 'favor',
    enabled: Object.fromEntries(Object.keys(CATEGORIES).map(k => [k, true])),
    custom: [],
  });

  if (!open) return null;

  const amountColor = mode === 'expense' ? TOKENS.expense : TOKENS.income;

  const handleKey = (k) => {
    if (k === 'C') return setAmount('0');
    if (k === '⌫') return setAmount(a => a.length <= 1 ? '0' : a.slice(0, -1));
    if (k === '.' && amount.includes('.')) return;
    if ('÷×−+='.includes(k)) return;
    if (k === '00') return setAmount(a => a === '0' ? '0' : a + '00');
    setAmount(a => (a === '0' && k !== '.') ? k : a + k);
  };

  const quickCats = ['food', 'drink', 'transport', 'coffee', 'shopping', 'other'];

  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(42,35,32,0.45)', zIndex: 200, animation: 'fade 200ms' }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '82%',
        background: surface, borderRadius: '28px 28px 0 0', zIndex: 201,
        boxShadow: SHADOWS.sheet, animation: 'slideUp 300ms cubic-bezier(0.2,0.8,0.2,1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* handle */}
        <div style={{ padding: '8px 0 4px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: dark ? TOKENS.darkMuted : '#D0C6BA', opacity: 0.6 }} />
        </div>

        {/* settings (left) + expense/income pill toggle + close (right) */}
        <div style={{ padding: '6px 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setShowConfig(true)} aria-label="ตั้งค่า" style={{
            width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: dark ? TOKENS.darkElev : TOKENS.paperDeep,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {/* adjustments / sliders icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <g stroke={textInk} strokeWidth="1.6" strokeLinecap="round">
                <path d="M3 5h8M14 5h1"/>
                <path d="M3 9h3M9 9h6"/>
                <path d="M3 13h8M14 13h1"/>
              </g>
              <g fill={dark ? TOKENS.darkElev : TOKENS.paperDeep} stroke={textInk} strokeWidth="1.6">
                <circle cx="12.5" cy="5" r="1.6"/>
                <circle cx="7.5" cy="9" r="1.6"/>
                <circle cx="12.5" cy="13" r="1.6"/>
              </g>
            </svg>
          </button>
          <div style={{ flex: 1, display: 'flex', padding: 3, background: dark ? TOKENS.darkElev : TOKENS.paperDeep, borderRadius: 999 }}>
            {[{ k: 'expense', l: 'รายจ่าย' }, { k: 'income', l: 'รายรับ' }].map(t => (
              <button key={t.k} onClick={() => setMode(t.k)} style={{
                flex: 1, padding: '7px 10px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: mode === t.k ? (t.k === 'expense' ? TOKENS.expense : TOKENS.income) : 'transparent',
                fontFamily: FONT.thai, fontSize: 14, fontWeight: 600,
                color: mode === t.k ? '#fff' : textMuted,
              }}>{t.l}</button>
            ))}
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: dark ? TOKENS.darkElev : TOKENS.paperDeep,
            flexShrink: 0,
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2l8 8M10 2l-8 8" stroke={textInk} strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* amount display */}
        <div style={{ padding: '14px 24px 10px', textAlign: 'center' }}>
          <div style={{ fontFamily: FONT.thai, fontSize: 11, color: textMuted, marginBottom: 2 }}>จำนวนเงิน</div>
          <div style={{
            fontFamily: FONT.num, fontSize: 36, fontWeight: 800, color: amountColor,
            fontVariantNumeric: 'tabular-nums', letterSpacing: -0.8, lineHeight: 1,
          }}>
            {mode === 'expense' ? '−' : '+'}{Number(amount).toLocaleString('en-US')}
            <span style={{ fontSize: 18, fontWeight: 500, marginLeft: 6, color: textMuted }}>฿</span>
          </div>
        </div>

        {/* category quick row */}
        <div style={{ padding: '0 18px 8px' }}>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {quickCats.map(c => {
              const ct = CATEGORIES[c];
              const sel = cat === c;
              return (
                <button key={c} onClick={() => setCat(c)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, padding: 2,
                }}>
                  <div style={{ transform: sel ? 'scale(1.05)' : 'scale(1)', transition: 'transform 200ms' }}>
                    <div style={{ padding: sel ? 2 : 0, borderRadius: '50%', border: sel ? `2px solid ${TOKENS.orange}` : '2px solid transparent' }}>
                      <CatIcon kind={ct.icon} bg={ct.bg} size={46} />
                    </div>
                  </div>
                  <div style={{ fontFamily: FONT.thai, fontSize: 11, color: sel ? textInk : textMuted, fontWeight: sel ? 600 : 500 }}>
                    {ct.label}
                  </div>
                </button>
              );
            })}
            <button onClick={() => setShowPicker(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, color: TOKENS.orange,
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%',
                border: `1.5px dashed ${TOKENS.orange}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 3v12M3 9h12" stroke={TOKENS.orange} strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <div style={{ fontFamily: FONT.thai, fontSize: 11, fontWeight: 600 }}>เลือกเพิ่ม</div>
            </button>
          </div>
        </div>

        {/* Frequently used — quick-fill pills */}
        <div style={{ padding: '4px 18px 10px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 8,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: FONT.thai, fontSize: 12, fontWeight: 600, color: textMuted,
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1.5l1.4 2.8 3.1.5-2.2 2.2.5 3.1L6 8.6 3.2 10.1l.5-3.1L1.5 4.8l3.1-.5L6 1.5z" stroke={TOKENS.orange} strokeWidth="1.2" strokeLinejoin="round" fill={TOKENS.orange} fillOpacity="0.15"/>
              </svg>
              รายการที่ใช้บ่อย
            </div>
            <button onClick={() => setShowAllFreq(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: FONT.thai, fontSize: 11.5, color: TOKENS.orange, fontWeight: 600,
              padding: 0,
            }}>ดูทั้งหมด</button>
          </div>
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2,
          }}>
            {[
              { cat: 'food',      note: 'ข้าวเที่ยง',   amount: 80 },
              { cat: 'coffee',    note: 'ลาเต้',         amount: 65 },
              { cat: 'transport', note: 'วินมอไซค์',    amount: 30 },
              { cat: 'food',      note: 'ส้มตำ',         amount: 60 },
              { cat: 'drink',     note: 'ชานมไข่มุก',   amount: 55 },
              { cat: 'fuel',      note: 'เติมน้ำมัน',   amount: 300 },
            ].map((f, i) => {
              const c = CATEGORIES[f.cat];
              return (
                <button key={i} onClick={() => { setCat(f.cat); setAmount(String(f.amount)); setNote(f.note); }} style={{
                  flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px 6px 6px', borderRadius: 999,
                  background: dark ? TOKENS.darkElev : '#fff',
                  border: `1px solid ${hairline}`,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(42,35,32,0.04)',
                }}>
                  <CatIcon kind={c.icon} bg={c.bg} size={26} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                    <div style={{ fontFamily: FONT.thai, fontSize: 11.5, color: textInk, fontWeight: 500, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.note}
                    </div>
                    <div style={{ fontFamily: FONT.num, fontSize: 12.5, color: TOKENS.expense, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                      −{f.amount}฿
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date + wallet chips row */}
        <div style={{ padding: '4px 16px 8px', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
          <button style={{
            background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 2px',
            fontFamily: FONT.mix, fontSize: 14, fontWeight: 500, color: textInk,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><g stroke={textInk} strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3.5" width="12" height="10.5" rx="1.6"/><path d="M2 7h12M5.5 2v3M10.5 2v3"/></g></svg>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>19 เม.ย.</span>
          </button>
          {[
            { id: 'cash2', label: 'เงินสด (2)', sel: true },
            { id: 'cash',  label: 'เงินสด' },
            { id: 'debit', label: 'เดบิต' },
          ].map(w => (
            <button key={w.id} style={{
              height: 30, padding: '0 12px', borderRadius: 999, cursor: 'pointer', flexShrink: 0,
              background: 'transparent',
              border: w.sel ? `1.5px solid ${TOKENS.orange}` : `1px solid ${hairline}`,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: FONT.thai, fontSize: 13, fontWeight: 600,
              color: w.sel ? TOKENS.orange : textInk,
            }}>
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: TOKENS.income, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="9" height="9" viewBox="0 0 9 9"><circle cx="4.5" cy="4.5" r="2" stroke="#fff" strokeWidth="1.2" fill="none"/></svg>
              </span>
              {w.label}
            </button>
          ))}
        </div>

        {/* Note input + inline amount */}
        <div style={{ padding: '0 14px 10px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: dark ? TOKENS.darkElev : '#fff', borderRadius: 14,
            border: `1px solid ${hairline}`,
            padding: '10px 14px',
            boxShadow: '0 1px 2px rgba(42,35,32,0.03)',
          }}>
            <input
              value={note} onChange={e => setNote(e.target.value)} placeholder="บันทึก..."
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontFamily: FONT.thai, fontSize: 15, color: textInk,
              }}
            />
            <div style={{
              fontFamily: FONT.num, fontSize: 22, fontWeight: 800, color: amountColor,
              fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3,
            }}>
              ฿{Number(amount).toLocaleString('en-US')}
            </div>
          </div>
        </div>

        {/* Keypad grid — C ÷ × ⌫ / 7 8 9 − / 4 5 6 + / 1 2 3 = / 00 0 [บันทึก span 2] */}
        <div style={{
          flex: 1, padding: '6px 14px 18px',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
          background: dark ? TOKENS.darkBg : TOKENS.paper,
        }}>
          {/* Row 1 — muted ops */}
          <KeyBtn k="C"   variant="muted" onPress={handleKey} textMuted={textMuted} dark={dark} />
          <KeyBtn k="÷"   variant="muted" onPress={handleKey} textMuted={textMuted} dark={dark} />
          <KeyBtn k="×"   variant="muted" onPress={handleKey} textMuted={textMuted} dark={dark} />
          <KeyBtn k="⌫"   variant="muted" onPress={handleKey} textMuted={textMuted} dark={dark} />
          {/* Row 2 */}
          <KeyBtn k="7" variant="num" onPress={handleKey} textInk={textInk} dark={dark} />
          <KeyBtn k="8" variant="num" onPress={handleKey} textInk={textInk} dark={dark} />
          <KeyBtn k="9" variant="num" onPress={handleKey} textInk={textInk} dark={dark} />
          <KeyBtn k="−" variant="muted" onPress={handleKey} textMuted={textMuted} dark={dark} />
          {/* Row 3 */}
          <KeyBtn k="4" variant="num" onPress={handleKey} textInk={textInk} dark={dark} />
          <KeyBtn k="5" variant="num" onPress={handleKey} textInk={textInk} dark={dark} />
          <KeyBtn k="6" variant="num" onPress={handleKey} textInk={textInk} dark={dark} />
          <KeyBtn k="+" variant="muted" onPress={handleKey} textMuted={textMuted} dark={dark} />
          {/* Row 4 */}
          <KeyBtn k="1" variant="num" onPress={handleKey} textInk={textInk} dark={dark} />
          <KeyBtn k="2" variant="num" onPress={handleKey} textInk={textInk} dark={dark} />
          <KeyBtn k="3" variant="num" onPress={handleKey} textInk={textInk} dark={dark} />
          <KeyBtn k="=" variant="muted" onPress={handleKey} textMuted={textMuted} dark={dark} />
          {/* Row 5 */}
          <KeyBtn k="00" variant="num" onPress={handleKey} textInk={textInk} dark={dark} />
          <KeyBtn k="0"  variant="num" onPress={handleKey} textInk={textInk} dark={dark} />
          <button onClick={onClose} style={{
            gridColumn: 'span 2',
            height: 46, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: TOKENS.orange,
            color: '#fff',
            fontFamily: FONT.thai, fontSize: 16, fontWeight: 700,
            boxShadow: '0 4px 12px rgba(232,122,61,0.3)',
          }}>บันทึก</button>
        </div>
      </div>

      {showPicker && (
        <CategoryPickerSheet onClose={() => setShowPicker(false)} onPick={(c) => { setCat(c); setShowPicker(false); }} dark={dark} />
      )}

      {showConfig && (
        <ConfigModal cfg={cfg} setCfg={setCfg} onClose={() => setShowConfig(false)} dark={dark} mode={mode} />
      )}

      {showAllFreq && (
        <FrequentAllModal
          onClose={() => setShowAllFreq(false)}
          onPick={(f) => { setCat(f.cat); setAmount(String(f.amount)); setNote(f.note); setMode(f.mode || 'expense'); setShowAllFreq(false); }}
          dark={dark}
        />
      )}
    </>
  );
}

function KeyBtn({ k, variant, onPress, textInk, textMuted, dark }) {
  const isNum = variant === 'num';
  const content = k === '⌫'
    ? <svg width="20" height="16" viewBox="0 0 22 18" fill="none"><path d="M7 1h13a2 2 0 012 2v12a2 2 0 01-2 2H7l-6-8z" stroke={textMuted} strokeWidth="1.6" strokeLinejoin="round"/><path d="M10 6l6 6M16 6l-6 6" stroke={textMuted} strokeWidth="1.6" strokeLinecap="round"/></svg>
    : k;
  return (
    <button onClick={() => onPress(k)} style={{
      height: 46, borderRadius: 12, border: 'none', cursor: 'pointer',
      background: isNum ? (dark ? TOKENS.darkElev : '#fff') : (dark ? '#1f1a17' : TOKENS.paperDeep),
      color: isNum ? textInk : textMuted,
      fontFamily: FONT.num, fontSize: 20, fontWeight: 500,
      fontVariantNumeric: 'tabular-nums',
      boxShadow: isNum ? '0 1px 2px rgba(42,35,32,0.05)' : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{content}</button>
  );
}

function MetaRow({ icon, label, value, placeholder, flex, dark }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const surface = dark ? TOKENS.darkElev : '#fff';
  const p = { fill: 'none', stroke: TOKENS.orangeDeep, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const icons = {
    note: <svg width="14" height="14" viewBox="0 0 14 14"><g {...p}><path d="M3 2h6l3 3v7H3z"/><path d="M5 7h4M5 9h4"/></g></svg>,
    date: <svg width="14" height="14" viewBox="0 0 14 14"><g {...p}><rect x="2" y="3" width="10" height="9" rx="1"/><path d="M2 6h10M5 2v2M9 2v2"/></g></svg>,
    wallet: <svg width="14" height="14" viewBox="0 0 14 14"><g {...p}><rect x="2" y="3" width="10" height="8" rx="1"/><path d="M2 5h10"/><circle cx="9" cy="8" r="0.8" fill={TOKENS.orangeDeep}/></g></svg>,
  };
  return (
    <div style={{
      flex: flex ? 1 : undefined,
      background: surface, borderRadius: 14, padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 1px 2px rgba(42,35,32,0.04)',
    }}>
      <div style={{ width: 26, height: 26, borderRadius: 8, background: TOKENS.orangeTint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icons[icon]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT.thai, fontSize: 10, color: textMuted, fontWeight: 500 }}>{label}</div>
        <div style={{ fontFamily: FONT.mix, fontSize: 13, color: placeholder ? textMuted : textInk, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function CategoryPickerSheet({ onClose, onPick, dark }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const surface = dark ? TOKENS.darkSurface : '#fff';
  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(42,35,32,0.55)', zIndex: 210 }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%',
        background: surface, borderRadius: '28px 28px 0 0', zIndex: 211,
        animation: 'slideUp 300ms cubic-bezier(0.2,0.8,0.2,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '8px 0 4px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: '#D0C6BA', opacity: 0.6 }} />
        </div>
        <div style={{ padding: '8px 20px 12px', display: 'flex', alignItems: 'center' }}>
          <div style={{ fontFamily: FONT.thai, fontSize: 19, fontWeight: 700, color: textInk }}>เลือกหมวดหมู่</div>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontFamily: FONT.thai, fontSize: 14, color: TOKENS.orange, fontWeight: 600, cursor: 'pointer' }}>เสร็จ</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, rowGap: 18 }}>
          {Object.entries(CATEGORIES).map(([k, c]) => (
            <button key={k} onClick={() => onPick(k)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            }}>
              <CatIcon kind={c.icon} bg={c.bg} size={56} />
              <div style={{ fontFamily: FONT.thai, fontSize: 11, color: textInk, fontWeight: 500, textAlign: 'center', lineHeight: 1.2 }}>{c.label}</div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// Icons available in the Add-Category icon picker (36 glyphs)
const ADD_CAT_ICONS = [
  'shopping','food','drink','transport','fuel','home','health','gift',
  'coffee','game','invest','other','education','pet','party','salary',
];
// Extra simple shapes rendered inline
const EXTRA_ICONS = ['wifi','phone','bag','shirt','medkit','dumbbell','ticket','controller',
  'laptop','people','heart','book','plane','shield','card','paw','briefcase','sparkle',
  'trend','camera','wallet','tag','star'];

function MiniGlyph({ kind, color = '#2A2320', size = 20 }) {
  const p = { stroke: color, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const pf = { fill: color };
  const svg = (children) => <svg width={size} height={size} viewBox="0 0 24 24">{children}</svg>;
  switch (kind) {
    case 'shopping': return svg(<g {...p}><path d="M6 8h12l-1 11a2 2 0 01-2 2H9a2 2 0 01-2-2z"/><path d="M9 8c0-2 1-4 3-4s3 2 3 4"/></g>);
    case 'food':     return svg(<g {...p}><path d="M5 11c0-4 3-7 7-7s7 3 7 7"/><path d="M4 11h16"/><path d="M6 14c1 3 4 5 6 5s5-2 6-5"/></g>);
    case 'drink':    return svg(<g {...p}><path d="M7 5h10l-1 12a3 3 0 01-3 3h-2a3 3 0 01-3-3z"/><path d="M8 9h8"/></g>);
    case 'transport':return svg(<g {...p}><path d="M6 15v-5l1.5-3h9L18 10v5"/><rect x="5" y="13" width="14" height="5" rx="1"/><circle cx="9" cy="18" r="1.2" {...pf}/><circle cx="15" cy="18" r="1.2" {...pf}/></g>);
    case 'fuel':     return svg(<g {...p}><rect x="5" y="5" width="9" height="14" rx="1"/><path d="M5 10h9"/><path d="M14 8l3 1.5v8a1 1 0 001 1v-10l-2-2"/></g>);
    case 'home':     return svg(<g {...p}><path d="M4 12l8-7 8 7"/><path d="M6 11v9h12v-9"/><rect x="10" y="14" width="4" height="6"/></g>);
    case 'health':   return svg(<g {...p}><path d="M12 20s-7-4-7-9a4 4 0 017-3 4 4 0 017 3c0 5-7 9-7 9z"/></g>);
    case 'gift':     return svg(<g {...p}><rect x="4" y="10" width="16" height="10" rx="1"/><path d="M12 10v10M3 10h18"/><path d="M12 10c-2-2-5 0-3 2M12 10c2-2 5 0 3 2"/></g>);
    case 'coffee':   return svg(<g {...p}><path d="M5 9h12v6a4 4 0 01-4 4H9a4 4 0 01-4-4z"/><path d="M17 11h2a2 2 0 010 4h-2"/><path d="M9 5c0 1-1 1-1 2M13 5c0 1-1 1-1 2"/></g>);
    case 'game':     return svg(<g {...p}><rect x="3" y="9" width="18" height="10" rx="3"/><path d="M8 12v4M6 14h4"/><circle cx="15" cy="13" r="1" {...pf}/><circle cx="17" cy="15" r="1" {...pf}/></g>);
    case 'invest':   return svg(<g {...p}><path d="M4 18l5-5 4 4 7-8"/><path d="M15 9h5v5"/></g>);
    case 'other':    return svg(<g {...p}><circle cx="7" cy="12" r="1.3" {...pf}/><circle cx="12" cy="12" r="1.3" {...pf}/><circle cx="17" cy="12" r="1.3" {...pf}/></g>);
    case 'education':return svg(<g {...p}><path d="M2 10l10-4 10 4-10 4z"/><path d="M7 12v4c0 1 2 2 5 2s5-1 5-2v-4"/></g>);
    case 'pet':      return svg(<g {...p}><circle cx="8" cy="8" r="1.5"/><circle cx="16" cy="8" r="1.5"/><circle cx="5" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/><path d="M8 18c0-3 2-4.5 4-4.5s4 1.5 4 4.5c0 1.5-1.5 2-4 2s-4-.5-4-2z"/></g>);
    case 'party':    return svg(<g {...p}><path d="M12 4v3M9 6l2 2M15 6l-2 2"/><path d="M7 19l5-9 5 9c0 1-2 1.5-5 1.5s-5-.5-5-1.5z"/></g>);
    case 'salary':   return svg(<g {...p}><rect x="4" y="8" width="16" height="10" rx="1.5"/><circle cx="12" cy="13" r="2.2"/><path d="M8 6h8v2"/></g>);
    case 'wifi':     return svg(<g {...p}><path d="M3 9c5-4 13-4 18 0M6 12c4-3 8-3 12 0M9 15c2-1.5 4-1.5 6 0"/><circle cx="12" cy="18" r="1.2" {...pf}/></g>);
    case 'phone':    return svg(<g {...p}><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/></g>);
    case 'bag':      return svg(<g {...p}><path d="M5 8h14l-1 12H6z"/><path d="M9 8c0-2 1-4 3-4s3 2 3 4"/><path d="M12 12v2"/></g>);
    case 'shirt':    return svg(<g {...p}><path d="M6 6l3-2h6l3 2 3 3-3 2v9H6v-9l-3-2z"/></g>);
    case 'medkit':   return svg(<g {...p}><rect x="4" y="8" width="16" height="12" rx="1.5"/><path d="M9 8V6h6v2"/><path d="M12 12v4M10 14h4"/></g>);
    case 'dumbbell': return svg(<g {...p}><path d="M3 10v4M5 8v8M19 8v8M21 10v4M5 12h14"/></g>);
    case 'ticket':   return svg(<g {...p}><path d="M3 9a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4z"/><path d="M10 8v8" strokeDasharray="1.5 1.5"/></g>);
    case 'controller': return svg(<g {...p}><path d="M5 9c-2 2-2 8 0 10 1 .5 2 0 3-1l2-2h4l2 2c1 1 2 1.5 3 1 2-2 2-8 0-10-1-1-3-1-4 0H9c-1-1-3-1-4 0z"/></g>);
    case 'laptop':   return svg(<g {...p}><rect x="4" y="6" width="16" height="10" rx="1.5"/><path d="M3 19h18"/></g>);
    case 'people':   return svg(<g {...p}><circle cx="8" cy="9" r="2.5"/><circle cx="16" cy="9" r="2.5"/><path d="M3 19c0-3 2-5 5-5s5 2 5 5M11 19c0-3 2-5 5-5s5 2 5 5"/></g>);
    case 'heart':    return svg(<g {...p}><path d="M12 20s-7-4-7-9a4 4 0 017-3 4 4 0 017 3c0 5-7 9-7 9z"/></g>);
    case 'book':     return svg(<g {...p}><path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z"/><path d="M5 17a3 3 0 013-3h11"/></g>);
    case 'plane':    return svg(<g {...p}><path d="M12 3l2 8 7 3-7 2-2 6-2-6-7-2 7-3z"/></g>);
    case 'shield':   return svg(<g {...p}><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></g>);
    case 'card':     return svg(<g {...p}><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M6 15h4"/></g>);
    case 'paw':      return svg(<g {...p}><circle cx="7" cy="9" r="1.6"/><circle cx="12" cy="7" r="1.6"/><circle cx="17" cy="9" r="1.6"/><circle cx="5" cy="14" r="1.4"/><circle cx="19" cy="14" r="1.4"/><path d="M8 18c0-2.5 2-4 4-4s4 1.5 4 4c0 1.5-1.5 2-4 2s-4-.5-4-2z"/></g>);
    case 'briefcase':return svg(<g {...p}><rect x="3" y="8" width="18" height="12" rx="1.5"/><path d="M9 8V6a1 1 0 011-1h4a1 1 0 011 1v2M3 13h18"/></g>);
    case 'sparkle':  return svg(<g {...p}><path d="M12 4l1.5 5 5 1.5-5 1.5L12 17l-1.5-5-5-1.5 5-1.5z"/></g>);
    case 'trend':    return svg(<g {...p}><path d="M3 17l6-6 4 4 7-8M14 7h6v6"/></g>);
    case 'camera':   return svg(<g {...p}><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-2h5L16 7"/></g>);
    case 'wallet':   return svg(<g {...p}><path d="M3 8a2 2 0 012-2h14v12a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><circle cx="17" cy="13" r="1.2" {...pf}/></g>);
    case 'tag':      return svg(<g {...p}><path d="M4 4h7l9 9-7 7-9-9z"/><circle cx="8" cy="8" r="1.2" {...pf}/></g>);
    case 'star':     return svg(<g {...p}><path d="M12 3l2.8 5.8L21 10l-4.5 4.4L17.5 21 12 18l-5.5 3 1-6.6L3 10l6.2-1.2z"/></g>);
    default:         return svg(<g {...p}><circle cx="12" cy="12" r="7"/></g>);
  }
}

const CAT_COLORS = ['#EF8A7D','#E9A24F','#F2C94C','#7FC86E','#4EB06A','#4BB8A8','#5AB4D2','#4D7BC9','#5A6AD8','#8A6ED9','#C07ADB','#D84C96','#D24B4B','#6F7A87'];

// Add Custom Category modal — stacked over ConfigModal
function AddCategoryModal({ mode, onClose, onAdd, dark }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const surface = dark ? TOKENS.darkSurface : '#fff';
  const hairline = dark ? TOKENS.darkHairline : TOKENS.hairline;
  const chipBg = dark ? TOKENS.darkElev : TOKENS.paperDeep;

  const ALL_ICONS = [...ADD_CAT_ICONS, ...EXTRA_ICONS];
  const [name, setName] = React.useState('');
  const [icon, setIcon] = React.useState('shopping');
  const [color, setColor] = React.useState(CAT_COLORS[0]);

  const canAdd = name.trim().length > 0;
  const title = mode === 'income' ? 'เพิ่มหมวดรายรับ' : 'เพิ่มหมวดรายจ่าย';

  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(42,35,32,0.45)', zIndex: 230 }} />
      <div style={{
        position: 'absolute', top: 44, bottom: 44, left: 20, right: 20,
        background: surface, borderRadius: 20, zIndex: 231,
        animation: 'popIn 220ms cubic-bezier(0.2,0.9,0.3,1.2)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(42,35,32,0.25)',
      }}>
        <div style={{ padding: '14px 18px 10px', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, fontFamily: FONT.thai, fontSize: 16, fontWeight: 700, color: textInk }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: textMuted }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 12px' }}>
          {/* Big preview */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 18px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 12px ${color}40`,
            }}>
              <MiniGlyph kind={icon} color="#fff" size={32} />
            </div>
          </div>

          {/* Name */}
          <div style={{ fontFamily: FONT.thai, fontSize: 13, color: textInk, fontWeight: 600, marginBottom: 6 }}>ชื่อ</div>
          <input
            value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อหมวดหมู่"
            style={{
              width: '100%', height: 38, padding: '0 12px', borderRadius: 10,
              border: `1px solid ${hairline}`, background: dark ? TOKENS.darkElev : '#fff',
              fontFamily: FONT.thai, fontSize: 14, color: textInk, outline: 'none', boxSizing: 'border-box',
              marginBottom: 16,
            }}
          />

          {/* Icon picker */}
          <div style={{ fontFamily: FONT.thai, fontSize: 13, color: textInk, fontWeight: 600, marginBottom: 8 }}>ไอคอน</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 16 }}>
            {ALL_ICONS.slice(0, 35).map(k => {
              const sel = icon === k;
              return (
                <button key={k} onClick={() => setIcon(k)} style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: sel ? color : chipBg,
                  border: sel ? `1.5px solid ${color}` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0,
                  boxShadow: sel ? `0 2px 6px ${color}55` : 'none',
                }}>
                  <MiniGlyph kind={k} color={sel ? '#fff' : textMuted} size={18} />
                </button>
              );
            })}
          </div>

          {/* Color picker */}
          <div style={{ fontFamily: FONT.thai, fontSize: 13, color: textInk, fontWeight: 600, marginBottom: 8 }}>สี</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8, marginBottom: 10 }}>
            {CAT_COLORS.map(col => {
              const sel = color === col;
              return (
                <button key={col} onClick={() => setColor(col)} style={{
                  width: 30, height: 30, borderRadius: '50%', background: col,
                  border: sel ? `2px solid ${col}` : 'none',
                  boxShadow: sel ? `0 0 0 2px #fff inset, 0 2px 4px ${col}55` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0,
                }}>
                  {sel && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-6" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom action */}
        <div style={{ padding: '10px 18px 16px', borderTop: `0.5px solid ${hairline}` }}>
          <button
            onClick={() => canAdd && onAdd({ name: name.trim(), icon, color })}
            disabled={!canAdd}
            style={{
              width: '100%', height: 44, borderRadius: 999, border: 'none',
              background: canAdd ? TOKENS.orange : '#F2D6C3',
              color: '#fff', fontFamily: FONT.thai, fontSize: 15, fontWeight: 700,
              cursor: canAdd ? 'pointer' : 'default',
              boxShadow: canAdd ? SHADOWS.fab : 'none',
              opacity: canAdd ? 1 : 0.7,
            }}>เพิ่ม</button>
        </div>
      </div>
    </>
  );
}

function ConfigModal({ cfg, setCfg, onClose, dark, mode = 'expense' }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const surface = dark ? TOKENS.darkSurface : '#fff';
  const hairline = dark ? TOKENS.darkHairline : TOKENS.hairline;

  const [seg, setSeg] = React.useState('cfg'); // 'hint' | 'pick' | 'cfg'
  const [showAdd, setShowAdd] = React.useState(false);

  // derived + handlers
  const toggleCat = (k) => setCfg(c => ({ ...c, enabled: { ...c.enabled, [k]: !c.enabled[k] } }));
  const removeCustom = (k) => setCfg(c => {
    const custom = (c.custom || []).filter(x => x.key !== k);
    const enabled = { ...c.enabled };
    delete enabled[k];
    return { ...c, custom, enabled };
  });
  const addCustom = (data) => setCfg(c => {
    const key = 'custom_' + Date.now();
    const custom = [...(c.custom || []), { key, ...data }];
    return { ...c, custom, enabled: { ...c.enabled, [key]: true } };
  });

  const builtIns = Object.entries(CATEGORIES);
  const customs = cfg.custom || [];

  // pill segmented tab
  const segTab = (k, label) => (
    <button key={k} onClick={() => setSeg(k)} style={{
      flex: 1, height: 36, borderRadius: 999, border: 'none', cursor: 'pointer',
      background: seg === k ? TOKENS.orange : 'transparent',
      color: seg === k ? '#fff' : textMuted,
      fontFamily: FONT.thai, fontSize: 13, fontWeight: 700,
    }}>{label}</button>
  );

  const stepper = (val, onChange, min, max) => (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <button onClick={() => onChange(Math.max(min, val - 1))} style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${hairline}`, background: '#fff', cursor: 'pointer', color: textInk, fontWeight: 600, fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
      <div style={{ fontFamily: FONT.num, fontSize: 14, fontWeight: 700, color: textInk, minWidth: 16, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{val}</div>
      <button onClick={() => onChange(Math.min(max, val + 1))} style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${hairline}`, background: '#fff', cursor: 'pointer', color: textInk, fontWeight: 600, fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
    </div>
  );

  const rows = [
    { label: 'หมวดหมู่ ในเมนูเลือก', c: 'pickCols',    r: 'pickRows',    minC: 3, maxC: 8, minR: 1, maxR: 8 },
    { label: 'หมวดใช้บ่อย',          c: 'favCatCols',  r: 'favCatRows',  minC: 2, maxC: 6, minR: 1, maxR: 3 },
    { label: 'รายการใช้บ่อย',        c: 'favItemCols', r: 'favItemRows', minC: 2, maxC: 6, minR: 1, maxR: 6 },
  ];

  // Helper: render a single cat cell (works for built-in, custom, or +)
  const renderCell = (opts) => {
    const { key, label, icon, bg, locked, removable, onClick, iconColor, type } = opts;
    if (type === 'add') {
      return (
        <button key="add" onClick={onClick} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: 0,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            border: `1.5px dashed ${TOKENS.orange}`, background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 3v12M3 9h12" stroke={TOKENS.orange} strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div style={{ fontFamily: FONT.thai, fontSize: 11, color: TOKENS.orange, fontWeight: 600, textAlign: 'center' }}>เพิ่ม</div>
        </button>
      );
    }
    return (
      <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          {icon
            ? <div style={{ width: 52, height: 52, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MiniGlyph kind={icon} color={iconColor || '#fff'} size={26} />
              </div>
            : <CatIcon kind={opts.catKind} bg={bg} size={52} />
          }
          {locked && (
            <div style={{
              position: 'absolute', top: -3, right: -3, width: 18, height: 18, borderRadius: '50%',
              background: '#fff', border: `1px solid ${hairline}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 2px rgba(42,35,32,0.1)',
            }}>
              <svg width="9" height="9" viewBox="0 0 10 10"><g fill="none" stroke={textMuted} strokeWidth="1.3" strokeLinecap="round"><rect x="2.5" y="4.5" width="5" height="4" rx="0.6"/><path d="M3.5 4.5V3.4a1.5 1.5 0 013 0v1.1"/></g></svg>
            </div>
          )}
          {removable && (
            <button onClick={onClick} style={{
              position: 'absolute', top: -3, right: -3, width: 18, height: 18, borderRadius: '50%',
              background: TOKENS.expense, border: 'none', cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(42,35,32,0.2)',
            }}>
              <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/></svg>
            </button>
          )}
        </div>
        <div style={{ fontFamily: FONT.thai, fontSize: 10.5, color: textInk, fontWeight: 500, textAlign: 'center', lineHeight: 1.15, maxWidth: 58, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </div>
      </div>
    );
  };

  // Built-ins are "locked" except the default set
  const UNLOCKED_KEYS = new Set(['food','drink','fuel','salary','transport','coffee','game','invest','other','shopping']);

  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(42,35,32,0.55)', zIndex: 220 }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '90%',
        background: surface, borderRadius: '28px 28px 0 0', zIndex: 221,
        animation: 'slideUp 300ms cubic-bezier(0.2,0.8,0.2,1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Handle */}
        <div style={{ padding: '8px 0 4px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: '#D0C6BA', opacity: 0.6 }} />
        </div>

        {/* Mode toggle + close (mirrors Add modal chrome) */}
        <div style={{ padding: '4px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', padding: 3, borderRadius: 999,
            background: dark ? TOKENS.darkElev : TOKENS.paperDeep,
          }}>
            {[
              { k: 'expense', l: '⊖ รายจ่าย', on: mode === 'expense' },
              { k: 'income',  l: '⊕ รายรับ',  on: mode === 'income' },
            ].map(t => (
              <div key={t.k} style={{
                padding: '7px 18px', borderRadius: 999,
                background: t.on ? (t.k === 'expense' ? '#E8857F' : '#82BE89') : 'transparent',
                color: t.on ? '#fff' : textMuted,
                fontFamily: FONT.thai, fontSize: 14, fontWeight: 700,
              }}>{t.l}</div>
            ))}
          </div>
          <button onClick={onClose} style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'transparent', color: textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Title */}
        <div style={{ padding: '6px 18px 10px' }}>
          <div style={{ fontFamily: FONT.thai, fontSize: 19, fontWeight: 700, color: textInk }}>ตั้งค่าหมวดหมู่</div>
        </div>

        {/* Segmented 3-tab */}
        <div style={{ padding: '0 18px 14px' }}>
          <div style={{
            display: 'flex', padding: 3, borderRadius: 999,
            background: dark ? TOKENS.darkElev : TOKENS.paperDeep,
          }}>
            {segTab('hint', 'แนะนำ')}
            {segTab('pick', 'เลือก')}
            {segTab('cfg',  'ตั้งค่า')}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 24px' }}>
          {seg === 'cfg' && (
            <>
              {/* Stepper rows */}
              <div>
                {rows.map((row, i) => (
                  <div key={row.c} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 0',
                    borderBottom: i < rows.length - 1 ? `0.5px solid ${hairline}` : 'none',
                  }}>
                    <div style={{ width: 130, fontFamily: FONT.thai, fontSize: 13.5, color: textInk, fontWeight: 600 }}>{row.label}</div>
                    <div style={{ flex: 1 }} />
                    <div style={{ fontFamily: FONT.thai, fontSize: 12, color: textMuted, marginRight: 2 }}>คอลัมน์</div>
                    {stepper(cfg[row.c], v => setCfg(c => ({ ...c, [row.c]: v })), row.minC, row.maxC)}
                    <div style={{ fontFamily: FONT.thai, fontSize: 12, color: textMuted, marginLeft: 6, marginRight: 2 }}>แถว</div>
                    {stepper(cfg[row.r], v => setCfg(c => ({ ...c, [row.r]: v })), row.minR, row.maxR)}
                  </div>
                ))}
              </div>

              {/* Default tab */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0 12px' }}>
                <div style={{ flex: 1, fontFamily: FONT.thai, fontSize: 14, fontWeight: 600, color: textInk }}>แท็บเริ่มต้น</div>
                <div style={{ display: 'flex', padding: 3, background: dark ? TOKENS.darkElev : TOKENS.paperDeep, borderRadius: 999 }}>
                  {[{k:'favor', l:'แนะนำ'}, {k:'pick', l:'เลือก'}].map(t => (
                    <button key={t.k} onClick={() => setCfg(c => ({ ...c, defaultTab: t.k }))} style={{
                      padding: '5px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
                      background: cfg.defaultTab === t.k ? TOKENS.orange : 'transparent',
                      color: cfg.defaultTab === t.k ? '#fff' : textMuted,
                      fontFamily: FONT.thai, fontSize: 12.5, fontWeight: 600,
                    }}>{t.l}</button>
                  ))}
                </div>
              </div>

              {/* Category grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, rowGap: 16, padding: '4px 0 20px' }}>
                {builtIns.map(([k, c]) => renderCell({
                  key: k, label: c.label, catKind: c.icon, bg: c.bg,
                  locked: !UNLOCKED_KEYS.has(k),
                }))}
                {customs.map(cu => renderCell({
                  key: cu.key, label: cu.name, icon: cu.icon, bg: cu.color,
                  iconColor: '#fff', removable: true,
                  onClick: () => removeCustom(cu.key),
                }))}
                {renderCell({ type: 'add', onClick: () => setShowAdd(true) })}
              </div>
            </>
          )}

          {seg === 'pick' && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cfg.pickCols}, 1fr)`, gap: 12, rowGap: 16, padding: '8px 0 20px' }}>
              {builtIns.map(([k, c]) => {
                const en = cfg.enabled[k];
                return (
                  <button key={k} onClick={() => toggleCat(k)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    opacity: en ? 1 : 0.4, position: 'relative',
                  }}>
                    <div style={{ position: 'relative' }}>
                      <CatIcon kind={c.icon} bg={c.bg} size={52} />
                      <div style={{
                        position: 'absolute', top: -3, right: -3, width: 18, height: 18, borderRadius: '50%',
                        background: en ? TOKENS.income : '#C4BAAE',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 2px rgba(42,35,32,0.15)',
                      }}>
                        {en
                          ? <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          : <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 2l6 6M8 2l-6 6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/></svg>
                        }
                      </div>
                    </div>
                    <div style={{ fontFamily: FONT.thai, fontSize: 11, color: textInk, fontWeight: 500, textAlign: 'center', lineHeight: 1.15, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</div>
                  </button>
                );
              })}
            </div>
          )}

          {seg === 'hint' && (
            <div style={{ padding: '24px 8px', textAlign: 'center' }}>
              <div style={{ fontFamily: FONT.thai, fontSize: 13.5, color: textMuted, lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>✨</div>
                <div style={{ fontWeight: 700, color: textInk, marginBottom: 4 }}>หมวดหมู่แนะนำ</div>
                <div>เราคัดหมวดยอดนิยม ตามพฤติกรรมการใช้จ่ายในไทย พร้อมใช้งานทันที</div>
              </div>
            </div>
          )}
        </div>

        {/* Done */}
        <div style={{ padding: '10px 16px 16px', borderTop: `0.5px solid ${hairline}` }}>
          <button onClick={onClose} style={{
            width: '100%', height: 48, borderRadius: 999, border: 'none', cursor: 'pointer',
            background: TOKENS.orange, color: '#fff',
            fontFamily: FONT.thai, fontSize: 15, fontWeight: 700, boxShadow: SHADOWS.fab,
          }}>เสร็จสิ้น</button>
        </div>
      </div>

      {showAdd && (
        <AddCategoryModal mode={mode} dark={dark}
          onClose={() => setShowAdd(false)}
          onAdd={(data) => { addCustom(data); setShowAdd(false); }} />
      )}
    </>
  );
}

function AddTransactionModal_NEW_UNUSED({ open, onClose, dark }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const surface = dark ? TOKENS.darkSurface : '#fff';

  const [mode, setMode] = React.useState('expense');
  const [tab, setTab] = React.useState('favor'); // 'favor' | 'pick'
  const [showConfig, setShowConfig] = React.useState(false);
  const [amount, setAmount] = React.useState('50');
  const [cat, setCat] = React.useState('food');
  const [note, setNote] = React.useState('');
  const [wallet, setWallet] = React.useState('cash2');
  const [date, setDate] = React.useState('19 เม.ย.');

  // Configurable layout (persisted in memory; exposed in ตั้งค่า tab)
  const [cfg, setCfg] = React.useState({
    pickCols: 6, pickRows: 3,
    favCatCols: 5, favCatRows: 1,
    favItemCols: 4, favItemRows: 4,
    defaultTab: 'favor',
    enabled: Object.fromEntries(Object.keys(CATEGORIES).map(k => [k, true])),
  });

  if (!open) return null;
  const amountColor = mode === 'expense' ? TOKENS.expense : TOKENS.income;

  const handleKey = (k) => {
    if (k === 'C') return setAmount('0');
    if (k === '⌫') return setAmount(a => a.length <= 1 ? '0' : a.slice(0, -1));
    if (k === '=' || '÷×−+'.includes(k)) return;
    if (k === '.' && amount.includes('.')) return;
    setAmount(a => (a === '0' && k !== '.') ? k : a + k);
  };

  // Build data for tabs
  const enabledCats = Object.entries(CATEGORIES).filter(([k]) => cfg.enabled[k]);
  const favCats = ['food', 'coffee', 'transport', 'salary', 'fuel'].slice(0, cfg.favCatCols);
  const favItems = [
    { cat: 'food', amount: 200 }, { cat: 'food', amount: 250 }, { cat: 'food', amount: 120 }, { cat: 'food', amount: 50 },
    { cat: 'food', amount: 40 }, { cat: 'food', amount: 30 }, { cat: 'food', amount: 60 }, { cat: 'food', amount: 150 },
    { cat: 'food', amount: 100 }, { cat: 'food', amount: 70 }, { cat: 'food', amount: 300 }, { cat: 'food', amount: 80 },
    { cat: 'food', amount: 45 }, { cat: 'food', amount: 90 }, { cat: 'food', amount: 180 }, { cat: 'food', amount: 220 },
  ].slice(0, cfg.favItemCols * cfg.favItemRows);

  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(42,35,32,0.45)', zIndex: 200, animation: 'fade 200ms' }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, top: 56,
        background: surface, borderRadius: '28px 28px 0 0', zIndex: 201,
        boxShadow: SHADOWS.sheet, animation: 'slideUp 300ms cubic-bezier(0.2,0.8,0.2,1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* handle */}
        <div style={{ padding: '8px 0 2px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: dark ? TOKENS.darkMuted : '#D0C6BA', opacity: 0.6 }} />
        </div>

        {/* expense/income toggle + close */}
        <div style={{ padding: '6px 18px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, position: 'relative' }}>
          <ExpenseIncomeToggle mode={mode} setMode={setMode} />
          <button onClick={onClose} style={{
            position: 'absolute', right: 14, top: 4,
            width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'transparent',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke={textInk} strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Section title + gear icon */}
        <div style={{ padding: '10px 18px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: FONT.thai, fontSize: 17, fontWeight: 700, color: textInk }}>
            {tab === 'favor' ? 'รายการที่ใช้บ่อย' : 'เลือกหมวดหมู่'}
          </div>
          <button onClick={() => setShowConfig(true)} aria-label="ตั้งค่า" style={{
            width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: dark ? TOKENS.darkElev : TOKENS.paperDeep,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="2.3" stroke={textInk} strokeWidth="1.5"/>
              <path d="M9 1.5v1.8M9 14.7v1.8M1.5 9h1.8M14.7 9h1.8M3.7 3.7l1.3 1.3M13 13l1.3 1.3M3.7 14.3L5 13M13 5l1.3-1.3" stroke={textInk} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* 2-tab switcher */}
        <div style={{ padding: '0 18px 10px' }}>
          <div style={{ display: 'flex', padding: 4, background: TOKENS.paperDeep, borderRadius: 999 }}>
            {[{k:'favor', l:'แนะนำ'}, {k:'pick', l:'เลือก'}].map(t => (
              <button key={t.k} onClick={() => setTab(t.k)} style={{
                flex: 1, padding: '9px 10px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: tab === t.k ? TOKENS.orange : 'transparent',
                color: tab === t.k ? '#fff' : textMuted,
                fontFamily: FONT.thai, fontSize: 14, fontWeight: 600,
              }}>{t.l}</button>
            ))}
          </div>
        </div>

        {/* Scrollable section content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 6px' }}>
          {tab === 'favor' && (
            <FavorTab cfg={cfg} favCats={favCats} favItems={favItems} cat={cat} setCat={setCat} setAmount={setAmount} dark={dark} />
          )}
          {tab === 'pick' && (
            <PickTab cfg={cfg} cats={enabledCats} cat={cat} setCat={setCat} dark={dark} />
          )}
        </div>

        {/* Meta row: date + wallet chips */}
        <div style={{ padding: '6px 16px 4px', display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          <button style={{
            background: 'transparent', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
            fontFamily: FONT.mix, fontSize: 13, color: textInk, fontWeight: 500, cursor: 'pointer', flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14"><g fill="none" stroke={textInk} strokeWidth="1.5"><rect x="1.5" y="3" width="11" height="9.5" rx="1.5"/><path d="M1.5 6h11M4.5 1.5v3M9.5 1.5v3"/></g></svg>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{date}</span>
          </button>
          {[{ id:'cash2', label:'เงินสด (2)', active: true, ring: true },
            { id:'cash', label:'เงินสด' },
            { id:'debit', label:'เดบิต' }].map(w => {
            const sel = wallet === w.id;
            return (
              <button key={w.id} onClick={() => setWallet(w.id)} style={{
                height: 28, padding: '0 10px', borderRadius: 999, cursor: 'pointer', flexShrink: 0,
                background: sel ? 'transparent' : 'transparent',
                border: sel ? `1.5px solid ${TOKENS.orange}` : 'none',
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontFamily: FONT.thai, fontSize: 13, fontWeight: 600,
                color: sel ? TOKENS.orange : textInk,
              }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: TOKENS.income, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                {w.label}
              </button>
            );
          })}
        </div>

        {/* Note + amount */}
        <div style={{
          padding: '8px 16px 10px', display: 'flex', alignItems: 'center', gap: 10,
          borderTop: `0.5px solid ${dark ? TOKENS.darkHairline : TOKENS.hairline}`,
        }}>
          <input
            value={note} onChange={e => setNote(e.target.value)} placeholder="บันทึก..."
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontFamily: FONT.thai, fontSize: 15, color: textInk, padding: '8px 0',
            }}
          />
          <div style={{
            fontFamily: FONT.num, fontSize: 26, fontWeight: 800, color: amountColor,
            fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5,
          }}>
            ฿{Number(amount).toLocaleString('en-US')}
          </div>
        </div>

        {/* Keypad */}
        <div style={{
          padding: '10px 12px 20px', display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, background: TOKENS.paperDeep,
        }}>
          {[
            ['C','÷','×','⌫'],
            ['7','8','9','−'],
            ['4','5','6','+'],
            ['1','2','3','='],
            ['.','0','bk','sv'],
          ].slice(0,4).flat().map((k, i) => {
            const isOp = '÷×−+='.includes(k);
            const isClear = k === 'C' || k === '⌫';
            return (
              <button key={i} onClick={() => handleKey(k)} style={{
                height: 52, borderRadius: 14, border: 'none', cursor: 'pointer',
                background: '#fff',
                color: isOp ? textMuted : isClear ? textMuted : textInk,
                fontFamily: FONT.num, fontSize: 22, fontWeight: 500,
                fontVariantNumeric: 'tabular-nums',
                boxShadow: '0 1px 2px rgba(42,35,32,0.04)',
              }}>
                {k === '⌫' ? <svg width="20" height="16" viewBox="0 0 20 16" style={{display:'block',margin:'auto'}}><g fill="none" stroke={textMuted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 1h12a1 1 0 011 1v12a1 1 0 01-1 1H6l-5-7z"/><path d="M9 5l5 6M14 5l-5 6"/></g></svg> : k}
              </button>
            );
          })}
        </div>
      </div>

      {showConfig && (
        <ConfigModal cfg={cfg} setCfg={setCfg} onClose={() => setShowConfig(false)} dark={dark} />
      )}
    </>
  );
}

function ExpenseIncomeToggle({ mode, setMode }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button onClick={() => setMode('expense')} style={{
        height: 34, padding: '0 18px', borderRadius: 999, border: 'none', cursor: 'pointer',
        background: mode === 'expense' ? TOKENS.expense : 'transparent',
        color: mode === 'expense' ? '#fff' : TOKENS.inkMuted,
        fontFamily: FONT.thai, fontSize: 14.5, fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ width: 15, height: 15, borderRadius: '50%', border: `1.5px solid ${mode === 'expense' ? '#fff' : TOKENS.inkMuted}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>−</span>
        รายจ่าย
      </button>
      <button onClick={() => setMode('income')} style={{
        height: 34, padding: '0 18px', borderRadius: 999, border: 'none', cursor: 'pointer',
        background: mode === 'income' ? TOKENS.income : 'transparent',
        color: mode === 'income' ? '#fff' : TOKENS.inkMuted,
        fontFamily: FONT.thai, fontSize: 14.5, fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ width: 15, height: 15, borderRadius: '50%', border: `1.5px solid ${mode === 'income' ? '#fff' : TOKENS.inkMuted}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>+</span>
        รายรับ
      </button>
    </div>
  );
}

function FavorTab({ cfg, favCats, favItems, cat, setCat, setAmount, dark }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  return (
    <div>
      <div style={{ fontFamily: FONT.thai, fontSize: 13, fontWeight: 600, color: textMuted, margin: '4px 0 8px' }}>
        หมวดใช้บ่อย
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cfg.favCatCols}, 1fr)`, gap: 10, marginBottom: 14 }}>
        {favCats.map(k => {
          const c = CATEGORIES[k];
          const sel = cat === k;
          return (
            <button key={k} onClick={() => setCat(k)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 2,
            }}>
              <div style={{ padding: 2, borderRadius: '50%', border: sel ? `2px solid ${TOKENS.orange}` : '2px solid transparent' }}>
                <CatIcon kind={c.icon} bg={c.bg} size={44} />
              </div>
              <div style={{ fontFamily: FONT.thai, fontSize: 11, color: sel ? textInk : textMuted, fontWeight: sel ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 60 }}>
                {c.label}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ fontFamily: FONT.thai, fontSize: 13, fontWeight: 600, color: textMuted, margin: '8px 0 8px' }}>
        รายการที่ใช้บ่อย
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cfg.favItemCols}, 1fr)`, gap: 8 }}>
        {favItems.map((it, i) => {
          const c = CATEGORIES[it.cat];
          return (
            <button key={i} onClick={() => { setCat(it.cat); setAmount(String(it.amount)); }} style={{
              background: '#fff', border: `0.5px solid ${TOKENS.hairline}`, borderRadius: 14,
              padding: '8px 8px 8px 8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 1px 2px rgba(42,35,32,0.03)',
            }}>
              <CatIcon kind={c.icon} bg={c.bg} size={22} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                <div style={{ fontFamily: FONT.thai, fontSize: 10, color: textMuted, lineHeight: 1 }}>{c.label}</div>
                <div style={{ fontFamily: FONT.num, fontSize: 14, fontWeight: 700, color: textInk, fontVariantNumeric: 'tabular-nums' }}>
                  {it.amount}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PickTab({ cfg, cats, cat, setCat, dark }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cfg.pickCols}, 1fr)`, gap: 14, rowGap: 16, paddingTop: 4 }}>
      {cats.map(([k, c]) => {
        const sel = cat === k;
        return (
          <button key={k} onClick={() => setCat(k)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 0,
          }}>
            <div style={{ padding: sel ? 2 : 0, borderRadius: '50%', border: sel ? `2px solid ${TOKENS.orange}` : 'none' }}>
              <CatIcon kind={c.icon} bg={c.bg} size={44} />
            </div>
            <div style={{ fontFamily: FONT.thai, fontSize: 10.5, color: sel ? textInk : textMuted, fontWeight: sel ? 600 : 500, textAlign: 'center', lineHeight: 1.1, maxWidth: 54, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ConfigTab({ cfg, setCfg, dark }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const rows = [
    { k: 'pick',     label: 'หมวดหมู่ ในเมนูเลือก', c: 'pickCols',    r: 'pickRows',    min: 3, max: 8 },
    { k: 'favCat',   label: 'หมวดใช้บ่อย',          c: 'favCatCols',  r: 'favCatRows',  min: 2, max: 6 },
    { k: 'favItem',  label: 'รายการใช้บ่อย',        c: 'favItemCols', r: 'favItemRows', min: 2, max: 6 },
  ];
  const stepper = (val, onChange, min, max) => (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: TOKENS.paperDeep, borderRadius: 999, padding: 3 }}>
      <button onClick={() => onChange(Math.max(min, val - 1))} style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: '#fff', cursor: 'pointer', color: textMuted, fontWeight: 600, fontSize: 14 }}>−</button>
      <div style={{ fontFamily: FONT.num, fontSize: 14, fontWeight: 700, color: textInk, minWidth: 16, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{val}</div>
      <button onClick={() => onChange(Math.min(max, val + 1))} style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: '#fff', cursor: 'pointer', color: textMuted, fontWeight: 600, fontSize: 14 }}>+</button>
    </div>
  );
  const toggleCat = (k) => setCfg(c => ({ ...c, enabled: { ...c.enabled, [k]: !c.enabled[k] } }));

  return (
    <div>
      {rows.map(row => (
        <div key={row.k} style={{ display: 'flex', alignItems: 'center', padding: '10px 2px', gap: 8 }}>
          <div style={{ flex: 1, fontFamily: FONT.thai, fontSize: 14, color: textInk, fontWeight: 500 }}>{row.label}</div>
          <div style={{ fontFamily: FONT.thai, fontSize: 12, color: textMuted, marginRight: 4 }}>คอลัมน์</div>
          {stepper(cfg[row.c], v => setCfg(c => ({ ...c, [row.c]: v })), row.min, row.max)}
          <div style={{ fontFamily: FONT.thai, fontSize: 12, color: textMuted, marginLeft: 6, marginRight: 4 }}>แถว</div>
          {stepper(cfg[row.r], v => setCfg(c => ({ ...c, [row.r]: v })), 1, 8)}
        </div>
      ))}

      {/* Default tab */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 2px 6px' }}>
        <div style={{ flex: 1, fontFamily: FONT.thai, fontSize: 14, fontWeight: 600, color: textInk }}>แท็บเริ่มต้น</div>
        <div style={{ display: 'flex', padding: 3, background: TOKENS.paperDeep, borderRadius: 999 }}>
          {[{k:'favor', l:'แนะนำ'}, {k:'pick', l:'เลือก'}].map(t => (
            <button key={t.k} onClick={() => setCfg(c => ({ ...c, defaultTab: t.k }))} style={{
              padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: cfg.defaultTab === t.k ? TOKENS.orange : 'transparent',
              color: cfg.defaultTab === t.k ? '#fff' : textMuted,
              fontFamily: FONT.thai, fontSize: 12.5, fontWeight: 600,
            }}>{t.l}</button>
          ))}
        </div>
      </div>

      {/* Category grid with enable/disable + add placeholder */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, rowGap: 14, padding: '10px 0 20px' }}>
        {Object.entries(CATEGORIES).map(([k, c]) => {
          const en = cfg.enabled[k];
          return (
            <button key={k} onClick={() => toggleCat(k)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              opacity: en ? 1 : 0.45, position: 'relative',
            }}>
              <div style={{ position: 'relative' }}>
                <CatIcon kind={c.icon} bg={c.bg} size={44} />
                <div style={{
                  position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%',
                  background: en ? '#fff' : TOKENS.expense,
                  border: en ? `0.5px solid ${TOKENS.hairline}` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(42,35,32,0.1)',
                }}>
                  {en ? (
                    <svg width="10" height="10" viewBox="0 0 10 10"><g fill="none" stroke={TOKENS.inkMuted} strokeWidth="1.4" strokeLinecap="round"><rect x="3" y="4.5" width="4" height="3.5" rx="0.5"/><path d="M3.8 4.5V3.5a1.2 1.2 0 012.4 0v1"/></g></svg>
                  ) : (
                    <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  )}
                </div>
              </div>
              <div style={{ fontFamily: FONT.thai, fontSize: 10.5, color: textInk, fontWeight: 500, textAlign: 'center', lineHeight: 1.1, maxWidth: 54, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.label}
              </div>
            </button>
          );
        })}
        {/* Add */}
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: `1.5px dashed ${TOKENS.orange}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 2v12M2 8h12" stroke={TOKENS.orange} strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div style={{ fontFamily: FONT.thai, fontSize: 10.5, color: TOKENS.orange, fontWeight: 600 }}>เพิ่ม</div>
        </button>
      </div>
    </div>
  );
}

// Legacy category picker (kept for compatibility — no longer used directly)
function CategoryPicker({ onClose, onPick, dark }) { return null; }

// ───────────────────────────────────────────────────────────────
// Frequent transactions — full list (stacked over Add modal)
// ───────────────────────────────────────────────────────────────

const FREQ_ALL = [
  { cat: 'food',      note: 'ข้าวเที่ยง',         amount: 80,   count: 18, mode: 'expense' },
  { cat: 'coffee',    note: 'ลาเต้',               amount: 65,   count: 24, mode: 'expense' },
  { cat: 'transport', note: 'วินมอไซค์',          amount: 30,   count: 22, mode: 'expense' },
  { cat: 'food',      note: 'ส้มตำ',               amount: 60,   count: 12, mode: 'expense' },
  { cat: 'drink',     note: 'ชานมไข่มุก',         amount: 55,   count: 14, mode: 'expense' },
  { cat: 'fuel',      note: 'เติมน้ำมัน',         amount: 300,  count: 6,  mode: 'expense' },
  { cat: 'food',      note: 'ก๋วยเตี๋ยว',         amount: 70,   count: 10, mode: 'expense' },
  { cat: 'coffee',    note: 'อเมริกาโน่',          amount: 45,   count: 16, mode: 'expense' },
  { cat: 'transport', note: 'BTS',                 amount: 44,   count: 20, mode: 'expense' },
  { cat: 'shopping',  note: '7-11',                amount: 120,  count: 28, mode: 'expense' },
  { cat: 'food',      note: 'ข้าวกล่อง',          amount: 50,   count: 8,  mode: 'expense' },
  { cat: 'bill',      note: 'ค่าไฟ',               amount: 1200, count: 1,  mode: 'expense' },
  { cat: 'bill',      note: 'ค่าน้ำ',              amount: 180,  count: 1,  mode: 'expense' },
  { cat: 'entertainment', note: 'Netflix',          amount: 419,  count: 1,  mode: 'expense' },
  { cat: 'other',     note: 'เงินเดือน',           amount: 35000,count: 1,  mode: 'income' },
  { cat: 'other',     note: 'โอนเข้า',              amount: 500,  count: 4,  mode: 'income' },
];

function FrequentAllModal({ onClose, onPick, dark }) {
  const textInk = dark ? TOKENS.darkText : TOKENS.ink;
  const textMuted = dark ? TOKENS.darkMuted : TOKENS.inkMuted;
  const surface = dark ? TOKENS.darkSurface : '#fff';
  const hairline = dark ? TOKENS.darkHairline : TOKENS.hairline;

  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState('all'); // all | expense | income
  const [sort, setSort] = React.useState('freq'); // freq | amount | name

  let items = FREQ_ALL.filter(f =>
    (filter === 'all' || f.mode === filter) &&
    (q === '' || f.note.toLowerCase().includes(q.toLowerCase()) || (CATEGORIES[f.cat]?.label || '').includes(q))
  );
  items = [...items].sort((a, b) => {
    if (sort === 'freq') return b.count - a.count;
    if (sort === 'amount') return b.amount - a.amount;
    return a.note.localeCompare(b.note);
  });

  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(42,35,32,0.55)', zIndex: 300, animation: 'fade 200ms' }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '90%',
        background: surface, borderRadius: '28px 28px 0 0', zIndex: 301,
        animation: 'slideUp 300ms cubic-bezier(0.2,0.8,0.2,1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* handle */}
        <div style={{ padding: '8px 0 4px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: dark ? TOKENS.darkMuted : '#D0C6BA', opacity: 0.6 }} />
        </div>

        {/* Title bar */}
        <div style={{ padding: '6px 18px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: FONT.thai, fontSize: 14, color: textMuted, padding: 4,
          }}>ปิด</button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: FONT.thai, fontSize: 17, fontWeight: 700, color: textInk }}>รายการที่ใช้บ่อย</div>
            <div style={{ fontFamily: FONT.thai, fontSize: 11, color: textMuted, marginTop: 1 }}>
              แตะเพื่อเติมลงในบันทึกรายการ
            </div>
          </div>
          <button style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: FONT.thai, fontSize: 14, color: TOKENS.orange, fontWeight: 700, padding: 4,
          }}>แก้ไข</button>
        </div>

        {/* Search */}
        <div style={{ padding: '0 16px 10px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: dark ? TOKENS.darkElev : TOKENS.paperDeep, borderRadius: 12,
            padding: '9px 12px',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><g stroke={textMuted} strokeWidth="1.6" strokeLinecap="round"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></g></svg>
            <input
              value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหา..."
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontFamily: FONT.thai, fontSize: 14, color: textInk,
              }}
            />
            {q && (
              <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5.5" fill={textMuted} opacity="0.4"/><path d="M4 4l4 4M8 4l-4 4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter + sort chips */}
        <div style={{
          padding: '0 16px 10px', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {[
            { k: 'all',     l: 'ทั้งหมด' },
            { k: 'expense', l: 'รายจ่าย' },
            { k: 'income',  l: 'รายรับ' },
          ].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{
              flexShrink: 0, height: 30, padding: '0 14px', borderRadius: 999, cursor: 'pointer',
              background: filter === f.k ? TOKENS.orangeTint : 'transparent',
              border: filter === f.k ? `1px solid ${TOKENS.orange}` : `1px solid ${hairline}`,
              color: filter === f.k ? TOKENS.orangeDeep : textMuted,
              fontFamily: FONT.thai, fontSize: 12.5, fontWeight: 600,
            }}>{f.l}</button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><g stroke={textMuted} strokeWidth="1.5" strokeLinecap="round"><path d="M3 4h8M4 7h6M5.5 10h3"/></g></svg>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{
              border: 'none', background: 'transparent', outline: 'none',
              fontFamily: FONT.thai, fontSize: 12.5, color: textInk, fontWeight: 600, cursor: 'pointer',
            }}>
              <option value="freq">ใช้บ่อยสุด</option>
              <option value="amount">ยอดเงินสูงสุด</option>
              <option value="name">ตามชื่อ</option>
            </select>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: hairline, margin: '0 16px' }} />

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 16px 20px' }}>
          {items.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: textMuted, fontFamily: FONT.thai, fontSize: 13 }}>
              ไม่พบรายการ
            </div>
          )}
          {items.map((f, i) => {
            const c = CATEGORIES[f.cat] || CATEGORIES.other;
            const col = f.mode === 'income' ? TOKENS.income : TOKENS.expense;
            return (
              <button key={i} onClick={() => onPick(f)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '10px 4px',
                background: 'transparent', border: 'none',
                borderBottom: i < items.length - 1 ? `0.5px solid ${hairline}` : 'none',
                cursor: 'pointer', textAlign: 'left',
              }}>
                <CatIcon kind={c.icon} bg={c.bg} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT.thai, fontSize: 14.5, fontWeight: 600, color: textInk, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.note}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <div style={{ fontFamily: FONT.thai, fontSize: 11.5, color: textMuted }}>{c.label}</div>
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: textMuted, opacity: 0.5 }} />
                    <div style={{
                      fontFamily: FONT.thai, fontSize: 11, color: TOKENS.orangeDeep, fontWeight: 600,
                      background: TOKENS.orangeTint, padding: '1px 7px', borderRadius: 999,
                    }}>ใช้ {f.count} ครั้ง</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: FONT.num, fontSize: 15, fontWeight: 700, color: col,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {f.mode === 'income' ? '+' : '−'}{Number(f.amount).toLocaleString('en-US')}
                  </div>
                  <div style={{ fontFamily: FONT.thai, fontSize: 10.5, color: textMuted, marginTop: 1 }}>บาท</div>
                </div>
                <svg width="7" height="12" viewBox="0 0 7 12" style={{ marginLeft: 2 }}><path d="M1 1l5 5-5 5" stroke={textMuted} strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { SplashScreen, EmptyState, AddTransactionModal, CategoryPicker, FrequentAllModal });
