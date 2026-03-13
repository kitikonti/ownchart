/**
 * useProjectColors - Collect and track colors used in the project
 *
 * Returns unique colors that are currently used by tasks in the project.
 * Useful for "recent colors" or "project colors" in color pickers.
 */

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTaskStore } from "@/store/slices/taskSlice";

/** Maximum number of project colors to surface by default (fits a 3×4 swatch grid). */
const DEFAULT_MAX_PROJECT_COLORS = 12;

/**
 * Get unique colors used in the current project.
 * Returns colors sorted by frequency (most used first).
 */
export function useProjectColors(
  maxColors: number = DEFAULT_MAX_PROJECT_COLORS
): string[] {
  // Select the tasks array with shallow equality so we only re-run when the
  // tasks array reference changes (i.e. when tasks are added/removed/mutated).
  // The `.map()` to extract colors is intentionally inside `useMemo` below so
  // it does not run on every Zustand selector call — only when `tasks` changes.
  const tasks = useTaskStore(useShallow((state) => state.tasks));

  return useMemo(() => {
    // Count color frequency.
    // Colors are normalized to uppercase for deduplication — returned values are
    // always uppercase. Callers that compare against stored task colors must
    // normalize or compare case-insensitively.
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
      .map(([c]) => c);

    return sortedColors.slice(0, maxColors);
  }, [tasks, maxColors]);
}
