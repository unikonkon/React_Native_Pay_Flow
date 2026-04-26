import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

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
