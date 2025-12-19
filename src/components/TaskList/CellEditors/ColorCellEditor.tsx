/**
 * Color picker cell editor.
 * Allows selecting a color with a visual color picker.
 */

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';

export interface ColorCellEditorProps {
  /** Current color value (hex) */
  value: string;

  /** Called when color changes */
  onChange: (value: string) => void;

  /** Called when save is requested (Enter key) */
  onSave?: () => void;

  /** Called when cancel is requested (Escape key) */
  onCancel?: () => void;
}

/**
 * Color picker cell editor component.
 */
export function ColorCellEditor({
  value,
  onChange,
  onSave,
  onCancel,
}: ColorCellEditorProps): JSX.Element {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSave) {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape' && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="color"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-12 h-8 cursor-pointer rounded border border-gray-300"
        title="Choose color"
      />
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="#000000"
        maxLength={7}
      />
    </div>
  );
}
