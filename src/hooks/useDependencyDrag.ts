/**
 * useDependencyDrag - Hook for dependency drag interaction
 * Manages the state and logic for creating dependencies via drag.
 * Sprint 1.4 - Dependencies (Finish-to-Start Only)
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { Task } from "../types/chart.types";
import type { TaskId } from "../types/branded.types";
import type { DependencyDragState } from "../types/dependency.types";
import { useDependencyStore } from "../store/slices/dependencySlice";
import { clientToSvgCoords } from "../utils/svgCoords";
import toast from "react-hot-toast";

interface UseDependencyDragOptions {
  tasks: Task[];
  svgRef?: React.RefObject<SVGSVGElement | null>;
  enabled?: boolean;
}

interface UseDependencyDragReturn {
  dragState: DependencyDragState;
  startDrag: (
    taskId: TaskId,
    side: "start" | "end",
    e: React.MouseEvent
  ) => void;
  updateDragPosition: (e: MouseEvent | React.MouseEvent) => void;
  endDrag: (targetTaskId?: TaskId) => void;
  cancelDrag: () => void;
  isValidTarget: (taskId: TaskId) => boolean;
  isInvalidTarget: (taskId: TaskId) => boolean;
  getHoveredTaskId: (
    x: number,
    y: number,
    taskPositions: Map<
      TaskId,
      { x: number; y: number; width: number; height: number }
    >
  ) => TaskId | null;
}

/** Returns a fresh initial drag state. Using a factory avoids sharing mutable
 * Set instances across drag sessions. */
function createInitialDragState(): DependencyDragState {
  return {
    isDragging: false,
    fromTaskId: null,
    fromSide: null,
    currentPosition: { x: 0, y: 0 },
    validTargets: new Set<TaskId>(),
    invalidTargets: new Set<TaskId>(),
  };
}

/**
 * Determine which task is the dependency source and which is the target
 * based on which handle side the drag started from.
 *   end-handle drag   → fromTaskId finishes before targetTaskId starts (FS)
 *   start-handle drag → targetTaskId finishes before fromTaskId starts (FS)
 */
function resolveDependencyDirection(
  fromTaskId: TaskId,
  targetTaskId: TaskId,
  side: "start" | "end"
): { fromId: TaskId; toId: TaskId } {
  return side === "end"
    ? { fromId: fromTaskId, toId: targetTaskId }
    : { fromId: targetTaskId, toId: fromTaskId };
}

/** Classify all tasks as valid or invalid drop targets for the given drag source. */
function resolveDragTargets(
  fromTaskId: TaskId,
  side: "start" | "end",
  tasks: Task[],
  checkWouldCreateCycle: (fromId: TaskId, toId: TaskId) => { hasCycle: boolean }
): { validTargets: Set<TaskId>; invalidTargets: Set<TaskId> } {
  const validTargets = new Set<TaskId>();
  const invalidTargets = new Set<TaskId>();

  for (const task of tasks) {
    if (task.id === fromTaskId) continue;

    const { fromId, toId } = resolveDependencyDirection(
      fromTaskId,
      task.id,
      side
    );

    if (checkWouldCreateCycle(fromId, toId).hasCycle) {
      invalidTargets.add(task.id);
    } else {
      validTargets.add(task.id);
    }
  }

  return { validTargets, invalidTargets };
}

/** Get SVG-local coordinates from a mouse event, falling back to client coords
 * when no SVG element is available (e.g. during tests without a DOM). */
function getEventCoords(
  e: MouseEvent | React.MouseEvent,
  svg: SVGSVGElement | null | undefined
): { x: number; y: number } {
  return svg
    ? clientToSvgCoords(e.clientX, e.clientY, svg)
    : { x: e.clientX, y: e.clientY };
}

const DEPENDENCY_DRAG_MESSAGES = {
  created: (fromName: string, toName: string) =>
    `Dependency created: ${fromName} → ${toName}`,
  failed: (error?: string) => error ?? "Failed to create dependency",
  wouldCreateCycle: "Cannot create: Would create circular dependency",
} as const;

