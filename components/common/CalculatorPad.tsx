import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState, useCallback } from 'react';
import type { TransactionType } from '@/types';
import { formatCurrency } from '@/lib/utils/format';

interface CalculatorPadProps {
  value: number;
  onChange: (value: number) => void;
  type: TransactionType;
}

const BUTTONS = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '-'],
  ['.', '0', '⌫', '+'],
];

export function CalculatorPad({ value, onChange, type }: CalculatorPadProps) {
  const [expression, setExpression] = useState(value > 0 ? String(value) : '');
  const [hasOperator, setHasOperator] = useState(false);

  const colorClass = type === 'income' ? 'text-income' : 'text-expense';

  const evaluate = useCallback((expr: string): number => {
    try {
      const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
      if (!/^[\d+\-*/.]+$/.test(sanitized)) return 0;
      const result = Function('"use strict"; return (' + sanitized + ')')();
      return typeof result === 'number' && isFinite(result) ? Math.round(result * 100) / 100 : 0;
    } catch {
      return 0;
    }
  }, []);

  const handlePress = useCallback((btn: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (btn === '⌫') {
      const newExpr = expression.slice(0, -1);
      setExpression(newExpr);
      if (!newExpr.match(/[+\-×÷]/)) setHasOperator(false);
      onChange(evaluate(newExpr) || 0);
      return;
    }

    if (['+', '-', '×', '÷'].includes(btn)) {
      if (expression === '' || /[+\-×÷]$/.test(expression)) return;
      if (hasOperator) {
        const result = evaluate(expression);
        const newExpr = String(result) + btn;
        setExpression(newExpr);
        onChange(result);
      } else {
        setExpression(expression + btn);
      }
      setHasOperator(true);
      return;
    }

    if (btn === '.') {
      const parts = expression.split(/[+\-×÷]/);
      const lastPart = parts[parts.length - 1];
      if (lastPart.includes('.')) return;
    }

    if (btn !== '.') {
      const parts = expression.split(/[+\-×÷]/);
      const lastPart = parts[parts.length - 1];
      const decIdx = lastPart.indexOf('.');
      if (decIdx !== -1 && lastPart.length - decIdx > 2) return;
    }

    const newExpr = expression + btn;
    setExpression(newExpr);

    if (!hasOperator) {
      onChange(evaluate(newExpr));
    }
  }, [expression, hasOperator, evaluate, onChange]);

  const handleEquals = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = evaluate(expression);
    setExpression(result > 0 ? String(result) : '');
    setHasOperator(false);
    onChange(result);
  }, [expression, evaluate, onChange]);

  return (
    <View className="mb-4">
      <View className="border-b-2 border-border pb-2 mb-3">
        <Text className="text-muted-foreground text-xs mb-1">
          {hasOperator ? expression : ''}
        </Text>
        <Text className={`text-3xl font-bold ${colorClass}`}>
          {value > 0 ? formatCurrency(value) : '฿0'}
        </Text>
      </View>

      {BUTTONS.map((row, rowIdx) => (
        <View key={rowIdx} className="flex-row mb-1">
          {row.map((btn) => {
            const isOperator = ['+', '-', '×', '÷'].includes(btn);
            const isBackspace = btn === '⌫';
            return (
              <Pressable
                key={btn}
                onPress={() => handlePress(btn)}
                className={`flex-1 mx-0.5 py-3 rounded-lg items-center justify-center ${
                  isOperator ? 'bg-primary/10' : 'bg-secondary'
                }`}
              >
                {isBackspace ? (
                  <Ionicons name="backspace-outline" size={22} color="#666" />
                ) : (
                  <Text className={`text-lg font-semibold ${isOperator ? 'text-primary' : 'text-foreground'}`}>
                    {btn}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}

      <Pressable
        onPress={handleEquals}
        className="mt-1 py-3 rounded-lg items-center bg-primary/20"
      >
        <Text className="text-primary text-lg font-bold">=</Text>
      </Pressable>
    </View>
  );
}
