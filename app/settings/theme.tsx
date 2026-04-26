import { ThemeSettingsContent } from '@/components/settings/ThemeSettingsContent';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ThemeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable
          onPress={() => router.back()}
          className="bg-secondary"
          style={{
            width: 36, height: 36, borderRadius: 18,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={18} color="#A39685" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            className="text-foreground"
            style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 20, letterSpacing: -0.3 }}
          >
            ธีม
          </Text>
          <Text
            className="text-muted-foreground"
            style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5, marginTop: 1 }}
          >
            แต่ละชุดมีโหมดสว่างและมืดให้เลือก และ เลือกตัวการ์ตูน
          </Text>
        </View>
      </View>

      <ThemeSettingsContent />
    </SafeAreaView>
  );
}
