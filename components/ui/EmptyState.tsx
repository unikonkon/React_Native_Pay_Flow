import { Image, Text, View } from 'react-native';

const mascotRun = require('@/assets/bg/bgEmty.png');;

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <View
      className="flex-1 items-center justify-center py-16 mt-36"
      style={{
        shadowColor: '#2A2320',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.10,
        shadowRadius: 14,
      }}
    >
      <Image
        source={mascotRun}
        style={{
          width: 320,
          height: 190,
          shadowColor: '#2A2320',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
        }}
        resizeMode="contain"
      />
      <Text
        style={{
          fontFamily: 'IBMPlexSansThai_700Bold',
          fontSize: 22,
          textShadowColor: 'rgba(42,35,32,0.15)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 8,
        }}
        className="text-foreground mt-3"
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontFamily: 'IBMPlexSansThai_400Regular',
            fontSize: 14,
            maxWidth: 260,
            textShadowColor: 'rgba(42,35,32,0.07)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 4,
          }}
          className="text-muted-foreground mt-2 text-center"
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
