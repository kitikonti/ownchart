/**
 * TaskTableRow component.
 * Renders a task as a spreadsheet row with individual cells.
 * Supports hierarchy with SVAR-style indentation.
 */

import { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVertical } from "@phosphor-icons/react";
import type { Task } from "../../types/chart.types";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";
import { Cell } from "./Cell";
import { ColorCellEditor } from "./CellEditors/ColorCellEditor";
import {
  getDensityAwareWidth,
  getVisibleColumns,
} from "../../config/tableColumns";
import { useCellNavigation } from "../../hooks/useCellNavigation";
import { TaskTypeIcon } from "./TaskTypeIcon";
import { calculateSummaryDates } from "../../utils/hierarchy";

interface TaskTableRowProps {
  task: Task;
  level?: number; // Nesting level (0 = root)
  hasChildren?: boolean; // Whether task has children
  clipboardPosition?: {
    isFirst: boolean; // First in clipboard group (show top border)
    isLast: boolean; // Last in clipboard group (show bottom border)
  };
}

export function TaskTableRow({
  task,
  level = 0,
  hasChildren = false,
  clipboardPosition,
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
  const selectTaskRange = useTaskStore((state) => state.selectTaskRange);
  const setActiveCell = useTaskStore((state) => state.setActiveCell);
  const { isCellEditing, stopCellEdit } = useCellNavigation();
  const densityConfig = useDensityConfig();
  const showProgress = useChartStore((state) => state.showProgress);

  // Get visible columns based on settings (Sprint 1.5.9)
  const visibleColumns = useMemo(
    () => getVisibleColumns(showProgress),
    [showProgress]
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-table-row col-span-full grid ${
        isSelected ? "bg-neutral-100" : "bg-white"
      } ${isInClipboard ? "relative" : ""}`}
      role="row"
    >
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
      {/* Drag Handle Cell */}
      <div
        className="drag-handle-cell flex items-center justify-center border-b border-r border-neutral-200 bg-neutral-50 cursor-grab active:cursor-grabbing"
        style={{
          height: "var(--density-row-height)",
          padding: `var(--density-cell-padding-y) var(--density-cell-padding-x)`,
        }}
        {...attributes}
        {...listeners}
        role="gridcell"
        aria-label={`Drag to reorder task ${task.name}`}
      >
        <DotsSixVertical
          size={densityConfig.iconSize}
          weight="bold"
          className="text-neutral-500"
          aria-hidden="true"
        />
      </div>

      {/* Checkbox Cell */}
      <div
        className="checkbox-cell flex items-center justify-center border-b border-r border-neutral-200"
        style={{
          height: "var(--density-row-height)",
          padding: `var(--density-cell-padding-y) var(--density-cell-padding-x)`,
        }}
        role="gridcell"
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            const nativeEvent = e.nativeEvent as MouseEvent;

            // Deactivate any active cell when selecting tasks via checkbox
            setActiveCell(null, null);

            if (nativeEvent.shiftKey && lastSelectedTaskId) {
              selectTaskRange(lastSelectedTaskId, task.id);
            } else {
              toggleTaskSelection(task.id);
            }
          }}
          className="cursor-pointer"
          style={{
            transform: `scale(${densityConfig.checkboxSize / 16})`,
          }}
          aria-label={`Select task ${task.name}`}
        />
      </div>

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
                      className="w-4 h-4 flex items-center justify-center hover:bg-neutral-200 rounded text-neutral-600 flex-shrink-0 focus:outline-none focus-visible:outline-2 focus-visible:outline-blue-700"
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
                      onChange={(value) =>
                        updateTask(task.id, { color: value })
                      }
                      onSave={stopCellEdit}
                      onCancel={stopCellEdit}
                      height={densityConfig.colorBarHeight}
                    />
                  ) : (
                    <div
                      className="w-1.5 rounded"
                      style={{
                        backgroundColor: displayTask.color,
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
