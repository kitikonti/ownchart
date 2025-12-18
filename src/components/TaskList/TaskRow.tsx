/**
 * TaskRow component.
 * Displays individual task with selection and inline editing support.
 */

import { useState, useRef, useEffect } from 'react';
import type { Task } from '../../types/chart.types';
import { useTaskStore } from '../../store/slices/taskSlice';
import { validateTask } from '../../utils/validation';

interface TaskRowProps {
  task: Task;
}

export function TaskRow({ task }: TaskRowProps): JSX.Element {
  const selectedTaskId = useTaskStore((state) => state.selectedTaskId);
  const selectTask = useTaskStore((state) => state.selectTask);
  const updateTask = useTaskStore((state) => state.updateTask);

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(task.name);
  const [editedStartDate, setEditedStartDate] = useState(task.startDate);
  const [editedEndDate, setEditedEndDate] = useState(task.endDate);
  const [editedProgress, setEditedProgress] = useState(task.progress);
  const [error, setError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const isSelected = selectedTaskId === task.id;

  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    selectTask(task.id);
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    const updates = {
      name: editedName,
      startDate: editedStartDate,
      endDate: editedEndDate,
      progress: editedProgress,
    };

    const validation = validateTask(updates);
    if (!validation.valid) {
      setError(validation.error || 'Validation error');
      return;
    }

    // Calculate duration
    const start = new Date(editedStartDate);
    const end = new Date(editedEndDate);
    const duration = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    updateTask(task.id, { ...updates, duration });
    setIsEditing(false);
    setError(null);
  };

  const handleCancel = () => {
    setEditedName(task.name);
    setEditedStartDate(task.startDate);
    setEditedEndDate(task.endDate);
    setEditedProgress(task.progress);
    setIsEditing(false);
    setError(null);
  };

  if (isEditing) {
    return (
      <div className="task-row p-3 border-b border-gray-100 bg-white">
        <div className="space-y-2">
          {/* Task Name Input */}
          <input
            ref={nameInputRef}
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
              }
            }}
            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Task name"
          />

          {/* Date Inputs */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={editedStartDate}
              onChange={(e) => setEditedStartDate(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">→</span>
            <input
              type="date"
              value={editedEndDate}
              onChange={(e) => setEditedEndDate(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Progress Input */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Progress:</label>
            <input
              type="number"
              min="0"
              max="100"
              value={editedProgress}
              onChange={(e) => setEditedProgress(Number(e.target.value))}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">%</span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <span className="text-xs text-gray-500">
              Press Enter to save, Esc to cancel
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`task-row p-3 border-b border-gray-100 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 border-l-4 border-l-blue-500'
          : 'hover:bg-gray-50 border-l-4 border-l-transparent'
      }`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'F2') {
          e.preventDefault();
          setIsEditing(true);
        } else if (e.key === 'Enter' || e.key === ' ') {
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
