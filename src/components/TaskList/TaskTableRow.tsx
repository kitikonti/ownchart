/**
 * TaskTableRow component.
 * Renders a task as a spreadsheet row with individual cells.
 * Supports hierarchy with SVAR-style indentation.
 */

import { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../../types/chart.types";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";
import { RowNumberCell, dragState } from "./RowNumberCell";
import { TaskDataCells } from "./TaskDataCells";
import {
  getDensityAwareWidth,
  getVisibleColumns,
} from "../../config/tableColumns";
import { calculateSummaryDates } from "../../utils/hierarchy";
import { useComputedTaskColor } from "../../hooks/useComputedTaskColor";
import { COLORS } from "../../styles/design-tokens";

interface TaskTableRowProps {
  task: Task;
  globalRowNumber: number; // 1-based position in full (non-hidden-filtered) list for Excel-style display
  level?: number; // Nesting level (0 = root)
  hasChildren?: boolean; // Whether task has children
  visibleTaskIds: string[]; // Array of task IDs in visible order (for range selection)
  hasHiddenBelow?: boolean; // Hidden rows below (double-line on RowNumberCell bottom)
  hiddenBelowCount?: number; // Number of hidden rows below (for tooltip)
  onUnhideBelow?: () => void; // Callback to unhide hidden rows below
  clipboardPosition?: {
    isFirst: boolean; // First in clipboard group (show top border)
    isLast: boolean; // Last in clipboard group (show bottom border)
  };
  selectionPosition?: {
    isFirstSelected: boolean; // First in contiguous selection (show top border)
    isLastSelected: boolean; // Last in contiguous selection (show bottom border)
  };
}

export function TaskTableRow({
  task,
  globalRowNumber,
  level = 0,
  hasChildren = false,
  visibleTaskIds,
  hasHiddenBelow = false,
  hiddenBelowCount,
  onUnhideBelow,
  clipboardPosition,
  selectionPosition,
}: TaskTableRowProps): JSX.Element {
  const tasks = useTaskStore((state) => state.tasks);
  const columnWidths = useTaskStore((state) => state.columnWidths);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const lastSelectedTaskId = useTaskStore((state) => state.lastSelectedTaskId);
  const toggleTaskSelection = useTaskStore(
    (state) => state.toggleTaskSelection
  );
  const setSelectedTaskIds = useTaskStore((state) => state.setSelectedTaskIds);
  const setActiveCell = useTaskStore((state) => state.setActiveCell);
  const insertTaskAbove = useTaskStore((state) => state.insertTaskAbove);
  const insertTaskBelow = useTaskStore((state) => state.insertTaskBelow);
  const densityConfig = useDensityConfig();
  const hiddenColumns = useChartStore((state) => state.hiddenColumns);

  // Get computed task color based on current color mode
  const computedColor = useComputedTaskColor(task);

  // Get visible columns based on settings
  const visibleColumns = useMemo(
    () => getVisibleColumns(hiddenColumns),
    [hiddenColumns]
  );

  const isSelected = selectedTaskIds.includes(task.id);
  const isInClipboard = clipboardPosition !== undefined;

  // Calculate summary dates if needed, and recalculate duration for all tasks
  const displayTask = useMemo(() => {
    let updatedTask = { ...task };

    if (task.type === "summary") {
      const summaryDates = calculateSummaryDates(tasks, task.id);
      if (summaryDates) {
        updatedTask = { ...task, ...summaryDates };
      } else {
        // Summary has no children - clear date fields
        updatedTask = { ...task, startDate: "", endDate: "", duration: 0 };
      }
    } else if (task.startDate && task.endDate) {
      // Recalculate duration from dates to ensure consistency
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      const calculatedDuration =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;
      updatedTask = { ...task, duration: calculatedDuration };
    }

    return updatedTask;
  }, [task, tasks]);

  const isExpanded = task.open ?? true;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  // Generate grid template columns with density-aware widths
  const gridTemplateColumns = visibleColumns
    .map((col) => {
      const customWidth = columnWidths[col.id];
      return customWidth
        ? `${customWidth}px`
        : getDensityAwareWidth(col.id, densityConfig);
    })
    .join(" ");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    gridTemplateColumns,
  };

  // OwnChart brand colors for selected row
  const SELECTION_BORDER_COLOR = COLORS.brand[600];
  const SELECTION_BG_COLOR = `${COLORS.brand[600]}14`; // brand-600 at ~8% opacity

  // Determine selection borders based on position in contiguous selection
  const showTopBorder = selectionPosition?.isFirstSelected ?? true;
  const showBottomBorder = selectionPosition?.isLastSelected ?? true;

  // Handle mouse enter on entire row for drag selection
  const handleRowMouseEnter = (): void => {
    if (dragState.isDragging && dragState.onDragSelect) {
      dragState.onDragSelect(task.id);
    }
  };

  // Handle row selection via RowNumberCell
  const handleSelectRow = (
    taskId: string,
    shiftKey: boolean,
    ctrlKey: boolean
  ): void => {
    setActiveCell(null, null);
    if (shiftKey) {
      // Shift+Click or Drag: Range selection using VISIBLE task order
      const anchorTaskId = dragState.startTaskId || lastSelectedTaskId;
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
        // No anchor yet — just select this row
        setSelectedTaskIds([taskId], false);
      }
    } else if (ctrlKey) {
      toggleTaskSelection(taskId);
    } else {
      setSelectedTaskIds([taskId], false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...(isSelected
          ? {
              backgroundColor: SELECTION_BG_COLOR,
              position: "relative",
              zIndex: 5,
            }
          : {}),
      }}
      className={`task-table-row col-span-full grid ${
        isSelected ? "" : "bg-white"
      } ${isInClipboard || isSelected ? "relative" : ""}`}
      role="row"
      tabIndex={-1}
      onMouseEnter={handleRowMouseEnter}
    >
      {/* Selection overlay - renders above cell borders */}
      {isSelected && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderTop: showTopBorder
              ? `2px solid ${SELECTION_BORDER_COLOR}`
              : "none",
            borderBottom: showBottomBorder
              ? `2px solid ${SELECTION_BORDER_COLOR}`
              : "none",
            borderLeft: `2px solid ${SELECTION_BORDER_COLOR}`,
            borderRadius: `${showTopBorder ? "3px" : "0"} 0 0 ${showBottomBorder ? "3px" : "0"}`,
            zIndex: 25,
          }}
        />
      )}
      {/* Clipboard selection overlay with dotted border */}
      {isInClipboard && clipboardPosition && (
        <div
          className="absolute inset-0 pointer-events-none z-20 border-2 border-dotted border-neutral-500"
          style={{
            borderTopStyle: clipboardPosition.isFirst ? "dotted" : "none",
            borderBottomStyle: clipboardPosition.isLast ? "dotted" : "none",
          }}
        />
      )}
      {/* Row Number Cell - Excel-style with hover controls */}
      <RowNumberCell
        rowNumber={globalRowNumber}
        taskId={task.id}
        isSelected={isSelected}
        selectionPosition={selectionPosition}
        hasHiddenBelow={hasHiddenBelow}
        hiddenBelowCount={hiddenBelowCount}
        onUnhideBelow={onUnhideBelow}
        onSelectRow={handleSelectRow}
        onInsertAbove={() => insertTaskAbove(task.id)}
        onInsertBelow={() => insertTaskBelow(task.id)}
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
}
