import { TransactionForm } from '@/components/transaction/TransactionForm';
import { getThemeSwatch } from '@/lib/constants/themes';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { getThemeVars } from '@/lib/utils/theme-vars';
import BottomSheet, {
  BottomSheetBackdrop,
  useBottomSheetTimingConfigs,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddTransactionScreen() {
  const sheetRef = useRef<BottomSheet>(null);
  const addTxSheetHeight = useSettingsStore(s => s.addTxSheetHeight);
  const snapPoints = useMemo(() => [`${addTxSheetHeight}%`], [addTxSheetHeight]);
  const insets = useSafeAreaInsets();

  // Theme-aware sheet surface colors (match --background + --border from global.css)
  const currentTheme = useThemeStore(s => s.currentTheme);
  const swatch = getThemeSwatch(currentTheme);
  const sheetBg = swatch?.bg ?? '#FBF7F0';
  const indicatorColor = swatch?.border ?? '#EDE4D3';

  // 50% faster than default (250ms → 125ms)
  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 125,
    easing: Easing.out(Easing.cubic),
  });

  const editingTransaction = useTransactionStore(s => s.editingTransaction);
  const setEditingTransaction = useTransactionStore(s => s.setEditingTransaction);

  // On Android, defer mounting the heavy TransactionForm by one frame so the
  // BottomSheet can commit its initial layout and kick off the slide-up
  // animation without competing with the form's first-render work (icons,
  // calculator pad, modals). The form mounts in parallel with the animation,
  // eliminating the perceived lag before the sheet starts moving.
  const [formReady, setFormReady] = useState(Platform.OS !== 'android');
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const id = requestAnimationFrame(() => setFormReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Clear editing state when screen unmounts
  useEffect(() => {
    return () => {
      setEditingTransaction(null);
    };
  }, [setEditingTransaction]);

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
      <View style={[{ flex: 1 }, getThemeVars(currentTheme)]}>
        <BottomSheet
          ref={sheetRef}
          index={0}
          snapPoints={snapPoints}
          topInset={insets.top}
          enableDynamicSizing={false}
          enableOverDrag={false}
          enablePanDownToClose
          animationConfigs={animationConfigs}
          onClose={handleSheetClose}
          backdropComponent={renderBackdrop}
          handleIndicatorStyle={{ backgroundColor: indicatorColor, width: 36, height: 4 }}
          backgroundStyle={{ backgroundColor: sheetBg, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        >
          {formReady ? (
            <TransactionForm editTransaction={editingTransaction} onClose={handleRequestClose} />
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}
