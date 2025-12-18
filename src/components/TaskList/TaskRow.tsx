/**
 * TaskRow component.
 * Displays individual task with selection and inline editing support.
 */

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  const deleteTask = useTaskStore((state) => state.deleteTask);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete task "${task.name}"?`)) {
      deleteTask(task.id);
    }
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-row group p-3 border-b border-gray-100 cursor-pointer transition-colors ${
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
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="drag-handle mr-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0"
          aria-label="Drag to reorder"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </button>
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

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="delete-button ml-2 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
          aria-label="Delete task"
          title="Delete task"
        >
          <svg
            className="w-5 h-5"
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
