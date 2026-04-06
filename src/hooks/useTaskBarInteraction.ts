/**
 * Task bar interaction hook for drag-to-move and drag-to-resize functionality.
 * Thin orchestrator — pure logic lives in src/utils/taskBarDragHelpers.
 *
 * Uses ref-based stable listeners to avoid stale closures and fragile cleanup.
 * Document event handlers always delegate to the latest handler via refs.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { addDays } from "@/utils/dateUtils";
import { getEffectiveTasksToMove } from "@/utils/hierarchy";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useChartStore } from "@/store/slices/chartSlice";
import { useDependencyStore } from "@/store/slices/dependencySlice";
import { getSVGPoint } from "@/utils/svgUtils";
import {
  calculateInitialLag,
  calculateConstrainedDates,
} from "@/utils/graph/dateAdjustment";
import toast from "react-hot-toast";
import {
  detectInteractionZone,
  determineInteractionMode,
  pixelsToDeltaDays,
  computeEndDateForDrag,
  computeResizePreview,
  calculateDeltaDaysFromDates,
  buildMoveUpdates,
  buildResizeUpdate,
} from "@/utils/taskBarDragHelpers";
import type { Task } from "@/types/chart.types";
import type { TaskId } from "@/types/branded.types";
import type { Dependency } from "@/types/dependency.types";
import type { TimelineScale, TaskBarGeometry } from "@/utils/timelineUtils";
import type {
  DragState,
  CursorType,
  InteractionMode,
  WorkingDaysContext,
} from "@/utils/taskBarDragHelpers";

export interface UseTaskBarInteractionReturn {
  mode: InteractionMode;
  previewGeometry: { startDate: string; endDate: string } | null;
  cursor: CursorType;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent<SVGGElement>) => void;
  onMouseMove: (e: React.MouseEvent<SVGGElement>) => void;
}

/** Build working-days context from chart store. */
function getWorkingDaysContext(): WorkingDaysContext {
  const { workingDaysMode, workingDaysConfig, holidayRegion } =
    useChartStore.getState();
  return {
    enabled: workingDaysMode,
    config: workingDaysConfig,
    holidayRegion: workingDaysConfig.excludeHolidays
      ? holidayRegion
      : undefined,
  };
}

/**
 * Determine whether this drag should cascade to successors.
 * Alt key inverts the auto-scheduling toggle:
 * - Auto-scheduling ON + no Alt  → cascade
 * - Auto-scheduling ON + Alt     → no cascade (update lag instead)
 * - Auto-scheduling OFF + no Alt → no cascade (update lag instead)
 * - Auto-scheduling OFF + Alt    → cascade
 */
function shouldCascade(altKey: boolean): boolean {
  const autoScheduling = useChartStore.getState().autoScheduling;
  return altKey ? !autoScheduling : autoScheduling;
}

/** Shared context for post-drag dependency operations. */
interface DragDependencyContext {
  tasks: Task[];
  dependencies: Dependency[];
  taskMap: Map<TaskId, Task>;
  movedSet: Set<TaskId>;
  /**
   * Calendar-day durations captured BEFORE the drag update was applied.
   * Used by snapSuccessorToConstraint to restore the correct duration when
   * working-days mode is on (the drag may have shortened the calendar span
   * to match the working-day count).
   */
  preDragDurations: Map<TaskId, number>;
}

/**
 * Build the shared lookup structures needed by autoUpdateLag and
 * snapSuccessorToConstraint.
 *
 * @param movedTaskIds - IDs of tasks being dragged
 * @param preDragDurations - Calendar-day durations before the drag update.
 *   When not provided, current durations from the store are used (which is
 *   correct for autoUpdateLag but incorrect for snap-back in working-days mode).
 */
function buildDragDependencyContext(
  movedTaskIds: TaskId[],
  preDragDurations?: Map<TaskId, number>
): DragDependencyContext {
  const { tasks } = useTaskStore.getState();
  const { dependencies } = useDependencyStore.getState();
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  return {
    tasks,
    dependencies,
    taskMap,
    movedSet: new Set(movedTaskIds),
    preDragDurations:
      preDragDurations ?? new Map(tasks.map((t) => [t.id, t.duration ?? 1])),
  };
}

