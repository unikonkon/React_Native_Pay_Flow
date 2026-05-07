import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  value: string;
  onChangeText: (v: string) => void;
  pastNotes: string[];
  onClose: () => void;
}

export function NoteEditorOverlay({ visible, value, onChangeText, pastNotes, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const translateX = useRef(new Animated.Value(screenWidth)).current;
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const initialValueRef = useRef(value);

  useEffect(() => {
    if (visible) {
      initialValueRef.current = valueRef.current;
      setMounted(true);
      translateX.setValue(screenWidth);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => inputRef.current?.focus(), 30);
      });
    } else if (mounted) {
      Animated.timing(translateX, {
        toValue: screenWidth,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }
  }, [visible, mounted, translateX, screenWidth]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeText(initialValueRef.current);
    onClose();
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  };

  const handleClear = () => {
    Haptics.selectionAsync();
    onChangeText('');
    inputRef.current?.focus();
  };

  const handlePickNote = (note: string) => {
    Haptics.selectionAsync();
    onChangeText(note);
    onClose();
  };

  const filtered = pastNotes.filter(n => !value || n.toLowerCase().includes(value.toLowerCase()));
  const isDirty = value !== initialValueRef.current;

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleBack} statusBarTranslucent>
      <Animated.View
        className="flex-1 bg-background"
        style={{ transform: [{ translateX }] }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, paddingTop: insets.top }}
        >
          {/* Header: back (left) + title (center) + save (right) */}
          <View className="flex-row items-center" style={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
            <Pressable
              onPress={handleBack}
              hitSlop={8}
              className="bg-secondary"
              style={{
                height: 38, paddingLeft: 8, paddingRight: 12, borderRadius: 19,
                flexDirection: 'row', alignItems: 'center', gap: 2,
              }}
            >
              <Ionicons name="chevron-back" size={18} color="#A39685" />
              {/* <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14, color: '#9A8D80' }}>กลับ</Text> */}
            </Pressable>

            <Text
              className="flex-1 text-center text-foreground"
              style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18 }}
              numberOfLines={1}
            >
              จดบันทึก
            </Text>

          </View>

          {/* Note input + clear-all */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              placeholder="ป้อนหมายเหตุ"
              placeholderTextColor="#9A8D80"
              multiline
              autoFocus
              className="text-foreground"
              style={{
                fontFamily: 'IBMPlexSansThai_400Regular',
                fontSize: 18,
                minHeight: 64,
                textAlignVertical: 'top',
                paddingVertical: 4,
                paddingRight: 4,
              }}
            />
            {value.length > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
                <Pressable
                  onPress={handleClear}
                  hitSlop={6}
                  className="bg-secondary"
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
                  }}
                >
                  <Ionicons name="trash-outline" size={12} color="#A39685" />
                  <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, color: '#9A8D80' }}>
                    ลบทั้งหมด
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Past notes list — always claims remaining space so footer stays at bottom */}
          <View style={{ flex: 1 }}>
            {filtered.length > 0 && (
              <>
                <Text
                  className="text-muted-foreground"
                  style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, paddingHorizontal: 16, paddingBottom: 6 }}
                >
                  บันทึกที่เคยใช้
                </Text>
                <ScrollView
                  style={{ flex: 1 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
                >
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 8 }}>
                    {filtered.map(n => (
                      <Pressable
                        key={n}
                        onPress={() => handlePickNote(n)}
                        className="bg-secondary"
                        style={{
                          width: '48.5%',
                          flexDirection: 'row', alignItems: 'center', gap: 8,
                          paddingHorizontal: 12, paddingVertical: 12, borderRadius: 14,
                        }}
                      >
                        <Ionicons name="time-outline" size={14} color="#9A8D80" />
                        <Text
                          className="text-foreground"
                          style={{ flex: 1, fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14 }}
                          numberOfLines={2}
                        >
                          {n}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}
          </View>

          {/* Footer: back (left) + save (right) — sticks above keyboard */}
          <View
            className="flex-row items-center justify-between border-border"
            style={{
              paddingHorizontal: 16,
              paddingTop: 6,
              paddingBottom: 8,
              borderTopWidth: 1,
            }}
          >
            <Pressable
              onPress={handleBack}
              hitSlop={8}
              className="bg-secondary"
              style={{
                height: 38, paddingHorizontal: 22, borderRadius: 19,
                flexDirection: 'row', alignItems: 'center', gap: 2,
              }}
            >
              <Ionicons name="chevron-back" size={18} color="#A39685" />
              <Text style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 14, color: '#9A8D80' }}>กลับ</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              hitSlop={8}
              style={{
                height: 38, paddingHorizontal: 22, borderRadius: 19,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: isDirty ? '#E87A3D' : 'rgba(232,122,61,0.18)',
              }}
            >
              <Text
                style={{
                  fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14,
                  color: isDirty ? '#fff' : '#E87A3D',
                }}
              >
                บันทึก
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}
