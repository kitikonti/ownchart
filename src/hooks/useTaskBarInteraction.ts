/**
 * Task bar interaction hook for drag-to-move and drag-to-resize functionality.
 * Provides unified handling of both drag and resize modes with visual feedback.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { Task } from "../types/chart.types";
import type { TaskId } from "../types/branded.types";
import type { TimelineScale, TaskBarGeometry } from "../utils/timelineUtils";
import { addDays, calculateDuration } from "../utils/dateUtils";
import { useTaskStore } from "../store/slices/taskSlice";
import { useChartStore } from "../store/slices/chartSlice";
import { validateDragOperation } from "../utils/dragValidation";
import { getEffectiveTasksToMove } from "../utils/hierarchy";
import {
  calculateWorkingDays,
  addWorkingDays,
} from "../utils/workingDaysCalculator";
import { getSVGPoint } from "../utils/svgUtils";

// Edge detection threshold in pixels
const EDGE_THRESHOLD = 8;

type InteractionMode = "idle" | "dragging" | "resizing-left" | "resizing-right";
type InteractionZone = "left-edge" | "right-edge" | "center";
type CursorType = "grab" | "grabbing" | "ew-resize" | "not-allowed" | "pointer";

interface DragState {
  mode: InteractionMode;
  startX: number;
  startMouseX: number;
  originalStartDate: string;
  originalEndDate: string;
  currentPreviewStart?: string;
  currentPreviewEnd?: string;
}

export interface UseTaskBarInteractionReturn {
  mode: InteractionMode;
  previewGeometry: { startDate: string; endDate: string } | null;
  cursor: CursorType;
  isDragging: boolean; // Expose whether a drag is in progress
  onMouseDown: (e: React.MouseEvent<SVGGElement>) => void;
  onMouseMove: (e: React.MouseEvent<SVGGElement>) => void;
}

/**
 * Detect which zone of the task bar the mouse is in (for edge detection).
 */
