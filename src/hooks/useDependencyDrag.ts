/**
 * useDependencyDrag - Hook for dependency drag interaction
 * Manages the state and logic for creating dependencies via drag.
 * Sprint 1.4 - Dependencies (Finish-to-Start Only)
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { Task } from "@/types/chart.types";
import type { TaskId } from "@/types/branded.types";
import type { DependencyDragState } from "@/types/dependency.types";
import { useDependencyStore } from "@/store/slices/dependencySlice";
import { clientToSvgCoords } from "@/utils/svgCoords";
import toast from "react-hot-toast";

/** Adds a finish-to-start dependency; returns success/failure with an optional message. */
type AddDependencyFn = (
  fromId: TaskId,
  toId: TaskId
) => { success: boolean; error?: string };

/** Checks whether adding a dependency would create a cycle in the graph. */
type CheckCycleFn = (fromId: TaskId, toId: TaskId) => { hasCycle: boolean };

export interface UseDependencyDragOptions {
  tasks: Task[];
  svgRef?: React.RefObject<SVGSVGElement | null>;
  enabled?: boolean;
}

export interface UseDependencyDragReturn {
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
  checkWouldCreateCycle: CheckCycleFn
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
  // Shown when the drop target was added to the task list after drag start and
  // is therefore absent from the pre-computed valid/invalid sets.
  unknownTarget:
    "Cannot create dependency: target not available, please try again",
} as const;

/** Options for attempting to create a dependency after a drag. */
interface AttemptCreateDependencyOptions {
  fromTaskId: TaskId;
  targetTaskId: TaskId;
  fromSide: "start" | "end";
  validTargets: Set<TaskId>;
  invalidTargets: Set<TaskId>;
  tasks: Task[];
  addDependency: AddDependencyFn;
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
  } else {
    // Task was added to the task list after this drag started and is absent from
    // the pre-computed target sets. Surface the failure so the drop is not silent.
    toast.error(DEPENDENCY_DRAG_MESSAGES.unknownTarget);
  }
}

/**
 * Find which task contains the given SVG-local point.
 * O(n) — acceptable for typical gantt charts (<500 visible tasks at 60fps).
 * If drag performance becomes an issue, consider a spatial index (e.g. interval tree).
 */
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
// Module-level helper extracted from useDragCommitter (pure logic, no React state)
// ---------------------------------------------------------------------------

/** Context for performEndDrag — all stable refs/setters so the useCallback
 * that calls this function keeps a minimal, stable dependency array. */
interface EndDragContext {
  dragStateRef: { current: DependencyDragState };
  tasksRef: { current: Task[] };
  addDependency: AddDependencyFn;
  setDragState: (s: DependencyDragState) => void;
}

/** Pure logic extracted from useDragCommitter.endDrag to keep the hook body
 * under the 50-line limit without losing any logic. */
function performEndDrag(
  targetTaskId: TaskId | undefined,
  ctx: EndDragContext
): void {
  const { fromTaskId, fromSide, validTargets, invalidTargets } =
    ctx.dragStateRef.current;

  if (!fromTaskId || !fromSide) {
    ctx.setDragState(createInitialDragState());
    return;
  }

  if (targetTaskId === fromTaskId) {
    // Dropped on source task — not a valid target (excluded from both sets)
    ctx.setDragState(createInitialDragState());
    return;
  }

  if (targetTaskId) {
    attemptCreateDependency({
      fromTaskId,
      targetTaskId,
      fromSide,
      validTargets,
      invalidTargets,
      tasks: ctx.tasksRef.current,
      addDependency: ctx.addDependency,
    });
  }

  ctx.setDragState(createInitialDragState());
}

// ---------------------------------------------------------------------------
// Private sub-hooks (not exported — used only by useDependencyDrag)
// ---------------------------------------------------------------------------

/** Creates stable startDrag and cancelDrag callbacks for a drag session. */
function useDragInitiators(
  enabled: boolean,
  checkWouldCreateCycle: CheckCycleFn,
  svgRef: React.RefObject<SVGSVGElement | null> | undefined,
  tasksRef: { current: Task[] },
  setDragState: React.Dispatch<React.SetStateAction<DependencyDragState>>
): {
  startDrag: (
    taskId: TaskId,
    side: "start" | "end",
    e: React.MouseEvent
  ) => void;
  cancelDrag: () => void;
} {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tasksRef is a stable ref; .current read imperatively
    [enabled, checkWouldCreateCycle, svgRef, setDragState]
  );

  const cancelDrag = useCallback((): void => {
    setDragState(createInitialDragState());
  }, [setDragState]);

  return { startDrag, cancelDrag };
}

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

