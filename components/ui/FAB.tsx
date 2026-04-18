import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';

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
      className="absolute bottom-1 right-6"
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.92 : 1 }] })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: -8, zIndex: 1 }}>
        <View style={{
          width: 0, height: 0,
          borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 14,
          borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#E87A3D',
          marginRight: 20,
        }} />
        <View style={{
          width: 0, height: 0,
          borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 14,
          borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#E87A3D',
        }} />
      </View>
      <LinearGradient
        colors={['#E87A3D', '#B8531E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#E87A3D',
          shadowOpacity: 0.35,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </LinearGradient>
    </Pressable>
  );
}
