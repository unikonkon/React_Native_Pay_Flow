import { getAddMascotSource } from '@/lib/constants/mascots';
import { useThemeStore } from '@/lib/stores/theme-store';
import * as Haptics from 'expo-haptics';
import { Image, Pressable } from 'react-native';

interface FABProps {
  onPress: () => void;
}

export function FAB({ onPress }: FABProps) {
  const addMascotId = useThemeStore(s => s.currentAddMascot);
  const mascotPlus = getAddMascotSource(addMascotId);

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
          height: 142,
          transform: [{ rotate: '-8deg' }],
          shadowColor: '#B75513',
          shadowOpacity: 0.36,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 3 },
          opacity: 0.95,
        }}
        resizeMode="contain"
      />

    </Pressable>
  );
}
