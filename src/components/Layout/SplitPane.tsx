/**
 * SplitPane component - Resizable split pane for TaskTable/Timeline layout.
 * Provides a draggable divider to adjust the width of the left panel.
 * Supports snap-to-collapse: dragging below a threshold collapses the panel.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { SplitPaneDivider } from "./SplitPaneDivider";

const COLLAPSE_THRESHOLD = 80; // px — snap to collapsed below this width

interface SplitPaneProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  leftWidth: number;
  minLeftWidth: number;
  maxLeftWidth: number;
  onLeftWidthChange: (width: number) => void;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function SplitPane({
  leftContent,
  rightContent,
  leftWidth,
  minLeftWidth,
  maxLeftWidth,
  onLeftWidthChange,
  isCollapsed = false,
  onCollapsedChange,
}: SplitPaneProps): JSX.Element {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  // Use ref to track width during drag - no React state updates!
  const dragWidthRef = useRef<number>(leftWidth);
  // Store the width before collapse so we can restore it
  const preCollapseWidthRef = useRef<number>(leftWidth);
  // Track whether current drag started from collapsed state
  const dragFromCollapsedRef = useRef(false);

  // Keep preCollapseWidth updated when not collapsed
  useEffect(() => {
    if (!isCollapsed && leftWidth > COLLAPSE_THRESHOLD) {
      preCollapseWidthRef.current = leftWidth;
    }
  }, [leftWidth, isCollapsed]);

  const handleMouseDown = (e: React.MouseEvent): void => {
    e.preventDefault();
    dragFromCollapsedRef.current = isCollapsed;
    dragWidthRef.current = isCollapsed ? 0 : leftWidth;
    setIsDragging(true);
  };

  const handleKeyboardResize = useCallback(
    (delta: number): void => {
      if (isCollapsed && delta > 0 && onCollapsedChange) {
        // Expanding from collapsed state
        onCollapsedChange(false);
        onLeftWidthChange(minLeftWidth);
        return;
      }
      const newWidth = Math.max(
        minLeftWidth,
        Math.min(maxLeftWidth, leftWidth + delta)
      );
      onLeftWidthChange(newWidth);
    },
    [
      leftWidth,
      minLeftWidth,
      maxLeftWidth,
      onLeftWidthChange,
      isCollapsed,
      onCollapsedChange,
    ]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent): void => {
      if (!containerRef.current || !leftPanelRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      if (newWidth < COLLAPSE_THRESHOLD) {
        // Show collapse preview
        dragWidthRef.current = 0;
        leftPanelRef.current.style.width = "0px";
      } else if (dragFromCollapsedRef.current) {
        // Expanding from collapsed: let divider follow cursor smoothly
        // (don't enforce minLeftWidth during drag — snap on mouseUp)
        const clampedWidth = Math.min(maxLeftWidth, newWidth);
        dragWidthRef.current = clampedWidth;
        leftPanelRef.current.style.width = `${clampedWidth}px`;
      } else {
        // Normal resize: clamp between min and max
        const clampedWidth = Math.max(
          minLeftWidth,
          Math.min(maxLeftWidth, newWidth)
        );
        dragWidthRef.current = clampedWidth;
        leftPanelRef.current.style.width = `${clampedWidth}px`;
      }
    };

    const handleMouseUp = (): void => {
      const finalWidth = dragWidthRef.current;

      if (finalWidth === 0) {
        // Snap to collapsed
        onCollapsedChange?.(true);
      } else {
        // Expand if was collapsed, update width
        if (isCollapsed) {
          onCollapsedChange?.(false);
        }
        // Enforce minLeftWidth on release
        const enforcedWidth = Math.max(minLeftWidth, finalWidth);
        onLeftWidthChange(enforcedWidth);
      }
      dragFromCollapsedRef.current = false;
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return (): void => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    minLeftWidth,
    maxLeftWidth,
    onLeftWidthChange,
    isCollapsed,
    onCollapsedChange,
  ]);

  const handleExpandFromCollapsed = (): void => {
    onCollapsedChange?.(false);
    // Restore previous width or use minimum
    const restoreWidth = Math.max(
      minLeftWidth,
      preCollapseWidthRef.current || minLeftWidth
    );
    onLeftWidthChange(restoreWidth);
  };

  // When collapsed, always show 0 width (during drag, DOM manipulation takes over)
  const effectiveWidth = isCollapsed ? 0 : leftWidth;

  return (
    <div ref={containerRef} className="flex h-full">
      {/* Left Panel (TaskTable) - overflow handled by children */}
      <div
        ref={leftPanelRef}
        style={{
          width: effectiveWidth,
          transition: isDragging ? "none" : "width 150ms ease-out",
        }}
        className="flex-shrink-0 overflow-clip"
      >
        {!isCollapsed && leftContent}
      </div>

      {/* Resize Handle */}
      <SplitPaneDivider
        onMouseDown={handleMouseDown}
        onResize={handleKeyboardResize}
        isDragging={isDragging}
        isCollapsed={isCollapsed && !isDragging}
        onExpand={handleExpandFromCollapsed}
      />

      {/* Right Panel (Timeline) */}
      <div className="flex-1 min-w-0">{rightContent}</div>
    </div>
  );
}
