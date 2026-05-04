import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { formatCurrency } from '@/lib/utils/format';
import type { FinancialSummary } from '@/types';

const CATEGORY_PREVIEW_LIMIT = 5;

interface Props {
  summary: FinancialSummary;
}

export function FinancialSummaryCard({ summary }: Props) {
  const [expanded, setExpanded] = useState(false);
  const cats = summary.categories ?? [];
  const visible = expanded ? cats : cats.slice(0, CATEGORY_PREVIEW_LIMIT);
  const hidden = Math.max(0, cats.length - CATEGORY_PREVIEW_LIMIT);
  const isPositive = summary.netSaving >= 0;

  return (
    <View className="bg-card rounded-2xl p-4 border border-border">
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Ionicons name="stats-chart-outline" size={20} color="#E87A3D" />
        <Text
          className="text-foreground"
          style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, marginLeft: 8 }}
        >
          สรุปการเงิน
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <SummaryRow
          icon="arrow-down-circle"
          label="รายรับทั้งหมด"
          value={formatCurrency(summary.totalIncome)}
          color="#3E8B68"
        />
        <SummaryRow
          icon="arrow-up-circle"
          label="รายจ่ายทั้งหมด"
          value={formatCurrency(summary.totalExpense)}
          color="#C65A4E"
        />
        <View style={{ height: 0.5, backgroundColor: 'rgba(42,35,32,0.08)' }} />
        <SummaryRow
          icon={isPositive ? 'wallet' : 'alert-circle'}
          label="คงเหลือ"
          value={`${isPositive ? '+' : ''}${formatCurrency(summary.netSaving)}`}
          color={isPositive ? '#3E8B68' : '#C65A4E'}
          bold
        />
      </View>

      {cats.length > 0 && (
        <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(42,35,32,0.08)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text
              className="text-foreground"
              style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13 }}
            >
              แบ่งตามหมวดหมู่ ({cats.length})
            </Text>
            {hidden > 0 && (
              <Pressable onPress={() => setExpanded(v => !v)} hitSlop={6}>
                <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#E87A3D' }}>
                  {expanded ? 'ย่อ' : `ดูทั้งหมด (${cats.length})`}
                </Text>
              </Pressable>
            )}
          </View>
          <View style={{ gap: 6 }}>
            {visible.map((c, i) => (
              <View
                key={`${c.name}-${c.type}-${i}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <View
                  style={{
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: c.type === 'income' ? '#3E8B68' : '#C65A4E',
                  }}
                />
                <Text
                  className="text-foreground"
                  style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12.5, flex: 1 }}
                  numberOfLines={1}
                >
                  {c.name}
                </Text>
                <Text
                  style={{
                    fontFamily: 'IBMPlexSansThai_400Regular',
                    fontSize: 11, color: '#9A8D80', marginRight: 6,
                  }}
                >
                  ({c.count})
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 12, fontVariant: ['tabular-nums'],
                    color: c.type === 'income' ? '#3E8B68' : '#C65A4E',
                  }}
                >
                  {c.type === 'income' ? '+' : '−'}{formatCurrency(c.total)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function SummaryRow({
  icon, label, value, color, bold = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  bold?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name={icon} size={16} color={color} />
      <Text
        style={{
          fontFamily: bold ? 'IBMPlexSansThai_600SemiBold' : 'IBMPlexSansThai_400Regular',
          fontSize: 13, flex: 1,
        }}
        className="text-foreground"
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: bold ? 'Inter_700Bold' : 'Inter_600SemiBold',
          fontSize: bold ? 15 : 13,
          fontVariant: ['tabular-nums'],
          color,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
