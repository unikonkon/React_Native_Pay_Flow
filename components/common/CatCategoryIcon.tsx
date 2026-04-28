import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

// Fat-orange-cat themed category glyphs.
// Visual language:
//  • Filled silhouettes (fill = stroke color) for high contrast on any bg
//  • Chunky strokeWidth 2.4, rounded caps/joins → "fat cat" feel
//  • Recurring cat motifs: chubby ear tufts, paw stamps, whisker dots, tail curls
//  • Default fallback = chubby cat face
//
// Icon `kind` strings still match the legacy Ionicons names already stored in
// `lib/constants/categories.ts` and the DB `categories.icon` column, so this is
// a drop-in visual replacement — no data migration needed.

interface CatCategoryIconProps {
  /** Icon key (matches Ionicons names already stored in categories.icon). */
  kind: string;
  /** Outer circle diameter in px. Default 40. */
  size?: number;
  /** Background color for the outer circle (typically `category.color`). */
  bg?: string;
  /** Stroke / fill color for the glyph itself. Defaults to white. */
  strokeColor?: string;
  /** Render only the SVG glyph without a background circle. */
  bare?: boolean;
}

const STROKE_BASE = {
  strokeWidth: 2.4,
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

// Mini paw stamp — 4 toe beans + 1 chubby palm pad
function PawStamp({ x, y, s = 1, color }: { x: number; y: number; s?: number; color: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} fill={color} stroke="none">
      <Ellipse cx={-2.4} cy={-1.6} rx={0.9} ry={1.2} />
      <Ellipse cx={0} cy={-2.6} rx={0.9} ry={1.2} />
      <Ellipse cx={2.4} cy={-1.6} rx={0.9} ry={1.2} />
      <Ellipse cx={-3.4} cy={1.2} rx={0.8} ry={1} />
      <Path d="M-2 0.5c-1.6 0-2.6 1.2-2.6 2.6 0 1.6 1.4 2.6 3.4 2.6h3c2 0 3.4-1 3.4-2.6 0-1.4-1-2.6-2.6-2.6z" />
    </G>
  );
}

// Whisker dots — small "freckle" dots that reinforce the cat-face vibe
function Whiskers({ cx, cy, color, spread = 3 }: { cx: number; cy: number; color: string; spread?: number }) {
  return (
    <G fill={color} stroke="none">
      <Circle cx={cx - spread} cy={cy} r={0.55} />
      <Circle cx={cx - spread + 0.4} cy={cy + 1.4} r={0.45} />
      <Circle cx={cx + spread} cy={cy} r={0.55} />
      <Circle cx={cx + spread - 0.4} cy={cy + 1.4} r={0.45} />
    </G>
  );
}

// Reusable chubby cat face — used as the fallback "อื่นๆ" icon
function FatCatFace({ stroke }: { stroke: string }) {
  return (
    <G>
      {/* Ears */}
      <Path d="M11 16 L10 8 L17 13 Z" fill={stroke} stroke="none" />
      <Path d="M33 16 L34 8 L27 13 Z" fill={stroke} stroke="none" />
      {/* Chubby head */}
      <Path
        d="M22 12 C32 12 36 18 36 26 C36 33 30 38 22 38 C14 38 8 33 8 26 C8 18 12 12 22 12 Z"
        fill={stroke}
        stroke="none"
      />
      {/* Eyes */}
      <Ellipse cx={17} cy={24} rx={1.5} ry={2} fill="#2A2320" stroke="none" />
      <Ellipse cx={27} cy={24} rx={1.5} ry={2} fill="#2A2320" stroke="none" />
      <Circle cx={17.5} cy={23.4} r={0.5} fill={stroke} stroke="none" />
      <Circle cx={27.5} cy={23.4} r={0.5} fill={stroke} stroke="none" />
      {/* Cheeks (orange blush) */}
      <Circle cx={13.5} cy={28} r={1.5} fill="#E87A3D" stroke="none" opacity={0.55} />
      <Circle cx={30.5} cy={28} r={1.5} fill="#E87A3D" stroke="none" opacity={0.55} />
      {/* Nose + mouth */}
      <Path d="M22 27 l-1 1.2 h2 z" fill="#E87A3D" stroke="none" />
      <Path
        d="M22 28.4 q-1.5 2 -3 1.2 M22 28.4 q1.5 2 3 1.2"
        stroke="#2A2320"
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
      />
      {/* Whiskers */}
      <Path
        d="M9 26 h4 M10 28.5 h3 M35 26 h-4 M34 28.5 h-3"
        stroke="#2A2320"
        strokeWidth={0.8}
        strokeLinecap="round"
        opacity={0.7}
      />
    </G>
  );
}

