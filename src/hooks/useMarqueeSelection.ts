/**
 * useMarqueeSelection - Hook for rectangular marquee selection in timeline
 * Allows users to drag a rectangle to select multiple tasks at once
 */

import { useState, useCallback, useRef, useEffect } from "react";

export interface MarqueeRect {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface TaskGeometry {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseMarqueeSelectionOptions {
  /** Reference to the SVG element */
  svgRef: React.RefObject<SVGSVGElement | null>;
  /** Task geometries for hit detection */
  taskGeometries: TaskGeometry[];
  /** Callback when selection changes */
  onSelectionChange: (taskIds: string[], addToSelection: boolean) => void;
  /** Whether marquee selection is enabled */
  enabled?: boolean;
}

interface UseMarqueeSelectionResult {
  /** Current marquee rectangle (null if not dragging) */
  marqueeRect: MarqueeRect | null;
  /** Normalized rectangle for rendering (x, y, width, height) */
  normalizedRect: { x: number; y: number; width: number; height: number } | null;
  /** Whether marquee selection is active */
  isSelecting: boolean;
  /** Mouse down handler for SVG */
  onMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void;
}

/**
 * Check if two rectangles intersect
 */
function rectsIntersect(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
}

/**
 * Normalize a marquee rect to have positive width/height
 */
function normalizeRect(rect: MarqueeRect): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const x = Math.min(rect.startX, rect.currentX);
  const y = Math.min(rect.startY, rect.currentY);
  const width = Math.abs(rect.currentX - rect.startX);
  const height = Math.abs(rect.currentY - rect.startY);
  return { x, y, width, height };
}

export function useMarqueeSelection({
  svgRef,
  taskGeometries,
  onSelectionChange,
  enabled = true,
}: UseMarqueeSelectionOptions): UseMarqueeSelectionResult {
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);
  const marqueeRectRef = useRef<MarqueeRect | null>(null);
  const isSelectingRef = useRef(false);
  const addToSelectionRef = useRef(false);

  // Keep ref in sync with state
  marqueeRectRef.current = marqueeRect;

  // Get SVG coordinates from mouse event
  const getSvgCoordinates = useCallback(
    (e: MouseEvent | React.MouseEvent): { x: number; y: number } | null => {
      const svg = svgRef.current;
      if (!svg) return null;

      const rect = svg.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    [svgRef]
  );

  // Find tasks that intersect with the marquee rectangle
  const findIntersectingTasks = useCallback(
    (marquee: MarqueeRect): string[] => {
      const normalizedMarquee = normalizeRect(marquee);
      const intersectingIds: string[] = [];

      for (const task of taskGeometries) {
        const taskRect = {
          x: task.x,
          y: task.y,
          width: task.width,
          height: task.height,
        };

        if (rectsIntersect(normalizedMarquee, taskRect)) {
          intersectingIds.push(task.id);
        }
      }

      return intersectingIds;
    },
    [taskGeometries]
  );

  // Mouse move handler
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isSelectingRef.current) return;

      const coords = getSvgCoordinates(e);
      if (!coords) return;

      setMarqueeRect((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentX: coords.x,
          currentY: coords.y,
        };
      });
    },
    [getSvgCoordinates]
  );

  // Mouse up handler
  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!isSelectingRef.current) return;

      isSelectingRef.current = false;

      // Find intersecting tasks and update selection
      const currentRect = marqueeRectRef.current;
      if (currentRect) {
        const coords = getSvgCoordinates(e);
        if (coords) {
          const finalRect = {
            ...currentRect,
            currentX: coords.x,
            currentY: coords.y,
          };
          const intersectingIds = findIntersectingTasks(finalRect);
          onSelectionChange(intersectingIds, addToSelectionRef.current);
        }
      }

      setMarqueeRect(null);

      // Remove event listeners
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    },
    [getSvgCoordinates, findIntersectingTasks, onSelectionChange, handleMouseMove]
  );

  // Mouse down handler (to be attached to SVG)
  const onMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!enabled) return;

      // Only start marquee on left click
      if (e.button !== 0) return;

      // Don't start if clicking on a task bar or other interactive element
      const target = e.target as Element;
      if (
        target.closest(".task-bar") ||
        target.closest(".connection-handle") ||
        target.closest(".dependency-arrow")
      ) {
        return;
      }

      const coords = getSvgCoordinates(e);
      if (!coords) return;

      // Store whether Shift/Ctrl is held for add-to-selection
      addToSelectionRef.current = e.shiftKey || e.ctrlKey || e.metaKey;

      isSelectingRef.current = true;
      setMarqueeRect({
        startX: coords.x,
        startY: coords.y,
        currentX: coords.x,
        currentY: coords.y,
      });

      // Add global event listeners
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      // Prevent text selection during drag
      e.preventDefault();
    },
    [enabled, getSvgCoordinates, handleMouseMove, handleMouseUp]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Calculate normalized rectangle for rendering
  const normalizedRect = marqueeRect ? normalizeRect(marqueeRect) : null;

  return {
    marqueeRect,
    normalizedRect,
    isSelecting: isSelectingRef.current,
    onMouseDown,
  };
}
