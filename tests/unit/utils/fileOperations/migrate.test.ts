/**
 * Unit tests for file migration system
 * Tests version parsing, migration detection, and file migration logic
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  migrateGanttFile,
  needsMigration,
  isFromFuture,
  parseVersion,
  registerMigration,
} from '../../../../src/utils/fileOperations/migrate';
import type { GanttFile } from '../../../../src/utils/fileOperations/types';

/**
 * Helper to create a minimal valid GanttFile for testing.
 * Only fileVersion is varied; other fields use sensible defaults.
 */
function createMinimalGanttFile(
  overrides: Partial<GanttFile> = {}
): GanttFile {
  const now = new Date().toISOString();
  return {
    fileVersion: '1.0.0',
    appVersion: '0.0.1',
    schemaVersion: 1,
    chart: {
      id: 'test-chart-id',
      name: 'Test Chart',
      tasks: [],
      dependencies: [],
      viewSettings: {
        zoom: 1,
        panOffset: { x: 0, y: 0 },
        taskTableWidth: null,
        showWeekends: true,
        showTodayMarker: true,
      },
      metadata: {
        createdAt: now,
        updatedAt: now,
      },
    },
    metadata: {
      created: now,
      modified: now,
    },
    ...overrides,
  };
}

describe('File Operations - Migration', () => {
  describe('needsMigration', () => {
    it('should return false when fileVersion equals FILE_VERSION ("1.0.0")', () => {
      const result = needsMigration('1.0.0');

      expect(result).toBe(false);
    });

    it('should return true for older version ("0.9.0")', () => {
      const result = needsMigration('0.9.0');

      expect(result).toBe(true);
    });

    it('should return true for newer version ("2.0.0")', () => {
      const result = needsMigration('2.0.0');

      expect(result).toBe(true);
    });
  });

  describe('isFromFuture', () => {
    it('should return false for current version "1.0.0"', () => {
      const result = isFromFuture('1.0.0');

      expect(result).toBe(false);
    });

    it('should return false for older version "0.9.0"', () => {
      const result = isFromFuture('0.9.0');

      expect(result).toBe(false);
    });

    it('should return true for future major "2.0.0"', () => {
      const result = isFromFuture('2.0.0');

      expect(result).toBe(true);
    });

    it('should return true for future minor "1.1.0"', () => {
      const result = isFromFuture('1.1.0');

      expect(result).toBe(true);
    });

    it('should return true for future patch "1.0.1"', () => {
      const result = isFromFuture('1.0.1');

      expect(result).toBe(true);
    });

    it('should return false for "0.99.99" (older major)', () => {
      const result = isFromFuture('0.99.99');

      expect(result).toBe(false);
    });
  });

  describe('parseVersion', () => {
    it('should parse "1.0.0" to [1, 0, 0]', () => {
      const result = parseVersion('1.0.0');

      expect(result).toEqual([1, 0, 0]);
    });

    it('should parse "2.3.4" to [2, 3, 4]', () => {
      const result = parseVersion('2.3.4');

      expect(result).toEqual([2, 3, 4]);
    });

    it('should handle missing parts "1" -> [1, 0, 0]', () => {
      const result = parseVersion('1');

      expect(result).toEqual([1, 0, 0]);
    });

    it('should handle empty string -> [0, 0, 0]', () => {
      const result = parseVersion('');

      expect(result).toEqual([0, 0, 0]);
    });

    it('should handle non-numeric parts "abc.def.ghi" -> [0, 0, 0]', () => {
      const result = parseVersion('abc.def.ghi');

      expect(result).toEqual([0, 0, 0]);
    });
  });

  describe('migrateGanttFile', () => {
    const cleanups: (() => void)[] = [];

    afterEach(() => {
      cleanups.forEach((fn) => fn());
      cleanups.length = 0;
    });

    it('should return file unchanged when already at current version', () => {
      const file = createMinimalGanttFile({ fileVersion: '1.0.0' });

      const result = migrateGanttFile(file);

      expect(result).toBe(file);
    });

    it('should return file unchanged when no migration path exists (future version)', () => {
      const file = createMinimalGanttFile({ fileVersion: '2.0.0' });

      const result = migrateGanttFile(file);

      expect(result).toBe(file);
    });

    it('should update fileVersion on the result after migration', () => {
      // Register a migration from 0.9.0 -> 1.0.0
      cleanups.push(
        registerMigration({
          fromVersion: '0.9.0',
          toVersion: '1.0.0',
          description: 'Test migration',
          migrate: (file) => ({ ...file, schemaVersion: 2 }),
        })
      );

      const file = createMinimalGanttFile({ fileVersion: '0.9.0' });
      const result = migrateGanttFile(file);

      expect(result.fileVersion).toBe('1.0.0');
      expect(result.schemaVersion).toBe(2);
    });

    it('should chain multiple migrations sequentially', () => {
      // Register 0.8.0 -> 0.9.0 -> 1.0.0
      cleanups.push(
        registerMigration({
          fromVersion: '0.8.0',
          toVersion: '0.9.0',
          description: 'First step',
          migrate: (file) => ({ ...file, schemaVersion: 2 }),
        })
      );
      cleanups.push(
        registerMigration({
          fromVersion: '0.9.0',
          toVersion: '1.0.0',
          description: 'Second step',
          migrate: (file) => ({ ...file, schemaVersion: 3 }),
        })
      );

      const file = createMinimalGanttFile({ fileVersion: '0.8.0' });
      const result = migrateGanttFile(file);

      expect(result.fileVersion).toBe('1.0.0');
      expect(result.schemaVersion).toBe(3);
    });

    it('should throw on cyclic migration chains', () => {
      // Register A -> B -> A cycle (neither reaches FILE_VERSION "1.0.0")
      cleanups.push(
        registerMigration({
          fromVersion: '0.1.0',
          toVersion: '0.2.0',
          description: 'Cycle step 1',
          migrate: (file) => file,
        })
      );
      cleanups.push(
        registerMigration({
          fromVersion: '0.2.0',
          toVersion: '0.1.0',
          description: 'Cycle step 2',
          migrate: (file) => file,
        })
      );

      const file = createMinimalGanttFile({ fileVersion: '0.1.0' });

      expect(() => migrateGanttFile(file)).toThrow(
        /Migration exceeded 100 steps/
      );
    });
  });
});
