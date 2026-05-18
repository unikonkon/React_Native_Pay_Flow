import { getThemeSwatch } from '@/lib/constants/themes';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORY_QUICK_ITEM_WIDTH = 66;

// Fallbacks tuned for the default warm-light theme (matches global.css)
const FALLBACK_BG = '#FBF7F0';
const FALLBACK_WEAK = 'rgba(42,35,32,0.06)';
const FALLBACK_STRONG = 'rgba(42,35,32,0.09)';

interface SkeletonPalette {
  bg: string;
  weak: string;
  strong: string;
}

/**
 * Lightweight placeholder shown while the real TransactionForm defers its
 * first render on Android. Mirrors the form's outer layout so the BottomSheet
 * doesn't shift when the real content mounts. Adapts to light/dark themes
 * via the active ThemeFamily swatch.
 */
export function TransactionFormSkeleton() {
  const insets = useSafeAreaInsets();
  const commonCategoryLimit = useSettingsStore(s => s.commonCategoryLimit);
  const topCategoryLimit = useSettingsStore(s => s.topCategoryLimit);
  const showCommonCategories = useSettingsStore(s => s.showCommonCategories);
  const showTopCategories = useSettingsStore(s => s.showTopCategories);
  const calcPadButtonPadding = useSettingsStore(s => s.calcPadButtonPadding);
  const currentTheme = useThemeStore(s => s.currentTheme);

  const palette = useMemo<SkeletonPalette>(() => {
    const swatch = getThemeSwatch(currentTheme);
    if (!swatch) return { bg: FALLBACK_BG, weak: FALLBACK_WEAK, strong: FALLBACK_STRONG };
    // `border` = subtle outline tint, `accent` = stronger surface tint.
    // Both variants are tuned per family for the right contrast.
    return { bg: swatch.bg, weak: swatch.border, strong: swatch.accent };
  }, [currentTheme]);

  const pulse = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const commonCount = Math.min(8, Math.max(1, commonCategoryLimit || 7));
  const topCount = Math.min(8, Math.max(1, topCategoryLimit || 8));

  const Block = ({
    width,
    height,
    radius = 8,
    style,
    strong,
  }: {
    width?: number | `${number}%`;
    height: number;
    radius?: number;
    style?: object;
    strong?: boolean;
  }) => (
    <View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: strong ? palette.strong : palette.weak,
        },
        style,
      ]}
    />
  );

  const renderCategoryRow = (count: number) => (
    <View style={{ paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 1, gap: 4, justifyContent: 'space-between' }}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={{ width: CATEGORY_QUICK_ITEM_WIDTH, alignItems: 'center', gap: 4, paddingVertical: 2 }}>
            <Block width={46} height={46} radius={23} strong />
            <Block width={48} height={10} radius={4} />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <Animated.View style={{ flex: 1, opacity: pulse, backgroundColor: palette.bg }}>
      {/* Header: settings + type toggle + close */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 1, gap: 8 }}
      >
        <Block width={82} height={44} radius={17} strong />
        <View style={{ flex: 1 }}>
          <Block width="100%" height={44} radius={999} strong />
        </View>
        <Block width={62} height={44} radius={17} strong />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 14 }}>
        {/* Amount display row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: 6,
            paddingBottom: 8,
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: 0,
              justifyContent: 'center',
              height: '100%',
              minWidth: 60,
              alignItems: 'flex-start',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Block width={22} height={22} radius={11} strong />
              <Block width={48} height={11} radius={4} />
            </View>
          </View>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: 4,
              paddingTop: 10,
            }}
          >
            <Block width={160} height={44} radius={10} strong />
          </View>
        </View>

        {/* Scrollable category area */}
        <View style={{ flex: 1 }}>
          {showCommonCategories && renderCategoryRow(commonCount)}
          {showTopCategories && renderCategoryRow(topCount)}
        </View>

        {/* Bottom fixed section */}
        <View style={{ flexShrink: 0, paddingBottom: Math.max(6, insets.bottom) }}>
          {/* Frequent pills row */}
          <View style={{ paddingBottom: 6 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 1 }}>
              <Block width={90} height={42} radius={14} />
              <Block width={90} height={42} radius={14} />
              <Block width={90} height={42} radius={14} />
            </View>
          </View>

          {/* Note + Date + Wallet chips */}
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, marginTop: 4 }}
          >
            <View style={{ flexShrink: 1, maxWidth: '55%', width: '40%' }}>
              <Block width="100%" height={32} radius={10} />
            </View>
            <View style={{ flex: 1 }}>
              <Block width="100%" height={36} radius={10} />
            </View>
            <View style={{ flex: 1 }}>
              <Block width="100%" height={36} radius={10} strong />
            </View>
          </View>

          {/* Past notes row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Block width={80} height={22} radius={999} />
            <Block width={90} height={22} radius={999} />
            <Block width={70} height={22} radius={999} />
          </View>

          {/* Calculator pad — 4 rows of 4 buttons */}
          <View style={{ paddingVertical: 1 }}>
            {Array.from({ length: 4 }).map((_, rowIdx) => (
              <View key={rowIdx} style={{ flexDirection: 'row', marginBottom: 4 }}>
                {Array.from({ length: 4 }).map((_, colIdx) => (
                  <View
                    key={colIdx}
                    style={{
                      flex: 1,
                      marginHorizontal: 4,
                      borderRadius: 10,
                      backgroundColor: palette.strong,
                      height: 20 + calcPadButtonPadding * 2,
                    }}
                  />
                ))}
              </View>
            ))}
            {/* Last row: 00 | 0 | Save (flex 2) */}
            <View style={{ flexDirection: 'row', marginBottom: 2 }}>
              <View
                style={{
                  flex: 1,
                  marginHorizontal: 4,
                  borderRadius: 12,
                  backgroundColor: palette.strong,
                  height: 20 + calcPadButtonPadding * 2,
                }}
              />
              <View
                style={{
                  flex: 1,
                  marginHorizontal: 4,
                  borderRadius: 12,
                  backgroundColor: palette.strong,
                  height: 20 + calcPadButtonPadding * 2,
                }}
              />
              <View
                style={{
                  flex: 2,
                  marginHorizontal: 4,
                  borderRadius: 14,
                  backgroundColor: palette.strong,
                  height: 20 + calcPadButtonPadding * 2,
                }}
              />
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
