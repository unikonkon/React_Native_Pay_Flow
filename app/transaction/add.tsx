import { TransactionForm } from '@/components/transaction/TransactionForm';
import { useAnalysisStore } from '@/lib/stores/analysis-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  useBottomSheetTimingConfigs,
} from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Easing } from 'react-native-reanimated';

export default function AddTransactionScreen() {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['90%'], []);

  // 50% faster than default (250ms → 125ms)
  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 125,
    easing: Easing.out(Easing.cubic),
  });

  const editingTransaction = useTransactionStore(s => s.editingTransaction);
  const setEditingTransaction = useTransactionStore(s => s.setEditingTransaction);
  const loadAnalysis = useAnalysisStore(s => s.loadAnalysis);

  // Clear editing state + reload analysis when screen unmounts
  useEffect(() => {
    return () => {
      setEditingTransaction(null);
      loadAnalysis();
    };
  }, [setEditingTransaction, loadAnalysis]);

  // On save / X button — dismiss instantly, skip sheet slide-down animation
  const handleRequestClose = useCallback(() => {
    router.back();
  }, []);

  // Fired when user drags sheet down to dismiss (natural gesture)
  const handleSheetClose = useCallback(() => {
    router.back();
  }, []);

  // Backdrop fades in/out in sync with sheet position (drag to dismiss = backdrop fades too)
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        animationConfigs={animationConfigs}
        onClose={handleSheetClose}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: '#ccc' }}
        backgroundStyle={{ backgroundColor: 'white' }}
      >
        <TransactionForm editTransaction={editingTransaction} onClose={handleRequestClose} />
      </BottomSheet>
    </GestureHandlerRootView>
  );
}
