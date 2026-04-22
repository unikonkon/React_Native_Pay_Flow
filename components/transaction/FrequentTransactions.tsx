import { PawPrintTapEffect, type PawPrintTapEffectHandle } from '@/components/ui/PawPrintTapEffect';
import { useCategoryStore } from '@/lib/stores/category-store';
import { getDb, getFrequentAmountsByWallet } from '@/lib/stores/db';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { formatCurrency } from '@/lib/utils/format';
import type { Analysis, Category } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
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
    <View className="pb-1">
      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11 }} className="text-muted-foreground px-4 mb-1">รายการใช้บ่อย</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        <View className="flex-row" style={{ gap: 16 }}>
          {analyses.map((analysis) => {
            const cat = categories.find(c => c.id === analysis.categoryId);
            return (
              <FrequentItem
                key={analysis.id}
                analysis={analysis}
                category={cat}
                onSelect={onSelect}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

interface FrequentItemProps {
  analysis: Analysis;
  category: Category | undefined;
  onSelect: (analysis: Analysis) => void;
}

function FrequentItem({ analysis, category, onSelect }: FrequentItemProps) {
  const pawRef = useRef<PawPrintTapEffectHandle>(null);

  return (
    <Pressable
      onPress={() => {
        pawRef.current?.play();
        onSelect(analysis);
      }}
      className="items-center"
      style={{ width: 56 }}
    >
      <View
        className="w-14 h-14 rounded-full items-center justify-center"
        style={{ backgroundColor: category?.color ?? '#999' }}
      >
        <Ionicons
          name={(category?.icon ?? 'help-circle') as keyof typeof Ionicons.glyphMap}
          size={24}
          color="white"
        />
      </View>
      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11 }} className="text-foreground text-center mt-1.5" numberOfLines={1}>
        {analysis.note || category?.name || 'อื่นๆ'}
      </Text>
      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, fontVariant: ['tabular-nums'] }} className="text-muted-foreground">
        {formatCurrency(analysis.amount)}
      </Text>
      <PawPrintTapEffect ref={pawRef} size={32} color="#E87A3D" />
    </Pressable>
  );
}
