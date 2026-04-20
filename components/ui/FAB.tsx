import * as Haptics from 'expo-haptics';
import { Image, Pressable } from 'react-native';

const mascotPlus = require('@/assets/mascot-plus10.png');

interface FABProps {
  onPress: () => void;
}

export function FAB({ onPress }: FABProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      className="absolute -bottom-10 right-2"
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.92 : 1 }],
        shadowColor: '#E87A3D',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 10,
      })}
    >
      <Image
        source={mascotPlus}
        style={{
          width: 232,
          height: 162,
          transform: [{ rotate: '-8deg' }],
          shadowColor: '#B75513',
          shadowOpacity: 0.36,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 3 },
        }}
        resizeMode="contain"
      />
    </Pressable>
  );
}
