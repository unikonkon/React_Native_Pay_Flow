import { View, Text } from 'react-native';
import { Link, Stack } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'ไม่พบหน้า' }} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
          ไม่พบหน้าที่ต้องการ
        </Text>
        <Link href="/" style={{ color: '#E87A3D', fontSize: 16 }}>
          กลับหน้าหลัก
        </Link>
      </View>
    </>
  );
}
