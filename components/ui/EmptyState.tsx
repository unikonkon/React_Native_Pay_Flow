import { View, Text, Image } from 'react-native';

const mascotRun = require('@/assets/mascot-run.png');

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16">
      <Image source={mascotRun} style={{ width: 220, height: 150 }} resizeMode="contain" />
      <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 22 }} className="text-foreground mt-3">{title}</Text>
      {subtitle && (
        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14, maxWidth: 260 }} className="text-muted-foreground mt-2 text-center">{subtitle}</Text>
      )}
    </View>
  );
}
