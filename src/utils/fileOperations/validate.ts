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

import type { GanttFile, SerializedTask, SerializedDependency } from "./types";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_TASKS = 10000;
const REQUIRED_TASK_FIELDS = [
  "id",
  "name",
  "startDate",
  "endDate",
  "duration",
  "progress",
  "color",
  "order",
];

const VALID_TASK_TYPES = new Set(["task", "summary", "milestone"]);

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
export function validatePreParse(file: { name: string; size: number }): void {
  // Empty file check
  if (file.size === 0) {
    throw new ValidationError("FILE_EMPTY", "File is empty");
  }

  // File size check
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError(
      "FILE_TOO_LARGE",
      `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
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
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ValidationError(
      "INVALID_STRUCTURE",
      "File must be a JSON object"
    );
  }

  const file = data as Record<string, unknown>;

  if (typeof file.fileVersion !== "string") {
    throw new ValidationError(
      "MISSING_FIELD",
      "Missing required field: fileVersion"
    );
  }

  if (!file.chart || typeof file.chart !== "object") {
    throw new ValidationError("MISSING_FIELD", "Missing required field: chart");
  }

  validateChartStructure(file.chart as Record<string, unknown>);
}

/**
 * Validate chart-level structure (id, name, tasks, viewSettings)
 */
function validateChartStructure(chart: Record<string, unknown>): void {
  if (typeof chart.id !== "string") {
    throw new ValidationError(
      "MISSING_FIELD",
      "Missing or invalid field: chart.id"
    );
  }

  if (typeof chart.name !== "string") {
    throw new ValidationError(
      "MISSING_FIELD",
      "Missing or invalid field: chart.name"
    );
  }

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

  chart.tasks.forEach((task: unknown, index: number) =>
    validateTaskStructure(task, index)
  );

  if (!chart.viewSettings || typeof chart.viewSettings !== "object") {
    throw new ValidationError(
      "MISSING_FIELD",
      "Missing required field: chart.viewSettings"
    );
  }
}

/**
 * Validate a single task's structure (required fields present)
 */
function validateTaskStructure(task: unknown, index: number): void {
  if (!task || typeof task !== "object") {
    throw new ValidationError(
      "INVALID_TASK",
      `Task at index ${index} is not an object`
    );
  }

  const t = task as Record<string, unknown>;
  for (const field of REQUIRED_TASK_FIELDS) {
    if (!(field in t)) {
      throw new ValidationError(
        "MISSING_FIELD",
        `Task ${index} missing field: ${field}`
      );
    }
  }
}

/**
 * Layer 4: Semantic Validation
 * Check data integrity (IDs, dates, hierarchy)
 */
export function validateSemantics(file: GanttFile): void {
  const taskIds = new Set<string>();

  file.chart.tasks.forEach((task, index) => {
    validateTaskSemantics(task, index, taskIds);
    taskIds.add(task.id);
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

  detectCircularHierarchy(file.chart.tasks);

  if (file.chart.dependencies) {
    validateDependencies(file.chart.dependencies, taskIds);
  }
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate a single task's semantic integrity (ID, dates, progress, color)
 */
function validateTaskSemantics(
  task: SerializedTask,
  index: number,
  taskIds: Set<string>
): void {
  validateTaskId(task, index, taskIds);
  validateTaskDates(task, index);
  validateTaskNumericFields(task, index);
  validateTaskColors(task, index);

  if (task.type && !VALID_TASK_TYPES.has(task.type)) {
    throw new ValidationError(
      "INVALID_TASK_TYPE",
      `Task ${index} has invalid type: ${task.type}`
    );
  }
}

function validateTaskId(
  task: SerializedTask,
  index: number,
  taskIds: Set<string>
): void {
  if (!UUID_REGEX.test(task.id)) {
    throw new ValidationError(
      "INVALID_ID",
      `Task ${index} has invalid UUID: ${task.id}`
    );
  }

  if (taskIds.has(task.id)) {
    throw new ValidationError("DUPLICATE_ID", `Duplicate task ID: ${task.id}`);
  }
}

function validateTaskDates(task: SerializedTask, index: number): void {
  if (!isValidISODate(task.startDate)) {
    throw new ValidationError(
      "INVALID_DATE",
      `Task ${index} has invalid startDate: ${task.startDate}`
    );
  }

  if (!isValidISODate(task.endDate)) {
    // Milestones with empty endDate are auto-fixed during deserialization
    if (!(task.type === "milestone" && task.endDate === "")) {
      throw new ValidationError(
        "INVALID_DATE",
        `Task ${index} has invalid endDate: ${task.endDate}`
      );
    }
  }

  if (
    isValidISODate(task.endDate) &&
    new Date(task.endDate) < new Date(task.startDate)
  ) {
    throw new ValidationError(
      "INVALID_DATE_ORDER",
      `Task ${index}: endDate before startDate`
    );
  }
}

function validateTaskNumericFields(task: SerializedTask, index: number): void {
  if (
    typeof task.progress !== "number" ||
    !Number.isFinite(task.progress) ||
    task.progress < 0 ||
    task.progress > 100
  ) {
    throw new ValidationError(
      "INVALID_PROGRESS",
      `Task ${index} has invalid progress: ${task.progress}`
    );
  }

  if (
    typeof task.duration !== "number" ||
    !Number.isFinite(task.duration) ||
    task.duration < 0
  ) {
    throw new ValidationError(
      "INVALID_DURATION",
      `Task ${index} has invalid duration: ${task.duration}`
    );
  }
}

function validateTaskColors(task: SerializedTask, index: number): void {
  if (!isValidHexColor(task.color)) {
    throw new ValidationError(
      "INVALID_COLOR",
      `Task ${index} has invalid color: ${task.color}`
    );
  }

  if (task.colorOverride !== undefined) {
    if (typeof task.colorOverride !== "string") {
      throw new ValidationError(
        "INVALID_COLOR",
        `Task ${index} has non-string colorOverride: ${typeof task.colorOverride}`
      );
    }
    if (!isValidHexColor(task.colorOverride)) {
      throw new ValidationError(
        "INVALID_COLOR",
        `Task ${index} has invalid colorOverride: ${task.colorOverride}`
      );
    }
  }
}

const VALID_DEPENDENCY_TYPES = new Set(["FS", "SS", "FF", "SF"]);

/**
 * Validate dependency entries
 */
function validateDependencies(
  dependencies: SerializedDependency[],
  taskIds: Set<string>
): void {
  const depIds = new Set<string>();

  dependencies.forEach((dep, index) => {
    validateSingleDependency(dep, index, depIds, taskIds);
    depIds.add(dep.id);
  });
}

/**
 * Validate a single dependency's integrity (ID, type, lag, references)
 */
function validateSingleDependency(
  dep: SerializedDependency,
  index: number,
  depIds: Set<string>,
  taskIds: Set<string>
): void {
  if (!UUID_REGEX.test(dep.id)) {
    throw new ValidationError(
      "INVALID_ID",
      `Dependency ${index} has invalid UUID: ${dep.id}`
    );
  }

  if (depIds.has(dep.id)) {
    throw new ValidationError(
      "DUPLICATE_ID",
      `Duplicate dependency ID: ${dep.id}`
    );
  }

  if (!VALID_DEPENDENCY_TYPES.has(dep.type)) {
    throw new ValidationError(
      "INVALID_DEPENDENCY_TYPE",
      `Dependency ${index} has invalid type: ${dep.type}`
    );
  }

  if (
    dep.lag !== undefined &&
    (typeof dep.lag !== "number" || !Number.isFinite(dep.lag))
  ) {
    throw new ValidationError(
      "INVALID_LAG",
      `Dependency ${index} has invalid lag: ${dep.lag}`
    );
  }

  if (dep.from === dep.to) {
    throw new ValidationError(
      "SELF_DEPENDENCY",
      `Dependency ${index} is a self-reference: ${dep.from}`
    );
  }

  if (!taskIds.has(dep.from)) {
    throw new ValidationError(
      "DANGLING_DEPENDENCY",
      `Dependency ${index} references non-existent source task: ${dep.from}`
    );
  }
  if (!taskIds.has(dep.to)) {
    throw new ValidationError(
      "DANGLING_DEPENDENCY",
      `Dependency ${index} references non-existent target task: ${dep.to}`
    );
  }
}

/**
 * Validate ISO date string (YYYY-MM-DD)
 */
function isValidISODate(dateStr: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateStr)) return false;

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  // Guard against Date overflow (e.g. "2026-02-30" silently rolls to March 2)
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
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
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
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

    const task = taskMap.get(taskId);
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
