/**
 * TaskTableHeader component - Renders the sticky header for the task table
 * Extracted to be used on App level for synchronized scrolling
 */

import { useMemo } from "react";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";
import { TASK_COLUMNS, getDensityAwareWidth } from "../../config/tableColumns";
import { ColumnResizer } from "./ColumnResizer";
import { useTableDimensions } from "../../hooks/useTableDimensions";

export function TaskTableHeader(): JSX.Element {
  const tasks = useTaskStore((state) => state.tasks);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const selectAllTasks = useTaskStore((state) => state.selectAllTasks);
  const clearSelection = useTaskStore((state) => state.clearSelection);
  const columnWidths = useTaskStore((state) => state.columnWidths);
  const setColumnWidth = useTaskStore((state) => state.setColumnWidth);
  const autoFitColumn = useTaskStore((state) => state.autoFitColumn);
  const densityConfig = useDensityConfig();

  // Get total column width for proper scrolling
  const { totalColumnWidth } = useTableDimensions();

  const allSelected =
    tasks.length > 0 &&
    tasks.every((task) => selectedTaskIds.includes(task.id));
  const someSelected =
    tasks.some((task) => selectedTaskIds.includes(task.id)) && !allSelected;

  /**
   * Generate CSS grid template columns based on column widths.
   * Uses density-aware widths when no custom width is set.
   */
  const gridTemplateColumns = useMemo(() => {
    return TASK_COLUMNS.map((col) => {
      const customWidth = columnWidths[col.id];
      return customWidth
        ? `${customWidth}px`
        : getDensityAwareWidth(col.id, densityConfig);
    }).join(" ");
  }, [columnWidths, densityConfig]);

  /**
   * Get current width of a column in pixels.
   * Uses density-aware widths when no custom width is set.
   */
  const getColumnWidth = (columnId: string): number => {
    const customWidth = columnWidths[columnId];
    if (customWidth) return customWidth;

    // Get density-aware default width
    const densityWidth = getDensityAwareWidth(columnId, densityConfig);
    const match = densityWidth.match(/(\d+)px/);
    if (match) return parseInt(match[1], 10);

    // For minmax, extract the first value
    const minmaxMatch = densityWidth.match(/minmax\((\d+)px/);
    if (minmaxMatch) return parseInt(minmaxMatch[1], 10);

    return 200;
  };

  /**
   * Handle column resize.
   */
  const handleColumnResize = (columnId: string, width: number) => {
    setColumnWidth(columnId, width);
  };

  const handleHeaderCheckboxClick = () => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAllTasks();
    }
  };

  return (
    <div
      className="task-table-header-row bg-slate-50"
      style={{
        display: "grid",
        gridTemplateColumns,
        minWidth: totalColumnWidth,
      }}
      role="row"
    >
      {TASK_COLUMNS.map((column) => (
        <div
          key={column.id}
          className={`task-table-header-cell ${column.id === "name" ? "pr-3" : "px-3"} py-4 bg-slate-50 border-b ${column.id !== "color" ? "border-r" : ""} border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider relative`}
          role="columnheader"
        >
          {column.id === "checkbox" ? (
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) {
                    input.indeterminate = someSelected;
                  }
                }}
                onChange={handleHeaderCheckboxClick}
                className="cursor-pointer"
                style={{
                  transform: `scale(${densityConfig.checkboxSize / 16})`,
                }}
                title={allSelected ? "Deselect all" : "Select all"}
                aria-label={
                  allSelected ? "Deselect all tasks" : "Select all tasks"
                }
              />
            </div>
          ) : column.id === "color" ? (
            ""
          ) : (
            column.label
          )}
          {/* Column Resizer - only for name column */}
          {column.id === "name" && (
            <ColumnResizer
              columnId={column.id}
              currentWidth={getColumnWidth(column.id)}
              onResize={handleColumnResize}
              onAutoResize={autoFitColumn}
              minWidth={100}
            />
          )}
        </div>
      ))}
    </div>
  );
}
