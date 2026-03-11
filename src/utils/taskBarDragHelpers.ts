/**
 * Pure helper functions for task bar drag/resize interactions.
 * Extracted from useTaskBarInteraction for testability.
 */

import type { Task, TaskType } from "../types/chart.types";
import type { TaskId } from "../types/branded.types";
import type { TaskBarGeometry } from "./timelineUtils";
import type { WorkingDaysConfig } from "../types/preferences.types";
import { addDays, calculateDuration } from "./dateUtils";
import { calculateWorkingDays, addWorkingDays } from "./workingDaysCalculator";
import { validateDragOperation } from "./dragValidation";
import { MS_PER_DAY } from "./timeConstants";

/** Edge detection threshold in pixels */
export const EDGE_THRESHOLD = 8;

export type InteractionMode =
  | "idle"
  | "dragging"
  | "resizing-left"
  | "resizing-right";
export type InteractionZone = "left-edge" | "right-edge" | "center";
/** CSS cursor value for task bar interactions. Consumed by useTaskBarInteraction. */
export type CursorType =
  | "grab"
  | "grabbing"
  | "ew-resize"
  | "not-allowed"
  | "pointer";

export interface DragState {
  mode: InteractionMode;
  startX: number;
  startMouseX: number;
  originalStartDate: string;
  originalEndDate: string;
  currentPreviewStart?: string;
  currentPreviewEnd?: string;
}

/** Context for working-days-aware date calculations. */
export interface WorkingDaysContext {
  enabled: boolean;
  config: WorkingDaysConfig;
  holidayRegion: string | undefined;
}

/**
 * Detect which zone of the task bar the mouse is in.
 */
export function detectInteractionZone(
  mouseX: number,
  geometry: TaskBarGeometry
): InteractionZone {
  const relativeX = mouseX - geometry.x;
  if (relativeX < EDGE_THRESHOLD) return "left-edge";
  if (relativeX > geometry.width - EDGE_THRESHOLD) return "right-edge";
  return "center";
}

/**
 * Determine the interaction mode based on task type and zone.
 * Summary tasks and milestones can only be dragged (moved), not resized.
 */
export function determineInteractionMode(
  taskType: TaskType | undefined,
  zone: InteractionZone
): InteractionMode {
  if (taskType === "summary" || taskType === "milestone") return "dragging";
  if (zone === "center") return "dragging";
  if (zone === "left-edge") return "resizing-left";
  return "resizing-right";
}

/**
 * Convert pixel delta to day delta based on the scale.
 */
export function pixelsToDeltaDays(
  deltaX: number,
  pixelsPerDay: number
): number {
  return Math.round(deltaX / pixelsPerDay);
}

/**
 * Compute end date for a drag-move operation.
 * Handles both working-days and calendar-days modes.
 *
 * @param deltaDays - Used only in calendar-days mode. In working-days mode the
 *   delta is already encoded in `newStartDate`; the end date is instead derived
 *   by preserving the original working-day duration from the original dates.
 */
export function computeEndDateForDrag(
  newStartDate: string,
  originalStartDate: string,
  originalEndDate: string,
  deltaDays: number,
  taskType: TaskType | undefined,
  ctx: WorkingDaysContext
): string {
  if (ctx.enabled && taskType !== "milestone") {
    // Working-days mode: preserve the original working-day count, shifting from
    // the new start. deltaDays is intentionally not used here — the displacement
    // is already captured in newStartDate.
    const originalWorkingDays = calculateWorkingDays(
      originalStartDate,
      originalEndDate,
      ctx.config,
      ctx.holidayRegion
    );
    return addWorkingDays(
      newStartDate,
      originalWorkingDays,
      ctx.config,
      ctx.holidayRegion
    );
  }
  return addDays(originalEndDate, deltaDays);
}

/**
 * Compute preview dates for a resize operation.
 * Returns null if the resize would create an invalid (< 1 day) duration,
 * or if the drag state is not in a resize mode.
 */
