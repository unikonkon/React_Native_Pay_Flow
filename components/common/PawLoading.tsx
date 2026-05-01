import { PawPrintIcon } from '@/components/common/PawPrintIcon';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface PawLoadingProps {
  size?: number;
  color?: string;
  count?: number;
  gap?: number;
  /** Vertical zig-zag offset between alternating paws (px). */
  zigzag?: number;
}

function AnimatedPaw({
  index,
  total,
  size,
  color,
  zigzag,
}: {
  index: number;
  total: number;
  size: number;
  color: string;
  zigzag: number;
}) {
  const progress = useSharedValue(0);
  const cycleMs = 1200;
  const stagger = cycleMs / total;

  useEffect(() => {
    progress.value = withDelay(
      index * stagger,
      withRepeat(
        withTiming(1, { duration: cycleMs, easing: Easing.inOut(Easing.ease) }),
        -1,
        false,
      ),
    );
  }, [index, stagger, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    // 0 → 0.5: fade in (opacity 0.15 → 1, scale 0.7 → 1)
    // 0.5 → 1: fade out (opacity 1 → 0.15, scale 1 → 0.7)
    const opacity = p < 0.5 ? 0.15 + (p / 0.5) * 0.85 : 1 - ((p - 0.5) / 0.5) * 0.85;
    const scale = p < 0.5 ? 0.7 + (p / 0.5) * 0.3 : 1 - ((p - 0.5) / 0.5) * 0.3;
    return { opacity, transform: [{ scale }] };
  });

  // Alternate up/down for "walking" feel
  const offsetY = index % 2 === 0 ? -zigzag : zigzag;
  // Slight rotation alternating left/right
  const rotateDeg = index % 2 === 0 ? '-12deg' : '12deg';

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateY: offsetY }, { rotate: rotateDeg }],
        },
        animatedStyle,
      ]}
    >
      <PawPrintIcon size={size} color={color} />
    </Animated.View>
  );
}

export function PawLoading({
  size = 28,
  color = '#E87A3D',
  count = 4,
  gap = 6,
  zigzag = 5,
}: PawLoadingProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap,
        paddingVertical: zigzag + 4,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <AnimatedPaw
          key={i}
          index={i}
          total={count}
          size={size}
          color={color}
          zigzag={zigzag}
        />
      ))}
    </View>
  );
}
