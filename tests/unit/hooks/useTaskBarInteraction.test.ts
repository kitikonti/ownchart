/**
 * Unit tests for useTaskBarInteraction hook.
 * Follows useProgressDrag.test.ts patterns: renderHook + document events + RAF.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaskBarInteraction } from '../../../src/hooks/useTaskBarInteraction';
import { useTaskStore } from '../../../src/store/slices/taskSlice';
import { useChartStore } from '../../../src/store/slices/chartSlice';
import type { Task } from '../../../src/types/chart.types';
import type { TimelineScale, TaskBarGeometry } from '../../../src/utils/timelineUtils';
import { toTaskId, toHexColor } from '../../../src/types/branded.types';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('../../../src/utils/svgUtils', () => ({
  getSVGPoint: vi.fn(() => ({ x: 200, y: 50 })),
}));

vi.mock('../../../src/utils/hierarchy', () => ({
  getEffectiveTasksToMove: vi.fn(
    (_tasks: Task[], ids: string[]) => ids,
  ),
}));

// dragValidation is not imported by the hook directly, but is used inside
// taskBarDragHelpers (buildMoveUpdates / buildResizeUpdate). The mock is
// required so those helpers don't reject tasks during drag/resize tests.
vi.mock('../../../src/utils/dragValidation', () => ({
  validateDragOperation: vi.fn(() => ({ valid: true })),
}));

vi.mock('../../../src/utils/workingDaysCalculator', () => ({
  calculateWorkingDays: vi.fn(() => 5),
  addWorkingDays: vi.fn((start: string) => start),
}));

import { getSVGPoint } from '../../../src/utils/svgUtils';
import { getEffectiveTasksToMove } from '../../../src/utils/hierarchy';
import { calculateWorkingDays, addWorkingDays } from '../../../src/utils/workingDaysCalculator';

const mockGetSVGPoint = vi.mocked(getSVGPoint);
const mockGetEffective = vi.mocked(getEffectiveTasksToMove);
const mockCalculateWorkingDays = vi.mocked(calculateWorkingDays);
const mockAddWorkingDays = vi.mocked(addWorkingDays);

// ─── Helpers ───────────────────────────────────────────────────────────

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: toTaskId('task-1'),
    name: 'Test Task',
    startDate: '2025-01-10',
    endDate: '2025-01-20',
    duration: 11,
    progress: 50,
    color: toHexColor('#4A90D9'),
    order: 0,
    metadata: {},
    type: 'task',
    ...overrides,
  };
}

function createScale(overrides: Partial<TimelineScale> = {}): TimelineScale {
  return {
    minDate: '2025-01-01',
    maxDate: '2025-03-01',
    pixelsPerDay: 25,
    totalWidth: 1500,
    totalDays: 60,
    zoom: 1.0,
    scales: [],
    ...overrides,
  };
}

function createGeometry(overrides: Partial<TaskBarGeometry> = {}): TaskBarGeometry {
  return {
    x: 100,
    y: 40,
    width: 200,
    height: 26,
    ...overrides,
  };
}

function createMockSVGEvent(
  clientX = 200,
  overrides: Record<string, unknown> = {},
): React.MouseEvent<SVGGElement> {
  const mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  return {
    clientX,
    clientY: 50,
    currentTarget: { ownerSVGElement: mockSvg } as unknown as SVGGElement,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  } as unknown as React.MouseEvent<SVGGElement>;
}

// ─── Setup ─────────────────────────────────────────────────────────────

let updateTaskSpy: ReturnType<typeof vi.fn>;
let updateMultipleTasksSpy: ReturnType<typeof vi.fn>;
let setDragStateSpy: ReturnType<typeof vi.fn>;
let clearDragStateSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  updateTaskSpy = vi.fn();
  updateMultipleTasksSpy = vi.fn();
  setDragStateSpy = vi.fn();
  clearDragStateSpy = vi.fn();

  vi.spyOn(useTaskStore.getState(), 'updateTask').mockImplementation(updateTaskSpy);
  vi.spyOn(useTaskStore.getState(), 'updateMultipleTasks').mockImplementation(updateMultipleTasksSpy);
  vi.spyOn(useChartStore.getState(), 'setDragState').mockImplementation(setDragStateSpy);
  vi.spyOn(useChartStore.getState(), 'clearDragState').mockImplementation(clearDragStateSpy);

  // Default chart store state
  const chartState = useChartStore.getState();
  if (!('workingDaysMode' in chartState)) {
    Object.defineProperty(chartState, 'workingDaysMode', { value: false, writable: true, configurable: true });
  }

  mockGetSVGPoint.mockReturnValue({ x: 200, y: 50 });
  mockGetEffective.mockImplementation((_tasks, ids) => ids);
  mockCalculateWorkingDays.mockReturnValue(5);
  mockAddWorkingDays.mockImplementation((start: string) => start);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('useTaskBarInteraction', () => {
  describe('initial state', () => {
    it('returns idle mode with no preview', () => {
      const { result } = renderHook(() =>
        useTaskBarInteraction(createTask(), createScale(), createGeometry()),
      );

      expect(result.current.mode).toBe('idle');
      expect(result.current.previewGeometry).toBeNull();
      expect(result.current.isDragging).toBe(false);
      expect(result.current.cursor).toBe('pointer');
    });
  });

  describe('cursor feedback on hover', () => {
    it('shows grab cursor for summary tasks', () => {
      const task = createTask({ type: 'summary' });
      const { result } = renderHook(() =>
        useTaskBarInteraction(task, createScale(), createGeometry()),
      );

      act(() => {
        result.current.onMouseMove(createMockSVGEvent());
      });

      expect(result.current.cursor).toBe('grab');
    });

    it('shows grab cursor for milestones', () => {
      const task = createTask({ type: 'milestone' });
      const { result } = renderHook(() =>
        useTaskBarInteraction(task, createScale(), createGeometry()),
      );

      act(() => {
        result.current.onMouseMove(createMockSVGEvent());
      });

      expect(result.current.cursor).toBe('grab');
    });

    it('shows grab cursor for center zone of regular task', () => {
      // x=200, geometry x=100, width=200 → relativeX=100 → center
      mockGetSVGPoint.mockReturnValue({ x: 200, y: 50 });

      const { result } = renderHook(() =>
        useTaskBarInteraction(createTask(), createScale(), createGeometry()),
      );

      act(() => {
        result.current.onMouseMove(createMockSVGEvent());
      });

      expect(result.current.cursor).toBe('grab');
    });

    it('shows ew-resize cursor for edge zone of regular task', () => {
      // x=102, geometry x=100 → relativeX=2 → left-edge (< EDGE_THRESHOLD=8)
      mockGetSVGPoint.mockReturnValue({ x: 102, y: 50 });

      const { result } = renderHook(() =>
        useTaskBarInteraction(createTask(), createScale(), createGeometry()),
      );

      act(() => {
        result.current.onMouseMove(createMockSVGEvent());
      });

      expect(result.current.cursor).toBe('ew-resize');
    });

    it('shows ew-resize cursor during active resize even without prior hover', () => {
      // Mousedown directly on edge without a preceding mousemove — cursor state
      // would be the initial "pointer" if mousedown didn't explicitly set it.
      mockGetSVGPoint.mockReturnValue({ x: 102, y: 50 }); // left edge

      const { result } = renderHook(() =>
        useTaskBarInteraction(createTask(), createScale(), createGeometry()),
      );

      act(() => {
        result.current.onMouseDown(createMockSVGEvent());
      });

      expect(result.current.mode).toBe('resizing-left');
      expect(result.current.cursor).toBe('ew-resize');
    });
  });

  describe('mousedown starts drag', () => {
    it('starts dragging mode for center zone', () => {
      mockGetSVGPoint.mockReturnValue({ x: 200, y: 50 });

      const { result } = renderHook(() =>
        useTaskBarInteraction(createTask(), createScale(), createGeometry()),
      );

      act(() => {
        result.current.onMouseDown(createMockSVGEvent());
      });

      expect(result.current.mode).toBe('dragging');
      expect(result.current.isDragging).toBe(true);
      expect(result.current.cursor).toBe('grabbing');
    });

    it('starts resizing-left for left-edge zone', () => {
      mockGetSVGPoint.mockReturnValue({ x: 102, y: 50 });

      const { result } = renderHook(() =>
        useTaskBarInteraction(createTask(), createScale(), createGeometry()),
      );

      act(() => {
        result.current.onMouseDown(createMockSVGEvent());
      });

      expect(result.current.mode).toBe('resizing-left');
      expect(result.current.isDragging).toBe(true);
    });

    it('starts resizing-right for right-edge zone', () => {
      // geometry x=100, width=200 → right edge at 300
      mockGetSVGPoint.mockReturnValue({ x: 298, y: 50 });

      const { result } = renderHook(() =>
        useTaskBarInteraction(createTask(), createScale(), createGeometry()),
      );

      act(() => {
        result.current.onMouseDown(createMockSVGEvent());
      });

      expect(result.current.mode).toBe('resizing-right');
    });

    it('forces drag mode for summary regardless of zone', () => {
      mockGetSVGPoint.mockReturnValue({ x: 102, y: 50 });
      const task = createTask({ type: 'summary' });

      const { result } = renderHook(() =>
        useTaskBarInteraction(task, createScale(), createGeometry()),
      );

      act(() => {
        result.current.onMouseDown(createMockSVGEvent());
      });

      expect(result.current.mode).toBe('dragging');
    });

    it('prevents default and stops propagation', () => {
      const event = createMockSVGEvent();
      const { result } = renderHook(() =>
        useTaskBarInteraction(createTask(), createScale(), createGeometry()),
      );

      act(() => {
        result.current.onMouseDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('does nothing when SVG element is missing', () => {
      const event = {
        clientX: 200,
        clientY: 50,
        currentTarget: { ownerSVGElement: null } as unknown as SVGGElement,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent<SVGGElement>;

      const { result } = renderHook(() =>
        useTaskBarInteraction(createTask(), createScale(), createGeometry()),
      );

      act(() => {
        result.current.onMouseDown(event);
      });

      expect(result.current.mode).toBe('idle');
    });
  });

  describe('mousemove updates preview', () => {
    it('updates preview geometry during drag', async () => {
      mockGetSVGPoint.mockReturnValue({ x: 200, y: 50 });
      const task = createTask();
      const scale = createScale({ pixelsPerDay: 25 });

      const { result } = renderHook(() =>
        useTaskBarInteraction(task, scale, createGeometry()),
      );

      // Start drag
      act(() => {
        result.current.onMouseDown(createMockSVGEvent(200));
      });

      // Move 75px right → 3 days (75/25 = 3)
      await act(async () => {
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 275 }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });

      expect(result.current.previewGeometry).not.toBeNull();
      expect(result.current.previewGeometry?.startDate).toBe('2025-01-13');
    });

    it('updates shared drag state during drag', async () => {
      mockGetSVGPoint.mockReturnValue({ x: 200, y: 50 });
      const task = createTask();
      const scale = createScale({ pixelsPerDay: 25 });

      const { result } = renderHook(() =>
        useTaskBarInteraction(task, scale, createGeometry()),
      );

      act(() => {
        result.current.onMouseDown(createMockSVGEvent(200));
      });

      await act(async () => {
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 275 }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });

      expect(setDragStateSpy).toHaveBeenCalledWith(3, task.id);
    });

    it('updates preview for resize-right', async () => {
      // Position at right edge
      mockGetSVGPoint.mockReturnValue({ x: 298, y: 50 });
      const task = createTask();
      const scale = createScale({ pixelsPerDay: 25 });

      const { result } = renderHook(() =>
        useTaskBarInteraction(task, scale, createGeometry()),
      );

      act(() => {
        result.current.onMouseDown(createMockSVGEvent(298));
      });

      // Move 50px right → 2 days
      await act(async () => {
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 348 }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });

      expect(result.current.previewGeometry).not.toBeNull();
      // Start should remain original, end should shift
      expect(result.current.previewGeometry?.startDate).toBe('2025-01-10');
      expect(result.current.previewGeometry?.endDate).toBe('2025-01-22');
    });

    it('updates preview for resize-left', async () => {
      // Position at left edge
      mockGetSVGPoint.mockReturnValue({ x: 102, y: 50 });
      const task = createTask();
      const scale = createScale({ pixelsPerDay: 25 });

      const { result } = renderHook(() =>
        useTaskBarInteraction(task, scale, createGeometry()),
      );

      act(() => {
        result.current.onMouseDown(createMockSVGEvent(102));
      });

      // Move 50px left → -2 days (52 - 102 = -50, -50/25 = -2)
      await act(async () => {
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 52 }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });

      expect(result.current.previewGeometry).not.toBeNull();
      // Start shifts left, end stays original
      expect(result.current.previewGeometry?.startDate).toBe('2025-01-08');
      expect(result.current.previewGeometry?.endDate).toBe('2025-01-20');
    });

    it('does not update preview for invalid resize (duration < 1 day)', async () => {
      // Position at left edge for resize-left
      mockGetSVGPoint.mockReturnValue({ x: 102, y: 50 });
      // Short task: Jan 10 to Jan 11 (2-day duration)
      const task = createTask({
        startDate: '2025-01-10',
        endDate: '2025-01-11',
        duration: 2,
      });
      const scale = createScale({ pixelsPerDay: 25 });

      const { result } = renderHook(() =>
        useTaskBarInteraction(task, scale, createGeometry()),
      );

      act(() => {
        result.current.onMouseDown(createMockSVGEvent(102));
      });

      // Move 75px right → +3 days → newStart Jan 13, past endDate Jan 11 → invalid
      await act(async () => {
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 177 }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });

      // Preview should still show original dates (computeResizePreview returned null)
      expect(result.current.previewGeometry?.startDate).toBe('2025-01-10');
      expect(result.current.previewGeometry?.endDate).toBe('2025-01-11');
    });
  });

  describe('mouseup commits changes', () => {
    it('calls updateMultipleTasks for drag commit', async () => {
      mockGetSVGPoint.mockReturnValue({ x: 200, y: 50 });
      const task = createTask();
      const scale = createScale({ pixelsPerDay: 25 });

      // Set up store state with the task
      const originalGetState = useTaskStore.getState;
      vi.spyOn(useTaskStore, 'getState').mockReturnValue({
        ...originalGetState(),
        tasks: [task],
        selectedTaskIds: [],
        updateTask: updateTaskSpy,
        updateMultipleTasks: updateMultipleTasksSpy,
      } as ReturnType<typeof useTaskStore.getState>);

      const { result } = renderHook(() =>
        useTaskBarInteraction(task, scale, createGeometry()),
      );

      // Start drag
      act(() => {
        result.current.onMouseDown(createMockSVGEvent(200));
      });

      // Move 75px → 3 days
      await act(async () => {
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 275 }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });

      // Complete drag
      act(() => {
        document.dispatchEvent(new MouseEvent('mouseup'));
      });

      expect(updateMultipleTasksSpy).toHaveBeenCalled();
      expect(result.current.isDragging).toBe(false);
      expect(result.current.mode).toBe('idle');
    });

    it('calls updateTask for resize commit', async () => {
      // Position at right edge
      mockGetSVGPoint.mockReturnValue({ x: 298, y: 50 });
      const task = createTask();
      const scale = createScale({ pixelsPerDay: 25 });

      const originalGetState = useTaskStore.getState;
      vi.spyOn(useTaskStore, 'getState').mockReturnValue({
        ...originalGetState(),
        tasks: [task],
        selectedTaskIds: [],
        updateTask: updateTaskSpy,
        updateMultipleTasks: updateMultipleTasksSpy,
      } as ReturnType<typeof useTaskStore.getState>);

      const { result } = renderHook(() =>
        useTaskBarInteraction(task, scale, createGeometry()),
      );

      // Start resize
      act(() => {
        result.current.onMouseDown(createMockSVGEvent(298));
      });

      // Move 50px → 2 days
      await act(async () => {
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 348 }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });

      // Complete resize
      act(() => {
        document.dispatchEvent(new MouseEvent('mouseup'));
      });

      expect(updateTaskSpy).toHaveBeenCalledWith(task.id, {
        startDate: '2025-01-10',
        endDate: '2025-01-22',
        duration: 13,
      });
      expect(result.current.isDragging).toBe(false);
      expect(result.current.cursor).toBe('pointer');
    });

    it('does not commit when deltaDays is 0 (no movement)', () => {
      mockGetSVGPoint.mockReturnValue({ x: 200, y: 50 });
      const task = createTask();

      const { result } = renderHook(() =>
        useTaskBarInteraction(task, createScale(), createGeometry()),
      );

      // Start drag
      act(() => {
        result.current.onMouseDown(createMockSVGEvent(200));
      });

      // Release immediately (no mousemove)
      act(() => {
        document.dispatchEvent(new MouseEvent('mouseup'));
      });

      expect(updateMultipleTasksSpy).not.toHaveBeenCalled();
      expect(updateTaskSpy).not.toHaveBeenCalled();
    });

    it('does not call updateTask when resize produces no net change', () => {
      // Start a resize then release immediately — preview equals original dates,
      // so buildResizeUpdate returns null and updateTask must not be called.
      mockGetSVGPoint.mockReturnValue({ x: 298, y: 50 }); // right edge
      const task = createTask();

      const originalGetState = useTaskStore.getState;
      vi.spyOn(useTaskStore, 'getState').mockReturnValue({
        ...originalGetState(),
        tasks: [task],
        selectedTaskIds: [],
        updateTask: updateTaskSpy,
        updateMultipleTasks: updateMultipleTasksSpy,
      } as ReturnType<typeof useTaskStore.getState>);

      const { result } = renderHook(() =>
        useTaskBarInteraction(task, createScale(), createGeometry()),
      );

      act(() => {
        result.current.onMouseDown(createMockSVGEvent(298));
      });

      // Release without any mousemove — dates unchanged
      act(() => {
        document.dispatchEvent(new MouseEvent('mouseup'));
      });

      expect(updateTaskSpy).not.toHaveBeenCalled();
    });

    it('clears shared drag state on mouseup', async () => {
      mockGetSVGPoint.mockReturnValue({ x: 200, y: 50 });
      const task = createTask();
      const scale = createScale({ pixelsPerDay: 25 });

      const { result } = renderHook(() =>
        useTaskBarInteraction(task, scale, createGeometry()),
      );

      act(() => {
        result.current.onMouseDown(createMockSVGEvent(200));
      });

      await act(async () => {
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 275 }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });

      act(() => {
        document.dispatchEvent(new MouseEvent('mouseup'));
      });

      expect(clearDragStateSpy).toHaveBeenCalled();
    });

    it('moves all selected tasks when dragged task is in selection', async () => {
      mockGetSVGPoint.mockReturnValue({ x: 200, y: 50 });
      const task = createTask();
      const task2 = createTask({
        id: toTaskId('task-2'),
        name: 'Task 2',
        startDate: '2025-01-15',
        endDate: '2025-01-25',
      });
      const scale = createScale({ pixelsPerDay: 25 });

      const originalGetState = useTaskStore.getState;
      vi.spyOn(useTaskStore, 'getState').mockReturnValue({
        ...originalGetState(),
        tasks: [task, task2],
        selectedTaskIds: [task.id, task2.id],
        updateTask: updateTaskSpy,
        updateMultipleTasks: updateMultipleTasksSpy,
      } as ReturnType<typeof useTaskStore.getState>);

      const { result } = renderHook(() =>
        useTaskBarInteraction(task, scale, createGeometry()),
      );

      act(() => {
        result.current.onMouseDown(createMockSVGEvent(200));
      });

      await act(async () => {
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 275 }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });

      act(() => {
        document.dispatchEvent(new MouseEvent('mouseup'));
      });

      // Should resolve effective tasks for all selected IDs
      expect(mockGetEffective).toHaveBeenCalledWith(
        [task, task2],
        [task.id, task2.id],
      );
      expect(updateMultipleTasksSpy).toHaveBeenCalled();
    });
  });

  describe('milestone handling', () => {
    it('uses startDate as endDate fallback for milestones', () => {
      const task = createTask({
        type: 'milestone',
        startDate: '2025-01-15',
        endDate: '',
        duration: 0,
      });
      mockGetSVGPoint.mockReturnValue({ x: 200, y: 50 });

      const { result } = renderHook(() =>
        useTaskBarInteraction(task, createScale(), createGeometry()),
      );

      act(() => {
        result.current.onMouseDown(createMockSVGEvent());
      });

      // Preview should use startDate for both
      expect(result.current.previewGeometry?.startDate).toBe('2025-01-15');
      expect(result.current.previewGeometry?.endDate).toBe('2025-01-15');
    });
  });

  describe('working days mode', () => {
    it('uses working days calculation during drag when enabled', async () => {
      mockGetSVGPoint.mockReturnValue({ x: 200, y: 50 });
      const task = createTask();
      const scale = createScale({ pixelsPerDay: 25 });

      // Enable working days mode in chart store
      const chartState = useChartStore.getState();
      Object.defineProperty(chartState, 'workingDaysMode', {
        value: true,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(chartState, 'workingDaysConfig', {
        value: { excludeWeekends: true, excludeHolidays: false },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() =>
        useTaskBarInteraction(task, scale, createGeometry()),
      );

      act(() => {
        result.current.onMouseDown(createMockSVGEvent(200));
      });

      await act(async () => {
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 275 }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });

      // computeEndDateForDrag should use working days functions
      expect(mockCalculateWorkingDays).toHaveBeenCalled();
      expect(mockAddWorkingDays).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('removes event listeners on unmount', () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useTaskBarInteraction(createTask(), createScale(), createGeometry()),
      );

      unmount();

      const calls = removeSpy.mock.calls.map((c) => c[0]);
      expect(calls).toContain('mousemove');
      expect(calls).toContain('mouseup');
    });

    it('clears shared drag state when unmounting during an active drag', () => {
      mockGetSVGPoint.mockReturnValue({ x: 200, y: 50 });
      const task = createTask();

      const { result, unmount } = renderHook(() =>
        useTaskBarInteraction(task, createScale(), createGeometry()),
      );

      // Start a drag so dragStateRef is populated
      act(() => {
        result.current.onMouseDown(createMockSVGEvent(200));
      });

      expect(result.current.isDragging).toBe(true);

      // Reset spy so we can assert the unmount-specific call
      clearDragStateSpy.mockClear();
      unmount();

      expect(clearDragStateSpy).toHaveBeenCalled();
    });

    it('does not call clearDragState on unmount when not dragging', () => {
      const { unmount } = renderHook(() =>
        useTaskBarInteraction(createTask(), createScale(), createGeometry()),
      );

      clearDragStateSpy.mockClear();
      unmount();

      expect(clearDragStateSpy).not.toHaveBeenCalled();
    });
  });
});
