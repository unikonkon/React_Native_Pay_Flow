// Cat-themed category icons — 30 expense + 14 income = 44 glyphs
// All 44×44 viewBox, stroke-based to match the existing CatIcon look.
// Cat accents (paw stamps, ears, whiskers, tail curls) sprinkled thoughtfully.

const CAT_ICON_GLYPHS = (stroke) => {
  const p  = { stroke, strokeWidth: 2,   fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const pt = { stroke, strokeWidth: 1.4, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const f  = { fill: stroke };

  // Tiny paw stamp used as accent in corners
  const pawStamp = (x, y, s = 1) => (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={stroke}>
      <ellipse cx="0"    cy="0"    rx="0.9" ry="1.1"/>
      <ellipse cx="2.4"  cy="-1.2" rx="0.9" ry="1.1"/>
      <ellipse cx="4.8"  cy="0"    rx="0.9" ry="1.1"/>
      <ellipse cx="-1.8" cy="2.2"  rx="0.8" ry="1"/>
      <path d="M2.4 1.6c-1.4 0-2.4 1-2.4 2.2s1 1.8 2.4 1.8 2.4-.6 2.4-1.8-1-2.2-2.4-2.2z"/>
    </g>
  );

  // Cat-ear peaks (triangles on top of rect-like shapes)
  const catEars = (cx, top) => (
    <g fill={stroke}>
      <path d={`M${cx - 6} ${top} l2 -3 l2 3z`}/>
      <path d={`M${cx + 2} ${top} l2 -3 l2 3z`}/>
    </g>
  );

  return {
    // ───────── EXPENSE (30) ─────────

    // อาหาร — bowl of noodles w/ cat paw print on side
    'fast-food': (
      <g {...p}>
        <path d="M8 18h28"/>
        <path d="M10 18c1 7 5 12 12 12s11-5 12-12"/>
        <path d="M14 13c2-2 4-1 4 1M22 11c2-2 4-1 4 1M30 13c2-2 4-1 4 1"/>
        {pawStamp(37, 34, 0.7)}
      </g>
    ),

    // เครื่องดื่ม/กาแฟ — mug with steam + cat-ear lid
    cafe: (
      <g {...p}>
        <path d="M10 16h16v10a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"/>
        <path d="M26 19h3a3 3 0 0 1 0 6h-3"/>
        <path d="M14 10c0 2-2 2-2 4M20 10c0 2-2 2-2 4"/>
        {catEars(18, 16)}
      </g>
    ),

    // เดินทาง — car with paw window
    car: (
      <g {...p}>
        <path d="M8 28v-6l3-6h20l3 6v6"/>
        <rect x="6" y="22" width="32" height="10" rx="3"/>
        <circle cx="13" cy="32" r="2.5"/>
        <circle cx="31" cy="32" r="2.5"/>
        <path d="M12 22l2-4h16l2 4"/>
        {pawStamp(22, 26, 0.5)}
      </g>
    ),

    // น้ำมัน — flame w/ cat-ear tip
    flame: (
      <g {...p}>
        <path d="M22 6c4 5 10 8 10 16a10 10 0 0 1-20 0c0-5 3-7 5-10 1 2 3 3 4 1 1-2 0-5 1-7z"/>
        <path d="M18 26c0 3 2 5 4 5s4-2 4-5c0-2-2-3-4-5-2 2-4 3-4 5z"/>
      </g>
    ),

    // ขนส่งสาธารณะ — bus w/ paw headlight
    bus: (
      <g {...p}>
        <rect x="8" y="8" width="28" height="22" rx="3"/>
        <path d="M8 20h28"/>
        <rect x="12" y="12" width="6" height="6"/>
        <rect x="26" y="12" width="6" height="6"/>
        <circle cx="14" cy="32" r="2"/>
        <circle cx="30" cy="32" r="2"/>
        <circle cx="13" cy="25" r="0.9" fill={stroke}/>
        <circle cx="31" cy="25" r="0.9" fill={stroke}/>
      </g>
    ),

    // ค่าเช่า/ผ่อนบ้าน — house w/ cat-ear roof peaks
    home: (
      <g {...p}>
        <path d="M8 22l14-12 14 12"/>
        <path d="M12 20v14h20V20"/>
        <rect x="19" y="26" width="6" height="8"/>
        <path d="M15 13l-2-3M31 13l2-3" />
        <circle cx="13" cy="10" r="0.4" fill={stroke}/>
        <circle cx="33" cy="10" r="0.4" fill={stroke}/>
      </g>
    ),

    // ค่าไฟ — lightbulb w/ filament cat-smile
    bulb: (
      <g {...p}>
        <path d="M14 18c0-5 4-8 8-8s8 3 8 8c0 3-2 5-3 7v3H17v-3c-1-2-3-4-3-7z"/>
        <path d="M17 34h10M18 37h8"/>
        <path d="M18 20c1 2 3 3 4 3s3-1 4-3"/>
        <path d="M20 18l0 -2M24 18l0 -2"/>
      </g>
    ),

    // ค่าน้ำ — water drop w/ paw ripple
    water: (
      <g {...p}>
        <path d="M22 6c-7 9-10 13-10 19a10 10 0 0 0 20 0c0-6-3-10-10-19z"/>
        <path d="M17 24c0 3 2 5 4 5"/>
        {pawStamp(22, 22, 0.5)}
      </g>
    ),

    // ค่าอินเทอร์เน็ต — wifi arcs w/ paw at center
    wifi: (
      <g {...p}>
        <path d="M8 16c8-8 20-8 28 0"/>
        <path d="M12 22c6-6 14-6 20 0"/>
        <path d="M16 28c4-4 8-4 12 0"/>
        <circle cx="22" cy="34" r="1.5" fill={stroke}/>
      </g>
    ),

    // โทรศัพท์ — phone w/ cat silhouette on screen
    'phone-portrait': (
      <g {...p}>
        <rect x="12" y="6" width="20" height="32" rx="3"/>
        <path d="M12 12h20M12 32h20"/>
        <circle cx="22" cy="35" r="0.6" fill={stroke}/>
        <path d="M18 18l2-3M26 18l-2-3" />
        <circle cx="19" cy="22" r="0.6" fill={stroke}/>
        <circle cx="25" cy="22" r="0.6" fill={stroke}/>
        <path d="M21 26h2"/>
      </g>
    ),

    // ของใช้ส่วนตัว — basket w/ cat ear handles
    basket: (
      <g {...p}>
        <path d="M8 18h28l-3 16H11z"/>
        <path d="M12 18l4-8 4 8M24 18l4-8 4 8"/>
        <path d="M16 22v8M22 22v8M28 22v8"/>
      </g>
    ),

    // เสื้อผ้า — shirt w/ paw pocket
    shirt: (
      <g {...p}>
        <path d="M10 12l6-4 2 3c2 1 6 1 8 0l2-3 6 4-3 6h-4v16H17V18h-4z"/>
        {pawStamp(22, 28, 0.55)}
      </g>
    ),

    // ช้อปปิ้ง — shopping bag w/ cat face
    bag: (
      <g {...p}>
        <path d="M10 14h24l-2 20a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2z"/>
        <path d="M16 14c0-4 3-6 6-6s6 2 6 6"/>
        <circle cx="19" cy="24" r="0.8" fill={stroke}/>
        <circle cx="25" cy="24" r="0.8" fill={stroke}/>
        <path d="M21 28c.5.5 1 .5 2 0"/>
      </g>
    ),

    // สุขภาพ/ยา — medkit w/ paw cross
    medkit: (
      <g {...p}>
        <rect x="6" y="14" width="32" height="20" rx="3"/>
        <path d="M16 14v-4h12v4"/>
        <path d="M22 20v8M18 24h8"/>
        {pawStamp(32, 30, 0.45)}
      </g>
    ),

    // ออกกำลังกาย — barbell w/ paw grip
    barbell: (
      <g {...p}>
        <rect x="4"  y="18" width="4" height="8" rx="1"/>
        <rect x="36" y="18" width="4" height="8" rx="1"/>
        <rect x="8"  y="20" width="4" height="4"/>
        <rect x="32" y="20" width="4" height="4"/>
        <path d="M12 22h20"/>
        <circle cx="22" cy="22" r="0.9" fill={stroke}/>
      </g>
    ),

    // บันเทิง — film reel w/ cat-ear top
    film: (
      <g {...p}>
        <rect x="6" y="10" width="32" height="24" rx="2"/>
        <path d="M6 16h4M34 16h4M6 22h4M34 22h4M6 28h4M34 28h4"/>
        <path d="M14 10v24M30 10v24"/>
        <circle cx="22" cy="22" r="3"/>
      </g>
    ),

    // เกม — controller w/ cat ears as shoulder buttons
    'game-controller': (
      <g {...p}>
        <path d="M10 16h24a4 4 0 0 1 4 4v6a4 4 0 0 1-6 3l-3-3H15l-3 3a4 4 0 0 1-6-3v-6a4 4 0 0 1 4-4z"/>
        <path d="M13 22v4M11 24h4"/>
        <circle cx="29" cy="22" r="1" fill={stroke}/>
        <circle cx="33" cy="24" r="1" fill={stroke}/>
        <path d="M10 16l-1 -3M34 16l1 -3"/>
      </g>
    ),

    // Subscription — TV w/ cat ears + whiskers
    tv: (
      <g {...p}>
        <rect x="6" y="12" width="32" height="20" rx="2"/>
        <path d="M16 8l6 4 6-4"/>
        <path d="M16 32v4h12v-4"/>
        <circle cx="18" cy="20" r="0.8" fill={stroke}/>
        <circle cx="26" cy="20" r="0.8" fill={stroke}/>
        <path d="M13 24h4M27 24h4"/>
      </g>
    ),

    // ครอบครัว — family of cats (2 heads)
    people: (
      <g {...p}>
        <path d="M10 14l2 3h6l2-3-1 6c0 3-2 5-4 5s-4-2-4-5z"/>
        <path d="M24 14l2 3h6l2-3-1 6c0 3-2 5-4 5s-4-2-4-5z"/>
        <path d="M8 36c0-5 3-7 7-7s7 2 7 7"/>
        <path d="M22 36c0-5 3-7 7-7s7 2 7 7"/>
        <circle cx="13" cy="18" r="0.5" fill={stroke}/>
        <circle cx="17" cy="18" r="0.5" fill={stroke}/>
        <circle cx="27" cy="18" r="0.5" fill={stroke}/>
        <circle cx="31" cy="18" r="0.5" fill={stroke}/>
      </g>
    ),

    // เดท — heart w/ cat face
    heart: (
      <g {...p}>
        <path d="M22 34s-12-7-12-16a7 7 0 0 1 12-5 7 7 0 0 1 12 5c0 9-12 16-12 16z"/>
        <circle cx="18" cy="18" r="0.8" fill={stroke}/>
        <circle cx="26" cy="18" r="0.8" fill={stroke}/>
        <path d="M20 23c.7.7 1.3.7 2 .3M24 23c-.7.7-1.3.7-2 .3"/>
      </g>
    ),

    // สังสรรค์ — wine glass w/ sparkles
    wine: (
      <g {...p}>
        <path d="M14 8h16l-1 8a7 7 0 0 1-14 0z"/>
        <path d="M22 23v10"/>
        <path d="M16 34h12"/>
        <path d="M10 10l1 3M34 10l-1 3"/>
      </g>
    ),

    // ของขวัญ — gift box w/ cat-ear bow
    gift: (
      <g {...p}>
        <rect x="6" y="18" width="32" height="16" rx="2"/>
        <path d="M22 18v16M4 18h36"/>
        <path d="M22 18c-4-5-11 0-7 4M22 18c4-5 11 0 7 4"/>
        <path d="M16 14l-2-4M28 14l2-4"/>
      </g>
    ),

    // การศึกษา — grad cap
    school: (
      <g {...p}>
        <path d="M4 18l18-8 18 8-18 8z"/>
        <path d="M12 22v8c0 2 4 4 10 4s10-2 10-4v-8"/>
        <path d="M36 18v8"/>
        <circle cx="36" cy="27" r="1" fill={stroke}/>
      </g>
    ),

    // หนังสือ — open book w/ paw bookmark
    book: (
      <g {...p}>
        <path d="M8 10v24c3-2 8-3 14-3s11 1 14 3V10c-3-2-8-3-14-3s-11 1-14 3z"/>
        <path d="M22 7v24"/>
        {pawStamp(30, 16, 0.5)}
      </g>
    ),

    // ท่องเที่ยว — airplane
    airplane: (
      <g {...p}>
        <path d="M22 4c-2 2-2 6-2 10v3l-14 6v3l14-3v7l-4 3v3l6-2 6 2v-3l-4-3v-7l14 3v-3l-14-6v-3c0-4 0-8-2-10z"/>
      </g>
    ),

    // ประกัน — shield w/ paw check
    'shield-checkmark': (
      <g {...p}>
        <path d="M22 6l14 4v10c0 8-6 14-14 18-8-4-14-10-14-18V10z"/>
        <path d="M16 22l4 4 8-10"/>
        {pawStamp(30, 30, 0.4)}
      </g>
    ),

    // ผ่อนชำระ — credit card w/ paw chip
    card: (
      <g {...p}>
        <rect x="4" y="12" width="36" height="22" rx="3"/>
        <path d="M4 19h36"/>
        <rect x="9" y="24" width="7" height="5" rx="1"/>
        <circle cx="12.5" cy="26.5" r="0.7" fill={stroke}/>
        <path d="M22 27h10"/>
      </g>
    ),

    // ภาษี — building (business) w/ cat-ear spire
    business: (
      <g {...p}>
        <rect x="8" y="14" width="28" height="22" rx="1"/>
        <path d="M22 14l-4-6h8l-4 6"/>
        <path d="M13 20h4M21 20h4M29 20h4M13 26h4M21 26h4M29 26h4M13 32h4M21 32h4M29 32h4"/>
      </g>
    ),

    // สัตว์เลี้ยง — big paw (the star of the show)
    paw: (
      <g {...p}>
        <ellipse cx="12" cy="14" rx="3" ry="4"/>
        <ellipse cx="32" cy="14" rx="3" ry="4"/>
        <ellipse cx="6"  cy="24" rx="2.5" ry="3.5"/>
        <ellipse cx="38" cy="24" rx="2.5" ry="3.5"/>
        <path d="M14 36c-4 0-6-2-6-5s4-8 8-8h12c4 0 8 5 8 8s-2 5-6 5z"/>
      </g>
    ),

    // อื่นๆ — three dots horizontal
    'ellipsis-horizontal': (
      <g {...p}>
        <circle cx="12" cy="22" r="2" fill={stroke}/>
        <circle cx="22" cy="22" r="2" fill={stroke}/>
        <circle cx="32" cy="22" r="2" fill={stroke}/>
      </g>
    ),

    // ───────── INCOME (14) ─────────

    // เงินเดือน — briefcase w/ paw latch
    briefcase: (
      <g {...p}>
        <rect x="6" y="14" width="32" height="20" rx="2"/>
        <path d="M16 14V10h12v4"/>
        <path d="M6 24h32"/>
        <circle cx="22" cy="24" r="1.2" fill={stroke}/>
      </g>
    ),

    // โบนัส — 4-point sparkle cluster
    sparkles: (
      <g {...p}>
        <path d="M22 6l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill={stroke}/>
        <path d="M34 22l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill={stroke}/>
        <path d="M10 30l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" fill={stroke}/>
      </g>
    ),

    // ค่าล่วงเวลา — clock w/ cat ears
    time: (
      <g {...p}>
        <circle cx="22" cy="24" r="12"/>
        <path d="M22 16v8l5 3"/>
        <path d="M14 12l-2-3M30 12l2-3"/>
      </g>
    ),

    // ค่าคอมมิชชั่น — bar chart ascending
    'stats-chart': (
      <g {...p}>
        <path d="M6 36h32"/>
        <rect x="10" y="26" width="5" height="10"/>
        <rect x="19" y="18" width="5" height="18"/>
        <rect x="28" y="10" width="5" height="26"/>
        <path d="M10 22l5-4 5-6 5 3"/>
      </g>
    ),

    // รายได้เสริม — wallet w/ paw clasp
    wallet: (
      <g {...p}>
        <rect x="6" y="12" width="32" height="22" rx="3"/>
        <path d="M6 18h32"/>
        <circle cx="32" cy="24" r="2.5"/>
        <circle cx="32" cy="24" r="0.8" fill={stroke}/>
      </g>
    ),

    // ฟรีแลนซ์ — laptop w/ cat on screen
    laptop: (
      <g {...p}>
        <rect x="8" y="10" width="28" height="18" rx="2"/>
        <path d="M4 32h36l-2 2H6z"/>
        <path d="M16 14l-1-2M28 14l1-2"/>
        <circle cx="18" cy="18" r="0.8" fill={stroke}/>
        <circle cx="26" cy="18" r="0.8" fill={stroke}/>
        <path d="M20 22c.7.7 1.3.7 2 .3M24 22c-.7.7-1.3.7-2 .3"/>
      </g>
    ),

    // ขายของ — storefront w/ cat-ear awning
    storefront: (
      <g {...p}>
        <path d="M6 14l2-6h28l2 6v4a4 4 0 0 1-8 0 4 4 0 0 1-8 0 4 4 0 0 1-8 0 4 4 0 0 1-8 0z"/>
        <path d="M8 20v16h28V20"/>
        <rect x="18" y="24" width="8" height="12"/>
        <path d="M14 24h2v4h-2zM28 24h2v4h-2z"/>
      </g>
    ),

    // เงินปันผล — arrow trending up
    'trending-up': (
      <g {...p}>
        <path d="M6 32l10-10 6 6 14-16"/>
        <path d="M28 12h8v8"/>
      </g>
    ),

    // ดอกเบี้ย — cash bill w/ paw seal
    cash: (
      <g {...p}>
        <rect x="4" y="12" width="36" height="20" rx="2"/>
        <circle cx="22" cy="22" r="5"/>
        <path d="M20 20c0-1 1-2 2-2s2 1 2 2-4 1-4 2 1 2 2 2 2-1 2-2"/>
        <circle cx="9" cy="22" r="1" fill={stroke}/>
        <circle cx="35" cy="22" r="1" fill={stroke}/>
      </g>
    ),

    // กำไรจากการลงทุน — analytics (pie + bar)
    analytics: (
      <g {...p}>
        <circle cx="16" cy="18" r="8"/>
        <path d="M16 10v8h8"/>
        <path d="M6 36h32"/>
        <path d="M10 32v4M18 30v6M26 28v8M34 32v4"/>
      </g>
    ),

    // เงินคืนภาษี — receipt w/ cat ear corners
    receipt: (
      <g {...p}>
        <path d="M10 6h24v32l-3-2-3 2-3-2-3 2-3-2-3 2-3-2-3 2z"/>
        <path d="M14 14h16M14 20h16M14 26h10"/>
        <path d="M10 6l-2-3M34 6l2-3"/>
      </g>
    ),

    // รางวัล — trophy w/ cat-ear handles
    trophy: (
      <g {...p}>
        <path d="M14 8h16v8a8 8 0 0 1-16 0z"/>
        <path d="M14 10H10c0 4 2 6 5 6M30 10h4c0 4-2 6-5 6"/>
        <path d="M22 24v6"/>
        <path d="M16 30h12v6H16z"/>
        <path d="M18 8l-2-3M26 8l2-3"/>
      </g>
    ),
  };
};

// Public component — drop-in replacement shape for CatIcon
function CatCategoryIcon({ kind, size = 56, bg, dark = false, strokeColor }) {
  const stroke = strokeColor || (dark ? '#F5EDE0' : '#2A2320');
  const glyphs = CAT_ICON_GLYPHS(stroke);
  const glyph = glyphs[kind] || glyphs['ellipsis-horizontal'];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width={size * 0.82} height={size * 0.82} viewBox="0 0 44 44">
        {glyph}
      </svg>
    </div>
  );
}

// Full catalog for the showcase
const EXPENSE_CATS = [
  { id: 'exp-food',             name: 'อาหาร',               icon: 'fast-food',             color: '#F5A185' },
  { id: 'exp-drinks',           name: 'เครื่องดื่ม/กาแฟ',         icon: 'cafe',                  color: '#B8856B' },
  { id: 'exp-transport',        name: 'เดินทาง',              icon: 'car',                   color: '#8AC5C5' },
  { id: 'exp-fuel',             name: 'น้ำมัน',                icon: 'flame',                 color: '#F0A830' },
  { id: 'exp-public-transport', name: 'ขนส่งสาธารณะ',         icon: 'bus',                   color: '#8AC5C5' },
  { id: 'exp-rent',             name: 'ค่าเช่า/ผ่อนบ้าน',        icon: 'home',                  color: '#D4A544' },
  { id: 'exp-electricity',      name: 'ค่าไฟ',                icon: 'bulb',                  color: '#F0A830' },
  { id: 'exp-water',            name: 'ค่าน้ำ',                icon: 'water',                 color: '#8AC5C5' },
  { id: 'exp-internet',         name: 'ค่าอินเทอร์เน็ต',         icon: 'wifi',                  color: '#6B4A9E' },
  { id: 'exp-phone',            name: 'โทรศัพท์',             icon: 'phone-portrait',        color: '#4A7FC1' },
  { id: 'exp-personal',         name: 'ของใช้ส่วนตัว',         icon: 'basket',                color: '#FFB3C7' },
  { id: 'exp-clothing',         name: 'เสื้อผ้า',              icon: 'shirt',                 color: '#F59FB8' },
  { id: 'exp-shopping',         name: 'ช้อปปิ้ง',              icon: 'bag',                   color: '#F59FB8' },
  { id: 'exp-health',           name: 'สุขภาพ/ยา',           icon: 'medkit',                color: '#9FC9A8' },
  { id: 'exp-exercise',         name: 'ออกกำลังกาย',         icon: 'barbell',               color: '#9FC9A8' },
  { id: 'exp-entertainment',    name: 'บันเทิง',              icon: 'film',                  color: '#F5D988' },
  { id: 'exp-games',            name: 'เกม',                 icon: 'game-controller',       color: '#F5D988' },
  { id: 'exp-subscription',     name: 'Subscription',       icon: 'tv',                    color: '#B5A8DB' },
  { id: 'exp-family',           name: 'ครอบครัว',             icon: 'people',                color: '#F5B8BC' },
  { id: 'exp-date',             name: 'เดท',                 icon: 'heart',                 color: '#FFB3C7' },
  { id: 'exp-social',           name: 'สังสรรค์',              icon: 'wine',                  color: '#F5B8BC' },
  { id: 'exp-gifts',            name: 'ของขวัญ',              icon: 'gift',                  color: '#E8B547' },
  { id: 'exp-education',        name: 'การศึกษา',             icon: 'school',                color: '#B5A8DB' },
  { id: 'exp-books',            name: 'หนังสือ',              icon: 'book',                  color: '#B5A8DB' },
  { id: 'exp-travel',           name: 'ท่องเที่ยว',             icon: 'airplane',              color: '#8AC5C5' },
  { id: 'exp-insurance',        name: 'ประกัน',               icon: 'shield-checkmark',      color: '#A39685' },
  { id: 'exp-installment',      name: 'ผ่อนชำระ',             icon: 'card',                  color: '#6B4A9E' },
  { id: 'exp-tax',              name: 'ภาษี',                 icon: 'business',              color: '#A39685' },
  { id: 'exp-pets',             name: 'สัตว์เลี้ยง',             icon: 'paw',                   color: '#F5A185' },
  { id: 'exp-other',            name: 'อื่นๆ',                 icon: 'ellipsis-horizontal',   color: '#A39685' },
];

const INCOME_CATS = [
  { id: 'inc-salary',            name: 'เงินเดือน',             icon: 'briefcase',            color: '#5CB88A' },
  { id: 'inc-bonus',             name: 'โบนัส',                icon: 'sparkles',             color: '#E8B547' },
  { id: 'inc-overtime',          name: 'ค่าล่วงเวลา',            icon: 'time',                 color: '#F0A830' },
  { id: 'inc-commission',        name: 'ค่าคอมมิชชั่น',          icon: 'stats-chart',          color: '#5CB88A' },
  { id: 'inc-side-income',       name: 'รายได้เสริม',           icon: 'wallet',               color: '#5CB88A' },
  { id: 'inc-freelance',         name: 'ฟรีแลนซ์',             icon: 'laptop',               color: '#4A7FC1' },
  { id: 'inc-selling',           name: 'ขายของ',               icon: 'storefront',           color: '#F5A185' },
  { id: 'inc-dividend',          name: 'เงินปันผล',             icon: 'trending-up',          color: '#6B4A9E' },
  { id: 'inc-interest',          name: 'ดอกเบี้ย',              icon: 'cash',                 color: '#5CB88A' },
  { id: 'inc-investment-profit', name: 'กำไรจากการลงทุน',     icon: 'analytics',            color: '#8AC5C5' },
  { id: 'inc-tax-refund',        name: 'เงินคืนภาษี',            icon: 'receipt',              color: '#E8B547' },
  { id: 'inc-gift-received',     name: 'ได้รับเงิน/ของขวัญ',     icon: 'gift',                 color: '#FFB3C7' },
  { id: 'inc-reward',            name: 'รางวัล',                icon: 'trophy',               color: '#E8B547' },
  { id: 'inc-other',             name: 'อื่นๆ',                  icon: 'ellipsis-horizontal',  color: '#A39685' },
];

Object.assign(window, { CatCategoryIcon, EXPENSE_CATS, INCOME_CATS, CAT_ICON_GLYPHS });
