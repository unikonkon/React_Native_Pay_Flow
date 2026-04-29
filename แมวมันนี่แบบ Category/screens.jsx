// Main app screens — Categories list, Picker modal, Add/Edit category sheet

const { useState, useMemo } = React;

const ORANGE = '#E87A3D';
const CREAM = '#FFF4E8';
const DARK = '#2A2320';
const SURFACE = '#FFFFFF';
const BORDER = '#F0E2CF';
const MUTED = '#8A7A6B';

// ───────── Money formatter ─────────
const money = (n) => '฿' + n.toLocaleString('en-US');

// ───────── Category Card (grid item) ─────────
function CategoryCard({ cat, onClick, big }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: SURFACE,
        border: `1.5px solid ${BORDER}`,
        borderRadius: 20,
        padding: big ? '14px 12px' : '12px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 0 rgba(232,122,61,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <CatIcon kind={cat.icon} bg={cat.color} size={big ? 56 : 48} />
      <div style={{ fontWeight: 600, fontSize: 13, color: DARK, textAlign: 'center', lineHeight: 1.15 }}>{cat.label}</div>
      {cat.count !== undefined && (
        <div style={{ fontSize: 11, color: MUTED, fontFamily: 'IBM Plex Mono, monospace' }}>
          {cat.count} • {money(cat.total)}
        </div>
      )}
    </button>
  );
}

// ───────── List row (alternative compact view) ─────────
function CategoryRow({ cat, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        background: SURFACE, border: `1.5px solid ${BORDER}`, borderRadius: 16,
        padding: '12px 14px', width: '100%', cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      <CatIcon kind={cat.icon} bg={cat.color} size={48} />
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: DARK }}>{cat.label}</div>
        <div style={{ fontSize: 12, color: MUTED, fontFamily: 'IBM Plex Mono, monospace', marginTop: 2 }}>
          {cat.count} รายการ
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 15, color: DARK, fontFamily: 'IBM Plex Mono, monospace' }}>
        {money(cat.total)}
      </div>
    </button>
  );
}

