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
    <View style={{ gap: 16 }}>
      {periodLabel && (
        <View style={{ backgroundColor: 'rgba(232,122,61,0.1)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={16} color="#E87A3D" />
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: '#E87A3D', marginLeft: 8 }}>{periodLabel}</Text>
        </View>
      )}

      {/* Health Score Card */}
      <View className="bg-card rounded-2xl p-4 border border-border">
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="heart-outline" size={20} color="#E87A3D" />
          <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, color: '#2A2320', marginLeft: 8 }}>สุขภาพการเงิน</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#9A8D80' }}>เกรด</Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: '#E87A3D' }}>{data.summary.healthScore}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#9A8D80' }}>อัตราการออม</Text>
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14, color: '#2A2320' }}>{formatPercentage(data.summary.savingRate)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <View>
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, color: '#9A8D80' }}>รายรับ</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#3E8B68' }}>{formatCurrency(data.summary.totalIncome)}</Text>
          </View>
          <View>
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, color: '#9A8D80' }}>รายจ่าย</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#C65A4E' }}>{formatCurrency(data.summary.totalExpense)}</Text>
          </View>
        </View>
        <View style={{ backgroundColor: '#F5EEE0', borderRadius: 16, padding: 12, marginTop: 8 }}>
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, color: '#9A8D80', marginBottom: 4 }}>กฎ 50/30/20</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#2A2320' }}>จำเป็น {formatPercentage(data.summary.rule503020.needs)}</Text>
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#2A2320' }}>ต้องการ {formatPercentage(data.summary.rule503020.wants)}</Text>
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#2A2320' }}>ออม {formatPercentage(data.summary.rule503020.savings)}</Text>
          </View>
        </View>
      </View>

      {/* Recommendations Card */}
      <View className="bg-card rounded-2xl p-4 border border-border">
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
          <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, color: '#2A2320', marginLeft: 8 }}>คำแนะนำ</Text>
        </View>
        <InfoRow label="ออมรายเดือน" value={formatCurrency(data.recommendations.monthlySaving)} />
        <InfoRow label="ลงทุนรายเดือน" value={formatCurrency(data.recommendations.monthlyInvestment)} />
        <InfoRow label="กองทุนฉุกเฉิน" value={formatCurrency(data.recommendations.emergencyFundTarget)} />
        {data.recommendations.investmentTypes.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, color: '#9A8D80', marginBottom: 4 }}>ประเภทลงทุนแนะนำ</Text>
            {data.recommendations.investmentTypes.map((t, i) => (
              <Text key={i} style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#2A2320' }}>• {t}</Text>
            ))}
          </View>
        )}
      </View>

      {/* Expenses to Reduce */}
      {data.expensesToReduce.length > 0 && (
        <View className="bg-card rounded-2xl p-4 border border-border">
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="trending-down-outline" size={20} color="#C65A4E" />
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, color: '#2A2320', marginLeft: 8 }}>หมวดที่ควรลด</Text>
          </View>
          {data.expensesToReduce.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i < data.expensesToReduce.length - 1 ? 0.5 : 0, borderBottomColor: 'rgba(42,35,32,0.08)' }}>
              <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14, color: '#2A2320', flex: 1 }}>{item.category}</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#C65A4E', marginRight: 8 }}>{formatCurrency(item.amount)}</Text>
              <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, color: '#9A8D80' }}>ลด {formatPercentage(item.targetReduction)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Plan */}
      {data.actionPlan.length > 0 && (
        <View className="bg-card rounded-2xl p-4 border border-border">
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="checkbox-outline" size={20} color="#3E8B68" />
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, color: '#2A2320', marginLeft: 8 }}>แผนปฏิบัติ</Text>
          </View>
          {data.actionPlan.map((plan, i) => (
            <Text key={i} style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#2A2320', marginBottom: 4 }}>
              {i + 1}. {plan}
            </Text>
          ))}
        </View>
      )}

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <View style={{ backgroundColor: 'rgba(198,90,78,0.1)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(198,90,78,0.3)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="warning-outline" size={20} color="#C65A4E" />
            <Text style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15, color: '#C65A4E', marginLeft: 8 }}>คำเตือน</Text>
          </View>
          {data.warnings.map((w, i) => (
            <Text key={i} style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#2A2320', marginBottom: 4 }}>⚠️ {w}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#9A8D80' }}>{label}</Text>
      <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: '#2A2320' }}>{value}</Text>
    </View>
  );
}

function TextView({ text, periodLabel }: { text: string; periodLabel?: string }) {
  return (
    <View style={{ gap: 16 }}>
      {periodLabel && (
        <View style={{ backgroundColor: 'rgba(232,122,61,0.1)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={16} color="#E87A3D" />
          <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, color: '#E87A3D', marginLeft: 8 }}>{periodLabel}</Text>
        </View>
      )}
      <View className="bg-card rounded-2xl p-4 border border-border">
        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13, color: '#2A2320', lineHeight: 22 }}>{text}</Text>
      </View>
    </View>
  );
}
