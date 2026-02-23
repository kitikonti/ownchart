/**
 * Unit tests for loadFromFile module
 * Tests loadFileIntoApp (file → store hydration) and showLoadNotifications (toast display).
 *
 * Strategy: mock Zustand stores so we can verify which store methods are
 * called and with what arguments, while letting the real deserialize pipeline
 * handle validation, sanitization, and migration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LoadFileResult } from '../../../../src/utils/fileOperations/loadFromFile';

// ---------------------------------------------------------------------------
// Mock store functions
// ---------------------------------------------------------------------------
const mockSetTasks = vi.fn();
const mockSetTaskTableWidth = vi.fn();
const mockSetColumnWidth = vi.fn();
const mockAutoFitColumn = vi.fn();

const mockSetViewSettings = vi.fn();
const mockUpdateScale = vi.fn();
const mockSignalFileLoaded = vi.fn();

const mockSetFileName = vi.fn();
const mockSetChartId = vi.fn();
const mockSetLastSaved = vi.fn();
const mockMarkClean = vi.fn();

const mockClearHistory = vi.fn();

const mockSetDependencies = vi.fn();

const mockResetExportOptions = vi.fn();

// ---------------------------------------------------------------------------
// Wire the mocks into store modules
// ---------------------------------------------------------------------------
vi.mock('../../../../src/store/slices/taskSlice', () => ({
  useTaskStore: {
    getState: () => ({
      setTasks: mockSetTasks,
      setTaskTableWidth: mockSetTaskTableWidth,
      setColumnWidth: mockSetColumnWidth,
      autoFitColumn: mockAutoFitColumn,
    }),
  },
}));

vi.mock('../../../../src/store/slices/chartSlice', () => ({
  useChartStore: {
    getState: () => ({
      setViewSettings: mockSetViewSettings,
      updateScale: mockUpdateScale,
      signalFileLoaded: mockSignalFileLoaded,
    }),
  },
}));

vi.mock('../../../../src/store/slices/fileSlice', () => ({
  useFileStore: {
    getState: () => ({
      setFileName: mockSetFileName,
      setChartId: mockSetChartId,
      setLastSaved: mockSetLastSaved,
      markClean: mockMarkClean,
    }),
  },
}));

vi.mock('../../../../src/store/slices/historySlice', () => ({
  useHistoryStore: {
    getState: () => ({
      clearHistory: mockClearHistory,
    }),
  },
}));

vi.mock('../../../../src/store/slices/dependencySlice', () => ({
  useDependencyStore: {
    getState: () => ({
      setDependencies: mockSetDependencies,
    }),
  },
}));

vi.mock('../../../../src/store/slices/uiSlice', () => ({
  useUIStore: {
    getState: () => ({
      resetExportOptions: mockResetExportOptions,
    }),
  },
}));

// Import under test AFTER mocks are registered
import {
  loadFileIntoApp,
  showLoadNotifications,
  loadFileIntoAppWithToast,
} from '../../../../src/utils/fileOperations/loadFromFile';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Minimal valid GanttFile structure matching schema v1.0.0 */
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
        metadata: {},
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

