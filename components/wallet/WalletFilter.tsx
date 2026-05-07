import { useWalletStore } from '@/lib/stores/wallet-store';
import { useIsDarkTheme } from '@/lib/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { AddWalletModal } from './AddWalletModal';

interface Props {
  selectedWalletId: string | null;
  onChange: (id: string | null) => void;
  className?: string;
}

interface Anchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

const POPOVER_WIDTH = 260;
const SCREEN_MARGIN = 12;

export function WalletFilter({ selectedWalletId, onChange, className }: Props) {
  const isDark = useIsDarkTheme();
  const wallets = useWalletStore(s => s.wallets);
  const [open, setOpen] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const triggerRef = useRef<View>(null);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  const selectedWalletName = selectedWalletId
    ? wallets.find(w => w.id === selectedWalletId)?.name ?? 'กระเป๋า'
    : 'ทุกกระเป๋า';

  useEffect(() => {
    if (open) {
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
  }, [open, opacity, scale]);

  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  };

  const closePopover = () => {
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
    ]).start(() => setOpen(false));
  };

  const handlePick = (id: string | null) => {
    Haptics.selectionAsync();
    onChange(id);
    closePopover();
  };

  const screenWidth = Dimensions.get('window').width;
  const popoverLeft = anchor
    ? Math.min(Math.max(anchor.x, SCREEN_MARGIN), screenWidth - POPOVER_WIDTH - SCREEN_MARGIN)
    : SCREEN_MARGIN;
  const popoverTop = anchor ? anchor.y + anchor.height + 6 : 0;

  return (
    <View className={className}>
      <Pressable
        ref={triggerRef}
        onPress={handleOpen}
        className="flex-row items-center px-3.5 py-1.5 bg-background rounded-2xl self-start border border-border"
      >
        <Ionicons name="wallet-outline" size={15} color="#E87A3D" />
        <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }} className="text-foreground ml-1.5">{selectedWalletName}</Text>
        <Ionicons name="chevron-down" size={12} color="#A39685" style={{ marginLeft: 4 }} />
      </Pressable>

      <Modal visible={open} transparent animationType="none" onRequestClose={closePopover}>
        <Pressable onPress={closePopover} className="flex-1">
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
              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                <Pressable
                  onPress={() => handlePick(null)}
                  className={`px-3 py-2.5 rounded-xl mb-1 flex-row items-center justify-between ${!selectedWalletId ? 'bg-primary' : 'bg-background'}`}
                >
                  <View className="flex-row items-center">
                    <View className="w-7 h-7 rounded-full items-center justify-center mr-2.5 bg-secondary">
                      <Ionicons name="albums-outline" size={14} color="#A39685" />
                    </View>
                    <Text
                      style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14, color: !selectedWalletId ? '#fff' : isDark ? '#E87A3D' : '#2B2118' }}
                    >
                      ทุกกระเป๋า
                    </Text>
                  </View>
                  {!selectedWalletId && <Ionicons name="checkmark" size={18} color="white" />}
                </Pressable>

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

                <View className="h-px bg-border my-1" />

                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); closePopover(); setTimeout(() => setAddVisible(true), 110); }}
                  className="px-3 py-2.5 rounded-xl flex-row items-center"
                >
                  <View className="w-7 h-7 rounded-full items-center justify-center mr-2.5 bg-primary/10">
                    <Ionicons name="add" size={15} color="#E87A3D" />
                  </View>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }} className="text-primary">เพิ่มกระเป๋า</Text>
                </Pressable>

                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); closePopover(); setTimeout(() => router.push('/settings/wallets'), 110); }}
                  className="px-3 py-2.5 rounded-xl flex-row items-center"
                >
                  <View className="w-7 h-7 rounded-full items-center justify-center mr-2.5 bg-secondary">
                    <Ionicons name="settings-outline" size={14} color="#A39685" />
                  </View>
                  <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14 }} className="text-foreground flex-1">จัดการกระเป๋า</Text>
                  <Ionicons name="chevron-forward" size={14} color="#A39685" />
                </Pressable>
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      <AddWalletModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onCreated={(id) => { if (id) onChange(id); }}
      />
    </View>
  );
}