function renderGlyph(kind: string, stroke: string) {
  const p = { ...STROKE_BASE, stroke };
  // Solid filled style: same color, no stroke seams (used for primary silhouettes)
  const f = { fill: stroke, stroke: 'none' as const };

  switch (kind) {
    // ───────── EXPENSE ─────────

    case 'fast-food':
      return (
        <G>
          {/* Burger top bun (filled, dome-shaped) */}
          <Path
            d="M9 19 Q9 12 22 12 Q35 12 35 19 Z"
            {...f}
          />
          <Circle cx={16} cy={16} r={0.6} fill={stroke === '#FFFFFF' ? '#E87A3D' : stroke} />
          <Circle cx={22} cy={14.5} r={0.6} fill={stroke === '#FFFFFF' ? '#E87A3D' : stroke} />
          <Circle cx={28} cy={16} r={0.6} fill={stroke === '#FFFFFF' ? '#E87A3D' : stroke} />
          {/* Filling layer */}
          <Path d="M8 21 Q22 17 36 21 L36 22 Q22 26 8 22 Z" {...f} />
          {/* Patty */}
          <Path d="M8 23 H36 V26 H8 Z" {...f} />
          {/* Bottom bun */}
          <Path d="M9 26 Q22 32 35 26 L33 30 Q22 34 11 30 Z" {...f} />
          {/* Cat ears on top */}
          <Path d="M14 13 L13 9 L17 11 Z" {...f} />
          <Path d="M30 13 L31 9 L27 11 Z" {...f} />
        </G>
      );

    case 'cafe':
      return (
        <G>
          {/* Cup body filled */}
          <Path
            d="M11 17 H29 V26 Q29 33 22 33 Q15 33 15 28 Q11 27 11 22 Z"
            {...f}
          />
          {/* Handle */}
          <Path d="M29 19 Q34 19 34 23 Q34 27 29 27" stroke={stroke} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          {/* Cat ears on rim */}
          <Path d="M13 17 L12 11 L17 14 Z" {...f} />
          <Path d="M27 17 L28 11 L23 14 Z" {...f} />
          {/* Steam */}
          <Path d="M16 9 q1 1.5 0 3 M22 8 q1 1.5 0 3 M28 9 q1 1.5 0 3" {...p} />
          {/* Cat face on cup (negative space using bg color via opacity) */}
          <Circle cx={19} cy={24} r={0.9} fill="#2A2320" />
          <Circle cx={25} cy={24} r={0.9} fill="#2A2320" />
          <Path d="M21 27 q1 1 2 0" stroke="#2A2320" strokeWidth={1} fill="none" strokeLinecap="round" />
        </G>
      );

    case 'car':
      return (
        <G>
          {/* Car body — chubby */}
          <Path
            d="M7 27 Q7 22 9 19 L13 14 Q15 12 18 12 H26 Q29 12 31 14 L35 19 Q37 22 37 27 V31 Q37 33 35 33 H9 Q7 33 7 31 Z"
            {...f}
          />
          {/* Windows (cut with bg) */}
          <Path d="M14 16 H21 L23 21 H12 Z" fill="#2A2320" opacity={0.35} stroke="none" />
          <Path d="M23 16 H28 L31 21 H25 Z" fill="#2A2320" opacity={0.35} stroke="none" />
          {/* Wheels */}
          <Circle cx={13} cy={33} r={3.2} fill="#2A2320" stroke="none" />
          <Circle cx={31} cy={33} r={3.2} fill="#2A2320" stroke="none" />
          <Circle cx={13} cy={33} r={1.2} fill={stroke} stroke="none" />
          <Circle cx={31} cy={33} r={1.2} fill={stroke} stroke="none" />
          {/* Cat ears on roof */}
          <Path d="M16 12 L15 8 L19 10 Z" {...f} />
          <Path d="M28 12 L29 8 L25 10 Z" {...f} />
        </G>
      );

    case 'flame':
      return (
        <G>
          <Path
            d="M22 7 C25 12 31 14 31 22 C31 28 27 33 22 33 C17 33 13 28 13 22 C13 18 16 16 18 13 C19 15 21 16 22 14 C22 12 22 9 22 7 Z"
            {...f}
          />
          {/* Inner flame (cut) */}
          <Path
            d="M22 18 C23 21 26 22 26 26 C26 28 24 30 22 30 C20 30 18 28 18 26 C18 24 19 23 21 22 C21 21 22 19 22 18 Z"
            fill="#E87A3D"
            stroke="none"
          />
          {/* Cat ear flick on top */}
          <Path d="M22 6 L20 3 L23 4 Z" {...f} />
        </G>
      );

    case 'bus':
      return (
        <G>
          <Rect x={8} y={9} width={28} height={22} rx={4} {...f} />
          {/* Windows */}
          <Rect x={11} y={12} width={6} height={6} rx={1} fill="#2A2320" opacity={0.4} stroke="none" />
          <Rect x={19} y={12} width={6} height={6} rx={1} fill="#2A2320" opacity={0.4} stroke="none" />
          <Rect x={27} y={12} width={6} height={6} rx={1} fill="#2A2320" opacity={0.4} stroke="none" />
          {/* Front line + headlights */}
          <Circle cx={12} cy={26} r={1.1} fill="#2A2320" stroke="none" />
          <Circle cx={32} cy={26} r={1.1} fill="#2A2320" stroke="none" />
          {/* Wheels */}
          <Circle cx={14} cy={33} r={2.4} fill="#2A2320" stroke="none" />
          <Circle cx={30} cy={33} r={2.4} fill="#2A2320" stroke="none" />
          {/* Cat ears */}
          <Path d="M14 9 L13 5 L17 7 Z" {...f} />
          <Path d="M30 9 L31 5 L27 7 Z" {...f} />
        </G>
      );

    case 'home':
      return (
        <G>
          {/* House silhouette */}
          <Path
            d="M22 8 L37 21 V35 Q37 36 36 36 H8 Q7 36 7 35 V21 Z"
            {...f}
          />
          {/* Door (cut) */}
          <Rect x={19} y={26} width={6} height={10} rx={1} fill="#2A2320" opacity={0.4} stroke="none" />
          <Circle cx={23} cy={31} r={0.5} fill={stroke} stroke="none" />
          {/* Window */}
          <Rect x={11} y={24} width={5} height={5} rx={0.6} fill="#2A2320" opacity={0.35} stroke="none" />
          <Rect x={28} y={24} width={5} height={5} rx={0.6} fill="#2A2320" opacity={0.35} stroke="none" />
          {/* Cat ears on roof */}
          <Path d="M16 16 L15 11 L20 13 Z" {...f} />
          <Path d="M28 16 L29 11 L24 13 Z" {...f} />
        </G>
      );

    case 'bulb':
      return (
        <G>
          {/* Bulb */}
          <Path
            d="M22 7 C29 7 32 12 32 17 C32 21 29 23 28 26 V29 H16 V26 C15 23 12 21 12 17 C12 12 15 7 22 7 Z"
            {...f}
          />
          {/* Base */}
          <Rect x={16} y={29} width={12} height={3} rx={1} {...f} />
          <Rect x={17} y={32} width={10} height={2.5} rx={1} {...f} />
          <Path d="M19 35 H25" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" />
          {/* Cat eyes inside */}
          <Circle cx={19} cy={17} r={1} fill="#2A2320" stroke="none" />
          <Circle cx={25} cy={17} r={1} fill="#2A2320" stroke="none" />
          <Path d="M20.5 21 q1.5 1.5 3 0" stroke="#2A2320" strokeWidth={1.1} strokeLinecap="round" fill="none" />
          {/* Sparkles */}
          <Path d="M8 11 l1 1 M36 11 l-1 1 M8 22 l1 -1 M36 22 l-1 -1" {...p} />
        </G>
      );

    case 'water':
      return (
        <G>
          <Path
            d="M22 6 C15 14 12 19 12 25 Q12 35 22 35 Q32 35 32 25 C32 19 29 14 22 6 Z"
            {...f}
          />
          {/* Highlight */}
          <Path d="M16 22 Q15 27 18 30" stroke="#FFFFFF" strokeWidth={1.6} fill="none" opacity={0.5} strokeLinecap="round" />
          {/* Cat face inside */}
          <Circle cx={19} cy={24} r={1} fill="#2A2320" stroke="none" />
          <Circle cx={25} cy={24} r={1} fill="#2A2320" stroke="none" />
          <Path d="M22 27 l-1 1 h2 z" fill="#2A2320" stroke="none" />
        </G>
      );

    case 'wifi':
      return (
        <G>
          <Path d="M7 16 Q22 5 37 16" {...p} strokeWidth={3} />
          <Path d="M11 22 Q22 13 33 22" {...p} strokeWidth={3} />
          <Path d="M15 28 Q22 22 29 28" {...p} strokeWidth={3} />
          <Circle cx={22} cy={34} r={2.6} {...f} />
          {/* Cat ears on the dot */}
          <Path d="M19.5 32 L18.8 29.5 L21 31 Z" {...f} />
          <Path d="M24.5 32 L25.2 29.5 L23 31 Z" {...f} />
        </G>
      );

    case 'phone-portrait':
      return (
        <G>
          <Rect x={12} y={6} width={20} height={32} rx={4} {...f} />
          <Rect x={14} y={11} width={16} height={20} rx={1} fill="#2A2320" opacity={0.35} stroke="none" />
          <Circle cx={22} cy={35} r={1} fill="#2A2320" stroke="none" />
          {/* Cat face on screen */}
          <Circle cx={18.5} cy={19} r={1} fill={stroke} stroke="none" />
          <Circle cx={25.5} cy={19} r={1} fill={stroke} stroke="none" />
          <Path d="M20 24 q2 2 4 0" stroke={stroke} strokeWidth={1.4} fill="none" strokeLinecap="round" />
          {/* Cat ears */}
          <Path d="M16 7 L15 3 L19 5 Z" {...f} />
          <Path d="M28 7 L29 3 L25 5 Z" {...f} />
        </G>
      );

    case 'basket':
      return (
        <G>
          <Path d="M8 17 H36 L33 35 Q33 36 32 36 H12 Q11 36 11 35 Z" {...f} />
          {/* Handles */}
          <Path d="M14 17 L18 9 L21 9" {...p} strokeWidth={2.6} />
          <Path d="M30 17 L26 9 L23 9" {...p} strokeWidth={2.6} />
          {/* Stripes (cut) */}
          <Path
            d="M16 22 V32 M22 22 V32 M28 22 V32"
            stroke="#2A2320"
            strokeWidth={1.5}
            opacity={0.3}
            strokeLinecap="round"
          />
          <PawStamp x={22} y={28} s={0.55} color="#2A2320" />
        </G>
      );

    case 'shirt':
      return (
        <G>
          <Path
            d="M9 13 L16 8 L18 11 Q22 13 26 11 L28 8 L35 13 L33 19 Q31 19 30 18 V35 Q30 36 29 36 H15 Q14 36 14 35 V18 Q13 19 11 19 Z"
            {...f}
          />
          <PawStamp x={22} y={26} s={0.6} color="#2A2320" />
        </G>
      );

    case 'bag':
      return (
        <G>
          <Path
            d="M11 14 H33 L31 35 Q31 36 30 36 H14 Q13 36 13 35 Z"
            {...f}
          />
          {/* Handle */}
          <Path d="M16 14 Q16 7 22 7 Q28 7 28 14" stroke={stroke} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          {/* Cat face */}
          <Circle cx={19} cy={23} r={1} fill="#2A2320" stroke="none" />
          <Circle cx={25} cy={23} r={1} fill="#2A2320" stroke="none" />
          <Path d="M21 27 q1 1 2 0" stroke="#2A2320" strokeWidth={1.2} fill="none" strokeLinecap="round" />
          <Whiskers cx={22} cy={25} color="#2A2320" spread={4} />
        </G>
      );

    case 'medkit':
      return (
        <G>
          <Rect x={6} y={13} width={32} height={22} rx={4} {...f} />
          <Path d="M16 13 V9 Q16 8 17 8 H27 Q28 8 28 9 V13 Z" {...f} />
          {/* Cross (cut) */}
          <Rect x={20} y={17} width={4} height={14} rx={1} fill="#2A2320" stroke="none" />
          <Rect x={15} y={22} width={14} height={4} rx={1} fill="#2A2320" stroke="none" />
          <PawStamp x={32} y={31} s={0.45} color="#2A2320" />
        </G>
      );

    case 'barbell':
      return (
        <G>
          <Rect x={4} y={17} width={4} height={10} rx={1.4} {...f} />
          <Rect x={36} y={17} width={4} height={10} rx={1.4} {...f} />
          <Rect x={8} y={19} width={4} height={6} rx={1} {...f} />
          <Rect x={32} y={19} width={4} height={6} rx={1} {...f} />
          <Rect x={12} y={20} width={20} height={4} rx={1.5} {...f} />
          {/* Cat face on bar */}
          <Circle cx={20} cy={22} r={0.7} fill="#2A2320" stroke="none" />
          <Circle cx={24} cy={22} r={0.7} fill="#2A2320" stroke="none" />
        </G>
      );

    case 'film':
      return (
        <G>
          <Rect x={6} y={9} width={32} height={26} rx={3} {...f} />
          {/* Sprocket holes (cut) */}
          <Rect x={9} y={12} width={3} height={3} rx={0.5} fill="#2A2320" stroke="none" />
          <Rect x={9} y={20} width={3} height={3} rx={0.5} fill="#2A2320" stroke="none" />
          <Rect x={9} y={28} width={3} height={3} rx={0.5} fill="#2A2320" stroke="none" />
          <Rect x={32} y={12} width={3} height={3} rx={0.5} fill="#2A2320" stroke="none" />
          <Rect x={32} y={20} width={3} height={3} rx={0.5} fill="#2A2320" stroke="none" />
          <Rect x={32} y={28} width={3} height={3} rx={0.5} fill="#2A2320" stroke="none" />
          {/* Center cat face */}
          <Circle cx={22} cy={22} r={6} fill="#2A2320" stroke="none" opacity={0.85} />
          <Circle cx={19.5} cy={21} r={1} fill={stroke} stroke="none" />
          <Circle cx={24.5} cy={21} r={1} fill={stroke} stroke="none" />
          <Path d="M20 24 q2 2 4 0" stroke={stroke} strokeWidth={1.2} fill="none" strokeLinecap="round" />
        </G>
      );

    case 'game-controller':
      return (
        <G>
          <Path
            d="M11 16 H33 Q39 16 39 22 V27 Q39 31 35 31 Q33 31 32 30 L29 27 H15 L12 30 Q11 31 9 31 Q5 31 5 27 V22 Q5 16 11 16 Z"
            {...f}
          />
          {/* D-pad cross */}
          <Rect x={11} y={22} width={2} height={6} rx={0.5} fill="#2A2320" stroke="none" />
          <Rect x={9} y={24} width={6} height={2} rx={0.5} fill="#2A2320" stroke="none" />
          {/* Buttons */}
          <Circle cx={29} cy={22} r={1.2} fill="#2A2320" stroke="none" />
          <Circle cx={33} cy={25} r={1.2} fill="#2A2320" stroke="none" />
          {/* Cat ears */}
          <Path d="M14 16 L13 12 L17 14 Z" {...f} />
          <Path d="M30 16 L31 12 L27 14 Z" {...f} />
        </G>
      );

    case 'tv':
      return (
        <G>
          <Rect x={6} y={11} width={32} height={22} rx={3} {...f} />
          {/* Screen cut */}
          <Rect x={9} y={14} width={26} height={16} rx={1.5} fill="#2A2320" opacity={0.4} stroke="none" />
          {/* Stand */}
          <Path d="M16 33 V36 H28 V33" stroke={stroke} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          {/* Cat antenna ears */}
          <Path d="M16 11 L14 6 L18 9 Z" {...f} />
          <Path d="M28 11 L30 6 L26 9 Z" {...f} />
          {/* Cat face on screen */}
          <Circle cx={18} cy={21} r={1} fill={stroke} stroke="none" />
          <Circle cx={26} cy={21} r={1} fill={stroke} stroke="none" />
          <Path d="M20 25 q2 1.5 4 0" stroke={stroke} strokeWidth={1.3} fill="none" strokeLinecap="round" />
        </G>
      );

    case 'people':
      return (
        <G>
          {/* Two chubby cat heads side by side */}
          <Path d="M11 17 L10 11 L15 13 Z" {...f} />
          <Path d="M21 17 L22 11 L17 13 Z" {...f} />
          <Circle cx={16} cy={18} r={6} {...f} />
          <Path d="M27 17 L26 11 L31 13 Z" {...f} />
          <Path d="M37 17 L38 11 L33 13 Z" {...f} />
          <Circle cx={32} cy={18} r={6} {...f} />
          {/* Bodies */}
          <Path d="M7 36 Q7 26 16 26 Q25 26 25 36 Z" {...f} />
          <Path d="M19 36 Q19 26 28 26 Q37 26 37 36 Z" {...f} opacity={0.85} />
          {/* Eyes */}
          <Circle cx={14} cy={18} r={0.7} fill="#2A2320" stroke="none" />
          <Circle cx={18} cy={18} r={0.7} fill="#2A2320" stroke="none" />
          <Circle cx={30} cy={18} r={0.7} fill="#2A2320" stroke="none" />
          <Circle cx={34} cy={18} r={0.7} fill="#2A2320" stroke="none" />
        </G>
      );

    case 'heart':
      return (
        <G>
          <Path
            d="M22 35 C20 33 8 25 8 17 C8 12 12 9 16 9 Q19 9 22 12 Q25 9 28 9 C32 9 36 12 36 17 C36 25 24 33 22 35 Z"
            {...f}
          />
          {/* Cat ears on heart */}
          <Path d="M14 12 L12 7 L17 9 Z" {...f} />
          <Path d="M30 12 L32 7 L27 9 Z" {...f} />
          {/* Eyes — heart shaped */}
          <Path d="M17 18 q-1.5 -2 -3 0 q1.5 3 3 4 q1.5 -1 3 -4 q-1.5 -2 -3 0 z" fill="#2A2320" stroke="none" />
          <Path d="M27 18 q-1.5 -2 -3 0 q1.5 3 3 4 q1.5 -1 3 -4 q-1.5 -2 -3 0 z" fill="#2A2320" stroke="none" />
          <Path d="M20 25 q2 2 4 0" stroke="#2A2320" strokeWidth={1.4} fill="none" strokeLinecap="round" />
        </G>
      );

    case 'wine':
      return (
        <G>
          <Path
            d="M13 8 H31 L30 17 Q30 23 22 24 Q14 23 14 17 Z"
            {...f}
          />
          {/* Wine inside (cut) */}
          <Path d="M15 13 H29 L28 17 Q28 21 22 22 Q16 21 16 17 Z" fill="#E87A3D" opacity={0.7} stroke="none" />
          {/* Stem + base */}
          <Path d="M22 24 V34" stroke={stroke} strokeWidth={2.4} strokeLinecap="round" />
          <Rect x={15} y={34} width={14} height={2.6} rx={1.2} {...f} />
          {/* Cat ears */}
          <Path d="M16 8 L15 4 L19 6 Z" {...f} />
          <Path d="M28 8 L29 4 L25 6 Z" {...f} />
        </G>
      );

    case 'gift':
      return (
        <G>
          <Rect x={6} y={18} width={32} height={18} rx={2.5} {...f} />
          {/* Lid */}
          <Rect x={4} y={14} width={36} height={6} rx={1.5} {...f} />
          {/* Ribbon */}
          <Rect x={20} y={14} width={4} height={22} fill="#2A2320" opacity={0.4} stroke="none" />
          {/* Bow loops */}
          <Path d="M22 14 Q16 8 18 6 Q22 6 22 14 Z" {...f} />
          <Path d="M22 14 Q28 8 26 6 Q22 6 22 14 Z" {...f} />
          {/* Cat ears on bow */}
          <Path d="M18 8 L17 5 L20 7 Z" {...f} />
          <Path d="M26 8 L27 5 L24 7 Z" {...f} />
        </G>
      );

    case 'school':
      return (
        <G>
          {/* Mortar board */}
          <Path d="M22 9 L4 17 L22 25 L40 17 Z" {...f} />
          {/* Base */}
          <Path d="M11 21 V31 Q11 35 22 35 Q33 35 33 31 V21" stroke={stroke} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          {/* Tassel */}
          <Path d="M37 17 V25" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" />
          <Circle cx={37} cy={27} r={1.4} {...f} />
          {/* Cat face below */}
          <Circle cx={19} cy={29} r={0.7} fill="#2A2320" stroke="none" />
          <Circle cx={25} cy={29} r={0.7} fill="#2A2320" stroke="none" />
        </G>
      );

    case 'book':
      return (
        <G>
          <Path
            d="M8 9 Q15 7 22 9 Q29 7 36 9 V34 Q29 32 22 34 Q15 32 8 34 Z"
            {...f}
          />
          {/* Spine line */}
          <Path d="M22 11 V34" stroke="#2A2320" strokeWidth={1.4} opacity={0.4} />
          <PawStamp x={30} y={20} s={0.55} color="#2A2320" />
          <PawStamp x={14} y={26} s={0.5} color="#2A2320" />
        </G>
      );

    case 'airplane':
      return (
        <G>
          <Path
            d="M22 5 Q24 7 24 14 V18 L38 25 V28 L24 26 V32 L28 35 V37 L22 35 L16 37 V35 L20 32 V26 L6 28 V25 L20 18 V14 Q20 7 22 5 Z"
            {...f}
          />
        </G>
      );

    case 'shield-checkmark':
      return (
        <G>
          <Path
            d="M22 6 L37 11 V21 Q37 31 22 38 Q7 31 7 21 V11 Z"
            {...f}
          />
          {/* Check */}
          <Path d="M14 22 L20 28 L31 16" stroke="#2A2320" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {/* Cat ears */}
          <Path d="M15 9 L14 5 L18 7 Z" {...f} />
          <Path d="M29 9 L30 5 L26 7 Z" {...f} />
        </G>
      );

    case 'card':
      return (
        <G>
          <Rect x={4} y={11} width={36} height={24} rx={3.5} {...f} />
          {/* Magnetic stripe */}
          <Rect x={4} y={16} width={36} height={4} fill="#2A2320" opacity={0.4} stroke="none" />
          {/* Chip */}
          <Rect x={9} y={24} width={7} height={5} rx={1} fill="#2A2320" opacity={0.55} stroke="none" />
          {/* Number lines */}
          <Path d="M22 27 H32 M22 30 H30" stroke="#2A2320" strokeWidth={1.2} opacity={0.4} strokeLinecap="round" />
          <PawStamp x={35} y={31} s={0.4} color="#2A2320" />
        </G>
      );

    case 'business':
      return (
        <G>
          <Rect x={8} y={13} width={28} height={24} rx={2} {...f} />
          {/* Roof */}
          <Path d="M22 13 L18 7 H26 Z" {...f} />
          {/* Window grid (cut) */}
          <G fill="#2A2320" opacity={0.4} stroke="none">
            <Rect x={12} y={18} width={4} height={4} rx={0.5} />
            <Rect x={20} y={18} width={4} height={4} rx={0.5} />
            <Rect x={28} y={18} width={4} height={4} rx={0.5} />
            <Rect x={12} y={25} width={4} height={4} rx={0.5} />
            <Rect x={28} y={25} width={4} height={4} rx={0.5} />
            <Rect x={12} y={32} width={4} height={4} rx={0.5} />
            <Rect x={28} y={32} width={4} height={4} rx={0.5} />
          </G>
          {/* Door (cat-shaped) */}
          <Path d="M20 30 H24 V37 H20 Z" fill="#2A2320" opacity={0.55} stroke="none" />
        </G>
      );

    case 'paw':
      return (
        <G {...f}>
          <Ellipse cx={12} cy={14} rx={3.5} ry={4.5} />
          <Ellipse cx={32} cy={14} rx={3.5} ry={4.5} />
          <Ellipse cx={6} cy={24} rx={3} ry={3.8} />
          <Ellipse cx={38} cy={24} rx={3} ry={3.8} />
          <Path
            d="M14 38 C9 38 7 35 7 31 C7 26 12 22 17 22 H27 C32 22 37 26 37 31 C37 35 35 38 30 38 Z"
          />
        </G>
      );

    case 'package':
      return (
        <G>
          <Path d="M6 16 L22 8 L38 16 V32 L22 40 L6 32 Z" {...f} />
          {/* Edges */}
          <Path d="M6 16 L22 24 L38 16 M22 24 V40" stroke="#2A2320" strokeWidth={1.4} opacity={0.4} fill="none" />
          {/* Tape band */}
          <Path d="M14 12 L30 20" stroke="#2A2320" strokeWidth={2} opacity={0.45} />
          <PawStamp x={28} y={28} s={0.55} color="#2A2320" />
        </G>
      );

    case 'piggy-bank':
      return (
        <G>
          {/* Body */}
          <Ellipse cx={22} cy={26} rx={15} ry={9.5} {...f} />
          {/* Cat ears */}
          <Path d="M14 19 L13 13 L18 16 Z" {...f} />
          <Path d="M30 19 L31 13 L26 16 Z" {...f} />
          {/* Coin slot */}
          <Rect x={19} y={17} width={6} height={1.6} rx={0.6} fill="#2A2320" stroke="none" />
          {/* Eye + nose */}
          <Circle cx={29.5} cy={24} r={1} fill="#2A2320" stroke="none" />
          <Circle cx={36} cy={26} r={0.9} fill="#2A2320" stroke="none" />
          {/* Cheek blush */}
          <Circle cx={32.5} cy={28} r={1.4} fill="#E87A3D" opacity={0.55} stroke="none" />
          {/* Legs */}
          <Path d="M13 35 V38 M18 36 V38 M26 36 V38 M31 35 V38" stroke={stroke} strokeWidth={2.4} strokeLinecap="round" />
          {/* Tail curl */}
          <Path d="M7 24 q-3 -1 -3 -4 q0 -3 3 -3" stroke={stroke} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        </G>
      );

    case 'heart-hand':
    case 'heart-circle':
      return (
        <G>
          {/* Heart */}
          <Path
            d="M22 22 C20 20 14 16 14 12 A3.5 3.5 0 0 1 22 10 A3.5 3.5 0 0 1 30 12 C30 16 24 20 22 22 Z"
            {...f}
          />
          {/* Hands cradling */}
          <Path
            d="M6 28 Q11 28 14 32 L17 36 H27 L30 32 Q33 28 38 28 V31 Q34 31 32 33 L29 38 H15 L12 33 Q10 31 6 31 Z"
            {...f}
          />
          {/* Cat ears on heart */}
          <Path d="M16 12 L14 8 L19 10 Z" {...f} />
          <Path d="M28 12 L30 8 L25 10 Z" {...f} />
        </G>
      );

    case 'gold-bars':
      return (
        <G>
          <Path d="M17 19 H27 L29 24 H15 Z" {...f} />
          <Path d="M13 24 H31 L33 29 H11 Z" {...f} />
          <Path d="M7 29 H37 L40 35 H4 Z" {...f} />
          {/* Sparkle */}
          <Path d="M22 7 l1 3 3 1 -3 1 -1 3 -1 -3 -3 -1 3 -1 z" {...f} />
          <Path d="M10 13 l0.6 1.6 1.6 0.6 -1.6 0.6 -0.6 1.6 -0.6 -1.6 -1.6 -0.6 1.6 -0.6 z" {...f} />
        </G>
      );

    // ───────── INCOME ─────────

    case 'briefcase':
      return (
        <G>
          <Rect x={6} y={13} width={32} height={22} rx={3} {...f} />
          {/* Handle */}
          <Path d="M16 13 V9 Q16 7 18 7 H26 Q28 7 28 9 V13" stroke={stroke} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          {/* Front clasp band */}
          <Rect x={6} y={20} width={32} height={3.5} fill="#2A2320" opacity={0.4} stroke="none" />
          <Rect x={20} y={21} width={4} height={3.5} rx={0.5} fill="#2A2320" stroke="none" />
          {/* Cat ears */}
          <Path d="M14 13 L13 9 L17 11 Z" {...f} />
          <Path d="M30 13 L31 9 L27 11 Z" {...f} />
        </G>
      );

    case 'sparkles':
      return (
        <G>
          <Path d="M22 5 L24.5 13.5 L33 16 L24.5 18.5 L22 27 L19.5 18.5 L11 16 L19.5 13.5 Z" {...f} />
          <Path d="M34 24 L35.2 27.5 L38.7 28.7 L35.2 30 L34 33.5 L32.8 30 L29.3 28.7 L32.8 27.5 Z" {...f} />
          <Path d="M10 30 L10.8 32.4 L13.2 33.2 L10.8 34 L10 36.4 L9.2 34 L6.8 33.2 L9.2 32.4 Z" {...f} />
        </G>
      );

    case 'time':
      return (
        <G>
          <Circle cx={22} cy={24} r={13} {...f} />
          {/* Inner face */}
          <Circle cx={22} cy={24} r={10.5} fill="#2A2320" opacity={0.25} stroke="none" />
          {/* Hands */}
          <Path d="M22 16 V24 L28 28" stroke={stroke} strokeWidth={2.6} fill="none" strokeLinecap="round" />
          <Circle cx={22} cy={24} r={1.2} fill={stroke} stroke="none" />
          {/* Cat ears */}
          <Path d="M13 14 L12 9 L17 12 Z" {...f} />
          <Path d="M31 14 L32 9 L27 12 Z" {...f} />
        </G>
      );

    case 'stats-chart':
      return (
        <G>
          {/* Bars (filled) */}
          <Rect x={9} y={24} width={6} height={12} rx={1.5} {...f} />
          <Rect x={19} y={16} width={6} height={20} rx={1.5} {...f} />
          <Rect x={29} y={9} width={6} height={27} rx={1.5} {...f} />
          {/* Trend arrow */}
          <Path d="M9 22 L17 16 L23 18 L33 8" stroke={stroke} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M28 8 H33 V13" stroke={stroke} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </G>
      );

    case 'wallet':
      return (
        <G>
          <Rect x={6} y={11} width={32} height={24} rx={3.5} {...f} />
          {/* Flap */}
          <Path d="M6 16 H38" stroke="#2A2320" strokeWidth={1.5} opacity={0.4} />
          {/* Coin slot */}
          <Path d="M28 22 H40 V28 H28 Q24 28 24 25 Q24 22 28 22 Z" {...f} />
          <Circle cx={32} cy={25} r={1.6} fill="#2A2320" stroke="none" />
          {/* Cat ears */}
          <Path d="M14 11 L13 7 L17 9 Z" {...f} />
          <Path d="M30 11 L31 7 L27 9 Z" {...f} />
        </G>
      );

    case 'laptop':
      return (
        <G>
          <Path d="M9 9 H35 Q37 9 37 11 V28 H7 V11 Q7 9 9 9 Z" {...f} />
          {/* Screen */}
          <Rect x={10} y={12} width={24} height={13} rx={1} fill="#2A2320" opacity={0.4} stroke="none" />
          {/* Base */}
          <Path d="M3 30 H41 L40 33 Q40 34 39 34 H5 Q4 34 4 33 Z" {...f} />
          {/* Cat face on screen */}
          <Circle cx={18} cy={17} r={1} fill={stroke} stroke="none" />
          <Circle cx={26} cy={17} r={1} fill={stroke} stroke="none" />
          <Path d="M20 21 q2 2 4 0" stroke={stroke} strokeWidth={1.4} fill="none" strokeLinecap="round" />
        </G>
      );

    case 'storefront':
      return (
        <G>
          {/* Awning */}
          <Path d="M5 13 L8 7 H36 L39 13 V17 Q39 20 36 20 Q33 20 32 17 Q31 20 28 20 Q25 20 24 17 Q23 20 20 20 Q17 20 16 17 Q15 20 12 20 Q9 20 8 17 Q7 20 5 17 Z" {...f} />
          {/* Body */}
          <Path d="M8 20 V36 H36 V20" stroke={stroke} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          {/* Door */}
          <Rect x={18} y={24} width={8} height={12} rx={0.6} {...f} />
          {/* Windows */}
          <Rect x={11} y={24} width={4} height={5} rx={0.6} {...f} />
          <Rect x={29} y={24} width={4} height={5} rx={0.6} {...f} />
        </G>
      );

    case 'trending-up':
      return (
        <G>
          <Path d="M5 32 L17 20 L23 26 L36 12" stroke={stroke} strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M28 12 H38 V22" stroke={stroke} strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={5} cy={32} r={2} {...f} />
          <Circle cx={17} cy={20} r={1.6} {...f} />
          <Circle cx={23} cy={26} r={1.6} {...f} />
        </G>
      );

    case 'cash':
      return (
        <G>
          <Rect x={4} y={11} width={36} height={22} rx={2.5} {...f} />
          {/* Inner border */}
          <Rect x={7} y={14} width={30} height={16} rx={1.5} fill="none" stroke="#2A2320" strokeWidth={1.2} opacity={0.35} />
          {/* Center coin face */}
          <Circle cx={22} cy={22} r={6} fill="#2A2320" opacity={0.2} stroke="none" />
          <Circle cx={22} cy={22} r={6} fill="none" stroke="#2A2320" strokeWidth={1.6} opacity={0.7} />
          <Path d="M22 18 V19 M22 25 V26 M19 22 H25 M19 22 q0 -1.5 1.5 -2 h3 q1.5 0 1.5 1.5 q0 1 -1 1.5 H21 q-1 0.5 -1 1.5 q0 1.5 1.5 1.5 h3 q1.5 -0.5 1.5 -2"
            stroke="#2A2320" strokeWidth={1.4} fill="none" strokeLinecap="round" />
          {/* Corner $ */}
          <Circle cx={9} cy={22} r={1.4} fill="#2A2320" stroke="none" />
          <Circle cx={35} cy={22} r={1.4} fill="#2A2320" stroke="none" />
        </G>
      );

    case 'analytics':
      return (
        <G>
          {/* Pie / donut */}
          <Circle cx={16} cy={17} r={9} {...f} />
          <Path d="M16 8 V17 H25" stroke="#2A2320" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d="M16 17 L24 13 A9 9 0 0 0 16 8 Z" fill="#2A2320" opacity={0.45} stroke="none" />
          {/* Bars */}
          <Rect x={6} y={30} width={5} height={6} rx={1} {...f} />
          <Rect x={14} y={28} width={5} height={8} rx={1} {...f} />
          <Rect x={22} y={26} width={5} height={10} rx={1} {...f} />
          <Rect x={30} y={24} width={5} height={12} rx={1} {...f} />
        </G>
      );

    case 'receipt':
      return (
        <G>
          <Path d="M10 6 H34 V38 L31 36 L28 38 L25 36 L22 38 L19 36 L16 38 L13 36 L10 38 Z" {...f} />
          {/* Lines */}
          <Path d="M14 13 H30 M14 19 H30 M14 25 H26" stroke="#2A2320" strokeWidth={1.6} opacity={0.45} strokeLinecap="round" />
          <PawStamp x={28} y={31} s={0.5} color="#2A2320" />
        </G>
      );

    case 'trophy':
      return (
        <G>
          <Path d="M14 8 H30 V18 Q30 24 22 24 Q14 24 14 18 Z" {...f} />
          {/* Side handles */}
          <Path d="M14 11 H10 Q9 11 9 12 V14 Q9 18 14 18" stroke={stroke} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d="M30 11 H34 Q35 11 35 12 V14 Q35 18 30 18" stroke={stroke} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          {/* Stem + base */}
          <Rect x={20} y={24} width={4} height={5} {...f} />
          <Rect x={14} y={29} width={16} height={4} rx={1} {...f} />
          <Rect x={12} y={33} width={20} height={3} rx={1} {...f} />
          {/* Star + ears */}
          <Path d="M16 8 L15 4 L19 6 Z" {...f} />
          <Path d="M28 8 L29 4 L25 6 Z" {...f} />
          <Path d="M22 14 l0.8 1.8 2 0.3 -1.4 1.3 0.3 2 -1.7 -1 -1.7 1 0.3 -2 -1.4 -1.3 2 -0.3 z" fill="#2A2320" stroke="none" />
        </G>
      );

    // ───────── EXTRAS (laundry, salary, network, savings, gold-coin, donate, notebook, beauty) ─────────

    case 'laundry':
      return (
        <G>
          {/* Body */}
          <Rect x={7} y={8} width={30} height={32} rx={4} {...f} />
          {/* Control panel divider */}
          <Path d="M7 14 H37" stroke="#2A2320" strokeWidth={1.4} opacity={0.45} strokeLinecap="round" />
          {/* Buttons */}
          <Circle cx={11} cy={11} r={1} fill="#2A2320" stroke="none" />
          <Circle cx={15} cy={11} r={1} fill="#2A2320" stroke="none" />
          <Rect x={26} y={9.5} width={8} height={3} rx={0.6} fill="#2A2320" opacity={0.5} stroke="none" />
          {/* Drum / window */}
          <Circle cx={22} cy={26} r={9} fill="#2A2320" opacity={0.4} stroke="none" />
          <Circle cx={22} cy={26} r={9} fill="none" stroke="#2A2320" strokeWidth={1.2} opacity={0.55} />
          {/* Bubbles */}
          <Circle cx={19} cy={23} r={1.4} {...f} />
          <Circle cx={25} cy={26} r={1.6} {...f} />
          <Circle cx={20} cy={29} r={1.2} {...f} />
          {/* Cat ears on top */}
          <Path d="M13 8 L12 4 L16 6 Z" {...f} />
          <Path d="M31 8 L32 4 L28 6 Z" {...f} />
        </G>
      );

    case 'salary':
      return (
        <G>
          {/* Bill peeking out (green) */}
          <Rect x={11} y={5} width={22} height={14} rx={1.5} fill="#3E8B68" stroke="none" />
          <Rect x={11} y={5} width={22} height={14} rx={1.5} fill="none" stroke="#FFFFFF" strokeWidth={1} opacity={0.45} />
          {/* Coin badge on bill */}
          <Circle cx={22} cy={12} r={3.2} fill="#FFFFFF" stroke="none" />
          <Circle cx={22} cy={12} r={3.2} fill="none" stroke="#3E8B68" strokeWidth={0.9} />
          <Circle cx={22} cy={12} r={1.1} fill="#3E8B68" stroke="none" />
          {/* Cat ears on bill */}
          <Path d="M15 5 L14 1 L18 3 Z" fill="#3E8B68" stroke="none" />
          <Path d="M29 5 L30 1 L26 3 Z" fill="#3E8B68" stroke="none" />
          {/* Envelope body */}
          <Path d="M6 17 H38 V36 Q38 37 37 37 H7 Q6 37 6 36 Z" {...f} />
          {/* Envelope flap V */}
          <Path d="M6 17 L22 28 L38 17" fill="none" stroke="#2A2320" strokeWidth={1.5} opacity={0.5} strokeLinecap="round" strokeLinejoin="round" />
        </G>
      );

    case 'network':
      return (
        <G>
          {/* Connection lines from center to 4 corners */}
          <Path
            d="M22 22 L8 8 M22 22 L36 8 M22 22 L8 36 M22 22 L36 36"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.85}
            fill="none"
          />
          {/* 4 satellite nodes */}
          <Circle cx={7} cy={7} r={3} {...f} />
          <Circle cx={37} cy={7} r={3} {...f} />
          <Circle cx={7} cy={37} r={3} {...f} />
          <Circle cx={37} cy={37} r={3} {...f} />
          {/* Center hub */}
          <Circle cx={22} cy={22} r={7.5} {...f} />
          {/* Cat ears on hub */}
          <Path d="M17 18 L16 13 L20 16 Z" {...f} />
          <Path d="M27 18 L28 13 L24 16 Z" {...f} />
          {/* Cat face */}
          <Circle cx={19.5} cy={22} r={0.9} fill="#2A2320" stroke="none" />
          <Circle cx={24.5} cy={22} r={0.9} fill="#2A2320" stroke="none" />
          <Path d="M21 25 q1 1 2 0" stroke="#2A2320" strokeWidth={1.2} fill="none" strokeLinecap="round" />
        </G>
      );

    case 'savings':
      return (
        <G>
          {/* 3 stacked coin layers (largest at bottom) */}
          <Rect x={5} y={32} width={34} height={6} rx={3} {...f} />
          <Rect x={9} y={25} width={26} height={6} rx={3} {...f} />
          {/* Top coin = cat head */}
          <Rect x={13} y={18} width={18} height={6} rx={3} {...f} />
          {/* Cat ears on top */}
          <Path d="M16 18 L15 12 L19 16 Z" {...f} />
          <Path d="M28 18 L29 12 L25 16 Z" {...f} />
          {/* Eyes on top coin */}
          <Circle cx={19} cy={21} r={0.7} fill="#2A2320" stroke="none" />
          <Circle cx={25} cy={21} r={0.7} fill="#2A2320" stroke="none" />
          {/* Edge highlight strokes */}
          <Path d="M9 35 H35 M13 28 H31" stroke="#2A2320" strokeWidth={0.9} opacity={0.4} strokeLinecap="round" />
          {/* Up arrow on side (growth indicator) */}
          <Path d="M5 14 V8 M3 11 L5 8 L7 11" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* Sparkle */}
          <Path d="M37 11 l0.4 1 1 0.4 -1 0.4 -0.4 1 -0.4 -1 -1 -0.4 1 -0.4 z" {...f} />
        </G>
      );

    case 'gold-coin':
      return (
        <G>
          {/* Big coin */}
          <Circle cx={22} cy={24} r={14} {...f} />
          {/* Inner darker ring (depth) */}
          <Circle cx={22} cy={24} r={11} fill="#2A2320" opacity={0.18} stroke="none" />
          <Circle cx={22} cy={24} r={11} fill="none" stroke="#2A2320" strokeWidth={1.1} opacity={0.45} />
          {/* Engraved cat ears */}
          <Path d="M15 19 L14 14 L18 17 Z" fill="#2A2320" opacity={0.55} stroke="none" />
          <Path d="M29 19 L30 14 L26 17 Z" fill="#2A2320" opacity={0.55} stroke="none" />
          {/* Engraved cat face */}
          <Circle cx={18} cy={23} r={1} fill="#2A2320" stroke="none" />
          <Circle cx={26} cy={23} r={1} fill="#2A2320" stroke="none" />
          <Path d="M20 27 q2 1.5 4 0" stroke="#2A2320" strokeWidth={1.4} fill="none" strokeLinecap="round" />
          {/* Sparkles */}
          <Path d="M37 8 l0.7 1.8 1.8 0.7 -1.8 0.7 -0.7 1.8 -0.7 -1.8 -1.8 -0.7 1.8 -0.7 z" {...f} />
          <Path d="M6 14 l0.4 1 1 0.4 -1 0.4 -0.4 1 -0.4 -1 -1 -0.4 1 -0.4 z" {...f} />
        </G>
      );

    case 'donate':
      return (
        <G>
          {/* Floating heart with cat ears */}
          <Path
            d="M22 16 C20 14 14 11 14 7 A3 3 0 0 1 22 5 A3 3 0 0 1 30 7 C30 11 24 14 22 16 Z"
            {...f}
          />
          <Path d="M14 8 L13 4 L17 6 Z" {...f} />
          <Path d="M30 8 L31 4 L27 6 Z" {...f} />
          {/* Sparkles around heart */}
          <Path d="M5 11 l0.5 1.2 1.2 0.5 -1.2 0.5 -0.5 1.2 -0.5 -1.2 -1.2 -0.5 1.2 -0.5 z" {...f} />
          <Path d="M37 11 l0.5 1.2 1.2 0.5 -1.2 0.5 -0.5 1.2 -0.5 -1.2 -1.2 -0.5 1.2 -0.5 z" {...f} />
          {/* Offering bowl below */}
          <Path d="M6 22 H38 Q38 30 32 34 Q26 37 22 37 Q18 37 12 34 Q6 30 6 22 Z" {...f} />
          {/* Bowl base */}
          <Rect x={14} y={37} width={16} height={2.4} rx={0.8} {...f} />
        </G>
      );

    case 'notebook':
      return (
        <G>
          {/* Notebook cover */}
          <Rect x={8} y={6} width={28} height={32} rx={2} {...f} />
          {/* Spiral binding rings on left */}
          <Circle cx={8} cy={11} r={1.6} fill="#2A2320" stroke="none" />
          <Circle cx={8} cy={17} r={1.6} fill="#2A2320" stroke="none" />
          <Circle cx={8} cy={23} r={1.6} fill="#2A2320" stroke="none" />
          <Circle cx={8} cy={29} r={1.6} fill="#2A2320" stroke="none" />
          <Circle cx={8} cy={35} r={1.6} fill="#2A2320" stroke="none" />
          {/* Title bar (cut) */}
          <Rect x={13} y={11} width={20} height={3} rx={0.6} fill="#2A2320" opacity={0.45} stroke="none" />
          {/* Lines */}
          <Path d="M13 19 H30 M13 23 H30 M13 27 H26" stroke="#2A2320" strokeWidth={1.2} opacity={0.4} strokeLinecap="round" />
          {/* Paw stamp on cover */}
          <PawStamp x={26} y={33} s={0.55} color="#2A2320" />
        </G>
      );

    case 'beauty':
      return (
        <G>
          {/* Lipstick tip (orange) */}
          <Path d="M17 14 L17 6 L22 3 L27 6 L27 14 Z" fill="#E87A3D" stroke="none" />
          {/* Cap rim */}
          <Rect x={15} y={14} width={14} height={5} rx={1} {...f} />
          {/* Tube body */}
          <Rect x={14} y={19} width={16} height={21} rx={2} {...f} />
          {/* Stripe */}
          <Path d="M14 24 H30" stroke="#2A2320" strokeWidth={1.4} opacity={0.45} strokeLinecap="round" />
          {/* Heart accent on tube */}
          <Path
            d="M22 33 C21 32 18.5 30.5 18.5 28.5 A1.5 1.5 0 0 1 22 28 A1.5 1.5 0 0 1 25.5 28.5 C25.5 30.5 23 32 22 33 Z"
            fill="#E87A3D"
            stroke="none"
          />
          {/* Whisker dots */}
          <Circle cx={18} cy={36} r={0.5} fill="#2A2320" stroke="none" />
          <Circle cx={26} cy={36} r={0.5} fill="#2A2320" stroke="none" />
          {/* Sparkles */}
          <Path d="M7 11 l0.5 1.2 1.2 0.5 -1.2 0.5 -0.5 1.2 -0.5 -1.2 -1.2 -0.5 1.2 -0.5 z" {...f} />
          <Path d="M37 14 l0.5 1.2 1.2 0.5 -1.2 0.5 -0.5 1.2 -0.5 -1.2 -1.2 -0.5 1.2 -0.5 z" {...f} />
        </G>
      );

    // ───────── FOOD EXTRAS (noodles, dessert, fruit) ─────────

    // ก๋วยเตี๋ยว/บะหมี่ — chubby bowl + steam + chopsticks + cat face
    case 'noodles':
      return (
        <G>
          {/* Steam wisps */}
          <Path d="M14 5 q2 2 0 5" stroke={stroke} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Path d="M22 3 q2 2 0 5" stroke={stroke} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Path d="M30 5 q2 2 0 5" stroke={stroke} strokeWidth={2} fill="none" strokeLinecap="round" />
          {/* Cat ears poking up from bowl rim */}
          <Path d="M12 17 L11 12 L16 15 Z" {...f} />
          <Path d="M32 17 L33 12 L28 15 Z" {...f} />
          {/* Bowl rim (chunky lip) */}
          <Path d="M5 17 H39 V20 Q22 23 5 20 Z" {...f} />
          {/* Bowl body — chubby trapezoid */}
          <Path d="M7 21 H37 L33 35 Q22 39 11 35 Z" {...f} />
          {/* Noodle squiggles peeking over rim */}
          <Path d="M13 16 q2 -3 4 0 M20 16 q2 -3 4 0 M27 16 q2 -3 4 0" stroke="#2A2320" strokeWidth={1.3} fill="none" strokeLinecap="round" opacity={0.55} />
          {/* Chopsticks lifted from bowl */}
          <Path d="M30 8 L36 28" stroke="#6B4F35" strokeWidth={2.2} fill="none" strokeLinecap="round" />
          <Path d="M33 7 L38 26" stroke="#6B4F35" strokeWidth={2.2} fill="none" strokeLinecap="round" />
          {/* Cat face on bowl */}
          <Circle cx={18} cy={27} r={1} fill="#2A2320" stroke="none" />
          <Circle cx={26} cy={27} r={1} fill="#2A2320" stroke="none" />
          <Circle cx={14} cy={30} r={1.2} fill="#E87A3D" opacity={0.55} stroke="none" />
          <Circle cx={30} cy={30} r={1.2} fill="#E87A3D" opacity={0.55} stroke="none" />
          <Path d="M21 30 q1 1 2 0" stroke="#2A2320" strokeWidth={1.1} fill="none" strokeLinecap="round" />
          {/* Whiskers */}
          <Path d="M9 28 h2.5 M10 30 h2 M35 28 h-2.5 M34 30 h-2" stroke="#2A2320" strokeWidth={0.7} strokeLinecap="round" opacity={0.55} />
        </G>
      );

    // ของหวาน — fat cupcake w/ cherry, fluted wrapper, frosting cat face
    case 'dessert':
      return (
        <G>
          {/* Cherry stem */}
          <Path d="M22 9 q-2 -3 -5 -5" stroke="#6B4F35" strokeWidth={1.6} fill="none" strokeLinecap="round" />
          {/* Cherry */}
          <Circle cx={22} cy={9} r={3} fill="#E11D48" stroke="none" />
          <Path d="M21 7.5 q1 -1 2 0" stroke="#FFFFFF" strokeWidth={1} fill="none" strokeLinecap="round" opacity={0.85} />
          {/* Frosting cat ears */}
          <Path d="M14 14 L13 9 L18 12 Z" {...f} />
          <Path d="M30 14 L31 9 L26 12 Z" {...f} />
          {/* Frosting swirl — chubby dome */}
          <Path
            d="M9 25 Q9 14 22 13 Q35 14 35 25 Q35 26 33 26 H11 Q9 26 9 25 Z"
            {...f}
          />
          {/* Wrapper top band */}
          <Path d="M9 26 H35 V29 H9 Z" {...f} />
          {/* Fluted wrapper */}
          <Path
            d="M11 29 L13 38 L16 29 L18 38 L21 29 L23 38 L26 29 L28 38 L31 29 L33 38 V29 Z"
            {...f}
          />
          <Path d="M14 29 V37 M19 29 V37 M25 29 V37 M30 29 V37" stroke="#2A2320" strokeWidth={0.9} opacity={0.35} />
          {/* Cat face on frosting */}
          <Circle cx={17} cy={20} r={1} fill="#2A2320" stroke="none" />
          <Circle cx={27} cy={20} r={1} fill="#2A2320" stroke="none" />
          <Circle cx={13.5} cy={23} r={1.2} fill="#E87A3D" opacity={0.55} stroke="none" />
          <Circle cx={30.5} cy={23} r={1.2} fill="#E87A3D" opacity={0.55} stroke="none" />
          <Path d="M21 23 q1 1 2 0" stroke="#2A2320" strokeWidth={1.1} fill="none" strokeLinecap="round" />
        </G>
      );

    // ผลไม้ — fat apple w/ leaf, dimple, cat-ears tuft, cheek blush
    case 'fruit':
      return (
        <G>
          {/* Stem */}
          <Path d="M22 11 L22 7" stroke="#6B4F35" strokeWidth={2.2} fill="none" strokeLinecap="round" />
          {/* Leaf — cat-ear shape */}
          <Path d="M22 9 Q28 4 33 7 Q31 13 24 11 Z" fill="#5CB88A" stroke="none" />
          <Path d="M24 9 q3 0 5 -1.5" stroke="#FFFFFF" strokeWidth={0.9} fill="none" strokeLinecap="round" opacity={0.7} />
          {/* Apple body — chubby double-lobe */}
          <Path
            d="M22 12 Q13 11 10 22 Q9 34 16 37 Q19 38 22 36 Q25 38 28 37 Q35 34 34 22 Q31 11 22 12 Z"
            {...f}
          />
          {/* Top center dimple */}
          <Path d="M21 13 q1 1 2 0" stroke="#2A2320" strokeWidth={1.1} fill="none" strokeLinecap="round" opacity={0.5} />
          {/* Cat ears tuft on apple top */}
          <Path d="M16 14 L15 10 L19 12 Z" {...f} />
          <Path d="M28 14 L29 10 L25 12 Z" {...f} />
          {/* Cat face */}
          <Circle cx={18} cy={25} r={1.1} fill="#2A2320" stroke="none" />
          <Circle cx={26} cy={25} r={1.1} fill="#2A2320" stroke="none" />
          {/* Cheeks (apple blush) */}
          <Circle cx={14} cy={29} r={1.5} fill="#E87A3D" opacity={0.55} stroke="none" />
          <Circle cx={30} cy={29} r={1.5} fill="#E87A3D" opacity={0.55} stroke="none" />
          {/* Mouth */}
          <Path d="M22 29 q-1.5 1.5 -3 0.4 M22 29 q1.5 1.5 3 0.4" stroke="#2A2320" strokeWidth={1.1} fill="none" strokeLinecap="round" />
          {/* Whiskers */}
          <Path d="M11 27 h2.5 M12 29 h2 M33 27 h-2.5 M32 29 h-2" stroke="#2A2320" strokeWidth={0.8} strokeLinecap="round" opacity={0.6} />
        </G>
      );

    // ───────── MISC / FALLBACKS ─────────

    case 'cart':
      return (
        <G>
          <Path d="M4 9 H8 L11 14 H38 L34 28 H14 Z" {...f} />
          {/* Lines */}
          <Path d="M19 14 V28 M27 14 V28" stroke="#2A2320" strokeWidth={1.4} opacity={0.4} />
          {/* Wheels */}
          <Circle cx={17} cy={34} r={2.6} {...f} />
          <Circle cx={31} cy={34} r={2.6} {...f} />
          <Circle cx={17} cy={34} r={1} fill="#2A2320" stroke="none" />
          <Circle cx={31} cy={34} r={1} fill="#2A2320" stroke="none" />
        </G>
      );

    case 'pricetag':
      return (
        <G>
          <Path d="M6 10 H26 L38 22 L26 34 H6 Z" {...f} />
          <Circle cx={28} cy={22} r={2.4} fill="#2A2320" stroke="none" />
          <Circle cx={28} cy={22} r={0.8} fill={stroke} stroke="none" />
          <PawStamp x={15} y={26} s={0.6} color="#2A2320" />
        </G>
      );

    case 'star':
      return (
        <G>
          <Path d="M22 4 L27.5 15.2 L40 17 L31 26 L33.2 38.5 L22 32.6 L10.8 38.5 L13 26 L4 17 L16.5 15.2 Z" {...f} />
          {/* Cat face inside */}
          <Circle cx={19} cy={20} r={0.9} fill="#2A2320" stroke="none" />
          <Circle cx={25} cy={20} r={0.9} fill="#2A2320" stroke="none" />
          <Path d="M20.5 23 q1.5 1.5 3 0" stroke="#2A2320" strokeWidth={1.2} fill="none" strokeLinecap="round" />
        </G>
      );

    // Aliases for icons used in SUGGESTED_EXPENSE_CATEGORIES
    case 'construct':
      return (
        <G>
          {/* Wrench */}
          <Path d="M28 8 Q34 8 34 14 Q34 18 30 19 L18 31 Q15 34 12 31 Q9 28 12 25 L24 13 Q23 9 28 8 Z" {...f} />
          <Circle cx={29} cy={13} r={1.3} fill="#2A2320" stroke="none" />
          {/* Spark */}
          <Path d="M36 22 l1 2 2 1 -2 1 -1 2 -1 -2 -2 -1 2 -1 z" {...f} />
        </G>
      );

    case 'car-sport':
      return (
        <G>
          <Path
            d="M5 28 V25 L9 18 Q11 16 14 16 H30 Q33 16 35 18 L39 25 V28 Q39 31 36 31 Q34 31 33 30 V32 H29 V30 H15 V32 H11 V30 Q10 31 8 31 Q5 31 5 28 Z"
            {...f}
          />
          {/* Windshield */}
          <Path d="M13 21 L16 16 H28 L31 21 Z" fill="#2A2320" opacity={0.45} stroke="none" />
          {/* Wheels */}
          <Circle cx={12} cy={31} r={2.6} fill="#2A2320" stroke="none" />
          <Circle cx={32} cy={31} r={2.6} fill="#2A2320" stroke="none" />
          {/* Speed lines */}
          <Path d="M3 23 H7 M3 26 H6" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" />
        </G>
      );

    case 'body':
      return (
        <G>
          {/* Cat-person mascot */}
          <Path d="M18 10 L17 5 L21 7 Z" {...f} />
          <Path d="M26 10 L27 5 L23 7 Z" {...f} />
          <Circle cx={22} cy={12} r={5.5} {...f} />
          {/* Eyes */}
          <Circle cx={20} cy={12} r={0.7} fill="#2A2320" stroke="none" />
          <Circle cx={24} cy={12} r={0.7} fill="#2A2320" stroke="none" />
          {/* Body */}
          <Path d="M14 30 L17 18 H27 L30 30 V37 H14 Z" {...f} />
          {/* Arms */}
          <Path d="M14 22 L9 28 M30 22 L35 28" stroke={stroke} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        </G>
      );

    case 'ellipsis-horizontal':
    default:
      return <FatCatFace stroke={stroke} />;
  }
}

