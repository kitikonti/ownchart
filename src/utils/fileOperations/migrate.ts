/**
 * Layer 6: Migration System
 * Handle backward/forward compatibility with different file versions
 */

import type { GanttFile } from "./types";
import { FILE_VERSION } from "../../config/version";

export interface Migration {
  fromVersion: string;
  toVersion: string;
  description: string;
  migrate: (file: GanttFile) => GanttFile;
}

/**
 * Migration registry — keyed by fromVersion for O(1) lookup.
 * Add new migrations here as file format evolves.
 *
 * Example for future v1.1.0:
 * migrations.set('1.0.0', {
 *   fromVersion: '1.0.0',
 *   toVersion: '1.1.0',
 *   description: 'Add customFields support',
 *   migrate: (file) => ({ ... })
 * });
 */
const migrations = new Map<string, Migration>([
  // No migrations yet for v1.0.0
  // Future migrations will be added here
]);

/** Maximum migration steps to prevent infinite loops from cyclic migrations */
const MAX_MIGRATION_STEPS = 100;

/**
 * Migrate file to current version.
 * Applies migrations sequentially from file version to current version.
 * Only called for older files — future versions are handled separately.
 */
export function migrateGanttFile(file: GanttFile): GanttFile {
  const originalVersion = file.fileVersion;
  let current = file;
  let currentVersion = originalVersion;
  let steps = 0;
  const appliedMigrations: string[] = [];

  while (currentVersion !== FILE_VERSION) {
    const migration = migrations.get(currentVersion);

    if (!migration) {
      // No migration path — either already current or from future version
      break;
    }

    if (++steps > MAX_MIGRATION_STEPS) {
      throw new Error(
        `Migration exceeded ${MAX_MIGRATION_STEPS} steps (at version ${currentVersion}). Possible cyclic migration chain.`
      );
    }

    current = migration.migrate(current);
    current = { ...current, fileVersion: migration.toVersion };
    appliedMigrations.push(`${currentVersion}->${migration.toVersion}`);
    currentVersion = migration.toVersion;
  }

  // Record migration history so callers can report accurate version info
  if (appliedMigrations.length > 0) {
    current = {
      ...current,
      migrations: {
        appliedMigrations: [
          ...(current.migrations?.appliedMigrations || []),
          ...appliedMigrations,
        ],
        originalVersion: current.migrations?.originalVersion || originalVersion,
      },
    };
  }

  return current;
}

/**
 * Check if file is from an older version that needs migration.
 * Returns false for current and future versions.
 */
export function needsMigration(fileVersion: string): boolean {
  return !isFromFuture(fileVersion) && fileVersion !== FILE_VERSION;
}

/**
 * Check if file is from a future version
 */
export function isFromFuture(fileVersion: string): boolean {
  return compareVersions(fileVersion, FILE_VERSION) > 0;
}

/**
 * Compare two semantic version strings.
 * Returns: negative if a < b, 0 if equal, positive if a > b.
 */
export function compareVersions(a: string, b: string): number {
  const [aMajor, aMinor, aPatch] = parseVersion(a);
  const [bMajor, bMinor, bPatch] = parseVersion(b);

  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
}

/**
 * Parse semantic version string to numbers.
 * Returns [major, minor, patch]. Non-numeric segments are treated as 0.
 *
 * NOTE: Pre-release suffixes (e.g., "1.0.0-beta") are not supported.
 * The hyphenated segment parses as NaN and falls back to 0, so pre-release
 * versions are treated as equal to their release counterparts.
 * This is acceptable because the file format uses plain semver only.
 */
export function parseVersion(version: string): [number, number, number] {
  const parts = version.split(".");
  return [toSafeInt(parts[0]), toSafeInt(parts[1]), toSafeInt(parts[2])];
}

/**
 * Convert a version segment to a non-negative integer.
 * Returns 0 for undefined, empty, NaN, or negative values.
 */
function toSafeInt(segment: string | undefined): number {
  if (!segment) return 0;
  const n = Number(segment);
  return Number.isNaN(n) || n < 0 ? 0 : Math.floor(n);
}

/**
 * Register a migration (for testing or dynamic migration loading).
 * Returns an unregister function for cleanup.
 */
export function registerMigration(migration: Migration): () => void {
  migrations.set(migration.fromVersion, migration);
  return () => {
    migrations.delete(migration.fromVersion);
  };
}
