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

/**
 * Parse width from CSS grid syntax.
 * Extracts pixel value from various formats:
 * - 'minmax(200px, 1fr)' -> 200
 * - '150px' -> 150
 * - '1fr' -> 100 (fallback)
 */
function parseWidth(widthStr: string): number {
  // Extract first pixel value
  const match = widthStr.match(/(\d+)px/);
  return match ? parseInt(match[1], 10) : 100;
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

  // Get visible columns based on settings
  const visibleColumns = useMemo(
    () => getVisibleColumns(hiddenColumns),
    [hiddenColumns]
  );

  const totalColumnWidth = useMemo(() => {
    return visibleColumns.reduce((sum, col) => {
      const customWidth = columnWidths[col.id];
      const width =
        customWidth ?? parseWidth(getDensityAwareWidth(col.id, densityConfig));
      return sum + width;
    }, 0);
  }, [columnWidths, densityConfig, visibleColumns]);

  return { totalColumnWidth };
}
