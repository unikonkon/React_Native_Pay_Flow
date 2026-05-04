import { formatCurrency } from '@/lib/utils/format';
import type { SavingsGoalResult } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import { FinancialSummaryCard } from './FinancialSummaryCard';

interface Props {
  responseType: 'savings_goal' | 'text';
  responseData: string;
  periodLabel?: string;
  targetAmount?: number | null;
  targetMonths?: number | null;
}

export function SavingsGoalResultView({
  responseType,
  responseData,
  periodLabel,
  targetAmount,
  targetMonths,
}: Props) {
  if (responseType === 'savings_goal') {
    try {
      const data: SavingsGoalResult = JSON.parse(responseData);
      return (
        <StructuredSavingsView
          data={data}
          periodLabel={periodLabel}
          targetAmount={targetAmount}
          targetMonths={targetMonths}
        />
      );
    } catch {
      return <FallbackText text={responseData} periodLabel={periodLabel} />;
    }
  }
  return <FallbackText text={responseData} periodLabel={periodLabel} />;
}

function StructuredSavingsView({
  data,
  periodLabel,
  targetAmount,
  targetMonths,
}: {
  data: SavingsGoalResult;
  periodLabel?: string;
  targetAmount?: number | null;
  targetMonths?: number | null;
}) {
  const goalAmount = data.goal?.targetAmount ?? targetAmount ?? 0;
  const goalMonths = data.goal?.targetMonths ?? targetMonths ?? 0;
  const monthlyRequired = data.goal?.monthlyRequired ?? (goalMonths > 0 ? goalAmount / goalMonths : 0);
  const feasible = data.feasibility?.feasible ?? false;
  const monthlyGap = data.feasibility?.monthlyGap ?? 0;
  const currentSaving = data.feasibility?.currentMonthlySaving ?? 0;

  // ────────────────────────────────────────────────────────────────────────
  // Theme-aware semantic colors for the feasibility verdict card. The bg/
  // border tokens are intentionally more saturated than other tinted cards
  // so the verdict reads as the strongest conclusion on the page. Dark mode
  // gets brighter hues so the rgba tint stays legible on dark backgrounds.
  // ────────────────────────────────────────────────────────────────────────
  const isDark = useColorScheme() === 'dark';
  const successHue = isDark ? '#38A96B' : '#276449';
  const dangerHue = isDark ? '#E86450' : '#A64735';
  const verdictAccent = feasible ? successHue : dangerHue;
  const verdictBg = feasible
    ? (isDark ? 'rgba(91,200,137,0.20)' : 'rgba(62,139,104,0.22)')
    : (isDark ? 'rgba(231,136,120,0.20)' : 'rgba(198,90,78,0.22)');
  const verdictBorder = feasible
    ? (isDark ? 'rgba(91,200,137,0.50)' : 'rgba(62,139,104,0.50)')
    : (isDark ? 'rgba(231,136,120,0.50)' : 'rgba(198,90,78,0.50)');
  const gapColor = monthlyGap >= 0 ? successHue : dangerHue;

  const progressPercent =
    monthlyRequired > 0
      ? Math.max(0, Math.min(100, (currentSaving / monthlyRequired) * 100))
      : 0;

  return (
    <View style={{ gap: 16 }}>
      {/* Period chip */}
      {periodLabel && (
        <View
          style={{
            backgroundColor: 'rgba(232,122,61,0.1)',
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons name="calendar-outline" size={16} color="#E87A3D" />
          <Text
            style={{
              fontFamily: 'IBMPlexSansThai_600SemiBold',
              fontSize: 13,
              color: '#E87A3D',
              marginLeft: 8,
            }}
          >
            อ้างอิงข้อมูล: {periodLabel}
          </Text>
        </View>
      )}

      {/* Financial summary card (shared with structured + full analysis views) */}
      {data.financialSummary && <FinancialSummaryCard summary={data.financialSummary} />}

      {/* Goal summary card */}
      <View className="bg-card rounded-2xl p-4 border border-border">
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="flag-outline" size={20} color="#E87A3D" />
          <Text
            className="text-foreground"
            style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, marginLeft: 8 }}
          >
            เป้าหมายของคุณ
          </Text>
        </View>

        <View
          style={{
            backgroundColor: '#FFF6EE',
            borderRadius: 14,
            padding: 14,
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              fontFamily: 'IBMPlexSansThai_400Regular',
              fontSize: 11,
              color: '#2A2320',
              marginBottom: 4,
            }}
          >
            ต้องการเก็บเงินภายใน {goalMonths} <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, color: '#2A2320' }}>เดือน</Text>
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 28,
              color: '#C85F28',
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatCurrency(goalAmount)}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 8,
              gap: 6,
            }}
          >
            <Ionicons name="trending-up-outline" size={14} color="#9A8D80" />
            <Text
              style={{
                fontFamily: 'IBMPlexSansThai_400Regular',
                fontSize: 12,
                color: '#2A2320',
              }}
            >
              ต้องเก็บเฉลี่ย {formatCurrency(monthlyRequired)} / เดือน
            </Text>
          </View>
        </View>

        {/* Progress bar — current vs required */}
        <View style={{ marginTop: 4 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4,
            }}
          >
            <Text
              style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#2A2320' }}
            >
              ออมได้ปัจจุบัน
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 12,
                color: feasible ? '#3E8B68' : '#C65A4E',
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatCurrency(currentSaving)} / {formatCurrency(monthlyRequired)} <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#9A8D80' }}>/ เดือน</Text>
            </Text>
          </View>

          {/* Source-of-truth row — shows the netSaving from FinancialSummaryCard
              (signed) so the user sees where "ออมได้ปัจจุบัน" comes from. */}
          {data.financialSummary && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: 8,
                backgroundColor:
                  data.financialSummary.netSaving >= 0
                    ? 'rgba(62,139,104,0.08)'
                    : 'rgba(198,90,78,0.08)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Ionicons
                  name={data.financialSummary.netSaving >= 0 ? 'wallet-outline' : 'alert-circle-outline'}
                  size={12}
                  color={data.financialSummary.netSaving >= 0 ? '#3E8B68' : '#C65A4E'}
                />
                <Text
                  style={{
                    fontFamily: 'IBMPlexSansThai_400Regular',
                    fontSize: 11,
                    color: '#6B5F52',
                    flexShrink: 1,
                  }}
                  numberOfLines={1}
                >
                  ยอดคงเหลือจากสรุปการเงินที่นำมาคิด
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: 'Inter_700Bold',
                  fontSize: 12,
                  fontVariant: ['tabular-nums'],
                  color: data.financialSummary.netSaving >= 0 ? '#3E8B68' : '#C65A4E',
                }}
              >
                {data.financialSummary.netSaving >= 0 ? '+' : '−'}
                {formatCurrency(Math.abs(data.financialSummary.netSaving))}
              </Text>
            </View>
          )}

          <View
            style={{
              height: 10,
              borderRadius: 5,
              backgroundColor: 'rgba(42,35,32,0.08)',
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: feasible ? '#3E8B68' : '#E87A3D',
              }}
            />
          </View>
        </View>
      </View>

      {/* Feasibility verdict card */}
      <View
        style={{
          backgroundColor: verdictBg,
          borderRadius: 16,
          padding: 14,
          borderWidth: 1,
          borderColor: verdictBorder,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons
            name={feasible ? 'checkmark-circle' : 'alert-circle'}
            size={20}
            color={verdictAccent}
          />
          <Text
            style={{
              fontFamily: 'IBMPlexSansThai_700Bold',
              fontSize: 14,
              color: verdictAccent,
              marginLeft: 8,
            }}
          >
            {feasible ? 'ทำได้! แต่อาจต้องปรับเล็กน้อย' : 'ยังไปไม่ถึงเป้า — ต้องปรับ'}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <Text
            className="text-foreground"
            style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, opacity: 0.85 }}
          >
            ส่วนต่างต่อเดือน
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 13,
              color: gapColor,
              fontVariant: ['tabular-nums'],
            }}
          >
            {monthlyGap >= 0 ? '+' : ''}
            {formatCurrency(monthlyGap)}{' '}
            <Text
              className="text-muted-foreground"
              style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }}
            >
              / เดือน
            </Text>
          </Text>
        </View>
        {data.feasibility?.message && (
          <Text
            className="text-foreground"
            style={{
              fontFamily: 'IBMPlexSansThai_400Regular',
              fontSize: 12,
              lineHeight: 18,
              marginTop: 4,
              opacity: 0.85,
            }}
          >
            {data.feasibility.message}
          </Text>
        )}
      </View>

      {/* Expenses to cut */}
      {data.expensesToCut?.length > 0 && (
        <View className="bg-card rounded-2xl p-4 border border-border">
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="cut-outline" size={20} color="#C65A4E" />
            <Text
              className="text-foreground"
              style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, marginLeft: 8 }}
            >
              หมวดที่ควรลด
            </Text>
          </View>
          {data.expensesToCut.map((item, i) => {
            // Fallback to monthly/30 if AI didn't provide dailyReduction.
            const dailyReduction =
              item.dailyReduction ??
              (item.suggestedReduction ? Math.round(item.suggestedReduction / 30) : 0);
            return (
              <View
                key={i}
                style={{
                  paddingVertical: 10,
                  borderBottomWidth: i < data.expensesToCut.length - 1 ? 0.5 : 0,
                  borderBottomColor: 'rgba(42,35,32,0.08)',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <Text
                    className="text-foreground"
                    style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14, flex: 1 }}
                  >
                    {item.category}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter_700Bold',
                      fontSize: 13,
                      color: '#C65A4E',
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    − {formatCurrency(item.suggestedReduction)} <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, color: '#9A8D80' }}>/ เดือน</Text>
                  </Text>
                </View>

                {/* Per-day reduction pill */}
                <View
                  style={{
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: 'rgba(198,90,78,0.1)',
                    borderRadius: 999,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    marginBottom: 6,
                  }}
                >
                  <Ionicons name="calendar-outline" size={11} color="#C65A4E" />
                  <Text
                    style={{
                      fontFamily: 'IBMPlexSansThai_700Bold',
                      fontSize: 11,
                      color: '#C65A4E',
                    }}
                  >
                    ลดต่อวัน
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter_700Bold',
                      fontSize: 11,
                      color: '#C65A4E',
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {formatCurrency(dailyReduction)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
                  <Text
                    style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11 }}
                    className="text-foreground"
                  >
                    ปัจจุบัน/เดือน {formatCurrency(item.currentAmount)}
                  </Text>
                  <Text
                    style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11 }}
                    className="text-foreground"
                  >
                    → เป้า/เดือน {formatCurrency(item.targetAmount)}
                  </Text>
                </View>
                {item.reason && (
                  <Text
                    style={{
                      fontFamily: 'IBMPlexSansThai_400Regular',
                      fontSize: 12,
                      lineHeight: 18,
                      color: '#9A8D80'
                    }}
                  >
                    {item.reason}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Income opportunities */}
      {data.incomeOpportunities?.length > 0 && (
        <View className="bg-card rounded-2xl p-4 border border-border">
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="trending-up-outline" size={20} color="#3E8B68" />
            <Text
              className="text-foreground"
              style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, marginLeft: 8 }}
            >
              ช่องทางหารายได้เสริม
            </Text>
          </View>
          {data.incomeOpportunities.map((item, i) => (
            <View
              key={i}
              style={{
                paddingVertical: 10,
                borderBottomWidth: i < data.incomeOpportunities.length - 1 ? 0.5 : 0,
                borderBottomColor: 'rgba(42,35,32,0.08)',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <Text
                  className="text-foreground"
                  style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14, flex: 1 }}
                >
                  {item.source}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter_700Bold',
                    fontSize: 13,
                    color: '#3E8B68',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  + {formatCurrency(item.estimatedAmount)}
                </Text>
              </View>
              {item.description && (
                <Text
                  style={{
                    fontFamily: 'IBMPlexSansThai_400Regular',
                    fontSize: 12,
                    lineHeight: 18,
                  }}
                  className="text-foreground"
                >
                  {item.description}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Action plan */}
      {data.actionPlan?.length > 0 && (
        <View className="bg-card rounded-2xl p-4 border border-border">
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="checkbox-outline" size={20} color="#3E8B68" />
            <Text
              className="text-foreground"
              style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, marginLeft: 8 }}
            >
              แผนปฏิบัติ
            </Text>
          </View>
          {data.actionPlan.map((step, i) => (
            <Text
              key={i}
              className="text-foreground"
              style={{
                fontFamily: 'IBMPlexSansThai_400Regular',
                fontSize: 13,
                marginBottom: 6,
                lineHeight: 20,
              }}
            >
              {i + 1}. {step}
            </Text>
          ))}
        </View>
      )}

      {/* Warnings */}
      {data.warnings?.length > 0 && (
        <View
          style={{
            backgroundColor: 'rgba(245,158,11,0.1)',
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: 'rgba(245,158,11,0.3)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="warning-outline" size={20} color="#D97706" />
            <Text
              style={{
                fontFamily: 'IBMPlexSansThai_700Bold',
                fontSize: 14,
                color: '#D97706',
                marginLeft: 8,
              }}
            >
              ข้อควรระวัง
            </Text>
          </View>
          {data.warnings.map((w, i) => (
            <Text
              key={i}
              style={{
                fontFamily: 'IBMPlexSansThai_400Regular',
                fontSize: 12,
                marginBottom: 4,
                lineHeight: 18,
              }}
              className="text-foreground"
            >
              ⚠️ {w}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function FallbackText({ text, periodLabel }: { text: string; periodLabel?: string }) {
  return (
    <View style={{ gap: 16 }}>
      {periodLabel && (
        <View
          style={{
            backgroundColor: 'rgba(232,122,61,0.1)',
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons name="calendar-outline" size={16} color="#E87A3D" />
          <Text
            style={{
              fontFamily: 'IBMPlexSansThai_600SemiBold',
              fontSize: 13,
              color: '#E87A3D',
              marginLeft: 8,
            }}
          >
            {periodLabel}
          </Text>
        </View>
      )}
      <View className="bg-card rounded-2xl p-4 border border-border">
        <Text
          style={{
            fontFamily: 'IBMPlexSansThai_400Regular',
            fontSize: 13,
            color: '#2A2320',
            lineHeight: 22,
          }}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}
