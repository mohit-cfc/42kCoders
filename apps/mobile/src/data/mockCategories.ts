import type { LucideIcon } from "lucide-react-native";
import {
  Coffee,
  Hammer,
  Plug,
  Printer,
  Scissors,
  Smartphone,
  UtensilsCrossed,
} from "lucide-react-native";

import type { Category } from "../types";

// Local extension: backend Category only carries id/name/icon_url. We add a
// Lucide icon component for the demo without touching types.ts.
export interface DemoCategory extends Category {
  icon: LucideIcon;
  tint: string;
}

export const CATEGORIES: DemoCategory[] = [
  { id: "food", name: "Food", icon: UtensilsCrossed, tint: "#FCE7E7" },
  { id: "chai", name: "Chai", icon: Coffee, tint: "#FCF1DD" },
  { id: "repair", name: "Repair", icon: Hammer, tint: "#E2F0FC" },
  { id: "mobile", name: "Mobile Repair", icon: Smartphone, tint: "#EEFAFE" },
  { id: "utility", name: "Utility", icon: Plug, tint: "#E4F6EC" },
  { id: "beauty", name: "Beauty", icon: Scissors, tint: "#F2F8FE" },
  { id: "stationery", name: "Stationery", icon: Printer, tint: "#EAF2FB" },
];

export function findCategory(name: string): DemoCategory | undefined {
  return CATEGORIES.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
}
