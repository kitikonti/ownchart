/**
 * Shared helpers and constants for taskSlice and its extracted action modules.
 */

import type { Task } from "../../types/chart.types";
import type { CommandParams, CommandType } from "../../types/command.types";
import { useHistoryStore } from "./historySlice";
import { calculateSummaryDates } from "../../utils/hierarchy";
import { toISODateString } from "../../utils/dateUtils";

// =============================================================================
// Constants
// =============================================================================

export const DEFAULT_TASK_DURATION = 7;
export const MS_PER_DAY = 1000 * 60 * 60 * 24;
export const DEFAULT_TASK_NAME = "New Task";
export const PLACEHOLDER_TEXT = "Add new task...";
export const DEFAULT_GROUP_NAME = "New Group";
export const UNKNOWN_TASK_NAME = "Unknown";
export const EXPAND_BUTTON_WIDTH = 16;
export const CELL_GAP_SIZE = 8;

// =============================================================================
// Shared helpers
// =============================================================================

/** Capture a lightweight snapshot of task hierarchy (parent + order) for undo/redo. */
export function captureHierarchySnapshot(
  tasks: ReadonlyArray<Task>
): Array<{ id: string; parent: string | undefined; order: number }> {
  return tasks.map((t) => ({ id: t.id, parent: t.parent, order: t.order }));
}

/** Record a command for undo/redo. No-op during undo/redo replay. */
export function recordCommand(
  type: CommandType,
  description: string,
  params: CommandParams
): void {
  const historyStore = useHistoryStore.getState();
  if (historyStore.isUndoing || historyStore.isRedoing) return;
  historyStore.recordCommand({
    id: crypto.randomUUID(),
    type,
    timestamp: Date.now(),
    description,
    params,
  });
}

/**
 * Get the effective task IDs from selection or active cell.
 * Returns selected task IDs if any, otherwise the active cell's task ID.
 */
export function getEffectiveTaskIds(state: {
  selectedTaskIds: string[];
  activeCell: { taskId: string | null };
}): string[] {
  if (state.selectedTaskIds.length > 0) return state.selectedTaskIds;
  if (state.activeCell.taskId) return [state.activeCell.taskId];
  return [];
}

/**
 * Given a set of selected task IDs, returns only the topmost ancestors.
 * If a parent and its child are both selected, only the parent is kept.
 */
export function getRootSelectedIds(
  tasks: Task[],
  selectedIds: string[]
): string[] {
  const selectedSet = new Set(selectedIds);
  return selectedIds.filter((id) => {
    let ancestor = tasks.find((t) => t.id === id);
    while (ancestor?.parent) {
      if (selectedSet.has(ancestor.parent)) return false;
      ancestor = tasks.find((t) => t.id === ancestor!.parent);
    }
    return true;
  });
}

/**
 * Validate and enrich updates for type-change side effects.
 * For summary type, mutates the draft task's type (required by calculateSummaryDates).
 * Returns null if the type change is invalid (e.g., milestone with children).
 */
export function computeTypeChangeEffects(
  tasks: Task[],
  taskId: string,
  task: Task, // Immer draft — type may be mutated for summary
  updates: Partial<Task>
): Partial<Task> | null {
  if (updates.type === undefined) return updates;

  const enriched = { ...updates };

  if (enriched.type === "milestone") {
    const hasChildren = tasks.some((t) => t.parent === taskId);
    if (hasChildren) return null;

    // Milestone is a point in time: endDate = startDate
    const currentStart = enriched.startDate ?? task.startDate;
    enriched.endDate = currentStart || toISODateString(new Date());
    if (!currentStart) {
      enriched.startDate = enriched.endDate;
    }
    enriched.duration = 0;
    enriched.progress = 0;
  } else if (enriched.type === "task" && task.type === "milestone") {
    const milestoneDate = task.startDate;
    if (milestoneDate) {
      enriched.startDate = milestoneDate;
      const end = new Date(milestoneDate);
      end.setDate(end.getDate() + (DEFAULT_TASK_DURATION - 1));
      enriched.endDate = toISODateString(end);
      enriched.duration = DEFAULT_TASK_DURATION;
    }
  } else if (enriched.type === "summary") {
    // Set type on draft so calculateSummaryDates can check it
    task.type = "summary";

    const hasChildren = tasks.some((t) => t.parent === taskId);
    if (hasChildren) {
      const summaryDates = calculateSummaryDates(tasks, taskId);
      if (summaryDates) {
        enriched.startDate = summaryDates.startDate;
        enriched.endDate = summaryDates.endDate;
        enriched.duration = summaryDates.duration;
      }
    }
    // No children: keep existing dates (recalculated when children are added)
    enriched.open = true;
  }

  return enriched;
}
