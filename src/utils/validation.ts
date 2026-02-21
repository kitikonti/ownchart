/**
 * Validation utilities for Gantt chart data.
 * Aligned with FEATURE_SPECIFICATIONS.md Section 2.2
 */

import type { Task } from "../types/chart.types";

/**
 * Result of a validation operation.
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a task name.
 * Rules: 1-200 characters, required
 *
 * @param name - Task name to validate
 * @returns Validation result with error message if invalid
 */
export function validateTaskName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return {
      valid: false,
      error: "Task name is required",
    };
  }

  if (name.length > 200) {
    return {
      valid: false,
      error: "Task name must be 200 characters or less",
    };
  }

  return { valid: true };
}

/**
 * Validates an ISO date string.
 * Rules: Valid ISO format (YYYY-MM-DD)
 *
 * @param date - Date string to validate
 * @returns Validation result with error message if invalid
 */
export function validateDateString(date: string): ValidationResult {
  if (!date || date.trim().length === 0) {
    return {
      valid: false,
      error: "Date is required",
    };
  }

  // Check ISO format (YYYY-MM-DD)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(date)) {
    return {
      valid: false,
      error: "Date must be in ISO format (YYYY-MM-DD)",
    };
  }

  // Check if it's a valid date
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return {
      valid: false,
      error: "Invalid date",
    };
  }

  // Verify the date parts match (to catch invalid dates like 2025-02-30)
  const [year, month, day] = date.split("-").map(Number);
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return {
      valid: false,
      error: "Invalid date",
    };
  }

  return { valid: true };
}

/**
 * Validates a hex color code.
 * Rules: Valid hex format (#RRGGBB or #RGB)
 *
 * @param color - Color string to validate
 * @returns Validation result with error message if invalid
 */
export function validateColor(color: string): ValidationResult {
  if (!color || color.trim().length === 0) {
    return {
      valid: false,
      error: "Color is required",
    };
  }

  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!hexColorRegex.test(color)) {
    return {
      valid: false,
      error: "Color must be a valid hex code (#RRGGBB or #RGB)",
    };
  }

  return { valid: true };
}

/**
 * Validates a duration value.
 * Rules: Positive integer, at least 1 day
 *
 * @param duration - Duration value to validate
 * @returns Validation result with error message if invalid
 */
export function validateDuration(duration: number): ValidationResult {
  if (typeof duration !== "number" || isNaN(duration)) {
    return {
      valid: false,
      error: "Duration must be a number",
    };
  }

  if (duration < 1) {
    return {
      valid: false,
      error: "Duration must be at least 1 day",
    };
  }

  return { valid: true };
}

/**
 * Validates progress value.
 * Rules: Number between 0 and 100
 *
 * @param progress - Progress value to validate
 * @returns Validation result with error message if invalid
 */
export function validateProgress(progress: number): ValidationResult {
  if (typeof progress !== "number" || isNaN(progress)) {
    return {
      valid: false,
      error: "Progress must be a number",
    };
  }

  if (progress < 0 || progress > 100) {
    return {
      valid: false,
      error: "Progress must be between 0 and 100",
    };
  }

  return { valid: true };
}

/**
 * Validates a complete task object.
 * Rules:
 * - Valid name (1-200 chars)
 * - Valid start and end dates (ISO format)
 * - endDate >= startDate
 * - Valid progress (0-100)
 * - Valid color (hex code)
 * - Type-specific validation (summary, milestone, task)
 *
 * @param task - Partial task object to validate
 * @returns Validation result with error message if invalid
 */
export function validateTask(task: Partial<Task>): ValidationResult {
  // Validate name
  if (task.name !== undefined) {
    const nameResult = validateTaskName(task.name);
    if (!nameResult.valid) {
      return nameResult;
    }
  }

  // Validate start date
  if (task.startDate !== undefined) {
    const startDateResult = validateDateString(task.startDate);
    if (!startDateResult.valid) {
      return { valid: false, error: `Start date: ${startDateResult.error}` };
    }
  }

  // Validate end date
  if (task.endDate !== undefined) {
    const endDateResult = validateDateString(task.endDate);
    if (!endDateResult.valid) {
      return { valid: false, error: `End date: ${endDateResult.error}` };
    }
  }

  // Validate endDate >= startDate
  if (task.startDate && task.endDate) {
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);
    if (endDate < startDate) {
      return {
        valid: false,
        error: "End date must be greater than or equal to start date",
      };
    }
  }

  // Validate progress
  if (task.progress !== undefined) {
    const progressResult = validateProgress(task.progress);
    if (!progressResult.valid) {
      return progressResult;
    }
  }

  // Validate color
  if (task.color !== undefined) {
    const colorResult = validateColor(task.color);
    if (!colorResult.valid) {
      return colorResult;
    }
  }

  // Type-specific validation
  if (task.type === "milestone") {
    // Milestones must have duration 0
    if (task.duration !== undefined && task.duration !== 0) {
      return {
        valid: false,
        error: "Milestone tasks must have duration 0",
      };
    }
  }

  return { valid: true };
}

/**
 * Check if a task type can have children.
 * Only milestones cannot be parents.
 *
 * Based on SVAR pattern:
 * - Tasks CAN have children (dates independent of children)
 * - Summaries CAN have children (dates calculated from children)
 * - Milestones CANNOT have children
 */
export function canHaveChildren(task: Task): boolean {
  // Milestones cannot be parents
  if (task.type === "milestone") return false;

  // Tasks and summaries can be parents
  return true;
}
