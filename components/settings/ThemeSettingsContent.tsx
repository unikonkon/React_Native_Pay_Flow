import { PAW_VARIANT_OPTIONS, PawPrintIcon } from '@/components/common/PawPrintIcon';
import { ADD_MASCOTS, BG_MASCOTS, type MascotOption } from '@/lib/constants/mascots';
import { FAMILIES, type ThemeFamily, type ThemeSwatch } from '@/lib/constants/themes';
import {
  MAX_CUSTOM_WALLPAPERS,
  WALLPAPER_CATEGORY_LABELS,
  WALLPAPER_CATEGORY_ORDER,
  WALLPAPER_PRESETS,
  type CustomWallpaper,
  type WallpaperCategory,
} from '@/lib/constants/wallpapers';
import { useThemeStore, type PawPrintVariant } from '@/lib/stores/theme-store';
import { Ionicons } from '@expo/vector-icons';
import SliderLib from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';

// Workaround for TS2607: @react-native-community/slider's default export mixes
// Constructor<NativeMethods> into its class declaration, which confuses JSX type-checking.
const Slider = SliderLib as unknown as React.ComponentType<React.ComponentProps<typeof SliderLib>>;

type ThemeOption = { swatch: ThemeSwatch; family: ThemeFamily; isDark: boolean };

const LIGHT_OPTIONS: ThemeOption[] = FAMILIES.flatMap((family) =>
  family.light ? [{ swatch: family.light, family, isDark: false }] : []
);
const DARK_OPTIONS: ThemeOption[] = FAMILIES.flatMap((family) =>
  family.dark ? [{ swatch: family.dark, family, isDark: true }] : []
);

