/**
 * Color picker cell editor.
 * Opens an enhanced color picker popover with swatches and project colors.
 * Override-aware: in automatic color modes, writes to colorOverride.
 */

import {
  memo,
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { ColorPickerPopover } from "./ColorPickerPopover";
import type { ColorMode } from "../../../types/colorMode.types";
import type { HexColor } from "../../../types/branded.types";
import { toHexColor } from "../../../types/branded.types";
import { DENSITY_CONFIG } from "../../../config/densityConfig";

export interface ColorCellEditorProps {
  /** Current task.color value (hex) */
  value: HexColor;

  /** Computed display color (may differ from value in auto modes) */
  computedColor?: HexColor;

  /** Current color mode */
  colorMode?: ColorMode;

  /** Whether this task has a colorOverride set */
  hasOverride?: boolean;

  /** Called when color changes */
  onChange: (value: HexColor) => void;

  /** Called to reset colorOverride back to automatic */
  onResetOverride?: () => void;

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
export const ColorCellEditor = memo(function ColorCellEditor({
  value,
  computedColor,
  colorMode = "manual",
  hasOverride = false,
  onChange,
  onResetOverride,
  onSave,
  onCancel,
  height = DENSITY_CONFIG.compact.rowHeight,
}: ColorCellEditorProps): JSX.Element {
  const [showPopover, setShowPopover] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | undefined>();
  const triggerRef = useRef<HTMLButtonElement>(null);

  // The display color: in auto modes use computed, in manual use task.color
  const displayColor = computedColor || value;

  const openPopover = useCallback((): void => {
    if (triggerRef.current) {
      setAnchorRect(triggerRef.current.getBoundingClientRect());
      setShowPopover(true);
    }
  }, []);

  // Auto-open popover on mount
  useEffect(() => {
    openPopover();
  }, [openPopover]);

  const handleSelect = useCallback(
    (color: string): void => {
      onChange(toHexColor(color));
    },
    [onChange]
  );

  const handleClose = useCallback((): void => {
    setShowPopover(false);
    onSave?.();
  }, [onSave]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      openPopover();
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
        onClick={openPopover}
        onKeyDown={handleKeyDown}
        className="w-full rounded overflow-hidden border-0 p-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-0"
        style={{
          height,
          backgroundColor: displayColor,
          // outline: none is intentional — the active cell's own blue border
          // (applied by TaskTableRow) already provides the focus context for
          // pointer users. focus-visible:ring provides a fallback for keyboard users.
          outline: "none",
        }}
        title="Choose color"
        aria-label="Open color picker"
      />

      {/* Popover rendered in portal */}
      {showPopover &&
        createPortal(
          <ColorPickerPopover
            value={displayColor}
            onSelect={handleSelect}
            onClose={handleClose}
            anchorRect={anchorRect}
            colorMode={colorMode}
            hasOverride={hasOverride}
            onResetOverride={onResetOverride}
          />,
          document.body
        )}
    </>
  );
});
