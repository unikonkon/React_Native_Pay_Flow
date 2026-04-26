import { ADD_MASCOTS, BG_MASCOTS, type MascotOption } from '@/lib/constants/mascots';
import { FAMILIES, type ThemeFamily, type ThemeSwatch } from '@/lib/constants/themes';
import { useThemeStore } from '@/lib/stores/theme-store';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

export function ThemeSettingsContent({ showIntro = false }: { showIntro?: boolean }) {
  const currentTheme = useThemeStore(s => s.currentTheme);
  const setTheme = useThemeStore(s => s.setTheme);
  const currentBgMascot = useThemeStore(s => s.currentBgMascot);
  const setBgMascot = useThemeStore(s => s.setBgMascot);
  const currentAddMascot = useThemeStore(s => s.currentAddMascot);
  const setAddMascot = useThemeStore(s => s.setAddMascot);

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

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {FAMILIES.map((family) => (
          <View key={family.id} style={{ width: '48.5%' }}>
            <FamilyCard
              family={family}
              currentTheme={currentTheme}
              onSelect={handleSelect}
            />
          </View>
        ))}
      </View>

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

// ===== Family card with Light/Dark pair =====

function FamilyCard({
  family,
  currentTheme,
  onSelect,
}: {
  family: ThemeFamily;
  currentTheme: string;
  onSelect: (key: string) => void;
}) {
  const isActiveFamily =
    (family.light && family.light.key === currentTheme) ||
    (family.dark && family.dark.key === currentTheme);

  return (
    <View
      className="bg-card"
      style={{
        borderRadius: 20,
        padding: 14,
        shadowColor: '#2A2320',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
        borderWidth: isActiveFamily ? 1.5 : 0,
        borderColor: isActiveFamily ? '#E87A3D' : 'transparent',
      }}
    >
      {/* Family header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: (family.light ?? family.dark!).accent,
            borderWidth: 1,
            borderColor: 'rgba(42,35,32,0.06)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: (family.light ?? family.dark!).primary,
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 15.5 }}
            className="text-foreground"
          >
            {family.name}
          </Text>
          <Text
            style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 11, marginTop: 1 }}
            className="text-muted-foreground"
          >
            {family.description}
          </Text>
        </View>
      </View>

      {/* Light/Dark preview row */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          {family.light ? (
            <PreviewSwatch
              swatch={family.light}
              label="สว่าง"
              selected={family.light.key === currentTheme}
              onPress={() => onSelect(family.light!.key)}
            />
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          {family.dark ? (
            <PreviewSwatch
              swatch={family.dark}
              label="มืด"
              selected={family.dark.key === currentTheme}
              onPress={() => onSelect(family.dark!.key)}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

// ===== Single swatch preview (mock UI card) =====

function PreviewSwatch({
  swatch,
  label,
  selected,
  onPress,
}: {
  swatch: ThemeSwatch;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: selected ? swatch.primary : 'rgba(42,35,32,0.08)',
        }}
      >
        {/* Mock UI preview */}
        <View style={{ backgroundColor: swatch.bg, padding: 10, minHeight: 92 }}>
          {/* Mini "card" row */}
          <View
            style={{
              backgroundColor: swatch.card,
              borderRadius: 8,
              padding: 7,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: swatch.primary,
              }}
            />
            <View style={{ flex: 1, gap: 3 }}>
              <View
                style={{
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: swatch.ink,
                  opacity: 0.85,
                  width: '70%',
                }}
              />
              <View
                style={{
                  height: 2.5,
                  borderRadius: 1.5,
                  backgroundColor: swatch.inkMuted,
                  width: '45%',
                }}
              />
            </View>
          </View>

          {/* Mini accent band */}
          <View
            style={{
              marginTop: 8,
              height: 18,
              borderRadius: 6,
              backgroundColor: swatch.accent,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 6,
              gap: 4,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: swatch.primary,
              }}
            />
            <View
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor: swatch.ink,
                opacity: 0.3,
              }}
            />
          </View>
        </View>

        {/* Label footer — uses swatch's own colors so the preview reflects the theme */}
        <View
          style={{
            paddingVertical: 7,
            paddingHorizontal: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: selected ? swatch.primary : swatch.card,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons
              name={label === 'สว่าง' ? 'sunny' : 'moon'}
              size={13}
              color={selected ? '#fff' : swatch.inkMuted}
            />
            <Text
              style={{
                fontFamily: 'IBMPlexSansThai_600SemiBold',
                fontSize: 12,
                color: selected ? '#fff' : swatch.ink,
              }}
            >
              {label}
            </Text>
          </View>
          {selected && <Ionicons name="checkmark-circle" size={15} color="#fff" />}
        </View>
      </View>
    </Pressable>
  );
}
