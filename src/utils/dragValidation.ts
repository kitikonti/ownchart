/**
 * Validation utilities for drag-to-edit operations.
 */

import type { Task } from "../types/chart.types";
import { validateTask } from "./validation";

export interface DragValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a drag operation before applying changes.
 *
 * @param task - The task being dragged
 * @param newStartDate - The proposed new start date
 * @param newEndDate - The proposed new end date
 * @returns Validation result with error message if invalid
 */
export function validateDragOperation(
  task: Task,
  newStartDate: string,
  newEndDate: string
): DragValidationResult {
  // Validate only the date fields that change during drag. validateTask handles
  // format validation, date ordering (endDate >= startDate via validateDateRange),
  // and type-specific constraints. Milestones omit endDate entirely.
  const dateUpdate: Partial<Task> =
    task.type === "milestone"
      ? { startDate: newStartDate }
      : { startDate: newStartDate, endDate: newEndDate };

  const result = validateTask(dateUpdate);
  return result.valid
    ? { valid: true }
    : { valid: false, error: result.error ?? "Invalid task dates" };
}
