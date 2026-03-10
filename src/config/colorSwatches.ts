/**
 * Curated swatch palettes for manual color picking.
 * Organized by color family for easy selection.
 *
 * These values are intentionally hand-curated for aesthetic balance and are
 * not derived from the Tailwind theme or design tokens. If the brand palette
 * changes, review these swatches for consistency.
 */

export const CURATED_SWATCHES = {
  blues: ["#0A2E4A", "#0F6CBD", "#2B88D8", "#62ABF5", "#B4D6FA"],
  greens: ["#1B4332", "#2D6A4F", "#40916C", "#52B788", "#74C69D"],
  warm: ["#7F1D1D", "#DC2626", "#F97316", "#FBBF24", "#FDE68A"],
  neutral: ["#1E293B", "#334155", "#64748B", "#94A3B8", "#CBD5E1"],
} as const;

/**
 * Get all curated swatches as a flat array.
 */
export function getAllSwatches(): string[] {
  return [
    ...CURATED_SWATCHES.blues,
    ...CURATED_SWATCHES.greens,
    ...CURATED_SWATCHES.warm,
    ...CURATED_SWATCHES.neutral,
  ];
}
