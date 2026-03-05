import { View, Text, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import type { CategorySummary } from '@/types';
import { formatCurrency } from '@/utils/currency';

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
      <Text className="text-foreground font-bold text-base px-4 mb-2">{title}</Text>
      <PieChart
        data={chartData}
        width={screenWidth - 32}
        height={200}
        chartConfig={{
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="0"
        absolute
      />

      {/* Top categories list */}
      <View className="px-4 mt-2">
        {data.slice(0, 5).map((item) => (
          <View key={item.categoryId} className="flex-row items-center py-2">
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: item.category?.color ?? '#999' }}
            >
              <Ionicons
                name={(item.category?.icon ?? 'help-circle') as keyof typeof Ionicons.glyphMap}
                size={16}
                color="white"
              />
            </View>
            <Text className="flex-1 text-foreground">{item.category?.name ?? 'อื่น ๆ'}</Text>
            <Text className="text-foreground font-semibold mr-2">{formatCurrency(item.total)}</Text>
            <Text className="text-muted-foreground text-sm w-12 text-right">
              {item.percentage.toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
