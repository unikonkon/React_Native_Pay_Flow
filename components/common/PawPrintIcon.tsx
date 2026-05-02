import {
  PawPrint,
  PawPrintChunky,
  PawPrintDetailed,
  PawPrintFlower,
  PawPrintFootstep,
  PawPrintHeart,
  PawPrintOutlined,
  PawPrintSlim,
  PawPrintSquare,
  PawPrintWithClaws,
} from '@/assets/svg';
import { useThemeStore, type PawPrintVariant } from '@/lib/stores/theme-store';

interface PawPrintIconProps {
  size?: number;
  color?: string;
  /** Override the variant from the store (used in pickers/previews). */
  variant?: PawPrintVariant;
}

const VARIANT_MAP = {
  'classic': PawPrint,
  'detailed': PawPrintDetailed,
  'outlined': PawPrintOutlined,
  'with-claws': PawPrintWithClaws,
  'heart': PawPrintHeart,
  'chunky': PawPrintChunky,
  'square': PawPrintSquare,
  'footstep': PawPrintFootstep,
  'flower': PawPrintFlower,
  'slim': PawPrintSlim,
} as const;

export function PawPrintIcon({ size = 12, color = '#E87A3D', variant }: PawPrintIconProps) {
  const stored = useThemeStore(s => s.pawPrintVariant);
  const Component = VARIANT_MAP[variant ?? stored] ?? PawPrint;
  return <Component size={size} color={color} />;
}

export const PAW_VARIANT_OPTIONS: { id: PawPrintVariant; name: string }[] = [
  { id: 'classic', name: 'คลาสสิก' },
  { id: 'detailed', name: 'สมจริง' },
  { id: 'outlined', name: 'เส้นโปร่ง' },
  { id: 'with-claws', name: 'มีเล็บ' },
  { id: 'heart', name: 'หัวใจ' },
  { id: 'chunky', name: 'หนา' },
  { id: 'square', name: 'เหลี่ยม' },
  { id: 'footstep', name: 'เดินคู่' },
  { id: 'flower', name: 'ดอกไม้' },
  { id: 'slim', name: 'เรียว' },
];
