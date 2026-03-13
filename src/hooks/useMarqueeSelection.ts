/**
 * useMarqueeSelection - Hook for rectangular marquee selection in timeline
 * Allows users to drag a rectangle to select multiple tasks at once
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { TaskId } from "@/types/branded.types";

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
 * Check if two rectangles intersect (including touching edges).
 *
 * @param rect1 - First rectangle with `x`, `y`, `width`, `height` in the same coordinate space.
 * @param rect2 - Second rectangle with `x`, `y`, `width`, `height` in the same coordinate space.
 * @returns `true` when the rectangles overlap or share an edge, `false` when they are fully separate.
 *
 * @example
 * rectsIntersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 }); // true
 * rectsIntersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 0, width: 10, height: 10 }); // false
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
 * Normalize a marquee rect so that `width` and `height` are always positive,
 * regardless of the direction the user dragged.
 *
 * @param rect - Raw marquee rect from drag state (start and current coordinates).
 * @returns Normalized rect with `x`/`y` set to the top-left corner and positive `width`/`height`.
 *
 * @example
 * // Drag from bottom-right to top-left
 * normalizeRect({ startX: 100, startY: 100, currentX: 10, currentY: 20 });
 * // => { x: 10, y: 20, width: 90, height: 80 }
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
 * Convert mouse client coordinates to SVG-local coordinates.
 * Extracted as a module-level pure function — reads no closed-over state,
 * so it does not need useCallback inside the hook.
 *
 * Accepts any object with `clientX`/`clientY` so both native `MouseEvent`
 * (document listeners) and React synthetic events (onMouseDown) can be passed
 * without an explicit union type.
 */
function getSvgCoordinates(
  svg: SVGSVGElement,
  e: { clientX: number; clientY: number }
): { x: number; y: number } {
  const rect = svg.getBoundingClientRect();
  // clientX/Y are already viewport-relative; subtracting the SVG bounding rect
  // gives coordinates local to the SVG element. This assumes the SVG itself is
  // not independently scrollable — if that ever changes, scroll offsets must be
  // added here (svg.scrollLeft / svg.scrollTop).
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
  // SVGSVGElement events always target SVG/HTML Elements — never a bare Text node.
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
    // Intentionally omitted from dep array: svgRef, isSelectingRef — both are
    // stable ref objects whose identity never changes across re-renders. Listing
    // them would mislead readers into thinking the callback re-creates when the
    // ref contents change. Only setMarqueeRect (stable dispatch from useState)
    // is listed to satisfy exhaustive-deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setMarqueeRect]
  );
}

interface UseMarqueeMouseUpHandlerDeps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  isSelectingRef: React.MutableRefObject<boolean>;
  addToSelectionRef: React.MutableRefObject<boolean>;
  marqueeRectRef: React.MutableRefObject<MarqueeRect | null>;
  onSelectionChangeRef: React.MutableRefObject<
    (taskIds: TaskId[], addToSelection: boolean) => void
  >;
  taskGeometriesRef: React.MutableRefObject<TaskGeometry[]>;
  setMarqueeRect: React.Dispatch<React.SetStateAction<MarqueeRect | null>>;
  handleMouseMove: (e: MouseEvent) => void;
  /** Ref to self so the callback can deregister without a self-referential
   *  dependency (which would require the function in its own dep array,
   *  causing a circular re-creation on every render). */
  selfRef: React.MutableRefObject<(e: MouseEvent) => void>;
}

/**
 * Stable mouseup handler: finalises selection and removes drag listeners.
 * Uses a handler ref so the callback can deregister itself without a
 * self-referential closure, and accepts handleMouseMove to remove it too.
 * Extracted to keep useMarqueeDragListeners under 50 lines.
 */
