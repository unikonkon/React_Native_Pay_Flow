// Category icons — simple pictograms on colored circles.
// Kept geometric and flat to match the warm paper aesthetic.

function CatIcon({ kind, size = 56, bg, dark = false }) {
  const stroke = dark ? '#2A2320' : '#2A2320';
  const p = { stroke, strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };

  const glyphs = {
    food: (
      <g {...p}>
        <path d="M10 16c0-6 5-10 12-10s12 4 12 10" />
        <line x1="8" y1="16" x2="36" y2="16" />
        <path d="M11 20c2 5 7 8 11 8s9-3 11-8" />
      </g>
    ),
    drink: (
      <g {...p}>
        <path d="M13 10h18l-2 20a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" />
        <line x1="14" y1="16" x2="30" y2="16" />
      </g>
    ),
    party: (
      <g {...p}>
        <path d="M22 8v6M16 11l3 3M28 11l-3 3" />
        <path d="M14 32l8-14 8 14c0 2-3 3-8 3s-8-1-8-3z" />
      </g>
    ),
    fuel: (
      <g {...p}>
        <rect x="10" y="10" width="16" height="24" rx="2" />
        <line x1="10" y1="18" x2="26" y2="18" />
        <path d="M26 16l4 2v12a2 2 0 0 0 2 2v-18l-4-4" />
      </g>
    ),
    salary: (
      <g {...p}>
        <rect x="8" y="14" width="28" height="18" rx="3" />
        <circle cx="22" cy="23" r="4" />
        <path d="M14 10h16v4" />
      </g>
    ),
    transport: (
      <g {...p}>
        <path d="M10 26v-8l3-6h18l3 6v8" />
        <rect x="8" y="22" width="28" height="10" rx="2" />
        <circle cx="15" cy="32" r="2.5" />
        <circle cx="29" cy="32" r="2.5" />
      </g>
    ),
    coffee: (
      <g {...p}>
        <path d="M10 14h18v12a6 6 0 0 1-6 6h-6a6 6 0 0 1-6-6z" />
        <path d="M28 17h3a3 3 0 0 1 0 6h-3" />
        <path d="M16 8c0 2-2 2-2 4M22 8c0 2-2 2-2 4" />
      </g>
    ),
    game: (
      <g {...p}>
        <rect x="6" y="14" width="32" height="18" rx="6" />
        <line x1="14" y1="20" x2="14" y2="26" />
        <line x1="11" y1="23" x2="17" y2="23" />
        <circle cx="28" cy="21" r="1.5" fill={stroke}/>
        <circle cx="32" cy="25" r="1.5" fill={stroke}/>
      </g>
    ),
    invest: (
      <g {...p}>
        <path d="M8 30l8-8 6 6 12-14" />
        <path d="M26 14h8v8" />
      </g>
    ),
    other: (
      <g {...p}>
        <circle cx="14" cy="22" r="2" fill={stroke}/>
        <circle cx="22" cy="22" r="2" fill={stroke}/>
        <circle cx="30" cy="22" r="2" fill={stroke}/>
      </g>
    ),
    shopping: (
      <g {...p}>
        <path d="M10 14h24l-2 18a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3z" />
        <path d="M16 14c0-4 3-6 6-6s6 2 6 6" />
      </g>
    ),
    health: (
      <g {...p}>
        <path d="M22 34s-12-7-12-16a7 7 0 0 1 12-5 7 7 0 0 1 12 5c0 9-12 16-12 16z" />
      </g>
    ),
    home: (
      <g {...p}>
        <path d="M8 22l14-12 14 12" />
        <path d="M12 20v14h20V20" />
        <rect x="19" y="26" width="6" height="8" />
      </g>
    ),
    gift: (
      <g {...p}>
        <rect x="8" y="18" width="28" height="16" rx="2" />
        <line x1="22" y1="18" x2="22" y2="34" />
        <line x1="6" y1="18" x2="38" y2="18" />
        <path d="M22 18c-4-4-10 0-6 4M22 18c4-4 10 0 6 4" />
      </g>
    ),
    education: (
      <g {...p}>
        <path d="M4 18l18-8 18 8-18 8z" />
        <path d="M12 22v8c0 2 4 4 10 4s10-2 10-4v-8" />
      </g>
    ),
    pet: (
      <g {...p}>
        <circle cx="14" cy="14" r="3" />
        <circle cx="30" cy="14" r="3" />
        <circle cx="9" cy="22" r="2.5" />
        <circle cx="35" cy="22" r="2.5" />
        <path d="M14 32c0-5 4-8 8-8s8 3 8 8c0 3-3 4-8 4s-8-1-8-4z" />
      </g>
    ),
  };

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width={size * 0.82} height={size * 0.82} viewBox="0 0 44 44">
        {glyphs[kind] || glyphs.other}
      </svg>
    </div>
  );
}

// Paw print — used as tab indicator + decorative accent
function PawPrint({ size = 14, color = '#E87A3D' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <ellipse cx="4" cy="5" rx="1.4" ry="1.8"/>
      <ellipse cx="8" cy="3.5" rx="1.4" ry="1.8"/>
      <ellipse cx="12" cy="5" rx="1.4" ry="1.8"/>
      <ellipse cx="2.5" cy="9" rx="1.2" ry="1.5"/>
      <ellipse cx="13.5" cy="9" rx="1.2" ry="1.5"/>
      <path d="M8 7c-3 0-5 2-5 4.5S5 15 8 15s5-1 5-3.5S11 7 8 7z"/>
    </svg>
  );
}

// Tiny cat head silhouette (with ears) — used for small avatar
function CatHead({ size = 22, color = '#E87A3D' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill={color} d="M5 4l3 5h8l3-5-1 8c0 4-3 7-6 7s-6-3-6-7z"/>
      <circle cx="9.5" cy="12" r="0.8" fill="#2A2320"/>
      <circle cx="14.5" cy="12" r="0.8" fill="#2A2320"/>
      <path d="M11 14.5h2" stroke="#2A2320" strokeWidth="0.8" strokeLinecap="round"/>
    </svg>
  );
}

// Gold sparkle accent
function Sparkle({ size = 10, color = '#E8B547' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10">
      <path d="M5 0l1 4 4 1-4 1-1 4-1-4-4-1 4-1z" fill={color}/>
    </svg>
  );
}

// Nav icons
function NavIcon({ kind, active, color }) {
  const p = { fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const pf = { fill: color };
  switch (kind) {
    case 'list':
      return <svg width="24" height="24" viewBox="0 0 24 24"><g {...p}><line x1="8" y1="7" x2="20" y2="7"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="8" y1="17" x2="20" y2="17"/><circle cx="4.5" cy="7" r="1" {...pf}/><circle cx="4.5" cy="12" r="1" {...pf}/><circle cx="4.5" cy="17" r="1" {...pf}/></g></svg>;
    case 'chart':
      return <svg width="24" height="24" viewBox="0 0 24 24"><g {...p}><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 8 8h-8z" {...(active ? pf : {})}/></g></svg>;
    case 'gem':
      return <svg width="24" height="24" viewBox="0 0 24 24"><g {...p}><path d="M7 4h10l4 5-9 11L3 9z"/><path d="M7 4l5 5M17 4l-5 5M3 9h18"/></g></svg>;
    case 'gear':
      return <svg width="24" height="24" viewBox="0 0 24 24"><g {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M22 12h-3M5 12H2M19 5l-2 2M7 17l-2 2M19 19l-2-2M7 7L5 5"/></g></svg>;
  }
}

Object.assign(window, { CatIcon, PawPrint, CatHead, Sparkle, NavIcon });
