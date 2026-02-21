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
} from "./types";
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

const KNOWN_TASK_KEYS = new Set([
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
  "createdAt",
  "updatedAt",
]);

/** Create a failed DeserializeResult */
function errorResult(code: string, message: string): DeserializeResult {
  return { success: false, error: { code, message, recoverable: false } };
}

/**
 * Run validation layers 1-3 and return parsed GanttFile or error
 */
async function parseAndValidate(
  content: string,
  fileName: string,
  fileSize?: number
): Promise<{ ganttFile: GanttFile } | { error: DeserializeResult }> {
  // Layer 1: Pre-parse validation (file size, extension)
  if (fileSize !== undefined) {
    await validatePreParse({ name: fileName, size: fileSize });
  }

  // Layer 2: Safe JSON parsing
  let parsed: unknown;
  try {
    parsed = safeJsonParse(content);
  } catch (e) {
    return {
      error: errorResult("INVALID_JSON", `Invalid JSON: ${(e as Error).message}`),
    };
  }

  // Layer 3: Structure validation
  try {
    validateStructure(parsed);
  } catch (e) {
    if (e instanceof ValidationError) {
      return { error: errorResult(e.code, e.message) };
    }
    throw e;
  }

  return { ganttFile: parsed as GanttFile };
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
export async function deserializeGanttFile(
  content: string,
  fileName: string,
  fileSize?: number
): Promise<DeserializeResult> {
  const warnings: string[] = [];

  try {
    const parseResult = await parseAndValidate(content, fileName, fileSize);
    if ("error" in parseResult) return parseResult.error;

    let ganttFile = parseResult.ganttFile;

    // Migration (before semantic validation so migrated data gets validated)
    if (needsMigration(ganttFile.fileVersion)) {
      ganttFile = migrateGanttFile(ganttFile);
      warnings.push(
        `File migrated from v${ganttFile.migrations?.originalVersion || ganttFile.fileVersion} to v${FILE_VERSION}`
      );
    }

    if (isFromFuture(ganttFile.fileVersion)) {
      warnings.push(
        "This file was created with a newer version. Some features may not work correctly."
      );
    }

    // Semantic validation
    try {
      validateSemantics(ganttFile);
    } catch (e) {
      if (e instanceof ValidationError) {
        return errorResult(e.code, e.message);
      }
      throw e;
    }

    // Sanitization
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
        viewSettings: ganttFile.chart.viewSettings,
        exportSettings: ganttFile.chart.exportSettings,
        chartName: ganttFile.chart.name,
        chartId: ganttFile.chart.id,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      migrated: needsMigration(
        ganttFile.migrations?.originalVersion || ganttFile.fileVersion
      ),
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
    color: serialized.color as HexColor,
    order: serialized.order,
    type: (serialized.type ?? "task") as TaskType,
    parent: serialized.parent,
    open: serialized.open ?? true,
    colorOverride: serialized.colorOverride as HexColor | undefined,
    metadata: serialized.metadata ?? {},
  };

  const unknownFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(serialized)) {
    if (!KNOWN_TASK_KEYS.has(key)) {
      unknownFields[key] = value;
    }
  }

  if (Object.keys(unknownFields).length > 0) {
    return { ...task, __unknownFields: unknownFields };
  }

  return task;
}

/**
 * Convert SerializedDependency to Dependency
 */
function deserializeDependency(serialized: SerializedDependency): Dependency {
  return {
    id: serialized.id,
    fromTaskId: serialized.from,
    toTaskId: serialized.to,
    type: serialized.type as DependencyType,
    lag: serialized.lag,
    createdAt: serialized.createdAt ?? "",
  };
}