function useMarqueeMouseUpHandler({
  svgRef,
  isSelectingRef,
  addToSelectionRef,
  marqueeRectRef,
  onSelectionChangeRef,
  taskGeometriesRef,
  setMarqueeRect,
  handleMouseMove,
  selfRef,
}: UseMarqueeMouseUpHandlerDeps): (e: MouseEvent) => void {
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
    // Refs (svgRef, isSelectingRef, addToSelectionRef, marqueeRectRef,
    // onSelectionChangeRef, taskGeometriesRef, selfRef) are stable objects whose
    // identity never changes — listing them would mislead readers into thinking
    // the callback re-creates when ref contents change. Only the non-ref values
    // that genuinely gate re-creation are listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setMarqueeRect, handleMouseMove]
  );
}

/**
 * Owns the document-level drag listeners (mousemove / mouseup), the mutable
 * refs that track drag state, and the cleanup effect.
 *
 * Handlers are attached and detached exclusively via stable wrapper refs, so
 * cleanup always removes the same function object that was registered — even
 * if the underlying useCallback implementations are re-created after a
 * dependency change during an active drag.
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
  // Stable ref to handleMouseMove for consistent add/remove identity.
  const handleMouseMoveRef = useRef<(e: MouseEvent) => void>(() => undefined);

  // Stable wrapper functions: created once at mount by reading `.current` from
  // a one-time useRef call, so their identity never changes across re-renders.
  // They delegate to the *current* ref value, meaning the document listener is
  // always the same function object even when the inner useCallback handlers
  // re-create due to a dep change — this prevents mismatched add/removeEventListener
  // pairs that would leave orphaned listeners during an active drag.
  const stableMouseMove = useRef<(e: MouseEvent) => void>((e) =>
    handleMouseMoveRef.current(e)
  ).current;
  const stableMouseUp = useRef<(e: MouseEvent) => void>((e) =>
    handleMouseUpRef.current(e)
  ).current;

  const handleMouseMove = useMarqueeMouseMoveHandler(
    svgRef,
    isSelectingRef,
    setMarqueeRect
  );
  // Keep the ref current so the stable wrapper always delegates to the latest version.
  handleMouseMoveRef.current = handleMouseMove;

  const handleMouseUp = useMarqueeMouseUpHandler({
    svgRef,
    isSelectingRef,
    addToSelectionRef,
    marqueeRectRef,
    onSelectionChangeRef,
    taskGeometriesRef,
    setMarqueeRect,
    handleMouseMove: stableMouseMove,
    selfRef: handleMouseUpRef,
  });
  // Keep the ref current so the stable wrapper always delegates to the latest version.
  handleMouseUpRef.current = handleMouseUp;

  // Cancel an active drag when `enabled` turns false mid-drag, and clean up
  // listeners on unmount. Combined into one effect: the cleanup function always
  // runs on unmount so a separate effect for that is not needed.
  // Uses stable wrappers so cleanup always removes the registered listener
  // identity, avoiding orphaned document listeners on rapid re-renders.
  useEffect(() => {
    if (!enabled && isSelectingRef.current) {
      isSelectingRef.current = false;
      setMarqueeRect(null);
      document.removeEventListener("mousemove", stableMouseMove);
      document.removeEventListener("mouseup", stableMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", stableMouseMove);
      document.removeEventListener("mouseup", stableMouseUp);
    };
  }, [enabled, stableMouseMove, stableMouseUp, setMarqueeRect]);

  return {
    isSelectingRef,
    addToSelectionRef,
    handleMouseMove: stableMouseMove,
    handleMouseUp: stableMouseUp,
  };
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
    // svgRef, addToSelectionRef, isSelectingRef are stable ref objects whose
    // identity never changes — omitting them from the dep array is intentional
    // and consistent with the ref pattern used throughout this hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, handleMouseMove, handleMouseUp]
  );

  return {
    marqueeRect,
    normalizedRect: marqueeRect ? normalizeRect(marqueeRect) : null,
    // Derive from state rather than a ref so the value is always reactive.
    isSelecting: marqueeRect !== null,
    onMouseDown,
  };
}
