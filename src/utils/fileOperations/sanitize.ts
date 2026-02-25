/**
 * Layer 5: String Sanitization
 * Remove XSS vectors from all string fields using DOMPurify
 */

import DOMPurify from "dompurify";
import type { GanttFile, SerializedTask } from "./types";

/**
 * Keys that could cause prototype pollution if copied to a new object.
 * safeJsonParse (Layer 2) already strips these during parsing, but this
 * provides defense-in-depth for non-JSON sources (tests, plugins, etc.).
 */
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Task fields that contain non-content strings (IDs, dates, colors) — skip sanitization.
 * @see KNOWN_TASK_KEYS in constants.ts for the related round-trip field set.
 */
export const SKIP_SANITIZE_KEYS = new Set([
  "id",
  "startDate",
  "endDate",
  "color",
  "colorOverride",
  "parent",
  "type",
  "createdAt",
  "updatedAt",
]);

/** Maximum nesting depth for recursive sanitization to prevent stack overflow */
const MAX_SANITIZE_DEPTH = 50;

/**
 * Sanitize all string fields in a GanttFile.
 * Removes HTML tags and event handlers to prevent XSS attacks.
 */
export function sanitizeGanttFile(file: GanttFile): GanttFile {
  return {
    ...file,
    chart: {
      ...file.chart,
      name: sanitizeString(file.chart.name),
      description: file.chart.description
        ? sanitizeString(file.chart.description)
        : file.chart.description,
      tasks: file.chart.tasks.map(sanitizeTask),
      viewSettings: {
        ...file.chart.viewSettings,
        projectTitle: file.chart.viewSettings.projectTitle
          ? sanitizeString(file.chart.viewSettings.projectTitle)
          : file.chart.viewSettings.projectTitle,
        projectAuthor: file.chart.viewSettings.projectAuthor
          ? sanitizeString(file.chart.viewSettings.projectAuthor)
          : file.chart.viewSettings.projectAuthor,
      },
    },
  };
}

/**
 * Sanitize a single task, including unknown fields from future versions.
 * Skips ID-like fields (UUIDs, dates, colors) that are validated elsewhere.
 */
function sanitizeTask(task: SerializedTask): SerializedTask {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(task)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    if (SKIP_SANITIZE_KEYS.has(key)) {
      result[key] = value;
    } else if (typeof value === "string") {
      result[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null) {
      result[key] = Array.isArray(value)
        ? sanitizeArray(value, 1)
        : sanitizeObject(value as Record<string, unknown>, 1);
    } else {
      result[key] = value;
    }
  }

  return result as SerializedTask;
}

/**
 * Recursively sanitize all string values in an object.
 * Returns the object unchanged if depth limit is exceeded.
 */
function sanitizeObject(
  obj: Record<string, unknown>,
  depth: number
): Record<string, unknown> {
  if (depth > MAX_SANITIZE_DEPTH) return obj;

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    if (typeof value === "string") {
      result[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      result[key] = sanitizeArray(value, depth + 1);
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>, depth + 1);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Recursively sanitize all string values in an array.
 * Returns the array unchanged if depth limit is exceeded.
 */
function sanitizeArray(arr: unknown[], depth: number): unknown[] {
  if (depth > MAX_SANITIZE_DEPTH) return arr;

  return arr.map((item) =>
    typeof item === "string"
      ? sanitizeString(item)
      : typeof item === "object" && item !== null
        ? Array.isArray(item)
          ? sanitizeArray(item, depth + 1)
          : sanitizeObject(item as Record<string, unknown>, depth + 1)
        : item
  );
}

/**
 * Sanitize a single string value.
 * Removes all HTML tags and event handlers, preserves text content only.
 */
function sanitizeString(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Preserve text content
  });
}
