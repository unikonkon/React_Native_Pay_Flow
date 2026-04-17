import Svg, { Line, Circle } from 'react-native-svg';

interface GoldCracksProps {
  width?: number;
  height?: number;
  opacity?: number;
  direction?: 'radial' | 'horizontal';
}

export function GoldCracks({ width = 100, height = 40, opacity = 0.2, direction = 'horizontal' }: GoldCracksProps) {
  const color = '#D4A544';

  if (direction === 'horizontal') {
    return (
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line x1="0" y1={height / 2} x2={width * 0.35} y2={height * 0.3} stroke={color} strokeWidth={1} opacity={opacity} />
        <Line x1={width * 0.35} y1={height * 0.3} x2={width * 0.6} y2={height * 0.6} stroke={color} strokeWidth={0.8} opacity={opacity} />
        <Line x1={width * 0.6} y1={height * 0.6} x2={width} y2={height * 0.45} stroke={color} strokeWidth={1} opacity={opacity} />
        <Circle cx={width * 0.35} cy={height * 0.3} r={1.5} fill={color} opacity={opacity} />
        <Circle cx={width * 0.6} cy={height * 0.6} r={1.2} fill={color} opacity={opacity} />
        <Circle cx={width} cy={height * 0.45} r={1} fill={color} opacity={opacity} />
      </Svg>
    );
  }

  const cx = width / 2;
  const cy = height / 2;
  const lines = [
    { x: cx - width * 0.4, y: cy - height * 0.3 },
    { x: cx + width * 0.35, y: cy - height * 0.35 },
    { x: cx - width * 0.3, y: cy + height * 0.4 },
    { x: cx + width * 0.4, y: cy + height * 0.3 },
    { x: cx - width * 0.15, y: cy - height * 0.45 },
    { x: cx + width * 0.1, y: cy + height * 0.45 },
  ];

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {lines.map((pt, i) => (
        <Line key={`l${i}`} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke={color} strokeWidth={0.8} opacity={opacity} />
      ))}
      {lines.map((pt, i) => (
        <Circle key={`c${i}`} cx={pt.x} cy={pt.y} r={1.2} fill={color} opacity={opacity} />
      ))}
    </Svg>
  );
}
