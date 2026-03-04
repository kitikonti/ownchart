/**
 * System clipboard utilities for cross-tab copy/paste.
 * Uses the browser Clipboard API to share data between tabs.
 */

import type { Task } from "../../types/chart.types";
import { TASK_TYPES } from "../../types/chart.types";
import type { Dependency } from "../../types/dependency.types";
import { DEPENDENCY_TYPES } from "../../types/dependency.types";
import { EDITABLE_FIELDS, type EditableField } from "../../types/task.types";

/**
 * Data structure for row clipboard in system clipboard.
 */
export interface SystemRowClipboardData {
  tasks: Task[];
  dependencies: Dependency[];
}

/**
 * Data structure for cell clipboard in system clipboard.
 */
export interface SystemCellClipboardData {
  value: Task[EditableField];
  field: EditableField;
}

// Prefix to identify OwnChart data in the clipboard
const OWNCHART_ROW_PREFIX = "OWNCHART_ROWS:";
const OWNCHART_CELL_PREFIX = "OWNCHART_CELL:";

// Derived from shared constants — single source of truth for both.
const VALID_EDITABLE_FIELDS: Set<EditableField> = new Set(EDITABLE_FIELDS);
const VALID_TASK_TYPES: Set<string> = new Set(TASK_TYPES);
const VALID_DEPENDENCY_TYPES: Set<string> = new Set(DEPENDENCY_TYPES);

// Hex color regex — exactly matches valid CSS hex lengths: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
// Lengths 5 and 7 are not valid CSS colors and are intentionally excluded.
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

// ISO 8601 date string — YYYY-MM-DD format used throughout OwnChart
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Safety limit — rejects payloads clearly too large to be valid chart data
const MAX_CLIPBOARD_SIZE = 5_000_000;

/** Logs a warning to the console in development mode only. No-op in production. */
function devWarn(...args: unknown[]): void {
  if (import.meta.env.DEV) console.warn(...args);
}

/** Returns true if v is a finite number (excludes NaN and ±Infinity). */
function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** Returns true if s parses as a valid date (not NaN). Used for datetime fields. */
function isValidDateString(s: string): boolean {
  return !Number.isNaN(Date.parse(s));
}

// NOTE: This validator manually mirrors the required/optional fields of the Task type
// (src/types/chart.types.ts). When adding a new field to Task, update this function too.
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
    t.id.length > 0 &&
    typeof t.name === "string" &&
    typeof t.startDate === "string" &&
    ISO_DATE_RE.test(t.startDate as string) &&
    typeof t.endDate === "string" &&
    ISO_DATE_RE.test(t.endDate as string) &&
    isFiniteNumber(t.duration) &&
    (t.duration as number) >= 0 &&
    isFiniteNumber(t.progress) &&
    (t.progress as number) >= 0 &&
    (t.progress as number) <= 100 &&
    typeof t.color === "string" &&
    HEX_COLOR_RE.test(t.color as string) &&
    isFiniteNumber(t.order) &&
    (t.order as number) >= 0 &&
    typeof t.metadata === "object" &&
    t.metadata !== null &&
    !Array.isArray(t.metadata) &&
    // Optional: type must be a known TaskType if present
    (t.type === undefined ||
      (typeof t.type === "string" && VALID_TASK_TYPES.has(t.type))) &&
    // Optional: parent must be a non-empty string (TaskId) if present
    (t.parent === undefined ||
      (typeof t.parent === "string" && t.parent.length > 0)) &&
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
    d.id.length > 0 &&
    typeof d.fromTaskId === "string" &&
    d.fromTaskId.length > 0 &&
    typeof d.toTaskId === "string" &&
    d.toTaskId.length > 0 &&
    typeof d.type === "string" &&
    VALID_DEPENDENCY_TYPES.has(d.type) &&
    typeof d.createdAt === "string" &&
    isValidDateString(d.createdAt)
  );
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
    devWarn("Failed to write to system clipboard:", error);
    return false;
  }
}

/**
 * Internal result type for readFromClipboard.
 * Distinguishes "no OwnChart data present" from "data present but malformed".
 */
type ClipboardReadResult =
  | { status: "no-match" }
  | { status: "parse-error"; reason: string }
  | { status: "ok"; data: Record<string, unknown> };

