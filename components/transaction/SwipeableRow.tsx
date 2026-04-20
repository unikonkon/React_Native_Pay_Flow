import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onCopy: () => void;
}

export function SwipeableRow({ children, onDelete, onCopy }: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const close = () => swipeableRef.current?.close();

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-140, 0],
      outputRange: [1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <View style={{ flexDirection: 'row', width: 140, gap: 4,paddingLeft: 6 }}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            close();
            onCopy();
          }}
          style={{
            flex: 1,
            backgroundColor: '#3b82f6',
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="copy-outline" size={22} color="white" />
          </Animated.View>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            close();
            onDelete();
          }}
          style={{
            flex: 1,
            backgroundColor: '#ef4444',
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="trash-outline" size={22} color="white" />
          </Animated.View>
        </Pressable>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
      friction={2}
    >
      {children}
    </Swipeable>
  );
}
