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
import { Cell } from "./Cell";
import { ColorCellEditor } from "./CellEditors/ColorCellEditor";
import { RowNumberCell, dragState } from "./RowNumberCell";
import {
  getDensityAwareWidth,
  getVisibleColumns,
} from "../../config/tableColumns";
import { useCellNavigation } from "../../hooks/useCellNavigation";
import { TaskTypeIcon } from "./TaskTypeIcon";
import { calculateSummaryDates } from "../../utils/hierarchy";
import { useComputedTaskColor } from "../../hooks/useComputedTaskColor";

interface TaskTableRowProps {
  task: Task;
  globalRowNumber: number; // 1-based position in full (non-hidden-filtered) list for Excel-style display
  level?: number; // Nesting level (0 = root)
  hasChildren?: boolean; // Whether task has children
  visibleTaskIds: string[]; // Array of task IDs in visible order (for range selection)
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
  clipboardPosition,
  selectionPosition,
}: TaskTableRowProps): JSX.Element {
  const tasks = useTaskStore((state) => state.tasks);
  const updateTask = useTaskStore((state) => state.updateTask);
  const toggleTaskCollapsed = useTaskStore(
    (state) => state.toggleTaskCollapsed
  );
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
  const { isCellEditing, stopCellEdit } = useCellNavigation();
  const densityConfig = useDensityConfig();
  const hiddenColumns = useChartStore((state) => state.hiddenColumns);
  const colorModeState = useChartStore((state) => state.colorModeState);

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
  // Uses visibleColumns for show/hide progress column (Sprint 1.5.9)
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
  const SELECTION_BORDER_COLOR = "#0F6CBD"; // OwnChart brand
  const SELECTION_BG_COLOR = "rgba(15, 108, 189, 0.08)"; // OwnChart brand light

  // Determine selection borders based on position in contiguous selection
  const showTopBorder = selectionPosition?.isFirstSelected ?? true;
  const showBottomBorder = selectionPosition?.isLastSelected ?? true;

  // Handle mouse enter on entire row for drag selection
  const handleRowMouseEnter = (): void => {
    if (dragState.isDragging && dragState.onDragSelect) {
      dragState.onDragSelect(task.id);
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
        onSelectRow={(taskId, shiftKey, ctrlKey) => {
          setActiveCell(null, null);
          if (shiftKey) {
            // Shift+Click or Drag: Range selection using VISIBLE task order
            // During drag, use dragState.startTaskId as anchor; otherwise use lastSelectedTaskId
            const anchorTaskId = dragState.startTaskId || lastSelectedTaskId;
            if (anchorTaskId) {
              // Find indices in the VISIBLE task list, not the raw tasks array
              const startIdx = visibleTaskIds.indexOf(anchorTaskId);
              const endIdx = visibleTaskIds.indexOf(taskId);

              if (startIdx !== -1 && endIdx !== -1) {
                const minIdx = Math.min(startIdx, endIdx);
                const maxIdx = Math.max(startIdx, endIdx);
                const idsInRange = visibleTaskIds.slice(minIdx, maxIdx + 1);
                setSelectedTaskIds(idsInRange, false);
              }
            } else {
              // No anchor yet (first interaction) — just select this row
              setSelectedTaskIds([taskId], false);
            }
          } else if (ctrlKey) {
            // Ctrl+Click: Toggle (add/remove from selection)
            toggleTaskSelection(taskId);
          } else {
            // Normal click: Replace selection with just this row
            setSelectedTaskIds([taskId], false);
          }
        }}
        onInsertAbove={() => insertTaskAbove(task.id)}
        onInsertBelow={() => insertTaskBelow(task.id)}
        rowHeight="var(--density-row-height)"
        dragAttributes={attributes}
        dragListeners={listeners}
        taskName={task.name}
      />

      {/* Data Cells - uses visibleColumns for show/hide progress column (Sprint 1.5.9) */}
      {visibleColumns
        .filter((col) => col.field)
        .map((column) => {
          const field = column.field!;

          // Special handling for name field with hierarchy
          if (field === "name") {
            const isEditing = isCellEditing(task.id, field);

            // In edit mode: no custom children, let Cell handle everything
            if (isEditing) {
              return (
                <Cell
                  key={field}
                  taskId={task.id}
                  task={displayTask}
                  field={field}
                  column={column}
                />
              );
            }

            // In view mode: custom children with hierarchy elements
            return (
              <Cell
                key={field}
                taskId={task.id}
                task={displayTask}
                field={field}
                column={column}
              >
                <div
                  className="flex items-center gap-1"
                  style={{
                    paddingLeft: `${level * densityConfig.indentSize}px`,
                  }}
                >
                  {/* Expand/collapse button for summary tasks with children only */}
                  {hasChildren && task.type === "summary" ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskCollapsed(task.id);
                      }}
                      className="w-4 h-4 flex items-center justify-center hover:bg-neutral-200 rounded text-neutral-600 flex-shrink-0"
                      aria-label={
                        isExpanded
                          ? `Collapse ${task.name}`
                          : `Expand ${task.name}`
                      }
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? "▼" : "▶"}
                    </button>
                  ) : (
                    <div className="w-4 flex-shrink-0" aria-hidden="true" />
                  )}

                  {/* Task type icon - clickable to cycle through types */}
                  <TaskTypeIcon
                    type={task.type}
                    onClick={() => {
                      const currentType = task.type || "task";
                      let nextType: Task["type"];

                      if (hasChildren) {
                        // When task has children, only allow task ↔ summary (skip milestone)
                        nextType = currentType === "task" ? "summary" : "task";
                      } else {
                        // When no children, cycle through all types
                        nextType =
                          currentType === "task"
                            ? "summary"
                            : currentType === "summary"
                              ? "milestone"
                              : "task";
                      }

                      updateTask(task.id, { type: nextType });
                    }}
                  />

                  {/* Task name display */}
                  <span className="flex-1">{task.name}</span>
                </div>
              </Cell>
            );
          }

          // Special handling for dates in summary tasks (read-only)
          if (
            (field === "startDate" || field === "endDate") &&
            task.type === "summary"
          ) {
            return (
              <Cell
                key={field}
                taskId={task.id}
                task={displayTask}
                field={field}
                column={column}
              >
                {displayTask[field] ? (
                  <span className="text-neutral-500 italic">
                    {displayTask[field]}
                  </span>
                ) : (
                  <span></span>
                )}
              </Cell>
            );
          }

          // Special handling for end date in milestone tasks (read-only, empty)
          if (field === "endDate" && task.type === "milestone") {
            return (
              <Cell
                key={field}
                taskId={task.id}
                task={displayTask}
                field={field}
                column={column}
              >
                <span></span>
              </Cell>
            );
          }

          // Special handling for duration in summary and milestone tasks (read-only)
          if (
            field === "duration" &&
            (task.type === "summary" || task.type === "milestone")
          ) {
            return (
              <Cell
                key={field}
                taskId={task.id}
                task={displayTask}
                field={field}
                column={column}
              >
                {task.type === "summary" && displayTask.duration > 0 ? (
                  <span className="text-neutral-500 italic">
                    {displayTask.duration} days
                  </span>
                ) : (
                  <span></span>
                )}
              </Cell>
            );
          }

          // Special handling for progress in milestone tasks (read-only, empty)
          if (field === "progress" && task.type === "milestone") {
            return (
              <Cell
                key={field}
                taskId={task.id}
                task={displayTask}
                field={field}
                column={column}
              >
                <span></span>
              </Cell>
            );
          }

          // Special handling for color field with color picker
          // Uses computed color for display (respects color mode)
          if (field === "color") {
            const isEditing = isCellEditing(task.id, field);

            return (
              <Cell
                key={field}
                taskId={task.id}
                task={displayTask}
                field={field}
                column={column}
              >
                <div className="flex items-center justify-center w-full h-full">
                  {isEditing ? (
                    <ColorCellEditor
                      value={displayTask.color}
                      computedColor={computedColor}
                      colorMode={colorModeState.mode}
                      hasOverride={!!task.colorOverride}
                      onChange={(value) => {
                        if (colorModeState.mode === "manual") {
                          updateTask(task.id, { color: value });
                        } else if (
                          colorModeState.mode === "summary" &&
                          task.type === "summary"
                        ) {
                          updateTask(task.id, {
                            color: value,
                            colorOverride: undefined,
                          });
                        } else {
                          updateTask(task.id, { colorOverride: value });
                        }
                      }}
                      onResetOverride={() =>
                        updateTask(task.id, {
                          colorOverride: undefined,
                        })
                      }
                      onSave={stopCellEdit}
                      onCancel={stopCellEdit}
                      height={densityConfig.colorBarHeight}
                    />
                  ) : (
                    <div
                      className="w-1.5 rounded"
                      style={{
                        backgroundColor: computedColor,
                        height: densityConfig.colorBarHeight,
                      }}
                    />
                  )}
                </div>
              </Cell>
            );
          }

          // Default cell rendering
          return (
            <Cell
              key={field}
              taskId={task.id}
              task={displayTask}
              field={field}
              column={column}
            />
          );
        })}
    </div>
  );
}
