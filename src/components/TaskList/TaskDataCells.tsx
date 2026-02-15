/**
 * TaskDataCells - Renders the data cells for a task table row.
 *
 * Handles special cell rendering for:
 * - Name field with hierarchy (indent, expand/collapse, type icon)
 * - Summary task dates/duration (read-only, italic)
 * - Milestone end date/duration/progress (read-only, empty)
 * - Color field with color picker (mode-aware)
 * - Default cells
 *
 * Returns a Fragment so cells remain direct children of the CSS Grid parent.
 */

import type { Task } from "../../types/chart.types";
import type { ColumnDefinition } from "../../config/tableColumns";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";
import { useCellNavigation } from "../../hooks/useCellNavigation";
import { Cell } from "./Cell";
import { ColorCellEditor } from "./CellEditors/ColorCellEditor";
import { TaskTypeIcon } from "./TaskTypeIcon";

interface TaskDataCellsProps {
  task: Task;
  displayTask: Task;
  visibleColumns: ColumnDefinition[];
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  computedColor: string;
}

export function TaskDataCells({
  task,
  displayTask,
  visibleColumns,
  level,
  hasChildren,
  isExpanded,
  computedColor,
}: TaskDataCellsProps): JSX.Element {
  const { isCellEditing } = useCellNavigation();

  return (
    <>
      {visibleColumns
        .filter((col) => col.field)
        .map((column) => {
          const field = column.field!;

          // Special handling for name field with hierarchy
          if (field === "name") {
            return (
              <NameCell
                key={field}
                task={task}
                displayTask={displayTask}
                column={column}
                level={level}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                isEditing={isCellEditing(task.id, field)}
              />
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
                {displayTask[field as keyof Task] ? (
                  <span className="text-neutral-500 italic">
                    {String(displayTask[field as keyof Task])}
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
            return (
              <ColorCell
                key={field}
                task={task}
                displayTask={displayTask}
                column={column}
                computedColor={computedColor}
                isEditing={isCellEditing(task.id, field)}
              />
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
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Specialized Cell Components
// ─────────────────────────────────────────────────────────────────────────

interface NameCellProps {
  task: Task;
  displayTask: Task;
  column: ColumnDefinition;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isEditing: boolean;
}

function NameCell({
  task,
  displayTask,
  column,
  level,
  hasChildren,
  isExpanded,
  isEditing,
}: NameCellProps): JSX.Element {
  const updateTask = useTaskStore((state) => state.updateTask);
  const toggleTaskCollapsed = useTaskStore(
    (state) => state.toggleTaskCollapsed
  );
  const densityConfig = useDensityConfig();

  // In edit mode: no custom children, let Cell handle everything
  if (isEditing) {
    return (
      <Cell taskId={task.id} task={displayTask} field="name" column={column} />
    );
  }

  // In view mode: custom children with hierarchy elements
  return (
    <Cell taskId={task.id} task={displayTask} field="name" column={column}>
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
              isExpanded ? `Collapse ${task.name}` : `Expand ${task.name}`
            }
            aria-expanded={isExpanded}
          >
            {isExpanded ? "\u25BC" : "\u25B6"}
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
              nextType = currentType === "task" ? "summary" : "task";
            } else {
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

interface ColorCellProps {
  task: Task;
  displayTask: Task;
  column: ColumnDefinition;
  computedColor: string;
  isEditing: boolean;
}

function ColorCell({
  task,
  displayTask,
  column,
  computedColor,
  isEditing,
}: ColorCellProps): JSX.Element {
  const updateTask = useTaskStore((state) => state.updateTask);
  const colorModeState = useChartStore((state) => state.colorModeState);
  const densityConfig = useDensityConfig();
  const { stopCellEdit } = useCellNavigation();

  return (
    <Cell taskId={task.id} task={displayTask} field="color" column={column}>
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
