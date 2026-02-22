/**
 * Deserialization utilities for converting GanttFile JSON to app state
 */

import type { Task, TaskType } from "../../types/chart.types";
import type { HexColor } from "../../types/branded.types";
import type { Dependency, DependencyType } from "../../types/dependency.types";
import type {
  GanttFile,
  SerializedTask,
  SerializedDependency,
  DeserializeResult,
  ViewSettings,
} from "./types";
import type { ExportOptions } from "../export/types";
import {
  validatePreParse,
  safeJsonParse,
  validateStructure,
  validateSemantics,
  ValidationError,
} from "./validate";
import { sanitizeGanttFile } from "./sanitize";
import { migrateGanttFile, needsMigration, isFromFuture } from "./migrate";
import { FILE_VERSION } from "../../config/version";
import { normalizeTaskOrder } from "../../utils/hierarchy";
import { MIN_ZOOM, MAX_ZOOM } from "../../utils/timelineUtils";

/** Keys consumed by deserializeTask — others are preserved as __unknownFields */
const DESERIALIZED_TASK_KEYS = new Set([
  "id",
  "name",
  "startDate",
  "endDate",
  "duration",
  "progress",
  "color",
  "order",
  "type",
  "parent",
  "open",
  "colorOverride",
  "metadata",
]);

/** Keys consumed by deserializeDependency — others are preserved as __unknownFields */
const DESERIALIZED_DEPENDENCY_KEYS = new Set([
  "id",
  "from",
  "to",
  "type",
  "lag",
  "createdAt",
]);

/** Create a failed DeserializeResult */
function errorResult(code: string, message: string): DeserializeResult {
  return { success: false, error: { code, message, recoverable: false } };
}

/** Convert a ValidationError to an error result, re-throw unknown errors */
function runValidation(fn: () => void): DeserializeResult | null {
  try {
    fn();
    return null;
  } catch (e) {
    if (e instanceof ValidationError) {
      return errorResult(e.code, e.message);
    }
    throw e;
  }
}

/**
 * Run validation layers 1-3 and return parsed GanttFile or error
 */
function parseAndValidate(
  content: string,
  fileName: string,
  fileSize?: number
): { ganttFile: GanttFile } | { error: DeserializeResult } {
  // Layer 1: Pre-parse validation (file size, extension)
  if (fileSize !== undefined) {
    const err = runValidation(() =>
      validatePreParse({ name: fileName, size: fileSize })
    );
    if (err) return { error: err };
  }

  // Layer 2: Safe JSON parsing
  let parsed: unknown;
  try {
    parsed = safeJsonParse(content);
  } catch (e) {
    if (e instanceof ValidationError) {
      return { error: errorResult(e.code, e.message) };
    }
    return {
      error: errorResult(
        "INVALID_JSON",
        `Invalid JSON: ${(e as Error).message}`
      ),
    };
  }

  // Layer 3: Structure validation
  const structErr = runValidation(() => validateStructure(parsed));
  if (structErr) return { error: structErr };

  // Safe after validateStructure confirms required shape
  return { ganttFile: parsed as GanttFile };
}

/**
 * Apply migration if needed, collect warnings
 */
function applyMigration(
  ganttFile: GanttFile,
  warnings: string[]
): { ganttFile: GanttFile; wasMigrated: boolean } {
  let wasMigrated = false;

  if (needsMigration(ganttFile.fileVersion)) {
    const originalVersion = ganttFile.fileVersion;
    ganttFile = migrateGanttFile(ganttFile);
    wasMigrated = true;
    warnings.push(`File migrated from v${originalVersion} to v${FILE_VERSION}`);
  }

  if (isFromFuture(ganttFile.fileVersion)) {
    warnings.push(
      "This file was created with a newer version. Some features may not work correctly."
    );
  }

  return { ganttFile, wasMigrated };
}

/**
 * Collect fields not in the consumedKeys set for round-trip preservation
 */
function extractUnknownFields(
  obj: object,
  consumedKeys: Set<string>
): Record<string, unknown> | undefined {
  const unknownFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!consumedKeys.has(key)) {
      unknownFields[key] = value;
    }
  }
  return Object.keys(unknownFields).length > 0 ? unknownFields : undefined;
}

/**
 * Deserialize GanttFile JSON string to app state
 * Applies all 6 validation layers + migration + sanitization
 *
 * @param content - JSON string from file
 * @param fileName - Original file name
 * @param fileSize - File size in bytes (for Layer 1 validation)
 * @returns DeserializeResult with success/error/warnings
 */
