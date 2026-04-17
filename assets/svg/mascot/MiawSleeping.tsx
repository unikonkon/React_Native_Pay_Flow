import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Text as SvgText } from 'react-native-svg';

interface MiawSleepingProps {
  size?: number;
}

export function MiawSleeping({ size = 160 }: MiawSleepingProps) {
  return (
    <Svg width={size} height={size * 0.7} viewBox="0 0 200 140">
      <Ellipse cx="100" cy="90" rx="60" ry="40" fill="#E87A3D" />
      <Path d="M60,80 Q65,75 70,80" stroke="#B8531E" strokeWidth={2} fill="none" opacity={0.4} />
      <Path d="M80,72 Q85,67 90,72" stroke="#B8531E" strokeWidth={2} fill="none" opacity={0.4} />
      <Ellipse cx="110" cy="100" rx="25" ry="18" fill="#F5D9B8" />
      <Circle cx="65" cy="75" r="28" fill="#E87A3D" />
      <Polygon points="42,55 50,35 58,52" fill="#E87A3D" />
      <Polygon points="46,52 50,40 54,52" fill="#FFB3C7" opacity={0.5} />
      <Polygon points="72,52 80,35 88,55" fill="#E87A3D" />
      <Polygon points="76,52 80,40 84,52" fill="#FFB3C7" opacity={0.5} />
      <G opacity={0.7}>
        <Line x1="57" y1="52" x2="73" y2="52" stroke="#E8B547" strokeWidth={2} strokeLinecap="round" />
        <Line x1="59" y1="56" x2="71" y2="56" stroke="#E8B547" strokeWidth={1.5} strokeLinecap="round" />
      </G>
      <Path d="M52,72 Q55,69 58,72" stroke="#1A1A1A" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M72,72 Q75,69 78,72" stroke="#1A1A1A" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Ellipse cx="48" cy="78" rx="4" ry="2.5" fill="#FFB3C7" opacity={0.45} />
      <Ellipse cx="82" cy="78" rx="4" ry="2.5" fill="#FFB3C7" opacity={0.45} />
      <Ellipse cx="65" cy="77" rx="2" ry="1.5" fill="#B8531E" />
      <Ellipse cx="55" cy="95" rx="10" ry="6" fill="#E87A3D" />
      <Ellipse cx="75" cy="95" rx="10" ry="6" fill="#E87A3D" />
      <Circle cx="55" cy="96" r="2.5" fill="#FFB3C7" opacity={0.5} />
      <Circle cx="75" cy="96" r="2.5" fill="#FFB3C7" opacity={0.5} />
      <Path d="M155,85 Q170,60 155,45 Q140,35 130,50" stroke="#E87A3D" strokeWidth={7} fill="none" strokeLinecap="round" />
      <SvgText x="100" y="40" fill="#A39685" fontSize={14} fontWeight="bold" opacity={0.5}>z</SvgText>
      <SvgText x="115" y="28" fill="#A39685" fontSize={18} fontWeight="bold" opacity={0.4}>z</SvgText>
      <SvgText x="132" y="15" fill="#A39685" fontSize={22} fontWeight="bold" opacity={0.3}>z</SvgText>
    </Svg>
  );
}
