/**
 * TaskRow component.
 * Displays individual task with selection support.
 */

import type { Task } from '../../types/chart.types';
import { useTaskStore } from '../../store/slices/taskSlice';

interface TaskRowProps {
  task: Task;
}

export function TaskRow({ task }: TaskRowProps): JSX.Element {
  const selectedTaskId = useTaskStore((state) => state.selectedTaskId);
  const selectTask = useTaskStore((state) => state.selectTask);

  const isSelected = selectedTaskId === task.id;

  const handleClick = () => {
    selectTask(task.id);
  };

  return (
    <div
      className={`task-row p-3 border-b border-gray-100 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 border-l-4 border-l-blue-500'
          : 'hover:bg-gray-50 border-l-4 border-l-transparent'
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-selected={isSelected}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Task Name */}
          <div className="font-medium text-gray-900 truncate">{task.name}</div>

          {/* Task Dates */}
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <span>{task.startDate}</span>
            <span>→</span>
            <span>{task.endDate}</span>
            <span className="text-gray-400">({task.duration} days)</span>
          </div>

          {/* Task Progress */}
          {task.progress > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{task.progress}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Task Color Indicator */}
        <div
          className="w-3 h-3 rounded-full ml-3 flex-shrink-0 mt-1"
          style={{ backgroundColor: task.color }}
          aria-label={`Task color: ${task.color}`}
        />
      </div>
    </div>
  );
}
