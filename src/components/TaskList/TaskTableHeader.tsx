/**
 * TaskTableHeader component - Renders the sticky header for the task table.
 * Extracted to be used on App level for synchronized scrolling.
 */

import { memo, useCallback, useMemo } from "react";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import {
  getVisibleColumns,
  buildGridTemplateColumns,
  getColumnPixelWidth,
  NAME_COLUMN_ID,
} from "../../config/tableColumns";
import { ColumnResizer } from "./ColumnResizer";
import { useTableDimensions } from "../../hooks/useTableDimensions";
import { useTableHeaderContextMenu } from "../../hooks/useTableHeaderContextMenu";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import { TABLE_HEADER } from "../../styles/design-tokens";

// ── Constants ────────────────────────────────────────────────────────────────

const SELECT_ALL_TRIANGLE_SIZE = 8;
const SELECT_ALL_TRIANGLE_INSET = "4px";
const NAME_RESIZER_MIN_WIDTH = 100;

// ── Component ────────────────────────────────────────────────────────────────

export const TaskTableHeader = memo(function TaskTableHeader(): JSX.Element {
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

  const allSelected = useMemo(() => {
    if (tasks.length === 0) return false;
    const selectedSet = new Set(selectedTaskIds);
    return tasks.every((task) => selectedSet.has(task.id));
  }, [tasks, selectedTaskIds]);

  /**
   * Generate CSS grid template columns based on column widths.
   * Uses density-aware widths when no custom width is set.
   */
  const gridTemplateColumns = useMemo(
    () => buildGridTemplateColumns(visibleColumns, columnWidths, densityConfig),
    [columnWidths, densityConfig, visibleColumns]
  );

  const handleSelectAllClick = useCallback((): void => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAllTasks();
    }
  }, [allSelected, clearSelection, selectAllTasks]);

  return (
    <>
      <div
        className="task-table-header-row grid"
        style={{
          gridTemplateColumns,
          minWidth: totalColumnWidth,
          backgroundColor: TABLE_HEADER.bg,
        }}
        role="row"
      >
        {visibleColumns.map((column) => (
          <div
            key={column.id}
            className={[
              "task-table-header-cell",
              column.id === NAME_COLUMN_ID ? "pr-3" : "px-3",
              "py-4 border-b",
              column.showRightBorder !== false ? "border-r" : "",
              "text-xs font-semibold text-neutral-600 uppercase tracking-wider",
              "whitespace-nowrap relative",
            ].join(" ")}
            style={{
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
                className="absolute inset-0 cursor-pointer hover:bg-neutral-200 transition-colors"
                title={allSelected ? "Deselect all" : "Select all"}
                aria-label={
                  allSelected ? "Deselect all tasks" : "Select all tasks"
                }
              >
                {/* Small triangle in bottom-right corner */}
                <svg
                  width={SELECT_ALL_TRIANGLE_SIZE}
                  height={SELECT_ALL_TRIANGLE_SIZE}
                  viewBox={`0 0 ${SELECT_ALL_TRIANGLE_SIZE} ${SELECT_ALL_TRIANGLE_SIZE}`}
                  style={{
                    position: "absolute",
                    bottom: SELECT_ALL_TRIANGLE_INSET,
                    right: SELECT_ALL_TRIANGLE_INSET,
                  }}
                >
                  <path
                    d={`M${SELECT_ALL_TRIANGLE_SIZE} 0 L${SELECT_ALL_TRIANGLE_SIZE} ${SELECT_ALL_TRIANGLE_SIZE} L0 ${SELECT_ALL_TRIANGLE_SIZE} Z`}
                    fill={TABLE_HEADER.triangle}
                  />
                </svg>
              </button>
            ) : column.id === "color" ? null : (
              column.label
            )}
            {/* Column Resizer - only for name column */}
            {column.id === NAME_COLUMN_ID && (
              <ColumnResizer
                columnId={column.id}
                currentWidth={getColumnPixelWidth(
                  column.id,
                  columnWidths,
                  densityConfig
                )}
                onResize={setColumnWidth}
                onAutoResize={autoFitColumn}
                minWidth={NAME_RESIZER_MIN_WIDTH}
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
});
