// Shared building blocks — bottom nav, FAB, cards, pills

function BottomNav({ tab, setTab, dark = false }) {
  const items = [
    { id: 'list', label: 'รายการ', icon: 'list' },
    { id: 'summary', label: 'สรุป', icon: 'chart' },
    { id: 'premium', label: 'Premium', icon: 'gem' },
    { id: 'settings', label: 'ตั้งค่า', icon: 'gear' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 82,
      paddingBottom: 22,
      background: dark ? 'rgba(31,25,19,0.92)' : 'rgba(251,247,240,0.94)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: `0.5px solid ${dark ? TOKENS.darkHairline : TOKENS.hairline}`,
      display: 'flex', alignItems: 'flex-start',
      paddingTop: 10, zIndex: 40,
    }}>
      {items.map(it => {
        const active = tab === it.id;
        const color = active ? TOKENS.orange : (dark ? TOKENS.darkMuted : TOKENS.inkMuted);
        return (
          <button key={it.id} onClick={() => setTab(it.id)} style={{
            flex: 1, background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '4px 0', position: 'relative',
          }}>
            <NavIcon kind={it.icon} active={active} color={color} />
            <div style={{
              fontFamily: FONT.mix, fontSize: 11, fontWeight: active ? 600 : 500,
              color, letterSpacing: 0.1,
            }}>{it.label}</div>
            <div style={{ height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {active && <PawPrint size={10} color={TOKENS.orange} />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Orange FAB with two tiny cat ears on top
function FAB({ onClick, dark = false }) {
  const c = dark ? TOKENS.darkOrange : TOKENS.orange;
  return (
    <button onClick={onClick} style={{
      position: 'absolute', right: 18, bottom: 98, width: 58, height: 58,
      borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
      boxShadow: SHADOWS.fab, zIndex: 30,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* ears */}
      <svg width="58" height="20" viewBox="0 0 58 20" style={{ position: 'absolute', top: -10, left: 0, pointerEvents: 'none' }}>
        <path d="M16 18 L19 4 L26 14 Z" fill={c} />
        <path d="M42 18 L39 4 L32 14 Z" fill={c} />
      </svg>
      {/* plus */}
      <svg width="22" height="22" viewBox="0 0 22 22">
        <path d="M11 3v16M3 11h16" stroke="#FBF7F0" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function Pill({ children, onClick, active = false, dark = false, style = {} }) {
  const bg = active
    ? (dark ? TOKENS.darkOrange : TOKENS.orange)
    : (dark ? TOKENS.darkElev : '#FFFFFF');
  const color = active ? '#fff' : (dark ? TOKENS.darkText : TOKENS.ink);
  return (
    <button onClick={onClick} style={{
      height: 34, padding: '0 14px', borderRadius: 999,
      background: bg, color, border: active ? 'none' : `0.5px solid ${dark ? TOKENS.darkHairline : TOKENS.hairline}`,
      fontFamily: FONT.mix, fontSize: 14, fontWeight: 500, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
      boxShadow: active ? 'none' : '0 1px 2px rgba(42,35,32,0.04)',
      ...style,
    }}>{children}</button>
  );
}

// Subtle kintsugi gold crack decoration for cards
function KintsugiCrack({ style = {} }) {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" style={{ position: 'absolute', pointerEvents: 'none', opacity: 0.35, ...style }}>
      <path d="M5 40 L18 32 L28 44 L44 28 L58 42 L72 30 L88 48 L104 36 L115 50"
            stroke="#E8B547" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M18 32 L22 22 M44 28 L48 18 M72 30 L70 18 M104 36 L108 24"
            stroke="#E8B547" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.7"/>
    </svg>
  );
}

Object.assign(window, { BottomNav, FAB, Pill, KintsugiCrack });
