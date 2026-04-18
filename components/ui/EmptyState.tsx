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
      <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 18 }} className="text-foreground mt-4">{title}</Text>
      {subtitle && (
        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14 }} className="text-muted-foreground mt-1 text-center px-8">{subtitle}</Text>
      )}
    </View>
  );
}
