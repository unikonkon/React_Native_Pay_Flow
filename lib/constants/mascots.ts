import type { ImageSourcePropType } from "react-native";

export interface MascotOption {
  id: string;
  name: string;
  source: ImageSourcePropType;
}

export const BG_MASCOTS: MascotOption[] = [
  { id: "bg", name: "แมวมันนี่", source: require("@/assets/bg/bg.png") },
  { id: "bg1", name: "แบบ 1", source: require("@/assets/bg/bg1.png") },
  { id: "bg2", name: "แบบ 2", source: require("@/assets/bg/bg2.png") },
  { id: "bg3", name: "แบบ 3", source: require("@/assets/bg/bg3.png") },
  {
    id: "iconApp",
    name: "iconApp",
    source: require("@/assets/images/iconApp.png"),
  },
  { id: "bg4", name: "แบบ 4", source: require("@/assets/add/add4.png") },
  { id: "bg5", name: "แบบ 5", source: require("@/assets/add/add5.png") },
  { id: "bg6", name: "แบบ 6", source: require("@/assets/add/add6.png") },
  { id: "bg7", name: "แบบ 7", source: require("@/assets/add/add7.png") },
  { id: "bgEmty", name: "ว่าง", source: require("@/assets/bg/bgEmty.png") },
];

export const ADD_MASCOTS: MascotOption[] = [
  { id: "add", name: "แมวมันนี่", source: require("@/assets/add/add.png") },
  { id: "add1", name: "แบบ 1", source: require("@/assets/add/add1.png") },
  { id: "add2", name: "แบบ 2", source: require("@/assets/add/add2.png") },
  { id: "add3", name: "แบบ 3", source: require("@/assets/add/add3.png") },
  {
    id: "iconApp",
    name: "iconApp",
    source: require("@/assets/images/iconApp.png"),
  },
  { id: "add4", name: "แบบ 4", source: require("@/assets/add/add4.png") },
  { id: "add5", name: "แบบ 5", source: require("@/assets/add/add5.png") },
  { id: "add6", name: "แบบ 6", source: require("@/assets/add/add6.png") },
  { id: "add7", name: "แบบ 7", source: require("@/assets/add/add7.png") },
  { id: "addbg", name: "แบบ bg", source: require("@/assets/bg/bg.png") },
  { id: "addbg1", name: "แบบ bg 1", source: require("@/assets/bg/bg1.png") },
  { id: "addbg2", name: "แบบ bg 2", source: require("@/assets/bg/bg2.png") },
  { id: "addbg3", name: "แบบ bg 3", source: require("@/assets/bg/bg3.png") },
  {
    id: "addbgEmty",
    name: "แบบ bg ว่าง",
    source: require("@/assets/bg/bgEmty.png"),
  },
];

export const DEFAULT_BG_MASCOT_ID = "bg";
export const DEFAULT_ADD_MASCOT_ID = "add";

export function getBgMascotSource(id: string): ImageSourcePropType {
  return BG_MASCOTS.find((m) => m.id === id)?.source ?? BG_MASCOTS[0].source;
}

export function getAddMascotSource(id: string): ImageSourcePropType {
  return ADD_MASCOTS.find((m) => m.id === id)?.source ?? ADD_MASCOTS[0].source;
}
