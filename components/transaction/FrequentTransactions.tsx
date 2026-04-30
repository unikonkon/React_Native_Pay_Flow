import { CatCategoryIcon } from '@/components/common/CatCategoryIcon';
import { PawPrintTapEffect, type PawPrintTapEffectHandle } from '@/components/ui/PawPrintTapEffect';
import { useCategoryStore } from '@/lib/stores/category-store';
import { getDb, getFrequentAmountsByWallet } from '@/lib/stores/db';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { formatCurrency } from '@/lib/utils/format';
import type { Analysis, Category } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

interface FrequentTransactionsProps {
  onSelect: (analysis: Analysis) => void;
}

/**
 * Item limit per row setting.
 * - 1 row → 9 items shown in a single horizontal scroll.
 * - 2+ rows → flex-wrap layout, 5 items per visual row (10 / 15 / 20).
 */
const ITEMS_LIMIT_BY_ROWS: Record<1 | 2 | 3 | 4, number> = {
  1: 9,
  2: 10,
  3: 15,
  4: 20,
};

export function FrequentTransactions({ onSelect }: FrequentTransactionsProps) {
  const categories = useCategoryStore(s => s.categories);
  const selectedWalletId = useTransactionStore(s => s.selectedWalletId);
  const transactions = useTransactionStore(s => s.transactions);
  const showHomeFrequentList = useSettingsStore(s => s.showHomeFrequentList);
  const homeFrequentRows = useSettingsStore(s => s.homeFrequentRows);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);

  const rows = Math.min(4, Math.max(1, homeFrequentRows || 1)) as 1 | 2 | 3 | 4;
  const limit = ITEMS_LIMIT_BY_ROWS[rows];

  useEffect(() => {
    const wId = selectedWalletId;
    if (!wId || !showHomeFrequentList) { setAnalyses([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const db = getDb();
        const results = await getFrequentAmountsByWallet(db, wId, 'expense', limit);
        if (!cancelled) setAnalyses(results);
      } catch {
        if (!cancelled) setAnalyses([]);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedWalletId, limit, transactions, showHomeFrequentList]);

  if (!showHomeFrequentList) return null;
  if (analyses.length === 0) return null;

  // rows === 1 → horizontal scroll (9 items, scroll right to see all).
  // rows >= 2 → single flex-wrap container, justify-between, ~5 items per visual row.
  if (rows === 1) {
    return (
      <View className="pb-1">
        <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11 }} className="text-muted-foreground px-4 mb-1">รายการใช้บ่อย</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
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

  return (
    <View className="pb-1">
      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11 }} className="text-muted-foreground px-4 mb-1">รายการใช้บ่อย</Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          rowGap: 12,
        }}
      >
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
      <CatCategoryIcon
        kind={category?.icon ?? 'ellipsis-horizontal'}
        bg={category?.color ?? '#999'}
        size={56}
      />
      <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11 }} className="text-foreground text-center mt-1" numberOfLines={1}>
        {analysis.note ? analysis.note : category?.name ? category.name : 'อื่นๆ'}
      </Text>
      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, fontVariant: ['tabular-nums'] }} className="text-muted-foreground">
        {formatCurrency(analysis.amount)}
      </Text>
      <PawPrintTapEffect ref={pawRef} size={32} color="#E87A3D" />
    </Pressable>
  );
}
