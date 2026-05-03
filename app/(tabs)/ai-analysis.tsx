import { GoldCracks, MiawThinking } from '@/assets/svg';
import { AiResultView } from '@/components/ai/AiResultView';
import { SavingsGoalResultView } from '@/components/ai/SavingsGoalResultView';
import { CatCategoryIcon } from '@/components/common/CatCategoryIcon';
import { PawLoading } from '@/components/common/PawLoading';
import { WallpaperBackground } from '@/components/layout/WallpaperBackground';
import { NotificationsSettingsContent } from '@/components/settings/NotificationsSettingsContent';
import { ThemeSettingsContent } from '@/components/settings/ThemeSettingsContent';
import { analyzeFinances, analyzeSavingsGoal, deleteApiKey, getApiKey, getThaiMonthName, setApiKey } from '@/lib/api/ai';
import { useAiHistoryStore } from '@/lib/stores/ai-history-store';
import { useAlertSettingsStore } from '@/lib/stores/alert-settings-store';
import { useAnalysisStore } from '@/lib/stores/analysis-store';
import { useCategoryStore } from '@/lib/stores/category-store';
import { getAvailableMonths, getAvailableYears, getDb, getTransactionsByRange, getTransactionsByYear } from '@/lib/stores/db';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import {
  exportAllData,
  exportAllDataExcel,
  getExportCounts,
  pickAndImportData,
  pickAndImportDataExcel,
  pickAndImportSpecialData,
  type ExportCounts,
  type ImportProgress,
  type ImportResult,
} from '@/lib/utils/data-transfer';
import { formatCurrency } from '@/lib/utils/format';
import type { AiHistory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

type PromptType = 'structured' | 'full';
type InnerTab = 'ai' | 'data' | 'theme' | 'notifications';
type DataTab = 'export' | 'import';
type DataFormat = 'txt' | 'excel';

const THAI_MONTHS_SHORT = [
  '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

function getPeriodLabel(year: number, month: number | null): string {
  const buddhistYear = year + 543;
  if (month) return `${getThaiMonthName(month)} ${buddhistYear}`;
  return `ปี ${buddhistYear}`;
}

// ===== Settings Row helpers (for API Key card) =====

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
      {onPress && <Ionicons name="chevron-forward" size={12} color="#A39685" />}
    </Pressable>
  );
}

function SettingsSection({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-card" style={{
      borderRadius: 20, overflow: 'hidden',
      shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 }, elevation: 2,
    }}>
      {children}
    </View>
  );
}

// ===== API Key Help Modal =====

const API_KEY_STEPS: { title: string; desc: string }[] = [
  { title: 'เข้าสู่ระบบ', desc: 'ไปที่เว็บไซต์ Google AI Studio ด้วยบัญชี Google ของคุณ' },
  { title: 'เปิดเมนู API', desc: 'ทางด้านซ้ายมือ คลิกที่ปุ่ม "Get API key"' },
  { title: 'สร้าง Key', desc: 'คลิก "Create API key" — เลือกสร้างในโปรเจกต์ Google Cloud ใหม่ หรือเลือกโปรเจกต์ที่มีอยู่แล้ว' },
  { title: 'คัดลอก Key', desc: 'เมื่อระบบสร้าง Key สำเร็จ ให้คัดลอกรหัสไปวางในแอปนี้' },
];

function ApiKeyHelpModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 bg-black/40" />
      <View className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl" style={{ maxHeight: '88%' }}>
        {/* Handle bar */}
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#D9CFC3' }} />
        </View>

        {/* Header */}
        <View className="flex-row items-center justify-between" style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={{
              width: 34, height: 34, borderRadius: 11,
              backgroundColor: '#E87A3D22',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="key" size={16} color="#E87A3D" />
            </View>
            <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18, flex: 1 }}>
              วิธีรับ Gemini API Key
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8} style={{ padding: 4 }}>
            <Ionicons name="close" size={22} color="#9A8D80" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 }}>
          <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, lineHeight: 19, marginBottom: 14 }}>
            ทำตามขั้นตอนด้านล่างเพื่อรับ API Key ฟรีจาก Google AI Studio
          </Text>

          {/* Steps */}
          <View style={{ gap: 10, marginBottom: 18 }}>
            {API_KEY_STEPS.map((step, i) => (
              <View key={i} className="bg-card" style={{
                flexDirection: 'row', alignItems: 'flex-start', gap: 12,
                padding: 14, borderRadius: 16,
                borderWidth: 1, borderColor: 'rgba(42,35,32,0.08)',
              }}>
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: '#E87A3D',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 13, color: '#fff' }}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14.5, marginBottom: 2 }}>
                    {step.title}
                  </Text>
                  <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, lineHeight: 19 }}>
                    {step.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Link buttons */}
          <Pressable
            onPress={() => Linking.openURL('https://aistudio.google.com')}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              height: 52, borderRadius: 14, marginBottom: 10,
              backgroundColor: '#E87A3D',
              shadowColor: '#E87A3D', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            }}
          >
            <Ionicons name="open-outline" size={18} color="#fff" />
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, color: '#fff' }}>
              เปิด Google AI Studio
            </Text>
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL('https://ai.google.dev/gemini-api/docs/api-key?hl=th')}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              height: 52, borderRadius: 14,
              backgroundColor: 'transparent',
              borderWidth: 1.5, borderColor: '#E87A3D',
            }}
          >
            <Ionicons name="document-text-outline" size={18} color="#E87A3D" />
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, color: '#E87A3D' }}>
              อ่านคู่มือฉบับเต็ม
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ===== API Key Setup Modal =====

function ApiKeySetupModal({
  visible,
  onClose,
  hasKey,
  maskedTail,
  onSave,
  onDelete,
  onOpenHelp,
}: {
  visible: boolean;
  onClose: () => void;
  hasKey: boolean;
  maskedTail: string;
  onSave: (key: string) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  onOpenHelp: () => void;
}) {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset transient input state every time the modal is reopened, so a previous
  // session's text doesn't linger on screen.
  useEffect(() => {
    if (visible) {
      setKeyInput('');
      setShowKey(false);
      setSaving(false);
    }
  }, [visible]);

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setKeyInput(text.trim());
  };

  const handleSave = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onSave(trimmed);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'ลบ API Key',
      'ต้องการลบ Gemini API Key ที่บันทึกไว้ใช่หรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            await onDelete();
            onClose();
          },
        },
      ],
    );
  };

  const canSave = keyInput.trim().length > 0 && !saving;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 bg-black/40" />
      <View className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl" style={{ maxHeight: '92%' }}>
        {/* Handle bar */}
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#D9CFC3' }} />
        </View>

        {/* Header */}
        <View className="flex-row items-center justify-between" style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={{
              width: 34, height: 34, borderRadius: 11,
              backgroundColor: '#E87A3D22',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="key" size={16} color="#E87A3D" />
            </View>
            <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18, flex: 1 }}>
              Gemini API Key
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8} style={{ padding: 4 }}>
            <Ionicons name="close" size={22} color="#9A8D80" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, lineHeight: 19, marginBottom: 14 }}>
            ใส่ API Key จาก Google AI Studio เพื่อเปิดใช้งาน AI วิเคราะห์การใช้จ่าย
          </Text>

          {/* Current status (if a key is already saved) */}
          {hasKey && (
            <View className="bg-card" style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              padding: 14, borderRadius: 16, marginBottom: 14,
              borderWidth: 1, borderColor: 'rgba(42,35,32,0.08)',
            }}>
              <View style={{
                width: 32, height: 32, borderRadius: 10,
                backgroundColor: '#3B9A4F22',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="checkmark-circle" size={18} color="#3B9A4F" />
              </View>
              <View style={{ flex: 1 }}>
                <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }}>
                  ตั้งค่าแล้ว
                </Text>
                <Text className="text-muted-foreground" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 }}>
                  ****{maskedTail}
                </Text>
              </View>
              <Pressable
                onPress={handleDelete}
                hitSlop={8}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: '#E0535322',
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#E05353" />
              </Pressable>
            </View>
          )}

          {/* Input label */}
          <Text className="text-foreground" style={{
            fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 13.5,
            marginBottom: 8,
          }}>
            {hasKey ? 'อัปเดต API Key' : 'API Key'}
          </Text>

          {/* Input box */}
          <View className="bg-card" style={{
            flexDirection: 'row', alignItems: 'center',
            borderRadius: 14, paddingHorizontal: 12,
            borderWidth: 1.5, borderColor: keyInput ? '#E87A3D' : 'rgba(42,35,32,0.08)',
            marginBottom: 10,
          }}>
            <Ionicons name="key-outline" size={16} color="#9A8D80" />
            <TextInput
              value={keyInput}
              onChangeText={setKeyInput}
              placeholder="วาง API Key ที่นี่..."
              placeholderTextColor="#9A8D80"
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 8,
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: '#2A2320',
              }}
            />
            <Pressable
              onPress={() => setShowKey(s => !s)}
              hitSlop={8}
              style={{ padding: 6 }}
            >
              <Ionicons name={showKey ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9A8D80" />
            </Pressable>
            <Pressable
              onPress={handlePaste}
              hitSlop={8}
              style={{
                paddingHorizontal: 8, paddingVertical: 6, marginLeft: 2,
                flexDirection: 'row', alignItems: 'center', gap: 4,
                borderRadius: 10,
                backgroundColor: '#E87A3D22',
              }}
            >
              <Ionicons name="clipboard-outline" size={14} color="#C85F28" />
              <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 12, color: '#C85F28' }}>
                วาง
              </Text>
            </Pressable>
          </View>

          {/* Help link */}
          <Pressable
            onPress={onOpenHelp}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 18,
            }}
          >
            <Ionicons name="help-circle-outline" size={15} color="#E87A3D" />
            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: '#E87A3D' }}>
              ยังไม่มี Key? ดูวิธีรับ
            </Text>
            <Ionicons name="arrow-forward" size={13} color="#E87A3D" />
          </Pressable>

          {/* Primary action */}
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              height: 52, borderRadius: 14, marginBottom: 10,
              backgroundColor: canSave ? '#E87A3D' : 'rgba(232,122,61,0.5)',
              shadowColor: '#E87A3D',
              shadowOpacity: canSave ? 0.3 : 0,
              shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
              elevation: canSave ? 6 : 0,
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, color: '#fff' }}>
                  บันทึก
                </Text>
              </>
            )}
          </Pressable>

          {/* Secondary action */}
          <Pressable
            onPress={onClose}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              height: 52, borderRadius: 14,
              backgroundColor: 'transparent',
              borderWidth: 1.5, borderColor: '#D9CFC3',
            }}
          >
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, color: '#9A8D80' }}>
              ยกเลิก
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ===== Premium Paywall =====

const mascotPlus = require('@/assets/mascot-cosmic.png');

const PREMIUM_FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
  { icon: 'sparkles-outline', title: 'AI วิเคราะห์การใช้จ่าย', desc: 'แมวช่วยดูพฤติกรรมการใช้เงิน ทุกสัปดาห์' },
  { icon: 'download-outline', title: 'Export และ Import ข้อมูล Excel/Txt', desc: 'ส่งออกรายงาน หรือนำเข้าข้อมูล' },
  { icon: 'color-palette-outline', title: 'ธีมพิเศษ + พื้นหลังแอป + แมวเปลี่ยนชุด', desc: '30 ธีมสี (สว่าง/มืด), พื้นหลังแอป + ปรับ overlay & ความเข้มการ์ด, ชุดแมว, ตีนแมว' },
  { icon: 'notifications-outline', title: 'แจ้งเตือน Push', desc: 'เตือนเมื่อใกล้/เกินงบรายวัน รายเดือน' },
];

