import Svg, { Circle } from 'react-native-svg';

interface PawPrintProps {
  size?: number;
  color?: string;
}

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
