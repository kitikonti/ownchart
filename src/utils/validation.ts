/**
 * Validation utilities for Gantt chart data.
 * Aligned with FEATURE_SPECIFICATIONS.md Section 2.2
 */

import type { Task } from "../types/chart.types";

/** Maximum allowed length for a task name. */
export const MAX_TASK_NAME_LENGTH = 200;

/** Maximum allowed task duration in days (~20 years). Prevents absurdly large values. */
export const MAX_DURATION_DAYS = 7300;

// Pre-compiled regex patterns (hoisted to avoid per-call recompilation)
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/** Returns true if the string is empty or contains only whitespace. */
function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

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
  if (isBlank(name)) {
    return {
      valid: false,
      error: "Task name is required",
    };
  }

  if (name.length > MAX_TASK_NAME_LENGTH) {
    return {
      valid: false,
      error: `Task name must be ${MAX_TASK_NAME_LENGTH} characters or less`,
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
  if (isBlank(date)) {
    return {
      valid: false,
      error: "Date is required",
    };
  }

  // Check ISO format (YYYY-MM-DD)
  if (!ISO_DATE_REGEX.test(date)) {
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

  // Verify the date parts match to catch invalid dates like 2025-02-30.
  // Use UTC methods: ISO date-only strings are parsed as UTC midnight, so
  // local-timezone getFullYear()/getDate() give wrong values in UTC−12/UTC+14.
  const [year, month, day] = date.split("-").map(Number);
  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
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
  if (isBlank(color)) {
    return {
      valid: false,
      error: "Color is required",
    };
  }

  if (!HEX_COLOR_REGEX.test(color)) {
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

  if (!Number.isInteger(duration)) {
    return {
      valid: false,
      error: "Duration must be a whole number of days",
    };
  }

  if (duration < 1) {
    return {
      valid: false,
      error: "Duration must be at least 1 day",
    };
  }

  if (duration > MAX_DURATION_DAYS) {
    return {
      valid: false,
      error: `Duration must be ${MAX_DURATION_DAYS} days or less`,
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
 * Validates that endDate is not before startDate.
 * Both dates must already be valid ISO strings (pre-validated with validateDateString).
 *
 * Exported for direct unit testing.
 */
export function validateDateRange(
  startDate: string,
  endDate: string
): ValidationResult {
  if (new Date(endDate) < new Date(startDate)) {
    return {
      valid: false,
      error: "End date must be greater than or equal to start date",
    };
  }
  return { valid: true };
}

/**
 * Validates type-specific constraints for a task.
 * Extracted to keep validateTask under the 50-line guideline.
 */
function validateTaskTypeConstraints(task: Partial<Task>): ValidationResult {
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
 * Validates a partial task object.
 *
 * **Important**: Only fields that are present (not `undefined`) are validated.
 * This makes the function suitable for partial updates (e.g. editing a single
 * field) as well as full task objects. Callers creating new tasks must ensure
 * all required fields are included — `validateTask({})` intentionally returns
 * `{ valid: true }`.
 *
 * Rules:
 * - Valid name (1-200 chars)
 * - Valid start and end dates (ISO format)
 * - endDate >= startDate
 * - Valid progress (0-100, fractional values allowed)
 * - Valid color (hex code)
 * - Type-specific validation (summary, milestone, task)
 *
 * @param task - Partial task object to validate
 * @returns Validation result with error message if invalid
 */
export function validateTask(task: Partial<Task>): ValidationResult {
  if (task.name !== undefined) {
    const result = validateTaskName(task.name);
    if (!result.valid) return result;
  }

  if (task.startDate !== undefined) {
    const result = validateDateString(task.startDate);
    if (!result.valid)
      return { valid: false, error: `Start date: ${result.error}` };
  }

  if (task.endDate !== undefined) {
    const result = validateDateString(task.endDate);
    if (!result.valid)
      return { valid: false, error: `End date: ${result.error}` };
  }

  if (task.startDate && task.endDate) {
    const result = validateDateRange(task.startDate, task.endDate);
    if (!result.valid) return result;
  }

  if (task.progress !== undefined) {
    const result = validateProgress(task.progress);
    if (!result.valid) return result;
  }

  if (task.color !== undefined) {
    const result = validateColor(task.color);
    if (!result.valid) return result;
  }

  return validateTaskTypeConstraints(task);
}
