/**
 * Column resizer component.
 * Allows resizing columns by dragging the column border.
 */

import {
  useState,
  useRef,
  useEffect,
  type MouseEvent,
  type KeyboardEvent,
} from "react";

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
}

/**
 * Column resizer component.
 */
export function ColumnResizer({
  columnId,
  onResize,
  onAutoResize,
  currentWidth,
  minWidth = 60,
}: ColumnResizerProps): JSX.Element {
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      // Live update during drag
      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(minWidth, startWidthRef.current + deltaX);
      onResize(columnId, newWidth);
    };

    const handleMouseUp = (e: globalThis.MouseEvent) => {
      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(minWidth, startWidthRef.current + deltaX);

      onResize(columnId, newWidth);
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, columnId, onResize, minWidth]);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
    setIsResizing(true);
  };

  const handleDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (onAutoResize) {
      onAutoResize(columnId);
    }
  };

  // Keyboard support for column resizing
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 20 : 5; // Larger step with Shift

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const newWidth = Math.max(minWidth, currentWidth - step);
      onResize(columnId, newWidth);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const newWidth = currentWidth + step;
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
        focus:outline-none focus-visible:bg-blue-500 focus-visible:w-1.5
        ${isResizing ? "bg-neutral-500 w-1.5" : "bg-transparent"}
      `}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={currentWidth}
      aria-valuemin={minWidth}
      aria-label={`Resize ${columnId} column. Use arrow keys to resize, Enter to auto-fit.`}
      title="Drag to resize, double-click to auto-fit. Arrow keys: resize, Enter: auto-fit"
    />
  );
}