/**
 * Shared read helper — reads clipboard text, checks prefix, and parses JSON.
 * Returns a discriminated result:
 * - `no-match`: clipboard doesn't contain OwnChart data for this prefix
 * - `parse-error`: prefix matched (or payload exceeded the size limit) but the
 *   data is invalid; `reason` contains a diagnostic message logged in DEV mode
 * - `ok`: successfully parsed; `data` is the parsed object
 *
 * @remarks May throw if the Clipboard API itself rejects (e.g., permission denied).
 *   All callers must wrap invocations in a try/catch block.
 */
async function readFromClipboard(prefix: string): Promise<ClipboardReadResult> {
  const text = await navigator.clipboard.readText();
  if (text.length > MAX_CLIPBOARD_SIZE) {
    return {
      status: "parse-error",
      reason: `Payload too large (${text.length} bytes, limit ${MAX_CLIPBOARD_SIZE})`,
    };
  }
  if (!text.startsWith(prefix)) {
    return { status: "no-match" };
  }
  const jsonStr = text.slice(prefix.length);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return { status: "parse-error", reason: "JSON parse failed" };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { status: "parse-error", reason: "Root value is not an object" };
  }
  return { status: "ok", data: parsed as Record<string, unknown> };
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
 * Returns null if clipboard doesn't contain valid OwnChart row data.
 *
 * In DEV mode, logs a warning when data is present but fails validation —
 * this typically indicates a version mismatch or corrupted clipboard, which
 * is distinct from the expected "clipboard contains non-OwnChart text" case.
 */
export async function readRowsFromSystemClipboard(): Promise<SystemRowClipboardData | null> {
  try {
    const result = await readFromClipboard(OWNCHART_ROW_PREFIX);
    if (result.status === "no-match") return null;
    if (result.status === "parse-error") {
      devWarn("OwnChart row clipboard data is malformed:", result.reason);
      return null;
    }

    // safe cast — structure validated immediately below
    const data = result.data as unknown as SystemRowClipboardData;

    // Structural validation
    if (!Array.isArray(data.tasks) || !Array.isArray(data.dependencies)) {
      devWarn(
        "OwnChart row clipboard: missing tasks or dependencies array (possible version mismatch)"
      );
      return null;
    }

    // Verify each task has the minimum required shape
    if (!data.tasks.every(isValidTaskShape)) {
      devWarn(
        "OwnChart row clipboard: one or more tasks failed shape validation (possible version mismatch)"
      );
      return null;
    }

    // Verify each dependency has the minimum required shape
    if (!data.dependencies.every(isValidDependencyShape)) {
      devWarn(
        "OwnChart row clipboard: one or more dependencies failed shape validation (possible version mismatch)"
      );
      return null;
    }

    return data;
  } catch (error) {
    devWarn("Failed to read from system clipboard:", error);
    return null;
  }
}

/**
 * Read cell data from system clipboard.
 * Returns null if clipboard doesn't contain valid OwnChart cell data.
 *
 * In DEV mode, logs a warning when data is present but fails validation.
 *
 * @remarks The `field` is validated against known EditableField values.
 * The `value` is only checked for existence (not undefined) — callers should
 * validate the value type matches the expected type for the given field.
 */
export async function readCellFromSystemClipboard(): Promise<SystemCellClipboardData | null> {
  try {
    const result = await readFromClipboard(OWNCHART_CELL_PREFIX);
    if (result.status === "no-match") return null;
    if (result.status === "parse-error") {
      devWarn("OwnChart cell clipboard data is malformed:", result.reason);
      return null;
    }

    // safe cast — field and value validated immediately below
    const data = result.data as unknown as SystemCellClipboardData;

    // Validate field is a known EditableField value
    if (!VALID_EDITABLE_FIELDS.has(data.field) || data.value == null) {
      devWarn(
        "OwnChart cell clipboard: invalid field or missing value (possible version mismatch)"
      );
      return null;
    }

    return data;
  } catch (error) {
    devWarn("Failed to read from system clipboard:", error);
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
    // NOTE: Separate read from the actual data fetch — see JSDoc above.
    const text = await navigator.clipboard.readText();
    if (text.length > MAX_CLIPBOARD_SIZE) return null;

    if (text.startsWith(OWNCHART_ROW_PREFIX)) {
      return "row";
    }
    if (text.startsWith(OWNCHART_CELL_PREFIX)) {
      return "cell";
    }
    return null;
  } catch (error) {
    devWarn("Failed to check system clipboard:", error);
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
    devWarn("Failed to clear system clipboard:", error);
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
