/**
 * Hook for calculating table dimensions based on column widths.
 * Used to determine the maximum width for the split pane.
 */

import { useMemo } from "react";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useChartStore } from "@/store/slices/chartSlice";
import { useDensityConfig } from "@/store/slices/userPreferencesSlice";
import { getColumnPixelWidth, getVisibleColumns } from "@/config/tableColumns";

interface UseTableDimensionsResult {
  totalColumnWidth: number;
}

/**
 * Hook that calculates the total width of all table columns.
 * This is used to set the maximum width for the split pane.
 * Uses density-aware widths when no custom width is set.
 * Uses visible columns for show/hide progress column (Sprint 1.5.9).
 */
export function useTableDimensions(): UseTableDimensionsResult {
  const columnWidths = useTaskStore((state) => state.columnWidths);
  const densityConfig = useDensityConfig();
  const hiddenColumns = useChartStore((state) => state.hiddenColumns);
  const workingDaysMode = useChartStore((state) => state.workingDaysMode);

  const totalColumnWidth = useMemo(() => {
    return getVisibleColumns(hiddenColumns).reduce((sum, col) => {
      // Use getColumnPixelWidth — the same function buildGridTemplateColumns
      // uses to render the actual grid. This ensures the split pane's max
      // constraint matches the rendered table width, including the WD-mode
      // duration column floor (DURATION_WD_EXTRA_PX).
      const width = getColumnPixelWidth(
        col.id,
        columnWidths,
        densityConfig,
        workingDaysMode
      );
      return sum + width;
    }, 0);
  }, [columnWidths, densityConfig, hiddenColumns, workingDaysMode]);

  return { totalColumnWidth };
}
