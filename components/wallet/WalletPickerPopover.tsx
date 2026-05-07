import { useWalletStore } from '@/lib/stores/wallet-store';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Modal, Pressable, ScrollView, Text, View } from 'react-native';

interface Anchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  visible: boolean;
  anchor: Anchor | null;
  selectedWalletId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const POPOVER_WIDTH = 240;
const SCREEN_MARGIN = 12;
const ROW_HEIGHT = 46;
const HEADER_PADDING = 16;
const MAX_LIST_HEIGHT = 280;

export function WalletPickerPopover({ visible, anchor, selectedWalletId, onSelect, onClose }: Props) {
  const wallets = useWalletStore(s => s.wallets);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          speed: 24,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      scale.setValue(0.92);
    }
  }, [visible, opacity, scale]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 100,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.94,
        duration: 100,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const handlePick = (id: string) => {
    Haptics.selectionAsync();
    onSelect(id);
    handleClose();
  };

  const screen = Dimensions.get('window');
  const estimatedHeight = Math.min(MAX_LIST_HEIGHT, wallets.length * ROW_HEIGHT) + HEADER_PADDING;
  const popoverLeft = anchor
    ? Math.min(Math.max(anchor.x, SCREEN_MARGIN), screen.width - POPOVER_WIDTH - SCREEN_MARGIN)
    : SCREEN_MARGIN;

  // Auto-flip: open above if not enough space below
  const spaceBelow = anchor ? screen.height - (anchor.y + anchor.height) : 0;
  const openUp = anchor ? spaceBelow < estimatedHeight + SCREEN_MARGIN : false;
  const popoverTop = anchor
    ? openUp
      ? Math.max(SCREEN_MARGIN, anchor.y - estimatedHeight - 6)
      : anchor.y + anchor.height + 6
    : 0;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Pressable onPress={handleClose} className="flex-1">
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: popoverTop,
            left: popoverLeft,
            width: POPOVER_WIDTH,
            opacity,
            transform: [{ scale }],
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-background rounded-2xl border border-border"
            style={{
              paddingHorizontal: 8,
              paddingVertical: 8,
              shadowColor: '#000',
              shadowOpacity: 0.18,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8,
            }}
          >
            <ScrollView style={{ maxHeight: MAX_LIST_HEIGHT }} showsVerticalScrollIndicator={false}>
              {wallets.map(w => {
                const selected = selectedWalletId === w.id;
                return (
                  <Pressable
                    key={w.id}
                    onPress={() => handlePick(w.id)}
                    className={`px-3 py-2.5 rounded-xl mb-1 flex-row items-center justify-between ${selected ? 'bg-primary' : 'bg-background'}`}
                  >
                    <View className="flex-row items-center flex-1">
                      <View
                        className="w-7 h-7 rounded-full items-center justify-center mr-2.5"
                        style={{ backgroundColor: w.color }}
                      >
                        <Ionicons name={w.icon as keyof typeof Ionicons.glyphMap} size={14} color="white" />
                      </View>
                      <Text
                        style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14, color: selected ? '#fff' : '#E87A3D' }}
                        numberOfLines={1}
                      >
                        {w.name}
                      </Text>
                    </View>
                    {selected && <Ionicons name="checkmark" size={18} color="white" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
