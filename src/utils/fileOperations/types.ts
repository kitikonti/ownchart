/**
 * GanttFile Format v1.0.0
 * Forward-compatible file structure for .ownchart files
 */

import type { Task, TaskType } from "../../types/chart.types";
import type { Dependency as AppDependency } from "../../types/dependency.types";
import type { ExportOptions } from "../export/types";
import type {
  TaskLabelPosition,
  WorkingDaysConfig,
} from "../../types/preferences.types";
import type { ColorModeState } from "../../types/colorMode.types";

export interface GanttFile {
  // Format identification
  fileVersion: string; // "1.0.0" - file format version
  appVersion?: string; // "0.0.1" - app version that created it (optional on load)
  schemaVersion?: number; // 1 - for migration tracking (optional on load)

  // Chart data
  chart: {
    id: string; // UUID v4
    name: string; // Chart title ("My Project")
    description?: string;
    tasks: SerializedTask[];
    dependencies?: SerializedDependency[];

    // View state
    viewSettings: ViewSettings;

    exportSettings?: ExportOptions;

    // Chart metadata (optional on load — written by serialize, not validated on parse)
    metadata?: {
      createdAt: string; // ISO 8601
      updatedAt: string; // ISO 8601
    };
  };

  // File metadata (optional on load — written by serialize, not validated on parse)
  metadata?: {
    created: string; // ISO 8601
    modified: string; // ISO 8601
    fileSize?: number; // Bytes
  };

  // Feature flags for compatibility detection
  features?: {
    hasHierarchy: boolean;
    hasHistory: boolean;
    hasDependencies: boolean;
  };

  // Migration tracking
  migrations?: {
    appliedMigrations: string[]; // ["1.0.0->1.1.0"]
    originalVersion: string; // Version file was created with
  };

  // CRITICAL: Preserve unknown fields from future versions
  [key: string]: unknown;
}

export interface SerializedTask {
  // Core Task fields (from chart.types.ts)
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  duration: number;
  progress: number;
  color: string;
  order: number;

  // Extended fields
  type?: TaskType;
  parent?: string;
  open?: boolean;
  colorOverride?: string;
  metadata?: Record<string, unknown>;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;

  // Preserve unknown fields
  [key: string]: unknown;
}

export interface ViewSettings {
  // Navigation
  zoom: number;
  panOffset: { x: number; y: number };
  taskTableWidth: number | null;
  columnWidths?: Record<string, number>;

  // Display settings
  showWeekends: boolean;
  showTodayMarker: boolean;
  showHolidays?: boolean;
  showDependencies?: boolean;
  showProgress?: boolean;
  taskLabelPosition?: TaskLabelPosition;

  // Working days mode
  workingDaysMode?: boolean;
  workingDaysConfig?: WorkingDaysConfig;

  // Holiday region (per-project, ISO 3166-1 alpha-2 country code)
  holidayRegion?: string;

  // Project metadata
  projectTitle?: string;
  projectAuthor?: string;

  // Color mode (Smart Color Management)
  colorModeState?: ColorModeState;

  // Column visibility (user-hidden date/duration columns)
  hiddenColumns?: string[];

  // Task table collapse state
  isTaskTableCollapsed?: boolean;

  // Hidden task IDs (Hide/Show Rows)
  hiddenTaskIds?: string[];
}

// Validation error types
export interface FileError {
  code: string;
  message: string;
  recoverable: boolean;
  details?: Record<string, unknown>;
}

// Deserialization result
export interface DeserializeResult {
  success: boolean;
  data?: {
    tasks: TaskWithExtras[];
    dependencies: Array<
      AppDependency & { __unknownFields?: Record<string, unknown> }
    >;
    viewSettings: ViewSettings;
    exportSettings?: ExportOptions;
    chartName: string;
    chartId: string;
    chartCreatedAt?: string;
  };
  error?: FileError;
  warnings?: string[];
  migrated?: boolean;
}

// Serialized dependency for file format
export interface SerializedDependency {
  id: string;
  from: string; // fromTaskId
  to: string; // toTaskId
  type: "FS" | "SS" | "FF" | "SF";
  lag?: number; // Offset days
  createdAt?: string;
}

// Re-export app Dependency type for convenience
export type { AppDependency as Dependency };

/**
 * Task extended with round-trip metadata.
 * Used at the serialize/deserialize boundary to preserve fields
 * that the app doesn't model directly (timestamps, future-version fields).
 */
export type TaskWithExtras = Task & {
  __unknownFields?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};
