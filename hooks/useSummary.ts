import { useMemo } from 'react';
import type { Transaction, CategorySummary, MonthlySummary } from '@/types';

export function useSummary(transactions: Transaction[]) {
  const totalIncome = useMemo(
    () => transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalExpense = useMemo(
    () => transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const balance = totalIncome - totalExpense;

  const expenseByCategory = useMemo((): CategorySummary[] => {
    const map = new Map<string, { total: number; count: number; category?: Transaction['category'] }>();

    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const existing = map.get(t.categoryId);
        if (existing) {
          existing.total += t.amount;
          existing.count += 1;
        } else {
          map.set(t.categoryId, { total: t.amount, count: 1, category: t.category });
        }
      });

    const result: CategorySummary[] = [];
    map.forEach((val, categoryId) => {
      result.push({
        categoryId,
        category: val.category,
        total: val.total,
        count: val.count,
        percentage: totalExpense > 0 ? (val.total / totalExpense) * 100 : 0,
      });
    });

    return result.sort((a, b) => b.total - a.total);
  }, [transactions, totalExpense]);

  const incomeByCategory = useMemo((): CategorySummary[] => {
    const map = new Map<string, { total: number; count: number; category?: Transaction['category'] }>();

    transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const existing = map.get(t.categoryId);
        if (existing) {
          existing.total += t.amount;
          existing.count += 1;
        } else {
          map.set(t.categoryId, { total: t.amount, count: 1, category: t.category });
        }
      });

    const result: CategorySummary[] = [];
    map.forEach((val, categoryId) => {
      result.push({
        categoryId,
        category: val.category,
        total: val.total,
        count: val.count,
        percentage: totalIncome > 0 ? (val.total / totalIncome) * 100 : 0,
      });
    });

    return result.sort((a, b) => b.total - a.total);
  }, [transactions, totalIncome]);

  return { totalIncome, totalExpense, balance, expenseByCategory, incomeByCategory };
}
