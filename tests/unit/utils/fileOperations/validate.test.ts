/**
 * Unit tests for 6-layer validation pipeline
 * Tests all validation layers for security and data integrity
 */

import { describe, it, expect } from 'vitest';
import {
  validatePreParse,
  safeJsonParse,
  validateStructure,
  validateSemantics,
  ValidationError,
} from '../../../../src/utils/fileOperations/validate';

describe('File Operations - Validation', () => {
  describe('Layer 1: Pre-Parse Validation', () => {
    it('should reject files larger than 50MB', async () => {
      const largeFile = new File(['x'], 'test.gantt', {
        type: 'application/json',
      });
      Object.defineProperty(largeFile, 'size', { value: 51 * 1024 * 1024 });

      await expect(validatePreParse(largeFile)).rejects.toThrow(
        ValidationError
      );
      await expect(validatePreParse(largeFile)).rejects.toThrow(
        'exceeds limit of 50MB'
      );
    });

    it('should accept files smaller than 50MB', async () => {
      const validFile = new File(['{}'], 'test.gantt', {
        type: 'application/json',
      });

      await expect(validatePreParse(validFile)).resolves.not.toThrow();
    });

    it('should reject files without .gantt extension', async () => {
      const wrongExtension = new File(['{}'], 'test.json', {
        type: 'application/json',
      });

      await expect(validatePreParse(wrongExtension)).rejects.toThrow(
        'must have .gantt extension'
      );
    });

    it('should accept files with .gantt extension', async () => {
      const validFile = new File(['{}'], 'test.gantt', {
        type: 'application/json',
      });

      await expect(validatePreParse(validFile)).resolves.not.toThrow();
    });
  });

  describe('Layer 2: Safe JSON Parsing', () => {
    it('should parse valid JSON', () => {
      const json = '{"test": "value"}';
      const result = safeJsonParse(json);

      expect(result).toEqual({ test: 'value' });
    });

    it('should reject invalid JSON', () => {
      const invalid = '{invalid json}';

      expect(() => safeJsonParse(invalid)).toThrow(ValidationError);
      expect(() => safeJsonParse(invalid)).toThrow('Invalid JSON');
    });

    it('should filter out __proto__ (prototype pollution prevention)', () => {
      const malicious = '{"__proto__": {"polluted": true}, "safe": "value"}';
      const result = safeJsonParse(malicious) as Record<string, unknown>;

      // The key should be filtered (value set to undefined)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((Object.prototype as any).polluted).toBeUndefined();
      expect(result.safe).toBe('value');
    });

    it('should filter out constructor (prototype pollution prevention)', () => {
      const malicious = '{"constructor": {"polluted": true}, "safe": "value"}';
      const result = safeJsonParse(malicious) as Record<string, unknown>;

      // Ensure no pollution occurred
      expect(result.safe).toBe('value');
    });

    it('should filter out prototype (prototype pollution prevention)', () => {
      const malicious = '{"prototype": {"polluted": true}, "safe": "value"}';
      const result = safeJsonParse(malicious) as Record<string, unknown>;

      expect(result.prototype).toBeUndefined();
      expect(result.safe).toBe('value');
    });
  });

  describe('Layer 3: Structure Validation', () => {
    it('should reject non-object data', () => {
      expect(() => validateStructure('string')).toThrow('must be a JSON object');
      expect(() => validateStructure(null)).toThrow('must be a JSON object');
      expect(() => validateStructure(undefined)).toThrow('must be a JSON object');
      expect(() => validateStructure(123)).toThrow('must be a JSON object');
    });

    it('should reject missing fileVersion', () => {
      const invalid = { chart: { tasks: [] } };

      expect(() => validateStructure(invalid)).toThrow('Missing required field: fileVersion');
    });

    it('should reject missing chart', () => {
      const invalid = { fileVersion: '1.0.0' };

      expect(() => validateStructure(invalid)).toThrow('Missing required field: chart');
    });

    it('should reject non-array tasks', () => {
      const invalid = {
        fileVersion: '1.0.0',
        chart: { tasks: 'not an array' },
      };

      expect(() => validateStructure(invalid)).toThrow('chart.tasks must be an array');
    });

    it('should reject too many tasks (>10000)', () => {
      const tooManyTasks = Array(10001).fill({
        id: 'test',
        name: 'Task',
        startDate: '2026-01-01',
        endDate: '2026-01-02',
        duration: 1,
        progress: 0,
        color: '#000000',
        order: 0,
      });

      const invalid = {
        fileVersion: '1.0.0',
        chart: { tasks: tooManyTasks, viewSettings: {} },
      };

      expect(() => validateStructure(invalid)).toThrow('10001 tasks (max: 10000)');
    });

    it('should reject task missing required fields', () => {
      const invalid = {
        fileVersion: '1.0.0',
        chart: {
          tasks: [{ id: 'test' }], // Missing other required fields
          viewSettings: {},
        },
      };

      expect(() => validateStructure(invalid)).toThrow('missing field');
    });

    it('should reject missing viewSettings', () => {
      const invalid = {
        fileVersion: '1.0.0',
        chart: { tasks: [] },
      };

      expect(() => validateStructure(invalid)).toThrow('Missing required field: chart.viewSettings');
    });

    it('should accept valid structure', () => {
      const valid = {
        fileVersion: '1.0.0',
        chart: {
          tasks: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Task',
              startDate: '2026-01-01',
              endDate: '2026-01-02',
              duration: 1,
              progress: 0,
              color: '#000000',
              order: 0,
            },
          ],
          viewSettings: {
            zoom: 1,
            panOffset: { x: 0, y: 0 },
            showWeekends: true,
            showTodayMarker: true,
            taskTableWidth: null,
          },
        },
      };

      expect(() => validateStructure(valid)).not.toThrow();
    });
  });

  describe('Layer 4: Semantic Validation', () => {
    const createValidFile = () => ({
      fileVersion: '1.0.0',
      chart: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Chart',
        tasks: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Task 1',
            startDate: '2026-01-01',
            endDate: '2026-01-02',
            duration: 1,
            progress: 50,
            color: '#3b82f6',
            order: 0,
          },
        ],
        viewSettings: {
          zoom: 1,
          panOffset: { x: 0, y: 0 },
          showWeekends: true,
          showTodayMarker: true,
          taskTableWidth: null,
        },
        metadata: {
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      metadata: {
        created: '2026-01-01T00:00:00.000Z',
        modified: '2026-01-01T00:00:00.000Z',
      },
    });

    it('should reject invalid UUID format', () => {
      const invalid = createValidFile();
      invalid.chart.tasks[0].id = 'not-a-uuid';

      expect(() => validateSemantics(invalid)).toThrow('invalid UUID');
    });

    it('should reject duplicate task IDs', () => {
      const invalid = createValidFile();
      invalid.chart.tasks.push({ ...invalid.chart.tasks[0] }); // Duplicate ID

      expect(() => validateSemantics(invalid)).toThrow('Duplicate task ID');
    });

    it('should reject invalid start date', () => {
      const invalid = createValidFile();
      invalid.chart.tasks[0].startDate = '2026-13-45'; // Invalid date

      expect(() => validateSemantics(invalid)).toThrow('invalid startDate');
    });

    it('should reject invalid end date', () => {
      const invalid = createValidFile();
      invalid.chart.tasks[0].endDate = 'not-a-date';

      expect(() => validateSemantics(invalid)).toThrow('invalid endDate');
    });

    it('should reject endDate before startDate', () => {
      const invalid = createValidFile();
      invalid.chart.tasks[0].startDate = '2026-01-10';
      invalid.chart.tasks[0].endDate = '2026-01-05';

      expect(() => validateSemantics(invalid)).toThrow('endDate before startDate');
    });

    it('should reject progress < 0', () => {
      const invalid = createValidFile();
      invalid.chart.tasks[0].progress = -10;

      expect(() => validateSemantics(invalid)).toThrow('invalid progress');
    });

    it('should reject progress > 100', () => {
      const invalid = createValidFile();
      invalid.chart.tasks[0].progress = 150;

      expect(() => validateSemantics(invalid)).toThrow('invalid progress');
    });

    it('should reject invalid hex color', () => {
      const invalid = createValidFile();
      invalid.chart.tasks[0].color = 'red'; // Not hex

      expect(() => validateSemantics(invalid)).toThrow('invalid color');
    });

    it('should accept valid 6-digit hex color', () => {
      const valid = createValidFile();
      valid.chart.tasks[0].color = '#FF5733';

      expect(() => validateSemantics(valid)).not.toThrow();
    });

    it('should accept valid 3-digit hex color', () => {
      const valid = createValidFile();
      valid.chart.tasks[0].color = '#F53';

      expect(() => validateSemantics(valid)).not.toThrow();
    });

    it('should reject dangling parent reference', () => {
      const invalid = createValidFile();
      invalid.chart.tasks[0].parent = '123e4567-e89b-12d3-a456-999999999999'; // Non-existent

      expect(() => validateSemantics(invalid)).toThrow('non-existent parent');
    });

    it('should reject circular hierarchy (direct)', () => {
      const invalid = createValidFile();
      const taskId = invalid.chart.tasks[0].id;
      invalid.chart.tasks[0].parent = taskId; // Self-reference

      expect(() => validateSemantics(invalid)).toThrow('Circular reference');
    });

    it('should reject circular hierarchy (indirect)', () => {
      const invalid = createValidFile();
      const task1Id = '123e4567-e89b-12d3-a456-426614174001';
      const task2Id = '123e4567-e89b-12d3-a456-426614174002';

      invalid.chart.tasks = [
        {
          id: task1Id,
          name: 'Task 1',
          startDate: '2026-01-01',
          endDate: '2026-01-02',
          duration: 1,
          progress: 0,
          color: '#000000',
          order: 0,
          parent: task2Id,
        },
        {
          id: task2Id,
          name: 'Task 2',
          startDate: '2026-01-01',
          endDate: '2026-01-02',
          duration: 1,
          progress: 0,
          color: '#000000',
          order: 1,
          parent: task1Id, // Circular
        },
      ];

      expect(() => validateSemantics(invalid)).toThrow('Circular reference');
    });

    it('should accept valid hierarchy', () => {
      const valid = createValidFile();
      const parentId = '123e4567-e89b-12d3-a456-426614174001';
      const childId = '123e4567-e89b-12d3-a456-426614174002';

      valid.chart.tasks = [
        {
          id: parentId,
          name: 'Parent',
          startDate: '2026-01-01',
          endDate: '2026-01-10',
          duration: 10,
          progress: 0,
          color: '#000000',
          order: 0,
        },
        {
          id: childId,
          name: 'Child',
          startDate: '2026-01-02',
          endDate: '2026-01-05',
          duration: 3,
          progress: 0,
          color: '#000000',
          order: 1,
          parent: parentId,
        },
      ];

      expect(() => validateSemantics(valid)).not.toThrow();
    });
  });
});
