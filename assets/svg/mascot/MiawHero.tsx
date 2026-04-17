import Svg, { Circle, Ellipse, G, Line, Path, Polygon } from 'react-native-svg';

interface MiawHeroProps {
  size?: number;
}

export function MiawHero({ size = 160 }: MiawHeroProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Polygon points="50,70 65,20 80,65" fill="#E87A3D" />
      <Polygon points="56,65 65,30 74,65" fill="#FFB3C7" opacity={0.5} />
      <Polygon points="120,65 135,20 150,70" fill="#E87A3D" />
      <Polygon points="126,65 135,30 144,65" fill="#FFB3C7" opacity={0.5} />
      <Ellipse cx="100" cy="150" rx="45" ry="40" fill="#E87A3D" />
      <Path d="M75,135 Q80,130 85,135" stroke="#B8531E" strokeWidth={2} fill="none" opacity={0.5} />
      <Path d="M90,128 Q95,123 100,128" stroke="#B8531E" strokeWidth={2} fill="none" opacity={0.5} />
      <Path d="M105,132 Q110,127 115,132" stroke="#B8531E" strokeWidth={2} fill="none" opacity={0.5} />
      <Ellipse cx="100" cy="158" rx="28" ry="22" fill="#F5D9B8" />
      <Circle cx="100" cy="85" r="35" fill="#E87A3D" />
      <Path d="M88,58 Q92,55 96,58" stroke="#B8531E" strokeWidth={1.5} fill="none" opacity={0.5} />
      <Path d="M104,58 Q108,55 112,58" stroke="#B8531E" strokeWidth={1.5} fill="none" opacity={0.5} />
      <G opacity={0.85}>
        <Line x1="90" y1="62" x2="110" y2="62" stroke="#E8B547" strokeWidth={2.5} strokeLinecap="round" />
        <Line x1="92" y1="67" x2="108" y2="67" stroke="#E8B547" strokeWidth={2} strokeLinecap="round" />
        <Line x1="94" y1="72" x2="106" y2="72" stroke="#E8B547" strokeWidth={1.8} strokeLinecap="round" />
      </G>
      <Circle cx="87" cy="82" r="5" fill="#1A1A1A" />
      <Circle cx="113" cy="82" r="5" fill="#1A1A1A" />
      <Circle cx="88.5" cy="80.5" r="2" fill="#FFD84A" />
      <Circle cx="114.5" cy="80.5" r="2" fill="#FFD84A" />
      <Circle cx="89.5" cy="79.5" r="0.8" fill="white" />
      <Circle cx="115.5" cy="79.5" r="0.8" fill="white" />
      <Ellipse cx="75" cy="90" rx="6" ry="3.5" fill="#FFB3C7" opacity={0.45} />
      <Ellipse cx="125" cy="90" rx="6" ry="3.5" fill="#FFB3C7" opacity={0.45} />
      <Ellipse cx="100" cy="90" rx="3" ry="2" fill="#B8531E" />
      <Path d="M93,96 Q100,102 107,96" stroke="#B8531E" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <G opacity={0.35} stroke="#FFB3C7" strokeWidth={1}>
        <Line x1="55" y1="84" x2="78" y2="88" />
        <Line x1="53" y1="90" x2="78" y2="90" />
        <Line x1="55" y1="96" x2="78" y2="92" />
        <Line x1="122" y1="88" x2="145" y2="84" />
        <Line x1="122" y1="90" x2="147" y2="90" />
        <Line x1="122" y1="92" x2="145" y2="96" />
      </G>
      <Ellipse cx="70" cy="180" rx="12" ry="8" fill="#E87A3D" />
      <Ellipse cx="130" cy="180" rx="12" ry="8" fill="#E87A3D" />
      <Circle cx="70" cy="182" r="3.5" fill="#FFB3C7" opacity={0.6} />
      <Circle cx="130" cy="182" r="3.5" fill="#FFB3C7" opacity={0.6} />
      <Path d="M145,155 Q165,140 160,120 Q155,105 165,95" stroke="#E87A3D" strokeWidth={8} fill="none" strokeLinecap="round" />
      <Path d="M145,155 Q165,140 160,120 Q155,105 165,95" stroke="#B8531E" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.3} />
    </Svg>
  );
}
