import { useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import { TransactionForm } from '@/components/transaction/TransactionForm';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useAnalysisStore } from '@/lib/stores/analysis-store';

export default function AddTransactionScreen() {
  const editingTransaction = useTransactionStore(s => s.editingTransaction);
  const setEditingTransaction = useTransactionStore(s => s.setEditingTransaction);
  const loadAnalysis = useAnalysisStore(s => s.loadAnalysis);

  // Clear editing state when leaving the screen
  useEffect(() => {
    return () => {
      setEditingTransaction(null);
      loadAnalysis();
    };
  }, [setEditingTransaction, loadAnalysis]);

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  return <TransactionForm editTransaction={editingTransaction} onClose={handleClose} />;
}
