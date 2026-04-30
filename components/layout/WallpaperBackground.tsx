import { getThemeSwatch } from '@/lib/constants/themes';
import { resolveWallpaperSource } from '@/lib/constants/wallpapers';
import { useThemeStore } from '@/lib/stores/theme-store';
import { Image, StyleSheet, View } from 'react-native';

export function WallpaperBackground({ children }: { children: React.ReactNode }) {
  const wallpaperId = useThemeStore((s) => s.currentWallpaperId);
  const overlayPct = useThemeStore((s) => s.wallpaperOverlayPercent);
  const themeKey = useThemeStore((s) => s.currentTheme);
  const customs = useThemeStore((s) => s.customWallpapers);

  if (!wallpaperId) {
    return (
      <View style={{ flex: 1 }} className="bg-background">
        {children}
      </View>
    );
  }

  const source = resolveWallpaperSource(wallpaperId, customs);
  if (!source) {
    return (
      <View style={{ flex: 1 }} className="bg-background">
        {children}
      </View>
    );
  }

  const overlayColor = getThemeSwatch(themeKey)?.bg ?? '#FBF7F0';

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <Image source={source} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: overlayColor, opacity: overlayPct / 100 },
          ]}
        />
      </View>
      {children}
    </View>
  );
}
