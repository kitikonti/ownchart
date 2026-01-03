/**
 * Layer 6: Migration System
 * Handle backward/forward compatibility with different file versions
 */

import type { GanttFile } from './types';
import { FILE_VERSION } from '../../config/version';

export interface Migration {
  fromVersion: string;
  toVersion: string;
  description: string;
  migrate: (file: GanttFile) => GanttFile;
}

/**
 * Migration registry
 * Add new migrations here as file format evolves
 *
 * Example for future v1.1.0:
 * {
 *   fromVersion: '1.0.0',
 *   toVersion: '1.1.0',
 *   description: 'Add customFields support',
 *   migrate: (file) => ({
 *     ...file,
 *     fileVersion: '1.1.0',
 *     chart: {
 *       ...file.chart,
 *       tasks: file.chart.tasks.map(task => ({
 *         ...task,
 *         customFields: task.customFields ?? {}
 *       }))
 *     },
 *     migrations: {
 *       appliedMigrations: [
 *         ...(file.migrations?.appliedMigrations || []),
 *         '1.0.0->1.1.0'
 *       ],
 *       originalVersion: file.migrations?.originalVersion || file.fileVersion
 *     }
 *   })
 * }
 */
const migrations: Migration[] = [
  // No migrations yet for v1.0.0
  // Future migrations will be added here
];

/**
 * Migrate file to current version
 * Applies migrations sequentially from file version to current version
 */
export function migrateGanttFile(file: GanttFile): GanttFile {
  let current = file;
  let currentVersion = file.fileVersion;

  while (currentVersion !== FILE_VERSION) {
    const migration = migrations.find((m) => m.fromVersion === currentVersion);

    if (!migration) {
      // No migration path - either already at current version or from future version
      break;
    }

    current = migration.migrate(current);
    currentVersion = migration.toVersion;
  }

  return current;
}

/**
 * Check if file needs migration
 */
export function needsMigration(fileVersion: string): boolean {
  return fileVersion !== FILE_VERSION;
}

/**
 * Check if file is from a future version
 */
export function isFromFuture(fileVersion: string): boolean {
  const [fileMajor, fileMinor, filePatch] = parseVersion(fileVersion);
  const [currentMajor, currentMinor, currentPatch] = parseVersion(FILE_VERSION);

  return (
    fileMajor > currentMajor ||
    (fileMajor === currentMajor && fileMinor > currentMinor) ||
    (fileMajor === currentMajor &&
      fileMinor === currentMinor &&
      filePatch > currentPatch)
  );
}

/**
 * Parse semantic version string to numbers
 */
function parseVersion(version: string): [number, number, number] {
  const parts = version.split('.').map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}
