import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ExportScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-foreground text-2xl font-bold">ส่งออกข้อมูล</Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <Ionicons name="download-outline" size={64} color="#ccc" />
        <Text className="text-muted-foreground text-lg mt-4">เร็วๆ นี้</Text>
      </View>
    </SafeAreaView>
  );
}
