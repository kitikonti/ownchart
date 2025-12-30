/**
 * Validation utilities for drag-to-edit operations.
 */

import type { Task } from '../types/chart.types';
import { validateTask } from './validation';
import { calculateDuration } from './dateUtils';

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
  // Rule 1: Use existing validateTask for comprehensive validation
  // For milestones, only set startDate and duration 0 (they don't have endDate)
  const taskWithNewDates: Partial<Task> = task.type === 'milestone'
    ? {
        ...task,
        startDate: newStartDate,
        endDate: undefined, // Explicitly unset endDate for milestones
        duration: 0,
      }
    : {
        ...task,
        startDate: newStartDate,
        endDate: newEndDate,
      };

  const basicValidation = validateTask(taskWithNewDates);

  if (!basicValidation.valid) {
    return {
      valid: false,
      error: basicValidation.error || 'Invalid task dates',
    };
  }

  // Rule 2: Minimum duration (1 day for regular tasks, milestones don't need this check)
  if (task.type !== 'milestone') {
    const duration = calculateDuration(newStartDate, newEndDate);
    if (duration < 1) {
      return {
        valid: false,
        error: 'Task must be at least 1 day long',
      };
    }
  }

  // Rule 3: Cannot drag summary tasks (defensive check, should be caught earlier)
  if (task.type === 'summary') {
    return {
      valid: false,
      error: 'Summary task dates are calculated from children',
    };
  }

  return { valid: true };
}
