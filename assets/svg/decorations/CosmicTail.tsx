import Svg, { Defs, LinearGradient, Stop, Path, Circle } from 'react-native-svg';

interface CosmicTailProps {
  width?: number;
  height?: number;
}

export function CosmicTail({ width = 80, height = 60 }: CosmicTailProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 80 60">
      <Defs>
        <LinearGradient id="cosmicGrad" x1="0" y1="0" x2="1" y2="0.5">
          <Stop offset="0" stopColor="#6B4A9E" />
          <Stop offset="0.5" stopColor="#5B6DB8" />
          <Stop offset="1" stopColor="#4A7FC1" />
        </LinearGradient>
      </Defs>
      <Path d="M5,30 Q20,10 40,25 Q55,38 70,15 Q75,8 78,12" stroke="url(#cosmicGrad)" strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.8} />
      <Path d="M5,30 Q20,10 40,25 Q55,38 70,15 Q75,8 78,12" stroke="url(#cosmicGrad)" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.4} />
      <Circle cx="25" cy="15" r="1.2" fill="white" opacity={0.8} />
      <Circle cx="45" cy="30" r="1" fill="white" opacity={0.7} />
      <Circle cx="60" cy="18" r="1.5" fill="white" opacity={0.9} />
      <Circle cx="72" cy="12" r="0.8" fill="white" opacity={0.6} />
      <Circle cx="35" cy="22" r="0.8" fill="white" opacity={0.5} />
    </Svg>
  );
}
