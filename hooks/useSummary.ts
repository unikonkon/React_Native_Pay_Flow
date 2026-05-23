import { useMemo } from 'react';
import type { Transaction, CategorySummary } from '@/types';

/**
 * Single-pass aggregation over transactions: totals + per-category breakdowns.
 * Previously did 6 passes (filter+reduce ×4, groupBy ×2). For 5000 rows that
 * dropped from ~30k iterations to ~5k.
 */
export function useSummary(transactions: Transaction[]) {
  return useMemo(() => {
    type Bucket = {
      total: number;
      count: number;
      category?: Transaction['category'];
    };
    const expenseBuckets = new Map<string, Bucket>();
    const incomeBuckets = new Map<string, Bucket>();
    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of transactions) {
      let target: Map<string, Bucket>;
      if (t.type === 'income') {
        totalIncome += t.amount;
        target = incomeBuckets;
      } else if (t.type === 'expense') {
        totalExpense += t.amount;
        target = expenseBuckets;
      } else {
        continue;
      }
      const existing = target.get(t.categoryId);
      if (existing) {
        existing.total += t.amount;
        existing.count += 1;
      } else {
        target.set(t.categoryId, { total: t.amount, count: 1, category: t.category });
      }
    }

    const toSummary = (buckets: Map<string, Bucket>, grandTotal: number): CategorySummary[] => {
      const result: CategorySummary[] = [];
      buckets.forEach((val, categoryId) => {
        result.push({
          categoryId,
          category: val.category,
          total: val.total,
          count: val.count,
          percentage: grandTotal > 0 ? (val.total / grandTotal) * 100 : 0,
        });
      });
      result.sort((a, b) => b.total - a.total);
      return result;
    };

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      expenseByCategory: toSummary(expenseBuckets, totalExpense),
      incomeByCategory: toSummary(incomeBuckets, totalIncome),
    };
  }, [transactions]);
}
