import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
      className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
      style={{ elevation: 8 }}
    >
      <Ionicons name="add" size={28} color="white" />
    </Pressable>
  );
}
