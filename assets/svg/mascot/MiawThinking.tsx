import Svg, { Circle, Ellipse, G, Line, Path, Polygon } from 'react-native-svg';
import { View } from 'react-native';
import { CosmicTail } from '../decorations/CosmicTail';
import { Sparkles } from '../decorations/Sparkles';

interface MiawThinkingProps {
  size?: number;
}

export function MiawThinking({ size = 160 }: MiawThinkingProps) {
  return (
    <View style={{ width: size + 40, height: size, alignItems: 'center' }}>
      <View style={{ position: 'absolute', top: 0, left: size * 0.15, zIndex: 1 }}>
        <Sparkles count={4} size={5} width={size * 0.7} height={30} />
      </View>
      <Svg width={size} height={size} viewBox="0 0 200 200">
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
        <Circle cx="87" cy="80" r="5" fill="#1A1A1A" />
        <Circle cx="113" cy="80" r="5" fill="#1A1A1A" />
        <Circle cx="89" cy="78" r="2" fill="#FFD84A" />
        <Circle cx="115" cy="78" r="2" fill="#FFD84A" />
        <Ellipse cx="75" cy="90" rx="6" ry="3.5" fill="#FFB3C7" opacity={0.45} />
        <Ellipse cx="125" cy="90" rx="6" ry="3.5" fill="#FFB3C7" opacity={0.45} />
        <Ellipse cx="100" cy="90" rx="3" ry="2" fill="#B8531E" />
        <Path d="M96,96 Q100,98 104,96" stroke="#B8531E" strokeWidth={1.2} fill="none" strokeLinecap="round" />
        <G opacity={0.35} stroke="#FFB3C7" strokeWidth={1}>
          <Line x1="55" y1="84" x2="78" y2="88" />
          <Line x1="53" y1="90" x2="78" y2="90" />
          <Line x1="122" y1="88" x2="145" y2="84" />
          <Line x1="122" y1="90" x2="147" y2="90" />
        </G>
        <Ellipse cx="130" cy="105" rx="10" ry="8" fill="#E87A3D" />
        <Circle cx="130" cy="107" r="3" fill="#FFB3C7" opacity={0.5} />
        <Ellipse cx="70" cy="180" rx="12" ry="8" fill="#E87A3D" />
        <Ellipse cx="130" cy="180" rx="12" ry="8" fill="#E87A3D" />
      </Svg>
      <View style={{ position: 'absolute', right: -20, bottom: size * 0.15 }}>
        <CosmicTail width={70} height={50} />
      </View>
    </View>
  );
}
