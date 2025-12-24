/**
 * TaskTableRow component.
 * Renders a task as a spreadsheet row with individual cells.
 * Supports hierarchy with SVAR-style indentation.
 */

import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  const { isCellEditing } = useCellNavigation();

  const isSelected = selectedTaskIds.includes(task.id);

  // Calculate summary dates if needed
  const displayTask = useMemo(() => {
    if (task.type === 'summary') {
      const summaryDates = calculateSummaryDates(tasks, task.id);
      if (summaryDates) {
        return { ...task, ...summaryDates };
      }
    }
    return task;
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
        isSelected ? 'bg-blue-50' : task.type === 'summary' ? 'bg-gray-50' : ''
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
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
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

                {/* Task type icon */}
                <TaskTypeIcon type={task.type} />

                {/* Task name display */}
                <span className={`flex-1 ${task.type === 'summary' ? 'font-semibold' : ''}`}>
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
              <span className="text-gray-500 italic">{displayTask[field]}</span>
            </Cell>
          );
        }

        // Special handling for duration in summary tasks (read-only)
        if (field === 'duration' && task.type === 'summary') {
          return (
            <Cell key={field} taskId={task.id} task={displayTask} field={field} column={column}>
              <span className="text-gray-500 italic">{displayTask.duration} days</span>
            </Cell>
          );
        }

        // Special handling for color field with color picker
        if (field === 'color') {
          const isEditing = isCellEditing(task.id, field);

          return (
            <Cell key={field} taskId={task.id} task={task} field={field} column={column}>
              {isEditing ? (
                <ColorCellEditor
                  value={task.color}
                  onChange={(value) => updateTask(task.id, { color: value })}
                />
              ) : (
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: task.color }}
                />
              )}
            </Cell>
          );
        }

        // Default cell rendering
        return (
          <Cell key={field} taskId={task.id} task={task} field={field} column={column} />
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
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