/**
 * When a drag does NOT cascade, recalculate lag on all dependencies
 * involving the moved tasks so the dependency "absorbs" the position change.
 * Checks both directions: moved task as predecessor OR as successor.
 *
 * TODO: This bypasses undo/redo — it uses useDependencyStore.setState()
 * directly instead of recording a history command. Lag updates during drag
 * are intentionally silent; a proper solution would batch them into the
 * parent drag command.
 */
function autoUpdateLag(ctx: DragDependencyContext): void {
  for (const dep of ctx.dependencies) {
    // Update lag if either end of the dependency was moved
    if (!ctx.movedSet.has(dep.fromTaskId) && !ctx.movedSet.has(dep.toTaskId))
      continue;
    const predecessor = ctx.taskMap.get(dep.fromTaskId);
    const successor = ctx.taskMap.get(dep.toTaskId);
    if (!predecessor || !successor) continue;

    const newLag = calculateInitialLag(
      { startDate: predecessor.startDate, endDate: predecessor.endDate },
      { startDate: successor.startDate, endDate: successor.endDate },
      dep.type
    );
    if (newLag !== (dep.lag ?? 0)) {
      // Update lag directly in store without triggering the panel-edit
      // enforce-constraints logic (which would move the successor).
      useDependencyStore.setState((state) => {
        const idx = state.dependencies.findIndex((d) => d.id === dep.id);
        if (idx !== -1) state.dependencies[idx].lag = newLag;
      });
    }
  }
}

/**
 * After a successor task is moved, snap it back to the constraint position
 * defined by its predecessor dependencies. This enforces bidirectional
 * constraints: the successor can't freely move away from its predecessor.
 */
function snapSuccessorToConstraint(ctx: DragDependencyContext): void {
  const { updateTask } = useTaskStore.getState();

  for (const dep of ctx.dependencies) {
    // Only snap tasks that were moved AND are successors
    if (!ctx.movedSet.has(dep.toTaskId)) continue;
    const predecessor = ctx.taskMap.get(dep.fromTaskId);
    const successor = ctx.taskMap.get(dep.toTaskId);
    if (!predecessor || !successor) continue;

    // Use the pre-drag calendar duration so that working-days mode doesn't
    // silently shrink tasks. The drag may have shortened the calendar span
    // to match the working-day count (e.g., Mon-Sun 7d → Mon-Fri 5d), but
    // the constraint should place the task back with its original span.
    const preDragDuration = ctx.preDragDurations.get(dep.toTaskId) ?? 1;
    const duration = preDragDuration > 0 ? preDragDuration : 1;
    const constrained = calculateConstrainedDates(
      { startDate: predecessor.startDate, endDate: predecessor.endDate },
      duration,
      dep.type,
      dep.lag ?? 0
    );

    // Snap back if the task moved away from its constraint position.
    // Use forceAutoSchedule so the snap-back cascades to the task's own
    // successors (e.g., A→B→C: dragging B snaps B back AND updates C).
    // Include duration so it's restored to the pre-drag calendar span —
    // otherwise a stale duration value causes the same bug on the next drag.
    if (
      constrained.startDate !== successor.startDate ||
      constrained.endDate !== successor.endDate
    ) {
      updateTask(
        dep.toTaskId,
        {
          startDate: constrained.startDate,
          endDate: constrained.endDate,
          duration,
        },
        { forceAutoSchedule: true }
      );
      toast(
        `"${successor.name}" is constrained by a dependency. Hold Alt while dragging to move independently.`
      );
    }
  }
}

