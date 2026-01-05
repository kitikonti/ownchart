/**
 * GanttFile Format v1.0.0
 * Forward-compatible file structure for .ownchart files
 */

import type { TaskType } from "../../types/chart.types";
import type { Dependency as AppDependency } from "../../types/dependency.types";
import type { ExportOptions } from "../export/types";

export interface GanttFile {
  // Format identification
  fileVersion: string; // "1.0.0" - file format version
  appVersion: string; // "0.0.1" - app version that created it
  schemaVersion: number; // 1 - for migration tracking

  // Chart data
  chart: {
    id: string; // UUID v4
    name: string; // Chart title ("My Project")
    description?: string; // Optional description
    tasks: SerializedTask[]; // All tasks with hierarchy

    // Future features (empty arrays for now)
    dependencies?: SerializedDependency[]; // Task dependencies (Sprint 1.4+)
    resources?: Resource[]; // Resource assignments (future)

    // View state
    viewSettings: ViewSettings;

    // Export settings (Sprint 1.6+)
    exportSettings?: ExportOptions;

    // Chart metadata
    metadata: {
      createdAt: string; // ISO 8601
      updatedAt: string; // ISO 8601
    };
  };

  // File metadata
  metadata: {
    created: string; // ISO 8601
    modified: string; // ISO 8601
    fileSize?: number; // Bytes
  };

  // Feature flags for compatibility detection
  features?: {
    hasHierarchy: boolean;
    hasHistory: boolean;
    hasDependencies: boolean; // Sprint 1.4
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
  metadata?: Record<string, unknown>;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;

  // Preserve unknown fields
  [key: string]: unknown;
}

export interface ViewSettings {
  zoom: number;
  panOffset: { x: number; y: number };
  showWeekends: boolean;
  showTodayMarker: boolean;
  taskTableWidth: number | null;
  columnWidths?: Record<string, number>;
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
    tasks: Array<{
      id: string;
      name: string;
      startDate: string;
      endDate: string;
      duration: number;
      progress: number;
      color: string;
      order: number;
      type?: TaskType;
      parent?: string;
      open?: boolean;
      metadata: Record<string, unknown>;
      __unknownFields?: Record<string, unknown>;
    }>;
    dependencies: AppDependency[]; // Sprint 1.4
    viewSettings: ViewSettings;
    exportSettings?: ExportOptions; // Sprint 1.6
    chartName: string;
    chartId: string;
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

// Future type placeholders
export interface Resource {
  id: string;
  name: string;
  email?: string;
}
