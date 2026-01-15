/**
 * useProjectColors - Collect and track colors used in the project
 *
 * Returns unique colors that are currently used by tasks in the project.
 * Useful for "recent colors" or "project colors" in color pickers.
 */

import { useMemo } from "react";
import { useTaskStore } from "../store/slices/taskSlice";

/**
 * Get unique colors used in the current project
 * Returns colors sorted by frequency (most used first)
 */
export function useProjectColors(maxColors: number = 12): string[] {
  const tasks = useTaskStore((state) => state.tasks);

  return useMemo(() => {
    // Count color frequency
    const colorCounts = new Map<string, number>();

    for (const task of tasks) {
      if (task.color) {
        const normalizedColor = task.color.toUpperCase();
        colorCounts.set(
          normalizedColor,
          (colorCounts.get(normalizedColor) || 0) + 1
        );
      }
    }

    // Sort by frequency (descending) and return unique colors
    const sortedColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([color]) => color);

    return sortedColors.slice(0, maxColors);
  }, [tasks, maxColors]);
}

/**
 * Curated swatch palettes for manual color picking
 * Organized by color family for easy selection
 */
export const CURATED_SWATCHES = {
  blues: ["#0A2E4A", "#0F6CBD", "#2B88D8", "#62ABF5", "#B4D6FA"],
  greens: ["#1B4332", "#2D6A4F", "#40916C", "#52B788", "#74C69D"],
  warm: ["#7F1D1D", "#DC2626", "#F97316", "#FBBF24", "#FDE68A"],
  neutral: ["#1E293B", "#334155", "#64748B", "#94A3B8", "#CBD5E1"],
} as const;

/**
 * Get all curated swatches as flat array
 */
export function getAllSwatches(): string[] {
  return [
    ...CURATED_SWATCHES.blues,
    ...CURATED_SWATCHES.greens,
    ...CURATED_SWATCHES.warm,
    ...CURATED_SWATCHES.neutral,
  ];
}
