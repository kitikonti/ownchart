/**
 * Deserialization utilities for converting GanttFile JSON to app state
 */

import type { TaskType } from "../../types/chart.types";
import type { HexColor } from "../../types/branded.types";
import type { Dependency, DependencyType } from "../../types/dependency.types";
import type {
  GanttFile,
  SerializedTask,
  SerializedDependency,
  DeserializeResult,
  TaskWithExtras,
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
import { KNOWN_TASK_KEYS } from "./constants";

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
    // Layer 1: Pre-parse validation (file size, extension)
    if (fileSize !== undefined) {
      validatePreParse({ name: fileName, size: fileSize });
    }

    // Layer 2: Safe JSON parsing
    let parsed: unknown;
    try {
      parsed = safeJsonParse(content);
    } catch (e) {
      return {
        success: false,
        error: {
          code: "INVALID_JSON",
          message: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
          recoverable: false,
        },
      };
    }

    // Layer 3: Structure validation
    try {
      validateStructure(parsed);
    } catch (e) {
      if (e instanceof ValidationError) {
        return {
          success: false,
          error: {
            code: e.code,
            message: e.message,
            recoverable: false,
          },
        };
      }
      throw e;
    }

    let ganttFile = parsed as GanttFile;

    // Layer 6: Version compatibility & migration
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

    // Layer 4: Semantic validation
    try {
      validateSemantics(ganttFile);
    } catch (e) {
      if (e instanceof ValidationError) {
        return {
          success: false,
          error: {
            code: e.code,
            message: e.message,
            recoverable: false,
          },
        };
      }
      throw e;
    }

    // Layer 5: Sanitization
    ganttFile = sanitizeGanttFile(ganttFile);

    // Extract data for app
    const tasks = ganttFile.chart.tasks.map(deserializeTask);

    // Normalize order values so children follow their parents
    normalizeTaskOrder(tasks);

    const dependencies = (ganttFile.chart.dependencies || []).map(
      deserializeDependency
    );
    const viewSettings = ganttFile.chart.viewSettings;
    const exportSettings = ganttFile.chart.exportSettings; // Sprint 1.6

    return {
      success: true,
      data: {
        tasks,
        dependencies, // Sprint 1.4
        viewSettings,
        exportSettings, // Sprint 1.6
        chartName: ganttFile.chart.name,
        chartId: ganttFile.chart.id,
        chartCreatedAt: ganttFile.chart.metadata?.createdAt,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      migrated: needsMigration(
        ganttFile.migrations?.originalVersion || ganttFile.fileVersion
      ),
    };
  } catch (e) {
    return {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: `Unexpected error: ${e instanceof Error ? e.message : String(e)}`,
        recoverable: false,
      },
    };
  }
}

/**
 * Convert SerializedTask to Task
 * Preserves unknown fields for round-trip compatibility
 */
function deserializeTask(serialized: SerializedTask): TaskWithExtras {
  // Migrate milestones with empty endDate (pre-fix backward compat)
  const endDate =
    serialized.type === "milestone" && !serialized.endDate
      ? serialized.startDate
      : serialized.endDate;

  // Extract known fields
  const task: TaskWithExtras = {
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
    createdAt: serialized.createdAt,
    updatedAt: serialized.updatedAt,
  };

  // Preserve unknown fields for round-trip
  const unknownFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(serialized)) {
    if (!KNOWN_TASK_KEYS.has(key)) {
      unknownFields[key] = value;
    }
  }

  if (Object.keys(unknownFields).length > 0) {
    return {
      ...task,
      __unknownFields: unknownFields,
    };
  }

  return task;
}

/**
 * Convert SerializedDependency to Dependency
 * Sprint 1.4 - Dependencies
 */
function deserializeDependency(serialized: SerializedDependency): Dependency {
  return {
    id: serialized.id,
    fromTaskId: serialized.from,
    toTaskId: serialized.to,
    type: serialized.type as DependencyType,
    lag: serialized.lag,
    createdAt: serialized.createdAt || new Date().toISOString(),
  };
}
