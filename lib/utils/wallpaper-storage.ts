import { Directory, File, Paths } from 'expo-file-system/next';
import { generateId } from '@/lib/utils/id';
import type { CustomWallpaper } from '@/lib/constants/wallpapers';

const WALLPAPER_DIR_NAME = 'wallpapers';

function ensureDir(): Directory {
  const dir = new Directory(Paths.document, WALLPAPER_DIR_NAME);
  dir.create({ idempotent: true });
  return dir;
}

function extFromUri(uri: string): string {
  const lastDot = uri.lastIndexOf('.');
  if (lastDot < 0) return 'jpg';
  const raw = uri.slice(lastDot + 1).toLowerCase();
  // strip query string or fragment if any
  const clean = raw.replace(/[?#].*$/, '');
  if (clean === 'jpeg' || clean === 'jpg' || clean === 'png' || clean === 'webp' || clean === 'heic') {
    return clean === 'jpeg' ? 'jpg' : clean;
  }
  return 'jpg';
}

/**
 * Copy a picked image into the app's documents folder.
 * Returns the new `CustomWallpaper` entry on success.
 * Throws if the source cannot be read.
 */
export async function importCustomWallpaper(srcUri: string): Promise<CustomWallpaper> {
  const dir = ensureDir();
  const id = generateId();
  const ext = extFromUri(srcUri);
  const dest = new File(dir, `${id}.${ext}`);
  const source = new File(srcUri);
  source.copy(dest);
  return { id, uri: dest.uri, addedAt: Date.now() };
}

/**
 * Delete a custom wallpaper file from disk.
 * Silently no-ops if the file is already gone.
 */
export async function deleteCustomWallpaperFile(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // file already missing or unreadable — caller's state cleanup is what matters
  }
}
