import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function authenticate(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'ปลดล็อก CeasFlow',
    fallbackLabel: 'ใช้รหัสผ่าน',
    cancelLabel: 'ยกเลิก',
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function getBiometricEnabled(): Promise<boolean> {
  const legacy = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
  if (legacy !== null) {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, legacy);
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    return legacy === 'true';
  }
  const val = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
  return val === 'true';
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, String(enabled));
}
