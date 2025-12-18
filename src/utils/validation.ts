/**
 * Validation utilities for Gantt chart data.
 * Aligned with FEATURE_SPECIFICATIONS.md Section 2.2
 */

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
      error: 'Task name is required',
    };
  }

  if (name.length > 200) {
    return {
      valid: false,
      error: 'Task name must be 200 characters or less',
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
      error: 'Date is required',
    };
  }

  // Check ISO format (YYYY-MM-DD)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(date)) {
    return {
      valid: false,
      error: 'Date must be in ISO format (YYYY-MM-DD)',
    };
  }

  // Check if it's a valid date
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return {
      valid: false,
      error: 'Invalid date',
    };
  }

  // Verify the date parts match (to catch invalid dates like 2025-02-30)
  const [year, month, day] = date.split('-').map(Number);
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return {
      valid: false,
      error: 'Invalid date',
    };
  }

  return { valid: true };
}
