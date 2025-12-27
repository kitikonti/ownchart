/**
 * Type selector cell editor.
 * Allows selecting between task, summary, and milestone types.
 */

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import type { TaskType } from '../../../types/chart.types';
import { TaskTypeIcon } from '../TaskTypeIcon';

export interface TypeCellEditorProps {
  /** Current type value */
  value: TaskType;

  /** Called when type changes */
  onChange: (value: TaskType) => void;

  /** Called when save is requested (Enter key) */
  onSave?: () => void;

  /** Called when cancel is requested (Escape key) */
  onCancel?: () => void;
}

const TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'summary', label: 'Summary' },
  { value: 'milestone', label: 'Milestone' },
];

/**
 * Type selector cell editor component.
 */
export function TypeCellEditor({
  value,
  onChange,
  onSave,
  onCancel,
}: TypeCellEditorProps): JSX.Element {
  const [localValue, setLocalValue] = useState(value);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (selectRef.current) {
      selectRef.current.focus();
    }
  }, []);

  const handleChange = (newValue: TaskType) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === 'Enter' && onSave) {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape' && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <TaskTypeIcon type={localValue} />
      <select
        ref={selectRef}
        value={localValue}
        onChange={(e) => handleChange(e.target.value as TaskType)}
        onKeyDown={handleKeyDown}
        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