export function CatCategoryIcon({
  kind,
  size = 40,
  bg = '#A39685',
  strokeColor = '#FFFFFF',
  bare = false,
}: CatCategoryIconProps) {
  const inner = (
    <Svg width={size * (bare ? 1 : 0.88)} height={size * (bare ? 1 : 0.88)} viewBox="0 0 44 44">
      {renderGlyph(kind, strokeColor)}
    </Svg>
  );

  if (bare) return inner;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {inner}
    </View>
  );
}

// Single source of truth — all available cat-themed icon keys, grouped by
// theme for nicer rendering inside pickers (AddCategoryModal etc.).
export const CAT_CATEGORY_ICON_KEYS = [
  // Food & drinks
  'fast-food', 'noodles', 'dessert', 'fruit', 'cafe', 'wine',
  // Transport
  'car', 'car-sport', 'bus', 'airplane',
  // Home & utilities
  'home', 'bulb', 'water', 'wifi', 'flame', 'phone-portrait', 'laundry',
  // Shopping & lifestyle
  'cart', 'basket', 'shirt', 'bag', 'pricetag', 'beauty', 'gift',
  // Health & body
  'medkit', 'barbell', 'body',
  // Entertainment
  'film', 'game-controller', 'tv', 'sparkles', 'star',
  // People, pets & relationships
  'people', 'heart', 'paw', 'donate', 'heart-hand',
  // Education
  'school', 'book', 'notebook',
  // Work & business
  'briefcase', 'business', 'salary', 'storefront', 'laptop', 'time', 'network',
  // Money & savings
  'cash', 'wallet', 'card', 'receipt', 'piggy-bank', 'savings', 'gold-bars', 'gold-coin',
  // Investment & analytics
  'trending-up', 'stats-chart', 'analytics', 'shield-checkmark', 'trophy',
  // Tools & misc
  'package', 'construct', 'ellipsis-horizontal',
] as const;
