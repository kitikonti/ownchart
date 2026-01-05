/**
 * Color picker cell editor.
 * Allows selecting a color with a visual color picker.
 */

import { useState, useRef, useEffect, type KeyboardEvent } from "react";

export interface ColorCellEditorProps {
  /** Current color value (hex) */
  value: string;

  /** Called when color changes */
  onChange: (value: string) => void;

  /** Called when save is requested (Enter key) */
  onSave?: () => void;

  /** Called when cancel is requested (Escape key) */
  onCancel?: () => void;

  /** Height of the color bar (density-aware) */
  height?: number;
}

/**
 * Color picker cell editor component.
 */
export function ColorCellEditor({
  value,
  onChange,
  onSave,
  onCancel,
  height = 28,
}: ColorCellEditorProps): JSX.Element {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      // Automatically open the color picker dialog on mount
      inputRef.current.click();
    }
  }, []);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSave) {
      e.preventDefault();
      onSave();
    } else if (e.key === "Escape" && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="w-1.5 rounded overflow-hidden" style={{ height }}>
      <input
        ref={inputRef}
        type="color"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSave?.()}
        className="w-full h-full cursor-pointer block"
        title="Choose color"
      />
    </div>
  );
}
