/**
 * TaskTableRow component.
 * Renders a task as a spreadsheet row with individual cells.
 * Supports hierarchy with SVAR-style indentation.
 *
 * Wrapped in React.memo — re-renders only when props change.
 * Store subscriptions are minimized: isSelected is derived from selectionPosition prop,
 * lastSelectedTaskId is read from getState() inside callbacks, and gridTemplateColumns
 * + visibleColumns are received as props from TaskTable.
 */

import { memo, useCallback, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../../types/chart.types";
import type { TaskId } from "../../types/branded.types";
import { useTaskStore } from "../../store/slices/taskSlice";
import type { ColumnDefinition } from "../../config/tableColumns";
import type {
  ClipboardPosition,
  SelectionPosition,
} from "../../hooks/useTaskRowData";
import { RowNumberCell } from "./RowNumberCell";
import { RowOverlays } from "./RowOverlays";
import { dragState } from "./dragSelectionState";
import { TaskDataCells } from "./TaskDataCells";
import { computeDisplayTask } from "../../utils/taskDisplayUtils";
import { useComputedTaskColor } from "../../hooks/useComputedTaskColor";
import { COLORS, Z_INDEX } from "../../styles/design-tokens";

// ── Constants ────────────────────────────────────────────────────────────────

/** brand-600 at ~8% opacity (hex 14 ≈ 8%) */
const SELECTION_BG_COLOR = `${COLORS.brand[600]}14`;

// ── Props ────────────────────────────────────────────────────────────────────

interface TaskTableRowProps {
  task: Task;
  globalRowNumber: number;
  level?: number;
  hasChildren?: boolean;
  visibleTaskIds: TaskId[];
  visibleColumns: ColumnDefinition[];
  gridTemplateColumns: string;
  hasHiddenAbove?: boolean;
  hiddenAboveCount?: number;
  onUnhideAbove?: () => void;
  hasHiddenBelow?: boolean;
  hiddenBelowCount?: number;
  onUnhideBelow?: () => void;
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
  hasHiddenAbove = false,
  hiddenAboveCount,
  onUnhideAbove,
  hasHiddenBelow = false,
  hiddenBelowCount,
  onUnhideBelow,
  onContextMenu,
  clipboardPosition,
  selectionPosition,
}: TaskTableRowProps): JSX.Element {
  // Only subscribe to tasks for summary rows (non-summary rows return null → stable ref)
  const tasks = useTaskStore((state) =>
    task.type === "summary" ? state.tasks : null
  );
  const toggleTaskSelection = useTaskStore(
    (state) => state.toggleTaskSelection
  );
  const setSelectedTaskIds = useTaskStore((state) => state.setSelectedTaskIds);
  const setActiveCell = useTaskStore((state) => state.setActiveCell);
  const insertTaskAbove = useTaskStore((state) => state.insertTaskAbove);
  const insertTaskBelow = useTaskStore((state) => state.insertTaskBelow);

  const computedColor = useComputedTaskColor(task);

  // Derived from props — no store subscription needed
  const isSelected = selectionPosition !== undefined;
  const isInClipboard = clipboardPosition !== undefined;

  // Calculate summary dates if needed, and recalculate duration for all tasks
  const displayTask = useMemo(
    () => computeDisplayTask(task, tasks),
    [task, tasks]
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    gridTemplateColumns,
  };

  // ── Stabilized callbacks ─────────────────────────────────────────────────

  const handleRowMouseEnter = useCallback((): void => {
    if (dragState.isDragging && dragState.onDragSelect) {
      dragState.onDragSelect(task.id);
    }
  }, [task.id]);

  const handleSelectRow = useCallback(
    (taskId: TaskId, shiftKey: boolean, ctrlKey: boolean): void => {
      setActiveCell(null, null);
      if (shiftKey) {
        // Read from store at call-time to avoid subscription
        const anchorTaskId =
          dragState.startTaskId || useTaskStore.getState().lastSelectedTaskId;
        if (anchorTaskId) {
          const startIdx = visibleTaskIds.indexOf(anchorTaskId);
          const endIdx = visibleTaskIds.indexOf(taskId);

          if (startIdx !== -1 && endIdx !== -1) {
            const minIdx = Math.min(startIdx, endIdx);
            const maxIdx = Math.max(startIdx, endIdx);
            const idsInRange = visibleTaskIds.slice(minIdx, maxIdx + 1);
            setSelectedTaskIds(idsInRange, false);
          }
        } else {
          setSelectedTaskIds([taskId], false);
        }
      } else if (ctrlKey) {
        toggleTaskSelection(taskId);
      } else {
        setSelectedTaskIds([taskId], false);
      }
    },
    [visibleTaskIds, setActiveCell, setSelectedTaskIds, toggleTaskSelection]
  );

  const handleInsertAbove = useCallback(
    () => insertTaskAbove(task.id),
    [insertTaskAbove, task.id]
  );

  const handleInsertBelow = useCallback(
    () => insertTaskBelow(task.id),
    [insertTaskBelow, task.id]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => onContextMenu(e, task.id),
    [onContextMenu, task.id]
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...(isSelected
          ? {
              backgroundColor: SELECTION_BG_COLOR,
              position: "relative",
              zIndex: Z_INDEX.rowHighlight,
            }
          : {}),
      }}
      className={`task-table-row col-span-full grid ${
        isSelected ? "" : "bg-white"
      } ${isInClipboard || isSelected ? "relative" : ""}`}
      role="row"
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
        hasHiddenAbove={hasHiddenAbove}
        hiddenAboveCount={hiddenAboveCount}
        onUnhideAbove={onUnhideAbove}
        hasHiddenBelow={hasHiddenBelow}
        hiddenBelowCount={hiddenBelowCount}
        onUnhideBelow={onUnhideBelow}
        onSelectRow={handleSelectRow}
        onInsertAbove={handleInsertAbove}
        onInsertBelow={handleInsertBelow}
        rowHeight="var(--density-row-height)"
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
