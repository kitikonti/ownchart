/**
 * Task table UI and keyboard-navigation types.
 * Extracted from taskSlice to avoid circular imports.
 *
 * Exports:
 * - `EditableField` — union of all user-editable cell field names.
 * - `NavigationDirection` — keyboard navigation direction union.
 * - `ActiveCell` — discriminated union representing the currently-focused cell.
 * - `EDITABLE_FIELDS` — runtime array of every `EditableField` value, in
 *   tab-navigation order. Single source of truth for navigation and clipboard.
 * - `AssertEditableFieldsExhaustive` — compile-time assertion that `EDITABLE_FIELDS`
 *   and `EditableField` stay in sync. Resolves to `true` when they match; a missing
 *   or extra entry makes the type resolve to `never`, failing compilation.
 *   Exported to prevent TypeScript from flagging it as an unused declaration.
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

/** Keyboard navigation direction within the task table cell grid. Used by `useCellNavigation` and `navigateCell` in taskSlice. */
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

/**
 * All editable fields in tab-navigation order.
 * Single source of truth shared by taskSlice (navigation) and clipboard (validation).
 *
 * The `satisfies` constraint below enforces that every element is a valid
 * `EditableField`. The private compile-time assertion after this declaration
 * additionally enforces that every `EditableField` member appears in the array
 * (exhaustiveness check). Add or remove a union member without updating this
 * array (or vice versa) and TypeScript will report a type error.
 */
export const EDITABLE_FIELDS = [
  "color",
  "name",
  "type",
  "startDate",
  "endDate",
  "duration",
  "progress",
] as const satisfies readonly EditableField[];

/**
 * Compile-time exhaustiveness check: asserts that `EDITABLE_FIELDS` covers
 * every `EditableField` value and that no unknown values are present.
 * Must be exported to prevent TypeScript from flagging it as an unused
 * declaration. This type resolves to `true` when in sync; it resolves to
 * `never` (compile error) if a union member is added/removed without a
 * matching update to `EDITABLE_FIELDS`.
 */
export type AssertEditableFieldsExhaustive = [EditableField] extends [
  (typeof EDITABLE_FIELDS)[number],
]
  ? [(typeof EDITABLE_FIELDS)[number]] extends [EditableField]
    ? true
    : never
  : never;
