/**
 * TaskTableHeader component - Renders the sticky header for the task table
 * Extracted to be used on App level for synchronized scrolling
 */

import { useMemo } from "react";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import {
  getVisibleColumns,
  getDensityAwareWidth,
} from "../../config/tableColumns";
import { ColumnResizer } from "./ColumnResizer";
import { useTableDimensions } from "../../hooks/useTableDimensions";
import { useTableHeaderContextMenu } from "../../hooks/useTableHeaderContextMenu";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import { TABLE_HEADER } from "../../styles/design-tokens";

export function TaskTableHeader(): JSX.Element {
  const tasks = useTaskStore((state) => state.tasks);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const selectAllTasks = useTaskStore((state) => state.selectAllTasks);
  const clearSelection = useTaskStore((state) => state.clearSelection);
  const columnWidths = useTaskStore((state) => state.columnWidths);
  const setColumnWidth = useTaskStore((state) => state.setColumnWidth);
  const autoFitColumn = useTaskStore((state) => state.autoFitColumn);
  const densityConfig = useDensityConfig();
  const hiddenColumns = useChartStore((state) => state.hiddenColumns);

  // Context menu for column headers (Zone 2)
  const {
    contextMenu,
    contextMenuItems,
    handleHeaderContextMenu,
    closeContextMenu,
  } = useTableHeaderContextMenu();

  // Get visible columns based on settings
  const visibleColumns = useMemo(
    () => getVisibleColumns(hiddenColumns),
    [hiddenColumns]
  );

  // Get total column width for proper scrolling
  const { totalColumnWidth } = useTableDimensions();

  const allSelected =
    tasks.length > 0 &&
    tasks.every((task) => selectedTaskIds.includes(task.id));

  /**
   * Generate CSS grid template columns based on column widths.
   * Uses density-aware widths when no custom width is set.
   */
  const gridTemplateColumns = useMemo(() => {
    return visibleColumns
      .map((col) => {
        const customWidth = columnWidths[col.id];
        return customWidth
          ? `${customWidth}px`
          : getDensityAwareWidth(col.id, densityConfig);
      })
      .join(" ");
  }, [columnWidths, densityConfig, visibleColumns]);

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
  const handleColumnResize = (columnId: string, width: number): void => {
    setColumnWidth(columnId, width);
  };

  const handleSelectAllClick = (): void => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAllTasks();
    }
  };

  return (
    <>
      <div
        className="task-table-header-row"
        style={{
          display: "grid",
          gridTemplateColumns,
          minWidth: totalColumnWidth,
          backgroundColor: TABLE_HEADER.bg,
        }}
        role="row"
      >
        {visibleColumns.map((column) => (
          <div
            key={column.id}
            className={`task-table-header-cell ${column.id === "name" ? "pr-3" : "px-3"} py-4 border-b ${column.showRightBorder !== false ? "border-r" : ""} text-xs font-semibold text-neutral-600 uppercase tracking-wider whitespace-nowrap relative`}
            style={{
              backgroundColor: TABLE_HEADER.bg,
              borderColor: TABLE_HEADER.border,
            }}
            role="columnheader"
            tabIndex={-1}
            onContextMenu={(e) => handleHeaderContextMenu(e, column.id)}
          >
            {column.id === "rowNumber" ? (
              // Excel-style select-all triangle in top-left corner
              <button
                onClick={handleSelectAllClick}
                className="absolute inset-0 hover:bg-neutral-200 transition-colors"
                style={{ cursor: "pointer" }}
                title={allSelected ? "Deselect all" : "Select all"}
                aria-label={
                  allSelected ? "Deselect all tasks" : "Select all tasks"
                }
              >
                {/* Small triangle in bottom-right corner */}
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  style={{ position: "absolute", bottom: "4px", right: "4px" }}
                >
                  <path d="M8 0 L8 8 L0 8 Z" fill={TABLE_HEADER.triangle} />
                </svg>
              </button>
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

      {/* Context Menu */}
      {contextMenu && contextMenuItems.length > 0 && (
        <ContextMenu
          items={contextMenuItems}
          position={contextMenu.position}
          onClose={closeContextMenu}
        />
      )}
    </>
  );
}
