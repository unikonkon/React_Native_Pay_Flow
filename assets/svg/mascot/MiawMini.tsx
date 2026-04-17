import Svg, { Circle, Ellipse, G, Line, Path, Polygon } from 'react-native-svg';

interface MiawMiniProps {
  size?: number;
  expression?: 'happy' | 'neutral' | 'sad';
}

export function MiawMini({ size = 32, expression = 'happy' }: MiawMiniProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Polygon points="12,24 20,4 28,22" fill="#E87A3D" />
      <Polygon points="16,22 20,10 24,22" fill="#FFB3C7" opacity={0.6} />
      <Polygon points="36,22 44,4 52,24" fill="#E87A3D" />
      <Polygon points="40,22 44,10 48,22" fill="#FFB3C7" opacity={0.6} />
      <Circle cx="32" cy="36" r="22" fill="#E87A3D" />
      <G opacity={0.85}>
        <Line x1="27" y1="20" x2="37" y2="20" stroke="#E8B547" strokeWidth={1.8} strokeLinecap="round" />
        <Line x1="28" y1="23.5" x2="36" y2="23.5" stroke="#E8B547" strokeWidth={1.5} strokeLinecap="round" />
        <Line x1="29" y1="27" x2="35" y2="27" stroke="#E8B547" strokeWidth={1.2} strokeLinecap="round" />
      </G>
      {expression === 'happy' ? (
        <>
          <Path d="M22,34 Q25,31 28,34" stroke="#1A1A1A" strokeWidth={2.2} fill="none" strokeLinecap="round" />
          <Path d="M36,34 Q39,31 42,34" stroke="#1A1A1A" strokeWidth={2.2} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <Circle cx="25" cy="34" r="3.5" fill="#1A1A1A" />
          <Circle cx="39" cy="34" r="3.5" fill="#1A1A1A" />
          <Circle cx="26" cy="33" r="1.2" fill="#FFD84A" />
          <Circle cx="40" cy="33" r="1.2" fill="#FFD84A" />
        </>
      )}
      <Ellipse cx="18" cy="39" rx="4" ry="2.5" fill="#FFB3C7" opacity={0.5} />
      <Ellipse cx="46" cy="39" rx="4" ry="2.5" fill="#FFB3C7" opacity={0.5} />
      <Ellipse cx="32" cy="38.5" rx="1.8" ry="1.3" fill="#B8531E" />
      {expression === 'sad' ? (
        <Path d="M28,44 Q32,41 36,44" stroke="#B8531E" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      ) : expression === 'happy' ? (
        <Path d="M28,42 Q32,46 36,42" stroke="#B8531E" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      ) : (
        <Line x1="29" y1="43" x2="35" y2="43" stroke="#B8531E" strokeWidth={1.2} strokeLinecap="round" />
      )}
      <G opacity={0.4} stroke="#FFB3C7" strokeWidth={0.8}>
        <Line x1="6" y1="35" x2="18" y2="37" />
        <Line x1="5" y1="39" x2="18" y2="39" />
        <Line x1="6" y1="43" x2="18" y2="41" />
        <Line x1="46" y1="37" x2="58" y2="35" />
        <Line x1="46" y1="39" x2="59" y2="39" />
        <Line x1="46" y1="41" x2="58" y2="43" />
      </G>
    </Svg>
  );
}
