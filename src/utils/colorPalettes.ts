/**
 * Curated color palettes for Smart Color Management
 * 13 professionally designed palettes in 3 categories
 */

/**
 * Palette category for organization in UI
 */
export type PaletteCategory = "corporate" | "nature" | "creative";

/**
 * Color palette definition
 */
export interface ColorPalette {
  id: string;
  name: string;
  category: PaletteCategory;
  colors: string[]; // 5 hex colors from dark to light
}

/**
 * All curated palettes organized by category
 */
export const COLOR_PALETTES: ColorPalette[] = [
  // ═══════════════════════════════════════════════════════
  // CORPORATE / PROFESSIONAL
  // ═══════════════════════════════════════════════════════

  {
    id: "corporate-blue",
    name: "Corporate Blue",
    category: "corporate",
    colors: ["#0A2E4A", "#0F6CBD", "#2B88D8", "#62ABF5", "#B4D6FA"],
  },
  {
    id: "slate",
    name: "Slate",
    category: "corporate",
    colors: ["#1E293B", "#334155", "#475569", "#64748B", "#94A3B8"],
  },
  {
    id: "warm-neutral",
    name: "Warm Neutral",
    category: "corporate",
    colors: ["#44403C", "#57534E", "#78716C", "#A8A29E", "#D6D3D1"],
  },
  {
    id: "ownchart-mono",
    name: "OwnChart Mono",
    category: "corporate",
    colors: ["#134E4A", "#0F766E", "#14B8A6", "#5EEAD4", "#99F6E4"],
  },

  // ═══════════════════════════════════════════════════════
  // NATURE
  // ═══════════════════════════════════════════════════════

  {
    id: "ocean",
    name: "Ocean",
    category: "nature",
    colors: ["#023E8A", "#0077B6", "#0096C7", "#00B4D8", "#48CAE4"],
  },
  {
    id: "forest",
    name: "Forest",
    category: "nature",
    colors: ["#1B4332", "#2D6A4F", "#40916C", "#52B788", "#74C69D"],
  },
  {
    id: "sunset",
    name: "Sunset",
    category: "nature",
    colors: ["#7F1D1D", "#DC2626", "#F97316", "#FBBF24", "#FDE68A"],
  },
  {
    id: "earth",
    name: "Earth",
    category: "nature",
    colors: ["#422006", "#78350F", "#A16207", "#CA8A04", "#EAB308"],
  },

  // ═══════════════════════════════════════════════════════
  // CREATIVE
  // ═══════════════════════════════════════════════════════

  {
    id: "candy",
    name: "Candy",
    category: "creative",
    colors: ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181"],
  },
  {
    id: "neon",
    name: "Neon",
    category: "creative",
    colors: ["#00F5D4", "#00BBF9", "#FEE440", "#F15BB5", "#9B5DE5"],
  },
  {
    id: "pastel",
    name: "Pastel",
    category: "creative",
    colors: ["#FECACA", "#FED7AA", "#FEF08A", "#BBF7D0", "#BFDBFE"],
  },
  {
    id: "berry",
    name: "Berry",
    category: "creative",
    colors: ["#831843", "#BE185D", "#DB2777", "#EC4899", "#F9A8D4"],
  },
];

/**
 * Get palette by ID
 */
export function getPaletteById(id: string): ColorPalette | undefined {
  return COLOR_PALETTES.find((p) => p.id === id);
}

/**
 * Get palettes by category
 */
export function getPalettesByCategory(
  category: PaletteCategory
): ColorPalette[] {
  return COLOR_PALETTES.filter((p) => p.category === category);
}

/**
 * Category display names for UI
 */
export const CATEGORY_LABELS: Record<PaletteCategory, string> = {
  corporate: "Corporate",
  nature: "Natur",
  creative: "Kreativ",
};

/**
 * Category icons for UI (emoji)
 */
export const CATEGORY_ICONS: Record<PaletteCategory, string> = {
  corporate: "🏢",
  nature: "🌿",
  creative: "🎭",
};
