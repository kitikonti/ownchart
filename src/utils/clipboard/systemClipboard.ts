/**
 * System clipboard utilities for cross-tab copy/paste.
 * Uses the browser Clipboard API to share data between tabs.
 */

import type { Task } from "../../types/chart.types";
import { TASK_TYPES } from "../../types/chart.types";
import type { Dependency } from "../../types/dependency.types";
import { DEPENDENCY_TYPES } from "../../types/dependency.types";
import { EDITABLE_FIELDS, type EditableField } from "../../types/task.types";

// Prefix to identify OwnChart data in the clipboard
const OWNCHART_ROW_PREFIX = "OWNCHART_ROWS:";
const OWNCHART_CELL_PREFIX = "OWNCHART_CELL:";

// Derived from shared constants — single source of truth for both.
const VALID_EDITABLE_FIELDS: Set<EditableField> = new Set(EDITABLE_FIELDS);
const VALID_TASK_TYPES: Set<string> = new Set(TASK_TYPES);
const VALID_DEPENDENCY_TYPES: Set<string> = new Set(DEPENDENCY_TYPES);

// Hex color regex — covers #RGB, #RGBA, #RRGGBB, #RRGGBBAA
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

// Safety limit — rejects payloads clearly too large to be valid chart data
const MAX_CLIPBOARD_SIZE = 5_000_000;

/** Returns true if v is a finite number (excludes NaN and ±Infinity). */
function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * Validate that a parsed object has the minimum required Task shape.
 * Checks all required Task fields to catch cross-version or malformed clipboard data.
 * Optional fields (type, parent, open, colorOverride) are validated only when present.
 */
function isValidTaskShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null) return false;
  // safe cast — object type confirmed by guard above, structure validated immediately below
  const t = obj as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.name === "string" &&
    typeof t.startDate === "string" &&
    typeof t.endDate === "string" &&
    isFiniteNumber(t.duration) &&
    isFiniteNumber(t.progress) &&
    typeof t.color === "string" &&
    HEX_COLOR_RE.test(t.color as string) &&
    isFiniteNumber(t.order) &&
    typeof t.metadata === "object" &&
    t.metadata !== null &&
    // Optional: type must be a known TaskType if present
    (t.type === undefined ||
      (typeof t.type === "string" && VALID_TASK_TYPES.has(t.type))) &&
    // Optional: parent must be a string (TaskId) if present
    (t.parent === undefined || typeof t.parent === "string") &&
    // Optional: open must be boolean if present
    (t.open === undefined || typeof t.open === "boolean") &&
    // Optional: colorOverride must be a hex string if present
    (t.colorOverride === undefined ||
      (typeof t.colorOverride === "string" &&
        HEX_COLOR_RE.test(t.colorOverride as string)))
  );
}

/**
 * Validate that a parsed object has the minimum required Dependency shape.
 * Checks all required fields to catch cross-version or malformed clipboard data.
 * The `type` field is validated against known DependencyType values.
 */
function isValidDependencyShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null) return false;
  // safe cast — object type confirmed by guard above, structure validated immediately below
  const d = obj as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.fromTaskId === "string" &&
    typeof d.toTaskId === "string" &&
    typeof d.type === "string" &&
    VALID_DEPENDENCY_TYPES.has(d.type) &&
    typeof d.createdAt === "string"
  );
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

/** Shared write helper — serializes data with prefix to system clipboard. */
async function writeToClipboard(
  prefix: string,
  data: unknown
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(prefix + JSON.stringify(data));
    return true;
  } catch (error) {
    if (import.meta.env.DEV)
      console.warn("Failed to write to system clipboard:", error);
    return false;
  }
}

/**
 * Shared read helper — reads clipboard text, checks prefix, and parses JSON.
 * Returns the parsed value if the prefix matches and JSON is valid; null otherwise.
 */
async function readFromClipboard(prefix: string): Promise<unknown | null> {
  const text = await navigator.clipboard.readText();
  if (text.length > MAX_CLIPBOARD_SIZE) return null;
  if (!text.startsWith(prefix)) return null;
  const jsonStr = text.slice(prefix.length);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  return parsed;
}

/**
 * Write row data to system clipboard.
 * Stores serialized JSON with a prefix for identification.
 */
export async function writeRowsToSystemClipboard(
  tasks: Task[],
  dependencies: Dependency[]
): Promise<boolean> {
  const data: SystemRowClipboardData = { tasks, dependencies };
  return writeToClipboard(OWNCHART_ROW_PREFIX, data);
}

/**
 * Write cell data to system clipboard.
 */
export async function writeCellToSystemClipboard(
  value: Task[EditableField],
  field: EditableField
): Promise<boolean> {
  const data: SystemCellClipboardData = { value, field };
  return writeToClipboard(OWNCHART_CELL_PREFIX, data);
}

/**
 * Read row data from system clipboard.
 * Returns null if clipboard doesn't contain OwnChart row data.
 */
export async function readRowsFromSystemClipboard(): Promise<SystemRowClipboardData | null> {
  try {
    const parsed = await readFromClipboard(OWNCHART_ROW_PREFIX);
    if (parsed === null) return null;

    // safe cast — structure validated immediately below
    const data = parsed as SystemRowClipboardData;

    // Structural validation
    if (!Array.isArray(data.tasks) || !Array.isArray(data.dependencies)) {
      return null;
    }

    // Verify each task has the minimum required shape
    if (!data.tasks.every(isValidTaskShape)) {
      return null;
    }

    // Verify each dependency has the minimum required shape
    if (!data.dependencies.every(isValidDependencyShape)) {
      return null;
    }

    return data;
  } catch (error) {
    if (import.meta.env.DEV)
      console.warn("Failed to read from system clipboard:", error);
    return null;
  }
}

/**
 * Read cell data from system clipboard.
 * Returns null if clipboard doesn't contain OwnChart cell data.
 *
 * @remarks The `field` is validated against known EditableField values.
 * The `value` is only checked for existence (not undefined) — callers should
 * validate the value type matches the expected type for the given field.
 */
export async function readCellFromSystemClipboard(): Promise<SystemCellClipboardData | null> {
  try {
    const parsed = await readFromClipboard(OWNCHART_CELL_PREFIX);
    if (parsed === null) return null;

    // safe cast — field and value validated immediately below
    const data = parsed as SystemCellClipboardData;

    // Validate field is a known EditableField value
    if (!VALID_EDITABLE_FIELDS.has(data.field) || data.value == null) {
      return null;
    }

    return data;
  } catch (error) {
    if (import.meta.env.DEV)
      console.warn("Failed to read from system clipboard:", error);
    return null;
  }
}

/**
 * Check what type of OwnChart data is in the system clipboard.
 * Returns "row", "cell", or null if no OwnChart data.
 *
 * @remarks Performs a separate clipboard read. If you intend to also read the
 * clipboard content, prefer calling the read function directly — it returns null
 * for non-matching data — to avoid two clipboard API calls.
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
    if (import.meta.env.DEV)
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
    if (import.meta.env.DEV)
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
