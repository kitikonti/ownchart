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

const DEPENDENCY_DRAG_MESSAGES = {
  created: (fromName: string, toName: string) =>
    `Dependency created: ${fromName} → ${toName}`,
  failed: (error?: string) => error ?? "Failed to create dependency",
  wouldCreateCycle: "Cannot create: Would create circular dependency",
} as const;

/** Attempt to create a dependency and show a toast for success or failure. */
function attemptCreateDependency(
  fromTaskId: TaskId,
  targetTaskId: TaskId,
  fromSide: "start" | "end",
  validTargets: Set<TaskId>,
  invalidTargets: Set<TaskId>,
  tasks: Task[],
  addDependency: (
    fromId: TaskId,
    toId: TaskId
  ) => { success: boolean; error?: string }
): void {
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

/** Attaches global mouse/keyboard listeners for the duration of a dependency drag. */
function useDragGlobalEvents(
  isDragging: boolean,
  updateDragPosition: (e: MouseEvent) => void,
  endDrag: (targetTaskId?: TaskId) => void,
  cancelDrag: () => void
): void {
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent): void => {
      updateDragPosition(e);
    };

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

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
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
  const [dragState, setDragState] = useState<DependencyDragState>(
    createInitialDragState
  );
  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;

  // Keep latest tasks in a ref so endDrag (used only for toast labels) stays
  // stable and doesn't force re-registration of global mouse listeners.
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const { addDependency, checkWouldCreateCycle } = useDependencyStore();

  // Calculate valid and invalid targets when starting drag.
  // Reads the task list via tasksRef so startDrag stays stable across task
  // list changes — matching the same pattern used for endDrag.
  const startDrag = useCallback(
    (taskId: TaskId, side: "start" | "end", e: React.MouseEvent): void => {
      if (!enabled) return;

      const { validTargets, invalidTargets } = resolveDragTargets(
        taskId,
        side,
        tasksRef.current,
        checkWouldCreateCycle
      );

      // Get initial position from event, converting to SVG-local coords if possible
      const svg = svgRef?.current;
      const { x, y } = svg
        ? clientToSvgCoords(e.clientX, e.clientY, svg)
        : { x: e.clientX, y: e.clientY };

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

  // Update drag position
  const updateDragPosition = useCallback(
    (e: MouseEvent | React.MouseEvent): void => {
      const svg = svgRef?.current;
      const { x, y } = svg
        ? clientToSvgCoords(e.clientX, e.clientY, svg)
        : { x: e.clientX, y: e.clientY };

      setDragState((prev) => ({ ...prev, currentPosition: { x, y } }));
    },
    [svgRef]
  );

  // End drag and potentially create dependency
  const endDrag = useCallback(
    (targetTaskId?: TaskId): void => {
      const { fromTaskId, fromSide, validTargets, invalidTargets } =
        dragStateRef.current;

      if (!fromTaskId || !fromSide) {
        setDragState(createInitialDragState());
        return;
      }

      if (targetTaskId) {
        attemptCreateDependency(
          fromTaskId,
          targetTaskId,
          fromSide,
          validTargets,
          invalidTargets,
          tasksRef.current,
          addDependency
        );
      }

      setDragState(createInitialDragState());
    },
    [addDependency] // stable: task names read via tasksRef, drag state via dragStateRef
  );

  // Cancel drag without creating dependency
  const cancelDrag = useCallback((): void => {
    setDragState(createInitialDragState());
  }, []);

  // `validTargets`/`invalidTargets` are NEW Set instances each drag start but
  // the SAME references during position updates (spread in updateDragPosition
  // preserves them). useCallback keyed on the Set reference therefore prevents
  // consumer re-renders during rapid mousemove events while still updating when
  // a new drag session begins.
  const isValidTarget = useCallback(
    (taskId: TaskId): boolean => {
      return dragState.validTargets.has(taskId);
    },
    [dragState.validTargets]
  );

  const isInvalidTarget = useCallback(
    (taskId: TaskId): boolean => {
      return dragState.invalidTargets.has(taskId);
    },
    [dragState.invalidTargets]
  );

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
