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

import { memo, useCallback, useMemo } from "react";
import type { Task } from "../../types/chart.types";
import type { ColumnDefinition } from "../../config/tableColumns";
import type { EditableField } from "../../types/task.types";
import type { HexColor } from "../../types/branded.types";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";
import { useIsCellEditing } from "../../hooks/useIsCellEditing";
import { getNextTaskType } from "../../utils/taskTypeUtils";
import { Cell } from "./Cell";
import { ColorCellEditor } from "./CellEditors/ColorCellEditor";
import { TaskTypeIcon } from "./TaskTypeIcon";

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

/** Column with a guaranteed field — narrows after filtering out non-data columns. */
type DataColumn = ColumnDefinition & { field: EditableField };

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

/**
 * Read-only field rendering matrix by task type:
 *
 *   Field       | task     | summary        | milestone
 *   ------------|----------|----------------|----------
 *   startDate   | editable | italic (auto)  | editable
 *   endDate     | editable | italic (auto)  | empty
 *   duration    | editable | italic (auto)  | empty
 *   progress    | editable | editable       | empty
 *   name, color | editable | editable       | editable
 *
 * "italic"  = read-only, shows computed value with italic styling
 * "empty"   = read-only, renders blank (field not applicable)
 * "editable" = default Cell rendering with inline editing
 */

/** CSS classes for read-only italic content in summary tasks */
const READONLY_CLASSES = "text-neutral-500 italic";

/** Type guard: narrows ColumnDefinition to DataColumn (has a field). */
function isDataColumn(col: ColumnDefinition): col is DataColumn {
  return col.field !== undefined;
}

/** Checks whether a field on a given task type should be rendered read-only (empty). */
function isReadOnlyEmpty(field: EditableField, type: Task["type"]): boolean {
  if (type === "milestone") {
    return field === "endDate" || field === "duration" || field === "progress";
  }
  return false;
}

/** Checks whether a field on a given task type should be rendered read-only with italic styling. */
function isReadOnlyItalic(field: EditableField, type: Task["type"]): boolean {
  if (type === "summary") {
    return field === "startDate" || field === "endDate" || field === "duration";
  }
  return false;
}

/**
 * Get the display value for a read-only italic cell.
 * Uses the column formatter when available for consistent display (e.g., "7 days" vs "1 day").
 */
function getReadOnlyDisplayValue(
  field: EditableField,
  displayTask: Task,
  column: ColumnDefinition
): string | null {
  if (field === "duration") {
    if (displayTask.duration <= 0) return null;
    return column.formatter
      ? column.formatter(displayTask.duration)
      : String(displayTask.duration);
  }
  // Only startDate and endDate reach this path (guarded by isReadOnlyItalic).
  // Uses formatter when available for consistency with duration handling.
  if (field === "startDate") {
    const value = displayTask.startDate;
    if (!value) return null;
    return column.formatter ? column.formatter(value) : value;
  }
  if (field === "endDate") {
    const value = displayTask.endDate;
    if (!value) return null;
    return column.formatter ? column.formatter(value) : value;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────

interface TaskDataCellsProps {
  task: Task;
  displayTask: Task;
  visibleColumns: ColumnDefinition[];
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  computedColor: HexColor;
}

export const TaskDataCells = memo(function TaskDataCells({
  task,
  displayTask,
  visibleColumns,
  level,
  hasChildren,
  isExpanded,
  computedColor,
}: TaskDataCellsProps): JSX.Element {
  const dataColumns = useMemo(
    () => visibleColumns.filter(isDataColumn),
    [visibleColumns]
  );

  return (
    <>
      {dataColumns.map((column) => {
        const { field } = column;

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
            />
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
            />
          );
        }

        // Read-only empty cell (milestone endDate/duration/progress)
        if (isReadOnlyEmpty(field, task.type)) {
          return (
            <Cell
              key={field}
              taskId={task.id}
              task={displayTask}
              field={field}
              column={column}
              readOnly
            >
              <span></span>
            </Cell>
          );
        }

        // Read-only italic cell (summary dates/duration)
        if (isReadOnlyItalic(field, task.type)) {
          const displayValue = getReadOnlyDisplayValue(
            field,
            displayTask,
            column
          );
          return (
            <Cell
              key={field}
              taskId={task.id}
              task={displayTask}
              field={field}
              column={column}
              readOnly
            >
              {displayValue ? (
                <span className={READONLY_CLASSES}>{displayValue}</span>
              ) : (
                <span></span>
              )}
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
    </>
  );
});

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
}

const NameCell = memo(function NameCell({
  task,
  displayTask,
  column,
  level,
  hasChildren,
  isExpanded,
}: NameCellProps): JSX.Element {
  const updateTask = useTaskStore((state) => state.updateTask);
  const toggleTaskCollapsed = useTaskStore(
    (state) => state.toggleTaskCollapsed
  );
  const densityConfig = useDensityConfig();

  const handleTypeClick = useCallback(() => {
    const nextType = getNextTaskType(task.type ?? "task", hasChildren);
    updateTask(task.id, { type: nextType });
  }, [task.id, task.type, hasChildren, updateTask]);

  const isEditing = useIsCellEditing(task.id, "name");

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
              isExpanded
                ? `Collapse ${displayTask.name}`
                : `Expand ${displayTask.name}`
            }
            aria-expanded={isExpanded}
          >
            {isExpanded ? "\u25BC" : "\u25B6"}
          </button>
        ) : (
          <div className="w-4 flex-shrink-0" aria-hidden="true" />
        )}

        {/* Task type icon - clickable to cycle through types */}
        <TaskTypeIcon type={task.type} onClick={handleTypeClick} />

        {/* Task name display — uses displayTask for consistency with Cell */}
        <span className="flex-1">{displayTask.name}</span>
      </div>
    </Cell>
  );
});

interface ColorCellProps {
  task: Task;
  displayTask: Task;
  column: ColumnDefinition;
  computedColor: HexColor;
}

const ColorCell = memo(function ColorCell({
  task,
  displayTask,
  column,
  computedColor,
}: ColorCellProps): JSX.Element {
  const updateTask = useTaskStore((state) => state.updateTask);
  const stopCellEdit = useTaskStore((state) => state.stopCellEdit);
  const colorModeState = useChartStore((state) => state.colorModeState);
  const densityConfig = useDensityConfig();

  const isEditing = useIsCellEditing(task.id, "color");

  /** Apply color change respecting the active color mode. */
  const handleColorChange = useCallback(
    (hex: HexColor) => {
      if (colorModeState.mode === "manual") {
        updateTask(task.id, { color: hex });
      } else if (colorModeState.mode === "summary" && task.type === "summary") {
        updateTask(task.id, { color: hex, colorOverride: undefined });
      } else {
        updateTask(task.id, { colorOverride: hex });
      }
    },
    [colorModeState.mode, task.id, task.type, updateTask]
  );

  /** Clear any manual override so the automatic color mode takes effect. */
  const handleResetOverride = useCallback(() => {
    updateTask(task.id, { colorOverride: undefined });
  }, [task.id, updateTask]);

  return (
    <Cell taskId={task.id} task={displayTask} field="color" column={column}>
      <div className="flex items-center justify-center w-full h-full">
        {isEditing ? (
          <ColorCellEditor
            value={displayTask.color}
            computedColor={computedColor}
            colorMode={colorModeState.mode}
            hasOverride={!!task.colorOverride}
            onChange={handleColorChange}
            onResetOverride={handleResetOverride}
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
});
