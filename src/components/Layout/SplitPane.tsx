/**
 * SplitPane component - Resizable split pane for TaskTable/Timeline layout.
 * Provides a draggable divider to adjust the width of the left panel.
 */

import { useState, useEffect, useRef } from "react";
import { SplitPaneDivider } from "./SplitPaneDivider";

interface SplitPaneProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  leftWidth: number;
  minLeftWidth: number;
  maxLeftWidth: number;
  onLeftWidthChange: (width: number) => void;
}

export function SplitPane({
  leftContent,
  rightContent,
  leftWidth,
  minLeftWidth,
  maxLeftWidth,
  onLeftWidthChange,
}: SplitPaneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      // Clamp between min and max
      const clampedWidth = Math.max(
        minLeftWidth,
        Math.min(maxLeftWidth, newWidth)
      );

      onLeftWidthChange(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, minLeftWidth, maxLeftWidth, onLeftWidthChange]);

  return (
    <div ref={containerRef} className="flex h-full">
      {/* Left Panel (TaskTable) - overflow handled by children */}
      <div
        style={{ width: leftWidth }}
        className="flex-shrink-0 overflow-hidden"
      >
        {leftContent}
      </div>

      {/* Resize Handle */}
      <SplitPaneDivider onMouseDown={handleMouseDown} isDragging={isDragging} />

      {/* Right Panel (Timeline) */}
      <div className="flex-1 min-w-0">{rightContent}</div>
    </div>
  );
}
