/**
 * TaskTableRow component.
 * Renders a task as a spreadsheet row with individual cells.
 * Supports hierarchy with SVAR-style indentation.
 */

import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash, DotsSixVertical } from '@phosphor-icons/react';
import type { Task } from '../../types/chart.types';
import { useTaskStore } from '../../store/slices/taskSlice';
import { Cell } from './Cell';
import { ColorCellEditor } from './CellEditors/ColorCellEditor';
import { TASK_COLUMNS } from '../../config/tableColumns';
import { useCellNavigation } from '../../hooks/useCellNavigation';
import { TaskTypeIcon } from './TaskTypeIcon';
import { calculateSummaryDates } from '../../utils/hierarchy';

const INDENT_SIZE = 20; // pixels per level

interface TaskTableRowProps {
  task: Task;
  level?: number; // Nesting level (0 = root)
  hasChildren?: boolean; // Whether task has children
}

export function TaskTableRow({
  task,
  level = 0,
  hasChildren = false,
}: TaskTableRowProps): JSX.Element {
  const tasks = useTaskStore((state) => state.tasks);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const moveTaskToParent = useTaskStore((state) => state.moveTaskToParent);
  const toggleTaskCollapsed = useTaskStore((state) => state.toggleTaskCollapsed);
  const columnWidths = useTaskStore((state) => state.columnWidths);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const lastSelectedTaskId = useTaskStore((state) => state.lastSelectedTaskId);
  const toggleTaskSelection = useTaskStore((state) => state.toggleTaskSelection);
  const selectTaskRange = useTaskStore((state) => state.selectTaskRange);
  const setActiveCell = useTaskStore((state) => state.setActiveCell);
  const { isCellEditing, stopCellEdit } = useCellNavigation();

  const isSelected = selectedTaskIds.includes(task.id);

  // Calculate summary dates if needed, and recalculate duration for all tasks
  const displayTask = useMemo(() => {
    let updatedTask = { ...task };

    if (task.type === 'summary') {
      const summaryDates = calculateSummaryDates(tasks, task.id);
      if (summaryDates) {
        updatedTask = { ...task, ...summaryDates };
      } else {
        // Summary has no children - clear date fields
        updatedTask = { ...task, startDate: '', endDate: '', duration: 0 };
      }
    } else if (task.startDate && task.endDate) {
      // Recalculate duration from dates to ensure consistency
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      const calculatedDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
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

  // Generate grid template columns
  const gridTemplateColumns = TASK_COLUMNS.map((col) => {
    const customWidth = columnWidths[col.id];
    return customWidth ? `${customWidth}px` : col.defaultWidth;
  }).join(' ');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    gridTemplateColumns,
  };

  const handleDelete = () => {
    // Count all children recursively
    const countChildren = (parentId: string): number => {
      let count = 0;
      tasks.forEach((t) => {
        if (t.parent === parentId) {
          count += 1 + countChildren(t.id); // Count this child + its children
        }
      });
      return count;
    };

    const childCount = countChildren(task.id);

    if (childCount > 0) {
      // Task has children - show enhanced dialog
      const deleteAll = window.confirm(
        `Delete task "${task.name}" and ${childCount} child task${childCount > 1 ? 's' : ''}?\n\n` +
          `Click OK to delete all (cascading delete).\n` +
          `Click Cancel to keep children and only delete "${task.name}".`
      );

      if (deleteAll) {
        // Cascading delete
        deleteTask(task.id, true);
      } else {
        // Move children to parent's level, then delete
        const children = tasks.filter((t) => t.parent === task.id);
        children.forEach((child) => moveTaskToParent(child.id, task.parent ?? null));
        deleteTask(task.id, false);
      }
    } else {
      // No children - simple confirmation
      if (window.confirm(`Delete task "${task.name}"?`)) {
        deleteTask(task.id, false);
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-table-row col-span-full grid ${
        isSelected ? 'bg-blue-50' : ''
      }`}
      role="row"
    >
      {/* Drag Handle Cell */}
      <div
        className="drag-handle-cell flex items-center justify-center px-2 py-2 border-b border-r border-gray-200 bg-gray-50 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        role="gridcell"
      >
        <DotsSixVertical size={16} weight="bold" className="text-gray-400" />
      </div>

      {/* Checkbox Cell */}
      <div
        className="checkbox-cell flex items-center justify-center px-2 py-2 border-b border-r border-gray-200"
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
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
        />
      </div>

      {/* Data Cells */}
      {TASK_COLUMNS.filter((col) => col.field).map((column) => {
        const field = column.field!;

        // Special handling for name field with hierarchy
        if (field === 'name') {
          const isEditing = isCellEditing(task.id, field);

          // In edit mode: no custom children, let Cell handle everything
          if (isEditing) {
            return (
              <Cell key={field} taskId={task.id} task={displayTask} field={field} column={column} />
            );
          }

          // In view mode: custom children with hierarchy elements
          return (
            <Cell key={field} taskId={task.id} task={displayTask} field={field} column={column}>
              <div className="flex items-center gap-1" style={{ paddingLeft: `${level * INDENT_SIZE}px` }}>
                {/* Expand/collapse button for any task with children */}
                {hasChildren ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskCollapsed(task.id);
                    }}
                    className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded text-gray-600 flex-shrink-0"
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                ) : (
                  <div className="w-4 flex-shrink-0" />
                )}

                {/* Task type icon - clickable to cycle through types */}
                <TaskTypeIcon
                  type={task.type}
                  onClick={() => {
                    const currentType = task.type || 'task';
                    let nextType: Task['type'];

                    if (hasChildren) {
                      // When task has children, only allow task ↔ summary (skip milestone)
                      nextType = currentType === 'task' ? 'summary' : 'task';
                    } else {
                      // When no children, cycle through all types
                      nextType =
                        currentType === 'task' ? 'summary' :
                        currentType === 'summary' ? 'milestone' : 'task';
                    }

                    updateTask(task.id, { type: nextType });
                  }}
                />

                {/* Task name display */}
                <span className="flex-1">
                  {task.name}
                </span>
              </div>
            </Cell>
          );
        }

        // Special handling for dates in summary tasks (read-only)
        if ((field === 'startDate' || field === 'endDate') && task.type === 'summary') {
          return (
            <Cell key={field} taskId={task.id} task={displayTask} field={field} column={column}>
              {displayTask[field] ? (
                <span className="text-gray-500 italic">{displayTask[field]}</span>
              ) : (
                <span></span>
              )}
            </Cell>
          );
        }

        // Special handling for end date in milestone tasks (read-only, empty)
        if (field === 'endDate' && task.type === 'milestone') {
          return (
            <Cell key={field} taskId={task.id} task={displayTask} field={field} column={column}>
              <span></span>
            </Cell>
          );
        }

        // Special handling for duration in summary and milestone tasks (read-only)
        if (field === 'duration' && (task.type === 'summary' || task.type === 'milestone')) {
          return (
            <Cell key={field} taskId={task.id} task={displayTask} field={field} column={column}>
              {task.type === 'summary' && displayTask.duration > 0 ? (
                <span className="text-gray-500 italic">{displayTask.duration} days</span>
              ) : (
                <span></span>
              )}
            </Cell>
          );
        }

        // Special handling for progress in milestone tasks (read-only, empty)
        if (field === 'progress' && task.type === 'milestone') {
          return (
            <Cell key={field} taskId={task.id} task={displayTask} field={field} column={column}>
              <span></span>
            </Cell>
          );
        }

        // Special handling for color field with color picker
        if (field === 'color') {
          const isEditing = isCellEditing(task.id, field);

          return (
            <Cell key={field} taskId={task.id} task={displayTask} field={field} column={column}>
              <div className="flex items-center justify-center w-full h-full">
                {isEditing ? (
                  <ColorCellEditor
                    value={displayTask.color}
                    onChange={(value) => updateTask(task.id, { color: value })}
                    onSave={stopCellEdit}
                    onCancel={stopCellEdit}
                  />
                ) : (
                  <div
                    className="w-1.5 h-7 rounded"
                    style={{ backgroundColor: displayTask.color }}
                  />
                )}
              </div>
            </Cell>
          );
        }

        // Default cell rendering
        return (
          <Cell key={field} taskId={task.id} task={displayTask} field={field} column={column} />
        );
      })}

      {/* Delete Button Cell */}
      <div
        className="delete-cell flex items-center justify-center px-2 py-2 border-b border-r border-gray-200 group-hover:bg-gray-50"
        role="gridcell"
      >
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-600 transition-colors"
          aria-label="Delete task"
          title="Delete task"
        >
          <Trash size={16} weight="regular" />
        </button>
      </div>
    </div>
  );
}