export function deserializeGanttFile(
  content: string,
  fileName: string,
  fileSize?: number
): DeserializeResult {
  const warnings: string[] = [];

  try {
    const parseResult = parseAndValidate(content, fileName, fileSize);
    if ("error" in parseResult) return parseResult.error;

    const migration = applyMigration(parseResult.ganttFile, warnings);
    let ganttFile = migration.ganttFile;

    // Layer 4: Semantic validation (after migration so migrated data gets validated)
    const semanticErr = runValidation(() => validateSemantics(ganttFile));
    if (semanticErr) return semanticErr;

    // Layer 5: Sanitization
    ganttFile = sanitizeGanttFile(ganttFile);

    const tasks = ganttFile.chart.tasks.map(deserializeTask);
    normalizeTaskOrder(tasks);

    const dependencies = (ganttFile.chart.dependencies || []).map(
      deserializeDependency
    );

    return {
      success: true,
      data: {
        tasks,
        dependencies,
        viewSettings: sanitizeViewSettings(ganttFile.chart.viewSettings),
        exportSettings: sanitizeExportSettings(ganttFile.chart.exportSettings),
        chartName: ganttFile.chart.name,
        chartId: ganttFile.chart.id,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      migrated: migration.wasMigrated,
    };
  } catch (e) {
    return errorResult(
      "UNKNOWN_ERROR",
      `Unexpected error: ${(e as Error).message}`
    );
  }
}

/**
 * Convert SerializedTask to Task
 * Preserves unknown fields for round-trip compatibility
 */
function deserializeTask(serialized: SerializedTask): Task & {
  __unknownFields?: Record<string, unknown>;
} {
  const endDate =
    serialized.type === "milestone" && !serialized.endDate
      ? serialized.startDate
      : serialized.endDate;

  const task: Task & { __unknownFields?: Record<string, unknown> } = {
    id: serialized.id,
    name: serialized.name,
    startDate: serialized.startDate,
    endDate: endDate,
    duration: serialized.duration,
    progress: serialized.progress ?? 0,
    color: serialized.color as HexColor, // Validated by validateTaskColors
    order: serialized.order,
    type: (serialized.type ?? "task") as TaskType, // Validated by validateTaskSemantics
    parent: serialized.parent,
    open: serialized.open ?? true,
    colorOverride: serialized.colorOverride as HexColor | undefined, // Validated by validateTaskColors
    metadata: serialized.metadata ?? {},
  };

  const unknownFields = extractUnknownFields(
    serialized,
    DESERIALIZED_TASK_KEYS
  );
  if (unknownFields) {
    return { ...task, __unknownFields: unknownFields };
  }

  return task;
}

/**
 * Convert SerializedDependency to Dependency
 * Preserves unknown fields for round-trip compatibility
 */
function deserializeDependency(
  serialized: SerializedDependency
): Dependency & { __unknownFields?: Record<string, unknown> } {
  const dep: Dependency & { __unknownFields?: Record<string, unknown> } = {
    id: serialized.id,
    fromTaskId: serialized.from,
    toTaskId: serialized.to,
    type: serialized.type as DependencyType, // Validated by validateDependencies
    lag: serialized.lag,
    createdAt: serialized.createdAt ?? "",
  };

  const unknownFields = extractUnknownFields(
    serialized,
    DESERIALIZED_DEPENDENCY_KEYS
  );
  if (unknownFields) {
    return { ...dep, __unknownFields: unknownFields };
  }

  return dep;
}

/** Check that a value is a finite number, otherwise return the fallback */
function finiteOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Check that a value is a finite positive number, otherwise return the fallback */
function finitePositiveOr(value: unknown, fallback: null): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

/**
 * Sanitize viewSettings — clamp/fix invalid values rather than rejecting the file.
 * Protects against NaN/Infinity/wrong types propagating into app state.
 */
function sanitizeViewSettings(raw: ViewSettings): ViewSettings {
  const zoom = finiteOr(raw.zoom, 1);
  const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));

  const panOffset = {
    x: finiteOr(raw.panOffset?.x, 0),
    y: finiteOr(raw.panOffset?.y, 0),
  };

  return {
    ...raw,
    zoom: clampedZoom,
    panOffset,
    taskTableWidth:
      raw.taskTableWidth === null
        ? null
        : finitePositiveOr(raw.taskTableWidth, null),
    showWeekends:
      typeof raw.showWeekends === "boolean" ? raw.showWeekends : true,
    showTodayMarker:
      typeof raw.showTodayMarker === "boolean" ? raw.showTodayMarker : true,
    showHolidays:
      typeof raw.showHolidays === "boolean" ? raw.showHolidays : undefined,
    showDependencies:
      typeof raw.showDependencies === "boolean"
        ? raw.showDependencies
        : undefined,
    showProgress:
      typeof raw.showProgress === "boolean" ? raw.showProgress : undefined,
    workingDaysMode:
      typeof raw.workingDaysMode === "boolean"
        ? raw.workingDaysMode
        : undefined,
    isTaskTableCollapsed:
      typeof raw.isTaskTableCollapsed === "boolean"
        ? raw.isTaskTableCollapsed
        : undefined,
  };
}

/**
 * Sanitize exportSettings — drop entirely if not a valid object.
 */
function sanitizeExportSettings(
  raw: ExportOptions | undefined
): ExportOptions | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }
  return raw;
}
