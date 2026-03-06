/**
 * useMarqueeSelection - Hook for rectangular marquee selection in timeline
 * Allows users to drag a rectangle to select multiple tasks at once
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { TaskId } from "../types/branded.types";

export interface MarqueeRect {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface TaskGeometry {
  id: TaskId;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UseMarqueeSelectionOptions {
  /** Reference to the SVG element */
  svgRef: React.RefObject<SVGSVGElement | null>;
  /** Task geometries for hit detection */
  taskGeometries: TaskGeometry[];
  /** Callback when selection changes */
  onSelectionChange: (taskIds: TaskId[], addToSelection: boolean) => void;
  /** Whether marquee selection is enabled */
  enabled?: boolean;
}

export interface UseMarqueeSelectionResult {
  /** Current marquee rectangle (null if not dragging) */
  marqueeRect: MarqueeRect | null;
  /** Normalized rectangle for rendering (x, y, width, height) */
  normalizedRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  /** Whether marquee selection is active */
  isSelecting: boolean;
  /** Mouse down handler for SVG */
  onMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void;
}

/**
 * Check if two rectangles intersect
 */
export function rectsIntersect(
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
export function normalizeRect(rect: MarqueeRect): {
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

  // Stable refs for props that may change every render — breaking the
  // dependency chain prevents useEffect from removing active drag listeners
  // when the parent re-renders (e.g. due to a store update during drag).
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  const taskGeometriesRef = useRef(taskGeometries);
  taskGeometriesRef.current = taskGeometries;

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
    [] // svgRef is a stable React ref — re-creation on ref identity change is unnecessary
  );

  // Find tasks that intersect with the marquee rectangle.
  // Uses a ref for taskGeometries so this callback is always stable —
  // avoids recreating handleMouseUp/onMouseDown on every render.
  // TaskGeometry structurally satisfies the rect parameter of rectsIntersect,
  // so we pass the task object directly without an intermediate spread.
  const findIntersectingTasks = useCallback(
    (marquee: MarqueeRect): TaskId[] => {
      const normalizedMarquee = normalizeRect(marquee);
      return taskGeometriesRef.current
        .filter((task) => rectsIntersect(normalizedMarquee, task))
        .map((task) => task.id);
    },
    []
  ); // stable — reads taskGeometries via ref

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
          // Call via ref so this callback never needs onSelectionChange in its
          // deps — prevents the active-drag listener from being removed and
          // re-added when the parent passes a new callback reference.
          onSelectionChangeRef.current(
            intersectingIds,
            addToSelectionRef.current
          );
        }
      }

      setMarqueeRect(null);

      // Remove event listeners
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    },
    [getSvgCoordinates, findIntersectingTasks, handleMouseMove]
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

  // Cleanup on unmount (or if handlers change, which they no longer do
  // thanks to the ref pattern above)
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
    // Derive from state rather than a ref so the value is always reactive
    isSelecting: marqueeRect !== null,
    onMouseDown,
  };
}
