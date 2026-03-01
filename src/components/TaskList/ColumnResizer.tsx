/**
 * Column resizer component.
 * Allows resizing columns by dragging the column border.
 */

import {
  memo,
  useState,
  useRef,
  useEffect,
  type MouseEvent,
  type KeyboardEvent,
} from "react";

// Keyboard resize step sizes (px)
const RESIZE_STEP_PX = 5;
const RESIZE_STEP_SHIFT_PX = 20;

// Fallback upper bound for aria-valuemax when no maxWidth prop is provided
const MAX_COLUMN_WIDTH = 1200;

export interface ColumnResizerProps {
  /** Column ID */
  columnId: string;

  /** Called when resize completes */
  onResize: (columnId: string, width: number) => void;

  /** Called on double-click to auto-resize */
  onAutoResize?: (columnId: string) => void;

  /** Current column width */
  currentWidth: number;

  /** Minimum column width */
  minWidth?: number;

  /** Maximum column width (used for aria-valuemax) */
  maxWidth?: number;
}

/**
 * Column resizer component.
 */
export const ColumnResizer = memo(function ColumnResizer({
  columnId,
  onResize,
  onAutoResize,
  currentWidth,
  minWidth = 60,
  maxWidth,
}: ColumnResizerProps): JSX.Element {
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  useEffect(() => {
    if (!isResizing) return;

    const computeWidth = (clientX: number): number =>
      Math.min(
        maxWidth ?? Infinity,
        Math.max(
          minWidth,
          startWidthRef.current + (clientX - startXRef.current)
        )
      );

    const handleMouseMove = (e: globalThis.MouseEvent): void => {
      onResize(columnId, computeWidth(e.clientX));
    };

    const handleMouseUp = (e: globalThis.MouseEvent): void => {
      onResize(columnId, computeWidth(e.clientX));
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return (): void => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, columnId, onResize, minWidth, maxWidth]);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();

    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
    setIsResizing(true);
  };

  const handleDoubleClick = (e: MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();

    if (onAutoResize) {
      onAutoResize(columnId);
    }
  };

  // Keyboard support for column resizing
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    const step = e.shiftKey ? RESIZE_STEP_SHIFT_PX : RESIZE_STEP_PX;

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const newWidth = Math.max(minWidth, currentWidth - step);
      onResize(columnId, newWidth);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const newWidth = Math.min(maxWidth ?? Infinity, currentWidth + step);
      onResize(columnId, newWidth);
    } else if (e.key === "Enter" || e.key === " ") {
      // Auto-resize on Enter or Space
      e.preventDefault();
      if (onAutoResize) {
        onAutoResize(columnId);
      }
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- separator with tabIndex is interactive per ARIA spec
    <div
      className={`
        absolute right-0 top-0 bottom-0 w-1 cursor-col-resize
        hover:bg-neutral-400 hover:w-1.5
        focus-visible:bg-brand-600 focus-visible:w-1.5
        ${isResizing ? "bg-neutral-500 w-1.5" : "bg-transparent"}
      `}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- separator is keyboard-operable resize handle
      tabIndex={0}
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={currentWidth}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth ?? MAX_COLUMN_WIDTH}
      aria-label={`Resize ${columnId} column. Use arrow keys to resize, Enter to auto-fit.`}
      title="Drag to resize, double-click to auto-fit. Arrow keys: resize, Enter: auto-fit"
    />
  );
});
