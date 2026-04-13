/**
 * Pure helper functions for task bar drag/resize interactions.
 * Extracted from useTaskBarInteraction for testability.
 *
 * Duration semantics: when working-days mode is on, drag operations preserve
 * the task's **working-day duration** (via computeEndDateForDrag). This may
 * change the calendar-day duration. The snap-back path in
 * useTaskBarInteraction captures pre-drag calendar durations to prevent
 * tasks from shrinking — see preDragDurations in DragDependencyContext.
 */

import type { Task, TaskType } from "@/types/chart.types";
import type { TaskId } from "@/types/branded.types";
import type { TaskBarGeometry } from "./timelineUtils";

import { addDays, calculateDuration } from "./dateUtils";
import {
  calculateWorkingDays,
  addWorkingDays,
  snapForwardToWorkingDay,
  type WorkingDaysContext,
} from "./workingDaysCalculator";
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

// WorkingDaysContext now lives in workingDaysCalculator.ts (single source of
// truth for the type — re-exported below for back-compat with existing
// imports from this module).
/** @deprecated Import from `@/utils/workingDaysCalculator` instead. */
export type { WorkingDaysContext };

/**
 * Capture per-task durations in the unit dictated by the active working-days
 * context. Used by `useTaskBarInteraction` BEFORE a drag/resize update is
 * committed so that snap-back paths can restore the original span — in
 * working-days mode the drag may have shortened the calendar range to match
 * the working-day count, and reading the post-update duration would
 * silently shrink the task on every snap-back.
 *
 * Pure: no store dependencies, safe to test directly.
 */
export function capturePreDragDurations(
  tasks: readonly Task[],
  wdCtx: WorkingDaysContext
): Map<TaskId, number> {
  // Clamp to ≥ 1 — a zero-day duration would make
  // calculateConstrainedDates produce a degenerate range and corrupt the
  // snap-back position. Defensively normalised here so every caller is safe.
  return new Map(
    tasks.map((t) => [
      t.id,
      Math.max(
        1,
        calculateWorkingDays(
          t.startDate,
          t.endDate,
          wdCtx.config,
          wdCtx.holidayRegion
        )
      ),
    ])
  );
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
  if (taskType !== "milestone") {
    // Preserve the original working-day count, shifting from the new start.
    // deltaDays is intentionally not used here — the displacement is already
    // captured in newStartDate.
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
 *
 * When working-days mode is active, the resized edge is snapped forward to
 * the next working day before the duration guard runs.
 */
export function computeResizePreview(
  dragState: DragState,
  deltaDays: number,
  ctx?: WorkingDaysContext
): { previewStart: string; previewEnd: string } | null {
  // Guard against being called with a non-resize mode (e.g. "dragging" or "idle").
  if (
    dragState.mode !== "resizing-left" &&
    dragState.mode !== "resizing-right"
  ) {
    return null;
  }

  if (dragState.mode === "resizing-left") {
    let newStart = addDays(dragState.originalStartDate, deltaDays);
    if (ctx) {
      newStart = snapForwardToWorkingDay(
        newStart,
        ctx.config,
        ctx.holidayRegion
      );
    }
    const duration = calculateDuration(newStart, dragState.originalEndDate);
    if (duration < 1) return null;
    return { previewStart: newStart, previewEnd: dragState.originalEndDate };
  }

  // resizing-right
  let newEnd = addDays(dragState.originalEndDate, deltaDays);
  if (ctx) {
    newEnd = snapForwardToWorkingDay(newEnd, ctx.config, ctx.holidayRegion);
  }
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
 * Derive the final end date for a non-milestone task move.
 * Reuses computeEndDateForDrag to avoid duplicating working-days logic.
 * Falls back to the calendar-shifted value when the original end date is empty.
 */
function resolveFinalEndDate(
  t: Task,
  newStartDate: string,
  deltaDays: number,
  calendarShiftedEndDate: string,
  ctx: WorkingDaysContext
): string {
  return t.endDate
    ? computeEndDateForDrag(
        newStartDate,
        t.startDate,
        t.endDate,
        deltaDays,
        t.type,
        ctx
      )
    : calendarShiftedEndDate;
}

/**
 * Compute the field updates for a single non-summary task during a drag-move commit.
 * Returns null if validation fails.
 */
function buildSingleTaskMoveUpdate(
  t: Task,
  deltaDays: number,
  ctx: WorkingDaysContext
): Partial<Task> | null {
  const rawStartDate = addDays(t.startDate, deltaDays);
  // Snap to working day.
  const newStartDate = snapForwardToWorkingDay(
    rawStartDate,
    ctx.config,
    ctx.holidayRegion
  );
  // Compute a calendar-shifted end date for validation purposes.
  // For non-milestones the final committed end date may differ (working-days
  // recalculation happens below), but validation only needs to know whether
  // the shift stays within acceptable bounds.
  const calendarShiftedEndDate = t.endDate ? addDays(t.endDate, deltaDays) : "";
  const validation = validateDragOperation(
    t,
    newStartDate,
    calendarShiftedEndDate
  );
  if (!validation.valid) return null;

  if (t.type === "milestone") {
    return { startDate: newStartDate, endDate: newStartDate, duration: 0 };
  }

  const finalEndDate = resolveFinalEndDate(
    t,
    newStartDate,
    deltaDays,
    calendarShiftedEndDate,
    ctx
  );
  return {
    startDate: newStartDate,
    endDate: finalEndDate,
    duration: calculateDuration(newStartDate, finalEndDate),
  };
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

    const taskUpdates = buildSingleTaskMoveUpdate(t, deltaDays, ctx);
    if (!taskUpdates) continue;
    updates.push({ id: taskId, updates: taskUpdates });
  }

  return updates;
}

/**
 * Build a resize update for a single task.
 * Returns null if dates haven't changed or validation fails.
 * Reads the fresh task to avoid stale closure issues.
 *
 * When working-days mode is active, dates are snapped forward to the next
 * working day (belt-and-suspenders with the preview snap in computeResizePreview).
 */
export function buildResizeUpdate(
  task: Task,
  previewStart: string | undefined,
  previewEnd: string | undefined,
  ctx?: WorkingDaysContext
): Partial<Task> | null {
  let startDate = previewStart ?? task.startDate;
  let endDate = previewEnd ?? task.endDate;

  if (ctx) {
    startDate = snapForwardToWorkingDay(
      startDate,
      ctx.config,
      ctx.holidayRegion
    );
    endDate = snapForwardToWorkingDay(endDate, ctx.config, ctx.holidayRegion);
  }

  if (startDate === task.startDate && endDate === task.endDate) return null;

  const validation = validateDragOperation(task, startDate, endDate);
  if (!validation.valid) return null;

  return {
    startDate,
    endDate,
    duration: calculateDuration(startDate, endDate),
  };
}
