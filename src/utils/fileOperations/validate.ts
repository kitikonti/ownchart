/**
 * 6-layer validation pipeline for GanttFile security and integrity
 *
 * Layer 1: Pre-Parse Validation (file size, extension)
 * Layer 2: Safe JSON Parsing (prototype pollution prevention)
 * Layer 3: Structure Validation (required fields, types)
 * Layer 4: Semantic Validation (IDs, dates, hierarchy)
 * Layer 5: Sanitization (DOMPurify - in sanitize.ts)
 * Layer 6: Migration (version compatibility - in migrate.ts)
 */

import type { GanttFile } from "./types";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_TASKS = 10000;

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Layer 1: Pre-Parse Validation
 * Check file size and extension before parsing
 */
export async function validatePreParse(file: File): Promise<void> {
  // File size check
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError(
      "FILE_TOO_LARGE",
      `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds limit of 50MB`
    );
  }

  // File extension check
  if (!file.name.endsWith(".ownchart")) {
    throw new ValidationError(
      "INVALID_EXTENSION",
      "File must have .ownchart extension"
    );
  }
}

/**
 * Layer 2: Safe JSON Parsing
 * Prevent prototype pollution via custom reviver
 */
export function safeJsonParse(jsonString: string): unknown {
  try {
    return JSON.parse(jsonString, (key, value) => {
      // Block prototype pollution
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        return undefined;
      }
      return value;
    });
  } catch (e) {
    throw new ValidationError(
      "INVALID_JSON",
      `Invalid JSON: ${(e as Error).message}`
    );
  }
}

/**
 * Layer 3: Structure Validation
 * Check required fields and types
 */
export function validateStructure(data: unknown): void {
  if (!data || typeof data !== "object") {
    throw new ValidationError(
      "INVALID_STRUCTURE",
      "File must be a JSON object"
    );
  }

  const file = data as Record<string, unknown>;

  // Required top-level fields
  if (typeof file.fileVersion !== "string") {
    throw new ValidationError(
      "MISSING_FIELD",
      "Missing required field: fileVersion"
    );
  }

  if (!file.chart || typeof file.chart !== "object") {
    throw new ValidationError("MISSING_FIELD", "Missing required field: chart");
  }

  const chart = file.chart as Record<string, unknown>;

  // Required chart fields
  if (!Array.isArray(chart.tasks)) {
    throw new ValidationError(
      "INVALID_STRUCTURE",
      "chart.tasks must be an array"
    );
  }

  if (chart.tasks.length > MAX_TASKS) {
    throw new ValidationError(
      "TOO_MANY_TASKS",
      `File contains ${chart.tasks.length} tasks (max: ${MAX_TASKS})`
    );
  }

  // Validate each task structure
  chart.tasks.forEach((task: unknown, index: number) => {
    if (!task || typeof task !== "object") {
      throw new ValidationError(
        "INVALID_TASK",
        `Task at index ${index} is not an object`
      );
    }

    const t = task as Record<string, unknown>;
    const required = [
      "id",
      "name",
      "startDate",
      "endDate",
      "duration",
      "progress",
      "color",
      "order",
    ];

    for (const field of required) {
      if (!(field in t)) {
        throw new ValidationError(
          "MISSING_FIELD",
          `Task ${index} missing field: ${field}`
        );
      }
    }
  });

  // Validate viewSettings exists
  if (!chart.viewSettings || typeof chart.viewSettings !== "object") {
    throw new ValidationError(
      "MISSING_FIELD",
      "Missing required field: chart.viewSettings"
    );
  }
}

/**
 * Layer 4: Semantic Validation
 * Check data integrity (IDs, dates, hierarchy)
 */
export function validateSemantics(file: GanttFile): void {
  const taskIds = new Set<string>();
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  file.chart.tasks.forEach((task, index) => {
    // Validate UUID
    if (!uuidRegex.test(task.id)) {
      throw new ValidationError(
        "INVALID_ID",
        `Task ${index} has invalid UUID: ${task.id}`
      );
    }

    // Check for duplicate IDs
    if (taskIds.has(task.id)) {
      throw new ValidationError(
        "DUPLICATE_ID",
        `Duplicate task ID: ${task.id}`
      );
    }
    taskIds.add(task.id);

    // Validate dates
    if (!isValidISODate(task.startDate)) {
      throw new ValidationError(
        "INVALID_DATE",
        `Task ${index} has invalid startDate: ${task.startDate}`
      );
    }
    if (!isValidISODate(task.endDate)) {
      // Backward compat: milestones saved with endDate "" get auto-fixed
      if (task.type === "milestone" && task.endDate === "") {
        task.endDate = task.startDate;
      } else {
        throw new ValidationError(
          "INVALID_DATE",
          `Task ${index} has invalid endDate: ${task.endDate}`
        );
      }
    }

    // Validate date order
    if (new Date(task.endDate) < new Date(task.startDate)) {
      throw new ValidationError(
        "INVALID_DATE_ORDER",
        `Task ${index}: endDate before startDate`
      );
    }

    // Validate progress
    if (
      typeof task.progress !== "number" ||
      task.progress < 0 ||
      task.progress > 100
    ) {
      throw new ValidationError(
        "INVALID_PROGRESS",
        `Task ${index} has invalid progress: ${task.progress}`
      );
    }

    // Validate color
    if (!isValidHexColor(task.color)) {
      throw new ValidationError(
        "INVALID_COLOR",
        `Task ${index} has invalid color: ${task.color}`
      );
    }
  });

  // Validate hierarchy (no dangling parents)
  file.chart.tasks.forEach((task, index) => {
    if (task.parent && !taskIds.has(task.parent)) {
      throw new ValidationError(
        "DANGLING_PARENT",
        `Task ${index} references non-existent parent: ${task.parent}`
      );
    }
  });

  // Check for circular references
  detectCircularHierarchy(file.chart.tasks);
}

/**
 * Validate ISO date string (YYYY-MM-DD)
 */
function isValidISODate(dateStr: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validate hex color (#RRGGBB or #RGB)
 */
function isValidHexColor(color: string): boolean {
  const hexColorRegex = /^#([0-9A-F]{3}){1,2}$/i;
  return hexColorRegex.test(color);
}

/**
 * Detect circular hierarchy references
 */
function detectCircularHierarchy(
  tasks: Array<{ id: string; parent?: string }>
): void {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(taskId: string, path: string[]): void {
    if (recursionStack.has(taskId)) {
      throw new ValidationError(
        "CIRCULAR_HIERARCHY",
        `Circular reference detected: ${path.join(" -> ")} -> ${taskId}`
      );
    }

    if (visited.has(taskId)) return;

    visited.add(taskId);
    recursionStack.add(taskId);

    const task = tasks.find((t) => t.id === taskId);
    if (task?.parent) {
      dfs(task.parent, [...path, taskId]);
    }

    recursionStack.delete(taskId);
  }

  tasks.forEach((task) => {
    if (!visited.has(task.id)) {
      dfs(task.id, []);
    }
  });
}
