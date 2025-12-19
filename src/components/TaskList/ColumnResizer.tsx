/**
 * Column resizer component.
 * Allows resizing columns by dragging the column border.
 */

import { useState, useRef, useEffect, type MouseEvent } from 'react';

export interface ColumnResizerProps {
  /** Column ID */
  columnId: string;

  /** Called when resize completes */
  onResize: (columnId: string, width: number) => void;

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
  currentWidth,
  minWidth = 60,
}: ColumnResizerProps): JSX.Element {
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (_e: globalThis.MouseEvent) => {
      // Update width during drag (optional - for real-time preview)
      // For now, we'll only update on mouse up
    };

    const handleMouseUp = (e: globalThis.MouseEvent) => {
      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(minWidth, startWidthRef.current + deltaX);

      onResize(columnId, newWidth);
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, columnId, onResize, minWidth]);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
    setIsResizing(true);
  };

  return (
    <div
      className={`
        absolute right-0 top-0 bottom-0 w-1 cursor-col-resize
        hover:bg-blue-500 hover:w-1.5
        ${isResizing ? 'bg-blue-600 w-1.5' : 'bg-transparent'}
      `}
      onMouseDown={handleMouseDown}
      title="Drag to resize column"
    />
  );
}
