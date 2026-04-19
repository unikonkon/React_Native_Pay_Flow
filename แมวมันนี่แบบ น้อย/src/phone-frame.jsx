// Phone frame matching screenshot (393×852, 22:25, 4G, 80%)

function StatusBar({ dark = false, time = '22:25' }) {
  const c = dark ? '#F5EDE0' : '#2A2320';
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 54,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', paddingTop: 16, zIndex: 50,
      fontFamily: '"Inter", system-ui', fontWeight: 600, fontSize: 17, color: c,
    }}>
      <div style={{ fontVariantNumeric: 'tabular-nums' }}>{time}</div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>4G</span>
        <svg width="18" height="11" viewBox="0 0 18 11"><g fill={c}><rect x="0" y="7" width="3" height="4" rx="0.6"/><rect x="5" y="4.5" width="3" height="6.5" rx="0.6"/><rect x="10" y="2" width="3" height="9" rx="0.6"/><rect x="15" y="0" width="3" height="11" rx="0.6" opacity="0.45"/></g></svg>
        <svg width="28" height="12" viewBox="0 0 28 12"><rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke={c} fill="none" opacity="0.4"/><rect x="2" y="2" width="17.6" height="8" rx="1.5" fill={c}/><rect x="24" y="3.5" width="2" height="5" rx="1" fill={c} opacity="0.5"/><text x="11" y="9" textAnchor="middle" fontSize="7" fontWeight="700" fill={dark ? '#1F1913' : '#FBF7F0'} fontFamily="Inter">80</text></svg>
      </div>
    </div>
  );
}

function PhoneFrame({ children, dark = false, showStatus = true, bg }) {
  const W = 393, H = 852;
  return (
    <div style={{
      width: W, height: H, borderRadius: 54, overflow: 'hidden',
      position: 'relative', background: bg || (dark ? TOKENS.darkBg : TOKENS.paper),
      boxShadow: '0 0 0 12px #1a1410, 0 0 0 13px #2a221e, 0 40px 100px rgba(42,35,32,0.32), 0 16px 40px rgba(42,35,32,0.2)',
      fontFamily: FONT.mix, WebkitFontSmoothing: 'antialiased',
      isolation: 'isolate',
    }}>
      {/* Dynamic island */}
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 124, height: 36, borderRadius: 24, background: '#0a0705', zIndex: 100,
      }}>
        <div style={{
          position: 'absolute', top: 12, left: 30, width: 10, height: 10, borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #4FE99A, #2CA96E)',
          boxShadow: '0 0 8px rgba(79,233,154,0.6)',
        }} />
      </div>
      {showStatus && <StatusBar dark={dark} />}
      <div style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { PhoneFrame, StatusBar });
