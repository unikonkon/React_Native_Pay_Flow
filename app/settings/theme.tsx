import { FAMILIES, type ThemeFamily, type ThemeSwatch } from '@/lib/constants/themes';
import { useThemeStore } from '@/lib/stores/theme-store';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ThemeScreen() {
  const currentTheme = useThemeStore(s => s.currentTheme);
  const setTheme = useThemeStore(s => s.setTheme);

  const handleSelect = (key: string) => {
    if (key === currentTheme) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTheme(key);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}>
        <Text
          style={{ fontFamily: 'IBMPlexSansThai_400Regular', fontSize: 13 }}
          className="text-muted-foreground mb-4 mt-1"
        >
          เลือกสีธีม — แต่ละชุดมีโหมดสว่างและมืดให้เลือก
        </Text>

        {FAMILIES.map((family) => (
          <FamilyCard
            key={family.id}
            family={family}
            currentTheme={currentTheme}
            onSelect={handleSelect}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
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
        marginBottom: 14,
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
        {family.light && (
          <PreviewSwatch
            swatch={family.light}
            label="สว่าง"
            selected={family.light.key === currentTheme}
            onPress={() => onSelect(family.light!.key)}
          />
        )}
        {family.dark && (
          <PreviewSwatch
            swatch={family.dark}
            label="มืด"
            selected={family.dark.key === currentTheme}
            onPress={() => onSelect(family.dark!.key)}
          />
        )}
        {/* Fill empty slot (for midnight which has only dark) */}
        {!family.light && <View style={{ flex: 1 }} />}
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

        {/* Label footer */}
        <View
          style={{
            paddingVertical: 7,
            paddingHorizontal: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: selected ? swatch.primary : '#fff',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons
              name={label === 'สว่าง' ? 'sunny' : 'moon'}
              size={13}
              color={selected ? '#fff' : '#6B5F52'}
            />
            <Text
              style={{
                fontFamily: 'IBMPlexSansThai_600SemiBold',
                fontSize: 12,
                color: selected ? '#fff' : '#2B2118',
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
