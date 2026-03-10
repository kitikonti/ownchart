/**
 * Hook for calculating table dimensions based on column widths.
 * Used to determine the maximum width for the split pane.
 */

import { useMemo } from "react";
import { useTaskStore } from "../store/slices/taskSlice";
import { useChartStore } from "../store/slices/chartSlice";
import { useDensityConfig } from "../store/slices/userPreferencesSlice";
import {
  getDensityAwareWidth,
  getVisibleColumns,
} from "../config/tableColumns";

/** Fallback column width in pixels when no px value can be parsed from the CSS string. */
const FALLBACK_COLUMN_WIDTH_PX = 100;

/**
 * Parse width from CSS grid syntax.
 * Extracts pixel value from various formats:
 * - 'minmax(200px, 1fr)' -> 200  (name column)
 * - '150px' -> 150               (all other columns)
 * - '1fr' -> FALLBACK_COLUMN_WIDTH_PX (defensive fallback — not reachable with
 *   current getDensityAwareWidth output, which always includes a px value)
 */
function parseWidth(widthStr: string): number {
  // Extract first pixel value from the CSS string
  const match = widthStr.match(/(\d+)px/);
  return match ? parseInt(match[1], 10) : FALLBACK_COLUMN_WIDTH_PX;
}

/**
 * Hook that calculates the total width of all table columns.
 * This is used to set the maximum width for the split pane.
 * Uses density-aware widths when no custom width is set.
 * Uses visible columns for show/hide progress column (Sprint 1.5.9).
 */
export function useTableDimensions(): { totalColumnWidth: number } {
  const columnWidths = useTaskStore((state) => state.columnWidths);
  const densityConfig = useDensityConfig();
  const hiddenColumns = useChartStore((state) => state.hiddenColumns);

  const totalColumnWidth = useMemo(() => {
    return getVisibleColumns(hiddenColumns).reduce((sum, col) => {
      const customWidth = columnWidths[col.id];
      const width =
        customWidth ?? parseWidth(getDensityAwareWidth(col.id, densityConfig));
      return sum + width;
    }, 0);
  }, [columnWidths, densityConfig, hiddenColumns]);

  return { totalColumnWidth };
}