/** Commit a drag-move operation to the store. */
function executeDragMoveCommit(
  current: DragState,
  taskId: TaskId,
  altKey: boolean = false
): void {
  const previewStart = current.currentPreviewStart || current.originalStartDate;
  const deltaDays = calculateDeltaDaysFromDates(
    current.originalStartDate,
    previewStart
  );
  if (deltaDays === 0) return;

  const { tasks, selectedTaskIds, updateMultipleTasks } =
    useTaskStore.getState();
  const tasksToMove = selectedTaskIds.includes(taskId)
    ? selectedTaskIds
    : [taskId];
  const effectiveTaskIds = getEffectiveTasksToMove(tasks, tasksToMove);

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const ctx = getWorkingDaysContext();
  const updates = buildMoveUpdates(effectiveTaskIds, taskMap, deltaDays, ctx);

  if (updates.length > 0) {
    // Capture calendar-day durations BEFORE the update is applied.
    // The drag may shorten the calendar span (working-days preservation),
    // but snap-back needs the original span to avoid shrinking tasks.
    const preDragDurations = new Map<TaskId, number>(
      tasks.map((t) => [t.id, t.duration ?? 1])
    );

    const cascade = shouldCascade(altKey);
    if (cascade) {
      // Cascade: propagate date constraints to successors.
      // Use forceAutoSchedule when Alt inverts OFF→ON.
      updateMultipleTasks(updates, { forceAutoSchedule: true });
      // If a successor was dragged, snap it back to its constraint position
      // (propagateDateChanges only cascades forward from predecessors)
      const depCtx = buildDragDependencyContext(
        effectiveTaskIds,
        preDragDurations
      );
      snapSuccessorToConstraint(depCtx);
    } else {
      // No cascade: move tasks without propagation, then update lag
      updateMultipleTasks(updates, { skipAutoSchedule: true });
      const depCtx = buildDragDependencyContext(effectiveTaskIds);
      autoUpdateLag(depCtx);
    }
  }
}

/** Commit a resize operation to the store. */
function executeResizeCommit(
  current: DragState,
  taskId: TaskId,
  fallbackTask: Task,
  altKey: boolean = false
): void {
  const { tasks, updateTask } = useTaskStore.getState();
  const freshTask = tasks.find((t) => t.id === taskId) ?? fallbackTask;
  const resizeUpdate = buildResizeUpdate(
    freshTask,
    current.currentPreviewStart,
    current.currentPreviewEnd
  );
  if (resizeUpdate) {
    const cascade = shouldCascade(altKey);
    if (cascade) {
      updateTask(taskId, resizeUpdate, { forceAutoSchedule: true });
      const ctx = buildDragDependencyContext([taskId]);
      snapSuccessorToConstraint(ctx);
    } else {
      updateTask(taskId, resizeUpdate, { skipAutoSchedule: true });
      const ctx = buildDragDependencyContext([taskId]);
      autoUpdateLag(ctx);
    }
  }
}

/**
 * Unified hook for task bar drag-to-move and drag-to-resize interactions.
 */
