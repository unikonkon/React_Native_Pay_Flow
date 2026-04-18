import { View, Text, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { formatCurrency } from '@/lib/utils/format';

interface BarChartViewProps {
  labels: string[];
  incomeData: number[];
  expenseData: number[];
}

const screenWidth = Dimensions.get('window').width;

export function BarChartView({ labels, incomeData, expenseData }: BarChartViewProps) {
  if (labels.length === 0) {
    return (
      <View className="items-center py-10">
        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14 }} className="text-muted-foreground">ไม่มีข้อมูล</Text>
      </View>
    );
  }

  return (
    <View className="mb-4">
      <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 15 }} className="text-foreground px-4 mb-2">รายรับ-รายจ่ายรายเดือน</Text>

      <View className="flex-row justify-center gap-4 mb-2 px-4">
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-income mr-1" />
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }} className="text-muted-foreground">รายรับ</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-expense mr-1" />
          <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }} className="text-muted-foreground">รายจ่าย</Text>
        </View>
      </View>

      <BarChart
        data={{
          labels,
          datasets: [
            { data: expenseData.length > 0 ? expenseData : [0] },
          ],
        }}
        width={screenWidth - 32}
        height={220}
        yAxisLabel="฿"
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
          barPercentage: 0.6,
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: '#f0f0f0',
          },
        }}
        style={{ borderRadius: 20, marginHorizontal: 16 }}
      />
    </View>
  );
}
