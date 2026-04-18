import { View, Text, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import type { CategorySummary } from '@/types';
import { formatCurrency } from '@/lib/utils/format';

interface PieChartViewProps {
  data: CategorySummary[];
  title: string;
}

const screenWidth = Dimensions.get('window').width;

export function PieChartView({ data, title }: PieChartViewProps) {
  if (data.length === 0) {
    return (
      <View className="items-center py-10">
        <Text className="text-muted-foreground">ไม่มีข้อมูล</Text>
      </View>
    );
  }

  const chartData = data.slice(0, 6).map((item) => ({
    name: item.category?.name ?? 'อื่น ๆ',
    amount: item.total,
    color: item.category?.color ?? '#999',
    legendFontColor: '#666',
    legendFontSize: 12,
  }));

  return (
    <View className="mb-4">
      <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }} className="text-foreground px-4 mb-3">{title}</Text>

      {/* Chart + legend side by side */}
      <View className="flex-row items-center px-4" style={{ gap: 16 }}>
        <PieChart
          data={chartData}
          width={200}
          height={200}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="0"
          hasLegend={false}
          absolute
        />
        <View className="flex-1" style={{ gap: 6 }}>
          {data.slice(0, 6).map((item) => (
            <View key={item.categoryId} className="flex-row items-center" style={{ gap: 8 }}>
              <View className="rounded-full" style={{ width: 10, height: 10, backgroundColor: item.category?.color ?? '#999' }} />
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, fontVariant: ['tabular-nums'] }} className="text-foreground">
                {formatCurrency(item.total)}{' '}
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular' }}>{item.category?.name ?? 'อื่นๆ'}</Text>
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Category breakdown list */}
      <View style={{ marginTop: 20 }}>
        {data.map((item) => (
          <View key={item.categoryId} className="flex-row items-center bg-card border-b border-border" style={{ gap: 12, paddingVertical: 12, paddingHorizontal: 16 }}>
            <View
              className="rounded-full items-center justify-center"
              style={{ width: 36, height: 36, backgroundColor: item.category?.color ?? '#999' }}
            >
              <Ionicons
                name={(item.category?.icon ?? 'help-circle') as keyof typeof Ionicons.glyphMap}
                size={16}
                color="white"
              />
            </View>
            <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 16 }} className="flex-1 text-foreground">{item.category?.name ?? 'อื่น ๆ'}</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, fontVariant: ['tabular-nums'] }} className="text-foreground mr-2">{formatCurrency(item.total)}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, width: 34, textAlign: 'right' }} className="text-muted-foreground">
              {item.percentage.toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
