import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

interface PawPrintProps {
  size?: number;
  color?: string;
}

// แบบ 1: Classic — 5 วงกลม (สไตล์เดิม)
export function PawPrint({ size = 12, color = '#E87A3D' }: PawPrintProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="16" r="5" fill={color} />
      <Circle cx="7" cy="8" r="2.8" fill={color} />
      <Circle cx="12" cy="5.5" r="2.5" fill={color} />
      <Circle cx="17" cy="8" r="2.8" fill={color} />
      <Circle cx="4.5" cy="12.5" r="2.2" fill={color} />
    </Svg>
  );
}

// แบบ 2: Detailed — แผ่นรองสามพู + นิ้วทรงรี (ดูสมจริงขึ้น)
export function PawPrintDetailed({ size = 12, color = '#E87A3D' }: PawPrintProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* แผ่นรอง 3 พู */}
      <Circle cx="9" cy="17" r="3" fill={color} />
      <Circle cx="12" cy="18" r="3.2" fill={color} />
      <Circle cx="15" cy="17" r="3" fill={color} />
      {/* นิ้วเท้า 4 นิ้ว */}
      <Ellipse cx="6" cy="10" rx="1.8" ry="2.4" fill={color} />
      <Ellipse cx="10" cy="6.5" rx="1.6" ry="2.2" fill={color} />
      <Ellipse cx="14" cy="6.5" rx="1.6" ry="2.2" fill={color} />
      <Ellipse cx="18" cy="10" rx="1.8" ry="2.4" fill={color} />
    </Svg>
  );
}

// แบบ 3: Outlined — เส้นขอบโปร่ง
export function PawPrintOutlined({ size = 12, color = '#E87A3D' }: PawPrintProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="17" r="4.5" fill="none" stroke={color} strokeWidth="1.6" />
      <Circle cx="6" cy="10" r="2.2" fill="none" stroke={color} strokeWidth="1.6" />
      <Circle cx="10" cy="6.5" r="2" fill="none" stroke={color} strokeWidth="1.6" />
      <Circle cx="14" cy="6.5" r="2" fill="none" stroke={color} strokeWidth="1.6" />
      <Circle cx="18" cy="10" r="2.2" fill="none" stroke={color} strokeWidth="1.6" />
    </Svg>
  );
}

// แบบ 4: WithClaws — มีรอยเล็บเล็ก ๆ เหนือแต่ละนิ้ว
export function PawPrintWithClaws({ size = 12, color = '#E87A3D' }: PawPrintProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* แผ่นรอง + นิ้ว */}
      <Circle cx="12" cy="17" r="4.5" fill={color} />
      <Circle cx="6.5" cy="10.5" r="2.3" fill={color} />
      <Circle cx="10" cy="7" r="2.1" fill={color} />
      <Circle cx="14" cy="7" r="2.1" fill={color} />
      <Circle cx="17.5" cy="10.5" r="2.3" fill={color} />
      {/* เล็บ */}
      <Path d="M 4.6 9 L 5.6 7.6" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M 9 4 L 9.5 2.6" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M 14.5 2.6 L 15 4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M 18.4 7.6 L 19.4 9" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  );
}

// แบบ 5: Heart — แผ่นรองรูปหัวใจ + นิ้วเท้าวงกลม (สไตล์น่ารัก)
export function PawPrintHeart({ size = 12, color = '#E87A3D' }: PawPrintProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* หัวใจคว่ำเป็นแผ่นรอง */}
      <Path
        d="M 12 21 C 12 21 5 16.5 5 12 C 5 10 6.5 9 8 9 C 9.5 9 10.5 10 12 12 C 13.5 10 14.5 9 16 9 C 17.5 9 19 10 19 12 C 19 16.5 12 21 12 21 Z"
        fill={color}
      />
      {/* นิ้วเท้า 4 นิ้ว */}
      <Circle cx="6" cy="6" r="2" fill={color} />
      <Circle cx="10" cy="3.5" r="1.8" fill={color} />
      <Circle cx="14" cy="3.5" r="1.8" fill={color} />
      <Circle cx="18" cy="6" r="2" fill={color} />
    </Svg>
  );
}

