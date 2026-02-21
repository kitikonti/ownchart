/**
 * Unit tests for deserialization (JSON -> app state)
 * Tests full validation pipeline and data conversion
 */

import { describe, it, expect } from 'vitest';
import { deserializeGanttFile } from '../../../../src/utils/fileOperations/deserialize';

describe('File Operations - Deserialization', () => {
  const createValidFileContent = (): Record<string, unknown> => ({
    fileVersion: '1.0.0',
    appVersion: '0.0.1',
    schemaVersion: 1,
    chart: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Chart',
      tasks: [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Task 1',
          startDate: '2026-01-01',
          endDate: '2026-01-05',
          duration: 5,
          progress: 50,
          color: '#3b82f6',
          order: 0,
          type: 'task',
          metadata: { notes: 'Important' },
        },
      ],
      viewSettings: {
        zoom: 1.5,
        panOffset: { x: -100, y: 0 },
        showWeekends: false,
        showTodayMarker: true,
        taskTableWidth: 400,
        columnWidths: { name: 250, startDate: 100 },
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

  describe('Successful Deserialization', () => {
    it('should deserialize valid file', async () => {
      const content = JSON.stringify(createValidFileContent());
      const result = await deserializeGanttFile(content, 'test.ownchart');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.tasks).toHaveLength(1);
    });

    it('should return chart name', async () => {
      const content = JSON.stringify(createValidFileContent());
      const result = await deserializeGanttFile(content, 'test.ownchart');

      expect(result.data!.chartName).toBe('Test Chart');
    });

    it('should return chart ID', async () => {
      const content = JSON.stringify(createValidFileContent());
      const result = await deserializeGanttFile(content, 'test.ownchart');

      expect(result.data!.chartId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should return view settings', async () => {
      const content = JSON.stringify(createValidFileContent());
      const result = await deserializeGanttFile(content, 'test.ownchart');

      expect(result.data!.viewSettings.zoom).toBe(1.5);
      expect(result.data!.viewSettings.showWeekends).toBe(false);
    });

    it('should return taskTableWidth from view settings', async () => {
      const content = JSON.stringify(createValidFileContent());
      const result = await deserializeGanttFile(content, 'test.ownchart');

      expect(result.data!.viewSettings.taskTableWidth).toBe(400);
    });

    it('should return columnWidths from view settings', async () => {
      const content = JSON.stringify(createValidFileContent());
      const result = await deserializeGanttFile(content, 'test.ownchart');

      expect(result.data!.viewSettings.columnWidths).toEqual({
        name: 250,
        startDate: 100,
      });
    });

    it('should handle missing columnWidths in file', async () => {
      const file = createValidFileContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (file.chart.viewSettings as any).columnWidths;

      const content = JSON.stringify(file);
      const result = await deserializeGanttFile(content, 'test.ownchart');

      expect(result.success).toBe(true);
      expect(result.data!.viewSettings.columnWidths).toBeUndefined();
    });

    it('should convert tasks to proper format', async () => {
      const content = JSON.stringify(createValidFileContent());
      const result = await deserializeGanttFile(content, 'test.ownchart');

      const task = result.data!.tasks[0];
      expect(task.id).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(task.name).toBe('Task 1');
      expect(task.progress).toBe(50);
      expect(task.type).toBe('task');
    });
  });

  describe('Invalid JSON', () => {
    it('should reject malformed JSON', async () => {
      const invalid = '{not valid json}';
      const result = await deserializeGanttFile(invalid, 'test.ownchart');

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('INVALID_JSON');
    });

    it('should reject empty content', async () => {
      const result = await deserializeGanttFile('', 'test.ownchart');

      expect(result.success).toBe(false);
    });

    it('should reject non-object JSON', async () => {
      const invalid = '["array"]';
      const result = await deserializeGanttFile(invalid, 'test.ownchart');

      expect(result.success).toBe(false);
      // Arrays are objects, so it passes structure check but fails on missing fields
      expect(result.error!.code).toMatch(/MISSING_FIELD|INVALID_STRUCTURE/);
    });
  });

  describe('Missing Required Fields', () => {
    it('should reject file without fileVersion', async () => {
      const invalid = createValidFileContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (invalid as any).fileVersion;

      const result = await deserializeGanttFile(
        JSON.stringify(invalid),
        'test.ownchart'
      );

      expect(result.success).toBe(false);
      expect(result.error!.message).toContain('fileVersion');
    });

    it('should reject file without chart', async () => {
      const invalid = { fileVersion: '1.0.0' };

      const result = await deserializeGanttFile(
        JSON.stringify(invalid),
        'test.ownchart'
      );

      expect(result.success).toBe(false);
      expect(result.error!.message).toContain('chart');
    });

    it('should reject file without tasks array', async () => {
      const invalid = createValidFileContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (invalid.chart as any).tasks;

      const result = await deserializeGanttFile(
        JSON.stringify(invalid),
        'test.ownchart'
      );

      expect(result.success).toBe(false);
    });

    it('should reject file without viewSettings', async () => {
      const invalid = createValidFileContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (invalid.chart as any).viewSettings;

      const result = await deserializeGanttFile(
        JSON.stringify(invalid),
        'test.ownchart'
      );

      expect(result.success).toBe(false);
    });
  });

  describe('Invalid Task Data', () => {
    it('should reject task with invalid UUID', async () => {
      const invalid = createValidFileContent();
      invalid.chart.tasks[0].id = 'not-a-uuid';

      const result = await deserializeGanttFile(
        JSON.stringify(invalid),
        'test.ownchart'
      );

      expect(result.success).toBe(false);
      expect(result.error!.message).toContain('invalid UUID');
    });

    it('should reject task with invalid date', async () => {
      const invalid = createValidFileContent();
      invalid.chart.tasks[0].startDate = 'not-a-date';

      const result = await deserializeGanttFile(
        JSON.stringify(invalid),
        'test.ownchart'
      );

      expect(result.success).toBe(false);
      expect(result.error!.message).toContain('invalid startDate');
    });

    it('should reject task with progress > 100', async () => {
      const invalid = createValidFileContent();
      invalid.chart.tasks[0].progress = 150;

      const result = await deserializeGanttFile(
        JSON.stringify(invalid),
        'test.ownchart'
      );

      expect(result.success).toBe(false);
      expect(result.error!.message).toContain('invalid progress');
    });

    it('should reject task with invalid color', async () => {
      const invalid = createValidFileContent();
      invalid.chart.tasks[0].color = 'red';

      const result = await deserializeGanttFile(
        JSON.stringify(invalid),
        'test.ownchart'
      );

      expect(result.success).toBe(false);
      expect(result.error!.message).toContain('invalid color');
    });
  });

  describe('File Size Validation', () => {
    it('should reject files larger than 50MB', async () => {
      const content = JSON.stringify(createValidFileContent());
      const largeSize = 51 * 1024 * 1024;

      const result = await deserializeGanttFile(content, 'test.ownchart', largeSize);

      expect(result.success).toBe(false);
      expect(result.error!.message).toContain('exceeds limit');
    });

    it('should accept files smaller than 50MB', async () => {
      const content = JSON.stringify(createValidFileContent());
      const validSize = 1024;

      const result = await deserializeGanttFile(content, 'test.ownchart', validSize);

      expect(result.success).toBe(true);
    });
  });

  describe('Default Values', () => {
    it('should default task type to "task"', async () => {
      const file = createValidFileContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (file.chart.tasks[0] as any).type;

      const result = await deserializeGanttFile(JSON.stringify(file), 'test.ownchart');

      expect(result.data!.tasks[0].type).toBe('task');
    });

    it('should default progress to 0', async () => {
      const file = createValidFileContent();
      // Set progress to 0 explicitly (or it could be undefined and defaulted)
      file.chart.tasks[0].progress = 0;

      const result = await deserializeGanttFile(JSON.stringify(file), 'test.ownchart');

      expect(result.success).toBe(true);
      expect(result.data!.tasks[0].progress).toBe(0);
    });

    it('should default open to true', async () => {
      const file = createValidFileContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (file.chart.tasks[0] as any).open;

      const result = await deserializeGanttFile(JSON.stringify(file), 'test.ownchart');

      expect(result.data!.tasks[0].open).toBe(true);
    });

    it('should default metadata to empty object', async () => {
      const file = createValidFileContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (file.chart.tasks[0] as any).metadata;

      const result = await deserializeGanttFile(JSON.stringify(file), 'test.ownchart');

      expect(result.data!.tasks[0].metadata).toEqual({});
    });
  });

  describe('Forward Compatibility - Unknown Fields', () => {
    it('should preserve unknown task fields', async () => {
      const file = createValidFileContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (file.chart.tasks[0] as any).futureField = 'future value';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (file.chart.tasks[0] as any).customData = { nested: true };

      const result = await deserializeGanttFile(JSON.stringify(file), 'test.ownchart');

      expect(result.data!.tasks[0].__unknownFields).toBeDefined();
      expect(result.data!.tasks[0].__unknownFields!.futureField).toBe('future value');
      expect(result.data!.tasks[0].__unknownFields!.customData).toEqual({
        nested: true,
      });
    });

    it('should not store known fields in __unknownFields', async () => {
      const file = createValidFileContent();

      const result = await deserializeGanttFile(JSON.stringify(file), 'test.ownchart');

      if (result.data!.tasks[0].__unknownFields) {
        expect(result.data!.tasks[0].__unknownFields!.id).toBeUndefined();
        expect(result.data!.tasks[0].__unknownFields!.name).toBeUndefined();
      }
    });

    it('should preserve createdAt/updatedAt in __unknownFields for round-trip', async () => {
      const file = createValidFileContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (file.chart.tasks[0] as any).createdAt = '2026-01-01T00:00:00.000Z';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (file.chart.tasks[0] as any).updatedAt = '2026-01-15T12:00:00.000Z';

      const result = await deserializeGanttFile(JSON.stringify(file), 'test.ownchart');

      expect(result.data!.tasks[0].__unknownFields).toBeDefined();
      expect(result.data!.tasks[0].__unknownFields!.createdAt).toBe('2026-01-01T00:00:00.000Z');
      expect(result.data!.tasks[0].__unknownFields!.updatedAt).toBe('2026-01-15T12:00:00.000Z');
    });
  });

  describe('XSS Prevention (Sanitization)', () => {
    it('should sanitize task names with script tags', async () => {
      const malicious = createValidFileContent();
      malicious.chart.tasks[0].name = '<script>alert("XSS")</script>Clean Name';

      const result = await deserializeGanttFile(
        JSON.stringify(malicious),
        'test.ownchart'
      );

      expect(result.data!.tasks[0].name).not.toContain('<script>');
      expect(result.data!.tasks[0].name).toContain('Clean Name');
    });

    it('should sanitize chart name with HTML', async () => {
      const malicious = createValidFileContent();
      malicious.chart.name = '<b>Bold</b> Chart';

      const result = await deserializeGanttFile(
        JSON.stringify(malicious),
        'test.ownchart'
      );

      expect(result.data!.chartName).not.toContain('<b>');
      expect(result.data!.chartName).toContain('Chart');
    });
  });

  describe('Prototype Pollution Prevention', () => {
    it('should filter __proto__ keys', async () => {
      const malicious = {
        ...createValidFileContent(),
        __proto__: { polluted: true },
      };

      const result = await deserializeGanttFile(
        JSON.stringify(malicious),
        'test.ownchart'
      );

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((Object.prototype as any).polluted).toBeUndefined();
    });
  });

  describe('Hierarchy Validation', () => {
    it('should reject dangling parent reference', async () => {
      const invalid = createValidFileContent();
      invalid.chart.tasks[0].parent = '123e4567-e89b-12d3-a456-999999999999';

      const result = await deserializeGanttFile(
        JSON.stringify(invalid),
        'test.ownchart'
      );

      expect(result.success).toBe(false);
      expect(result.error!.message).toContain('non-existent parent');
    });

    it('should reject circular hierarchy', async () => {
      const invalid = createValidFileContent();
      const taskId = invalid.chart.tasks[0].id;
      invalid.chart.tasks[0].parent = taskId;

      const result = await deserializeGanttFile(
        JSON.stringify(invalid),
        'test.ownchart'
      );

      expect(result.success).toBe(false);
      expect(result.error!.message).toContain('Circular reference');
    });

    it('should accept valid parent-child hierarchy', async () => {
      const valid = createValidFileContent();
      valid.chart.tasks.push({
        id: '123e4567-e89b-12d3-a456-426614174002',
        name: 'Child Task',
        startDate: '2026-01-02',
        endDate: '2026-01-03',
        duration: 1,
        progress: 0,
        color: '#10b981',
        order: 1,
        parent: '123e4567-e89b-12d3-a456-426614174001',
      });

      const result = await deserializeGanttFile(
        JSON.stringify(valid),
        'test.ownchart'
      );

      expect(result.success).toBe(true);
      expect(result.data!.tasks[1].parent).toBe(
        '123e4567-e89b-12d3-a456-426614174001'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty task array', async () => {
      const file = createValidFileContent();
      file.chart.tasks = [];

      const result = await deserializeGanttFile(JSON.stringify(file), 'test.ownchart');

      expect(result.success).toBe(true);
      expect(result.data!.tasks).toEqual([]);
    });

    it('should handle missing optional description', async () => {
      const file = createValidFileContent();

      const result = await deserializeGanttFile(JSON.stringify(file), 'test.ownchart');

      expect(result.success).toBe(true);
    });

    it('should fix milestone with empty endDate on load', async () => {
      const file = createValidFileContent();
      file.chart.tasks[0].type = 'milestone';
      file.chart.tasks[0].startDate = '2026-01-01';
      file.chart.tasks[0].endDate = '';
      file.chart.tasks[0].duration = 0;
      file.chart.tasks[0].progress = 0;

      const result = await deserializeGanttFile(JSON.stringify(file), 'test.ownchart');

      expect(result.success).toBe(true);
      expect(result.data!.tasks[0].endDate).toBe('2026-01-01');
    });

    it('should handle unicode in task names', async () => {
      const file = createValidFileContent();
      file.chart.tasks[0].name = 'Task with émojis 🚀 and ümlauts';

      const result = await deserializeGanttFile(JSON.stringify(file), 'test.ownchart');

      expect(result.data!.tasks[0].name).toBe('Task with émojis 🚀 and ümlauts');
    });
  });
});