export function computeResizePreview(
  dragState: DragState,
  deltaDays: number
): { previewStart: string; previewEnd: string } | null {
  // Guard against being called with a non-resize mode (e.g. "dragging" or "idle").
  if (
    dragState.mode !== "resizing-left" &&
    dragState.mode !== "resizing-right"
  ) {
    return null;
  }

  if (dragState.mode === "resizing-left") {
    const newStart = addDays(dragState.originalStartDate, deltaDays);
    const duration = calculateDuration(newStart, dragState.originalEndDate);
    if (duration < 1) return null;
    return { previewStart: newStart, previewEnd: dragState.originalEndDate };
  }

  // resizing-right
  const newEnd = addDays(dragState.originalEndDate, deltaDays);
  const duration = calculateDuration(dragState.originalStartDate, newEnd);
  if (duration < 1) return null;
  return { previewStart: dragState.originalStartDate, previewEnd: newEnd };
}

/**
 * Calculate delta days between two date strings.
 *
 * Returns a positive value when `previewStart` is after `originalStart`,
 * and a negative value when it is before. Used to convert a committed
 * drag position back into a day-delta for multi-task batch updates.
 *
 * @param originalStart - ISO date string for the original start date
 * @param previewStart  - ISO date string for the new (preview) start date
 * @returns Signed integer day-delta (previewStart − originalStart)
 */
export function calculateDeltaDaysFromDates(
  originalStart: string,
  previewStart: string
): number {
  const origMs = new Date(originalStart).getTime();
  const previewMs = new Date(previewStart).getTime();
  return Math.round((previewMs - origMs) / MS_PER_DAY);
}

/**
 * Build batch updates for a drag-move commit.
 * Uses a Map for O(1) task lookup. Skips summary tasks (they auto-recalculate).
 */
export function buildMoveUpdates(
  effectiveTaskIds: TaskId[],
  taskMap: Map<TaskId, Task>,
  deltaDays: number,
  ctx: WorkingDaysContext
): Array<{ id: TaskId; updates: Partial<Task> }> {
  const updates: Array<{ id: TaskId; updates: Partial<Task> }> = [];

  for (const taskId of effectiveTaskIds) {
    const t = taskMap.get(taskId);
    if (!t) continue;
    if (t.type === "summary") continue;

    const newStartDate = addDays(t.startDate, deltaDays);
    // Compute a calendar-shifted end date for validation purposes.
    // For non-milestones the final committed end date may differ (working-days
    // recalculation happens below), but validation only needs to know whether
    // the shift stays within acceptable bounds.
    const calendarShiftedEndDate = t.endDate
      ? addDays(t.endDate, deltaDays)
      : "";
    const validation = validateDragOperation(
      t,
      newStartDate,
      calendarShiftedEndDate
    );
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
      // Reuse computeEndDateForDrag to avoid duplicating the working-days logic.
      // When t.endDate is empty, fall back to the calendar-shifted value ('').
      const finalEndDate = t.endDate
        ? computeEndDateForDrag(
            newStartDate,
            t.startDate,
            t.endDate,
            deltaDays,
            t.type,
            ctx
          )
        : calendarShiftedEndDate;
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

  return updates;
}

/**
 * Build a resize update for a single task.
 * Returns null if dates haven't changed or validation fails.
 * Reads the fresh task to avoid stale closure issues.
 */
export function buildResizeUpdate(
  task: Task,
  previewStart: string | undefined,
  previewEnd: string | undefined
): Partial<Task> | null {
  const startDate = previewStart ?? task.startDate;
  const endDate = previewEnd ?? task.endDate;

  if (startDate === task.startDate && endDate === task.endDate) return null;

  const validation = validateDragOperation(task, startDate, endDate);
  if (!validation.valid) return null;

  return {
    startDate,
    endDate,
    duration: calculateDuration(startDate, endDate),
  };
}
