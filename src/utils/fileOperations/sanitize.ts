/**
 * Layer 5: String Sanitization
 * Remove XSS vectors from all string fields using DOMPurify
 */

import DOMPurify from "dompurify";
import type { GanttFile, SerializedTask } from "./types";
import { DANGEROUS_KEYS, isPlainObject } from "./constants";

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
      viewSettings: sanitizeViewSettings(file.chart.viewSettings),
      exportSettings: isPlainObject(file.chart.exportSettings)
        ? sanitizeExportSettings(file.chart.exportSettings)
        : undefined,
    },
  };
}

/**
 * Sanitize user-facing string fields in ViewSettings.
 * Machine-readable fields (booleans, numbers, arrays of IDs) are passed through.
 */
function sanitizeViewSettings(
  vs: GanttFile["chart"]["viewSettings"]
): GanttFile["chart"]["viewSettings"] {
  return {
    ...vs,
    projectTitle: vs.projectTitle
      ? sanitizeString(vs.projectTitle)
      : vs.projectTitle,
    projectAuthor: vs.projectAuthor
      ? sanitizeString(vs.projectAuthor)
      : vs.projectAuthor,
    holidayRegion: vs.holidayRegion
      ? sanitizeString(vs.holidayRegion)
      : vs.holidayRegion,
  };
}

/**
 * Sanitize export settings values.
 * Most fields are enums/numbers/booleans, but future versions may add
 * user-entered strings. Generic deep sanitization ensures safety.
 */
function sanitizeExportSettings(
  settings: NonNullable<GanttFile["chart"]["exportSettings"]>
): NonNullable<GanttFile["chart"]["exportSettings"]> {
  // SAFETY: ExportOptions is a typed interface without an index signature,
  // so we cast through unknown to satisfy the compiler. sanitizeObject
  // preserves all keys and only transforms string values via DOMPurify.
  return sanitizeObject(
    settings as unknown as Record<string, unknown>,
    0
  ) as unknown as NonNullable<GanttFile["chart"]["exportSettings"]>;
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
 * At depth limit: still sanitizes direct string values but stops recursing
 * into nested objects/arrays, preventing stack overflow while ensuring
 * no unsanitized strings pass through.
 */
function sanitizeObject(
  obj: Record<string, unknown>,
  depth: number
): Record<string, unknown> {
  const atLimit = depth > MAX_SANITIZE_DEPTH;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    if (typeof value === "string") {
      result[key] = sanitizeString(value);
    } else if (atLimit) {
      // At depth limit: keep non-string primitives, drop nested structures
      if (typeof value !== "object" || value === null) {
        result[key] = value;
      }
      // Nested objects/arrays at the limit are dropped — they cannot be
      // safely sanitized without recursion and may contain XSS payloads.
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
 * At depth limit: still sanitizes direct string values but stops recursing
 * into nested objects/arrays (which are filtered out to avoid undefined holes).
 */
function sanitizeArray(arr: unknown[], depth: number): unknown[] {
  const atLimit = depth > MAX_SANITIZE_DEPTH;

  const result: unknown[] = [];

  for (const item of arr) {
    if (typeof item === "string") {
      result.push(sanitizeString(item));
    } else if (atLimit) {
      // At depth limit: keep non-string primitives, drop nested structures
      // entirely so the array never contains undefined holes.
      if (typeof item !== "object" || item === null) {
        result.push(item);
      }
    } else if (Array.isArray(item)) {
      result.push(sanitizeArray(item, depth + 1));
    } else if (typeof item === "object" && item !== null) {
      result.push(sanitizeObject(item as Record<string, unknown>, depth + 1));
    } else {
      result.push(item);
    }
  }

  return result;
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
