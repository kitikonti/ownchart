/**
 * Task bar interaction hook for drag-to-move and drag-to-resize functionality.
 * Thin orchestrator — pure logic lives in ../utils/taskBarDragHelpers.
 *
 * Uses ref-based stable listeners to avoid stale closures and fragile cleanup.
 * Document event handlers always delegate to the latest handler via refs.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { Task } from "../types/chart.types";
import type { TimelineScale, TaskBarGeometry } from "../utils/timelineUtils";
import { addDays } from "../utils/dateUtils";
import { useTaskStore } from "../store/slices/taskSlice";
import { useChartStore } from "../store/slices/chartSlice";
import { getEffectiveTasksToMove } from "../utils/hierarchy";
import { getSVGPoint } from "../utils/svgUtils";
import {
  detectInteractionZone,
  determineInteractionMode,
  pixelsToDeltaDays,
  computeEndDateForDrag,
  computeResizePreview,
  calculateDeltaDaysFromDates,
  buildMoveUpdates,
  buildResizeUpdate,
  type DragState,
  type CursorType,
  type WorkingDaysContext,
} from "../utils/taskBarDragHelpers";

export interface UseTaskBarInteractionReturn {
  mode: "idle" | "dragging" | "resizing-left" | "resizing-right";
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
 * Unified hook for task bar drag-to-move and drag-to-resize interactions.
 */
export function useTaskBarInteraction(
  task: Task,
  scale: TimelineScale,
  geometry: TaskBarGeometry
): UseTaskBarInteractionReturn {
  const updateTask = useTaskStore((state) => state.updateTask);
  const updateMultipleTasks = useTaskStore(
    (state) => state.updateMultipleTasks
  );
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
  const mouseUpRef = useRef<() => void>(() => {});

  const stableMouseMove = useCallback(
    (e: MouseEvent): void => mouseMoveRef.current(e),
    []
  );
  const stableMouseUp = useCallback((): void => mouseUpRef.current(), []);

  /** Commit a drag-move operation to the store. */
  const commitDragMove = (current: DragState): void => {
    const previewStart =
      current.currentPreviewStart || current.originalStartDate;
    const deltaDays = calculateDeltaDaysFromDates(
      current.originalStartDate,
      previewStart
    );

    if (deltaDays === 0) return;

    const { tasks, selectedTaskIds } = useTaskStore.getState();
    const tasksToMove = selectedTaskIds.includes(task.id)
      ? selectedTaskIds
      : [task.id];
    const effectiveTaskIds = getEffectiveTasksToMove(tasks, tasksToMove);

    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const ctx = getWorkingDaysContext();
    const updates = buildMoveUpdates(effectiveTaskIds, taskMap, deltaDays, ctx);

    if (updates.length > 0) updateMultipleTasks(updates);
  };

  /** Commit a resize operation to the store. */
  const commitResize = (current: DragState): void => {
    const freshTask =
      useTaskStore.getState().tasks.find((t) => t.id === task.id) ?? task;
    const resizeUpdate = buildResizeUpdate(
      freshTask,
      current.currentPreviewStart,
      current.currentPreviewEnd
    );
    if (resizeUpdate) updateTask(task.id, resizeUpdate);
  };

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

  mouseUpRef.current = (): void => {
    const current = dragStateRef.current;
    if (!current) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (current.mode === "dragging") {
      commitDragMove(current);
    } else {
      commitResize(current);
    }

    document.removeEventListener("mousemove", stableMouseMove);
    document.removeEventListener("mouseup", stableMouseUp);
    syncDragState(null);
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
    [task, geometry, syncDragState, stableMouseMove, stableMouseUp]
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

  // Cleanup on unmount — stable refs guarantee correct removal
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", stableMouseMove);
      document.removeEventListener("mouseup", stableMouseUp);
    };
  }, [stableMouseMove, stableMouseUp]);

  const activeCursor = dragState?.mode === "dragging" ? "grabbing" : cursor;

  return {
    mode: dragState?.mode || "idle",
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
