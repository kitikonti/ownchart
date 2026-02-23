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
import { useFlattenedTasks } from "../../hooks/useFlattenedTasks";
import { useAutoColumnWidth } from "../../hooks/useAutoColumnWidth";
import { useTaskTableRowContextMenu } from "../../hooks/useTaskTableRowContextMenu";
import { useHideOperations } from "../../hooks/useHideOperations";
import { resetDragState } from "./dragSelectionState";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import { COLORS } from "../../styles/design-tokens";
import type { FlattenedTask } from "../../utils/hierarchy";

// ── Helper functions for taskRowData computation ────────────────────────────

export interface ClipboardPosition {
  isFirst: boolean;
  isLast: boolean;
}

export interface SelectionPosition {
  isFirstSelected: boolean;
  isLastSelected: boolean;
}

export function getClipboardPosition(
  taskId: string,
  prevTaskId: string | undefined,
  nextTaskId: string | undefined,
  clipboardSet: Set<string>
): ClipboardPosition | undefined {
  if (!clipboardSet.has(taskId)) return undefined;
  return {
    isFirst: !prevTaskId || !clipboardSet.has(prevTaskId),
    isLast: !nextTaskId || !clipboardSet.has(nextTaskId),
  };
}

export function getSelectionPosition(
  taskId: string,
  prevTaskId: string | undefined,
  nextTaskId: string | undefined,
  selectedSet: Set<string>
): SelectionPosition | undefined {
  if (!selectedSet.has(taskId)) return undefined;
  return {
    isFirstSelected: !prevTaskId || !selectedSet.has(prevTaskId),
    isLastSelected: !nextTaskId || !selectedSet.has(nextTaskId),
  };
}

export function getHiddenGap(
  globalRowNumber: number,
  nextGlobalRowNumber: number
): { hasHiddenBelow: boolean; hiddenBelowCount: number } {
  const gap = nextGlobalRowNumber - globalRowNumber - 1;
  return {
    hasHiddenBelow: gap > 0,
    hiddenBelowCount: gap > 0 ? gap : 0,
  };
}

// ── Component ───────────────────────────────────────────────────────────────

export function TaskTable(): JSX.Element {
  const reorderTasks = useTaskStore((state) => state.reorderTasks);
  const columnWidths = useTaskStore((state) => state.columnWidths);
  const clipboardTaskIds = useTaskStore((state) => state.clipboardTaskIds);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
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

  // Build flattened list respecting collapsed state (centralized in hook)
  const { flattenedTasks, allFlattenedTasks } = useFlattenedTasks();

  // Context menu with all row operations (Zone 1)
  const {
    contextMenu,
    contextMenuItems,
    handleRowContextMenu,
    closeContextMenu,
  } = useTaskTableRowContextMenu();

  // Emergency "show all" + unhide range for gap indicators
  const { showAll, unhideRange } = useHideOperations();

  // Extract visible task IDs in display order (for correct range selection)
  const visibleTaskIds = useMemo(
    () => flattenedTasks.map(({ task }) => task.id),
    [flattenedTasks]
  );

  // Auto-fit columns when density or task content changes
  useAutoColumnWidth();

  // Single mouseup listener for drag-selection cleanup (hoisted from RowNumberCell)
  useEffect(() => {
    const handleMouseUp = (): void => resetDragState();
    window.addEventListener("mouseup", handleMouseUp);
    return (): void => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  // Build sets for quick lookup
  const clipboardSet = useMemo(
    () => new Set(clipboardTaskIds),
    [clipboardTaskIds]
  );
  const selectedSet = useMemo(
    () => new Set(selectedTaskIds),
    [selectedTaskIds]
  );

  // Prepare derived props for each task row (clipboard/selection/hidden state)
  // onUnhideBelow callbacks are created here so they're stable across renders
  const taskRowData = useMemo(
    () =>
      flattenedTasks.map(
        (
          { task, level, hasChildren, globalRowNumber }: FlattenedTask,
          index: number
        ) => {
          const prevTaskId =
            index > 0 ? flattenedTasks[index - 1].task.id : undefined;
          const nextTask: FlattenedTask | undefined = flattenedTasks[index + 1];
          const nextTaskId = nextTask?.task.id;

          const nextRowNum = nextTask
            ? nextTask.globalRowNumber
            : allFlattenedTasks.length + 1;
          const { hasHiddenBelow, hiddenBelowCount } = getHiddenGap(
            globalRowNumber,
            nextRowNum
          );

          return {
            task,
            level,
            hasChildren,
            globalRowNumber,
            hasHiddenBelow,
            hiddenBelowCount,
            onUnhideBelow: hasHiddenBelow
              ? (): void => unhideRange(globalRowNumber, nextRowNum)
              : undefined,
            clipboardPosition: getClipboardPosition(
              task.id,
              prevTaskId,
              nextTaskId,
              clipboardSet
            ),
            selectionPosition: getSelectionPosition(
              task.id,
              prevTaskId,
              nextTaskId,
              selectedSet
            ),
          };
        }
      ),
    [flattenedTasks, clipboardSet, selectedSet, allFlattenedTasks, unhideRange]
  );

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
        reorderTasks(String(active.id), String(over.id));
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
          {flattenedTasks.length === 0 && hiddenTaskCount > 0 && (
            <div
              className="col-span-full flex items-center justify-center text-neutral-500 text-sm"
              style={{ height: densityConfig.rowHeight }}
            >
              {hiddenTaskCount} row{hiddenTaskCount !== 1 ? "s" : ""} hidden —{" "}
              <button
                className="hover:underline ml-1"
                style={{ color: COLORS.brand[600] }}
                onClick={showAll}
              >
                show all
              </button>
            </div>
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