// ───────── Tab switcher ─────────
function TabSwitch({ tab, setTab }) {
  return (
    <div style={{
      display: 'flex', background: '#F5E6D2', borderRadius: 14, padding: 4, gap: 4,
    }}>
      {[['expense','รายจ่าย'], ['income','รายรับ']].map(([key, label]) => (
        <button
          key={key}
          onClick={() => setTab(key)}
          style={{
            flex: 1, padding: '10px 12px', border: 'none', cursor: 'pointer',
            background: tab === key ? SURFACE : 'transparent',
            color: tab === key ? DARK : MUTED,
            fontWeight: 700, fontSize: 14, borderRadius: 10,
            boxShadow: tab === key ? '0 2px 0 rgba(42,35,32,0.06)' : 'none',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ───────── Categories Screen (main) ─────────
function CategoriesScreen({ density, onPickIcon, onAdd, openDetail }) {
  const [tab, setTab] = useState('expense');
  const list = CATEGORIES[tab];

  const totalSpent = list.reduce((a, c) => a + c.total, 0);
  const totalCount = list.reduce((a, c) => a + c.count, 0);

  return (
    <div style={{ background: CREAM, minHeight: '100%', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, color: MUTED, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: 0.5 }}>
              CATEGORIES · เม.ย. 2569
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: DARK, marginTop: 2, letterSpacing: -0.5 }}>
              หมวดหมู่
            </div>
          </div>
          <button
            onClick={onAdd}
            style={{
              width: 44, height: 44, borderRadius: 14, border: 'none',
              background: DARK, color: CREAM, fontSize: 24, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 3px 0 rgba(42,35,32,0.15)',
            }}
          >
            +
          </button>
        </div>

        {/* Summary card */}
        <div style={{
          background: DARK, borderRadius: 22, padding: '18px 20px', color: CREAM,
          display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16,
          backgroundImage: 'radial-gradient(circle at 90% 20%, rgba(232,122,61,0.35) 0, transparent 50%)',
        }}>
          <CatIcon kind={tab === 'expense' ? 'fast-food' : 'salary'} bg={ORANGE} size={56} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: 0.5 }}>
              {tab === 'expense' ? 'รวมรายจ่าย' : 'รวมรายรับ'}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 2, fontFamily: 'IBM Plex Mono, monospace' }}>
              {money(totalSpent)}
            </div>
            <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>
              {list.length} หมวดหมู่ · {totalCount} รายการ
            </div>
          </div>
        </div>

        <TabSwitch tab={tab} setTab={setTab} />
      </div>

      {/* Grid / List */}
      <div style={{ padding: '8px 16px' }}>
        {density === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
          }}>
            {list.map(cat => (
              <CategoryCard key={cat.id} cat={cat} onClick={() => openDetail(cat)} />
            ))}
            <button
              onClick={onAdd}
              style={{
                background: 'transparent', border: `2px dashed ${BORDER}`, borderRadius: 20,
                padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                cursor: 'pointer', minHeight: 110, fontFamily: 'inherit',
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 24, background: '#F5E6D2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, color: ORANGE, fontWeight: 600,
              }}>
                +
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>เพิ่ม</div>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map(cat => (
              <CategoryRow key={cat.id} cat={cat} onClick={() => openDetail(cat)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────── Icon Picker Sheet ─────────
function IconPickerSheet({ open, onClose, onPick, currentIcon, currentColor, onColorChange }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search.trim()) return ICON_GROUPS;
    const q = search.toLowerCase();
    return ICON_GROUPS
      .map(g => ({ ...g, keys: g.keys.filter(k => k.includes(q)) }))
      .filter(g => g.keys.length > 0);
  }, [search]);

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 30,
        background: open ? 'rgba(42,35,32,0.45)' : 'transparent',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'background 0.25s',
        display: 'flex', alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: CREAM, borderRadius: '24px 24px 0 0', width: '100%',
          maxHeight: '80%', display: 'flex', flexDirection: 'column',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 40, height: 4, background: BORDER, borderRadius: 2 }} />
        </div>
        <div style={{ padding: '4px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: DARK }}>เลือกไอคอน</div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: ORANGE, fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>เสร็จสิ้น</button>
        </div>

        {/* Color row */}
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ fontSize: 11, color: MUTED, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: 0.5, padding: '0 4px 8px' }}>
            COLOR
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {COLOR_PALETTE.map(c => (
              <button
                key={c}
                onClick={() => onColorChange(c)}
                style={{
                  flexShrink: 0, width: 36, height: 36, borderRadius: 18,
                  background: c, border: currentColor === c ? `3px solid ${DARK}` : '3px solid transparent',
                  cursor: 'pointer', boxShadow: currentColor === c ? '0 0 0 2px ' + c : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Icon groups */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 16px 24px' }}>
          {filtered.map(group => (
            <div key={group.label} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: MUTED, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: 0.5, padding: '4px 4px 10px' }}>
                {group.label.toUpperCase()}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {group.keys.map(k => {
                  const selected = k === currentIcon;
                  return (
                    <button
                      key={k}
                      onClick={() => onPick(k)}
                      style={{
                        background: selected ? '#FDE7D2' : SURFACE,
                        border: selected ? `2px solid ${ORANGE}` : `1.5px solid ${BORDER}`,
                        borderRadius: 16, padding: 10, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        aspectRatio: '1 / 1', fontFamily: 'inherit',
                      }}
                    >
                      <CatIcon kind={k} bg={currentColor} size={42} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ───────── Add Category Sheet ─────────
function AddCategorySheet({ open, onClose }) {
  const [icon, setIcon] = useState('paw');
  const [color, setColor] = useState(ORANGE);
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 20,
          background: open ? 'rgba(42,35,32,0.45)' : 'transparent',
          pointerEvents: open ? 'auto' : 'none',
          transition: 'background 0.25s',
          display: 'flex', alignItems: 'flex-end',
        }}
        onClick={onClose}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: CREAM, borderRadius: '24px 24px 0 0', width: '100%',
            display: 'flex', flexDirection: 'column', paddingBottom: 28,
            transform: open ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
            <div style={{ width: 40, height: 4, background: BORDER, borderRadius: 2 }} />
          </div>
          <div style={{ padding: '4px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: MUTED, fontSize: 14, cursor: 'pointer' }}>
              ยกเลิก
            </button>
            <div style={{ fontSize: 16, fontWeight: 800, color: DARK }}>หมวดหมู่ใหม่</div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: ORANGE, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              บันทึก
            </button>
          </div>

          {/* Icon preview */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 24px' }}>
            <button
              onClick={() => setPickerOpen(true)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative',
              }}
            >
              <CatIcon kind={icon} bg={color} size={96} />
              <div style={{
                position: 'absolute', bottom: -2, right: -2, background: DARK, color: CREAM,
                fontSize: 11, padding: '4px 10px', borderRadius: 12, fontWeight: 600,
              }}>เปลี่ยน</div>
            </button>
          </div>

          {/* Name input */}
          <div style={{ padding: '0 20px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: MUTED, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: 0.5, marginBottom: 6 }}>
              ชื่อหมวดหมู่
            </div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="เช่น ค่ากาแฟแมวอ้วน"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 14,
                border: `1.5px solid ${BORDER}`, background: SURFACE,
                fontSize: 15, fontFamily: 'inherit', color: DARK, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Type selector */}
          <div style={{ padding: '0 20px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: MUTED, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: 0.5, marginBottom: 6 }}>
              ประเภท
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['expense','รายจ่าย','D9544A'], ['income','รายรับ','3E8B68']].map(([k, l, c]) => (
                <button
                  key={k}
                  onClick={() => setType(k)}
                  style={{
                    flex: 1, padding: '14px 12px',
                    borderRadius: 14,
                    border: type === k ? `2px solid #${c}` : `1.5px solid ${BORDER}`,
                    background: type === k ? `#${c}15` : SURFACE,
                    color: type === k ? `#${c}` : DARK,
                    fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <IconPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(k) => setIcon(k)}
        currentIcon={icon}
        currentColor={color}
        onColorChange={setColor}
      />
    </>
  );
}

// ───────── Detail Drawer ─────────
function DetailSheet({ cat, onClose }) {
  if (!cat) return null;
  const open = !!cat;
  const txns = useMemo(() => {
    const seed = cat.id.charCodeAt(0);
    const days = ['วันนี้', 'เมื่อวาน', '23 เม.ย.', '21 เม.ย.', '18 เม.ย.', '15 เม.ย.'];
    return days.slice(0, Math.min(6, cat.count || 3)).map((d, i) => ({
      day: d,
      title: ['ร้านประจำ','ของฝาก','สมาชิก','ค่าใช้จ่าย','ครั้งที่' + (i+1),'ของขวัญ'][i % 6],
      amount: Math.round((seed * 13 + i * 47) % 800 + 80),
    }));
  }, [cat?.id]);

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 25,
        background: open ? 'rgba(42,35,32,0.5)' : 'transparent',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'background 0.25s',
        display: 'flex', alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: CREAM, borderRadius: '28px 28px 0 0', width: '100%',
          display: 'flex', flexDirection: 'column', paddingBottom: 28,
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: '85%', overflow: 'hidden',
        }}
      >
        {/* Hero */}
        <div style={{
          background: cat.color, padding: '20px 22px 26px', position: 'relative',
          backgroundImage: `radial-gradient(circle at 85% 30%, rgba(255,255,255,0.18) 0, transparent 50%)`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 12,
              width: 36, height: 36, color: '#FFFFFF', fontSize: 18, cursor: 'pointer',
            }}>
              ✕
            </button>
            <button style={{
              background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 12,
              padding: '8px 12px', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
              แก้ไข
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)', borderRadius: 22, padding: 8,
            }}>
              <CatIcon kind={cat.icon} bg="rgba(255,255,255,0)" size={68} strokeColor="#FFFFFF" />
            </div>
            <div style={{ color: '#FFFFFF', flex: 1 }}>
              <div style={{ fontSize: 13, opacity: 0.85, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: 0.5 }}>
                CATEGORY
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 2 }}>{cat.label}</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                {cat.count} รายการในเดือนนี้
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '18px 20px 8px', display: 'flex', gap: 10 }}>
          <div style={{
            flex: 1, background: SURFACE, border: `1.5px solid ${BORDER}`, borderRadius: 16, padding: '12px 14px',
          }}>
            <div style={{ fontSize: 11, color: MUTED, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: 0.5 }}>เดือนนี้</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: DARK, marginTop: 2, fontFamily: 'IBM Plex Mono, monospace' }}>
              {money(cat.total)}
            </div>
          </div>
          <div style={{
            flex: 1, background: SURFACE, border: `1.5px solid ${BORDER}`, borderRadius: 16, padding: '12px 14px',
          }}>
            <div style={{ fontSize: 11, color: MUTED, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: 0.5 }}>เฉลี่ย/ครั้ง</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: DARK, marginTop: 2, fontFamily: 'IBM Plex Mono, monospace' }}>
              {money(Math.round(cat.total / Math.max(cat.count, 1)))}
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div style={{ padding: '12px 20px 4px' }}>
          <div style={{ fontSize: 11, color: MUTED, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: 0.5, marginBottom: 8 }}>
            รายการล่าสุด
          </div>
        </div>
        <div style={{ padding: '0 16px', overflowY: 'auto', flex: 1 }}>
          <div style={{ background: SURFACE, border: `1.5px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
            {txns.map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                borderBottom: i < txns.length - 1 ? `1px solid ${BORDER}` : 'none',
              }}>
                <CatIcon kind={cat.icon} bg={cat.color} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: DARK }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: MUTED, fontFamily: 'IBM Plex Mono, monospace' }}>{t.day}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: DARK, fontFamily: 'IBM Plex Mono, monospace' }}>
                  -{money(t.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.CategoriesScreen = CategoriesScreen;
window.IconPickerSheet = IconPickerSheet;
window.AddCategorySheet = AddCategorySheet;
window.DetailSheet = DetailSheet;
window.CatIconPalette = { ORANGE, CREAM, DARK, SURFACE, BORDER, MUTED };
