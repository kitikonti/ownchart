/**
 * Deserialization utilities for converting GanttFile JSON to app state
 */

import type { TaskType } from "../../types/chart.types";
import { type HexColor, toTaskId } from "../../types/branded.types";
import type { Dependency, DependencyType } from "../../types/dependency.types";
import type {
  GanttFile,
  SerializedTask,
  SerializedDependency,
  DeserializeResult,
  ViewSettings,
  TaskWithExtras,
} from "./types";
import type { ExportOptions } from "../export/types";
import type {
  TaskLabelPosition,
  WorkingDaysConfig,
} from "../../types/preferences.types";
import type { ColorModeState } from "../../types/colorMode.types";
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
import {
  KNOWN_TASK_KEYS,
  KNOWN_DEPENDENCY_KEYS,
  VALID_EXPORT_COLUMNS,
  isPlainObject,
} from "./constants";

/** Default width for fitToWidth export option */
const DEFAULT_FIT_TO_WIDTH = 1920;

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
        `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`
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
        viewSettings: normalizeViewSettings(ganttFile.chart.viewSettings),
        exportSettings: normalizeExportSettings(ganttFile.chart.exportSettings),
        chartName: ganttFile.chart.name,
        chartId: ganttFile.chart.id,
        chartCreatedAt: ganttFile.chart.metadata?.createdAt,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      migrated: migration.wasMigrated,
    };
  } catch (e) {
    return errorResult(
      "UNKNOWN_ERROR",
      `Unexpected error: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

/**
 * Convert SerializedTask to Task
 * Preserves unknown fields for round-trip compatibility
 */
function deserializeTask(serialized: SerializedTask): TaskWithExtras {
  const endDate =
    serialized.type === "milestone" && !serialized.endDate
      ? serialized.startDate
      : serialized.endDate;

  const task: TaskWithExtras = {
    id: toTaskId(serialized.id),
    name: serialized.name,
    startDate: serialized.startDate,
    endDate: endDate,
    duration: serialized.duration,
    progress: serialized.progress ?? 0,
    color: serialized.color as HexColor, // Validated by validateTaskColors
    order: serialized.order,
    type: (serialized.type ?? "task") as TaskType, // Validated by validateTaskSemantics
    parent: serialized.parent ? toTaskId(serialized.parent) : undefined,
    open: serialized.open ?? true,
    colorOverride: serialized.colorOverride as HexColor | undefined, // Validated by validateTaskColors
    metadata: serialized.metadata ?? {},
    createdAt: serialized.createdAt,
    updatedAt: serialized.updatedAt,
  };

  const unknownFields = extractUnknownFields(serialized, KNOWN_TASK_KEYS);
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
    fromTaskId: toTaskId(serialized.from),
    toTaskId: toTaskId(serialized.to),
    type: serialized.type as DependencyType, // Validated by validateDependencies
    lag: serialized.lag,
    createdAt: serialized.createdAt ?? "",
  };

  const unknownFields = extractUnknownFields(serialized, KNOWN_DEPENDENCY_KEYS);
  if (unknownFields) {
    return { ...dep, __unknownFields: unknownFields };
  }

  return dep;
}

// =============================================================================
// Sanitization helpers
// =============================================================================

/** Check that a value is a finite number, otherwise return the fallback */
function finiteOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Check that a value is a finite positive number, otherwise return null */
function finitePositiveOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

/** Check that a value is a boolean, otherwise return the fallback */
function booleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** Check that a value is a boolean, otherwise return undefined */
function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

/** Check that a value is a valid enum member, otherwise return the fallback */
function enumOr<T extends string>(
  value: unknown,
  validValues: Set<string>,
  fallback: T
): T {
  return typeof value === "string" && validValues.has(value)
    ? (value as T)
    : fallback;
}

// =============================================================================
// Valid enum sets for sanitization
// =============================================================================

const VALID_TASK_LABEL_POSITIONS = new Set([
  "before",
  "inside",
  "after",
  "none",
]);
const VALID_COLOR_MODES = new Set([
  "manual",
  "theme",
  "summary",
  "taskType",
  "hierarchy",
]);
const VALID_EXPORT_ZOOM_MODES = new Set([
  "currentView",
  "custom",
  "fitToWidth",
]);
const VALID_EXPORT_DATE_RANGE_MODES = new Set(["all", "visible", "custom"]);
const VALID_EXPORT_BACKGROUNDS = new Set(["white", "transparent"]);
const VALID_EXPORT_DENSITIES = new Set(["compact", "normal", "comfortable"]);
// =============================================================================
// Field-level sanitizers
// =============================================================================

/** Sanitize columnWidths — keep only entries with finite positive number values */
function sanitizeColumnWidths(
  raw: Record<string, number> | undefined
): Record<string, number> | undefined {
  if (!isPlainObject(raw)) {
    return undefined;
  }
  const cleaned: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      cleaned[key] = value;
    }
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

/** Filter an array to contain only string elements, return undefined if not an array */
function filterStringArray(raw: string[] | undefined): string[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const filtered = raw.filter(
    (item): item is string => typeof item === "string"
  );
  return filtered.length > 0 ? filtered : undefined;
}

/** Sanitize colorModeState — validate mode enum and sub-object shapes */
function sanitizeColorModeState(raw: unknown): ColorModeState | undefined {
  if (!isPlainObject(raw)) {
    return undefined;
  }
  if (!VALID_COLOR_MODES.has(raw.mode as string)) {
    return undefined;
  }
  // Sub-objects are validated at consumption; ensure they're at least objects
  const subKeys = [
    "themeOptions",
    "summaryOptions",
    "taskTypeOptions",
    "hierarchyOptions",
  ] as const;
  for (const key of subKeys) {
    if (raw[key] !== undefined && !isPlainObject(raw[key])) {
      return undefined;
    }
  }
  return raw as unknown as ColorModeState;
}

/** Sanitize workingDaysConfig — validate boolean fields with defaults */
function sanitizeWorkingDaysConfig(
  raw: unknown
): WorkingDaysConfig | undefined {
  if (!isPlainObject(raw)) {
    return undefined;
  }
  return {
    excludeSaturday: booleanOr(raw.excludeSaturday, true),
    excludeSunday: booleanOr(raw.excludeSunday, true),
    excludeHolidays: booleanOr(raw.excludeHolidays, false),
  };
}

// =============================================================================
// ViewSettings & ExportSettings normalization
// =============================================================================

/**
 * Normalize viewSettings — clamp/fix invalid values rather than rejecting the file.
 * Protects against NaN/Infinity/wrong types propagating into app state.
 * Named "normalize" to distinguish from sanitize.ts which handles XSS stripping.
 */
function normalizeViewSettings(raw: ViewSettings): ViewSettings {
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
        : finitePositiveOrNull(raw.taskTableWidth),
    columnWidths: sanitizeColumnWidths(raw.columnWidths),
    showWeekends: booleanOr(raw.showWeekends, true),
    showTodayMarker: booleanOr(raw.showTodayMarker, true),
    showHolidays: optionalBoolean(raw.showHolidays),
    showDependencies: optionalBoolean(raw.showDependencies),
    showProgress: optionalBoolean(raw.showProgress),
    taskLabelPosition: enumOr<TaskLabelPosition>(
      raw.taskLabelPosition,
      VALID_TASK_LABEL_POSITIONS,
      "inside"
    ),
    workingDaysMode: optionalBoolean(raw.workingDaysMode),
    workingDaysConfig: sanitizeWorkingDaysConfig(raw.workingDaysConfig),
    isTaskTableCollapsed: optionalBoolean(raw.isTaskTableCollapsed),
    colorModeState: sanitizeColorModeState(raw.colorModeState),
    hiddenColumns: filterStringArray(raw.hiddenColumns),
    hiddenTaskIds: filterStringArray(raw.hiddenTaskIds)?.map(toTaskId),
  };
}

/**
 * Normalize exportSettings — validate each field, use defaults for invalid values.
 * Protects against malformed values propagating into app state.
 * Named "normalize" to distinguish from sanitize.ts which handles XSS stripping.
 */
function normalizeExportSettings(
  raw: ExportOptions | undefined
): ExportOptions | undefined {
  if (!isPlainObject(raw)) {
    return undefined;
  }

  // Cast through unknown — ExportOptions has no index signature
  const obj = raw as unknown as Record<string, unknown>;

  return {
    zoomMode: enumOr(obj.zoomMode, VALID_EXPORT_ZOOM_MODES, "currentView"),
    timelineZoom: finiteOr(obj.timelineZoom, 1),
    fitToWidth: finiteOr(obj.fitToWidth, DEFAULT_FIT_TO_WIDTH),
    dateRangeMode: enumOr(
      obj.dateRangeMode,
      VALID_EXPORT_DATE_RANGE_MODES,
      "all"
    ),
    customDateStart:
      typeof obj.customDateStart === "string" ? obj.customDateStart : undefined,
    customDateEnd:
      typeof obj.customDateEnd === "string" ? obj.customDateEnd : undefined,
    selectedColumns: Array.isArray(obj.selectedColumns)
      ? (obj.selectedColumns as unknown[]).filter(
          (c): c is ExportOptions["selectedColumns"][number] =>
            typeof c === "string" && VALID_EXPORT_COLUMNS.has(c)
        )
      : [],
    includeHeader: booleanOr(obj.includeHeader, true),
    includeTodayMarker: booleanOr(obj.includeTodayMarker, true),
    includeDependencies: booleanOr(obj.includeDependencies, true),
    includeGridLines: booleanOr(obj.includeGridLines, true),
    includeWeekends: booleanOr(obj.includeWeekends, true),
    includeHolidays: booleanOr(obj.includeHolidays, true),
    taskLabelPosition: enumOr<TaskLabelPosition>(
      obj.taskLabelPosition,
      VALID_TASK_LABEL_POSITIONS,
      "inside"
    ),
    background: enumOr(obj.background, VALID_EXPORT_BACKGROUNDS, "white"),
    density: enumOr(obj.density, VALID_EXPORT_DENSITIES, "comfortable"),
  };
}
