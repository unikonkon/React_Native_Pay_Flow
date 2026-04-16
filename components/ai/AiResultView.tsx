import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StructuredResult } from '@/types';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';

interface AiResultViewProps {
  responseType: 'structured' | 'full' | 'text';
  responseData: string;
  periodLabel?: string;
}

export function AiResultView({ responseType, responseData, periodLabel }: AiResultViewProps) {
  if (responseType === 'structured') {
    try {
      const data: StructuredResult = JSON.parse(responseData);
      return <StructuredView data={data} periodLabel={periodLabel} />;
    } catch {
      return <TextView text={responseData} periodLabel={periodLabel} />;
    }
  }

  return <TextView text={responseData} periodLabel={periodLabel} />;
}

function StructuredView({ data, periodLabel }: { data: StructuredResult; periodLabel?: string }) {
  return (
    <View className="gap-4">
      {periodLabel && (
        <View className="bg-primary/10 rounded-xl px-3 py-2 flex-row items-center">
          <Ionicons name="calendar-outline" size={16} color="#0891b2" />
          <Text className="text-primary font-semibold text-sm ml-2">{periodLabel}</Text>
        </View>
      )}

      {/* Health Score Card */}
      <View className="bg-card rounded-2xl p-4 border border-border">
        <View className="flex-row items-center mb-3">
          <Ionicons name="heart-outline" size={20} color="#0891b2" />
          <Text className="text-foreground font-bold text-base ml-2">สุขภาพการเงิน</Text>
        </View>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-muted-foreground">เกรด</Text>
          <Text className="text-primary text-2xl font-bold">{data.summary.healthScore}</Text>
        </View>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-muted-foreground">อัตราการออม</Text>
          <Text className="text-foreground font-semibold">{formatPercentage(data.summary.savingRate)}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <View>
            <Text className="text-muted-foreground text-xs">รายรับ</Text>
            <Text className="text-income font-bold">{formatCurrency(data.summary.totalIncome)}</Text>
          </View>
          <View>
            <Text className="text-muted-foreground text-xs">รายจ่าย</Text>
            <Text className="text-expense font-bold">{formatCurrency(data.summary.totalExpense)}</Text>
          </View>
        </View>
        <View className="bg-secondary rounded-xl p-3 mt-2">
          <Text className="text-muted-foreground text-xs mb-1">กฎ 50/30/20</Text>
          <View className="flex-row justify-between">
            <Text className="text-foreground text-sm">จำเป็น {formatPercentage(data.summary.rule503020.needs)}</Text>
            <Text className="text-foreground text-sm">ต้องการ {formatPercentage(data.summary.rule503020.wants)}</Text>
            <Text className="text-foreground text-sm">ออม {formatPercentage(data.summary.rule503020.savings)}</Text>
          </View>
        </View>
      </View>

      {/* Recommendations Card */}
      <View className="bg-card rounded-2xl p-4 border border-border">
        <View className="flex-row items-center mb-3">
          <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
          <Text className="text-foreground font-bold text-base ml-2">คำแนะนำ</Text>
        </View>
        <InfoRow label="ออมรายเดือน" value={formatCurrency(data.recommendations.monthlySaving)} />
        <InfoRow label="ลงทุนรายเดือน" value={formatCurrency(data.recommendations.monthlyInvestment)} />
        <InfoRow label="กองทุนฉุกเฉิน" value={formatCurrency(data.recommendations.emergencyFundTarget)} />
        {data.recommendations.investmentTypes.length > 0 && (
          <View className="mt-2">
            <Text className="text-muted-foreground text-xs mb-1">ประเภทลงทุนแนะนำ</Text>
            {data.recommendations.investmentTypes.map((t, i) => (
              <Text key={i} className="text-foreground text-sm">• {t}</Text>
            ))}
          </View>
        )}
      </View>

      {/* Expenses to Reduce */}
      {data.expensesToReduce.length > 0 && (
        <View className="bg-card rounded-2xl p-4 border border-border">
          <View className="flex-row items-center mb-3">
            <Ionicons name="trending-down-outline" size={20} color="#EF4444" />
            <Text className="text-foreground font-bold text-base ml-2">หมวดที่ควรลด</Text>
          </View>
          {data.expensesToReduce.map((item, i) => (
            <View key={i} className="flex-row items-center justify-between py-2 border-b border-border">
              <Text className="text-foreground flex-1">{item.category}</Text>
              <Text className="text-expense font-semibold mr-2">{formatCurrency(item.amount)}</Text>
              <Text className="text-muted-foreground text-sm">ลด {formatPercentage(item.targetReduction)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Plan */}
      {data.actionPlan.length > 0 && (
        <View className="bg-card rounded-2xl p-4 border border-border">
          <View className="flex-row items-center mb-3">
            <Ionicons name="checkbox-outline" size={20} color="#22C55E" />
            <Text className="text-foreground font-bold text-base ml-2">แผนปฏิบัติ</Text>
          </View>
          {data.actionPlan.map((plan, i) => (
            <Text key={i} className="text-foreground text-sm mb-1">
              {i + 1}. {plan}
            </Text>
          ))}
        </View>
      )}

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <View className="bg-expense/10 rounded-2xl p-4 border border-expense/30">
          <View className="flex-row items-center mb-3">
            <Ionicons name="warning-outline" size={20} color="#EF4444" />
            <Text className="text-expense font-bold text-base ml-2">คำเตือน</Text>
          </View>
          {data.warnings.map((w, i) => (
            <Text key={i} className="text-foreground text-sm mb-1">⚠️ {w}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-muted-foreground text-sm">{label}</Text>
      <Text className="text-foreground font-semibold text-sm">{value}</Text>
    </View>
  );
}

function TextView({ text, periodLabel }: { text: string; periodLabel?: string }) {
  return (
    <View className="gap-4">
      {periodLabel && (
        <View className="bg-primary/10 rounded-xl px-3 py-2 flex-row items-center">
          <Ionicons name="calendar-outline" size={16} color="#0891b2" />
          <Text className="text-primary font-semibold text-sm ml-2">{periodLabel}</Text>
        </View>
      )}
      <View className="bg-card rounded-2xl p-4 border border-border">
        <Text className="text-foreground text-sm leading-6">{text}</Text>
      </View>
    </View>
  );
}
