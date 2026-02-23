/**
 * Unit tests for sanitization (XSS prevention with DOMPurify)
 * Tests Layer 5 of validation pipeline
 */

import { describe, it, expect } from 'vitest';
import { sanitizeGanttFile } from '../../../../src/utils/fileOperations/sanitize';
import type { GanttFile } from '../../../../src/utils/fileOperations/types';

describe('File Operations - Sanitization (XSS Prevention)', () => {
  const createBaseFile = (): GanttFile => ({
    fileVersion: '1.0.0',
    appVersion: '0.0.1',
    schemaVersion: 1,
    chart: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Clean Chart',
      tasks: [],
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

  describe('XSS Prevention - Script Tags', () => {
    it('should strip <script> tags from chart name', () => {
      const malicious = createBaseFile();
      malicious.chart.name = '<script>alert("XSS")</script>Safe Name';

      const sanitized = sanitizeGanttFile(malicious);

      expect(sanitized.chart.name).not.toContain('<script>');
      expect(sanitized.chart.name).not.toContain('</script>');
      expect(sanitized.chart.name).toContain('Safe Name');
    });

    it('should strip <script> tags from task names', () => {
      const malicious = createBaseFile();
      malicious.chart.tasks = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: '<script>alert("XSS")</script>Task Name',
          startDate: '2026-01-01',
          endDate: '2026-01-02',
          duration: 1,
          progress: 0,
          color: '#000000',
          order: 0,
        },
      ];

      const sanitized = sanitizeGanttFile(malicious);

      expect(sanitized.chart.tasks[0].name).not.toContain('<script>');
      expect(sanitized.chart.tasks[0].name).toContain('Task Name');
    });

    it('should strip inline JavaScript from task names', () => {
      const malicious = createBaseFile();
      malicious.chart.tasks = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: '<img src=x onerror=alert("XSS")>Task',
          startDate: '2026-01-01',
          endDate: '2026-01-02',
          duration: 1,
          progress: 0,
          color: '#000000',
          order: 0,
        },
      ];

      const sanitized = sanitizeGanttFile(malicious);

      expect(sanitized.chart.tasks[0].name).not.toContain('onerror');
      expect(sanitized.chart.tasks[0].name).not.toContain('alert');
    });
  });

  describe('XSS Prevention - HTML Tags', () => {
    it('should strip <iframe> tags', () => {
      const malicious = createBaseFile();
      malicious.chart.name = '<iframe src="evil.com"></iframe>Chart';

      const sanitized = sanitizeGanttFile(malicious);

      expect(sanitized.chart.name).not.toContain('<iframe');
      expect(sanitized.chart.name).toContain('Chart');
    });

    it('should strip <object> tags', () => {
      const malicious = createBaseFile();
      malicious.chart.name = '<object data="evil.swf"></object>Name';

      const sanitized = sanitizeGanttFile(malicious);

      expect(sanitized.chart.name).not.toContain('<object');
    });

    it('should strip <embed> tags', () => {
      const malicious = createBaseFile();
      malicious.chart.name = '<embed src="evil.swf">Chart';

      const sanitized = sanitizeGanttFile(malicious);

      expect(sanitized.chart.name).not.toContain('<embed');
    });

    it('should strip all HTML tags but keep content', () => {
      const malicious = createBaseFile();
      malicious.chart.name = '<div><b>Bold</b> and <i>italic</i></div>';

      const sanitized = sanitizeGanttFile(malicious);

      expect(sanitized.chart.name).not.toContain('<div>');
      expect(sanitized.chart.name).not.toContain('<b>');
      expect(sanitized.chart.name).not.toContain('<i>');
      expect(sanitized.chart.name).toContain('Bold and italic');
    });
  });

  describe('XSS Prevention - Event Handlers', () => {
    it('should strip onclick handlers', () => {
      const malicious = createBaseFile();
      malicious.chart.name = '<a onclick="alert(1)">Link</a>';

      const sanitized = sanitizeGanttFile(malicious);

      expect(sanitized.chart.name).not.toContain('onclick');
    });

    it('should strip onload handlers', () => {
      const malicious = createBaseFile();
      malicious.chart.name = '<body onload="alert(1)">Text</body>';

      const sanitized = sanitizeGanttFile(malicious);

      expect(sanitized.chart.name).not.toContain('onload');
    });

    it('should strip onerror handlers', () => {
      const malicious = createBaseFile();
      malicious.chart.name = '<img onerror="alert(1)" src=x>';

      const sanitized = sanitizeGanttFile(malicious);

      expect(sanitized.chart.name).not.toContain('onerror');
    });
  });

  describe('Task Description Sanitization', () => {
    it('should sanitize task description field', () => {
      const malicious = createBaseFile();
      malicious.chart.tasks = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Task',
          startDate: '2026-01-01',
          endDate: '2026-01-02',
          duration: 1,
          progress: 0,
          color: '#000000',
          order: 0,
          description: '<script>alert("XSS")</script>Description',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ];

      const sanitized = sanitizeGanttFile(malicious);

      expect(sanitized.chart.tasks[0].description).not.toContain('<script>');
    });
  });

  describe('Chart Description Sanitization', () => {
    it('should sanitize chart description', () => {
      const malicious = createBaseFile();
      malicious.chart.description = '<script>alert("XSS")</script>Project Description';

      const sanitized = sanitizeGanttFile(malicious);

      expect(sanitized.chart.description).not.toContain('<script>');
      expect(sanitized.chart.description).toContain('Project Description');
    });
  });

  describe('Safe Content Preservation', () => {
    it('should preserve plain text content', () => {
      const safe = createBaseFile();
      safe.chart.name = 'My Project Chart';
      safe.chart.tasks = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Task with special chars: @#$%^*()_+-={}[]|;:,.',
          startDate: '2026-01-01',
          endDate: '2026-01-02',
          duration: 1,
          progress: 0,
          color: '#000000',
          order: 0,
        },
      ];

      const sanitized = sanitizeGanttFile(safe);

      expect(sanitized.chart.name).toBe('My Project Chart');
      expect(sanitized.chart.tasks[0].name).toContain('@#$%^*()_+-={}[]|;:,.');
    });

    it('should preserve unicode characters', () => {
      const safe = createBaseFile();
      safe.chart.name = 'Projekt mit Ümläuten und émojis 🚀✨';

      const sanitized = sanitizeGanttFile(safe);

      expect(sanitized.chart.name).toBe('Projekt mit Ümläuten und émojis 🚀✨');
    });

    it('should preserve newlines and whitespace', () => {
      const safe = createBaseFile();
      safe.chart.name = 'Line 1\nLine 2\n  Indented';

      const sanitized = sanitizeGanttFile(safe);

      expect(sanitized.chart.name).toBe('Line 1\nLine 2\n  Indented');
    });
  });

  describe('Metadata Sanitization', () => {
    it('should sanitize nested metadata strings', () => {
      const malicious = createBaseFile();
      malicious.chart.tasks = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Task',
          startDate: '2026-01-01',
          endDate: '2026-01-02',
          duration: 1,
          progress: 0,
          color: '#000000',
          order: 0,
          metadata: {
            notes: '<script>alert("XSS")</script>Notes',
            category: '<b>Category</b>',
          },
        },
      ];

      const sanitized = sanitizeGanttFile(malicious);

      expect(sanitized.chart.tasks[0].metadata!.notes).not.toContain('<script>');
      expect(sanitized.chart.tasks[0].metadata!.category).not.toContain('<b>');
    });

    it('should handle deeply nested metadata', () => {
      const malicious = createBaseFile();
      malicious.chart.tasks = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Task',
          startDate: '2026-01-01',
          endDate: '2026-01-02',
          duration: 1,
          progress: 0,
          color: '#000000',
          order: 0,
          metadata: {
            level1: {
              level2: {
                level3: '<script>alert("deep")</script>Value',
              },
            },
          },
        },
      ];

      const sanitized = sanitizeGanttFile(malicious);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const level3 = (sanitized.chart.tasks[0].metadata as any).level1.level2.level3;
      expect(level3).not.toContain('<script>');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const file = createBaseFile();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      file.chart.description = null as any;

      const sanitized = sanitizeGanttFile(file);

      // Null values pass through the ternary (not sanitized)
      expect(sanitized.chart.description).toBeNull();
    });

    it('should handle undefined values', () => {
      const file = createBaseFile();
      file.chart.description = undefined;

      const sanitized = sanitizeGanttFile(file);

      expect(sanitized.chart.description).toBeUndefined();
    });

    it('should handle empty strings', () => {
      const file = createBaseFile();
      file.chart.name = '';

      const sanitized = sanitizeGanttFile(file);

      expect(sanitized.chart.name).toBe('');
    });

    it('should handle arrays in metadata', () => {
      const file = createBaseFile();
      file.chart.tasks = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Task',
          startDate: '2026-01-01',
          endDate: '2026-01-02',
          duration: 1,
          progress: 0,
          color: '#000000',
          order: 0,
          metadata: {
            tags: ['<script>tag1</script>', 'tag2', '<b>tag3</b>'],
          },
        },
      ];

      const sanitized = sanitizeGanttFile(file);
      const tags = sanitized.chart.tasks[0].metadata!.tags as string[];

      expect(tags[0]).not.toContain('<script>');
      expect(tags[2]).not.toContain('<b>');
    });
  });

  describe('ViewSettings Sanitization', () => {
    it('should sanitize projectTitle with XSS', () => {
      const malicious = createBaseFile();
      malicious.chart.viewSettings.projectTitle = '<script>alert("XSS")</script>My Project';

      const sanitized = sanitizeGanttFile(malicious);

      expect(sanitized.chart.viewSettings.projectTitle).not.toContain('<script>');
      expect(sanitized.chart.viewSettings.projectTitle).toContain('My Project');
    });

    it('should sanitize projectAuthor with XSS', () => {
      const malicious = createBaseFile();
      malicious.chart.viewSettings.projectAuthor = '<img onerror=alert(1) src=x>John';

      const sanitized = sanitizeGanttFile(malicious);

      expect(sanitized.chart.viewSettings.projectAuthor).not.toContain('onerror');
      expect(sanitized.chart.viewSettings.projectAuthor).toContain('John');
    });

    it('should preserve clean projectTitle and projectAuthor', () => {
      const file = createBaseFile();
      file.chart.viewSettings.projectTitle = 'Clean Project Name';
      file.chart.viewSettings.projectAuthor = 'Martin Müller';

      const sanitized = sanitizeGanttFile(file);

      expect(sanitized.chart.viewSettings.projectTitle).toBe('Clean Project Name');
      expect(sanitized.chart.viewSettings.projectAuthor).toBe('Martin Müller');
    });

    it('should handle undefined projectTitle and projectAuthor', () => {
      const file = createBaseFile();
      file.chart.viewSettings.projectTitle = undefined;
      file.chart.viewSettings.projectAuthor = undefined;

      const sanitized = sanitizeGanttFile(file);

      expect(sanitized.chart.viewSettings.projectTitle).toBeUndefined();
      expect(sanitized.chart.viewSettings.projectAuthor).toBeUndefined();
    });
  });

  describe('Unknown Task Fields (future-proofing)', () => {
    it('should sanitize unknown string fields on tasks', () => {
      const file = createBaseFile();
      file.chart.tasks = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Task',
          startDate: '2026-01-01',
          endDate: '2026-01-02',
          duration: 1,
          progress: 0,
          color: '#000000',
          order: 0,
          futureStringField: '<script>alert("XSS")</script>Safe',
        },
      ];

      const sanitized = sanitizeGanttFile(file);

      expect(sanitized.chart.tasks[0].futureStringField).not.toContain(
        '<script>'
      );
      expect(sanitized.chart.tasks[0].futureStringField).toContain('Safe');
    });

    it('should not corrupt ID-like fields during sanitization', () => {
      const file = createBaseFile();
      file.chart.tasks = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Task',
          startDate: '2026-01-01',
          endDate: '2026-01-02',
          duration: 1,
          progress: 0,
          color: '#FF0000',
          order: 0,
          parent: '123e4567-e89b-12d3-a456-426614174002',
          colorOverride: '#00FF00',
          type: 'task',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ];

      const sanitized = sanitizeGanttFile(file);

      // ID-like fields should pass through unchanged
      expect(sanitized.chart.tasks[0].id).toBe(
        '123e4567-e89b-12d3-a456-426614174001'
      );
      expect(sanitized.chart.tasks[0].color).toBe('#FF0000');
      expect(sanitized.chart.tasks[0].parent).toBe(
        '123e4567-e89b-12d3-a456-426614174002'
      );
      expect(sanitized.chart.tasks[0].colorOverride).toBe('#00FF00');
      expect(sanitized.chart.tasks[0].startDate).toBe('2026-01-01');
      expect(sanitized.chart.tasks[0].endDate).toBe('2026-01-02');
      expect(sanitized.chart.tasks[0].type).toBe('task');
      expect(sanitized.chart.tasks[0].createdAt).toBe(
        '2026-01-01T00:00:00.000Z'
      );
      expect(sanitized.chart.tasks[0].updatedAt).toBe(
        '2026-01-01T00:00:00.000Z'
      );
    });

    it('should sanitize unknown nested object fields on tasks', () => {
      const file = createBaseFile();
      file.chart.tasks = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Task',
          startDate: '2026-01-01',
          endDate: '2026-01-02',
          duration: 1,
          progress: 0,
          color: '#000000',
          order: 0,
          futureObject: {
            nestedString: '<img onerror=alert(1) src=x>Clean',
          },
        },
      ];

      const sanitized = sanitizeGanttFile(file);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const futureObj = (sanitized.chart.tasks[0] as any).futureObject;
      expect(futureObj.nestedString).not.toContain('onerror');
      expect(futureObj.nestedString).toContain('Clean');
    });
  });

  describe('Non-String Values', () => {
    it('should not sanitize numbers', () => {
      const file = createBaseFile();
      file.chart.tasks = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Task',
          startDate: '2026-01-01',
          endDate: '2026-01-02',
          duration: 1,
          progress: 50,
          color: '#000000',
          order: 0,
        },
      ];

      const sanitized = sanitizeGanttFile(file);

      expect(sanitized.chart.tasks[0].progress).toBe(50);
      expect(typeof sanitized.chart.tasks[0].progress).toBe('number');
    });

    it('should not sanitize booleans', () => {
      const file = createBaseFile();
      file.chart.tasks = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Task',
          startDate: '2026-01-01',
          endDate: '2026-01-02',
          duration: 1,
          progress: 0,
          color: '#000000',
          order: 0,
          open: true,
        },
      ];

      const sanitized = sanitizeGanttFile(file);

      expect(sanitized.chart.tasks[0].open).toBe(true);
      expect(typeof sanitized.chart.tasks[0].open).toBe('boolean');
    });
  });
});
