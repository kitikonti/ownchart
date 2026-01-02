/**
 * Hook for calculating table dimensions based on column widths.
 * Used to determine the maximum width for the split pane.
 */

import { useMemo } from 'react';
import { useTaskStore } from '../store/slices/taskSlice';
import { TASK_COLUMNS } from '../config/tableColumns';

/**
 * Parse default width from CSS grid syntax.
 * Extracts pixel value from various formats:
 * - 'minmax(200px, 1fr)' -> 200
 * - '150px' -> 150
 * - '1fr' -> 100 (fallback)
 */
function parseDefaultWidth(defaultWidth: string): number {
  // Extract first pixel value
  const match = defaultWidth.match(/(\d+)px/);
  return match ? parseInt(match[1], 10) : 100;
}

/**
 * Hook that calculates the total width of all table columns.
 * This is used to set the maximum width for the split pane.
 */
export function useTableDimensions() {
  const columnWidths = useTaskStore((state) => state.columnWidths);

  const totalColumnWidth = useMemo(() => {
    return TASK_COLUMNS.reduce((sum, col) => {
      const width = columnWidths[col.id] ?? parseDefaultWidth(col.defaultWidth);
      return sum + width;
    }, 0);
  }, [columnWidths]);

  return { totalColumnWidth };
}
