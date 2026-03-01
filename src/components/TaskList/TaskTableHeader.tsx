/**
 * TaskTableHeader component - Renders the sticky header for the task table.
 * Extracted to be used on App level for synchronized scrolling.
 */

import { memo, useCallback, useMemo } from "react";
import { useDensityConfig } from "@/store/slices/userPreferencesSlice";
import { useChartStore } from "@/store/slices/chartSlice";
import { useTaskTableHeaderStore } from "@/hooks/useTaskTableHeaderStore";
import type { DensityConfig } from "@/types/preferences.types";
import type { ColumnDefinition } from "@/config/tableColumns";
import {
  getVisibleColumns,
  buildGridTemplateColumns,
  getColumnPixelWidth,
  NAME_COLUMN_ID,
} from "@/config/tableColumns";
import { ColumnResizer } from "./ColumnResizer";
import { useTableDimensions } from "@/hooks/useTableDimensions";
import { useTableHeaderContextMenu } from "@/hooks/useTableHeaderContextMenu";
import { ContextMenu } from "@/components/ContextMenu/ContextMenu";
import { TABLE_HEADER } from "@/styles/design-tokens";

// ── Constants ────────────────────────────────────────────────────────────────

const SELECT_ALL_TRIANGLE_SIZE = 8;
const NAME_RESIZER_MIN_WIDTH = 100;

// ── Private Sub-Components ───────────────────────────────────────────────────

interface SelectAllButtonProps {
  allSelected: boolean;
  onSelectAll: () => void;
}

/** Excel-style select-all button rendered in the row-number column header. */
const SelectAllButton = memo(function SelectAllButton({
  allSelected,
  onSelectAll,
}: SelectAllButtonProps): JSX.Element {
  return (
    <button
      onClick={onSelectAll}
      className="absolute inset-0 cursor-pointer hover:bg-neutral-200 transition-colors"
      title={allSelected ? "Deselect all" : "Select all"}
      aria-label={allSelected ? "Deselect all tasks" : "Select all tasks"}
    >
      {/* Small triangle in bottom-right corner — decorative, described by button aria-label */}
      <svg
        width={SELECT_ALL_TRIANGLE_SIZE}
        height={SELECT_ALL_TRIANGLE_SIZE}
        viewBox={`0 0 ${SELECT_ALL_TRIANGLE_SIZE} ${SELECT_ALL_TRIANGLE_SIZE}`}
        className="absolute bottom-1 right-1"
        aria-hidden="true"
      >
        <path
          d={`M${SELECT_ALL_TRIANGLE_SIZE} 0 L${SELECT_ALL_TRIANGLE_SIZE} ${SELECT_ALL_TRIANGLE_SIZE} L0 ${SELECT_ALL_TRIANGLE_SIZE} Z`}
          fill={TABLE_HEADER.triangle}
        />
      </svg>
    </button>
  );
});

interface HeaderCellProps {
  column: ColumnDefinition;
  densityConfig: DensityConfig;
  /** Only relevant for the rowNumber column — omit for all other columns. */
  allSelected?: boolean;
  columnWidths: Record<string, number>;
  /** Only relevant for the rowNumber column — omit for all other columns. */
  onSelectAll?: () => void;
  onContextMenu: (e: React.MouseEvent, columnId: string) => void;
  setColumnWidth: (id: string, width: number) => void;
  autoFitColumn: (id: string) => void;
}

// Stable noop used as default for onSelectAll when the cell is not rowNumber.
const noop = (): void => {};

/** Renders a single column header cell with context menu and optional resizer. */
const HeaderCell = memo(function HeaderCell({
  column,
  densityConfig,
  allSelected = false,
  columnWidths,
  onSelectAll = noop,
  onContextMenu,
  setColumnWidth,
  autoFitColumn,
}: HeaderCellProps): JSX.Element {
  return (
    <div
      className={[
        "task-table-header-cell",
        column.id === NAME_COLUMN_ID ? "pr-3" : "px-3",
        "border-b",
        (column.showRightBorder ?? true) ? "border-r" : "",
        "text-xs font-semibold text-neutral-600 uppercase tracking-wider",
        "whitespace-nowrap relative",
      ].join(" ")}
      style={{
        borderColor: TABLE_HEADER.border,
        // Vertical padding follows density so the header height matches row height
        paddingTop: densityConfig.headerPaddingY,
        paddingBottom: densityConfig.headerPaddingY,
      }}
      role="columnheader"
      // tabIndex=0 makes headers reachable via Tab; the browser ContextMenu
      // key (or Shift+F10) will fire onContextMenu for keyboard users.
      tabIndex={0}
      // Provide an accessible name for columns with no visible label text
      aria-label={column.id === "color" ? "Color" : undefined}
      onContextMenu={(e) => onContextMenu(e, column.id)}
    >
      {column.id === "rowNumber" ? (
        <SelectAllButton allSelected={allSelected} onSelectAll={onSelectAll} />
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
  );
});

// ── Component ────────────────────────────────────────────────────────────────

export const TaskTableHeader = memo(function TaskTableHeader(): JSX.Element {
  const {
    tasks,
    selectedTaskIds,
    selectAllTasks,
    clearSelection,
    columnWidths,
    setColumnWidth,
    autoFitColumn,
  } = useTaskTableHeaderStore();
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
          <HeaderCell
            key={column.id}
            column={column}
            densityConfig={densityConfig}
            columnWidths={columnWidths}
            onContextMenu={handleHeaderContextMenu}
            setColumnWidth={setColumnWidth}
            autoFitColumn={autoFitColumn}
            // allSelected / onSelectAll only consumed by the rowNumber cell;
            // omitting them for all other columns keeps their props stable so
            // React.memo can skip re-renders when selection changes.
            {...(column.id === "rowNumber" && {
              allSelected,
              onSelectAll: handleSelectAllClick,
            })}
          />
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
