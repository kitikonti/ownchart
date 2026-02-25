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
  compareVersions,
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
      expect(needsMigration('1.0.0')).toBe(false);
    });

    it('should return true for older version ("0.9.0")', () => {
      expect(needsMigration('0.9.0')).toBe(true);
    });

    it('should return false for future version ("2.0.0")', () => {
      expect(needsMigration('2.0.0')).toBe(false);
    });

    it('should return false for future minor ("1.1.0")', () => {
      expect(needsMigration('1.1.0')).toBe(false);
    });

    it('should return true for older minor ("0.99.99")', () => {
      expect(needsMigration('0.99.99')).toBe(true);
    });
  });

  describe('isFromFuture', () => {
    it('should return false for current version "1.0.0"', () => {
      expect(isFromFuture('1.0.0')).toBe(false);
    });

    it('should return false for older version "0.9.0"', () => {
      expect(isFromFuture('0.9.0')).toBe(false);
    });

    it('should return true for future major "2.0.0"', () => {
      expect(isFromFuture('2.0.0')).toBe(true);
    });

    it('should return true for future minor "1.1.0"', () => {
      expect(isFromFuture('1.1.0')).toBe(true);
    });

    it('should return true for future patch "1.0.1"', () => {
      expect(isFromFuture('1.0.1')).toBe(true);
    });

    it('should return false for "0.99.99" (older major)', () => {
      expect(isFromFuture('0.99.99')).toBe(false);
    });
  });

  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    });

    it('should return negative for older vs newer', () => {
      expect(compareVersions('0.9.0', '1.0.0')).toBeLessThan(0);
    });

    it('should return positive for newer vs older', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBeGreaterThan(0);
    });

    it('should compare minor versions correctly', () => {
      expect(compareVersions('1.1.0', '1.2.0')).toBeLessThan(0);
      expect(compareVersions('1.2.0', '1.1.0')).toBeGreaterThan(0);
    });

    it('should compare patch versions correctly', () => {
      expect(compareVersions('1.0.1', '1.0.2')).toBeLessThan(0);
      expect(compareVersions('1.0.2', '1.0.1')).toBeGreaterThan(0);
    });

    it('should prioritize major over minor over patch', () => {
      expect(compareVersions('2.0.0', '1.99.99')).toBeGreaterThan(0);
      expect(compareVersions('1.2.0', '1.1.99')).toBeGreaterThan(0);
    });
  });

  describe('parseVersion', () => {
    it('should parse "1.0.0" to [1, 0, 0]', () => {
      expect(parseVersion('1.0.0')).toEqual([1, 0, 0]);
    });

    it('should parse "2.3.4" to [2, 3, 4]', () => {
      expect(parseVersion('2.3.4')).toEqual([2, 3, 4]);
    });

    it('should handle missing parts "1" -> [1, 0, 0]', () => {
      expect(parseVersion('1')).toEqual([1, 0, 0]);
    });

    it('should handle empty string -> [0, 0, 0]', () => {
      expect(parseVersion('')).toEqual([0, 0, 0]);
    });

    it('should handle non-numeric parts "abc.def.ghi" -> [0, 0, 0]', () => {
      expect(parseVersion('abc.def.ghi')).toEqual([0, 0, 0]);
    });

    it('should handle negative numbers as 0', () => {
      expect(parseVersion('-1.0.0')).toEqual([0, 0, 0]);
    });

    it('should floor decimal segments', () => {
      expect(parseVersion('1.2.3')).toEqual([1, 2, 3]);
    });

    it('should handle version "0.0.0" correctly', () => {
      expect(parseVersion('0.0.0')).toEqual([0, 0, 0]);
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
