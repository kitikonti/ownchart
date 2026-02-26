/**
 * Unit tests for serialization (app state -> JSON)
 * Tests round-trip compatibility and data preservation
 */

import { describe, it, expect } from 'vitest';
import { serializeToGanttFile } from '../../../../src/utils/fileOperations/serialize';
import type { Task } from '../../../../src/types/chart.types';
import type { ViewSettings } from '../../../../src/utils/fileOperations/types';

describe('File Operations - Serialization', () => {
  const createSampleTasks = (): Task[] => [
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
      metadata: {},
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174002',
      name: 'Summary Task',
      startDate: '2026-01-06',
      endDate: '2026-01-15',
      duration: 10,
      progress: 25,
      color: '#10b981',
      order: 1,
      type: 'summary',
      open: true,
      metadata: { notes: 'Important task' },
    },
  ];

  const createSampleViewSettings = (): ViewSettings => ({
    zoom: 1.5,
    panOffset: { x: -100, y: 0 },
    showWeekends: false,
    showTodayMarker: true,
    taskTableWidth: 400,
    columnWidths: { name: 200, startDate: 100 },
  });

  describe('Basic Serialization', () => {
    it('should serialize empty task list', () => {
      const json = serializeToGanttFile([], createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.chart.tasks).toEqual([]);
    });

    it('should serialize tasks with all fields', () => {
      const tasks = createSampleTasks();
      const json = serializeToGanttFile(tasks, createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.chart.tasks).toHaveLength(2);
      expect(parsed.chart.tasks[0].name).toBe('Task 1');
      expect(parsed.chart.tasks[0].progress).toBe(50);
      expect(parsed.chart.tasks[1].type).toBe('summary');
    });

    it('should include file version', () => {
      const json = serializeToGanttFile([], createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.fileVersion).toBe('1.0.0');
    });

    it('should include app version', () => {
      const json = serializeToGanttFile([], createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.appVersion).toBe(__APP_VERSION__);
    });

    it('should include schema version', () => {
      const json = serializeToGanttFile([], createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.schemaVersion).toBe(1);
    });
  });

  describe('View Settings', () => {
    it('should serialize view settings', () => {
      const viewSettings = createSampleViewSettings();
      const json = serializeToGanttFile([], viewSettings);
      const parsed = JSON.parse(json);

      expect(parsed.chart.viewSettings.zoom).toBe(1.5);
      expect(parsed.chart.viewSettings.panOffset).toEqual({ x: -100, y: 0 });
      expect(parsed.chart.viewSettings.showWeekends).toBe(false);
      expect(parsed.chart.viewSettings.taskTableWidth).toBe(400);
    });

    it('should serialize column widths', () => {
      const viewSettings = createSampleViewSettings();
      const json = serializeToGanttFile([], viewSettings);
      const parsed = JSON.parse(json);

      expect(parsed.chart.viewSettings.columnWidths).toEqual({
        name: 200,
        startDate: 100,
      });
    });
  });

  describe('Metadata', () => {
    it('should include chart metadata', () => {
      const json = serializeToGanttFile([], createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.chart.metadata.createdAt).toBeDefined();
      expect(parsed.chart.metadata.updatedAt).toBeDefined();
    });

    it('should include file metadata', () => {
      const json = serializeToGanttFile([], createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.metadata.created).toBeDefined();
      expect(parsed.metadata.modified).toBeDefined();
    });

    it('should use ISO 8601 date format', () => {
      const json = serializeToGanttFile([], createSampleViewSettings());
      const parsed = JSON.parse(json);

      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(parsed.chart.metadata.createdAt).toMatch(isoRegex);
      expect(parsed.metadata.created).toMatch(isoRegex);
    });
  });

  describe('Options', () => {
    it('should use custom chart name', () => {
      const json = serializeToGanttFile([], createSampleViewSettings(), {
        chartName: 'My Project',
      });
      const parsed = JSON.parse(json);

      expect(parsed.chart.name).toBe('My Project');
    });

    it('should default to "Untitled" when no name provided', () => {
      const json = serializeToGanttFile([], createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.chart.name).toBe('Untitled');
    });

    it('should use custom chart ID', () => {
      const customId = '123e4567-e89b-12d3-a456-426614174999';
      const json = serializeToGanttFile([], createSampleViewSettings(), {
        chartId: customId,
      });
      const parsed = JSON.parse(json);

      expect(parsed.chart.id).toBe(customId);
    });

    it('should generate UUID when no ID provided', () => {
      const json = serializeToGanttFile([], createSampleViewSettings());
      const parsed = JSON.parse(json);

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(parsed.chart.id).toMatch(uuidRegex);
    });

    it('should pretty-print when prettyPrint: true', () => {
      const json = serializeToGanttFile([], createSampleViewSettings(), {
        prettyPrint: true,
      });

      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });

    it('should minify when prettyPrint: false', () => {
      const json = serializeToGanttFile([], createSampleViewSettings(), {
        prettyPrint: false,
      });

      expect(json).not.toContain('\n  ');
    });
  });

  describe('Forward Compatibility - Unknown Fields', () => {
    it('should preserve __unknownFields from tasks', () => {
      const tasks: (Task & { __unknownFields?: Record<string, unknown> })[] = [
        {
          ...createSampleTasks()[0],
          __unknownFields: {
            futureField: 'value',
            anotherField: 123,
          },
        },
      ];

      const json = serializeToGanttFile(tasks, createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.chart.tasks[0].futureField).toBe('value');
      expect(parsed.chart.tasks[0].anotherField).toBe(123);
    });

    it('should not include __unknownFields key itself', () => {
      const tasks: (Task & { __unknownFields?: Record<string, unknown> })[] = [
        {
          ...createSampleTasks()[0],
          __unknownFields: { futureField: 'value' },
        },
      ];

      const json = serializeToGanttFile(tasks, createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.chart.tasks[0].__unknownFields).toBeUndefined();
      expect(parsed.chart.tasks[0].futureField).toBe('value');
    });

    it('should not overwrite known fields from __unknownFields', () => {
      const tasks: (Task & { __unknownFields?: Record<string, unknown> })[] = [
        {
          ...createSampleTasks()[0],
          __unknownFields: {
            id: 'hacked-id',
            name: 'hacked-name',
            safeFutureField: 'preserved',
          },
        },
      ];

      const json = serializeToGanttFile(tasks, createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.chart.tasks[0].id).toBe(createSampleTasks()[0].id);
      expect(parsed.chart.tasks[0].name).toBe('Task 1');
      expect(parsed.chart.tasks[0].safeFutureField).toBe('preserved');
    });

    it('should ignore __unknownFields if it is an array (defense-in-depth)', () => {
      const tasks: (Task & { __unknownFields?: Record<string, unknown> })[] = [
        {
          ...createSampleTasks()[0],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          __unknownFields: ['not', 'a', 'record'] as any,
        },
      ];

      const json = serializeToGanttFile(tasks, createSampleViewSettings());
      const parsed = JSON.parse(json);

      // Array __unknownFields should be silently ignored, not spread onto the task
      expect(parsed.chart.tasks[0].name).toBe('Task 1');
      expect(parsed.chart.tasks[0]['0']).toBeUndefined();
      expect(parsed.chart.tasks[0]['1']).toBeUndefined();
    });

    it('should not leak __unknownFields as a literal key into the file', () => {
      const tasks: (Task & { __unknownFields?: Record<string, unknown> })[] = [
        {
          ...createSampleTasks()[0],
          __unknownFields: {
            __unknownFields: { nested: 'should not appear' },
            safeFutureField: 'preserved',
          },
        },
      ];

      const json = serializeToGanttFile(tasks, createSampleViewSettings());
      const parsed = JSON.parse(json);

      // The internal meta-key must not leak into the serialized output
      const taskKeys = Object.keys(parsed.chart.tasks[0]);
      expect(taskKeys).not.toContain('__unknownFields');
      // Other unknown fields are still preserved
      expect(parsed.chart.tasks[0].safeFutureField).toBe('preserved');
    });

    it('should filter prototype pollution keys from __unknownFields', () => {
      const unknownFields: Record<string, unknown> = {
        safeFutureField: 'preserved',
        prototype: { polluted: true },
      };
      // Use defineProperty because { __proto__: ... } sets the prototype instead
      Object.defineProperty(unknownFields, '__proto__', {
        value: { polluted: true },
        enumerable: true,
        configurable: true,
      });
      Object.defineProperty(unknownFields, 'constructor', {
        value: { polluted: true },
        enumerable: true,
        configurable: true,
      });

      const tasks: (Task & { __unknownFields?: Record<string, unknown> })[] = [
        {
          ...createSampleTasks()[0],
          __unknownFields: unknownFields,
        },
      ];

      const json = serializeToGanttFile(tasks, createSampleViewSettings());
      const parsed = JSON.parse(json);

      // Safe fields are preserved
      expect(parsed.chart.tasks[0].safeFutureField).toBe('preserved');
      // Dangerous keys are not present as own properties in the output
      const taskKeys = Object.keys(parsed.chart.tasks[0]);
      expect(taskKeys).not.toContain('__proto__');
      expect(taskKeys).not.toContain('constructor');
      expect(taskKeys).not.toContain('prototype');
    });
  });

  describe('Task Metadata', () => {
    it('should serialize task metadata', () => {
      const tasks = createSampleTasks();
      const json = serializeToGanttFile(tasks, createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.chart.tasks[1].metadata).toEqual({ notes: 'Important task' });
    });

    it('should handle empty metadata', () => {
      const tasks = createSampleTasks();
      const json = serializeToGanttFile(tasks, createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.chart.tasks[0].metadata).toEqual({});
    });
  });

  describe('Feature Flags', () => {
    it('should include feature flags', () => {
      const json = serializeToGanttFile(createSampleTasks(), createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.features).toBeDefined();
      expect(parsed.features.hasHierarchy).toBeDefined();
      expect(parsed.features.hasHistory).toBe(false);
    });

    it('should set hasHierarchy based on parent relationships', () => {
      const tasks: Task[] = [
        {
          ...createSampleTasks()[0],
          parent: undefined,
        },
        {
          ...createSampleTasks()[1],
          parent: '123e4567-e89b-12d3-a456-426614174001',
        },
      ];

      const json = serializeToGanttFile(tasks, createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.features.hasHierarchy).toBe(true);
    });
  });

  describe('Task Timestamps', () => {
    it('should preserve existing createdAt from deserialized tasks', () => {
      const originalCreatedAt = '2025-06-15T10:30:00.000Z';
      const tasks: (Task & { createdAt?: string })[] = [
        {
          ...createSampleTasks()[0],
          createdAt: originalCreatedAt,
        },
      ];

      const json = serializeToGanttFile(tasks, createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.chart.tasks[0].createdAt).toBe(originalCreatedAt);
    });

    it('should set createdAt to now for new tasks without createdAt', () => {
      const tasks = createSampleTasks();
      const json = serializeToGanttFile(tasks, createSampleViewSettings());
      const parsed = JSON.parse(json);

      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(parsed.chart.tasks[0].createdAt).toMatch(isoRegex);
    });

    it('should always update updatedAt to now', () => {
      const oldUpdatedAt = '2020-01-01T00:00:00.000Z';
      const tasks: (Task & { updatedAt?: string })[] = [
        {
          ...createSampleTasks()[0],
          updatedAt: oldUpdatedAt,
        },
      ];

      const json = serializeToGanttFile(tasks, createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.chart.tasks[0].updatedAt).not.toBe(oldUpdatedAt);
    });
  });

  describe('Chart Metadata - createdAt Preservation', () => {
    it('should use provided chartCreatedAt instead of now', () => {
      const originalCreatedAt = '2025-06-01T12:00:00.000Z';
      const json = serializeToGanttFile([], createSampleViewSettings(), {
        chartCreatedAt: originalCreatedAt,
      });
      const parsed = JSON.parse(json);

      expect(parsed.chart.metadata.createdAt).toBe(originalCreatedAt);
    });

    it('should default to now when chartCreatedAt not provided', () => {
      const before = new Date().toISOString();
      const json = serializeToGanttFile([], createSampleViewSettings());
      const parsed = JSON.parse(json);
      const after = new Date().toISOString();

      expect(parsed.chart.metadata.createdAt >= before).toBe(true);
      expect(parsed.chart.metadata.createdAt <= after).toBe(true);
    });

    it('should always set updatedAt to now regardless of chartCreatedAt', () => {
      const before = new Date().toISOString();
      const json = serializeToGanttFile([], createSampleViewSettings(), {
        chartCreatedAt: '2020-01-01T00:00:00.000Z',
      });
      const parsed = JSON.parse(json);
      const after = new Date().toISOString();

      expect(parsed.chart.metadata.updatedAt >= before).toBe(true);
      expect(parsed.chart.metadata.updatedAt <= after).toBe(true);
    });
  });

  describe('Dependency Serialization', () => {
    it('should serialize dependencies with correct field mapping', () => {
      const json = serializeToGanttFile([], createSampleViewSettings(), {
        dependencies: [
          {
            id: '123e4567-e89b-12d3-a456-426614174099',
            fromTaskId: '123e4567-e89b-12d3-a456-426614174001',
            toTaskId: '123e4567-e89b-12d3-a456-426614174002',
            type: 'FS',
            lag: 2,
            createdAt: '2025-06-01T12:00:00.000Z',
          },
        ],
      });
      const parsed = JSON.parse(json);

      expect(parsed.chart.dependencies).toHaveLength(1);
      expect(parsed.chart.dependencies[0].id).toBe(
        '123e4567-e89b-12d3-a456-426614174099'
      );
      expect(parsed.chart.dependencies[0].from).toBe(
        '123e4567-e89b-12d3-a456-426614174001'
      );
      expect(parsed.chart.dependencies[0].to).toBe(
        '123e4567-e89b-12d3-a456-426614174002'
      );
      expect(parsed.chart.dependencies[0].type).toBe('FS');
      expect(parsed.chart.dependencies[0].lag).toBe(2);
      expect(parsed.chart.dependencies[0].createdAt).toBe(
        '2025-06-01T12:00:00.000Z'
      );
    });

    it('should set hasDependencies feature flag when dependencies exist', () => {
      const json = serializeToGanttFile([], createSampleViewSettings(), {
        dependencies: [
          {
            id: '123e4567-e89b-12d3-a456-426614174099',
            fromTaskId: 'a',
            toTaskId: 'b',
            type: 'FS',
            createdAt: '2025-06-01T12:00:00.000Z',
          },
        ],
      });
      const parsed = JSON.parse(json);

      expect(parsed.features.hasDependencies).toBe(true);
    });

    it('should set hasDependencies to false when no dependencies', () => {
      const json = serializeToGanttFile([], createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.features.hasDependencies).toBe(false);
    });
  });

  describe('Dependency Unknown Fields (Defense-in-Depth)', () => {
    it('should preserve unknown dependency fields', () => {
      const json = serializeToGanttFile([], createSampleViewSettings(), {
        dependencies: [
          {
            id: '123e4567-e89b-12d3-a456-426614174099',
            fromTaskId: '123e4567-e89b-12d3-a456-426614174001',
            toTaskId: '123e4567-e89b-12d3-a456-426614174002',
            type: 'FS',
            createdAt: '2025-06-01T12:00:00.000Z',
            __unknownFields: {
              futureColor: '#FF0000',
              futureLabel: 'critical path',
            },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        ],
      });
      const parsed = JSON.parse(json);

      expect(parsed.chart.dependencies[0].futureColor).toBe('#FF0000');
      expect(parsed.chart.dependencies[0].futureLabel).toBe('critical path');
    });

    it('should not include __unknownFields key itself on dependencies', () => {
      const json = serializeToGanttFile([], createSampleViewSettings(), {
        dependencies: [
          {
            id: '123e4567-e89b-12d3-a456-426614174099',
            fromTaskId: 'a',
            toTaskId: 'b',
            type: 'FS',
            createdAt: '',
            __unknownFields: { futureField: 'value' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        ],
      });
      const parsed = JSON.parse(json);

      expect(parsed.chart.dependencies[0].__unknownFields).toBeUndefined();
      expect(parsed.chart.dependencies[0].futureField).toBe('value');
    });

    it('should not overwrite known dependency fields from __unknownFields', () => {
      const json = serializeToGanttFile([], createSampleViewSettings(), {
        dependencies: [
          {
            id: '123e4567-e89b-12d3-a456-426614174099',
            fromTaskId: '123e4567-e89b-12d3-a456-426614174001',
            toTaskId: '123e4567-e89b-12d3-a456-426614174002',
            type: 'FS',
            createdAt: '2025-06-01T12:00:00.000Z',
            __unknownFields: {
              id: 'hacked-id',
              from: 'hacked-from',
              to: 'hacked-to',
              type: 'hacked-type',
              safeFutureField: 'preserved',
            },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        ],
      });
      const parsed = JSON.parse(json);

      expect(parsed.chart.dependencies[0].id).toBe('123e4567-e89b-12d3-a456-426614174099');
      expect(parsed.chart.dependencies[0].from).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(parsed.chart.dependencies[0].to).toBe('123e4567-e89b-12d3-a456-426614174002');
      expect(parsed.chart.dependencies[0].type).toBe('FS');
      expect(parsed.chart.dependencies[0].safeFutureField).toBe('preserved');
    });

    it('should filter prototype pollution keys from dependency __unknownFields', () => {
      const unknownFields: Record<string, unknown> = {
        safeFutureField: 'preserved',
        prototype: { polluted: true },
      };
      Object.defineProperty(unknownFields, '__proto__', {
        value: { polluted: true },
        enumerable: true,
        configurable: true,
      });
      Object.defineProperty(unknownFields, 'constructor', {
        value: { polluted: true },
        enumerable: true,
        configurable: true,
      });

      const json = serializeToGanttFile([], createSampleViewSettings(), {
        dependencies: [
          {
            id: '123e4567-e89b-12d3-a456-426614174099',
            fromTaskId: 'a',
            toTaskId: 'b',
            type: 'FS',
            createdAt: '',
            __unknownFields: unknownFields,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        ],
      });
      const parsed = JSON.parse(json);

      expect(parsed.chart.dependencies[0].safeFutureField).toBe('preserved');
      const depKeys = Object.keys(parsed.chart.dependencies[0]);
      expect(depKeys).not.toContain('__proto__');
      expect(depKeys).not.toContain('constructor');
      expect(depKeys).not.toContain('prototype');
    });

    it('should ignore __unknownFields if it is an array (defense-in-depth)', () => {
      const json = serializeToGanttFile([], createSampleViewSettings(), {
        dependencies: [
          {
            id: '123e4567-e89b-12d3-a456-426614174099',
            fromTaskId: 'a',
            toTaskId: 'b',
            type: 'FS',
            createdAt: '',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            __unknownFields: ['not', 'a', 'record'] as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        ],
      });
      const parsed = JSON.parse(json);

      expect(parsed.chart.dependencies[0].from).toBe('a');
      expect(parsed.chart.dependencies[0]['0']).toBeUndefined();
    });
  });

  describe('Round-Trip Compatibility', () => {
    it('should maintain data integrity in round-trip', () => {
      const originalTasks = createSampleTasks();
      const viewSettings = createSampleViewSettings();

      const json = serializeToGanttFile(originalTasks, viewSettings);
      const parsed = JSON.parse(json);

      expect(parsed.chart.tasks[0].id).toBe(originalTasks[0].id);
      expect(parsed.chart.tasks[0].name).toBe(originalTasks[0].name);
      expect(parsed.chart.tasks[0].progress).toBe(originalTasks[0].progress);
      expect(parsed.chart.viewSettings.zoom).toBe(viewSettings.zoom);
    });

    it('should handle special characters in task names', () => {
      const tasks: Task[] = [
        {
          ...createSampleTasks()[0],
          name: 'Task with "quotes" and \\backslashes\\',
        },
      ];

      const json = serializeToGanttFile(tasks, createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.chart.tasks[0].name).toBe('Task with "quotes" and \\backslashes\\');
    });

    it('should handle unicode characters', () => {
      const tasks: Task[] = [
        {
          ...createSampleTasks()[0],
          name: 'Task with émojis 🚀 and ümlauts',
        },
      ];

      const json = serializeToGanttFile(tasks, createSampleViewSettings());
      const parsed = JSON.parse(json);

      expect(parsed.chart.tasks[0].name).toBe('Task with émojis 🚀 and ümlauts');
    });
  });
});
