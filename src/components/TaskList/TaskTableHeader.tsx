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
} from "@/config/tableColumns";
import { useTableDimensions } from "@/hooks/useTableDimensions";
import { useTableHeaderContextMenu } from "@/hooks/useTableHeaderContextMenu";
import { ContextMenu } from "@/components/ContextMenu/ContextMenu";
import { TABLE_HEADER } from "@/styles/design-tokens";
import { ColumnResizer } from "./ColumnResizer";

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
  /** Only consumed when column.headerVariant === 'select-all'. */
  allSelected?: boolean;
  columnWidths: Record<string, number>;
  /** Only consumed when column.headerVariant === 'select-all'. */
  onSelectAll?: () => void;
  onContextMenu: (e: React.MouseEvent, columnId: string) => void;
  setColumnWidth: (id: string, width: number) => void;
  autoFitColumn: (id: string) => void;
}

// Stable noop used as default for onSelectAll when the cell is not rowNumber.
const noop = (): void => {};

/** Returns the content to render inside a header cell based on column headerVariant. */
function renderHeaderCellContent(
  column: ColumnDefinition,
  allSelected: boolean,
  onSelectAll: () => void
): JSX.Element | string | null {
  if (column.headerVariant === "select-all") {
    return (
      <SelectAllButton allSelected={allSelected} onSelectAll={onSelectAll} />
    );
  }
  if (column.headerVariant === "empty") {
    return null;
  }
  return column.label;
}

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
        // Resizable columns omit right padding — the resize handle fills that space
        column.resizable ? "pr-3" : "px-3",
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
      // 'select-all' cells: tabIndex=-1 because the inner SelectAllButton is the
      // interactive element and handles both its own action and keyboard context
      // menu (Shift+F10 fires on the focused element). Other cells: tabIndex=0
      // so the ContextMenu key reaches them for column header context menus.
      tabIndex={column.headerVariant === "select-all" ? -1 : 0}
      // Accessible name for columns with no visible label text (from column config)
      aria-label={column.headerAriaLabel}
      onContextMenu={(e) => onContextMenu(e, column.id)}
    >
      {renderHeaderCellContent(column, allSelected, onSelectAll)}
      {column.resizable && (
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
            // allSelected / onSelectAll only consumed by the 'select-all' variant;
            // omitting them for all other columns keeps their props stable so
            // React.memo can skip re-renders when selection changes.
            {...(column.headerVariant === "select-all" && {
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
