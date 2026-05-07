import type { NoteSuggestion } from '@/lib/stores/db';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Alert,
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
  pastNotes: NoteSuggestion[];
  onAddSuggestion?: (note: string) => Promise<void> | void;
  onDeleteSuggestion?: (id: string) => Promise<void> | void;
  onClose: () => void;
}

export function NoteEditorOverlay({ visible, value, onChangeText, pastNotes, onAddSuggestion, onDeleteSuggestion, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const translateX = useRef(new Animated.Value(screenWidth)).current;
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'edit' | 'settings'>('edit');
  const [newSuggestion, setNewSuggestion] = useState('');
  const inputRef = useRef<TextInput>(null);
  const newSuggestionRef = useRef<TextInput>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const initialValueRef = useRef(value);

  useEffect(() => {
    if (visible) {
      initialValueRef.current = valueRef.current;
      setMode('edit');
      setNewSuggestion('');
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
    if (mode === 'settings') {
      setMode('edit');
      return;
    }
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

  const handleAddSubmit = async () => {
    const trimmed = newSuggestion.trim();
    if (!trimmed || !onAddSuggestion) return;
    await onAddSuggestion(trimmed);
    setNewSuggestion('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    newSuggestionRef.current?.focus();
  };

  const handleDelete = (s: NoteSuggestion) => {
    Alert.alert(
      'ลบบันทึก',
      `ต้องการลบ "${s.note}" ออกจากรายการแนะนำใช่หรือไม่?\n(รายการธุรกรรมเก่าจะไม่ถูกแก้ไข)`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            if (onDeleteSuggestion) await onDeleteSuggestion(s.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ],
    );
  };

  const filtered = pastNotes.filter(s => !value || s.note.toLowerCase().includes(value.toLowerCase()));
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
          {/* Header: back (left) + title (center) + gear (right) */}
          <View className="flex-row items-center" style={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
            <Pressable
              onPress={handleBack}
              hitSlop={8}
              className="bg-secondary"
              style={{
                width: 38, height: 38, borderRadius: 19,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={18} color="#A39685" />
            </Pressable>

            <Text
              className="flex-1 text-center text-foreground"
              style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18 }}
              numberOfLines={1}
            >
              {mode === 'settings' ? 'จัดการบันทึก' : 'จดบันทึก'}
            </Text>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode(m => (m === 'settings' ? 'edit' : 'settings'));
              }}
              hitSlop={8}
              className={mode === 'settings' ? 'bg-primary' : 'bg-secondary'}
              style={{
                width: 38, height: 38, borderRadius: 19,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons
                name={mode === 'settings' ? 'checkmark' : 'settings-outline'}
                size={18}
                color={mode === 'settings' ? '#fff' : '#A39685'}
              />
            </Pressable>
          </View>

          {mode === 'edit' ? (
            <>
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
                        {filtered.map(s => (
                          <Pressable
                            key={s.id}
                            onPress={() => handlePickNote(s.note)}
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
                              {s.note}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </>
                )}
              </View>
            </>
          ) : (
            <>
              {/* Settings mode: add new + delete existing */}
              <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 }}>
                <Text
                  className="text-muted-foreground"
                  style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, marginBottom: 6 }}
                >
                  เพิ่มบันทึกใหม่
                </Text>
                <View
                  className="bg-card"
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(42,35,32,0.1)',
                    paddingHorizontal: 12, paddingVertical: 6,
                  }}
                >
                  <TextInput
                    ref={newSuggestionRef}
                    value={newSuggestion}
                    onChangeText={setNewSuggestion}
                    placeholder="พิมพ์บันทึกที่ต้องการเพิ่ม"
                    placeholderTextColor="#9A8D80"
                    onSubmitEditing={handleAddSubmit}
                    returnKeyType="done"
                    className="text-foreground"
                    style={{
                      flex: 1,
                      fontFamily: 'IBMPlexSansThai_400Regular',
                      fontSize: 15,
                      paddingVertical: 6,
                    }}
                  />
                  <Pressable
                    onPress={handleAddSubmit}
                    disabled={!newSuggestion.trim()}
                    style={{
                      width: 32, height: 32, borderRadius: 16,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: newSuggestion.trim() ? '#E87A3D' : 'rgba(232,122,61,0.2)',
                    }}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                  </Pressable>
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  className="text-muted-foreground"
                  style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12, paddingHorizontal: 16, paddingBottom: 6 }}
                >
                  รายการที่บันทึกไว้ ({pastNotes.length})
                </Text>
                {pastNotes.length === 0 ? (
                  <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                    <Text style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14, color: '#9A8D80', textAlign: 'center' }}>
                      ยังไม่มีบันทึก เพิ่มได้จากด้านบน
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    style={{ flex: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 6 }}
                  >
                    {pastNotes.map(s => (
                      <View
                        key={s.id}
                        className="bg-secondary"
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 10,
                          paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
                        }}
                      >
                        <Ionicons name="document-text-outline" size={16} color="#9A8D80" />
                        <Text
                          className="text-foreground"
                          style={{ flex: 1, fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 14 }}
                          numberOfLines={2}
                        >
                          {s.note}
                        </Text>
                        <Pressable
                          onPress={() => handleDelete(s)}
                          hitSlop={8}
                          style={{
                            width: 30, height: 30, borderRadius: 15,
                            alignItems: 'center', justifyContent: 'center',
                            backgroundColor: 'rgba(198,90,78,0.12)',
                          }}
                        >
                          <Ionicons name="trash-outline" size={15} color="#C65A4E" />
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            </>
          )}

          {/* Footer — sticks above keyboard */}
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
            {mode === 'edit' && (
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
            )}
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}
