import { useCategoryStore } from '@/lib/stores/category-store';
import { getDb, getFrequentAmountsByWallet } from '@/lib/stores/db';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { formatCurrency } from '@/lib/utils/format';
import type { Analysis } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

interface FrequentTransactionsProps {
  onSelect: (analysis: Analysis) => void;
}

export function FrequentTransactions({ onSelect }: FrequentTransactionsProps) {
  const categories = useCategoryStore(s => s.categories);
  const selectedWalletId = useTransactionStore(s => s.selectedWalletId);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);

  useEffect(() => {
    const wId = selectedWalletId || 'wallet-cash';
    let cancelled = false;
    (async () => {
      try {
        const db = getDb();
        const results = await getFrequentAmountsByWallet(db, wId, 'expense', 10);
        if (!cancelled) setAnalyses(results);
      } catch {
        if (!cancelled) setAnalyses([]);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedWalletId]);

  if (analyses.length === 0) return null;

  return (
    <View className="py-3">
      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }} className="text-muted-foreground px-4 mb-2.5">รายการใช้บ่อย</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        <View className="flex-row" style={{ gap: 16 }}>
          {analyses.map((analysis) => {
            const cat = categories.find(c => c.id === analysis.categoryId);
            return (
              <Pressable
                key={analysis.id}
                onPress={() => onSelect(analysis)}
                className="items-center"
                style={{ width: 56 }}
              >
                <View
                  className="w-14 h-14 rounded-full items-center justify-center"
                  style={{ backgroundColor: cat?.color ?? '#999' }}
                >
                  <Ionicons
                    name={(cat?.icon ?? 'help-circle') as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color="white"
                  />
                </View>
                <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12 }} className="text-foreground text-center mt-1.5" numberOfLines={1}>
                  {analysis.note || cat?.name || 'อื่นๆ'}
                </Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, fontVariant: ['tabular-nums'] }} className="text-muted-foreground">
                  {formatCurrency(analysis.amount)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
