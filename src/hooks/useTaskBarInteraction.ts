/**
 * Task bar interaction hook for drag-to-move and drag-to-resize functionality.
 * Thin orchestrator — pure logic lives in ../utils/taskBarDragHelpers.
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
  type WorkingDaysContext,
} from "../utils/taskBarDragHelpers";

// Re-export types for backward compatibility
export type {
  InteractionMode,
  CursorType,
  DragState,
} from "../utils/taskBarDragHelpers";

import type { CursorType } from "../utils/taskBarDragHelpers";

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

  /** Start drag or resize operation. */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGGElement>) => {
      const svg = e.currentTarget.ownerSVGElement;
      if (!svg) return;
      svgRef.current = svg;

      const svgPoint = getSVGPoint(e, svg);
      const zone = detectInteractionZone(svgPoint.x, geometry);
      const mode = determineInteractionMode(task.type, zone);

      const effectiveEndDate = task.endDate || task.startDate;
      const newDragState: DragState = {
        mode,
        startX: svgPoint.x,
        startMouseX: e.clientX,
        originalStartDate: task.startDate,
        originalEndDate: effectiveEndDate,
        currentPreviewStart: task.startDate,
        currentPreviewEnd: effectiveEndDate,
      };

      setDragState(newDragState);
      dragStateRef.current = newDragState;

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      e.preventDefault();
      e.stopPropagation();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleMouseMove/handleMouseUp use refs for fresh values
    [task, geometry, scale]
  );

  /** Update preview during drag. */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
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

          const updated: DragState = {
            ...current,
            currentPreviewStart: newStart,
            currentPreviewEnd: newEnd,
          };
          setDragState(updated);
          dragStateRef.current = updated;
          setSharedDragState(deltaDays, task.id);
        } else {
          const preview = computeResizePreview(current, deltaDays);
          if (!preview) return; // invalid duration

          const updated: DragState = {
            ...current,
            currentPreviewStart: preview.previewStart,
            currentPreviewEnd: preview.previewEnd,
          };
          setDragState(updated);
          dragStateRef.current = updated;
        }
      });
    },
    [scale, task.id, task.type, setSharedDragState]
  );

  /** Complete drag operation and commit changes. */
  const handleMouseUp = useCallback(() => {
    const current = dragStateRef.current;
    if (!current) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (current.mode === "dragging") {
      const previewStart =
        current.currentPreviewStart || current.originalStartDate;
      const deltaDays = calculateDeltaDaysFromDates(
        current.originalStartDate,
        previewStart
      );

      if (deltaDays !== 0) {
        const { tasks, selectedTaskIds } = useTaskStore.getState();
        const tasksToMove = selectedTaskIds.includes(task.id)
          ? selectedTaskIds
          : [task.id];
        const effectiveTaskIds = getEffectiveTasksToMove(tasks, tasksToMove);

        const taskMap = new Map(tasks.map((t) => [t.id, t]));
        const ctx = getWorkingDaysContext();
        const updates = buildMoveUpdates(
          effectiveTaskIds,
          taskMap,
          deltaDays,
          ctx
        );

        if (updates.length > 0) updateMultipleTasks(updates);
      }
    } else {
      // Resize: read fresh task from store to avoid stale closure
      const freshTask =
        useTaskStore.getState().tasks.find((t) => t.id === task.id) ?? task;
      const resizeUpdate = buildResizeUpdate(
        freshTask,
        current.currentPreviewStart,
        current.currentPreviewEnd
      );
      if (resizeUpdate) updateTask(task.id, resizeUpdate);
    }

    // Cleanup
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    setDragState(null);
    dragStateRef.current = null;
    svgRef.current = null;
    clearSharedDragState();
  }, [
    task,
    updateTask,
    updateMultipleTasks,
    handleMouseMove,
    clearSharedDragState,
  ]);

  /** Update cursor on hover (when not dragging). */
  const handleMouseMoveForCursor = useCallback(
    (e: React.MouseEvent<SVGGElement>) => {
      if (dragState) return;

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
    [task, geometry, dragState]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

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
