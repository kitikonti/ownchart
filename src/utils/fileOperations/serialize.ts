/**
 * Serialization utilities for converting app state to GanttFile JSON
 */

import type { Task } from "../../types/chart.types";
import type { Dependency } from "../../types/dependency.types";
import type { ExportOptions } from "../export/types";
import type {
  GanttFile,
  SerializedTask,
  SerializedDependency,
  TaskWithExtras,
  ViewSettings,
} from "./types";
import { FILE_VERSION, SCHEMA_VERSION } from "../../config/version";
import { DEFAULT_CHART_NAME } from "../../config/viewSettingsDefaults";
import { KNOWN_TASK_KEYS } from "./constants";

export interface SerializeOptions {
  chartName?: string;
  chartId?: string;
  chartCreatedAt?: string;
  prettyPrint?: boolean;
  dependencies?: Dependency[];
  exportSettings?: ExportOptions;
}

/**
 * Convert app state to GanttFile JSON string
 *
 * @param tasks - Array of tasks from taskSlice
 * @param viewSettings - View state from chartSlice and taskSlice
 * @param options - Serialization options
 * @returns JSON string ready to save
 */
export function serializeToGanttFile(
  tasks: Task[],
  viewSettings: ViewSettings,
  options: SerializeOptions = {}
): string {
  const now = new Date().toISOString();
  const dependencies = options.dependencies || [];

  const ganttFile: GanttFile = {
    fileVersion: FILE_VERSION,
    appVersion: __APP_VERSION__,
    schemaVersion: SCHEMA_VERSION,

    chart: {
      id: options.chartId || crypto.randomUUID(),
      name: options.chartName || DEFAULT_CHART_NAME,
      tasks: tasks.map((task) => serializeTask(task, now)),
      dependencies: dependencies.map(serializeDependency),
      viewSettings: { ...viewSettings },
      exportSettings: options.exportSettings,
      // Chart-level timestamps: when this chart was first created / last edited
      metadata: {
        createdAt: options.chartCreatedAt || now,
        updatedAt: now,
      },
    },

    // File-level timestamps: when this .ownchart file was written to disk
    metadata: {
      created: now,
      modified: now,
    },

    features: {
      hasHierarchy: tasks.some((t) => !!t.parent),
      hasHistory: false,
      hasDependencies: dependencies.length > 0,
    },
  };

  return options.prettyPrint
    ? JSON.stringify(ganttFile, null, 2)
    : JSON.stringify(ganttFile);
}

/**
 * Convert Task to SerializedTask.
 * Preserves __unknownFields for round-trip compatibility.
 * Tasks from deserialization may carry extra fields (see TaskWithExtras);
 * the assertion is safe because we only read, never write, the extras.
 */
function serializeTask(task: Task, now: string): SerializedTask {
  const taskWithExtra = task as TaskWithExtras;

  const serialized: SerializedTask = {
    id: task.id,
    name: task.name,
    startDate: task.startDate,
    endDate: task.endDate,
    duration: task.duration,
    progress: task.progress,
    color: task.color,
    order: task.order,
    type: task.type,
    parent: task.parent,
    open: task.open,
    colorOverride: task.colorOverride,
    metadata: task.metadata,
    createdAt: taskWithExtra.createdAt || now,
    updatedAt: now,
  };

  // Preserve unknown fields from future versions, but never overwrite known fields
  if (
    taskWithExtra.__unknownFields &&
    typeof taskWithExtra.__unknownFields === "object"
  ) {
    for (const [key, value] of Object.entries(taskWithExtra.__unknownFields)) {
      if (!KNOWN_TASK_KEYS.has(key)) {
        (serialized as Record<string, unknown>)[key] = value;
      }
    }
  }

  return serialized;
}

/**
 * Convert Dependency to SerializedDependency for file format
 */
function serializeDependency(dep: Dependency): SerializedDependency {
  return {
    id: dep.id,
    from: dep.fromTaskId,
    to: dep.toTaskId,
    type: dep.type,
    lag: dep.lag,
    createdAt: dep.createdAt,
  };
}
