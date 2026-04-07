/**
 * TaskTableRow component.
 * Renders a task as a spreadsheet row with individual cells.
 * Supports hierarchy with SVAR-style indentation.
 *
 * Wrapped in React.memo — re-renders only when props change.
 * Store subscriptions are minimized: isSelected is derived from selectionPosition prop,
 * lastSelectedTaskId is read from getState() inside callbacks, and gridTemplateColumns
 * + visibleColumns are received as props from TaskTable.
 * Selection logic is encapsulated in useRowSelectionHandler.
 */

import { memo, useCallback, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types/chart.types";
import type { TaskId } from "@/types/branded.types";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useChartStore } from "@/store/slices/chartSlice";
import type { ColumnDefinition } from "@/config/tableColumns";
import type {
  ClipboardPosition,
  SelectionPosition,
} from "@/hooks/useTaskRowData";
import { computeDisplayTask } from "@/utils/taskDisplayUtils";
import { useComputedTaskColor } from "@/hooks/useComputedTaskColor";
import { TABLE_ROW, Z_INDEX } from "@/styles/design-tokens";
import { RowNumberCell } from "./RowNumberCell";
import { RowOverlays } from "./RowOverlays";
import { dragState } from "./dragSelectionState";
import { TaskDataCells } from "./TaskDataCells";
import { useRowSelectionHandler } from "./useRowSelectionHandler";

// ── Constants ────────────────────────────────────────────────────────────────

const DRAGGING_OPACITY = 0.5;
const DENSITY_ROW_HEIGHT_VAR = "var(--density-row-height)";

// ── Props ────────────────────────────────────────────────────────────────────

export interface TaskTableRowProps {
  task: Task;
  globalRowNumber: number;
  level?: number;
  hasChildren?: boolean;
  visibleTaskIds: TaskId[];
  visibleColumns: ColumnDefinition[];
  gridTemplateColumns: string;
  /** Hidden rows above this row — presence implies the indicator should show. */
  hiddenAbove?: { count: number; onUnhide: () => void };
  /** Hidden rows below this row — presence implies the indicator should show. */
  hiddenBelow?: { count: number; onUnhide: () => void };
  onContextMenu: (e: React.MouseEvent, taskId: TaskId) => void;
  clipboardPosition?: ClipboardPosition;
  selectionPosition?: SelectionPosition;
}

// ── Component ────────────────────────────────────────────────────────────────

export const TaskTableRow = memo(function TaskTableRow({
  task,
  globalRowNumber,
  level = 0,
  hasChildren = false,
  visibleTaskIds,
  visibleColumns,
  gridTemplateColumns,
  hiddenAbove,
  hiddenBelow,
  onContextMenu,
  clipboardPosition,
  selectionPosition,
}: TaskTableRowProps): JSX.Element {
  // Only subscribe to tasks for summary rows (non-summary rows return null → stable ref)
  const tasks = useTaskStore((state) =>
    task.type === "summary" ? state.tasks : null
  );
  const insertTaskAbove = useTaskStore((state) => state.insertTaskAbove);
  const insertTaskBelow = useTaskStore((state) => state.insertTaskBelow);

  // Working-days display context — when WD mode is on, duration in the table
  // is rendered as working days (computed at render time, not stored). See #81.
  const workingDaysMode = useChartStore((state) => state.workingDaysMode);
  const workingDaysConfig = useChartStore((state) => state.workingDaysConfig);
  const holidayRegion = useChartStore((state) => state.holidayRegion);

  const computedColor = useComputedTaskColor(task);
  const { handleSelectRow } = useRowSelectionHandler({ visibleTaskIds });

  // Derived from props — no store subscription needed
  const isSelected = selectionPosition !== undefined;
  const isInClipboard = clipboardPosition !== undefined;

  // Calculate summary dates if needed, and recalculate duration for all tasks
  const displayTask = useMemo(
    () =>
      computeDisplayTask(task, tasks, {
        mode: workingDaysMode,
        config: workingDaysConfig,
        region: holidayRegion,
      }),
    [task, tasks, workingDaysMode, workingDaysConfig, holidayRegion]
  );

  const isExpanded = task.open ?? true;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  // Inline style: combine dnd-kit transform, grid layout, and selection highlight.
  // `position: relative` is handled via Tailwind className below (covers both
  // isSelected and isInClipboard cases without duplication).
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? DRAGGING_OPACITY : 1,
    gridTemplateColumns,
    backgroundColor: isSelected ? TABLE_ROW.selectionBg : TABLE_ROW.defaultBg,
    ...(isSelected && { zIndex: Z_INDEX.rowHighlight }),
  };

  // ── Stabilized callbacks ─────────────────────────────────────────────────

  const handleRowMouseEnter = useCallback((): void => {
    if (dragState.isDragging && dragState.onDragSelect) {
      dragState.onDragSelect(task.id);
    }
  }, [task.id]);

  const handleInsertAbove = useCallback(
    (): void => insertTaskAbove(task.id),
    [insertTaskAbove, task.id]
  );

  const handleInsertBelow = useCallback(
    (): void => insertTaskBelow(task.id),
    [insertTaskBelow, task.id]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent): void => onContextMenu(e, task.id),
    [onContextMenu, task.id]
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "task-table-row col-span-full grid",
        (isInClipboard || isSelected) && "relative",
      ]
        .filter(Boolean)
        .join(" ")}
      role="row"
      aria-selected={isSelected}
      aria-rowindex={globalRowNumber}
      tabIndex={-1}
      onMouseEnter={handleRowMouseEnter}
      onContextMenu={handleContextMenu}
    >
      <RowOverlays
        selectionPosition={selectionPosition}
        clipboardPosition={clipboardPosition}
      />

      {/* Row Number Cell - Excel-style with hover controls */}
      <RowNumberCell
        rowNumber={globalRowNumber}
        taskId={task.id}
        isSelected={isSelected}
        selectionPosition={selectionPosition}
        hasHiddenAbove={hiddenAbove !== undefined}
        hiddenAboveCount={hiddenAbove?.count}
        onUnhideAbove={hiddenAbove?.onUnhide}
        hasHiddenBelow={hiddenBelow !== undefined}
        hiddenBelowCount={hiddenBelow?.count}
        onUnhideBelow={hiddenBelow?.onUnhide}
        onSelectRow={handleSelectRow}
        onInsertAbove={handleInsertAbove}
        onInsertBelow={handleInsertBelow}
        rowHeight={DENSITY_ROW_HEIGHT_VAR}
        dragAttributes={attributes}
        dragListeners={listeners}
        taskName={task.name}
      />

      {/* Data Cells */}
      <TaskDataCells
        task={task}
        displayTask={displayTask}
        visibleColumns={visibleColumns}
        level={level}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        computedColor={computedColor}
      />
    </div>
  );
});
