/**
 * useMarqueeSelection - Hook for rectangular marquee selection in timeline
 * Allows users to drag a rectangle to select multiple tasks at once
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { TaskId } from "../types/branded.types";

// CSS selectors for interactive elements that should not start a marquee drag.
// Defined as constants so a class-name rename is caught by a single update here.
const TASK_BAR_SELECTOR = ".task-bar";
const CONNECTION_HANDLE_SELECTOR = ".connection-handle";
const DEPENDENCY_ARROW_SELECTOR = ".dependency-arrow";

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

/**
 * Convert a mouse event's client coordinates to SVG-local coordinates.
 * Extracted as a module-level pure function — reads no closed-over state,
 * so it does not need useCallback inside the hook.
 */
function getSvgCoordinates(
  svg: SVGSVGElement,
  e: MouseEvent | React.MouseEvent
): { x: number; y: number } {
  const rect = svg.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

/**
 * Return the IDs of tasks whose bounding boxes intersect the given marquee.
 * Extracted as a module-level pure function — reads no closed-over state,
 * so taskGeometries can be passed from a ref without needing useCallback.
 */
function findIntersectingTaskIds(
  tasks: TaskGeometry[],
  marquee: MarqueeRect
): TaskId[] {
  const normalized = normalizeRect(marquee);
  return tasks.filter((t) => rectsIntersect(normalized, t)).map((t) => t.id);
}

/**
 * Return false if the event targets an interactive task element that should
 * absorb pointer events rather than starting a marquee drag.
 */
function shouldStartMarqueeDrag(
  e: React.MouseEvent<SVGSVGElement>,
  enabled: boolean
): boolean {
  if (!enabled || e.button !== 0) return false;
  const target = e.target as Element;
  return (
    !target.closest(TASK_BAR_SELECTOR) &&
    !target.closest(CONNECTION_HANDLE_SELECTOR) &&
    !target.closest(DEPENDENCY_ARROW_SELECTOR)
  );
}

// ---------------------------------------------------------------------------

interface MarqueeDragListenersDeps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  enabled: boolean;
  marqueeRectRef: React.MutableRefObject<MarqueeRect | null>;
  onSelectionChangeRef: React.MutableRefObject<
    (taskIds: TaskId[], addToSelection: boolean) => void
  >;
  taskGeometriesRef: React.MutableRefObject<TaskGeometry[]>;
  setMarqueeRect: React.Dispatch<React.SetStateAction<MarqueeRect | null>>;
}

interface MarqueeDragListeners {
  isSelectingRef: React.MutableRefObject<boolean>;
  addToSelectionRef: React.MutableRefObject<boolean>;
  handleMouseMove: (e: MouseEvent) => void;
  handleMouseUp: (e: MouseEvent) => void;
}

/**
 * Stable mousemove handler: updates marquee rect coordinates while dragging.
 * Extracted to keep useMarqueeDragListeners under 50 lines.
 */
function useMarqueeMouseMoveHandler(
  svgRef: React.RefObject<SVGSVGElement | null>,
  isSelectingRef: React.MutableRefObject<boolean>,
  setMarqueeRect: React.Dispatch<React.SetStateAction<MarqueeRect | null>>
): (e: MouseEvent) => void {
  return useCallback(
    (e: MouseEvent) => {
      if (!isSelectingRef.current) return;
      const svg = svgRef.current;
      if (!svg) return;
      const coords = getSvgCoordinates(svg, e);
      setMarqueeRect((prev) =>
        prev ? { ...prev, currentX: coords.x, currentY: coords.y } : null
      );
    },
    [svgRef, isSelectingRef, setMarqueeRect]
  );
}

/**
 * Stable mouseup handler: finalises selection and removes drag listeners.
 * Uses a handler ref so the callback can deregister itself without a
 * self-referential closure, and accepts handleMouseMove to remove it too.
 * Extracted to keep useMarqueeDragListeners under 50 lines.
 */
function useMarqueeMouseUpHandler(
  svgRef: React.RefObject<SVGSVGElement | null>,
  isSelectingRef: React.MutableRefObject<boolean>,
  addToSelectionRef: React.MutableRefObject<boolean>,
  marqueeRectRef: React.MutableRefObject<MarqueeRect | null>,
  onSelectionChangeRef: React.MutableRefObject<
    (taskIds: TaskId[], addToSelection: boolean) => void
  >,
  taskGeometriesRef: React.MutableRefObject<TaskGeometry[]>,
  setMarqueeRect: React.Dispatch<React.SetStateAction<MarqueeRect | null>>,
  handleMouseMove: (e: MouseEvent) => void,
  // Receives a ref to itself so the callback can deregister without a
  // self-referential dependency (which would require the function in its own
  // dep array, causing a circular re-creation on every render).
  selfRef: React.MutableRefObject<(e: MouseEvent) => void>
): (e: MouseEvent) => void {
  return useCallback(
    (e: MouseEvent) => {
      if (!isSelectingRef.current) return;
      isSelectingRef.current = false;

      const currentRect = marqueeRectRef.current;
      if (currentRect) {
        const svg = svgRef.current;
        if (svg) {
          const coords = getSvgCoordinates(svg, e);
          const finalRect = {
            ...currentRect,
            currentX: coords.x,
            currentY: coords.y,
          };
          const ids = findIntersectingTaskIds(
            taskGeometriesRef.current,
            finalRect
          );
          // Call via ref so this callback never needs onSelectionChange in its
          // deps — prevents the active-drag listener from being removed and
          // re-added when the parent passes a new callback reference.
          onSelectionChangeRef.current(ids, addToSelectionRef.current);
        }
      }

      setMarqueeRect(null);
      document.removeEventListener("mousemove", handleMouseMove);
      // Deregister self via ref to avoid a self-referential dep array.
      document.removeEventListener("mouseup", selfRef.current);
    },
    [
      svgRef,
      isSelectingRef,
      addToSelectionRef,
      marqueeRectRef,
      onSelectionChangeRef,
      taskGeometriesRef,
      setMarqueeRect,
      handleMouseMove,
      selfRef,
    ]
  );
}