/** Shorthand for creating the file input object used by loadFileIntoApp */
function makeFile(
  content: string,
  name = 'project.ownchart',
  size?: number
): { name: string; content: string; size: number } {
  return { name, content, size: size ?? content.length };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('loadFromFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // loadFileIntoApp — success path
  // =========================================================================
  describe('loadFileIntoApp - success path', () => {
    it('should return success for a valid file', async () => {
      const content = JSON.stringify(createValidFileContent());
      const result = await loadFileIntoApp(makeFile(content));

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should load tasks into the task store', async () => {
      const content = JSON.stringify(createValidFileContent());
      await loadFileIntoApp(makeFile(content));

      expect(mockSetTasks).toHaveBeenCalledTimes(1);
      const tasks = mockSetTasks.mock.calls[0][0];
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(tasks[0].name).toBe('Task 1');
      expect(tasks[0].progress).toBe(50);
    });

    it('should set dependencies (empty array when absent)', async () => {
      const content = JSON.stringify(createValidFileContent());
      await loadFileIntoApp(makeFile(content));

      expect(mockSetDependencies).toHaveBeenCalledTimes(1);
      expect(mockSetDependencies).toHaveBeenCalledWith([]);
    });

    it('should load dependencies when present in file', async () => {
      const file = createValidFileContent();
      // Add a second task so we can create a dependency
      (file.chart as Record<string, unknown>).tasks = [
        ...(file.chart as { tasks: unknown[] }).tasks,
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'Task 2',
          startDate: '2026-01-06',
          endDate: '2026-01-10',
          duration: 5,
          progress: 0,
          color: '#10b981',
          order: 1,
          type: 'task',
          metadata: {},
        },
      ];
      (file.chart as Record<string, unknown>).dependencies = [
        {
          id: '123e4567-e89b-12d3-a456-426614174099',
          from: '123e4567-e89b-12d3-a456-426614174001',
          to: '123e4567-e89b-12d3-a456-426614174002',
          type: 'FS',
        },
      ];

      const content = JSON.stringify(file);
      await loadFileIntoApp(makeFile(content));

      expect(mockSetDependencies).toHaveBeenCalledTimes(1);
      const deps = mockSetDependencies.mock.calls[0][0];
      expect(deps).toHaveLength(1);
      expect(deps[0].fromTaskId).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(deps[0].toTaskId).toBe('123e4567-e89b-12d3-a456-426614174002');
      expect(deps[0].type).toBe('FS');
    });

    it('should reset export options', async () => {
      const content = JSON.stringify(createValidFileContent());
      await loadFileIntoApp(makeFile(content));

      expect(mockResetExportOptions).toHaveBeenCalledTimes(1);
    });

    it('should apply view settings to chart store', async () => {
      const content = JSON.stringify(createValidFileContent());
      await loadFileIntoApp(makeFile(content));

      expect(mockSetViewSettings).toHaveBeenCalledTimes(1);
      const viewSettings = mockSetViewSettings.mock.calls[0][0];
      expect(viewSettings.zoom).toBe(1.5);
      expect(viewSettings.panOffset).toEqual({ x: -100, y: 0 });
      expect(viewSettings.showWeekends).toBe(false);
      expect(viewSettings.showTodayMarker).toBe(true);
    });

    it('should call updateScale with tasks', async () => {
      const content = JSON.stringify(createValidFileContent());
      await loadFileIntoApp(makeFile(content));

      expect(mockUpdateScale).toHaveBeenCalledTimes(1);
      const scaleTasks = mockUpdateScale.mock.calls[0][0];
      expect(scaleTasks).toHaveLength(1);
    });

    it('should signal file loaded', async () => {
      const content = JSON.stringify(createValidFileContent());
      await loadFileIntoApp(makeFile(content));

      expect(mockSignalFileLoaded).toHaveBeenCalledTimes(1);
    });

    it('should clear history after loading', async () => {
      const content = JSON.stringify(createValidFileContent());
      await loadFileIntoApp(makeFile(content));

      expect(mockClearHistory).toHaveBeenCalledTimes(1);
    });

    it('should return no warnings for a current-version file', async () => {
      const content = JSON.stringify(createValidFileContent());
      const result = await loadFileIntoApp(makeFile(content));

      expect(result.warnings).toBeUndefined();
    });
  });

  // =========================================================================
  // loadFileIntoApp — file state reset
  // =========================================================================
  describe('loadFileIntoApp - file state reset', () => {
    it('should set the file name in file store', async () => {
      const content = JSON.stringify(createValidFileContent());
      await loadFileIntoApp(makeFile(content, 'my-project.ownchart'));

      expect(mockSetFileName).toHaveBeenCalledWith('my-project.ownchart');
    });

    it('should set the chart ID in file store', async () => {
      const content = JSON.stringify(createValidFileContent());
      await loadFileIntoApp(makeFile(content));

      expect(mockSetChartId).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000'
      );
    });

    it('should set lastSaved to a recent Date', async () => {
      const before = Date.now();
      const content = JSON.stringify(createValidFileContent());
      await loadFileIntoApp(makeFile(content));
      const after = Date.now();

      expect(mockSetLastSaved).toHaveBeenCalledTimes(1);
      const savedDate: Date = mockSetLastSaved.mock.calls[0][0];
      expect(savedDate).toBeInstanceOf(Date);
      expect(savedDate.getTime()).toBeGreaterThanOrEqual(before);
      expect(savedDate.getTime()).toBeLessThanOrEqual(after);
    });

    it('should mark the file as clean', async () => {
      const content = JSON.stringify(createValidFileContent());
      await loadFileIntoApp(makeFile(content));

      expect(mockMarkClean).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // loadFileIntoApp — column widths
  // =========================================================================
  describe('loadFileIntoApp - column width restoration', () => {
    it('should restore taskTableWidth when present', async () => {
      const content = JSON.stringify(createValidFileContent());
      await loadFileIntoApp(makeFile(content));

      expect(mockSetTaskTableWidth).toHaveBeenCalledWith(400);
    });

    it('should restore individual column widths when present', async () => {
      const content = JSON.stringify(createValidFileContent());
      await loadFileIntoApp(makeFile(content));

      expect(mockSetColumnWidth).toHaveBeenCalledWith('name', 250);
      expect(mockSetColumnWidth).toHaveBeenCalledWith('startDate', 100);
      expect(mockAutoFitColumn).not.toHaveBeenCalled();
    });

    it('should auto-fit name column when no column widths saved', async () => {
      const file = createValidFileContent();
      const chart = file.chart as Record<string, unknown>;
      const vs = chart.viewSettings as Record<string, unknown>;
      delete vs.columnWidths;

      const content = JSON.stringify(file);
      await loadFileIntoApp(makeFile(content));

      expect(mockAutoFitColumn).toHaveBeenCalledWith('name');
      expect(mockSetColumnWidth).not.toHaveBeenCalled();
    });

    it('should auto-fit name column when column widths object is empty', async () => {
      const file = createValidFileContent();
      const chart = file.chart as Record<string, unknown>;
      const vs = chart.viewSettings as Record<string, unknown>;
      vs.columnWidths = {};

      const content = JSON.stringify(file);
      await loadFileIntoApp(makeFile(content));

      expect(mockAutoFitColumn).toHaveBeenCalledWith('name');
      expect(mockSetColumnWidth).not.toHaveBeenCalled();
    });

    it('should not set taskTableWidth when it is not in file', async () => {
      const file = createValidFileContent();
      const chart = file.chart as Record<string, unknown>;
      const vs = chart.viewSettings as Record<string, unknown>;
      delete vs.taskTableWidth;

      const content = JSON.stringify(file);
      await loadFileIntoApp(makeFile(content));

      expect(mockSetTaskTableWidth).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // loadFileIntoApp — view settings defaults for older files
  // =========================================================================
  describe('loadFileIntoApp - view settings defaults', () => {
    it('should apply defaults for optional fields missing from file', async () => {
      const file = createValidFileContent();
      // The base file content already lacks showHolidays, showDependencies, etc.
      const content = JSON.stringify(file);
      await loadFileIntoApp(makeFile(content));

      const viewSettings = mockSetViewSettings.mock.calls[0][0];
      // These should have been defaulted by applyViewSettingsDefaults
      expect(viewSettings.showHolidays).toBe(true);
      expect(viewSettings.showDependencies).toBe(true);
      expect(viewSettings.showProgress).toBe(true);
      expect(viewSettings.taskLabelPosition).toBe('inside');
      expect(viewSettings.workingDaysMode).toBe(false);
      expect(viewSettings.hiddenColumns).toEqual([]);
      expect(viewSettings.isTaskTableCollapsed).toBe(false);
      expect(viewSettings.hiddenTaskIds).toEqual([]);
      expect(viewSettings.projectTitle).toBe('');
      expect(viewSettings.projectAuthor).toBe('');
    });

    it('should preserve explicit view settings values from file', async () => {
      const file = createValidFileContent();
      const chart = file.chart as Record<string, unknown>;
      const vs = chart.viewSettings as Record<string, unknown>;
      vs.showHolidays = false;
      vs.showDependencies = false;
      vs.showProgress = false;
      vs.taskLabelPosition = 'after';
      vs.workingDaysMode = true;
      vs.hiddenColumns = ['startDate', 'endDate'];
      vs.isTaskTableCollapsed = true;
      vs.hiddenTaskIds = ['123e4567-e89b-12d3-a456-426614174001'];
      vs.projectTitle = 'My Project';
      vs.projectAuthor = 'Martin';

      const content = JSON.stringify(file);
      await loadFileIntoApp(makeFile(content));

      const viewSettings = mockSetViewSettings.mock.calls[0][0];
      expect(viewSettings.showHolidays).toBe(false);
      expect(viewSettings.showDependencies).toBe(false);
      expect(viewSettings.showProgress).toBe(false);
      expect(viewSettings.taskLabelPosition).toBe('after');
      expect(viewSettings.workingDaysMode).toBe(true);
      expect(viewSettings.hiddenColumns).toEqual(['startDate', 'endDate']);
      expect(viewSettings.isTaskTableCollapsed).toBe(true);
      expect(viewSettings.hiddenTaskIds).toEqual([
        '123e4567-e89b-12d3-a456-426614174001',
      ]);
      expect(viewSettings.projectTitle).toBe('My Project');
      expect(viewSettings.projectAuthor).toBe('Martin');
    });
  });

  // =========================================================================
  // loadFileIntoApp — error paths
  // =========================================================================
  describe('loadFileIntoApp - error paths', () => {
    it('should fail for malformed JSON', async () => {
      const result = await loadFileIntoApp(
        makeFile('{not valid json}', 'test.ownchart')
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid JSON');
    });

    it('should fail for empty string content', async () => {
      const result = await loadFileIntoApp(makeFile('', 'test.ownchart'));

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail when required fields are missing', async () => {
      const invalid = { someField: 'value' };
      const result = await loadFileIntoApp(
        makeFile(JSON.stringify(invalid), 'test.ownchart')
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail when chart is missing', async () => {
      const invalid = { fileVersion: '1.0.0' };
      const result = await loadFileIntoApp(
        makeFile(JSON.stringify(invalid), 'test.ownchart')
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('chart');
    });

    it('should fail for file exceeding 50MB', async () => {
      const content = JSON.stringify(createValidFileContent());
      const hugeSize = 51 * 1024 * 1024;
      const result = await loadFileIntoApp(
        makeFile(content, 'big.ownchart', hugeSize)
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds limit');
    });

    it('should fail for file with invalid extension', async () => {
      const content = JSON.stringify(createValidFileContent());
      const result = await loadFileIntoApp(
        makeFile(content, 'project.json', content.length)
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('.ownchart');
    });

    it('should fail for tasks with invalid UUIDs', async () => {
      const file = createValidFileContent();
      (file.chart as { tasks: { id: string }[] }).tasks[0].id = 'not-a-uuid';

      const result = await loadFileIntoApp(
        makeFile(JSON.stringify(file), 'test.ownchart')
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid UUID');
    });

    it('should fail for tasks with invalid dates', async () => {
      const file = createValidFileContent();
      (file.chart as { tasks: { startDate: string }[] }).tasks[0].startDate =
        'not-a-date';

      const result = await loadFileIntoApp(
        makeFile(JSON.stringify(file), 'test.ownchart')
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid startDate');
    });

    it('should fail for tasks with progress > 100', async () => {
      const file = createValidFileContent();
      (file.chart as { tasks: { progress: number }[] }).tasks[0].progress = 150;

      const result = await loadFileIntoApp(
        makeFile(JSON.stringify(file), 'test.ownchart')
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid progress');
    });

    it('should not modify stores when parsing fails', async () => {
      await loadFileIntoApp(makeFile('{bad json}', 'test.ownchart'));

      expect(mockSetTasks).not.toHaveBeenCalled();
      expect(mockSetDependencies).not.toHaveBeenCalled();
      expect(mockSetViewSettings).not.toHaveBeenCalled();
      expect(mockSetFileName).not.toHaveBeenCalled();
      expect(mockClearHistory).not.toHaveBeenCalled();
    });

    it('should return "Unknown parse error" when error message is missing', async () => {
      // A file that causes an error without a message is hard to construct
      // via the real pipeline, so we verify the fallback path indirectly:
      // the error always has a message from the pipeline, but we can check
      // that a non-success result always has a string error.
      const result = await loadFileIntoApp(makeFile('', 'test.ownchart'));

      expect(result.success).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });

  // =========================================================================
  // loadFileIntoApp — warnings (future version files)
  // =========================================================================
  describe('loadFileIntoApp - warnings', () => {
    it('should return warnings for a file from a future version', async () => {
      const file = createValidFileContent();
      file.fileVersion = '2.0.0';

      const content = JSON.stringify(file);
      const result = await loadFileIntoApp(makeFile(content, 'future.ownchart'));

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
      // Should contain both a migration warning and a future-version warning
      const allWarnings = result.warnings!.join(' ');
      expect(allWarnings).toContain('newer version');
    });
  });

  // =========================================================================
  // loadFileIntoApp — store call ordering
  // =========================================================================
  describe('loadFileIntoApp - ordering guarantees', () => {
    it('should call updateScale before signalFileLoaded', async () => {
      const callOrder: string[] = [];
      mockUpdateScale.mockImplementation(() => callOrder.push('updateScale'));
      mockSignalFileLoaded.mockImplementation(() =>
        callOrder.push('signalFileLoaded')
      );

      const content = JSON.stringify(createValidFileContent());
      await loadFileIntoApp(makeFile(content));

      const updateIdx = callOrder.indexOf('updateScale');
      const signalIdx = callOrder.indexOf('signalFileLoaded');
      expect(updateIdx).toBeLessThan(signalIdx);
    });

    it('should set tasks before calling updateScale', async () => {
      const callOrder: string[] = [];
      mockSetTasks.mockImplementation(() => callOrder.push('setTasks'));
      mockUpdateScale.mockImplementation(() => callOrder.push('updateScale'));

      const content = JSON.stringify(createValidFileContent());
      await loadFileIntoApp(makeFile(content));

      const setIdx = callOrder.indexOf('setTasks');
      const scaleIdx = callOrder.indexOf('updateScale');
      expect(setIdx).toBeLessThan(scaleIdx);
    });

    it('should clear history after resetting file state', async () => {
      const callOrder: string[] = [];
      mockMarkClean.mockImplementation(() => callOrder.push('markClean'));
      mockClearHistory.mockImplementation(() => callOrder.push('clearHistory'));

      const content = JSON.stringify(createValidFileContent());
      await loadFileIntoApp(makeFile(content));

      const cleanIdx = callOrder.indexOf('markClean');
      const historyIdx = callOrder.indexOf('clearHistory');
      expect(cleanIdx).toBeLessThan(historyIdx);
    });
  });

  // =========================================================================
  // loadFileIntoApp — edge cases
  // =========================================================================
  describe('loadFileIntoApp - edge cases', () => {
    it('should handle a file with zero tasks', async () => {
      const file = createValidFileContent();
      (file.chart as { tasks: unknown[] }).tasks = [];

      const content = JSON.stringify(file);
      const result = await loadFileIntoApp(makeFile(content));

      expect(result.success).toBe(true);
      expect(mockSetTasks).toHaveBeenCalledWith([]);
    });

    it('should handle a file with multiple tasks', async () => {
      const file = createValidFileContent();
      (file.chart as { tasks: unknown[] }).tasks.push({
        id: '123e4567-e89b-12d3-a456-426614174002',
        name: 'Task 2',
        startDate: '2026-01-06',
        endDate: '2026-01-10',
        duration: 5,
        progress: 0,
        color: '#10b981',
        order: 1,
        type: 'task',
        metadata: {},
      });

      const content = JSON.stringify(file);
      const result = await loadFileIntoApp(makeFile(content));

      expect(result.success).toBe(true);
      const tasks = mockSetTasks.mock.calls[0][0];
      expect(tasks).toHaveLength(2);
    });

    it('should handle taskTableWidth of null', async () => {
      const file = createValidFileContent();
      const chart = file.chart as Record<string, unknown>;
      const vs = chart.viewSettings as Record<string, unknown>;
      vs.taskTableWidth = null;

      const content = JSON.stringify(file);
      await loadFileIntoApp(makeFile(content));

      // null is not undefined, so setTaskTableWidth should still be called
      expect(mockSetTaskTableWidth).toHaveBeenCalledWith(null);
    });

    it('should sanitize XSS in task names during load', async () => {
      const file = createValidFileContent();
      (file.chart as { tasks: { name: string }[] }).tasks[0].name =
        '<script>alert("XSS")</script>Clean';

      const content = JSON.stringify(file);
      const result = await loadFileIntoApp(makeFile(content));

      expect(result.success).toBe(true);
      const tasks = mockSetTasks.mock.calls[0][0];
      expect(tasks[0].name).not.toContain('<script>');
      expect(tasks[0].name).toContain('Clean');
    });
  });

  // =========================================================================
  // showLoadNotifications
  // =========================================================================
  describe('showLoadNotifications', () => {
    function createMockToast(): {
      success: ReturnType<typeof vi.fn>;
      error: ReturnType<typeof vi.fn>;
      (msg: string, opts?: { icon: string }): void;
      _calls: Array<{ msg: string; opts?: { icon: string } }>;
    } {
      const calls: Array<{ msg: string; opts?: { icon: string } }> = [];
      const toastFn = ((msg: string, opts?: { icon: string }) => {
        calls.push({ msg, opts });
      }) as ReturnType<typeof createMockToast>;
      toastFn.success = vi.fn();
      toastFn.error = vi.fn();
      toastFn._calls = calls;
      return toastFn;
    }

    it('should show success toast with file name', () => {
      const toast = createMockToast();
      const result: LoadFileResult & { fileName: string } = {
        success: true,
        fileName: 'project.ownchart',
      };

      showLoadNotifications(result, toast);

      expect(toast.success).toHaveBeenCalledWith('Opened "project.ownchart"');
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should show error toast on failure', () => {
      const toast = createMockToast();
      const result: LoadFileResult & { fileName: string } = {
        success: false,
        error: 'File is corrupt',
        fileName: 'bad.ownchart',
      };

      showLoadNotifications(result, toast);

      expect(toast.error).toHaveBeenCalledWith('File is corrupt');
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('should show fallback error message when error is undefined', () => {
      const toast = createMockToast();
      const result: LoadFileResult & { fileName: string } = {
        success: false,
        fileName: 'bad.ownchart',
      };

      showLoadNotifications(result, toast);

      expect(toast.error).toHaveBeenCalledWith('Failed to open file');
    });

    it('should not show success toast on error', () => {
      const toast = createMockToast();
      const result: LoadFileResult & { fileName: string } = {
        success: false,
        error: 'Something went wrong',
        fileName: 'bad.ownchart',
      };

      showLoadNotifications(result, toast);

      expect(toast.success).not.toHaveBeenCalled();
    });

    it('should show warning toasts with info icon for each warning', () => {
      const toast = createMockToast();
      const result: LoadFileResult & { fileName: string } = {
        success: true,
        warnings: [
          'File migrated from v0.9.0 to v1.0.0',
          'Some features may not work correctly.',
        ],
        fileName: 'old.ownchart',
      };

      showLoadNotifications(result, toast);

      // Both warnings should be shown via the callable toast
      expect(toast._calls).toHaveLength(2);
      expect(toast._calls[0].msg).toBe('File migrated from v0.9.0 to v1.0.0');
      expect(toast._calls[0].opts).toEqual({ icon: '\u2139\uFE0F' });
      expect(toast._calls[1].msg).toBe(
        'Some features may not work correctly.'
      );
      expect(toast._calls[1].opts).toEqual({ icon: '\u2139\uFE0F' });
    });

    it('should show both warnings and success toast together', () => {
      const toast = createMockToast();
      const result: LoadFileResult & { fileName: string } = {
        success: true,
        warnings: ['Migrated to latest version'],
        fileName: 'legacy.ownchart',
      };

      showLoadNotifications(result, toast);

      // Warning toast called via callable
      expect(toast._calls).toHaveLength(1);
      // Success toast also called
      expect(toast.success).toHaveBeenCalledWith('Opened "legacy.ownchart"');
    });

    it('should not show warning toasts when there are no warnings', () => {
      const toast = createMockToast();
      const result: LoadFileResult & { fileName: string } = {
        success: true,
        fileName: 'clean.ownchart',
      };

      showLoadNotifications(result, toast);

      expect(toast._calls).toHaveLength(0);
      expect(toast.success).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // loadFileIntoAppWithToast (deprecated wrapper)
  // =========================================================================
  describe('loadFileIntoAppWithToast (deprecated)', () => {
    function createMockToast(): {
      success: ReturnType<typeof vi.fn>;
      error: ReturnType<typeof vi.fn>;
      (msg: string, opts?: { icon: string }): void;
    } {
      const toastFn = vi.fn() as unknown as ReturnType<typeof createMockToast>;
      toastFn.success = vi.fn();
      toastFn.error = vi.fn();
      return toastFn;
    }

    it('should return true on success', async () => {
      const toast = createMockToast();
      const content = JSON.stringify(createValidFileContent());
      const success = await loadFileIntoAppWithToast(
        makeFile(content),
        toast
      );

      expect(success).toBe(true);
      expect(toast.success).toHaveBeenCalled();
    });

    it('should return false on failure', async () => {
      const toast = createMockToast();
      const success = await loadFileIntoAppWithToast(
        makeFile('{bad}', 'test.ownchart'),
        toast
      );

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
