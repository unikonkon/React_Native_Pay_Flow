import { AddWalletModal } from '@/components/wallet/AddWalletModal';
import { getBgMascotSource } from '@/lib/constants/mascots';
import { useThemeStore } from '@/lib/stores/theme-store';
import { getBiometricEnabled, isBiometricAvailable, setBiometricEnabled } from '@/lib/utils/auth';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={last ? '' : 'border-b border-border'}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}
    >
      <View style={{
        width: 30, height: 30, borderRadius: 9,
        backgroundColor: '#E87A3D22',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={16} color="#E87A3D" />
      </View>
      <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14.5, flex: 1 }}>{label}</Text>
      {value !== undefined && (
        <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }}>{value}</Text>
      )}
      <Ionicons name="chevron-forward" size={12} color="#A39685" />
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
      <Text className="text-muted-foreground" style={{
        fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12,
        paddingHorizontal: 6, paddingBottom: 6, letterSpacing: 0.3,
      }}>{title}</Text>
      <View className="bg-card" style={{
        borderRadius: 20, overflow: 'hidden',
        shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 }, elevation: 2,
      }}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const bgMascotId = useThemeStore(s => s.currentBgMascot);
  const mascotRun = getBgMascotSource(bgMascotId);

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [addWalletVisible, setAddWalletVisible] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable);
    getBiometricEnabled().then(setBiometricEnabledState);
  }, []);

  const handleBiometricToggle = async () => {
    const newValue = !biometricEnabled;
    await setBiometricEnabled(newValue);
    setBiometricEnabledState(newValue);
  };

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Image source={mascotRun} style={{ width: 40, height: 40 }} resizeMode="contain" />
        <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 26, letterSpacing: -0.4 }}>ตั้งค่า</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {biometricAvailable && (
          <Section title="ทั่วไป">
            <SettingsRow
              icon="finger-print-outline"
              label="ล็อกด้วย Face ID/ลายนิ้วมือ"
              value={biometricEnabled ? 'เปิด' : 'ปิด'}
              onPress={handleBiometricToggle}
              last
            />
          </Section>
        )}

        <Section title="กระเป๋าเงิน">
          <SettingsRow
            icon="add-circle-outline"
            label="สร้างกระเป๋าใหม่"
            onPress={() => setAddWalletVisible(true)}
          />
          <SettingsRow
            icon="wallet-outline"
            label="จัดการกระเป๋าเงิน"
            onPress={() => router.push('/settings/wallets')}
            last
          />
        </Section>

        <Section title="เกี่ยวกับ">
          <SettingsRow icon="information-circle-outline" label="เวอร์ชัน" value={appVersion} />
          <SettingsRow icon="paw-outline" label="แมวมันนี่" value="MaewMoney" last />
        </Section>

        {/* Footer */}
        <Text className="text-muted-foreground" style={{
          fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11,
          textAlign: 'center', marginTop: 20,
        }}>
          แมวมันนี่ v{appVersion} · ทำด้วย <Text style={{ color: '#E87A3D' }}>♥</Text> โดย Faraday
        </Text>
      </ScrollView>

      <AddWalletModal
        visible={addWalletVisible}
        onClose={() => setAddWalletVisible(false)}
      />
    </SafeAreaView>
  );
}