export function ThemeSettingsContent({ showIntro = false }: { showIntro?: boolean }) {
  const currentTheme = useThemeStore(s => s.currentTheme);
  const setTheme = useThemeStore(s => s.setTheme);
  const currentBgMascot = useThemeStore(s => s.currentBgMascot);
  const setBgMascot = useThemeStore(s => s.setBgMascot);
  const currentAddMascot = useThemeStore(s => s.currentAddMascot);
  const setAddMascot = useThemeStore(s => s.setAddMascot);
  const pawPrintVariant = useThemeStore(s => s.pawPrintVariant);
  const setPawPrintVariant = useThemeStore(s => s.setPawPrintVariant);
  const currentWallpaperId = useThemeStore((s) => s.currentWallpaperId);
  const setWallpaper = useThemeStore((s) => s.setWallpaper);
  const wallpaperOverlayPercent = useThemeStore((s) => s.wallpaperOverlayPercent);
  const setOverlayPercent = useThemeStore((s) => s.setOverlayPercent);
  const customWallpapers = useThemeStore((s) => s.customWallpapers);
  const addCustomWallpaper = useThemeStore((s) => s.addCustomWallpaper);
  const removeCustomWallpaper = useThemeStore((s) => s.removeCustomWallpaper);

  const handleSelect = (key: string) => {
    if (key === currentTheme) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTheme(key);
  };

  const handleSelectBgMascot = (id: string) => {
    if (id === currentBgMascot) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBgMascot(id);
  };

  const handleSelectAddMascot = (id: string) => {
    if (id === currentAddMascot) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAddMascot(id);
  };

  const handleSelectPawVariant = (v: PawPrintVariant) => {
    if (v === pawPrintVariant) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPawPrintVariant(v);
  };

  const handleSelectWallpaper = (id: string | null) => {
    if (id === currentWallpaperId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWallpaper(id);
  };

  const handlePickCustomWallpaper = async () => {
    if (customWallpapers.length >= MAX_CUSTOM_WALLPAPERS) {
      Alert.alert('เพิ่มได้สูงสุด 10 รูป', 'กรุณาลบรูปเก่าก่อน');
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('ขออนุญาตเข้าถึงรูปภาพ', 'กรุณาเปิดสิทธิ์ในการตั้งค่าระบบ');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.length) return;
    try {
      const entry = await addCustomWallpaper(result.assets[0].uri);
      if (entry) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await setWallpaper(entry.id);
      }
    } catch {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเพิ่มรูปภาพได้ กรุณาลองใหม่');
    }
  };

  const handleDeleteCustomWallpaper = (entry: CustomWallpaper) => {
    Alert.alert(
      'ลบรูปนี้ใช่ไหม?',
      'รูปจะถูกลบออกจากแอป',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            await removeCustomWallpaper(entry.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ],
    );
  };

  const handleOverlayChange = (n: number) => {
    setOverlayPercent(Math.round(n));
  };

  const handleOverlayCommit = (n: number) => {
    Haptics.selectionAsync();
    setOverlayPercent(Math.round(n));
  };

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 4, paddingBottom: 32 }}>
      {showIntro && (
        <Text
          className="text-muted-foreground"
          style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 12, marginBottom: 12 }}
        >
          แต่ละชุดมีโหมดสว่างและมืดให้เลือก และ เลือกตัวการ์ตูน
        </Text>
      )}

      <ThemeRow
        label="โหมดสว่าง"
        icon="sunny"
        options={LIGHT_OPTIONS}
        currentTheme={currentTheme}
        onSelect={handleSelect}
      />
      <View style={{ height: 12 }} />
      <ThemeRow
        label="โหมดมืด"
        icon="moon"
        options={DARK_OPTIONS}
        currentTheme={currentTheme}
        onSelect={handleSelect}
      />

      {/* ===== ตัวการ์ตูน ===== */}
      <View style={{ marginTop: 22 }}>
        <Text
          className="text-foreground"
          style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16, marginBottom: 4 }}
        >
          ตัวการ์ตูน
        </Text>
        <Text
          className="text-muted-foreground"
          style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5, marginBottom: 12 }}
        >
          เลือกรูปที่ใช้แสดงในหน้าหลักและปุ่มเพิ่มรายการ
        </Text>

        <MascotPickerSection
          title="รูปบนหัวข้อหน้า"
          subtitle="แสดงในหน้ารายการ / สรุป / ตั้งค่า"
          options={BG_MASCOTS}
          selectedId={currentBgMascot}
          onSelect={handleSelectBgMascot}
          previewSize={{ width: 76, height: 56 }}
        />

        <View style={{ height: 14 }} />

        <MascotPickerSection
          title="ปุ่มเพิ่มรายการ"
          subtitle="แสดงเป็นปุ่มลอยในหน้ารายการ"
          options={ADD_MASCOTS}
          selectedId={currentAddMascot}
          onSelect={handleSelectAddMascot}
          previewSize={{ width: 132, height: 102 }}
        />
      </View>

      {/* ===== ตีนแมว ===== */}
      <View style={{ marginTop: 22 }}>
        <Text
          className="text-foreground"
          style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16, marginBottom: 4 }}
        >
          ลายตีนแมว
        </Text>
        <Text
          className="text-muted-foreground"
          style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5, marginBottom: 12 }}
        >
          ใช้ในแถบแท็บ ปุ่มคำนวณ และเอฟเฟ็กต์เมื่อแตะ
        </Text>

        <View
          className="bg-card"
          style={{
            borderRadius: 18,
            padding: 14,
            shadowColor: '#2A2320',
            shadowOpacity: 0.05,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 3 },
            elevation: 2,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingTop: 2, paddingBottom: 2 }}
          >
            {PAW_VARIANT_OPTIONS.map((opt) => {
              const isSelected = opt.id === pawPrintVariant;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => handleSelectPawVariant(opt.id)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  })}
                  accessibilityRole="button"
                  accessibilityLabel={`เลือกตีนแมว ${opt.name}`}
                >
                  <View
                    style={{
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: isSelected ? '#E87A3D' : 'rgba(42,35,32,0.08)',
                      backgroundColor: isSelected ? '#FFF6EE' : '#FAF5EC',
                      paddingVertical: 12,
                      paddingHorizontal: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 76,
                      height: 92,
                    }}
                  >
                    <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                      <PawPrintIcon
                        size={40}
                        color={isSelected ? '#C85F28' : '#9A8D80'}
                        variant={opt.id}
                      />
                    </View>
                    <Text
                      style={{
                        fontFamily: isSelected ? 'IBMPlexSansThai_700Bold' : 'IBMPlexSansThai_400Regular',
                        fontSize: 11,
                        marginTop: 6,
                        color: isSelected ? '#C85F28' : '#9A8D80',
                      }}
                      numberOfLines={1}
                    >
                      {opt.name}
                    </Text>
                    {isSelected && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: '#E87A3D',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* ===== พื้นหลังของแอป ===== */}
      <View style={{ marginTop: 22 }}>
        <Text
          className="text-foreground"
          style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 16, marginBottom: 4 }}
        >
          พื้นหลังของแอป
        </Text>
        <Text
          className="text-muted-foreground"
          style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11.5, marginBottom: 12 }}
        >
          เลือกภาพพื้นหลังสำหรับ 4 หน้าหลัก หรือเพิ่มภาพจากเครื่อง
        </Text>

        {/* "ไม่ใช้" tile — standalone, always visible */}
        <Pressable
          onPress={() => handleSelectWallpaper(null)}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
          accessibilityRole="button"
          accessibilityLabel="ไม่ใช้พื้นหลัง"
        >
          <View
            className="bg-card"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 12,
              borderRadius: 14,
              borderWidth: 2,
              borderColor: currentWallpaperId === null ? '#E87A3D' : 'rgba(42,35,32,0.08)',
              marginBottom: 14,
            }}
          >
            <View
              style={{
                width: 56,
                height: 40,
                borderRadius: 8,
                backgroundColor: 'rgba(42,35,32,0.05)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="ban-outline" size={20} color="#9A8D80" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                className="text-foreground"
                style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14 }}
              >
                ไม่ใช้
              </Text>
              <Text
                className="text-muted-foreground"
                style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11 }}
              >
                ใช้สีพื้นหลังของธีมตามปกติ
              </Text>
            </View>
            {currentWallpaperId === null && (
              <Ionicons name="checkmark-circle" size={20} color="#E87A3D" />
            )}
          </View>
        </Pressable>

        {/* Overlay strength slider — only when a wallpaper is selected */}
        {currentWallpaperId !== null && (
          <View
            className="bg-card"
            style={{
              borderRadius: 14,
              padding: 12,
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text
                className="text-foreground"
                style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13 }}
              >
                ความเข้มของ overlay
              </Text>
              <Text
                className="text-muted-foreground"
                style={{ fontFamily: 'Inter_700Bold', fontSize: 13, fontVariant: ['tabular-nums'] }}
              >
                {wallpaperOverlayPercent}%
              </Text>
            </View>
            <Slider
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={wallpaperOverlayPercent}
              onValueChange={handleOverlayChange}
              onSlidingComplete={handleOverlayCommit}
              minimumTrackTintColor="#E87A3D"
              maximumTrackTintColor="rgba(42,35,32,0.15)"
              thumbTintColor="#E87A3D"
              accessibilityLabel="ปรับความเข้มของ overlay"
            />
          </View>
        )}

        {/* Custom uploads */}
        <CustomWallpaperRow
          customs={customWallpapers}
          currentId={currentWallpaperId}
          canAdd={customWallpapers.length < MAX_CUSTOM_WALLPAPERS}
          onSelect={(id) => handleSelectWallpaper(id)}
          onDelete={handleDeleteCustomWallpaper}
          onAdd={handlePickCustomWallpaper}
        />
        
        {/* Preset categories */}
        {WALLPAPER_CATEGORY_ORDER.map((category) => (
          <WallpaperCategoryRow
            key={category}
            category={category}
            currentId={currentWallpaperId}
            onSelect={(id) => handleSelectWallpaper(id)}
          />
        ))}


      </View>
    </ScrollView>
  );
}

