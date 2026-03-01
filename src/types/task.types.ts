/**
 * Task-related UI types extracted from taskSlice to avoid circular imports.
 */

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
