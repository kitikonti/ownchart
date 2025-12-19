/**
 * TaskTableRow component.
 * Renders a task as a spreadsheet row with individual cells.
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../types/chart.types';
import { useTaskStore } from '../../store/slices/taskSlice';
import { Cell } from './Cell';
import { ColorCellEditor } from './CellEditors/ColorCellEditor';
import { TASK_COLUMNS } from '../../config/tableColumns';
import { useCellNavigation } from '../../hooks/useCellNavigation';

interface TaskTableRowProps {
  task: Task;
}

export function TaskTableRow({ task }: TaskTableRowProps): JSX.Element {
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const { isCellEditing } = useCellNavigation();

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
  };

  const handleDelete = () => {
    if (window.confirm(`Delete task "${task.name}"?`)) {
      deleteTask(task.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="task-table-row contents"
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

      {/* Data Cells */}
      {TASK_COLUMNS.filter((col) => col.field).map((column) => {
        const field = column.field!;

        // Special handling for color field with color picker
        if (field === 'color') {
          const isEditing = isCellEditing(task.id, field);

          return (
            <Cell
              key={field}
              taskId={task.id}
              task={task}
              field={field}
              column={column}
            >
              {isEditing ? (
                <ColorCellEditor
                  value={task.color}
                  onChange={(value) => updateTask(task.id, { color: value })}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: task.color }}
                  />
                  <span className="text-xs text-gray-600">{task.color}</span>
                </div>
              )}
            </Cell>
          );
        }

        // Default cell rendering
        return (
          <Cell
            key={field}
            taskId={task.id}
            task={task}
            field={field}
            column={column}
          />
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
