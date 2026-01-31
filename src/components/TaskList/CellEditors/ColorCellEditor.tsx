/**
 * Color picker cell editor.
 * Opens an enhanced color picker popover with swatches and project colors.
 */

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { ColorPickerPopover } from "./ColorPickerPopover";

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
 * Shows a color swatch that opens an enhanced popover on click.
 */
export function ColorCellEditor({
  value,
  onChange,
  onSave,
  onCancel,
  height = 28,
}: ColorCellEditorProps): JSX.Element {
  const [showPopover, setShowPopover] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | undefined>();
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Auto-open popover on mount
  useEffect(() => {
    if (triggerRef.current) {
      setAnchorRect(triggerRef.current.getBoundingClientRect());
      setShowPopover(true);
    }
  }, []);

  const handleClick = (): void => {
    if (triggerRef.current) {
      setAnchorRect(triggerRef.current.getBoundingClientRect());
      setShowPopover(true);
    }
  };

  const handleSelect = (color: string): void => {
    onChange(color);
  };

  const handleClose = (): void => {
    setShowPopover(false);
    onSave?.();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleClick();
    } else if (e.key === "Escape" && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="w-full rounded overflow-hidden border-0 p-0 cursor-pointer"
        style={{
          height,
          backgroundColor: value,
          outline: "none",
        }}
        title="Choose color"
        aria-label="Open color picker"
      />

      {/* Popover rendered in portal */}
      {showPopover &&
        createPortal(
          <ColorPickerPopover
            value={value}
            onSelect={handleSelect}
            onClose={handleClose}
            anchorRect={anchorRect}
          />,
          document.body
        )}
    </>
  );
}