function detectInteractionZone(
  mouseX: number,
  geometry: TaskBarGeometry
): InteractionZone {
  const relativeX = mouseX - geometry.x;

  if (relativeX < EDGE_THRESHOLD) return "left-edge";
  if (relativeX > geometry.width - EDGE_THRESHOLD) return "right-edge";
  return "center";
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
  const dragStateRef = useRef<DragState | null>(null); // Use ref to avoid stale closures
  const [cursor, setCursor] = useState<CursorType>("pointer");
  const rafRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  /**
   * Handle mouse down - start drag or resize operation.
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGGElement>) => {
      // Get SVG element
      const svg = e.currentTarget.ownerSVGElement;
      if (!svg) return;

      svgRef.current = svg;

      // Convert to SVG coordinates
      const svgPoint = getSVGPoint(e, svg);

      // Detect interaction zone
      const zone = detectInteractionZone(svgPoint.x, geometry);

      // Determine mode
      let mode: InteractionMode;
      if (task.type === "summary" || task.type === "milestone") {
        // Summary tasks and milestones cannot be resized - only moved
        mode = "dragging";
      } else if (zone === "center") {
        mode = "dragging";
      } else if (zone === "left-edge") {
        mode = "resizing-left";
      } else {
        mode = "resizing-right";
      }

      // Initialize drag state (use both state and ref)
      // For milestones, use startDate as endDate fallback
      const effectiveEndDate = task.endDate || task.startDate;
      const newDragState = {
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

      // Attach global mouse listeners
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      // Prevent text selection and event bubbling
      e.preventDefault();
      e.stopPropagation();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleMouseMove/handleMouseUp are defined later; refs ensure fresh values
    [task, geometry, scale]
  );

  /**
   * Handle mouse move - update preview during drag.
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const currentDragState = dragStateRef.current;
      if (!currentDragState || !svgRef.current) return;

      // Cancel any pending RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      // Use requestAnimationFrame for smooth updates
      rafRef.current = requestAnimationFrame(() => {
        const deltaX = e.clientX - currentDragState.startMouseX;

        if (currentDragState.mode === "dragging") {
          // Drag-to-move: shift both dates by same delta
          const deltaDays = Math.round(deltaX / scale.pixelsPerDay);
          const newStartDate = addDays(
            currentDragState.originalStartDate,
            deltaDays
          );

          // Check if working days mode is enabled
          const chartState = useChartStore.getState();
          const workingDaysMode = chartState.workingDaysMode;
          const workingDaysConfig = chartState.workingDaysConfig;

          let newEndDate: string;

          if (workingDaysMode && task.type !== "milestone") {
            // Calculate original working days and extend to new position
            const holidayRegion = chartState.holidayRegion;
            const originalWorkingDays = calculateWorkingDays(
              currentDragState.originalStartDate,
              currentDragState.originalEndDate,
              workingDaysConfig,
              workingDaysConfig.excludeHolidays ? holidayRegion : undefined
            );
            newEndDate = addWorkingDays(
              newStartDate,
              originalWorkingDays,
              workingDaysConfig,
              workingDaysConfig.excludeHolidays ? holidayRegion : undefined
            );
          } else {
            // Simple calendar days shift
            newEndDate = addDays(currentDragState.originalEndDate, deltaDays);
          }

          const updatedState = {
            ...currentDragState,
            currentPreviewStart: newStartDate,
            currentPreviewEnd: newEndDate,
          };

          setDragState(updatedState);
          dragStateRef.current = updatedState;

          // Update shared drag state for multi-task preview
          setSharedDragState(deltaDays, task.id);
        } else if (currentDragState.mode === "resizing-left") {
          // Resize from left: change start date only
          const deltaDays = Math.round(deltaX / scale.pixelsPerDay);
          const newStartDate = addDays(
            currentDragState.originalStartDate,
            deltaDays
          );

          // Validate minimum duration
          const duration = calculateDuration(
            newStartDate,
            currentDragState.originalEndDate
          );
          if (duration < 1) {
            // Don't update if would create invalid duration
            return;
          }

          const updatedState = {
            ...currentDragState,
            currentPreviewStart: newStartDate,
            currentPreviewEnd: currentDragState.originalEndDate,
          };

          setDragState(updatedState);
          dragStateRef.current = updatedState;
        } else if (currentDragState.mode === "resizing-right") {
          // Resize from right: change end date only
          const deltaDays = Math.round(deltaX / scale.pixelsPerDay);
          const newEndDate = addDays(
            currentDragState.originalEndDate,
            deltaDays
          );

          // Validate minimum duration
          const duration = calculateDuration(
            currentDragState.originalStartDate,
            newEndDate
          );
          if (duration < 1) {
            // Don't update if would create invalid duration
            return;
          }

          const updatedState = {
            ...currentDragState,
            currentPreviewStart: currentDragState.originalStartDate,
            currentPreviewEnd: newEndDate,
          };

          setDragState(updatedState);
          dragStateRef.current = updatedState;
        }
      });
    },
    [scale, task.id, task.type, setSharedDragState]
  );

  /**
   * Handle mouse up - complete drag operation.
   */
  const handleMouseUp = useCallback(() => {
    const currentDragState = dragStateRef.current;
    if (!currentDragState) return;

    // Cancel any pending RAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // For drag-to-move operations, use multi-drag logic
    if (currentDragState.mode === "dragging") {
      // Calculate deltaDays from the preview
      const originalStart = new Date(currentDragState.originalStartDate);
      const newStart = new Date(
        currentDragState.currentPreviewStart ||
          currentDragState.originalStartDate
      );
      const deltaDays = Math.round(
        (newStart.getTime() - originalStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only update if there was actual movement
      if (deltaDays !== 0) {
        // IMPORTANT: Get current values from store to avoid stale closure
        const currentState = useTaskStore.getState();
        const currentTasks = currentState.tasks;
        const currentSelectedIds = currentState.selectedTaskIds;

        // Determine which tasks to move:
        // - If dragged task is in selection -> move all selected tasks
        // - If dragged task is NOT in selection -> move only the dragged task
        const tasksToMove = currentSelectedIds.includes(task.id)
          ? currentSelectedIds
          : [task.id];

        // Get effective tasks to move (handles summary expansion and de-duplication)
        const effectiveTaskIds = getEffectiveTasksToMove(
          currentTasks,
          tasksToMove
        );

        // Build updates array for all affected tasks
        const updates: Array<{ id: TaskId; updates: Partial<Task> }> = [];

        for (const taskId of effectiveTaskIds) {
          const t = currentTasks.find((x) => x.id === taskId);
          if (!t) continue;

          // Skip summary tasks (they auto-recalculate from children)
          if (t.type === "summary") continue;

          // Validate the drag operation for this task
          const newStartDate = addDays(t.startDate, deltaDays);
          const newEndDate = t.endDate ? addDays(t.endDate, deltaDays) : "";
          const validation = validateDragOperation(t, newStartDate, newEndDate);

          if (!validation.valid) continue;

          if (t.type === "milestone") {
            updates.push({
              id: taskId,
              updates: {
                startDate: newStartDate,
                endDate: newStartDate,
                duration: 0,
              },
            });
          } else {
            // Get working days settings from stores
            const chartState = useChartStore.getState();
            const workingDaysMode = chartState.workingDaysMode;
            const workingDaysConfig = chartState.workingDaysConfig;
            const holidayRegion = chartState.holidayRegion;

            let finalEndDate = newEndDate;

            // If working days mode is enabled, maintain working days duration
            if (workingDaysMode && t.endDate) {
              // Calculate original working days duration
              const originalWorkingDays = calculateWorkingDays(
                t.startDate,
                t.endDate,
                workingDaysConfig,
                workingDaysConfig.excludeHolidays ? holidayRegion : undefined
              );

              // Calculate new end date to maintain same working days
              finalEndDate = addWorkingDays(
                newStartDate,
                originalWorkingDays,
                workingDaysConfig,
                workingDaysConfig.excludeHolidays ? holidayRegion : undefined
              );
            }

            updates.push({
              id: taskId,
              updates: {
                startDate: newStartDate,
                endDate: finalEndDate,
                duration: calculateDuration(newStartDate, finalEndDate),
              },
            });
          }
        }

        // Apply all updates via batch action
        if (updates.length > 0) {
          updateMultipleTasks(updates);
        }
      }
    } else {
      // For resize operations, only update the single task
      const validation = validateDragOperation(
        task,
        currentDragState.currentPreviewStart || task.startDate,
        currentDragState.currentPreviewEnd || task.endDate
      );

      if (validation.valid) {
        // Only update if dates actually changed
        if (
          currentDragState.currentPreviewStart !== task.startDate ||
          currentDragState.currentPreviewEnd !== task.endDate
        ) {
          updateTask(task.id, {
            startDate: currentDragState.currentPreviewStart!,
            endDate: currentDragState.currentPreviewEnd!,
            duration: calculateDuration(
              currentDragState.currentPreviewStart!,
              currentDragState.currentPreviewEnd!
            ),
          });
        }
      }
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

  /**
   * Handle mouse move for cursor updates (when not dragging).
   */
  const handleMouseMoveForCursor = useCallback(
    (e: React.MouseEvent<SVGGElement>) => {
      // Don't change cursor during active drag
      if (dragState) return;

      // Summary tasks and milestones can only be dragged (moved), not resized
      if (task.type === "summary" || task.type === "milestone") {
        setCursor("grab");
        return;
      }

      // Get SVG element and convert coordinates
      const svg = e.currentTarget.ownerSVGElement;
      if (!svg) return;

      const svgPoint = getSVGPoint(e, svg);

      // Detect zone
      const zone = detectInteractionZone(svgPoint.x, geometry);

      // Update cursor based on zone
      if (zone === "center") {
        setCursor("grab");
      } else {
        // Left or right edge
        setCursor("ew-resize");
      }
    },
    [task, geometry, dragState]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Determine active cursor (override during drag)
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
