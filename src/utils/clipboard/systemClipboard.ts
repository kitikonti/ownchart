/**
 * System clipboard utilities for cross-tab copy/paste.
 * Uses the browser Clipboard API to share data between tabs.
 */

import type { Task } from "../../types/chart.types";
import type { Dependency } from "../../types/dependency.types";
import type { EditableField } from "../../types/task.types";

// Prefix to identify OwnChart data in the clipboard
const OWNCHART_ROW_PREFIX = "OWNCHART_ROWS:";
const OWNCHART_CELL_PREFIX = "OWNCHART_CELL:";

// Valid EditableField values (duplicated here to avoid circular import from store)
const VALID_EDITABLE_FIELDS = new Set<string>([
  "name",
  "startDate",
  "endDate",
  "duration",
  "progress",
  "color",
  "type",
]);

/** Validate that a parsed object has the minimum required Task shape. */
function isValidTaskShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null) return false;
  const t = obj as Record<string, unknown>;
  return typeof t.id === "string" && typeof t.name === "string";
}

/**
 * Data structure for row clipboard in system clipboard
 */
export interface SystemRowClipboardData {
  tasks: Task[];
  dependencies: Dependency[];
}

/**
 * Data structure for cell clipboard in system clipboard
 */
export interface SystemCellClipboardData {
  value: Task[EditableField];
  field: EditableField;
}

/**
 * Write row data to system clipboard.
 * Stores serialized JSON with a prefix for identification.
 */
export async function writeRowsToSystemClipboard(
  tasks: Task[],
  dependencies: Dependency[]
): Promise<boolean> {
  try {
    const data: SystemRowClipboardData = { tasks, dependencies };
    const text = OWNCHART_ROW_PREFIX + JSON.stringify(data);

    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn("Failed to write to system clipboard:", error);
    return false;
  }
}

/**
 * Write cell data to system clipboard.
 */
export async function writeCellToSystemClipboard(
  value: Task[EditableField],
  field: EditableField
): Promise<boolean> {
  try {
    const data: SystemCellClipboardData = { value, field };
    const text = OWNCHART_CELL_PREFIX + JSON.stringify(data);

    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn("Failed to write to system clipboard:", error);
    return false;
  }
}

/**
 * Read row data from system clipboard.
 * Returns null if clipboard doesn't contain OwnChart row data.
 */
export async function readRowsFromSystemClipboard(): Promise<SystemRowClipboardData | null> {
  try {
    const text = await navigator.clipboard.readText();

    if (!text.startsWith(OWNCHART_ROW_PREFIX)) {
      return null;
    }

    const jsonStr = text.slice(OWNCHART_ROW_PREFIX.length);
    const data = JSON.parse(jsonStr) as SystemRowClipboardData;

    // Structural validation
    if (!Array.isArray(data.tasks) || !Array.isArray(data.dependencies)) {
      return null;
    }

    // Verify each task has the minimum required shape
    if (!data.tasks.every(isValidTaskShape)) {
      return null;
    }

    return data;
  } catch (error) {
    console.warn("Failed to read from system clipboard:", error);
    return null;
  }
}

/**
 * Read cell data from system clipboard.
 * Returns null if clipboard doesn't contain OwnChart cell data.
 */
export async function readCellFromSystemClipboard(): Promise<SystemCellClipboardData | null> {
  try {
    const text = await navigator.clipboard.readText();

    if (!text.startsWith(OWNCHART_CELL_PREFIX)) {
      return null;
    }

    const jsonStr = text.slice(OWNCHART_CELL_PREFIX.length);
    const data = JSON.parse(jsonStr) as SystemCellClipboardData;

    // Validate field is a known EditableField value
    if (!VALID_EDITABLE_FIELDS.has(data.field) || data.value === undefined) {
      return null;
    }

    return data;
  } catch (error) {
    console.warn("Failed to read from system clipboard:", error);
    return null;
  }
}

/**
 * Check what type of OwnChart data is in the system clipboard.
 * Returns "row", "cell", or null if no OwnChart data.
 */
export async function getSystemClipboardType(): Promise<"row" | "cell" | null> {
  try {
    const text = await navigator.clipboard.readText();

    if (text.startsWith(OWNCHART_ROW_PREFIX)) {
      return "row";
    }
    if (text.startsWith(OWNCHART_CELL_PREFIX)) {
      return "cell";
    }
    return null;
  } catch (error) {
    console.warn("Failed to check system clipboard:", error);
    return null;
  }
}

/**
 * Clear OwnChart data from system clipboard by writing empty text.
 */
export async function clearSystemClipboard(): Promise<void> {
  try {
    await navigator.clipboard.writeText("");
  } catch (error) {
    console.warn("Failed to clear system clipboard:", error);
  }
}

/**
 * Check if the clipboard API is available.
 */
export function isClipboardApiAvailable(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard !== "undefined" &&
    typeof navigator.clipboard.writeText === "function" &&
    typeof navigator.clipboard.readText === "function"
  );
}