/** RAF-throttled hook that produces a stable drag-position updater.
 * Coordinates are captured synchronously from the event (SyntheticEvent objects
 * may be recycled by React), then the state update is deferred to the next
 * animation frame. Callers should not expect synchronous state updates. */
function useRAFPositionUpdater(
  svgRef: React.RefObject<SVGSVGElement | null> | undefined,
  setDragState: React.Dispatch<React.SetStateAction<DependencyDragState>>
): (e: MouseEvent | React.MouseEvent) => void {
  const rafRef = useRef<number | null>(null);

  const updateDragPosition = useCallback(
    (e: MouseEvent | React.MouseEvent): void => {
      const coords = getEventCoords(e, svgRef?.current);
      if (rafRef.current !== null) return; // frame already scheduled — skip
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setDragState((prev) => ({ ...prev, currentPosition: coords }));
      });
    },
    [svgRef, setDragState]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return updateDragPosition;
}

/** Owns endDrag and updateDragPosition. Extracted from useDragSession to keep
 * both hooks under the 50-line limit.
 *
 * All parameters are stable refs or store actions so both callbacks remain
 * stable across task-list and drag-state changes. */
function useDragCommitter(
  svgRef: React.RefObject<SVGSVGElement | null> | undefined,
  dragStateRef: { current: DependencyDragState },
  tasksRef: { current: Task[] },
  addDependency: AddDependencyFn,
  setDragState: React.Dispatch<React.SetStateAction<DependencyDragState>>
): {
  endDrag: (targetTaskId?: TaskId) => void;
  updateDragPosition: (e: MouseEvent | React.MouseEvent) => void;
} {
  // End drag and potentially create a dependency.
  // Delegates to performEndDrag so this callback stays under 10 lines.
  const endDrag = useCallback(
    (targetTaskId?: TaskId): void => {
      performEndDrag(targetTaskId, {
        dragStateRef,
        tasksRef,
        addDependency,
        setDragState,
      });
    },
    [addDependency, dragStateRef, tasksRef, setDragState] // all stable: refs + store action
  );

  const updateDragPosition = useRAFPositionUpdater(svgRef, setDragState);

  return { endDrag, updateDragPosition };
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
  checkWouldCreateCycle: CheckCycleFn,
  addDependency: AddDependencyFn,
  svgRef: React.RefObject<SVGSVGElement | null> | undefined,
  tasksRef: { current: Task[] }
): DragSession {
  const [dragState, setDragState] = useState<DependencyDragState>(
    createInitialDragState
  );
  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;

  const { startDrag, cancelDrag } = useDragInitiators(
    enabled,
    checkWouldCreateCycle,
    svgRef,
    tasksRef,
    setDragState
  );

  const { endDrag, updateDragPosition } = useDragCommitter(
    svgRef,
    dragStateRef,
    tasksRef,
    addDependency,
    setDragState
  );

  return { dragState, startDrag, endDrag, cancelDrag, updateDragPosition };
}

/** Attaches global mouse/keyboard listeners for the duration of a dependency drag. */
function useDragGlobalEvents(
  isDragging: boolean,
  updateDragPosition: (e: MouseEvent | React.MouseEvent) => void,
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

/** Wires the two lifecycle concerns for a dependency drag session:
 *   1. Cancel an in-progress drag when the feature is disabled externally.
 *   2. Attach/detach global mouse and keyboard listeners while dragging.
 * Extracted from useDependencyDrag to keep the main hook under 50 lines. */
function useDragLifecycle(
  enabled: boolean,
  dragState: DependencyDragState,
  cancelDrag: () => void,
  updateDragPosition: (e: MouseEvent | React.MouseEvent) => void,
  endDrag: (targetTaskId?: TaskId) => void
): void {
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

  const addDependency = useDependencyStore((s) => s.addDependency);
  const checkWouldCreateCycle = useDependencyStore(
    (s) => s.checkWouldCreateCycle
  );

  const { dragState, startDrag, endDrag, cancelDrag, updateDragPosition } =
    useDragSession(
      enabled,
      checkWouldCreateCycle,
      addDependency,
      svgRef,
      tasksRef
    );

  const { isValidTarget, isInvalidTarget } = useDragTargetClassifier(dragState);

  useDragLifecycle(enabled, dragState, cancelDrag, updateDragPosition, endDrag);

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