/** Options for attempting to create a dependency after a drag. */
interface AttemptCreateDependencyOptions {
  fromTaskId: TaskId;
  targetTaskId: TaskId;
  fromSide: "start" | "end";
  validTargets: Set<TaskId>;
  invalidTargets: Set<TaskId>;
  tasks: Task[];
  addDependency: (
    fromId: TaskId,
    toId: TaskId
  ) => { success: boolean; error?: string };
}

/** Attempt to create a dependency and show a toast for success or failure. */
function attemptCreateDependency({
  fromTaskId,
  targetTaskId,
  fromSide,
  validTargets,
  invalidTargets,
  tasks,
  addDependency,
}: AttemptCreateDependencyOptions): void {
  if (validTargets.has(targetTaskId)) {
    const { fromId, toId } = resolveDependencyDirection(
      fromTaskId,
      targetTaskId,
      fromSide
    );

    const result = addDependency(fromId, toId);

    if (result.success) {
      const fromTask = tasks.find((t) => t.id === fromId);
      const toTask = tasks.find((t) => t.id === toId);
      toast.success(
        DEPENDENCY_DRAG_MESSAGES.created(
          fromTask?.name ?? "?",
          toTask?.name ?? "?"
        )
      );
    } else {
      toast.error(DEPENDENCY_DRAG_MESSAGES.failed(result.error));
    }
  } else if (invalidTargets.has(targetTaskId)) {
    toast.error(DEPENDENCY_DRAG_MESSAGES.wouldCreateCycle);
  }
}