function PremiumPaywall({ onUnlock }: { onUnlock: () => void }) {
  const [plan, setPlan] = useState<'month' | 'year'>('year');

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Hero card with gradient */}
      <View style={{
        marginHorizontal: 16, marginTop: 8, marginBottom: 14,
        paddingVertical: 22, paddingHorizontal: 20,
        borderRadius: 28, overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Gradient background */}
        <View style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: '#FCE8D4',
        }} />
        <View style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, left: '40%',
          backgroundColor: '#D8CCEC', opacity: 0.6,
          borderTopLeftRadius: 80,
        }} />
        {/* Gold cracks decoration */}
        <View style={{ position: 'absolute', top: 10, left: -10, opacity: 0.55 }}>
          <GoldCracks width={130} height={50} opacity={0.5} />
        </View>
        <View style={{ position: 'absolute', bottom: -10, right: -20, opacity: 0.4 }}>
          <GoldCracks width={100} height={40} opacity={0.4} />
        </View>

        {/* Content */}
        <View style={{ zIndex: 2 }}>
          <View style={{
            alignSelf: 'flex-start',
            flexDirection: 'row', alignItems: 'center', gap: 5,
            paddingHorizontal: 10, paddingVertical: 4,
            backgroundColor: 'rgba(255,255,255,0.5)',
            borderRadius: 999,
          }}>
            <Ionicons name="sparkles" size={10} color="#6B4A9E" />
            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#6B4A9E' }}>แมวมันนี่ Premium</Text>
          </View>
          <Text className="text-muted-foreground" style={{
            fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 24,
            marginTop: 6, letterSpacing: -0.1, lineHeight: 39,
          }}>
            {'ปลดล็อกพลังทั้งหมด\nของแมวกันเถอะ'}
          </Text>
          <Text className="text-muted-foreground" style={{
            fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13,
            marginTop: 6, maxWidth: 210,
          }}>
            บันทึกไม่จำกัด พร้อมฟีเจอร์สุดคุ้มอีก 4 อย่าง
          </Text>
        </View>

        {/* Mascot */}
        <Image
          source={mascotPlus}
          style={{
            position: 'absolute', right: -98, bottom: -19,
            width: 328, height: 188,
            transform: [{ rotate: '-8deg' }],
            zIndex: 1,
            shadowColor: '#2A2320',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.42,
            shadowRadius: 28,
          }}
          resizeMode="contain"
        />

      </View>

      {/* Feature list */}
      <View style={{ marginHorizontal: 16, marginBottom: 14, gap: 10 }}>
        {PREMIUM_FEATURES.map((f, i) => (
          <View key={i} className="bg-card" style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            borderRadius: 20, padding: 14, paddingHorizontal: 16,
            shadowColor: '#2A2320', shadowOpacity: 0.05, shadowRadius: 16,
            shadowOffset: { width: 0, height: 4 }, elevation: 2,
          }}>
            <View style={{
              width: 38, height: 38, borderRadius: 12,
              backgroundColor: i % 2 === 0 ? '#FCE8D4' : '#D8CCEC',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name={f.icon} size={16} color={i % 2 === 0 ? '#C85F28' : '#6B4A9E'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14.5 }}>{f.title}</Text>
              <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, marginTop: 2 }}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Pricing cards */}
      <View className="flex-row" style={{ gap: 10, paddingHorizontal: 16, marginBottom: 8 }}>
        {/* Monthly */}
        <Pressable
          onPress={() => setPlan('month')}
          className={`flex-1 ${plan === 'month' ? 'bg-card' : ''}`}
          style={{
            padding: 14, paddingBottom: 16, borderRadius: 20,
            borderWidth: 2,
            borderColor: plan === 'month' ? '#E87A3D' : 'rgba(42,35,32,0.08)',
            shadowColor: plan === 'month' ? '#2A2320' : 'transparent',
            shadowOpacity: plan === 'month' ? 0.05 : 0,
            shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
            elevation: plan === 'month' ? 2 : 0,
          }}
        >
          <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }}>รายเดือน</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-foreground" style={{ fontFamily: 'Inter_900Black', fontSize: 26, marginTop: 4 }}>฿99</Text>
            <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, marginTop: 2 }}>/ เดือน</Text>
          </View>

          <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, marginTop: 6 }}>ยกเลิกได้ทุกเมื่อ</Text>
        </Pressable>

        {/* Yearly */}
        <View className="flex-1" style={{ position: 'relative' }}>
          <View style={{
            position: 'absolute', top: -10, right: 10, zIndex: 2,
            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
            backgroundColor: '#E8B547',
          }}>
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 10, color: '#2A2320' }}>คุ้มสุด ★</Text>
          </View>
          <Pressable
            onPress={() => setPlan('year')}
            className={plan === 'year' ? 'bg-card' : ''}
            style={{
              padding: 14, paddingBottom: 16, borderRadius: 20,
              borderWidth: 2,
              borderColor: plan === 'year' ? '#E87A3D' : 'rgba(42,35,32,0.08)',
              shadowColor: plan === 'year' ? '#2A2320' : 'transparent',
              shadowOpacity: plan === 'year' ? 0.05 : 0,
              shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
              elevation: plan === 'year' ? 2 : 0,
            }}
          >
            <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }}>รายปี</Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-foreground" style={{ fontFamily: 'Inter_900Black', fontSize: 26, marginTop: 4 }}>฿899</Text>
              <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, marginTop: 2 }}>/ ปี</Text>
            </View>
            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 11, color: '#C85F28', marginTop: 6 }}>ประหยัด 25%</Text>
          </Pressable>
        </View>
      </View>

      {/* CTA Button */}
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <Pressable
          onPress={() => {
            Alert.alert(
              'เร็ว ๆ นี้',
              'ระบบสมัครสมาชิกกำลังพัฒนา ขอบคุณที่สนใจ!',
              [
                { text: 'ตกลง', style: 'default' },
                { text: 'ทดลองใช้ (Dev)', onPress: onUnlock },
              ],
            );
          }}
          style={{
            height: 52, borderRadius: 999,
            backgroundColor: '#E87A3D',
            shadowColor: '#E87A3D', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
            elevation: 8,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16, color: '#fff' }}>เริ่มใช้ Premium</Text>
          <Ionicons name="paw" size={14} color="#fff" />
        </Pressable>
      </View>

      {/* Footer */}
      <Text style={{
        fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11,
        textAlign: 'center', color: '#9A8D80',
        paddingHorizontal: 24, paddingTop: 12,
      }}>
        ทดลองฟรี 7 วัน · ยกเลิกได้ก่อนคิดเงิน
      </Text>
    </ScrollView>
  );
}

// ===== Loading Animation =====

const LOADING_STEPS = [
  { icon: 'document-text-outline' as const, text: 'กำลังรวบรวมข้อมูล...' },
  { icon: 'analytics-outline' as const, text: 'วิเคราะห์รายรับ-รายจ่าย...' },
  { icon: 'sparkles-outline' as const, text: 'AI กำลังประมวลผล...' },
  { icon: 'checkmark-circle-outline' as const, text: 'กำลังสรุปผลลัพธ์...' },
];

function AiLoadingView() {
  const pulse = useSharedValue(0);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    const interval = setInterval(() => {
      setStepIndex(prev => (prev + 1) % LOADING_STEPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.4, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.95, 1.05]) }],
  }));

  const step = LOADING_STEPS[stepIndex];

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      className="bg-card rounded-2xl p-6 border border-border mb-6 items-center"
    >
      <View className="mb-4">
        <MiawThinking size={100} />
      </View>
      <Animated.Text key={stepIndex} entering={FadeIn.duration(400)} className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 16, marginBottom: 4 }}>
        {step.text}
      </Animated.Text>
      <Text className="text-muted-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, marginBottom: 16 }}>โปรดรอสักครู่</Text>
      <View className="w-full gap-3">
        {[0, 1, 2].map(i => <ShimmerBar key={i} index={i} />)}
      </View>
    </Animated.View>
  );
}

function ShimmerBar({ index }: { index: number }) {
  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withDelay(index * 150, withRepeat(withTiming(1, { duration: 1000, easing: Easing.ease }), -1, true));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: interpolate(shimmer.value, [0, 1], [0.2, 0.5]) }));
  const width = index === 0 ? '100%' : index === 1 ? '75%' : '50%';
  return <Animated.View style={[style, { width, height: 10, borderRadius: 5, backgroundColor: '#888' }]} />;
}

// ===== History Modal =====

