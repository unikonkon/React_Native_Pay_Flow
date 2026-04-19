import type { TransactionType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

interface CalculatorPadProps {
  value: number;
  onChange: (value: number) => void;
  type: TransactionType;
  onSave: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
}

type BtnKind = 'num' | 'op' | 'fn';

interface BtnConfig {
  label: string;
  kind: BtnKind;
  icon?: boolean;
}

// Layout: 4 columns × 4 rows of regular buttons
// Row 1: C, ÷, ×, ⌫    (fn/op buttons — secondary gray)
// Row 2: 7, 8, 9, -    (numbers white, op gray)
// Row 3: 4, 5, 6, +
// Row 4: 1, 2, 3, =
// Row 5 (special):  00, 0, [SAVE spanning 2 cols]
const BUTTONS: BtnConfig[][] = [
  [
    { label: 'C', kind: 'fn' },
    { label: '÷', kind: 'op' },
    { label: '×', kind: 'op' },
    { label: '⌫', kind: 'fn', icon: true },
  ],
  [
    { label: '7', kind: 'num' },
    { label: '8', kind: 'num' },
    { label: '9', kind: 'num' },
    { label: '-', kind: 'op' },
  ],
  [
    { label: '4', kind: 'num' },
    { label: '5', kind: 'num' },
    { label: '6', kind: 'num' },
    { label: '+', kind: 'op' },
  ],
  [
    { label: '1', kind: 'num' },
    { label: '2', kind: 'num' },
    { label: '3', kind: 'num' },
    { label: '=', kind: 'op' },
  ],
];

export function CalculatorPad({
  value,
  onChange,
  type,
  onSave,
  saveLabel = 'บันทึก',
  saveDisabled,
}: CalculatorPadProps) {
  const [expression, setExpression] = useState(value > 0 ? String(value) : '');
  const [hasOperator, setHasOperator] = useState(false);

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

  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExpression('');
    setHasOperator(false);
    onChange(0);
  }, [onChange]);

  const handleBackspace = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newExpr = expression.slice(0, -1);
    setExpression(newExpr);
    if (!newExpr.match(/[+\-×÷]/)) setHasOperator(false);
    onChange(evaluate(newExpr) || 0);
  }, [expression, evaluate, onChange]);

  const handleEquals = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = evaluate(expression);
    setExpression(result > 0 ? String(result) : '');
    setHasOperator(false);
    onChange(result);
  }, [expression, evaluate, onChange]);

  const appendDigits = useCallback((digits: string) => {
    // Check decimal limit (max 2 places after dot)
    const parts = expression.split(/[+\-×÷]/);
    const lastPart = parts[parts.length - 1];
    const decIdx = lastPart.indexOf('.');
    let toAppend = digits;
    if (decIdx !== -1) {
      const currentDecimals = lastPart.length - decIdx - 1;
      const available = 2 - currentDecimals;
      if (available <= 0) return;
      toAppend = digits.slice(0, available);
    }

    const newExpr = expression + toAppend;
    setExpression(newExpr);
    if (!hasOperator) {
      onChange(evaluate(newExpr));
    }
  }, [expression, hasOperator, evaluate, onChange]);

  const handlePress = useCallback((btn: string) => {
    if (btn === 'C') return handleClear();
    if (btn === '⌫') return handleBackspace();
    if (btn === '=') return handleEquals();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Operator
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

    // Digit(s) — supports "0", "00", "1"-"9"
    appendDigits(btn);
  }, [expression, hasOperator, evaluate, onChange, handleClear, handleBackspace, handleEquals, appendDigits]);

  const handleSavePress = useCallback(() => {
    if (saveDisabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave();
  }, [saveDisabled, onSave]);

  const saveBgClass = type === 'income' ? 'bg-income' : 'bg-expense';

  const saveColor = value > 0 && !saveDisabled
    ? (type === 'expense' ? '#E87A3D' : '#3E8B68')
    : undefined;

  return (
    <View style={{ paddingVertical: 10 }}>
      {BUTTONS.map((row, rowIdx) => (
        <View key={rowIdx} className="flex-row" style={{ marginBottom: 8 }}>
          {row.map((btn, colIdx) => {
            const isNumber = btn.kind === 'num';
            return (
              <Pressable
                key={colIdx}
                onPress={() => handlePress(btn.label)}
                android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
                className={`flex-1 items-center justify-center ${isNumber ? 'bg-card' : 'bg-secondary'}`}
                style={{ marginHorizontal: 4, paddingVertical: 16, borderRadius: 14 }}
              >
                {btn.icon ? (
                  <Ionicons name="backspace-outline" size={20} color="#6B5F52" />
                ) : (
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 20, color: isNumber ? '#2B2118' : '#A39685' }}>
                    {btn.label}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}

      {/* Last row: 00 | 0 | Save (spans 2 columns) */}
      <View className="flex-row" style={{ marginBottom: 4 }}>
        <Pressable
          onPress={() => handlePress('00')}
          android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
          className="flex-1 items-center justify-center bg-card"
          style={{ marginHorizontal: 4, paddingVertical: 16, borderRadius: 14 }}
        >
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 20, color: '#2B2118' }}>00</Text>
        </Pressable>
        <Pressable
          onPress={() => handlePress('0')}
          android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
          className="flex-1 items-center justify-center bg-card"
          style={{ marginHorizontal: 4, paddingVertical: 16, borderRadius: 14 }}
        >
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 20, color: '#2B2118' }}>0</Text>
        </Pressable>
        <Pressable
          onPress={handleSavePress}
          disabled={saveDisabled}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          style={{
            flex: 2, marginHorizontal: 4, paddingVertical: 18, borderRadius: 16,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: saveColor ?? '#F8F2E7',
            opacity: saveDisabled ? 0.5 : 1,
          }}
        >
          <Text style={{
            fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16,
            color: saveColor ? '#fff' : '#A39685',
          }}>{saveLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}
