import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/lib/utils/format';

export type AlertBannerScope = 'daily' | 'monthly';

interface AlertBannerProps {
  scope: AlertBannerScope;
  currentExpense: number;
  target: number;
  onDismiss?: () => void;
}

const LABELS: Record<AlertBannerScope, { unit: string; warn: string; danger: string }> = {
  daily: { unit: 'วันนี้', warn: 'ใกล้เกินงบวันนี้', danger: 'เกินงบวันนี้!' },
  monthly: { unit: 'เดือนนี้', warn: 'ใกล้ถึงเป้าเดือนนี้', danger: 'เกินเป้าเดือนนี้!' },
};

export function AlertBanner({ scope, currentExpense, target, onDismiss }: AlertBannerProps) {
  if (target <= 0) return null;

  const percentage = Math.round((currentExpense / target) * 100);
  if (percentage < 80) return null;

  const isDanger = percentage >= 100;
  const labels = LABELS[scope];

  return (
    <View
      className={`mx-4 mt-2 px-3 py-2 rounded-2xl flex-row items-center ${isDanger ? 'bg-expense/15' : 'bg-[#F59E0B]/15'}`}
    >
      <Ionicons
        name={isDanger ? 'alert-circle' : 'warning'}
        size={18}
        color={isDanger ? '#EF4444' : '#F59E0B'}
      />
      <View className="flex-1 ml-2">
        <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: isDanger ? '#C65A4E' : '#B45309' }}>
          {isDanger ? labels.danger : labels.warn}
        </Text>
        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5 }} className="text-muted-foreground">
          {labels.unit}ใช้จ่าย {formatCurrency(currentExpense)} / {formatCurrency(target)} ({percentage}%)
        </Text>
      </View>
      {onDismiss && (
        <Pressable
          onPress={onDismiss}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 26, height: 26, borderRadius: 13,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed ? 'rgba(0,0,0,0.08)' : 'transparent',
            opacity: pressed ? 0.7 : 1,
          })}
          accessibilityRole="button"
          accessibilityLabel="ปิดการแจ้งเตือน"
        >
          <Ionicons name="close" size={16} color={isDanger ? '#C65A4E' : '#B45309'} />
        </Pressable>
      )}
    </View>
  );
}