/** Find which task (if any) contains the given SVG-local point. */
function findHoveredTaskId(
  x: number,
  y: number,
  taskPositions: Map<
    TaskId,
    { x: number; y: number; width: number; height: number }
  >
): TaskId | null {
  for (const [taskId, pos] of taskPositions) {
    if (
      x >= pos.x &&
      x <= pos.x + pos.width &&
      y >= pos.y &&
      y <= pos.y + pos.height
    ) {
      return taskId;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Private sub-hooks (not exported — used only by useDependencyDrag)
// ---------------------------------------------------------------------------

/** Provides stable callbacks to classify drop targets during a dependency drag.
 * useCallback is keyed on the Set reference, which is a NEW instance each drag
 * start but STABLE during position updates, so consumers don't re-render on
 * every mousemove frame yet still update when a new drag session begins. */
function useDragTargetClassifier(dragState: DependencyDragState): {
  isValidTarget: (taskId: TaskId) => boolean;
  isInvalidTarget: (taskId: TaskId) => boolean;
} {
  const isValidTarget = useCallback(
    (taskId: TaskId): boolean => dragState.validTargets.has(taskId),
    [dragState.validTargets]
  );

  const isInvalidTarget = useCallback(
    (taskId: TaskId): boolean => dragState.invalidTargets.has(taskId),
    [dragState.invalidTargets]
  );

  return { isValidTarget, isInvalidTarget };
}

/** Return type for useDragSession. */
interface DragSession {
  dragState: DependencyDragState;
  startDrag: (
    taskId: TaskId,
    side: "start" | "end",
    e: React.MouseEvent
  ) => void;
  endDrag: (targetTaskId?: TaskId) => void;
  cancelDrag: () => void;
  updateDragPosition: (e: MouseEvent | React.MouseEvent) => void;
}

/**
 * Owns all drag session state and the four callbacks (startDrag, endDrag,
 * cancelDrag, updateDragPosition). Extracted from useDependencyDrag to keep
 * both functions under the 50-line limit.
 *
 * tasksRef and dragStateRef are stable refs so callbacks stay stable across
 * task-list or drag-state changes without re-registering global listeners.
 */
function useDragSession(
  enabled: boolean,
  checkWouldCreateCycle: (
    fromId: TaskId,
    toId: TaskId
  ) => { hasCycle: boolean },
  addDependency: (
    fromId: TaskId,
    toId: TaskId
  ) => { success: boolean; error?: string },
  svgRef: React.RefObject<SVGSVGElement | null> | undefined,
  tasksRef: { current: Task[] }
): DragSession {
  const [dragState, setDragState] = useState<DependencyDragState>(
    createInitialDragState
  );
  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;

  // Calculate valid and invalid targets when starting drag.
  // tasksRef is always current so startDrag stays stable across task-list changes.
  const startDrag = useCallback(
    (taskId: TaskId, side: "start" | "end", e: React.MouseEvent): void => {
      if (!enabled) return;

      const { validTargets, invalidTargets } = resolveDragTargets(
        taskId,
        side,
        tasksRef.current,
        checkWouldCreateCycle
      );

      const { x, y } = getEventCoords(e, svgRef?.current);
      setDragState({
        isDragging: true,
        fromTaskId: taskId,
        fromSide: side,
        currentPosition: { x, y },
        validTargets,
        invalidTargets,
      });
    },
    [enabled, checkWouldCreateCycle, svgRef] // tasksRef is always current — no tasks dep
  );

  // End drag and potentially create a dependency.
  // addDependency is stable; task names and drag state are read via refs.
  const endDrag = useCallback(
    (targetTaskId?: TaskId): void => {
      const { fromTaskId, fromSide, validTargets, invalidTargets } =
        dragStateRef.current;

      if (!fromTaskId || !fromSide) {
        setDragState(createInitialDragState());
        return;
      }

      if (targetTaskId) {
        attemptCreateDependency({
          fromTaskId,
          targetTaskId,
          fromSide,
          validTargets,
          invalidTargets,
          tasks: tasksRef.current,
          addDependency,
        });
      }

      setDragState(createInitialDragState());
    },
    [addDependency] // stable: drag state via dragStateRef, task names via tasksRef
  );

  const cancelDrag = useCallback((): void => {
    setDragState(createInitialDragState());
  }, []);

  // Tracks the current cursor position in SVG-local coordinates during a drag.
  const updateDragPosition = useCallback(
    (e: MouseEvent | React.MouseEvent): void => {
      const { x, y } = getEventCoords(e, svgRef?.current);
      setDragState((prev) => ({ ...prev, currentPosition: { x, y } }));
    },
    [svgRef]
  );

  return { dragState, startDrag, endDrag, cancelDrag, updateDragPosition };
}

/** Attaches global mouse/keyboard listeners for the duration of a dependency drag. */
function useDragGlobalEvents(
  isDragging: boolean,
  updateDragPosition: (e: MouseEvent) => void,
  endDrag: (targetTaskId?: TaskId) => void,
  cancelDrag: () => void
): void {
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseUp = (): void => {
      // Drop outside any task — reset drag state without creating a dependency.
      // Callers pass an explicit targetTaskId to endDrag when dropping on a task.
      endDrag();
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        cancelDrag();
      }
    };

    // updateDragPosition accepts (MouseEvent | React.MouseEvent) which is a
    // supertype of MouseEvent, so it satisfies the addEventListener callback
    // signature via function parameter contravariance.
    document.addEventListener("mousemove", updateDragPosition);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousemove", updateDragPosition);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDragging, updateDragPosition, endDrag, cancelDrag]);
}

export function useDependencyDrag({
  tasks,
  svgRef,
  enabled = true,
}: UseDependencyDragOptions): UseDependencyDragReturn {
  // Keep latest tasks in a ref so endDrag (used only for toast labels) stays
  // stable and doesn't force re-registration of global mouse listeners.
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const { addDependency, checkWouldCreateCycle } = useDependencyStore();

  const { dragState, startDrag, endDrag, cancelDrag, updateDragPosition } =
    useDragSession(
      enabled,
      checkWouldCreateCycle,
      addDependency,
      svgRef,
      tasksRef
    );

  const { isValidTarget, isInvalidTarget } = useDragTargetClassifier(dragState);

  // Cancel any in-progress drag if the feature is disabled externally.
  // cancelDrag is stable (no deps), so this only re-runs when isDragging or
  // enabled changes — not on every task update.
  useEffect(() => {
    if (!enabled && dragState.isDragging) {
      cancelDrag();
    }
  }, [enabled, dragState.isDragging, cancelDrag]);

  // Handle global mouse events during drag.
  // endDrag and cancelDrag are stable (no tasks dep), so this re-registers
  // only when isDragging toggles — not on every task change.
  useDragGlobalEvents(
    dragState.isDragging,
    updateDragPosition,
    endDrag,
    cancelDrag
  );

  return {
    dragState,
    startDrag,
    updateDragPosition,
    endDrag,
    cancelDrag,
    isValidTarget,
    isInvalidTarget,
    getHoveredTaskId: findHoveredTaskId, // stable module-level reference, no useCallback needed
  };
}
