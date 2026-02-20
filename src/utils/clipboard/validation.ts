/**
 * Utility functions for validating cell paste operations.
 * Ensures field type matching and prevents invalid pastes.
 */

import type { Task } from "../../types/chart.types";
import type { EditableField } from "../../store/slices/taskSlice";
import { COLORS } from "../../styles/design-tokens";

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
): { valid: boolean; error?: string } {
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
 * Get the default "clear" value for a field when cutting a cell.
 *
 * @param field - Field to get clear value for
 * @returns Appropriate default/empty value for the field type
 */
export function getClearValueForField(field: EditableField): unknown {
  switch (field) {
    case "name":
      return "";
    case "startDate":
      return "";
    case "endDate":
      return "";
    case "duration":
      return 0;
    case "progress":
      return 0;
    case "color":
      return COLORS.chart.taskDefault;
    case "type":
      return "task";
    default:
      return "";
  }
}