/**
 * Owns the document-level drag listeners (mousemove / mouseup), the mutable
 * refs that track drag state, and the cleanup effect.
 *
 * Extracted so the main hook stays focused on state, stable-ref updates,
 * the mousedown initiator, and the public return value.
 */
function useMarqueeDragListeners({
  svgRef,
  enabled,
  marqueeRectRef,
  onSelectionChangeRef,
  taskGeometriesRef,
  setMarqueeRect,
}: MarqueeDragListenersDeps): MarqueeDragListeners {
  const isSelectingRef = useRef(false);
  const addToSelectionRef = useRef(false);
  // Stable ref to handleMouseUp so the handler can deregister itself.
  const handleMouseUpRef = useRef<(e: MouseEvent) => void>(() => undefined);

  const handleMouseMove = useMarqueeMouseMoveHandler(
    svgRef,
    isSelectingRef,
    setMarqueeRect
  );

  const handleMouseUp = useMarqueeMouseUpHandler(
    svgRef,
    isSelectingRef,
    addToSelectionRef,
    marqueeRectRef,
    onSelectionChangeRef,
    taskGeometriesRef,
    setMarqueeRect,
    handleMouseMove,
    handleMouseUpRef
  );
  // Keep the ref current so the callback always deregisters the active version.
  handleMouseUpRef.current = handleMouseUp;

  // Cancel an active drag when `enabled` turns false mid-drag, and clean up
  // listeners on unmount. Combined into one effect: the cleanup function always
  // runs on unmount so a separate effect for that is not needed.
  useEffect(() => {
    if (!enabled && isSelectingRef.current) {
      isSelectingRef.current = false;
      setMarqueeRect(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [enabled, handleMouseMove, handleMouseUp, setMarqueeRect]);

  return { isSelectingRef, addToSelectionRef, handleMouseMove, handleMouseUp };
}

// ---------------------------------------------------------------------------

interface StableMarqueeRefs {
  marqueeRectRef: React.MutableRefObject<MarqueeRect | null>;
  onSelectionChangeRef: React.MutableRefObject<
    (taskIds: TaskId[], addToSelection: boolean) => void
  >;
  taskGeometriesRef: React.MutableRefObject<TaskGeometry[]>;
}

/**
 * Creates and keeps current the stable refs for marquee rect, selection-change
 * callback, and task geometries. Extracted to keep useMarqueeSelection slim.
 */
function useStableMarqueeRefs(
  marqueeRect: MarqueeRect | null,
  onSelectionChange: (taskIds: TaskId[], addToSelection: boolean) => void,
  taskGeometries: TaskGeometry[]
): StableMarqueeRefs {
  const marqueeRectRef = useRef<MarqueeRect | null>(null);
  marqueeRectRef.current = marqueeRect;

  // Stable refs for props that may change every render — prevents the active
  // drag listeners from being removed and re-added on parent re-renders.
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  const taskGeometriesRef = useRef(taskGeometries);
  taskGeometriesRef.current = taskGeometries;

  return { marqueeRectRef, onSelectionChangeRef, taskGeometriesRef };
}

// ---------------------------------------------------------------------------

export function useMarqueeSelection({
  svgRef,
  taskGeometries,
  onSelectionChange,
  enabled = true,
}: UseMarqueeSelectionOptions): UseMarqueeSelectionResult {
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);

  const { marqueeRectRef, onSelectionChangeRef, taskGeometriesRef } =
    useStableMarqueeRefs(marqueeRect, onSelectionChange, taskGeometries);

  const { isSelectingRef, addToSelectionRef, handleMouseMove, handleMouseUp } =
    useMarqueeDragListeners({
      svgRef,
      enabled,
      marqueeRectRef,
      onSelectionChangeRef,
      taskGeometriesRef,
      setMarqueeRect,
    });

  const onMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!shouldStartMarqueeDrag(e, enabled)) return;
      const svg = svgRef.current;
      if (!svg) return;
      const coords = getSvgCoordinates(svg, e);

      addToSelectionRef.current = e.shiftKey || e.ctrlKey || e.metaKey;
      isSelectingRef.current = true;
      setMarqueeRect({
        startX: coords.x,
        startY: coords.y,
        currentX: coords.x,
        currentY: coords.y,
      });

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      // Prevent text selection during drag.
      e.preventDefault();
    },
    [
      svgRef,
      enabled,
      addToSelectionRef,
      isSelectingRef,
      handleMouseMove,
      handleMouseUp,
    ]
  );

  return {
    marqueeRect,
    normalizedRect: marqueeRect ? normalizeRect(marqueeRect) : null,
    // Derive from state rather than a ref so the value is always reactive.
    isSelecting: marqueeRect !== null,
    onMouseDown,
  };
}
