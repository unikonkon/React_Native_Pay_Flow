import Svg, { Circle, Ellipse, G, Line, Path, Polygon } from 'react-native-svg';
import { View } from 'react-native';
import { Sparkles } from '../decorations/Sparkles';

interface MiawCelebratingProps {
  size?: number;
}

export function MiawCelebrating({ size = 160 }: MiawCelebratingProps) {
  return (
    <View style={{ width: size + 20, height: size + 20, alignItems: 'center' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
        <Sparkles count={6} size={6} width={size + 20} height={size * 0.4} />
      </View>
      <Svg width={size} height={size} viewBox="0 0 200 200" style={{ marginTop: 10 }}>
        <Polygon points="50,70 65,20 80,65" fill="#E87A3D" />
        <Polygon points="56,65 65,30 74,65" fill="#FFB3C7" opacity={0.5} />
        <Polygon points="120,65 135,20 150,70" fill="#E87A3D" />
        <Polygon points="126,65 135,30 144,65" fill="#FFB3C7" opacity={0.5} />
        <Ellipse cx="100" cy="150" rx="45" ry="40" fill="#E87A3D" />
        <Ellipse cx="100" cy="158" rx="28" ry="22" fill="#F5D9B8" />
        <Circle cx="100" cy="85" r="35" fill="#E87A3D" />
        <G opacity={0.85}>
          <Line x1="90" y1="62" x2="110" y2="62" stroke="#E8B547" strokeWidth={2.5} strokeLinecap="round" />
          <Line x1="92" y1="67" x2="108" y2="67" stroke="#E8B547" strokeWidth={2} strokeLinecap="round" />
          <Line x1="94" y1="72" x2="106" y2="72" stroke="#E8B547" strokeWidth={1.8} strokeLinecap="round" />
        </G>
        <Path d="M82,82 Q87,77 92,82" stroke="#1A1A1A" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <Path d="M108,82 Q113,77 118,82" stroke="#1A1A1A" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <Ellipse cx="75" cy="90" rx="7" ry="4" fill="#FFB3C7" opacity={0.5} />
        <Ellipse cx="125" cy="90" rx="7" ry="4" fill="#FFB3C7" opacity={0.5} />
        <Ellipse cx="100" cy="90" rx="3" ry="2" fill="#B8531E" />
        <Path d="M90,96 Q100,106 110,96" stroke="#B8531E" strokeWidth={1.8} fill="none" strokeLinecap="round" />
        <G opacity={0.35} stroke="#FFB3C7" strokeWidth={1}>
          <Line x1="55" y1="84" x2="78" y2="88" />
          <Line x1="53" y1="90" x2="78" y2="90" />
          <Line x1="122" y1="88" x2="145" y2="84" />
          <Line x1="122" y1="90" x2="147" y2="90" />
        </G>
        <Ellipse cx="55" cy="115" rx="10" ry="8" fill="#E87A3D" transform="rotate(-30 55 115)" />
        <Circle cx="48" cy="108" r="3" fill="#FFB3C7" opacity={0.5} />
        <Ellipse cx="145" cy="115" rx="10" ry="8" fill="#E87A3D" transform="rotate(30 145 115)" />
        <Circle cx="152" cy="108" r="3" fill="#FFB3C7" opacity={0.5} />
        <Ellipse cx="80" cy="182" rx="12" ry="8" fill="#E87A3D" />
        <Ellipse cx="120" cy="182" rx="12" ry="8" fill="#E87A3D" />
        <Circle cx="40" cy="45" r="3" fill="#6B4A9E" opacity={0.6} />
        <Circle cx="160" cy="50" r="2.5" fill="#4A7FC1" opacity={0.6} />
        <Circle cx="50" cy="30" r="2" fill="#E8B547" opacity={0.7} />
        <Circle cx="150" cy="35" r="2" fill="#FFB3C7" opacity={0.6} />
        <Circle cx="170" cy="70" r="1.8" fill="#6B4A9E" opacity={0.5} />
        <Circle cx="30" cy="65" r="2.2" fill="#4A7FC1" opacity={0.5} />
      </Svg>
    </View>
  );
}