// แบบ 6: Chunky — หนาแน่น แผ่นรองและนิ้วเท้าใหญ่ทรงไข่
export function PawPrintChunky({ size = 12, color = '#E87A3D' }: PawPrintProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Ellipse cx="12" cy="17" rx="6.5" ry="5.2" fill={color} />
      <Ellipse cx="5" cy="10" rx="2.8" ry="3" fill={color} />
      <Ellipse cx="9.5" cy="6" rx="2.5" ry="2.8" fill={color} />
      <Ellipse cx="14.5" cy="6" rx="2.5" ry="2.8" fill={color} />
      <Ellipse cx="19" cy="10" rx="2.8" ry="3" fill={color} />
    </Svg>
  );
}

// แบบ 7: Square — แผ่นรองและนิ้วเท้าทรงสี่เหลี่ยมมุมมน
export function PawPrintSquare({ size = 12, color = '#E87A3D' }: PawPrintProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="6.5" y="12" width="11" height="10" rx="3" ry="3" fill={color} />
      <Rect x="3" y="8" width="4.5" height="5" rx="1.5" ry="1.5" fill={color} />
      <Rect x="7.5" y="3.5" width="4" height="4.5" rx="1.4" ry="1.4" fill={color} />
      <Rect x="12.5" y="3.5" width="4" height="4.5" rx="1.4" ry="1.4" fill={color} />
      <Rect x="16.5" y="8" width="4.5" height="5" rx="1.5" ry="1.5" fill={color} />
    </Svg>
  );
}

// แบบ 8: Footstep — รอยเดินคู่ (เฉียงสองรอยเหมือนแมวเดิน)
export function PawPrintFootstep({ size = 12, color = '#E87A3D' }: PawPrintProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* รอยที่ 1 — บน-ซ้าย */}
      <Circle cx="7" cy="9" r="2.4" fill={color} />
      <Circle cx="4" cy="5.5" r="1.3" fill={color} />
      <Circle cx="7.5" cy="4" r="1.2" fill={color} />
      <Circle cx="10.5" cy="5.5" r="1.3" fill={color} />
      {/* รอยที่ 2 — ล่าง-ขวา */}
      <Circle cx="17" cy="18" r="2.4" fill={color} />
      <Circle cx="13.5" cy="14.5" r="1.3" fill={color} />
      <Circle cx="17" cy="13" r="1.2" fill={color} />
      <Circle cx="20.5" cy="14.5" r="1.3" fill={color} />
    </Svg>
  );
}

// แบบ 9: Flower — แผ่นรองเป็นกลุ่มวงกลมเหมือนดอกไม้
export function PawPrintFlower({ size = 12, color = '#E87A3D' }: PawPrintProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* แผ่นรอง — 6 วงกลมเล็กรวมเป็นดอกไม้ */}
      <Circle cx="12" cy="16" r="1.7" fill={color} />
      <Circle cx="9" cy="14" r="1.7" fill={color} />
      <Circle cx="15" cy="14" r="1.7" fill={color} />
      <Circle cx="9.5" cy="18" r="1.7" fill={color} />
      <Circle cx="14.5" cy="18" r="1.7" fill={color} />
      <Circle cx="12" cy="20" r="1.7" fill={color} />
      {/* นิ้วเท้า */}
      <Circle cx="5" cy="9" r="2.2" fill={color} />
      <Circle cx="9.5" cy="6" r="2" fill={color} />
      <Circle cx="14.5" cy="6" r="2" fill={color} />
      <Circle cx="19" cy="9" r="2.2" fill={color} />
    </Svg>
  );
}

// แบบ 10: Slim — เรียวยาวทรงสูง
export function PawPrintSlim({ size = 12, color = '#E87A3D' }: PawPrintProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Ellipse cx="12" cy="17" rx="3.5" ry="5.5" fill={color} />
      <Ellipse cx="6.5" cy="11" rx="1.8" ry="2.8" fill={color} />
      <Ellipse cx="9.5" cy="6.5" rx="1.6" ry="2.5" fill={color} />
      <Ellipse cx="14.5" cy="6.5" rx="1.6" ry="2.5" fill={color} />
      <Ellipse cx="17.5" cy="11" rx="1.8" ry="2.8" fill={color} />
    </Svg>
  );
}
