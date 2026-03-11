/**
 * Task table UI and keyboard-navigation types.
 * Extracted from taskSlice to avoid circular imports.
 */

import type { TaskId } from "./branded.types";

export type EditableField =
  | "name"
  | "startDate"
  | "endDate"
  | "duration"
  | "progress"
  | "color"
  | "type";

/**
 * All editable fields in tab-navigation order.
 * Single source of truth shared by taskSlice (navigation) and clipboard (validation).
 */
export const EDITABLE_FIELDS: readonly EditableField[] = [
  "color",
  "name",
  "type",
  "startDate",
  "endDate",
  "duration",
  "progress",
];

export type NavigationDirection = "up" | "down" | "left" | "right";

/**
 * Active cell state — the cell currently focused for keyboard navigation or editing.
 * Shared by taskSlice (state), insertPosition, and prepareRowPaste utilities.
 *
 * Modelled as a discriminated union so the compiler enforces that `taskId` and
 * `field` are always either both non-null (a cell is active) or both null (no
 * cell is selected). The mixed state `{ taskId: someId, field: null }` is
 * therefore a compile-time error.
 */
export type ActiveCell =
  | { taskId: TaskId; field: EditableField }
  | { taskId: null; field: null };
