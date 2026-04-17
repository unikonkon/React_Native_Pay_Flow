import Svg, { Path } from 'react-native-svg';
import { View } from 'react-native';

interface SparklesProps {
  count?: number;
  size?: number;
  color?: string;
  width?: number;
  height?: number;
}

function StarShape({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  const d = `M${x},${y - s} L${x + s * 0.3},${y - s * 0.3} L${x + s},${y} L${x + s * 0.3},${y + s * 0.3} L${x},${y + s} L${x - s * 0.3},${y + s * 0.3} L${x - s},${y} L${x - s * 0.3},${y - s * 0.3} Z`;
  return <Path d={d} fill={color} />;
}

function seededPositions(count: number, w: number, h: number) {
  const positions: { x: number; y: number; scale: number }[] = [];
  for (let i = 0; i < count; i++) {
    const seed = (i * 7 + 13) % 100;
    positions.push({
      x: (seed / 100) * (w - 12) + 6,
      y: ((i * 31 + 7) % 100) / 100 * (h - 12) + 6,
      scale: 0.6 + (seed % 5) * 0.1,
    });
  }
  return positions;
}

export function Sparkles({ count = 5, size = 6, color = '#E8B547', width = 60, height = 40 }: SparklesProps) {
  const positions = seededPositions(count, width, height);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {positions.map((p, i) => (
          <StarShape key={i} x={p.x} y={p.y} s={size * p.scale} color={color} />
        ))}
      </Svg>
    </View>
  );
}
