import { TextInput, View, Text } from 'react-native';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  type: 'income' | 'expense';
}

export function AmountInput({ value, onChangeText, type }: AmountInputProps) {
  return (
    <View className="flex-row items-center border-b-2 border-border pb-2 mb-4">
      <Text className={`text-3xl font-bold ${type === 'income' ? 'text-income' : 'text-expense'}`}>
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
        className={`flex-1 text-3xl font-bold ml-1 ${type === 'income' ? 'text-income' : 'text-expense'}`}
      />
    </View>
  );
}
