import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

function ShimmerRow({ index }: { index: number }) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withDelay(
      index * 80,
      withRepeat(withTiming(1, { duration: 1000, easing: Easing.ease }), -1, true),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.25, 0.6]),
  }));

  const barWidth = index % 3 === 0 ? '60%' : index % 3 === 1 ? '80%' : '45%';

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.circle, animatedStyle]} />
      <View style={styles.rowContent}>
        <Animated.View style={[styles.bar, { width: barWidth }, animatedStyle]} />
        <Animated.View style={[styles.barShort, animatedStyle]} />
      </View>
      <Animated.View style={[styles.amountBar, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#888',
  },
  rowContent: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
  },
  bar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#888',
  },
  barShort: {
    height: 10,
    width: '35%',
    borderRadius: 5,
    backgroundColor: '#888',
  },
  amountBar: {
    width: 60,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#888',
    marginLeft: 8,
  },
});
