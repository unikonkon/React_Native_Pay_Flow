import { WallpaperBackground } from '@/components/layout/WallpaperBackground';
import { AddWalletModal } from '@/components/wallet/AddWalletModal';
import { getBgMascotSource } from '@/lib/constants/mascots';
import { useThemeStore } from '@/lib/stores/theme-store';
import { getBiometricEnabled, isBiometricAvailable, setBiometricEnabled } from '@/lib/utils/auth';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  toggle,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
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
        backgroundColor: toggle ? '#E87A3D' : '#E87A3D22',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={16} color={toggle ? '#fff' : '#E87A3D'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14.5 }}>{label}</Text>
        {toggle === true && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} />
            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 11, color: '#22C55E' }}>เปิดใช้งานอยู่</Text>
          </View>
        )}
      </View>
      {toggle !== undefined ? (
        <View style={{
          width: 44, height: 26, borderRadius: 13,
          backgroundColor: toggle ? '#E87A3D' : '#D9CFC2',
          padding: 3,
          flexDirection: 'row',
          justifyContent: toggle ? 'flex-end' : 'flex-start',
        }}>
          <View style={{
            width: 20, height: 20, borderRadius: 10,
            backgroundColor: '#fff',
            shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 }, elevation: 2,
          }} />
        </View>
      ) : (
        <>
          {value !== undefined && (
            <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }}>{value}</Text>
          )}
          <Ionicons name="chevron-forward" size={12} color="#A39685" />
        </>
      )}
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
  const [biometricConfirmVisible, setBiometricConfirmVisible] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable);
    getBiometricEnabled().then(setBiometricEnabledState);
  }, []);

  const handleBiometricConfirm = async () => {
    const newValue = !biometricEnabled;
    await setBiometricEnabled(newValue);
    setBiometricEnabledState(newValue);
    setBiometricConfirmVisible(false);
  };

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <WallpaperBackground>
    <SafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 18, paddingTop: 2, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Image source={mascotRun} style={{ width: 50, height: 34 }} resizeMode="contain" />
        <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 26, letterSpacing: -0.4 }}>ตั้งค่า</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {biometricAvailable && (
          <Section title="ทั่วไป">
            <SettingsRow
              icon="finger-print-outline"
              label="ล็อกด้วย Face ID/ลายนิ้วมือ"
              toggle={biometricEnabled}
              onPress={() => setBiometricConfirmVisible(true)}
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
          แมวมันนี่ v{appVersion} · ทำด้วย <Text style={{ color: '#E87A3D' }}> ♥ </Text> โดย Faraday
        </Text>
      </ScrollView>

      <AddWalletModal
        visible={addWalletVisible}
        onClose={() => setAddWalletVisible(false)}
      />

      <Modal
        visible={biometricConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBiometricConfirmVisible(false)}
      >
        <Pressable
          onPress={() => setBiometricConfirmVisible(false)}
          className="flex-1 bg-black/40 items-center justify-center"
          style={{ paddingHorizontal: 20 }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-background rounded-3xl border border-border"
            style={{ padding: 22 }}
          >
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <View style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: '#E87A3D22',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 12,
              }}>
                <Ionicons name="finger-print" size={32} color="#E87A3D" />
              </View>
              <Text className="text-foreground" style={{
                fontFamily: 'IBMPlexSansThai_700Bold',
                fontSize: 18, textAlign: 'center',
              }}>
                {biometricEnabled
                  ? 'ปิดการล็อกด้วยไบโอเมตริก?'
                  : 'เปิดการล็อกด้วยไบโอเมตริก?'}
              </Text>
            </View>

            <Text className="text-muted-foreground" style={{
              fontFamily: 'IBMPlexSansThai_400Regular',
              fontSize: 14, lineHeight: 22,
              textAlign: 'center', marginBottom: 16,
            }}>
              {biometricEnabled
                ? 'หากปิดการใช้งาน แอปจะเปิดได้ทันทีโดยไม่ต้องยืนยันตัวตน ข้อมูลทางการเงินของคุณจะไม่ถูกป้องกันด้วย Face ID หรือลายนิ้วมือ'
                : 'แอปจะขอ Face ID หรือลายนิ้วมือทุกครั้งที่เปิดใช้งาน เพื่อปกป้องข้อมูลทางการเงินของคุณจากผู้ที่ถือเครื่องโดยไม่ได้รับอนุญาต'}
            </Text>

            {!biometricEnabled && (
              <View style={{
                flexDirection: 'row', gap: 8,
                backgroundColor: '#E87A3D11',
                borderRadius: 12, padding: 12, marginBottom: 16,
              }}>
                <Ionicons name="information-circle" size={18} color="#E87A3D" style={{ marginTop: 1 }} />
                <Text className="text-foreground" style={{
                  fontFamily: 'IBMPlexSansThai_400Regular',
                  fontSize: 12.5, lineHeight: 19, flex: 1,
                }}>
                  คุณสามารถปิดการใช้งานได้ทุกเมื่อจากหน้านี้ และยังคงเข้าถึงแอปได้ผ่านรหัสผ่านอุปกรณ์
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => setBiometricConfirmVisible(false)}
                className="flex-1 py-3 rounded-full items-center border border-border"
              >
                <Text className="text-foreground" style={{
                  fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15,
                }}>ยกเลิก</Text>
              </Pressable>
              <Pressable
                onPress={handleBiometricConfirm}
                className="flex-1 py-3 rounded-full items-center bg-primary"
              >
                <Text style={{
                  fontFamily: 'IBMPlexSansThai_700Bold',
                  fontSize: 15, color: '#fff',
                }}>
                  {biometricEnabled ? 'ปิดการใช้งาน' : 'ยืนยัน เปิดใช้งาน'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
    </WallpaperBackground>
  );
}
