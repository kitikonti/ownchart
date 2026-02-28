/**
 * TaskTable container component.
 * Excel-like spreadsheet table for task management.
 * Supports hidden rows with Excel-style row number gaps and indicator lines.
 */

import { useCallback, useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { toTaskId } from "../../types/branded.types";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";
import { TaskTableRow } from "./TaskTableRow";
import { NewTaskPlaceholderRow } from "./NewTaskPlaceholderRow";
import {
  getDensityAwareWidth,
  getVisibleColumns,
} from "../../config/tableColumns";
import { useTableDimensions } from "../../hooks/useTableDimensions";
import { useAutoColumnWidth } from "../../hooks/useAutoColumnWidth";
import { useTaskTableRowContextMenu } from "../../hooks/useTaskTableRowContextMenu";
import { useHideOperations } from "../../hooks/useHideOperations";
import { useTaskRowData } from "../../hooks/useTaskRowData";
import { resetDragState } from "./dragSelectionState";
import { ContextMenu } from "../ContextMenu/ContextMenu";

// ── Sub-components ──────────────────────────────────────────────────────────

/** Status message shown when all tasks are hidden — includes a button to show all. */
function AllHiddenMessage({
  hiddenCount,
  rowHeight,
  onShowAll,
}: {
  hiddenCount: number;
  rowHeight: number;
  onShowAll: () => void;
}): JSX.Element {
  return (
    <div
      className="col-span-full flex items-center justify-center text-neutral-500 text-sm"
      style={{ height: rowHeight }}
      role="status"
    >
      {hiddenCount} row{hiddenCount !== 1 ? "s" : ""} hidden —{" "}
      <button
        className="hover:underline focus:underline ml-1 text-brand-600"
        aria-label={`Show all ${hiddenCount} hidden rows`}
        onClick={onShowAll}
      >
        show all
      </button>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────────────

export function TaskTable(): JSX.Element {
  const reorderTasks = useTaskStore((state) => state.reorderTasks);
  const columnWidths = useTaskStore((state) => state.columnWidths);
  const densityConfig = useDensityConfig();
  const hiddenColumns = useChartStore((state) => state.hiddenColumns);
  const hiddenTaskCount = useChartStore((state) => state.hiddenTaskIds.length);

  // Get visible columns based on settings
  const visibleColumns = useMemo(
    () => getVisibleColumns(hiddenColumns),
    [hiddenColumns]
  );

  // Get total column width for proper scrolling
  const { totalColumnWidth } = useTableDimensions();

  // Row data derivation (clipboard, selection, hidden-gap state)
  const { showAll, unhideRange } = useHideOperations();
  const { taskRowData, visibleTaskIds, flattenedTaskCount } =
    useTaskRowData(unhideRange);

  // Context menu with all row operations (Zone 1)
  const {
    contextMenu,
    contextMenuItems,
    handleRowContextMenu,
    closeContextMenu,
  } = useTaskTableRowContextMenu();

  // Auto-fit columns when density or task content changes
  useAutoColumnWidth();

  // Single mouseup listener for drag-selection cleanup (hoisted from RowNumberCell)
  useEffect(() => {
    const handleMouseUp = (): void => resetDragState();
    window.addEventListener("mouseup", handleMouseUp);
    return (): void => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent): void => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        reorderTasks(toTaskId(String(active.id)), toTaskId(String(over.id)));
      }
    },
    [reorderTasks]
  );

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

  return (
    <div className="task-table-container bg-white border-r border-neutral-200 select-none">
      {/* Table Content - no overflow here, handled by parent */}
      <div className="task-table-wrapper">
        <div
          className="task-table"
          style={{
            display: "grid",
            gridTemplateColumns,
            minWidth: totalColumnWidth,
          }}
          role="grid"
          aria-label="Task spreadsheet"
        >
          {/* Task Rows with Drag and Drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleTaskIds}
              strategy={verticalListSortingStrategy}
            >
              {taskRowData.map((row) => (
                <TaskTableRow
                  key={row.task.id}
                  task={row.task}
                  globalRowNumber={row.globalRowNumber}
                  level={row.level}
                  hasChildren={row.hasChildren}
                  visibleTaskIds={visibleTaskIds}
                  visibleColumns={visibleColumns}
                  gridTemplateColumns={gridTemplateColumns}
                  hasHiddenAbove={row.hasHiddenAbove}
                  hiddenAboveCount={row.hiddenAboveCount}
                  onUnhideAbove={row.onUnhideAbove}
                  hasHiddenBelow={row.hasHiddenBelow}
                  hiddenBelowCount={row.hiddenBelowCount}
                  onUnhideBelow={row.onUnhideBelow}
                  onContextMenu={handleRowContextMenu}
                  clipboardPosition={row.clipboardPosition}
                  selectionPosition={row.selectionPosition}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* All tasks hidden — show message with unhide action */}
          {flattenedTaskCount === 0 && hiddenTaskCount > 0 && (
            <AllHiddenMessage
              hiddenCount={hiddenTaskCount}
              rowHeight={densityConfig.rowHeight}
              onShowAll={showAll}
            />
          )}

          {/* Placeholder row for adding new tasks */}
          <NewTaskPlaceholderRow />
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && contextMenuItems.length > 0 && (
        <ContextMenu
          items={contextMenuItems}
          position={contextMenu.position}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}