export function useTaskBarInteraction(
  task: Task,
  scale: TimelineScale,
  geometry: TaskBarGeometry
): UseTaskBarInteractionReturn {
  const setSharedDragState = useChartStore((state) => state.setDragState);
  const clearSharedDragState = useChartStore((state) => state.clearDragState);

  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [cursor, setCursor] = useState<CursorType>("pointer");
  const rafRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  /** Sync drag state to both React state and ref in one call. */
  const syncDragState = useCallback((value: DragState | null): void => {
    setDragState(value);
    dragStateRef.current = value;
  }, []);

  // --- Stable document listeners via refs ---
  // Handler refs are assigned in the render phase so they always capture
  // fresh closure values. The stable callbacks never change identity,
  // ensuring removeEventListener always matches addEventListener.
  const mouseMoveRef = useRef<(e: MouseEvent) => void>(() => {});
  const mouseUpRef = useRef<(e: MouseEvent) => void>(() => {});

  const stableMouseMove = useCallback(
    (e: MouseEvent): void => mouseMoveRef.current(e),
    []
  );
  const stableMouseUp = useCallback(
    (e: MouseEvent): void => mouseUpRef.current(e),
    []
  );

  // Keep document handlers fresh on every render
  mouseMoveRef.current = (e: MouseEvent): void => {
    const current = dragStateRef.current;
    if (!current || !svgRef.current) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const deltaX = e.clientX - current.startMouseX;
      const deltaDays = pixelsToDeltaDays(deltaX, scale.pixelsPerDay);

      if (current.mode === "dragging") {
        const newStart = addDays(current.originalStartDate, deltaDays);
        const ctx = getWorkingDaysContext();
        const newEnd = computeEndDateForDrag(
          newStart,
          current.originalStartDate,
          current.originalEndDate,
          deltaDays,
          task.type,
          ctx
        );

        syncDragState({
          ...current,
          currentPreviewStart: newStart,
          currentPreviewEnd: newEnd,
        });
        setSharedDragState(deltaDays, task.id);
      } else {
        const preview = computeResizePreview(current, deltaDays);
        if (!preview) return;

        syncDragState({
          ...current,
          currentPreviewStart: preview.previewStart,
          currentPreviewEnd: preview.previewEnd,
        });
      }
    });
  };

  mouseUpRef.current = (e: MouseEvent): void => {
    const current = dragStateRef.current;
    if (!current) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (current.mode === "dragging") {
      executeDragMoveCommit(current, task.id, e.altKey);
    } else {
      executeResizeCommit(current, task.id, task, e.altKey);
    }

    document.removeEventListener("mousemove", stableMouseMove);
    document.removeEventListener("mouseup", stableMouseUp);
    syncDragState(null);
    setCursor("pointer");
    svgRef.current = null;
    clearSharedDragState();
  };

  /** Start drag or resize operation. */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGGElement>): void => {
      const svg = e.currentTarget.ownerSVGElement;
      if (!svg) return;
      svgRef.current = svg;

      const svgPoint = getSVGPoint(e, svg);
      const zone = detectInteractionZone(svgPoint.x, geometry);
      const mode = determineInteractionMode(task.type, zone);

      // Resize modes need an explicit cursor; drag "grabbing" is handled by activeCursor below.
      if (mode !== "dragging") setCursor("ew-resize");

      const effectiveEndDate = task.endDate || task.startDate;
      syncDragState({
        mode,
        startX: svgPoint.x,
        startMouseX: e.clientX,
        originalStartDate: task.startDate,
        originalEndDate: effectiveEndDate,
        currentPreviewStart: task.startDate,
        currentPreviewEnd: effectiveEndDate,
      });

      document.addEventListener("mousemove", stableMouseMove);
      document.addEventListener("mouseup", stableMouseUp);
      e.preventDefault();
      e.stopPropagation();
    },
    // Only the task fields actually read inside this callback.
    // task.id and the full task object are captured by the render-phase ref
    // assignments (mouseMoveRef / mouseUpRef) which always run fresh.
    [
      task.type,
      task.startDate,
      task.endDate,
      geometry,
      syncDragState,
      stableMouseMove,
      stableMouseUp,
    ]
  );

  /** Update cursor on hover (when not dragging). */
  const handleMouseMoveForCursor = useCallback(
    (e: React.MouseEvent<SVGGElement>): void => {
      if (dragStateRef.current) return;

      if (task.type === "summary" || task.type === "milestone") {
        setCursor("grab");
        return;
      }

      const svg = e.currentTarget.ownerSVGElement;
      if (!svg) return;

      const svgPoint = getSVGPoint(e, svg);
      const zone = detectInteractionZone(svgPoint.x, geometry);
      setCursor(zone === "center" ? "grab" : "ew-resize");
    },
    [task.type, geometry]
  );

  // Cleanup on unmount — stable refs guarantee correct removal.
  // Clear shared drag state in case the component unmounts mid-drag
  // (e.g. a task is deleted while being dragged). React state (cursor /
  // dragState) is intentionally not reset here — setting state after
  // unmount is a no-op that triggers a React warning.
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", stableMouseMove);
      document.removeEventListener("mouseup", stableMouseUp);
      if (dragStateRef.current) {
        dragStateRef.current = null;
        clearSharedDragState();
      }
    };
  }, [stableMouseMove, stableMouseUp, clearSharedDragState]);

  const activeCursor = dragState?.mode === "dragging" ? "grabbing" : cursor;

  return {
    mode: dragState?.mode ?? "idle",
    previewGeometry:
      dragState?.currentPreviewStart && dragState?.currentPreviewEnd
        ? {
            startDate: dragState.currentPreviewStart,
            endDate: dragState.currentPreviewEnd,
          }
        : null,
    cursor: activeCursor,
    isDragging: dragState !== null,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMoveForCursor,
  };
}