// ===== Mascot picker section =====

function MascotPickerSection({
  title,
  subtitle,
  options,
  selectedId,
  onSelect,
  previewSize,
}: {
  title: string;
  subtitle: string;
  options: MascotOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  previewSize: { width: number; height: number };
}) {
  return (
    <View
      className="bg-card"
      style={{
        borderRadius: 18,
        padding: 14,
        shadowColor: '#2A2320',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      <Text
        className="text-foreground"
        style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 14 }}
      >
        {title}
      </Text>
      <Text
        className="text-muted-foreground"
        style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, marginTop: 2 }}
      >
        {subtitle}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingTop: 12, paddingBottom: 2 }}
      >
        {options.map((opt) => {
          const isSelected = opt.id === selectedId;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onSelect(opt.id)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
              accessibilityRole="button"
              accessibilityLabel={`เลือก ${opt.name}`}
            >
              <View
                style={{
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: isSelected ? '#E87A3D' : 'rgba(42,35,32,0.08)',
                  backgroundColor: isSelected ? '#FFF6EE' : '#FAF5EC',
                  padding: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: previewSize.width + 16,
                  height: previewSize.height + 28,
                }}
              >
                <Image
                  source={opt.source}
                  style={{ width: previewSize.width, height: previewSize.height }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    fontFamily: isSelected ? 'IBMPlexSansThai_700Bold' : 'IBMPlexSansThai_400Regular',
                    fontSize: 10.5,
                    marginTop: 4,
                    color: isSelected ? '#C85F28' : '#9A8D80',
                  }}
                  numberOfLines={1}
                >
                  {opt.name}
                </Text>
                {isSelected && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: '#E87A3D',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ===== Horizontal theme row (label + scrollable cards) =====

function ThemeRow({
  label,
  icon,
  options,
  currentTheme,
  onSelect,
}: {
  label: string;
  icon: 'sunny' | 'moon';
  options: ThemeOption[];
  currentTheme: string;
  onSelect: (key: string) => void;
}) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, paddingHorizontal: 2 }}>
        <Ionicons name={icon} size={13} color="#7A6A50" />
        <Text
          className="text-foreground"
          style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 12.5 }}
        >
          {label}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingVertical: 4, paddingRight: 4 }}
      >
        {options.map(({ swatch, family, isDark }) => (
          <ThemeListItem
            key={swatch.key}
            swatch={swatch}
            family={family}
            isDark={isDark}
            selected={swatch.key === currentTheme}
            onPress={() => onSelect(swatch.key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ===== Horizontal theme list item — preview UI on left, summary on right =====

function ThemeListItem({
  swatch,
  family,
  isDark,
  selected,
  onPress,
}: {
  swatch: ThemeSwatch;
  family: ThemeFamily;
  isDark: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
      accessibilityRole="button"
      accessibilityLabel={`เลือกธีม ${family.name} ${isDark ? 'มืด' : 'สว่าง'}`}
    >
      <View
        style={{
          width: 268,
          flexDirection: 'row',
          gap: 10,
          padding: 10,
          borderRadius: 18,
          borderWidth: 2,
          borderColor: selected ? swatch.primary : 'rgba(42,35,32,0.08)',
          backgroundColor: '#FFFFFF',
          shadowColor: '#2A2320',
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 2,
        }}
      >
        {/* === Mini UI preview (left) === */}
        <View
          style={{
            width: 96,
            height: 90,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: swatch.bg,
            padding: 8,
            borderWidth: 1,
            borderColor: swatch.border,
          }}
        >
          {/* Mock card row */}
          <View
            style={{
              backgroundColor: swatch.card,
              borderRadius: 6,
              padding: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: swatch.primary }} />
            <View style={{ flex: 1, gap: 2.5 }}>
              <View style={{ height: 3, borderRadius: 1.5, backgroundColor: swatch.ink, opacity: 0.85, width: '75%' }} />
              <View style={{ height: 2.5, borderRadius: 1, backgroundColor: swatch.inkMuted, width: '50%' }} />
            </View>
          </View>

          {/* Mock accent strip */}
          <View
            style={{
              marginTop: 6,
              height: 16,
              borderRadius: 5,
              backgroundColor: swatch.accent,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 5,
              gap: 4,
            }}
          >
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: swatch.primary }} />
            <View style={{ flex: 1, height: 2.5, borderRadius: 1, backgroundColor: swatch.ink, opacity: 0.3 }} />
          </View>

          {/* Mock tab bar */}
          <View
            style={{
              marginTop: 6,
              height: 16,
              borderRadius: 5,
              backgroundColor: swatch.backgroundColorTab,
              borderWidth: 1,
              borderColor: swatch.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
              paddingHorizontal: 4,
            }}
          >
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: swatch.primary }} />
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: swatch.inkMuted }} />
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: swatch.inkMuted }} />
          </View>
        </View>

        {/* === Summary (right) === */}
        <View style={{ flex: 1, paddingTop: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text
              className="text-foreground"
              style={{
                fontFamily: 'IBMPlexSansThai_700Bold',
                fontSize: 14.5,
                color: '#5A4830',
              }}
              numberOfLines={1}
            >
              {family.name}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                backgroundColor: isDark ? '#2A2320' : '#F3EADB',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
              }}
            >
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={9}
                color={isDark ? '#F5EDE0' : '#7A6A50'}
              />
              <Text
                style={{
                  fontFamily: 'IBMPlexSansThai_600SemiBold',
                  fontSize: 9.5,
                  color: isDark ? '#F5EDE0' : '#5A4830',
                }}
              >
                {isDark ? 'มืด' : 'สว่าง'}
              </Text>
            </View>
          </View>

          {/* Color dots */}
          <View style={{ flexDirection: 'row', gap: 5, marginTop: 8 }}>
            {[swatch.bg, swatch.card, swatch.accent, swatch.primary, swatch.ink].map((c, i) => (
              <View
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: c,
                  borderWidth: 0.5,
                  borderColor: 'rgba(42,35,32,0.15)',
                }}
              />
            ))}
          </View>

          {selected && (
            <View
              style={{
                marginTop: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Ionicons name="checkmark-circle" size={13} color={swatch.primary} />
              <Text
                style={{
                  fontFamily: 'IBMPlexSansThai_600SemiBold',
                  fontSize: 11,
                  color: swatch.primary,
                }}
              >
                ใช้งานอยู่
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ===== Wallpaper category row =====

function WallpaperCategoryRow({
  category,
  currentId,
  onSelect,
}: {
  category: WallpaperCategory;
  currentId: string | null;
  onSelect: (id: string) => void;
}) {
  const presets = WALLPAPER_PRESETS.filter((p) => p.category === category);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        className="text-foreground"
        style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, marginBottom: 6, paddingHorizontal: 2 }}
      >
        {WALLPAPER_CATEGORY_LABELS[category]}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingVertical: 4, paddingRight: 4 }}
      >
        {presets.map((p) => {
          const isSelected = p.id === currentId;
          return (
            <Pressable
              key={p.id}
              onPress={() => onSelect(p.id)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
              accessibilityRole="button"
              accessibilityLabel={`เลือกพื้นหลัง ${p.name}`}
            >
              <View
                style={{
                  width: 132,
                  height: 92,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: isSelected ? '#E87A3D' : 'rgba(42,35,32,0.08)',
                  backgroundColor: '#FAF5EC',
                  overflow: 'hidden',
                }}
              >
                <Image source={p.source} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                {isSelected && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: '#E87A3D',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ===== Custom wallpaper row =====

function CustomWallpaperRow({
  customs,
  currentId,
  canAdd,
  onSelect,
  onDelete,
  onAdd,
}: {
  customs: CustomWallpaper[];
  currentId: string | null;
  canAdd: boolean;
  onSelect: (id: string) => void;
  onDelete: (entry: CustomWallpaper) => void;
  onAdd: () => void;
}) {
  return (
    <View style={{ marginTop: 4 }}>
      <Text
        className="text-foreground"
        style={{ fontFamily: 'IBMPlexSansThai_600SemiBold', fontSize: 13, marginBottom: 6, paddingHorizontal: 2 }}
      >
        ของคุณ
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingVertical: 4, paddingRight: 4 }}
      >
        {customs.map((c) => {
          const isSelected = c.id === currentId;
          return (
            <View key={c.id} style={{ position: 'relative' }}>
              <Pressable
                onPress={() => onSelect(c.id)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                })}
                accessibilityRole="button"
                accessibilityLabel="เลือกพื้นหลังของฉัน"
              >
                <View
                  style={{
                    width: 132,
                    height: 92,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: isSelected ? '#E87A3D' : 'rgba(42,35,32,0.08)',
                    backgroundColor: '#FAF5EC',
                    overflow: 'hidden',
                  }}
                >
                  <Image source={{ uri: c.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  {isSelected && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: '#E87A3D',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}
                </View>
              </Pressable>
              <Pressable
                onPress={() => onDelete(c)}
                hitSlop={8}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#E57373',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel="ลบรูปนี้"
              >
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          );
        })}
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => ({
            opacity: !canAdd ? 0.4 : pressed ? 0.7 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          })}
          accessibilityRole="button"
          accessibilityLabel="เพิ่มพื้นหลังจากเครื่อง"
        >
          <View
            style={{
              width: 132,
              height: 92,
              borderRadius: 12,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: '#E87A3D',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <Ionicons name="add" size={22} color="#E87A3D" />
            <Text
              style={{
                fontFamily: 'IBMPlexSansThai_600SemiBold',
                fontSize: 11.5,
                color: '#E87A3D',
              }}
            >
              เพิ่มจากเครื่อง
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}
