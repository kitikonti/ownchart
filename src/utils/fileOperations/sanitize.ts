/**
 * Layer 5: String Sanitization
 * Remove XSS vectors from all string fields using DOMPurify
 */

import DOMPurify from "dompurify";
import type { GanttFile } from "./types";

/**
 * Sanitize all string fields in a GanttFile
 * Removes HTML tags and event handlers to prevent XSS attacks
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
      tasks: file.chart.tasks.map((task) => {
        const taskWithDescription = task as typeof task & {
          description?: string;
        };
        return {
          ...task,
          name: sanitizeString(task.name),
          description: taskWithDescription.description
            ? sanitizeString(taskWithDescription.description)
            : taskWithDescription.description,
          metadata: task.metadata
            ? sanitizeObject(task.metadata)
            : task.metadata,
        };
      }),
    },
  };
}

/**
 * Recursively sanitize all string values in an object
 */
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizeString(item)
          : typeof item === "object" && item !== null
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      );
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Sanitize a single string value
 * Removes all HTML tags and event handlers
 * Preserves text content only
 */
function sanitizeString(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Preserve text content
  });
}
