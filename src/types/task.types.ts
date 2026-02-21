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

export type NavigationDirection = "up" | "down" | "left" | "right";
