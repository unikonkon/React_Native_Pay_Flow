import { TextInput, View, Text } from 'react-native';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  type: 'income' | 'expense';
}

export function AmountInput({ value, onChangeText, type }: AmountInputProps) {
  const color = type === 'income' ? '#3E8B68' : '#C65A4E';
  return (
    <View className="flex-row items-center border-b-2 border-border pb-2 mb-4">
      <Text style={{ fontFamily: 'Inter_900Black', fontSize: 30, fontVariant: ['tabular-nums'], color }}>
        ฿
      </Text>
      <TextInput
        value={value}
        onChangeText={(text) => {
          const cleaned = text.replace(/[^0-9.]/g, '');
          const parts = cleaned.split('.');
          if (parts.length > 2) return;
          if (parts[1] && parts[1].length > 2) return;
          onChangeText(cleaned);
        }}
        placeholder="0"
        placeholderTextColor="#999"
        keyboardType="decimal-pad"
        style={{ flex: 1, fontFamily: 'Inter_900Black', fontSize: 30, fontVariant: ['tabular-nums'], color, marginLeft: 4 }}
      />
    </View>
  );
}
