/**
 * Utility functions for validating cell paste operations.
 * Ensures field type matching and prevents invalid pastes.
 */

import type { Task } from "../../types/chart.types";
import type { EditableField } from "../../types/task.types";
import { DEFAULT_TASK_COLOR } from "../../styles/design-tokens";

/**
 * Validate if a cell value can be pasted into a target field.
 *
 * Rules:
 * - Source and target fields must match (e.g., date → date, name → name)
 * - Summary tasks cannot accept date pastes (dates are calculated)
 * - Milestone tasks cannot accept progress/duration pastes (always 0)
 *
 * @param sourceField - Field type of the copied value
 * @param targetField - Field type of the paste destination
 * @param targetTask - Task being pasted into
 * @returns Validation result with error message if invalid
 */
export function canPasteCellValue(
  sourceField: EditableField,
  targetField: EditableField,
  targetTask: Task
): { valid: true } | { valid: false; error: string } {
  // Rule 1: Field types must match
  if (sourceField !== targetField) {
    return {
      valid: false,
      error: `Cannot paste ${sourceField} into ${targetField}`,
    };
  }

  // Rule 2: Summary tasks have calculated dates
  if (
    targetTask.type === "summary" &&
    (targetField === "startDate" || targetField === "endDate")
  ) {
    return {
      valid: false,
      error:
        "Cannot paste dates into summary tasks (dates are calculated from children)",
    };
  }

  // Rule 3: Milestone tasks have no duration or progress
  if (
    targetTask.type === "milestone" &&
    (targetField === "duration" || targetField === "progress")
  ) {
    return {
      valid: false,
      error: `Cannot paste ${targetField} into milestone tasks`,
    };
  }

  // All checks passed
  return { valid: true };
}

/**
 * Validate if a cell value can be cut from a source field.
 *
 * Rules:
 * - Summary tasks' type cannot be cleared — doing so would convert the summary
 *   to a regular task while its children remain, breaking the hierarchy.
 *
 * @param field - Field being cut
 * @param sourceTask - Task being cut from
 * @returns Validation result with error message if invalid
 */
export function canCutCellValue(
  field: EditableField,
  sourceTask: Task
): { valid: true } | { valid: false; error: string } {
  // Cutting type from a summary task clears it to "task", leaving its children
  // without a summary parent — hierarchy invariant violated.
  if (field === "type" && sourceTask.type === "summary") {
    return {
      valid: false,
      error: "Cannot cut type from summary tasks (would orphan their children)",
    };
  }

  return { valid: true };
}

/**
 * Get the default "clear" value for a field when cutting a cell.
 *
 * @param field - Field to get clear value for
 * @returns Appropriate default/empty value for the field type
 */
export function getClearValueForField(
  field: EditableField
): Task[EditableField] {
  switch (field) {
    case "name":
      return "";
    case "startDate":
    case "endDate":
      return "";
    case "duration":
      return 0;
    case "progress":
      return 0;
    case "color":
      return DEFAULT_TASK_COLOR;
    case "type":
      return "task";
    default: {
      const _exhaustive: never = field;
      return _exhaustive;
    }
  }
}
