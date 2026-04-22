import { PawPrint } from '@/assets/svg/decorations/PawPrint';
import { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export interface PawPrintTapEffectHandle {
  play: () => void;
}

interface PawPrintTapEffectProps {
  size?: number;
  color?: string;
}

export const PawPrintTapEffect = forwardRef<PawPrintTapEffectHandle, PawPrintTapEffectProps>(
  function PawPrintTapEffect({ size = 32, color = '#E87A3D' }, ref) {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useImperativeHandle(ref, () => ({
      play() {
        scale.value = 0;
        opacity.value = 0;
        scale.value = withSequence(
          withTiming(1.25, { duration: 160, easing: Easing.out(Easing.quad) }),
          withDelay(60, withTiming(0.5, { duration: 230, easing: Easing.in(Easing.quad) })),
        );
        opacity.value = withSequence(
          withTiming(1, { duration: 120 }),
          withDelay(140, withTiming(0, { duration: 200 })),
        );
      },
    }));

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ scale: scale.value }, { rotate: '-10deg' }],
    }));

    return (
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
        <Animated.View style={animatedStyle}>
          <PawPrint size={size} color={color} />
        </Animated.View>
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
