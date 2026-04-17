import { View, Text } from 'react-native';
import { MiawSleeping } from '@/assets/svg';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16">
      <MiawSleeping size={140} />
      <Text className="text-foreground text-lg mt-4 font-semibold">{title}</Text>
      {subtitle && (
        <Text className="text-muted-foreground text-sm mt-1 text-center px-8">{subtitle}</Text>
      )}
    </View>
  );
}
