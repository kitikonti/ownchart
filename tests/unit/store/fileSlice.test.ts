/**
 * Unit tests for fileSlice
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useFileStore } from '../../../src/store/slices/fileSlice';

describe('File Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useFileStore.getState().reset();
  });

  describe('Initial state', () => {
    it('should have correct initial state', () => {
      const state = useFileStore.getState();

      expect(state.fileName).toBeNull();
      expect(state.isDirty).toBe(false);
      expect(state.lastSaved).toBeNull();
      expect(state.chartId).toBeNull();
    });
  });

  describe('setFileName', () => {
    it('should set file name', () => {
      const { setFileName } = useFileStore.getState();

      setFileName('test.gantt');

      expect(useFileStore.getState().fileName).toBe('test.gantt');
    });

    it('should update file name', () => {
      const { setFileName } = useFileStore.getState();

      setFileName('first.gantt');
      setFileName('second.gantt');

      expect(useFileStore.getState().fileName).toBe('second.gantt');
    });

    it('should set file name to null', () => {
      const { setFileName } = useFileStore.getState();

      setFileName('test.gantt');
      setFileName(null);

      expect(useFileStore.getState().fileName).toBeNull();
    });
  });

  describe('setChartId', () => {
    it('should set chart ID', () => {
      const { setChartId } = useFileStore.getState();

      setChartId('chart-123');

      expect(useFileStore.getState().chartId).toBe('chart-123');
    });

    it('should update chart ID', () => {
      const { setChartId } = useFileStore.getState();

      setChartId('chart-123');
      setChartId('chart-456');

      expect(useFileStore.getState().chartId).toBe('chart-456');
    });

    it('should set chart ID to null', () => {
      const { setChartId } = useFileStore.getState();

      setChartId('chart-123');
      setChartId(null);

      expect(useFileStore.getState().chartId).toBeNull();
    });
  });

  describe('markDirty', () => {
    it('should mark file as dirty', () => {
      const { markDirty } = useFileStore.getState();

      markDirty();

      expect(useFileStore.getState().isDirty).toBe(true);
    });

    it('should stay dirty when called multiple times', () => {
      const { markDirty } = useFileStore.getState();

      markDirty();
      markDirty();
      markDirty();

      expect(useFileStore.getState().isDirty).toBe(true);
    });
  });

  describe('markClean', () => {
    it('should mark file as clean', () => {
      const { markDirty, markClean } = useFileStore.getState();

      markDirty();
      expect(useFileStore.getState().isDirty).toBe(true);

      markClean();
      expect(useFileStore.getState().isDirty).toBe(false);
    });

    it('should stay clean when called multiple times', () => {
      const { markClean } = useFileStore.getState();

      markClean();
      markClean();

      expect(useFileStore.getState().isDirty).toBe(false);
    });
  });

  describe('setLastSaved', () => {
    it('should set last saved timestamp', () => {
      const { setLastSaved } = useFileStore.getState();
      const now = new Date();

      setLastSaved(now);

      expect(useFileStore.getState().lastSaved).toBe(now);
    });

    it('should mark file as clean when setting last saved', () => {
      const { markDirty, setLastSaved } = useFileStore.getState();
      const now = new Date();

      markDirty();
      expect(useFileStore.getState().isDirty).toBe(true);

      setLastSaved(now);

      expect(useFileStore.getState().isDirty).toBe(false);
      expect(useFileStore.getState().lastSaved).toBe(now);
    });

    it('should update last saved timestamp', () => {
      const { setLastSaved } = useFileStore.getState();
      const first = new Date('2025-01-01');
      const second = new Date('2025-01-02');

      setLastSaved(first);
      setLastSaved(second);

      expect(useFileStore.getState().lastSaved).toBe(second);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const { setFileName, setChartId, markDirty, setLastSaved, reset } =
        useFileStore.getState();

      // Set all values
      setFileName('test.gantt');
      setChartId('chart-123');
      markDirty();
      setLastSaved(new Date());

      // Verify values are set
      expect(useFileStore.getState().fileName).toBe('test.gantt');
      expect(useFileStore.getState().chartId).toBe('chart-123');
      expect(useFileStore.getState().isDirty).toBe(false); // setLastSaved marks clean
      expect(useFileStore.getState().lastSaved).not.toBeNull();

      // Reset
      reset();

      // Verify reset
      const state = useFileStore.getState();
      expect(state.fileName).toBeNull();
      expect(state.chartId).toBeNull();
      expect(state.isDirty).toBe(false);
      expect(state.lastSaved).toBeNull();
    });

    it('should reset from dirty state', () => {
      const { markDirty, reset } = useFileStore.getState();

      markDirty();
      expect(useFileStore.getState().isDirty).toBe(true);

      reset();

      expect(useFileStore.getState().isDirty).toBe(false);
    });

    it('should be idempotent', () => {
      const { reset } = useFileStore.getState();

      reset();
      reset();
      reset();

      const state = useFileStore.getState();
      expect(state.fileName).toBeNull();
      expect(state.isDirty).toBe(false);
      expect(state.lastSaved).toBeNull();
      expect(state.chartId).toBeNull();
    });
  });

  describe('Complex workflows', () => {
    it('should handle save workflow', () => {
      const { setFileName, markDirty, setLastSaved } = useFileStore.getState();

      // User creates new file
      setFileName('project.gantt');
      expect(useFileStore.getState().fileName).toBe('project.gantt');
      expect(useFileStore.getState().isDirty).toBe(false);

      // User makes changes
      markDirty();
      expect(useFileStore.getState().isDirty).toBe(true);

      // User saves
      const saveTime = new Date();
      setLastSaved(saveTime);
      expect(useFileStore.getState().isDirty).toBe(false);
      expect(useFileStore.getState().lastSaved).toBe(saveTime);
    });

    it('should handle new file workflow', () => {
      const { setFileName, setChartId, markDirty, setLastSaved, reset } =
        useFileStore.getState();

      // User works on file
      setFileName('old.gantt');
      setChartId('old-id');
      markDirty();
      setLastSaved(new Date());

      // User creates new file
      reset();

      // Verify clean slate
      const state = useFileStore.getState();
      expect(state.fileName).toBeNull();
      expect(state.chartId).toBeNull();
      expect(state.isDirty).toBe(false);
      expect(state.lastSaved).toBeNull();
    });

    it('should handle open file workflow', () => {
      const { setFileName, setChartId, markClean, reset } = useFileStore.getState();

      // Clear any previous state
      reset();

      // Open file
      setFileName('opened.gantt');
      setChartId('opened-id');
      markClean();

      const state = useFileStore.getState();
      expect(state.fileName).toBe('opened.gantt');
      expect(state.chartId).toBe('opened-id');
      expect(state.isDirty).toBe(false);
    });

    it('should track multiple edits', () => {
      const { markDirty, markClean } = useFileStore.getState();

      markDirty();
      expect(useFileStore.getState().isDirty).toBe(true);

      markClean();
      expect(useFileStore.getState().isDirty).toBe(false);

      markDirty();
      expect(useFileStore.getState().isDirty).toBe(true);

      markDirty(); // Second edit without save
      expect(useFileStore.getState().isDirty).toBe(true);
    });

    it('should handle rename workflow', () => {
      const { setFileName, setChartId } = useFileStore.getState();

      setFileName('original.gantt');
      setChartId('original-id');

      setFileName('renamed.gantt');

      expect(useFileStore.getState().fileName).toBe('renamed.gantt');
      expect(useFileStore.getState().chartId).toBe('original-id'); // ID stays same
    });
  });
});