function HistoryModal({
  visible,
  onClose,
  histories,
  wallets,
  onView,
  onDelete,
  onBulkDelete,
  selectedHistoryId,
}: {
  visible: boolean;
  onClose: () => void;
  histories: AiHistory[];
  wallets: { id: string; name: string }[];
  onView: (h: AiHistory) => void;
  onDelete: (h: AiHistory) => void;
  onBulkDelete: (ids: string[]) => void;
  selectedHistoryId: string | null;
}) {
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterWalletId, setFilterWalletId] = useState<string | 'all'>('all');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const years = useMemo(() => {
    const set = new Set(histories.map(h => h.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [histories]);

  const filtered = useMemo(() => {
    return histories.filter(h => {
      if (filterYear !== null && h.year !== filterYear) return false;
      if (filterMonth !== null && h.month !== filterMonth) return false;
      if (filterWalletId !== 'all' && h.walletId !== filterWalletId) return false;
      return true;
    });
  }, [histories, filterYear, filterMonth, filterWalletId]);

  const filterSummary = useMemo(() => {
    const yearLabel = filterYear === null ? 'ทุกปี' : `พ.ศ. ${filterYear + 543}`;
    const monthLabel =
      filterYear === null ? null : filterMonth === null ? 'ทุกเดือน' : THAI_MONTHS_SHORT[filterMonth];
    let walletLabel: string;
    if (filterWalletId === 'all') walletLabel = 'ทุกกระเป๋า';
    else if (filterWalletId === 'none') walletLabel = 'ไม่ระบุกระเป๋า';
    else walletLabel = wallets.find(w => w.id === filterWalletId)?.name ?? 'กระเป๋า';
    return { yearLabel, monthLabel, walletLabel };
  }, [filterYear, filterMonth, filterWalletId, wallets]);

  const handleConfirmBulkDelete = () => {
    onBulkDelete(filtered.map(h => h.id));
    setConfirmOpen(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 bg-black/40" />
      <View className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl" style={{ height: '90%' }}>
        <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
          <View className="flex-row items-center gap-4">
            <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18 }}>ประวัติการวิเคราะห์</Text>
            <Pressable
              onPress={() => setConfirmOpen(true)}
              disabled={filtered.length === 0}
              hitSlop={6}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: filtered.length === 0 ? '#FECACA80' : '#FECACA',
                backgroundColor: pressed ? '#FEE2E2' : '#FFF1F1',
                opacity: filtered.length === 0 ? 0.5 : 1,
              })}
              accessibilityRole="button"
              accessibilityLabel="ลบทั้งหมดตามตัวกรอง"
            >
              <View className="flex-row items-center gap-2 border border-border rounded-lg px-2 py-1">
                <Ionicons name="trash-outline" size={14} color="#DC2626" />
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#DC2626' }}>
                  ลบตามตัวกรอง
                </Text>
              </View>
            </Pressable>

          </View>
          <Pressable onPress={onClose} className="p-1">
            <Ionicons name="close" size={22} color="#666" />
          </Pressable>
        </View>

        {/* Filters */}
        <View className="px-4 pb-2 flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => { setFilterYear(null); setFilterMonth(null); }}
            className={`px-3 py-1.5 rounded-full border ${filterYear === null ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
          >
            <Text className="text-foreground" style={{ fontFamily: filterYear === null ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular', fontSize: 13 }}>ทุกปี</Text>
          </Pressable>
          {years.map(y => (
            <Pressable
              key={y}
              onPress={() => { setFilterYear(y); setFilterMonth(null); }}
              className={`px-3 py-1.5 rounded-full border ${filterYear === y ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
            >
              <Text className="text-foreground" style={{ fontFamily: filterYear === y ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular', fontSize: 13 }}>{y + 543}</Text>
            </Pressable>
          ))}
        </View>

        {filterYear !== null && (
          <View className="px-4 pb-2 flex-row flex-wrap gap-2">
            <Pressable
              onPress={() => setFilterMonth(null)}
              className={`px-3 py-1.5 rounded-full border ${filterMonth === null ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
            >
              <Text className="text-foreground" style={{ fontFamily: filterMonth === null ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular', fontSize: 13 }}>ทุกเดือน</Text>
            </Pressable>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <Pressable
                key={m}
                onPress={() => setFilterMonth(m)}
                className={`px-3 py-1.5 rounded-full border ${filterMonth === m ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
              >
                <Text className="text-foreground" style={{ fontFamily: filterMonth === m ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular', fontSize: 12 }}>{THAI_MONTHS_SHORT[m]}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View className="px-4 pb-3 flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => setFilterWalletId('all')}
            className={`px-3 py-1.5 rounded-full border ${filterWalletId === 'all' ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
          >
            <Text className="text-foreground" style={{ fontFamily: filterWalletId === 'all' ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular', fontSize: 13 }}>ทุกกระเป๋า</Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterWalletId('none')}
            className={`px-3 py-1.5 rounded-full border ${filterWalletId === 'none' ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
          >
            <Text className="text-foreground" style={{ fontFamily: filterWalletId === 'none' ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular', fontSize: 12 }}>ไม่ระบุ</Text>
          </Pressable>
          {wallets.map(w => (
            <Pressable
              key={w.id}
              onPress={() => setFilterWalletId(w.id)}
              className={`px-3 py-1.5 rounded-full border ${filterWalletId === w.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
            >
              <Text className="text-foreground" style={{ fontFamily: filterWalletId === w.id ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular', fontSize: 12 }}>{w.name}</Text>
            </Pressable>
          ))}
        </View>

        {/* List */}
        <ScrollView className="px-4 pb-6 bg-card">
          {filtered.length === 0 ? (
            <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, textAlign: 'center', paddingVertical: 32 }}>ไม่พบประวัติ</Text>
          ) : (
            filtered.map(h => {
              const isSelected = selectedHistoryId === h.id;
              return (
                <Pressable
                  key={h.id}
                  onPress={() => { onView(h); onClose(); }}
                  onLongPress={() => onDelete(h)}
                  className={isSelected ? '' : 'bg-card'}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 16, paddingVertical: 12,
                    borderRadius: 12, marginBottom: 8,
                    backgroundColor: isSelected ? '#FFF6EE' : undefined,
                    borderWidth: 1.5,
                    borderColor: isSelected ? '#E87A3D' : 'transparent',
                    opacity: pressed ? 0.6 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <View className="flex-row items-center gap-4 px-2 py-1 rounded-lg border border-border mb-4">
                    <Ionicons
                      name={h.promptType === 'savings_goal' ? 'flag' : 'document-text-outline'}
                      size={20}
                      color="#E87A3D"
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} >
                        <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14, flexShrink: 1 }} numberOfLines={1}>
                          {getPeriodLabel(h.year, h.month)} — {h.walletId ? wallets.find(w => w.id === h.walletId)?.name : 'ทุกกระเป๋า'}
                        </Text>
                        {isSelected && (
                          <View style={{
                            paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
                            backgroundColor: '#E87A3D',
                            flexDirection: 'row', alignItems: 'center', gap: 3,
                          }}>
                            <Ionicons name="eye" size={9} color="#fff" />
                            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 9.5, color: '#fff' }}>กำลังดู</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5, color: isSelected ? '#C85F28' : '#9A8D80', marginTop: 2 }}>
                        {h.promptType === 'savings_goal'
                          ? `🎯 ${formatCurrency(h.targetAmount ?? 0)} · ${h.targetMonths ?? 0} เดือน`
                          : h.promptType === 'structured' ? 'แบบสรุป' : 'แบบละเอียด'} · {new Date(h.createdAt).toLocaleDateString('th-TH')}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                      size={isSelected ? 18 : 16}
                      color={isSelected ? '#E87A3D' : '#ccc'}
                    />
                    <Pressable
                      onPress={() => onDelete(h)}
                      hitSlop={8}
                      style={({ pressed }) => ({
                        marginLeft: 10,
                        width: 34, height: 34, borderRadius: 10,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: pressed ? '#FEE2E2' : '#FFF1F1',
                        borderWidth: 1, borderColor: '#FECACA',
                        opacity: pressed ? 0.7 : 1,
                        transform: [{ scale: pressed ? 0.92 : 1 }],
                      })}
                      accessibilityRole="button"
                      accessibilityLabel="ลบประวัติ"
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Bulk delete confirmation dialog */}
      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <Pressable
          onPress={() => setConfirmOpen(false)}
          className="flex-1 bg-black/50 items-center justify-center px-6"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-background rounded-2xl p-5"
            style={{ borderWidth: 1, borderColor: '#FECACA' }}
          >
            <View className="flex-row items-center gap-2 mb-3">
              <View
                style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: '#FEE2E2',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="warning-outline" size={18} color="#DC2626" />
              </View>
              <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16 }}>
                ยืนยันการลบ
              </Text>
            </View>

            <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, lineHeight: 20, marginBottom: 12 }}>
              จะลบประวัติการวิเคราะห์{' '}
              <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', color: '#DC2626' }}>
                {filtered.length} รายการ
              </Text>
              {' '}ตามตัวกรองด้านล่าง การลบนี้ไม่สามารถย้อนกลับได้
            </Text>

            <View
              style={{
                backgroundColor: '#FFF6EE',
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#FED7AA',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#9A8D80' }}>ปี</Text>
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#2B2118' }}>
                  {filterSummary.yearLabel}
                </Text>
              </View>
              {filterSummary.monthLabel !== null && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#9A8D80' }}>เดือน</Text>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#2B2118' }}>
                    {filterSummary.monthLabel}
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#9A8D80' }}>กระเป๋า</Text>
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#2B2118' }}>
                  {filterSummary.walletLabel}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setConfirmOpen(false)}
                className="flex-1 py-3 rounded-full items-center border border-border bg-card"
              >
                <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }}>
                  ยกเลิก
                </Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmBulkDelete}
                className="flex-1 py-3 rounded-full items-center"
                style={{ backgroundColor: '#DC2626' }}
              >
                <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14, color: '#fff' }}>
                  ยืนยันลบ {filtered.length} รายการ
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}

// ===== Import/Export progress overlay =====

const PHASE_LABEL_TH: Record<ImportProgress['phase'], string> = {
  wallets: 'กระเป๋าเงิน',
  categories: 'หมวดหมู่',
  transactions: 'ธุรกรรม',
  analysis: 'รายการที่ใช้บ่อย',
  aiHistory: 'ประวัติ AI',
};

function ImportProgressOverlay({
  visible,
  mode,
  progress,
}: {
  visible: boolean;
  mode: 'import' | 'export';
  progress: ImportProgress | null;
}) {
  if (!visible) return null;
  const isImport = mode === 'import';
  const overallPct = progress && progress.total > 0
    ? Math.min(100, Math.round((progress.current / progress.total) * 100))
    : 0;
  const phaseLabel = progress ? PHASE_LABEL_TH[progress.phase] : null;

  return (
    <View
      pointerEvents="auto"
      className="absolute inset-0 items-center justify-center bg-black/50"
      style={{ zIndex: 50 }}
    >
      <View
        className="bg-card border border-border"
        style={{
          width: '86%', maxWidth: 360,
          borderRadius: 22, paddingHorizontal: 20, paddingVertical: 22,
          alignItems: 'center',
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Ionicons
            name={isImport ? 'cloud-download-outline' : 'cloud-upload-outline'}
            size={22}
            color="#E87A3D"
          />
          <Text
            className="text-foreground"
            style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16 }}
          >
            {isImport ? 'กำลังนำเข้าข้อมูล' : 'กำลังส่งออกข้อมูล'}
          </Text>
        </View>

        <PawLoading size={26} color="#E87A3D" count={4} gap={6} zigzag={5} />

        {/* Progress detail (import only — export has no granular progress) */}
        {isImport && progress && progress.total > 0 ? (
          <View style={{ width: '100%', marginTop: 16 }}>
            {/* Phase row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text
                style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13 }}
                className="text-foreground"
              >
                {phaseLabel}
              </Text>
              <Text
                style={{ fontFamily: 'Inter_700Bold', fontSize: 13, fontVariant: ['tabular-nums'], color: '#E87A3D' }}
              >
                {progress.phaseCurrent} / {progress.phaseTotal}
              </Text>
            </View>

            {/* Overall progress bar */}
            <View
              className="bg-secondary"
              style={{ width: '100%', height: 8, borderRadius: 4, overflow: 'hidden' }}
            >
              <View
                style={{
                  width: `${overallPct}%`, height: '100%',
                  backgroundColor: '#E87A3D', borderRadius: 4,
                }}
              />
            </View>

            {/* Total summary */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <Text
                style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }}
                className="text-muted-foreground"
              >
                นำเข้าแล้ว
              </Text>
              <Text
                style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, fontVariant: ['tabular-nums'] }}
                className="text-foreground"
              >
                {progress.current} / {progress.total} รายการ ({overallPct}%)
              </Text>
            </View>
          </View>
        ) : (
          <Text
            style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#9A8D80', marginTop: 10 }}
          >
            {isImport ? 'กำลังเตรียมข้อมูล กรุณารอสักครู่' : 'ไฟล์กำลังถูกสร้าง กรุณารอสักครู่'}
          </Text>
        )}

        {/* Warning */}
        <Text
          style={{
            fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11,
            color: '#B66B13', marginTop: 14, textAlign: 'center',
          }}
        >
          ห้ามปิดแอปจนกว่าจะดำเนินการเสร็จ
        </Text>
      </View>
    </View>
  );
}

// ===== Data Transfer Tab =====

function DataTransferTab() {
  const [dataTab, setDataTab] = useState<DataTab>('export');
  const [format, setFormat] = useState<DataFormat>('txt');
  const [counts, setCounts] = useState<ExportCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [exportDone, setExportDone] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const loadTransactions = useTransactionStore(s => s.loadTransactions);
  const loadCategories = useCategoryStore(s => s.loadCategories);
  const wallets = useWalletStore(s => s.wallets);
  const loadWallets = useWalletStore(s => s.loadWallets);
  const loadAnalysis = useAnalysisStore(s => s.loadAnalysis);
  const loadAiHistories = useAiHistoryStore(s => s.loadHistories);
  const reloadAlertSettings = useAlertSettingsStore(s => s.loadAlertSettings);
  const loadTheme = useThemeStore(s => s.loadTheme);
  const loadSettings = useSettingsStore(s => s.loadSettings);

  useEffect(() => {
    getExportCounts().then(setCounts);
  }, []);

  const reloadAllStores = useCallback(async () => {
    await Promise.all([
      loadTransactions(), loadCategories(), loadWallets(), loadAnalysis(),
      loadAiHistories(), reloadAlertSettings(), loadTheme(), loadSettings(),
    ]);
  }, [loadTransactions, loadCategories, loadWallets, loadAnalysis, loadAiHistories, reloadAlertSettings, loadTheme, loadSettings]);

  const handleExport = useCallback(async () => {
    setLoading(true);
    setExportError(null);
    setExportDone(false);
    try {
      if (format === 'txt') await exportAllData();
      else await exportAllDataExcel();
      setExportDone(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'ไม่สามารถส่งออกข้อมูลได้';
      setExportError(msg);
    } finally {
      setLoading(false);
    }
  }, [format]);

  const handleImport = useCallback(async () => {
    setLoading(true);
    setImportResult(null);
    setImportProgress(null);
    try {
      const result = format === 'txt'
        ? await pickAndImportData(setImportProgress)
        : await pickAndImportDataExcel(setImportProgress);
      setImportResult(result);
      if (result.success) await reloadAllStores();
    } catch {
      setImportResult({
        success: false, wallets: 0, walletsRenamed: 0, walletNames: [],
        categories: 0, transactions: 0, analysis: 0, aiHistory: 0,
        settingsRestored: false, error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
      });
    } finally {
      setLoading(false);
      setImportProgress(null);
    }
  }, [format, reloadAllStores]);

  const clearFeedback = () => {
    setExportDone(false);
    setExportError(null);
    setImportResult(null);
  };

  return (
    <View>
      {/* Sub-tab: Export / Import */}
      <View className="flex-row mb-3 rounded-xl overflow-hidden border border-border">
        <Pressable
          onPress={() => { setDataTab('export'); clearFeedback(); }}
          className={`flex-1 flex-row items-center justify-center py-2.5 ${dataTab === 'export' ? 'bg-primary' : 'bg-card'}`}
        >
          <Ionicons name="cloud-upload-outline" size={16} color={dataTab === 'export' ? 'white' : '#666'} />
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: dataTab === 'export' ? '#fff' : '#9A8D80', marginLeft: 6 }}>ส่งออก</Text>
        </Pressable>
        <Pressable
          onPress={() => { setDataTab('import'); clearFeedback(); }}
          className={`flex-1 flex-row items-center justify-center py-2.5 ${dataTab === 'import' ? 'bg-primary' : 'bg-card'}`}
        >
          <Ionicons name="cloud-download-outline" size={16} color={dataTab === 'import' ? 'white' : '#666'} />
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: dataTab === 'import' ? '#fff' : '#9A8D80', marginLeft: 6 }}>นำเข้า</Text>
        </Pressable>
      </View>

      {/* Format: TXT / Excel */}
      <View className="flex-row mb-4">
        <Pressable
          onPress={() => { setFormat('txt'); clearFeedback(); }}
          className={`flex-1 items-center py-2 mx-1 rounded-lg border ${format === 'txt' ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
        >
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: format === 'txt' ? '#E87A3D' : '#9A8D80' }}>TXT (JSON)</Text>
        </Pressable>
        <Pressable
          onPress={() => { setFormat('excel'); clearFeedback(); }}
          className={`flex-1 items-center py-2 mx-1 rounded-lg border ${format === 'excel' ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
        >
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: format === 'excel' ? '#E87A3D' : '#9A8D80' }}>Excel (.xlsx)</Text>
        </Pressable>
      </View>

      {dataTab === 'export' ? (
        <View>
          {/* Data counts */}
          <View className="bg-card rounded-2xl p-4 mb-4 border border-border">
            <View className="flex-row items-center mb-3">
              <Ionicons name={format === 'txt' ? 'document-text-outline' : 'grid-outline'} size={20} color="#E87A3D" />
              <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15, marginLeft: 8 }}>ข้อมูลที่จะส่งออก</Text>
            </View>
            {counts ? (
              <View className="gap-2">
                <CountRow icon="wallet-outline" label="กระเป๋าเงิน" count={counts.wallets} />
                <CountRow icon="grid-outline" label="หมวดหมู่" count={counts.categories} />
                <CountRow icon="receipt-outline" label="ธุรกรรม" count={counts.transactions} />
                <CountRow icon="analytics-outline" label="การวิเคราะห์" count={counts.analysis} />
                <CountRow icon="sparkles-outline" label="ประวัติ AI" count={counts.aiHistory} />
                <CountRow icon="settings-outline" label="ตั้งค่าแอป" count={counts.hasSettings ? 1 : 0} suffix="✓" />
                <CountRow icon="alert-circle-outline" label="ตั้งค่าการแจ้งเตือน" count={counts.hasAlertSettings ? 1 : 0} suffix="✓" />
              </View>
            ) : (
              <ActivityIndicator size="small" />
            )}
          </View>

          {/* Wallet list preview (export) */}
          {wallets.length > 0 && (
            <View className="bg-card rounded-2xl p-4 mb-4 border border-border">
              <View className="flex-row items-center mb-3">
                <Ionicons name="list-outline" size={18} color="#E87A3D" />
                <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14, marginLeft: 8 }}>
                  รายชื่อกระเป๋าที่จะส่งออก ({wallets.length})
                </Text>
              </View>
              <View style={{ gap: 6 }}>
                {wallets.map(w => (
                  <View key={w.id} className="flex-row items-center">
                    <View
                      style={{
                        width: 8, height: 8, borderRadius: 4,
                        backgroundColor: w.color, marginRight: 8,
                      }}
                    />
                    <Text
                      className="text-foreground flex-1"
                      numberOfLines={1}
                      style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }}
                    >
                      {w.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Info */}
          <View className="bg-blue-50 rounded-xl p-3 mb-4 border border-blue-200">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={18} color="#3b82f6" style={{ marginTop: 1 }} />
              <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#3b82f6', marginLeft: 8, flex: 1 }}>
                {format === 'txt'
                  ? 'ข้อมูลจะถูกส่งออกเป็นไฟล์ .txt (JSON) รวมข้อมูลทั้งหมดในแอป สามารถใช้นำเข้ากลับได้'
                  : 'ข้อมูลจะถูกส่งออกเป็นไฟล์ .xlsx รวมข้อมูลทั้งหมด สามารถเปิดด้วย Google Sheets, Excel หรือนำเข้ากลับได้'}
              </Text>
            </View>
          </View>

          {/* Feedback */}
          {exportDone && (
            <View className="bg-green-50 rounded-xl p-3 mb-4 border border-green-200">
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: '#22c55e', marginLeft: 8 }}>ส่งออกข้อมูลเรียบร้อย!</Text>
              </View>
            </View>
          )}
          {exportError && (
            <View className="bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
              <View className="flex-row items-start">
                <Ionicons name="close-circle" size={18} color="#ef4444" style={{ marginTop: 1 }} />
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#ef4444', marginLeft: 8, flex: 1 }}>{exportError}</Text>
              </View>
            </View>
          )}

          {/* Export button */}
          <Pressable onPress={handleExport} disabled={loading || !counts}
            className={`rounded-xl py-4 items-center ${loading ? 'bg-primary/50' : 'bg-primary'}`}>
            {loading ? (
              <View className="flex-row items-center">
                <PawLoading size={18} color="white" count={3} gap={4} zigzag={3} />
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15, color: '#fff', marginLeft: 8 }}>กำลังส่งออก...</Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="share-outline" size={20} color="white" />
                <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, color: '#fff', marginLeft: 8 }}>
                  ส่งออกข้อมูลทั้งหมด ({format === 'txt' ? '.txt' : '.xlsx'})
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      ) : (
        <View>
          {/* Import description */}
          <View className="bg-card rounded-2xl p-4 mb-4 border border-border">
            <View className="flex-row items-center mb-3">
              <Ionicons name="folder-open-outline" size={20} color="#E87A3D" />
              <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15, marginLeft: 8 }}>นำเข้าจากไฟล์สำรอง</Text>
            </View>
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#9A8D80' }}>
              {format === 'txt'
                ? 'เลือกไฟล์ .txt ที่ส่งออกจาก CeasFlow เพื่อนำข้อมูลเข้าสู่แอป'
                : 'เลือกไฟล์ .xlsx ที่ส่งออกจาก CeasFlow เพื่อนำข้อมูลเข้าสู่แอป'}
            </Text>
          </View>

          {/* Warning */}
          <View className="bg-amber-50 rounded-xl p-3 mb-4 border border-amber-200">
            <View className="flex-row items-start">
              <Ionicons name="warning" size={18} color="#f59e0b" style={{ marginTop: 1 }} />
              <View className="ml-2 flex-1">
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#92400e', marginBottom: 4 }}>หมายเหตุ</Text>
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#b45309' }}>• กระเป๋าที่ชื่อซ้ำจะสร้างเป็นชื่อใหม่ เช่น "เงินสด (2)"</Text>
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#b45309' }}>• ข้อมูลเดิมในแอปจะไม่ถูกลบ</Text>
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#b45309' }}>• หมวดหมู่ default ที่มีอยู่แล้วจะไม่ถูกสร้างซ้ำ</Text>
              </View>
            </View>
          </View>

          {/* Import result */}
          {importResult && importResult.success && (
            <View className="bg-green-50 rounded-2xl p-4 mb-4 border border-green-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
                <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, color: '#15803d', marginLeft: 8 }}>นำเข้าสำเร็จ!</Text>
              </View>
              <View className="gap-1.5">
                <ResultRow label="กระเป๋าเงิน" count={importResult.wallets} extra={importResult.walletsRenamed > 0 ? `เปลี่ยนชื่อ ${importResult.walletsRenamed}` : undefined} />
                <ResultRow label="หมวดหมู่ใหม่" count={importResult.categories} />
                <ResultRow label="ธุรกรรม" count={importResult.transactions} />
                <ResultRow label="การวิเคราะห์" count={importResult.analysis} />
                <ResultRow label="ประวัติ AI" count={importResult.aiHistory} />
                {importResult.settingsRestored && (
                  <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#15803d' }}>✓ คืนค่าตั้งค่าแอปแล้ว</Text>
                )}
              </View>
              {importResult.walletNames.length > 0 && (
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#bbf7d0' }}>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#15803d', marginBottom: 6 }}>
                    กระเป๋าที่นำเข้า ({importResult.walletNames.length}):
                  </Text>
                  {importResult.walletNames.map((name, i) => (
                    <Text
                      key={`${name}-${i}`}
                      numberOfLines={1}
                      style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#166534' }}
                    >
                      • {name}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
          {importResult && !importResult.success && (
            <View className="bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
              <View className="flex-row items-center">
                <Ionicons name="close-circle" size={18} color="#ef4444" />
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#ef4444', marginLeft: 8 }}>{importResult.error}</Text>
              </View>
            </View>
          )}

          {/* Import button */}
          <Pressable onPress={handleImport} disabled={loading}
            className={`rounded-xl py-4 items-center ${loading ? 'bg-primary/50' : 'bg-primary'}`}>
            {loading ? (
              <View className="flex-row items-center">
                <PawLoading size={18} color="white" count={3} gap={4} zigzag={3} />
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15, color: '#fff', marginLeft: 8 }}>กำลังนำเข้า...</Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="document-attach-outline" size={20} color="white" />
                <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, color: '#fff', marginLeft: 8 }}>
                  เลือกไฟล์ {format === 'txt' ? '.txt' : '.xlsx'} แล้วนำเข้า
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      )}

      {/* Loading overlay */}
      <ImportProgressOverlay
        visible={loading}
        mode={dataTab === 'export' ? 'export' : 'import'}
        progress={importProgress}
      />
    </View>
  );
}

function CountRow({ icon, label, count, suffix }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; count: number; suffix?: string;
}) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon} size={16} color="#666" />
      <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, marginLeft: 8, flex: 1 }}>{label}</Text>
      <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: '#9A8D80' }}>
        {suffix && count > 0 ? suffix : `${count} รายการ`}
      </Text>
    </View>
  );
}

function ResultRow({ label, count, extra }: { label: string; count: number; extra?: string }) {
  return (
    <View className="flex-row items-center">
      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#15803d', flex: 1 }}>• {label}</Text>
      <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#166534' }}>
        {count} รายการ{extra ? ` (${extra})` : ''}
      </Text>
    </View>
  );
}

// ===== Special Import (Pay Flow .txt) =====

function SpecialImportSection({ onSuccess }: { onSuccess: () => void | Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleImport = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setProgress(null);
    try {
      const r = await pickAndImportSpecialData(setProgress);
      setResult(r);
      if (r.success) await onSuccess();
    } catch {
      setResult({
        success: false, wallets: 0, walletsRenamed: 0, walletNames: [],
        categories: 0, transactions: 0, analysis: 0, aiHistory: 0,
        settingsRestored: false, error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
      });
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [onSuccess]);

  return (
    <View style={{ marginTop: 22 }}>
      {/* Section header */}
      <View className="flex-row items-center" style={{ marginBottom: 10, gap: 8 }}>
        <View style={{
          width: 28, height: 28, borderRadius: 8,
          backgroundColor: '#FCE8D4',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="sparkles-outline" size={14} color="#C85F28" />
        </View>
        <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 20 }}>
          นำเข้าข้อมูลแบบพิเศษ
        </Text>
      </View>

      {/* Description card */}
      <View className="bg-card rounded-2xl p-4 mb-3 border border-border">
        <View className="flex-row items-center mb-2">
          <Ionicons name="document-text-outline" size={18} color="#E87A3D" />
          <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14, marginLeft: 8 }}>
            รองรับไฟล์รายงาน Pay Flow (.txt)
          </Text>
        </View>
        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12.5, color: '#9A8D80', lineHeight: 18 }}>
          เลือกไฟล์รายงานข้อมูลของแอป Pay Flow เพื่อสร้างกระเป๋าเงิน หมวดหมู่ และนำเข้ารายการทั้งหมดอัตโนมัติ ใช้สำหรับนำเข้าเท่านั้น (ไม่ส่งออก)
        </Text>
      </View>

      {/* Notes */}
      <View className="bg-amber-50 rounded-xl p-3 mb-3 border border-amber-200">
        <View className="flex-row items-start">
          <Ionicons name="information-circle" size={18} color="#f59e0b" style={{ marginTop: 1 }} />
          <View className="ml-2 flex-1">
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#b45309' }}>• กระเป๋า/หมวดหมู่ที่ชื่อตรงกัน จะใช้ของเดิม ไม่สร้างซ้ำ</Text>
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#b45309' }}>• หมวดหมู่ใหม่จะถูกสร้างเป็นแบบกำหนดเอง พร้อมไอคอน emoji ตามไฟล์</Text>
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#b45309' }}>• ข้อมูลเดิมในแอปจะไม่ถูกลบ</Text>
          </View>
        </View>
      </View>

      {/* Result */}
      {result && result.success && (
        <View className="bg-green-50 rounded-2xl p-4 mb-3 border border-green-200">
          <View className="flex-row items-center mb-2">
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14, color: '#15803d', marginLeft: 8 }}>นำเข้าสำเร็จ!</Text>
          </View>
          <View className="gap-1.5">
            <ResultRow label="กระเป๋าเงิน" count={result.wallets} extra={result.walletsRenamed > 0 ? `เปลี่ยนชื่อ ${result.walletsRenamed}` : undefined} />
            <ResultRow label="หมวดหมู่ใหม่" count={result.categories} />
            <ResultRow label="ธุรกรรม" count={result.transactions} />
            <ResultRow label="รายการที่ใช้บ่อย" count={result.analysis} />
          </View>
          {result.walletNames.length > 0 && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#bbf7d0' }}>
              <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#15803d', marginBottom: 6 }}>
                กระเป๋าที่นำเข้า ({result.walletNames.length}):
              </Text>
              {result.walletNames.map((name, i) => (
                <Text
                  key={`${name}-${i}`}
                  numberOfLines={1}
                  style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#166534' }}
                >
                  • {name}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
      {result && !result.success && (
        <View className="bg-red-50 rounded-xl p-3 mb-3 border border-red-200">
          <View className="flex-row items-center">
            <Ionicons name="close-circle" size={18} color="#ef4444" />
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#ef4444', marginLeft: 8, flex: 1 }}>{result.error}</Text>
          </View>
        </View>
      )}

      {/* Import button */}
      <Pressable
        onPress={handleImport}
        disabled={loading}
        className={`rounded-xl py-4 items-center ${loading ? 'bg-primary/50' : 'bg-primary'}`}
      >
        {loading ? (
          <View className="flex-row items-center">
            <PawLoading size={18} color="white" count={3} gap={4} zigzag={3} />
            <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14.5, color: '#fff', marginLeft: 8 }}>กำลังนำเข้า...</Text>
          </View>
        ) : (
          <View className="flex-row items-center">
            <Ionicons name="cloud-download-outline" size={20} color="white" />
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14.5, color: '#fff', marginLeft: 8 }}>
              เลือกไฟล์ Pay Flow (.txt) แล้วนำเข้า
            </Text>
          </View>
        )}
      </Pressable>

      {/* Special import loading overlay */}
      <ImportProgressOverlay visible={loading} mode="import" progress={progress} />
    </View>
  );
}

// ===== Main Screen =====

export default function PremiumScreen() {
  const [isPremium, setIsPremium] = useState(false);
  const [innerTab, setInnerTab] = useState<InnerTab>('ai');

  const wallets = useWalletStore(s => s.wallets);
  const reloadWallets = useWalletStore(s => s.loadWallets);
  const reloadCategories = useCategoryStore(s => s.loadCategories);
  const reloadTransactions = useTransactionStore(s => s.loadTransactions);
  const reloadAnalysis = useAnalysisStore(s => s.loadAnalysis);
  const { histories, addHistory, deleteHistory, deleteHistoriesBulk } = useAiHistoryStore();

  const reloadAfterSpecialImport = useCallback(async () => {
    await Promise.all([
      reloadWallets(),
      reloadCategories(),
      reloadTransactions(),
      reloadAnalysis(),
    ]);
  }, [reloadWallets, reloadCategories, reloadTransactions, reloadAnalysis]);

  const currentYear = new Date().getFullYear() + 543;

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [promptType, setPromptType] = useState<PromptType>('structured');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<{
    type: string;
    data: string;
    periodLabel: string;
    targetAmount?: number | null;
    targetMonths?: number | null;
  } | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyTail, setApiKeyTail] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState('ตรวจสอบ...');
  const [apiKeyHelpVisible, setApiKeyHelpVisible] = useState(false);
  const [apiKeySetupVisible, setApiKeySetupVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // Savings goal feature
  const [savingsGoalExpanded, setSavingsGoalExpanded] = useState(false);
  const [savingsTargetAmount, setSavingsTargetAmount] = useState('10000');
  const [savingsTargetMonths, setSavingsTargetMonths] = useState('3');
  // Category IDs the user excludes from savings-goal analysis — their
  // transactions are stripped out of the summary sent to the AI.
  const [excludedCategoryIds, setExcludedCategoryIds] = useState<Set<string>>(new Set());

  const allCategories = useCategoryStore(s => s.categories);
  const expenseCategoriesForExclude = useMemo(
    () => allCategories.filter(c => c.type === 'expense'),
    [allCategories],
  );

  // History list filter — 'all' | 'analyze' (structured/full) | 'savings_goal'
  const [historyKindFilter, setHistoryKindFilter] = useState<'all' | 'analyze' | 'savings_goal'>('all');

  const gregorianYear = selectedYear - 543;

  const loadYears = useCallback(async (walletId: string | null) => {
    try {
      const db = getDb();
      const gregorianYears = await getAvailableYears(db, walletId);
      const buddhistYears = gregorianYears.map(y => y + 543);
      setAvailableYears(buddhistYears);
      if (buddhistYears.length > 0 && !buddhistYears.includes(selectedYear)) {
        setSelectedYear(buddhistYears[0]);
      }
    } catch {
      setAvailableYears([]);
    }
  }, [selectedYear]);

  const loadMonths = useCallback(async (year: number, walletId: string | null) => {
    try {
      const db = getDb();
      const months = await getAvailableMonths(db, year, walletId);
      setAvailableMonths(months);
      if (selectedMonth !== null && !months.includes(selectedMonth)) {
        setSelectedMonth(null);
      }
    } catch {
      setAvailableMonths([]);
    }
  }, [selectedMonth]);

  useEffect(() => {
    getApiKey().then(key => {
      setHasApiKey(!!key);
      setApiKeyTail(key ? key.slice(-4) : '');
      setApiKeyStatus(key ? `ตั้งค่าแล้ว (****${key.slice(-4)})` : 'ยังไม่ได้ตั้งค่า');
    });
    loadYears(selectedWalletId);
  }, []);

  const handleApiKey = () => {
    setApiKeySetupVisible(true);
  };

  const handleApiKeySave = async (key: string) => {
    await setApiKey(key);
    setHasApiKey(true);
    setApiKeyTail(key.slice(-4));
    setApiKeyStatus(`ตั้งค่าแล้ว (****${key.slice(-4)})`);
  };

  const handleApiKeyDelete = async () => {
    await deleteApiKey();
    setHasApiKey(false);
    setApiKeyTail('');
    setApiKeyStatus('ยังไม่ได้ตั้งค่า');
  };

  useEffect(() => {
    if (availableYears.length > 0) {
      loadMonths(gregorianYear, selectedWalletId);
    }
  }, [gregorianYear, selectedWalletId, availableYears]);

  const handleSelectYear = (y: number) => {
    setSelectedYear(y);
    setSelectedMonth(null);
  };

  const handleSelectWallet = (id: string | null) => {
    setSelectedWalletId(id);
    loadYears(id);
    setSelectedMonth(null);
  };

  const handleAnalyze = useCallback(async () => {
    if (!hasApiKey) {
      Alert.alert('ยังไม่ได้ตั้งค่า', 'กรุณาตั้งค่า Gemini API Key ในหน้าตั้งค่าก่อน');
      return;
    }

    setIsLoading(true);
    setCurrentResult(null);

    try {
      const db = getDb();
      let transactions;
      if (selectedMonth) {
        const start = `${gregorianYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(gregorianYear, selectedMonth, 0).getDate();
        const end = `${gregorianYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        transactions = await getTransactionsByRange(db, start, end, selectedWalletId);
      } else {
        transactions = await getTransactionsByYear(db, gregorianYear, selectedWalletId ?? undefined);
      }

      if (transactions.length === 0) {
        const label = selectedMonth ? `${THAI_MONTHS_SHORT[selectedMonth]} ${selectedYear}` : `ปี ${selectedYear}`;
        Alert.alert('ไม่มีข้อมูล', `ไม่พบรายการใน${label}`);
        setIsLoading(false);
        return;
      }

      const result = await analyzeFinances({
        year: gregorianYear,
        month: selectedMonth,
        walletId: selectedWalletId,
        promptType,
        transactions,
      });

      const periodLabel = getPeriodLabel(gregorianYear, selectedMonth);
      setCurrentResult({ type: result.responseType, data: result.result, periodLabel });
      setSelectedHistoryId(null);

      await addHistory({
        walletId: selectedWalletId,
        promptType,
        year: gregorianYear,
        month: selectedMonth,
        responseType: result.responseType,
        responseData: result.result,
      });
    } catch (error: any) {
      Alert.alert('ข้อผิดพลาด', error.message ?? 'ไม่สามารถวิเคราะห์ได้');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedWalletId, promptType, gregorianYear, addHistory, hasApiKey]);

  const handleAnalyzeSavingsGoal = useCallback(async () => {
    if (!hasApiKey) {
      Alert.alert('ยังไม่ได้ตั้งค่า', 'กรุณาตั้งค่า Gemini API Key ในหน้าตั้งค่าก่อน');
      return;
    }

    const targetAmount = parseFloat(savingsTargetAmount.replace(/,/g, ''));
    const targetMonths = parseInt(savingsTargetMonths, 10);

    if (!targetAmount || targetAmount <= 0) {
      Alert.alert('จำนวนเงินไม่ถูกต้อง', 'กรุณาใส่จำนวนเงินที่ต้องการเก็บ (มากกว่า 0)');
      return;
    }
    if (!targetMonths || targetMonths <= 0 || targetMonths > 600) {
      Alert.alert('ระยะเวลาไม่ถูกต้อง', 'กรุณาใส่จำนวนเดือน (1-600)');
      return;
    }

    setIsLoading(true);
    setCurrentResult(null);

    try {
      const db = getDb();
      let transactions;
      if (selectedMonth) {
        const start = `${gregorianYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(gregorianYear, selectedMonth, 0).getDate();
        const end = `${gregorianYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        transactions = await getTransactionsByRange(db, start, end, selectedWalletId);
      } else {
        transactions = await getTransactionsByYear(db, gregorianYear, selectedWalletId ?? undefined);
      }

      if (transactions.length === 0) {
        const label = selectedMonth ? `${THAI_MONTHS_SHORT[selectedMonth]} ${selectedYear}` : `ปี ${selectedYear}`;
        Alert.alert('ไม่มีข้อมูล', `ไม่พบรายการใน${label}`);
        setIsLoading(false);
        return;
      }

      // Strip excluded categories before sending to AI — these will not appear
      // in the prompt summary, so the AI won't suggest cutting them.
      const filteredTransactions = excludedCategoryIds.size > 0
        ? transactions.filter(t => !excludedCategoryIds.has(t.categoryId))
        : transactions;

      if (filteredTransactions.length === 0) {
        Alert.alert(
          'ไม่มีข้อมูลเหลือ',
          'หลังตัดหมวดที่ยกเว้นออกแล้ว ไม่เหลือธุรกรรมที่จะวิเคราะห์',
        );
        setIsLoading(false);
        return;
      }

      const result = await analyzeSavingsGoal({
        year: gregorianYear,
        month: selectedMonth,
        walletId: selectedWalletId,
        targetAmount,
        targetMonths,
        transactions: filteredTransactions,
      });

      const periodLabel = getPeriodLabel(gregorianYear, selectedMonth);
      setCurrentResult({
        type: result.responseType,
        data: result.result,
        periodLabel,
        targetAmount,
        targetMonths,
      });
      setSelectedHistoryId(null);

      await addHistory({
        walletId: selectedWalletId,
        promptType: 'savings_goal',
        year: gregorianYear,
        month: selectedMonth,
        responseType: result.responseType,
        responseData: result.result,
        targetAmount,
        targetMonths,
      });
    } catch (error: any) {
      Alert.alert('ข้อผิดพลาด', error.message ?? 'ไม่สามารถวิเคราะห์ได้');
    } finally {
      setIsLoading(false);
    }
  }, [
    hasApiKey,
    savingsTargetAmount,
    savingsTargetMonths,
    selectedMonth,
    selectedYear,
    selectedWalletId,
    gregorianYear,
    addHistory,
    excludedCategoryIds,
  ]);

  const handleViewHistory = useCallback((history: AiHistory) => {
    const periodLabel = getPeriodLabel(history.year, history.month);
    setCurrentResult({
      type: history.responseType,
      data: history.responseData,
      periodLabel,
      targetAmount: history.targetAmount,
      targetMonths: history.targetMonths,
    });
    setSelectedHistoryId(history.id);
  }, []);

  const handleDeleteHistory = useCallback((history: AiHistory) => {
    Alert.alert('ลบประวัติ', 'ต้องการลบประวัติการวิเคราะห์นี้?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: () => {
          deleteHistory(history.id);
          setSelectedHistoryId(prev => (prev === history.id ? null : prev));
        },
      },
    ]);
  }, [deleteHistory]);

  const handleBulkDeleteHistory = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    await deleteHistoriesBulk(ids);
    setSelectedHistoryId(prev => (prev !== null && ids.includes(prev) ? null : prev));
  }, [deleteHistoriesBulk]);

  const kindFilteredHistories = useMemo(() => {
    if (historyKindFilter === 'all') return histories;
    if (historyKindFilter === 'savings_goal') {
      return histories.filter(h => h.promptType === 'savings_goal');
    }
    // 'analyze' = structured/full/compact (any non-savings)
    return histories.filter(h => h.promptType !== 'savings_goal');
  }, [histories, historyKindFilter]);

  const recentHistories = kindFilteredHistories.slice(0, 5);

  const savingsGoalCount = useMemo(
    () => histories.filter(h => h.promptType === 'savings_goal').length,
    [histories],
  );

  // ===== Not Premium: show paywall =====
  if (!isPremium) {
    return (
      <WallpaperBackground>
        <SafeAreaView className="flex-1" edges={['top']}>
          <PremiumPaywall onUnlock={() => setIsPremium(true)} />
        </SafeAreaView>
      </WallpaperBackground>
    );
  }

  // ===== Premium: show inner tabs =====
  return (
    <WallpaperBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        {/* <View style={{ paddingHorizontal: 18, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="diamond" size={22} color="#C85F28" />
        <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 26, letterSpacing: -0.4 }}>Premium</Text>
      </View> */}

        {/* Segmented tabs — 2 rows × 2 tabs */}
        <View style={{ marginHorizontal: 16, marginBottom: 14, gap: 6 }}>
          {([
            [['ai', 'sparkles-outline', 'AI วิเคราะห์'], ['data', 'swap-horizontal-outline', 'ข้อมูล']],
            [['theme', 'color-palette-outline', 'ธีม'], ['notifications', 'notifications-outline', 'แจ้งเตือน']],
          ] as const).map((row, rowIdx) => (
            <View
              key={rowIdx}
              style={{
                padding: 4, borderRadius: 14,
                backgroundColor: '#F5EEE0', flexDirection: 'row', gap: 4,
              }}
            >
              {row.map(([key, icon, label]) => (
                <Pressable
                  key={key}
                  onPress={() => setInnerTab(key as InnerTab)}
                  style={{
                    flex: 1, height: 44, borderRadius: 12,
                    backgroundColor: innerTab === key ? '#E87A3D' : 'transparent',
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <Ionicons name={icon} size={14} color={innerTab === key ? '#fff' : '#9A8D80'} />
                  <Text style={{
                    fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14.5,
                    color: innerTab === key ? '#fff' : '#9A8D80',
                  }}>{label}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        {innerTab === 'ai' || innerTab === 'data' ? (
          <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
            {innerTab === 'ai' ? (
              <>
                {/* Gemini API Key */}
                <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
                  <SettingsSection>
                    <SettingsRow icon="key-outline" label="Gemini API Key" value={apiKeyStatus} onPress={handleApiKey} />
                    <SettingsRow icon="help-circle-outline" label="วิธีรับ Gemini API Key" onPress={() => setApiKeyHelpVisible(true)} />
                    <SettingsRow icon="sparkles-outline" label="AI วิเคราะห์" value={hasApiKey ? 'พร้อมใช้งาน' : 'ยังไม่ได้ตั้งค่า'} last />
                  </SettingsSection>
                </View>

                {/* ปี */}
                <View style={{ marginHorizontal: 16, marginBottom: 6 }}>
                  <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14 }}>ปี</Text>
                  {availableYears.length === 0 ? (
                    <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#F5EEE0' }}>
                      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#9A8D80', textAlign: 'center' }}>
                        ยังไม่มีข้อมูลรายการ{selectedWalletId ? 'ในกระเป๋านี้' : ''}
                      </Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      {availableYears.map(y => (
                        <Pressable
                          key={y}
                          onPress={() => handleSelectYear(y)}
                          style={{
                            height: 34, paddingHorizontal: 14, borderRadius: 999,
                            backgroundColor: selectedYear === y ? '#fff' : 'transparent',
                            borderWidth: 1.5,
                            borderColor: selectedYear === y ? '#E87A3D' : '#D9CFC3',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Text style={{
                            fontFamily: selectedYear === y ? 'IBMPlexSansThai_700Bold' : 'IBMPlexSansThai_400Regular',
                            fontSize: 13, color: selectedYear === y ? '#C85F28' : '#9A8D80',
                          }}>{y}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* เดือน */}
                {availableMonths.length > 0 && (
                  <View style={{ marginHorizontal: 16, marginBottom: 6 }}>
                    <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14 }}>เดือน</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Pressable
                          onPress={() => setSelectedMonth(null)}
                          style={{
                            height: 34, paddingHorizontal: 14, borderRadius: 999,
                            backgroundColor: selectedMonth === null ? '#fff' : 'transparent',
                            borderWidth: 1.5,
                            borderColor: selectedMonth === null ? '#E87A3D' : '#D9CFC3',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Text style={{
                            fontFamily: selectedMonth === null ? 'IBMPlexSansThai_700Bold' : 'IBMPlexSansThai_400Regular',
                            fontSize: 13, color: selectedMonth === null ? '#C85F28' : '#9A8D80',
                          }}>ทั้งปี</Text>
                        </Pressable>
                        {availableMonths.map(m => (
                          <Pressable
                            key={m}
                            onPress={() => setSelectedMonth(m)}
                            style={{
                              height: 34, paddingHorizontal: 14, borderRadius: 999,
                              backgroundColor: selectedMonth === m ? '#fff' : 'transparent',
                              borderWidth: 1.5,
                              borderColor: selectedMonth === m ? '#E87A3D' : '#D9CFC3',
                              alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <Text style={{
                              fontFamily: selectedMonth === m ? 'IBMPlexSansThai_700Bold' : 'IBMPlexSansThai_400Regular',
                              fontSize: 13, color: selectedMonth === m ? '#C85F28' : '#9A8D80',
                            }}>{THAI_MONTHS_SHORT[m]}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* กระเป๋าเงิน */}
                <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
                  <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14, marginBottom: 8 }}>กระเป๋าเงิน</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable
                        onPress={() => handleSelectWallet(null)}
                        style={{
                          height: 34, paddingHorizontal: 14, borderRadius: 999,
                          backgroundColor: !selectedWalletId ? '#fff' : 'transparent',
                          borderWidth: 1.5,
                          borderColor: !selectedWalletId ? '#E87A3D' : '#D9CFC3',
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Text style={{
                          fontFamily: !selectedWalletId ? 'IBMPlexSansThai_700Bold' : 'IBMPlexSansThai_400Regular',
                          fontSize: 13, color: !selectedWalletId ? '#C85F28' : '#9A8D80',
                        }}>ทุกกระเป๋า</Text>
                      </Pressable>
                      {wallets.map(w => (
                        <Pressable
                          key={w.id}
                          onPress={() => handleSelectWallet(w.id)}
                          style={{
                            height: 34, paddingHorizontal: 14, borderRadius: 999,
                            backgroundColor: selectedWalletId === w.id ? '#fff' : 'transparent',
                            borderWidth: 1.5,
                            borderColor: selectedWalletId === w.id ? '#E87A3D' : '#D9CFC3',
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}
                        >
                          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: w.color, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name={w.icon as keyof typeof Ionicons.glyphMap} size={8} color="#fff" />
                          </View>
                          <Text style={{
                            fontFamily: selectedWalletId === w.id ? 'IBMPlexSansThai_700Bold' : 'IBMPlexSansThai_400Regular',
                            fontSize: 13, color: selectedWalletId === w.id ? '#C85F28' : '#9A8D80',
                          }}>{w.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* รูปแบบ */}
                <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
                  <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14, marginBottom: 8 }}>รูปแบบ</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {([['structured', 'วิเคราะห์แบบสรุป'], ['full', 'วิเคราะห์แบบละเอียด']] as const).map(([k, l]) => (
                      <Pressable
                        key={k}
                        onPress={() => setPromptType(k)}
                        style={{
                          flex: 1, height: 44, borderRadius: 12,
                          backgroundColor: promptType === k ? '#E87A3D' : '#fff',
                          borderWidth: 1.5,
                          borderColor: promptType === k ? '#E87A3D' : '#D9CFC3',
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Text style={{
                          fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14,
                          color: promptType === k ? '#fff' : '#2A2320',
                        }}>{l}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Savings Goal — toggle card */}
                <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
                  <Pressable
                    onPress={() => setSavingsGoalExpanded(prev => !prev)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: savingsGoalExpanded ? '#FFF6EE' : '#fff',
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderWidth: 1.5,
                      borderColor: savingsGoalExpanded ? '#E87A3D' : '#D9CFC3',
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: savingsGoalExpanded ? '#E87A3D' : 'rgba(232,122,61,0.12)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name="flag"
                        size={16}
                        color={savingsGoalExpanded ? '#fff' : '#E87A3D'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: 'IBMPlexSansThai_700Bold',
                          fontSize: 14,
                          color: '#2A2320',
                        }}
                      >
                        วิเคราะห์เป้าหมายออมเงิน
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'IBMPlexSansThai_400Regular',
                          fontSize: 11,
                          color: '#9A8D80',
                          marginTop: 2,
                        }}
                      >
                        ตั้งเป้าหมายและให้ AI แนะนำว่าจะถึงเป้าได้ยังไง
                      </Text>
                    </View>
                    <Ionicons
                      name={savingsGoalExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#9A8D80"
                    />
                  </Pressable>

                  {savingsGoalExpanded && (
                    <View
                      style={{
                        marginTop: 10,
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        padding: 14,
                        borderWidth: 1.5,
                        borderColor: '#D9CFC3',
                        gap: 12,
                      }}
                    >
                      {/* Target amount */}
                      <View>
                        <Text
                          style={{
                            fontFamily: 'IBMPlexSansThai_600SemiBold',
                            fontSize: 12,
                            color: '#2A2320',
                            marginBottom: 6,
                          }}
                        >
                          จำนวนเงินที่ต้องการเก็บ (บาท)
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderWidth: 1.5,
                            borderColor: '#D9CFC3',
                            borderRadius: 10,
                            paddingHorizontal: 12,
                            backgroundColor: '#FAF5EC',
                          }}
                        >
                          <Ionicons name="cash-outline" size={16} color="#E87A3D" />
                          <TextInput
                            value={
                              // แสดงเลขด้วย , เมื่อตัวเลขมากกว่า 1,000
                              savingsTargetAmount
                                ? Number(savingsTargetAmount.replace(/,/g, '')).toLocaleString('en-US', { maximumFractionDigits: 2 })
                                : ''
                            }
                            onChangeText={(v) => {
                              // ลบ , ก่อนเก็บใน state
                              const raw = v.replace(/,/g, '').replace(/[^0-9.]/g, '');
                              setSavingsTargetAmount(raw);
                            }}
                            keyboardType="numeric"
                            placeholder="10,000"
                            placeholderTextColor="#9A8D80"
                            style={{
                              flex: 1,
                              paddingVertical: 10,
                              paddingHorizontal: 8,
                              fontFamily: 'Inter_700Bold',
                              fontSize: 16,
                              color: '#2A2320',
                            }}
                          />
                          <Text
                            style={{
                              fontFamily: 'IBMPlexSansThai_400Regular',
                              fontSize: 12,
                              color: '#9A8D80',
                            }}
                          >
                            บาท
                          </Text>
                        </View>
            
                      </View>

                      {/* Target months */}
                      <View>
                        <Text
                          style={{
                            fontFamily: 'IBMPlexSansThai_600SemiBold',
                            fontSize: 12,
                            color: '#2A2320',
                            marginBottom: 6,
                          }}
                        >
                          ภายใน (เดือน)
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Pressable
                            onPress={() => {
                              const n = Math.max(1, (parseInt(savingsTargetMonths, 10) || 1) - 1);
                              setSavingsTargetMonths(String(n));
                            }}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              borderWidth: 1.5,
                              borderColor: '#E87A3D',
                              backgroundColor: '#FFF6EE',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name="remove" size={20} color="#C85F28" />
                          </Pressable>
                          <View
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              borderWidth: 1.5,
                              borderColor: '#D9CFC3',
                              borderRadius: 10,
                              paddingHorizontal: 12,
                              backgroundColor: '#FAF5EC',
                            }}
                          >
                            <TextInput
                              value={savingsTargetMonths}
                              onChangeText={(v) => setSavingsTargetMonths(v.replace(/[^0-9]/g, ''))}
                              keyboardType="number-pad"
                              placeholder="3"
                              placeholderTextColor="#9A8D80"
                              style={{
                                flex: 1,
                                paddingVertical: 10,
                                fontFamily: 'Inter_700Bold',
                                fontSize: 16,
                                color: '#2A2320',
                                textAlign: 'center',
                              }}
                            />
                            <Text
                              style={{
                                fontFamily: 'IBMPlexSansThai_400Regular',
                                fontSize: 12,
                                color: '#9A8D80',
                              }}
                            >
                              เดือน
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => {
                              const n = Math.min(600, (parseInt(savingsTargetMonths, 10) || 0) + 1);
                              setSavingsTargetMonths(String(n));
                            }}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              borderWidth: 1.5,
                              borderColor: '#E87A3D',
                              backgroundColor: '#FFF6EE',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name="add" size={20} color="#C85F28" />
                          </Pressable>
                        </View>
                      </View>

                      {/* Quick info */}
                      <View
                        style={{
                          backgroundColor: 'rgba(232,122,61,0.08)',
                          borderRadius: 10,
                          padding: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Ionicons name="information-circle-outline" size={16} color="#E87A3D" />
                        <Text
                          style={{
                            fontFamily: 'IBMPlexSansThai_400Regular',
                            fontSize: 11,
                            color: '#2A2320',
                            flex: 1,
                            lineHeight: 16,
                          }}
                        >
                          AI จะใช้ข้อมูลในช่วงปี/เดือน/กระเป๋าที่เลือก เป็น baseline แนะนำว่าควรลดส่วนไหนถึงจะถึงเป้า
                        </Text>
                      </View>

                      {/* Excluded categories — card chips with CatCategoryIcon */}
                      <View>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 4,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="eye-off-outline" size={14} color="#C85F28" />
                            <Text
                              style={{
                                fontFamily: 'IBMPlexSansThai_700Bold',
                                fontSize: 13,
                                color: '#2A2320',
                              }}
                            >
                              ยกเว้นหมวด
                            </Text>
                            {excludedCategoryIds.size > 0 && (
                              <View
                                style={{
                                  paddingHorizontal: 6,
                                  paddingVertical: 1,
                                  borderRadius: 999,
                                  backgroundColor: '#E87A3D',
                                }}
                              >
                                <Text
                                  style={{
                                    fontFamily: 'Inter_700Bold',
                                    fontSize: 10,
                                    color: '#fff',
                                    fontVariant: ['tabular-nums'],
                                  }}
                                >
                                  {excludedCategoryIds.size}
                                </Text>
                              </View>
                            )}
                          </View>
                          {excludedCategoryIds.size > 0 && (
                            <Pressable
                              onPress={() => setExcludedCategoryIds(new Set())}
                              hitSlop={8}
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
                            >
                              <Ionicons name="refresh" size={11} color="#9A8D80" />
                              <Text
                                style={{
                                  fontFamily: 'IBMPlexSansThai_600SemiBold',
                                  fontSize: 11,
                                  color: '#9A8D80',
                                }}
                              >
                                ล้างทั้งหมด
                              </Text>
                            </Pressable>
                          )}
                        </View>
                        <Text
                          style={{
                            fontFamily: 'IBMPlexSansThai_400Regular',
                            fontSize: 10.5,
                            color: '#9A8D80',
                            marginBottom: 10,
                            lineHeight: 14,
                          }}
                        >
                          แตะหมวดที่ไม่อยากให้ AI แนะนำลด — รายการในหมวดที่เลือกจะถูกตัดออกก่อนวิเคราะห์
                        </Text>
                        {expenseCategoriesForExclude.length === 0 ? (
                          <Text
                            style={{
                              fontFamily: 'IBMPlexSansThai_400Regular',
                              fontSize: 11,
                              color: '#9A8D80',
                              fontStyle: 'italic',
                            }}
                          >
                            ยังไม่มีหมวดรายจ่าย
                          </Text>
                        ) : (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 8, paddingRight: 4, paddingVertical: 2 }}
                          >
                            {expenseCategoriesForExclude.map(c => {
                              const excluded = excludedCategoryIds.has(c.id);
                              return (
                                <Pressable
                                  key={c.id}
                                  onPress={() => {
                                    setExcludedCategoryIds(prev => {
                                      const next = new Set(prev);
                                      if (next.has(c.id)) next.delete(c.id);
                                      else next.add(c.id);
                                      return next;
                                    });
                                  }}
                                  style={({ pressed }) => ({
                                    width: 78,
                                    paddingVertical: 10,
                                    paddingHorizontal: 6,
                                    borderRadius: 14,
                                    borderWidth: 2,
                                    borderColor: excluded ? '#E87A3D' : 'rgba(42,35,32,0.08)',
                                    backgroundColor: excluded ? '#FFF6EE' : '#FAF5EC',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: pressed ? 0.7 : 1,
                                    transform: [{ scale: pressed ? 0.96 : 1 }],
                                    shadowColor: excluded ? '#E87A3D' : 'transparent',
                                    shadowOpacity: excluded ? 0.18 : 0,
                                    shadowRadius: 8,
                                    shadowOffset: { width: 0, height: 2 },
                                    elevation: excluded ? 3 : 0,
                                  })}
                                  accessibilityRole="button"
                                  accessibilityState={{ selected: excluded }}
                                  accessibilityLabel={`${excluded ? 'นำออก' : 'ยกเว้น'}หมวด ${c.name}`}
                                >
                                  {/* Icon with selected overlay */}
                                  <View style={{ position: 'relative'}}>
                                    <View style={{ opacity: excluded ? 0.45 : 1 }} className="items-center justify-center">
                                      <CatCategoryIcon kind={c.icon} bg={c.color} size={40} />
                                    </View>
                                    {excluded && (
                                      <View
                                        style={{
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          right: 0,
                                          bottom: 0,
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}
                                      >
                                        <View
                                          style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: 12,
                                            backgroundColor: '#E87A3D',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderWidth: 2,
                                            borderColor: '#fff',
                                          }}
                                        >
                                          <Ionicons name="close" size={14} color="#fff" />
                                        </View>
                                      </View>
                                    )}
                                  </View>
                                  <Text
                                    style={{
                                      fontFamily: excluded
                                        ? 'IBMPlexSansThai_700Bold'
                                        : 'IBMPlexSansThai_400Regular',
                                      fontSize: 10.5,
                                      color: excluded ? '#C85F28' : '#2A2320',
                                      marginTop: 6,
                                      textAlign: 'center',
                                    }}
                                    numberOfLines={2}
                                  >
                                    {c.name}
                                  </Text>
                                  {/* Status pill at bottom */}
                                  <View
                                    style={{
                                      marginTop: 4,
                                      paddingHorizontal: 6,
                                      paddingVertical: 1,
                                      borderRadius: 999,
                                      backgroundColor: excluded ? '#E87A3D' : 'transparent',
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontFamily: 'IBMPlexSansThai_700Bold',
                                        fontSize: 9,
                                        color: excluded ? '#fff' : '#9A8D80',
                                        textAlign: 'center',
                                      }}
                                    >
                                      {excluded ? 'ยกเว้น' : 'รวมในการวิเคราะห์'}
                                    </Text>
                                  </View>
                                </Pressable>
                              );
                            })}
                          </ScrollView>
                        )}
                      </View>
                    </View>
                  )}
                </View>

                {/* เริ่มวิเคราะห์ — dispatch ตาม savingsGoalExpanded */}
                <Pressable
                  onPress={savingsGoalExpanded ? handleAnalyzeSavingsGoal : handleAnalyze}
                  disabled={isLoading || !hasApiKey || availableYears.length === 0}
                  style={{
                    marginHorizontal: 16, marginTop: 6, marginBottom: 18,
                    height: 54, borderRadius: 14,
                    backgroundColor: isLoading || !hasApiKey || availableYears.length === 0 ? 'rgba(232,122,61,0.5)' : '#E87A3D',
                    shadowColor: '#E87A3D', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
                    elevation: 8,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Ionicons
                      name={savingsGoalExpanded ? 'flag' : 'sparkles'}
                      size={18}
                      color="#fff"
                    />
                  )}
                  <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16, color: '#fff' }}>
                    {isLoading
                      ? 'กำลังวิเคราะห์...'
                      : savingsGoalExpanded
                      ? 'วิเคราะห์เป้าหมายออมเงิน'
                      : 'เริ่มวิเคราะห์'}
                  </Text>
                </Pressable>

                {isLoading && <View style={{ marginHorizontal: 16 }}><AiLoadingView /></View>}

                {/* ประวัติการวิเคราะห์ */}
                {histories.length > 0 && !isLoading && (
                  <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, flex: 1 }}>ประวัติการวิเคราะห์</Text>
                      {kindFilteredHistories.length > 5 && (
                        <Pressable onPress={() => setHistoryModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: '#E87A3D' }}>ดูทั้งหมด ({kindFilteredHistories.length})</Text>
                          <Ionicons name="chevron-forward" size={12} color="#E87A3D" />
                        </Pressable>
                      )}
                    </View>

                    {/* Filter tabs: All / Analyze / Savings Goal */}
                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                      {([
                        ['all', `ทั้งหมด (${histories.length})`],
                        ['analyze', `วิเคราะห์ (${histories.length - savingsGoalCount})`],
                        ['savings_goal', `เป้าหมายออม (${savingsGoalCount})`],
                      ] as const).map(([k, label]) => {
                        const active = historyKindFilter === k;
                        return (
                          <Pressable
                            key={k}
                            onPress={() => setHistoryKindFilter(k)}
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              borderRadius: 10,
                              backgroundColor: active ? '#E87A3D' : '#fff',
                              borderWidth: 1.5,
                              borderColor: active ? '#E87A3D' : '#D9CFC3',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text
                              numberOfLines={1}
                              style={{
                                fontFamily: 'IBMPlexSansThai_600SemiBold',
                                fontSize: 11.5,
                                color: active ? '#fff' : '#2A2320',
                              }}
                            >
                              {label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {kindFilteredHistories.length === 0 ? (
                      <View
                        style={{
                          padding: 16,
                          borderRadius: 12,
                          backgroundColor: 'rgba(42,35,32,0.04)',
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: 'IBMPlexSansThai_400Regular',
                            fontSize: 12,
                            color: '#9A8D80',
                          }}
                        >
                          ยังไม่มีประวัติในหมวดนี้
                        </Text>
                      </View>
                    ) : (
                    <View style={{ gap: 10 }}>
                      {recentHistories.map(h => {
                        const isSelected = selectedHistoryId === h.id;
                        return (
                          <Pressable
                            key={h.id}
                            onPress={() => handleViewHistory(h)}
                            onLongPress={() => handleDeleteHistory(h)}
                            className={isSelected ? '' : 'bg-card'}
                            style={({ pressed }) => ({
                              borderRadius: 16, padding: 14,
                              flexDirection: 'row', alignItems: 'center', gap: 10,
                              backgroundColor: isSelected ? '#FFF6EE' : undefined,
                              borderWidth: 1.5,
                              borderColor: isSelected ? '#E87A3D' : 'transparent',
                              shadowColor: isSelected ? '#E87A3D' : '#2A2320',
                              shadowOpacity: isSelected ? 0.18 : 0.05,
                              shadowRadius: 16,
                              shadowOffset: { width: 0, height: 4 },
                              elevation: isSelected ? 4 : 2,
                              opacity: pressed ? 0.6 : 1,
                              transform: [{ scale: pressed ? 0.97 : 1 }],
                            })}
                          >
                            <View className="flex-row items-center gap-4 px-2 py-1 rounded-lg border border-border">
                              <View style={{
                                width: 30, height: 30, borderRadius: 8,
                                backgroundColor: isSelected ? '#E87A3D' : h.promptType === 'savings_goal' ? '#FFE9D6' : '#FCE8D4',
                                alignItems: 'center', justifyContent: 'center',
                              }}>
                                <Ionicons
                                  name={h.promptType === 'savings_goal' ? 'flag' : 'document-text-outline'}
                                  size={14}
                                  color={isSelected ? '#fff' : '#C85F28'}
                                />
                              </View>
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14, flexShrink: 1 }} numberOfLines={1}>
                                    {getPeriodLabel(h.year, h.month)} — {h.walletId ? wallets.find(w => w.id === h.walletId)?.name : 'ทุกกระเป๋า'}
                                  </Text>
                                  {isSelected && (
                                    <View style={{
                                      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
                                      backgroundColor: '#E87A3D',
                                      flexDirection: 'row', alignItems: 'center', gap: 3,
                                    }}>
                                      <Ionicons name="eye" size={9} color="#fff" />
                                      <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 9.5, color: '#fff' }}>กำลังดู</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5, color: isSelected ? '#C85F28' : '#9A8D80', marginTop: 2 }}>
                                  {h.promptType === 'savings_goal'
                                    ? `🎯 ${formatCurrency(h.targetAmount ?? 0)} · ${h.targetMonths ?? 0} เดือน`
                                    : h.promptType === 'structured' ? 'แบบสรุป' : 'แบบละเอียด'} · {new Date(h.createdAt).toLocaleDateString('th-TH')}
                                </Text>
                              </View>
                              <Ionicons
                                name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                                size={isSelected ? 18 : 14}
                                color={isSelected ? '#E87A3D' : '#9A8D80'}
                              />
                              <Pressable
                                onPress={() => handleDeleteHistory(h)}
                                hitSlop={8}
                                style={({ pressed }) => ({
                                  width: 32, height: 32, borderRadius: 10,
                                  alignItems: 'center', justifyContent: 'center',
                                  backgroundColor: pressed ? '#FEE2E2' : '#FFF1F1',
                                  borderWidth: 1, borderColor: '#FECACA',
                                  opacity: pressed ? 0.7 : 1,
                                  transform: [{ scale: pressed ? 0.92 : 1 }],
                                })}
                                accessibilityRole="button"
                                accessibilityLabel="ลบประวัติ"
                              >
                                <Ionicons name="trash-outline" size={15} color="#DC2626" />
                              </Pressable>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                    )}
                  </View>
                )}

                {/* Current Result */}
                {currentResult && !isLoading && (
                  <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
                    <Text className="text-foreground" style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, marginBottom: 10 }}>ผลวิเคราะห์</Text>
                    {currentResult.type === 'savings_goal' ? (
                      <SavingsGoalResultView
                        responseType="savings_goal"
                        responseData={currentResult.data}
                        periodLabel={currentResult.periodLabel}
                        targetAmount={currentResult.targetAmount}
                        targetMonths={currentResult.targetMonths}
                      />
                    ) : (
                      <AiResultView
                        responseType={currentResult.type as any}
                        responseData={currentResult.data}
                        periodLabel={currentResult.periodLabel}
                      />
                    )}
                  </View>
                )}
              </>
            ) : (
              <View style={{ paddingHorizontal: 16 }}>
                <DataTransferTab />
                <SpecialImportSection onSuccess={reloadAfterSpecialImport} />
              </View>
            )}
          </ScrollView>
        ) : innerTab === 'theme' ? (
          <ThemeSettingsContent />
        ) : (
          <NotificationsSettingsContent />
        )}

        <HistoryModal
          visible={historyModalVisible}
          onClose={() => setHistoryModalVisible(false)}
          histories={kindFilteredHistories}
          wallets={wallets}
          onView={handleViewHistory}
          onDelete={handleDeleteHistory}
          onBulkDelete={handleBulkDeleteHistory}
          selectedHistoryId={selectedHistoryId}
        />

        <ApiKeyHelpModal
          visible={apiKeyHelpVisible}
          onClose={() => setApiKeyHelpVisible(false)}
        />

        <ApiKeySetupModal
          visible={apiKeySetupVisible}
          onClose={() => setApiKeySetupVisible(false)}
          hasKey={hasApiKey}
          maskedTail={apiKeyTail}
          onSave={handleApiKeySave}
          onDelete={handleApiKeyDelete}
          onOpenHelp={() => {
            setApiKeySetupVisible(false);
            setApiKeyHelpVisible(true);
          }}
        />
      </SafeAreaView>
    </WallpaperBackground>
  );
}
