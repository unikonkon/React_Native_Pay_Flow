import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon = 'receipt-outline', title, subtitle }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <Ionicons name={icon} size={64} color="#ccc" />
      <Text className="text-muted-foreground text-lg mt-4 font-semibold">{title}</Text>
      {subtitle && (
        <Text className="text-muted-foreground text-sm mt-1">{subtitle}</Text>
      )}
    </View>
  );
}
