/**
 * File operations - Public API
 *
 * Explicit re-exports to control the module's public surface.
 * Internal helpers (registerMigration, parseVersion, sanitizeString, etc.)
 * should be imported directly from their submodules when needed in tests.
 */

// Types
export type {
  GanttFile,
  SerializedTask,
  SerializedDependency,
  ViewSettings,
  DeserializeResult,
  FileError,
  TaskWithExtras,
  Resource,
} from "./types";

// Constants
export { KNOWN_TASK_KEYS } from "./constants";

// Serialization pipeline
export { serializeToGanttFile } from "./serialize";
export type { SerializeOptions } from "./serialize";
export { deserializeGanttFile } from "./deserialize";

// Validation
export {
  validatePreParse,
  safeJsonParse,
  validateStructure,
  validateSemantics,
  ValidationError,
} from "./validate";

// Sanitization
export { sanitizeGanttFile, SKIP_SANITIZE_KEYS } from "./sanitize";

// Migration
export {
  migrateGanttFile,
  needsMigration,
  isFromFuture,
  compareVersions,
} from "./migrate";
export type { Migration } from "./migrate";

// File I/O
export {
  saveFile,
  openFile,
  clearFileHandle,
  hasFileHandle,
} from "./fileDialog";
export type { SaveFileResult, OpenFileResult } from "./fileDialog";
export { loadFileIntoApp, showLoadNotifications } from "./loadFromFile";
export type { LoadFileResult, ToastHandler } from "./loadFromFile";
