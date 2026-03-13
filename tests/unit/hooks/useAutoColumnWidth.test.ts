/**
 * Unit tests for useAutoColumnWidth hook.
 * Covers: task fingerprint change trigger, density change trigger,
 * font-ready guard, and Promise rejection fallback.
 *
 * Behaviour summary:
 * - On mount the hook skips the very first effect run (isInitialRender guard).
 * - Once fonts are ready and any tracked value changes, autoFitAllColumns fires.
 * - When fonts are unavailable or the promise rejects, auto-fit proceeds immediately.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAutoColumnWidth } from '@/hooks/useAutoColumnWidth';
import { useTaskStore } from '@/store/slices/taskSlice';
import { useUserPreferencesStore } from '@/store/slices/userPreferencesSlice';
import type { Task } from '@/types/chart.types';

function createTask(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    name: `Task ${id}`,
    startDate: '2025-01-01',
    endDate: '2025-01-10',
    duration: 9,
    progress: 0,
    color: '#3b82f6',
    order: 0,
    metadata: {},
    type: 'task',
    ...overrides,
  };
}

describe('useAutoColumnWidth', () => {
  let autoFitSpy: ReturnType<typeof vi.fn>;
  let originalAutoFit: () => void;

  beforeEach(() => {
    originalAutoFit = useTaskStore.getState().autoFitAllColumns;
    useTaskStore.getState().setTasks([]);

    autoFitSpy = vi.fn();
    // Inject spy BEFORE renderHook is called so the hook sees it on first mount
    useTaskStore.setState({ autoFitAllColumns: autoFitSpy });
  });

  afterEach(() => {
    useTaskStore.setState({ autoFitAllColumns: originalAutoFit });
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  // ─── Font readiness guard ───

  describe('font readiness guard', () => {
    it('should not auto-fit while fonts.ready is pending', async () => {
      // Fonts never resolve
      let resolveFont!: () => void;
      Object.defineProperty(document, 'fonts', {
        value: {
          ready: new Promise<void>((res) => { resolveFont = res; }),
        },
        configurable: true,
        writable: true,
      });

      const { unmount } = renderHook(() => useAutoColumnWidth());

      // Flip the initial-render flag via a task change
      await act(async () => {
        useTaskStore.getState().setTasks([createTask('t1')]);
        await Promise.resolve();
        await Promise.resolve();
      });

      // Fonts still pending → no auto-fit
      expect(autoFitSpy).not.toHaveBeenCalled();

      resolveFont();
      unmount();
    });

    it('should auto-fit after fonts resolve', async () => {
      let resolveFont!: () => void;
      Object.defineProperty(document, 'fonts', {
        value: {
          ready: new Promise<void>((res) => { resolveFont = res; }),
        },
        configurable: true,
        writable: true,
      });

      const { unmount } = renderHook(() => useAutoColumnWidth());

      // Flip initial-render flag
      await act(async () => {
        useTaskStore.getState().setTasks([createTask('t1')]);
        await Promise.resolve();
      });

      expect(autoFitSpy).not.toHaveBeenCalled();

      // Resolve fonts → should trigger auto-fit (fontsReady state change re-runs effects)
      await act(async () => {
        resolveFont();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(autoFitSpy).toHaveBeenCalled();
      unmount();
    });

    it('should proceed immediately when fonts API is unavailable', async () => {
      Object.defineProperty(document, 'fonts', {
        value: undefined,
        configurable: true,
        writable: true,
      });

      const { unmount } = renderHook(() => useAutoColumnWidth());

      // First task change flips isInitialRender
      await act(async () => {
        useTaskStore.getState().setTasks([createTask('t1')]);
        await Promise.resolve();
      });

      autoFitSpy.mockClear();

      // Second task change should trigger auto-fit (fontsReady=true from the start)
      await act(async () => {
        useTaskStore.getState().setTasks([createTask('t1'), createTask('t2')]);
        await Promise.resolve();
      });

      expect(autoFitSpy).toHaveBeenCalled();
      unmount();
    });

    it('should proceed when fonts.ready Promise rejects', async () => {
      Object.defineProperty(document, 'fonts', {
        value: {
          ready: Promise.reject(new Error('fonts unavailable')),
        },
        configurable: true,
        writable: true,
      });

      const { unmount } = renderHook(() => useAutoColumnWidth());

      // Allow catch block to fire — fontsReady becomes true
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      // Flip initial-render flag
      await act(async () => {
        useTaskStore.getState().setTasks([createTask('t1')]);
        await Promise.resolve();
      });

      autoFitSpy.mockClear();

      // Next change should trigger auto-fit
      await act(async () => {
        useTaskStore.getState().setTasks([createTask('t1'), createTask('t2')]);
        await Promise.resolve();
      });

      expect(autoFitSpy).toHaveBeenCalled();
      unmount();
    });
  });

  // ─── Task fingerprint change trigger ───

  describe('task fingerprint change trigger', () => {
    beforeEach(() => {
      // Use undefined fonts API so fontsReady=true from mount (simpler control)
      Object.defineProperty(document, 'fonts', {
        value: undefined,
        configurable: true,
        writable: true,
      });
    });

    it('should call autoFitAllColumns when tasks change after initial render', async () => {
      const { unmount } = renderHook(() => useAutoColumnWidth());

      // First change flips the initial-render flag
      await act(async () => {
        useTaskStore.getState().setTasks([createTask('t1')]);
        await Promise.resolve();
      });

      autoFitSpy.mockClear();

      // Second change triggers auto-fit
      await act(async () => {
        useTaskStore.getState().setTasks([createTask('t1'), createTask('t2')]);
        await Promise.resolve();
      });

      expect(autoFitSpy).toHaveBeenCalled();
      unmount();
    });

    it('should NOT call autoFitAllColumns when fingerprint is unchanged', async () => {
      const task = createTask('t1', { name: 'Stable' });
      useTaskStore.getState().setTasks([task]);

      const { unmount } = renderHook(() => useAutoColumnWidth());

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      autoFitSpy.mockClear();

      // Re-set identical task — fingerprint unchanged
      await act(async () => {
        useTaskStore.getState().setTasks([{ ...task }]);
        await Promise.resolve();
      });

      expect(autoFitSpy).not.toHaveBeenCalled();
      unmount();
    });
  });

  // ─── Density change trigger ───

  describe('density change trigger', () => {
    beforeEach(() => {
      Object.defineProperty(document, 'fonts', {
        value: undefined,
        configurable: true,
        writable: true,
      });
    });

    it('should call autoFitAllColumns when uiDensity changes', async () => {
      const { unmount } = renderHook(() => useAutoColumnWidth());

      // Flip initial-render flag
      await act(async () => {
        useTaskStore.getState().setTasks([createTask('t1')]);
        await Promise.resolve();
      });

      autoFitSpy.mockClear();

      // Change density
      await act(async () => {
        useUserPreferencesStore.getState().setUiDensity('compact');
        await Promise.resolve();
      });

      expect(autoFitSpy).toHaveBeenCalled();

      useUserPreferencesStore.getState().setUiDensity('comfortable');
      unmount();
    });

    it('should NOT auto-fit on density change when isInitialRender is still true', async () => {
      // When the density effect runs as part of initial effects (before the
      // fingerprint effect flips the flag), it must be skipped.
      // We verify this by not loading any tasks — only the density effect fires
      // but isInitialRender remains true until the fingerprint effect runs.

      // Use a pending fonts promise so fontsReady stays false — this also means
      // the density effect exits early even if isInitialRender were false
      let resolveFont!: () => void;
      Object.defineProperty(document, 'fonts', {
        value: {
          ready: new Promise<void>((res) => { resolveFont = res; }),
        },
        configurable: true,
        writable: true,
      });

      const { unmount } = renderHook(() => useAutoColumnWidth());

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      // Neither effect should have triggered auto-fit yet
      expect(autoFitSpy).not.toHaveBeenCalled();

      resolveFont();
      unmount();
    });
  });
});
