/**
 * Unit tests for useProgressDrag hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgressDrag } from '@/hooks/useProgressDrag';
import { useTaskStore } from '@/store/slices/taskSlice';
import type { Task } from '@/types/chart.types';
import type { TaskBarGeometry } from '@/utils/timelineUtils';

// Mock getSVGPoint
vi.mock('@/utils/svgUtils', () => ({
  getSVGPoint: vi.fn(() => ({ x: 0, y: 0 })),
}));

import { getSVGPoint } from '@/utils/svgUtils';
const mockGetSVGPoint = vi.mocked(getSVGPoint);

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    name: 'Test Task',
    startDate: '2025-01-01',
    endDate: '2025-01-10',
    duration: 9,
    progress: 50,
    type: 'task',
    color: '#4A90D9',
    parentId: null,
    sortOrder: 0,
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

describe('useProgressDrag', () => {
  let updateTaskSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    updateTaskSpy = vi.fn();
    vi.spyOn(useTaskStore.getState(), 'updateTask').mockImplementation(updateTaskSpy);
    mockGetSVGPoint.mockReset();
  });

  it('returns initial state with no drag in progress', () => {
    const task = createTask();
    const geometry = createGeometry();

    const { result } = renderHook(() => useProgressDrag(task, geometry, true));

    expect(result.current.isDragging).toBe(false);
    expect(result.current.previewProgress).toBeNull();
    expect(typeof result.current.onHandleMouseDown).toBe('function');
  });

  it('does not start drag when showProgress is false', () => {
    const task = createTask();
    const geometry = createGeometry();

    const { result } = renderHook(() => useProgressDrag(task, geometry, false));

    const mockEvent = {
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
      target: {
        ownerSVGElement: document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
      },
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.onHandleMouseDown(mockEvent);
    });

    expect(result.current.isDragging).toBe(false);
    expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
  });

  it('starts drag on mousedown and sets initial preview to current progress', () => {
    const task = createTask({ progress: 40 });
    const geometry = createGeometry();

    const { result } = renderHook(() => useProgressDrag(task, geometry, true));

    const mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const mockEvent = {
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
      target: { ownerSVGElement: mockSvg },
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.onHandleMouseDown(mockEvent);
    });

    expect(result.current.isDragging).toBe(true);
    expect(result.current.previewProgress).toBe(40);
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('calculates progress correctly from mouse position on mousemove', async () => {
    const task = createTask({ progress: 50 });
    const geometry = createGeometry({ x: 100, width: 200 });

    const { result } = renderHook(() => useProgressDrag(task, geometry, true));

    const mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const mockEvent = {
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
      target: { ownerSVGElement: mockSvg },
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.onHandleMouseDown(mockEvent);
    });

    // Simulate mousemove to 75% position (x=100, width=200, so 75% = x 250)
    mockGetSVGPoint.mockReturnValue({ x: 250, y: 50 });

    // Fire real mousemove and wait for RAF
    await act(async () => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 50 }));
      // Wait for requestAnimationFrame
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(result.current.previewProgress).toBe(75);
  });

  it('clamps progress to 0 when mouse is left of bar', async () => {
    const task = createTask({ progress: 50 });
    const geometry = createGeometry({ x: 100, width: 200 });

    const { result } = renderHook(() => useProgressDrag(task, geometry, true));

    const mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const mockEvent = {
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
      target: { ownerSVGElement: mockSvg },
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.onHandleMouseDown(mockEvent);
    });

    // Simulate mousemove to left of bar
    mockGetSVGPoint.mockReturnValue({ x: 50, y: 50 });

    await act(async () => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(result.current.previewProgress).toBe(0);
  });

  it('clamps progress to 100 when mouse is right of bar', async () => {
    const task = createTask({ progress: 50 });
    const geometry = createGeometry({ x: 100, width: 200 });

    const { result } = renderHook(() => useProgressDrag(task, geometry, true));

    const mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const mockEvent = {
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
      target: { ownerSVGElement: mockSvg },
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.onHandleMouseDown(mockEvent);
    });

    // Simulate mousemove to right of bar
    mockGetSVGPoint.mockReturnValue({ x: 400, y: 50 });

    await act(async () => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 50 }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(result.current.previewProgress).toBe(100);
  });

  it('rounds progress to nearest integer', async () => {
    const task = createTask({ progress: 50 });
    const geometry = createGeometry({ x: 100, width: 200 });

    const { result } = renderHook(() => useProgressDrag(task, geometry, true));

    const mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const mockEvent = {
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
      target: { ownerSVGElement: mockSvg },
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.onHandleMouseDown(mockEvent);
    });

    // Simulate mousemove to a position that gives a fractional value
    // x=100, width=200, relativeX=33 → 33/200*100 = 16.5 → rounds to 17
    mockGetSVGPoint.mockReturnValue({ x: 133, y: 50 });

    await act(async () => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 133, clientY: 50 }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(result.current.previewProgress).toBe(17);
  });

  it('calls updateTask on mouseup when progress changed', async () => {
    const task = createTask({ progress: 50 });
    const geometry = createGeometry({ x: 100, width: 200 });

    const { result } = renderHook(() => useProgressDrag(task, geometry, true));

    const mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const mockEvent = {
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
      target: { ownerSVGElement: mockSvg },
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.onHandleMouseDown(mockEvent);
    });

    // Move to 75%
    mockGetSVGPoint.mockReturnValue({ x: 250, y: 50 });

    await act(async () => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 50 }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    // Release
    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(updateTaskSpy).toHaveBeenCalledWith('task-1', { progress: 75 });
    expect(result.current.isDragging).toBe(false);
    expect(result.current.previewProgress).toBeNull();
  });

  it('does not update previewProgress when geometry width is zero (zero-width guard)', async () => {
    const task = createTask({ progress: 50 });
    // width=0 → the RAF callback should early-exit without updating state
    const geometry = createGeometry({ x: 100, width: 0 });

    const { result } = renderHook(() => useProgressDrag(task, geometry, true));

    const mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const mockEvent = {
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
      target: { ownerSVGElement: mockSvg },
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.onHandleMouseDown(mockEvent);
    });

    // Drag started — initial preview set to current progress (50)
    expect(result.current.previewProgress).toBe(50);

    mockGetSVGPoint.mockReturnValue({ x: 200, y: 50 });

    await act(async () => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 50 }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    // width=0 guard fires → preview remains at initial value (50)
    expect(result.current.previewProgress).toBe(50);

    // Release without state change — updateTask should not be called
    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(updateTaskSpy).not.toHaveBeenCalled();
  });

  it('does not call updateTask on mouseup when progress unchanged', () => {
    const task = createTask({ progress: 50 });
    const geometry = createGeometry({ x: 100, width: 200 });

    const { result } = renderHook(() => useProgressDrag(task, geometry, true));

    const mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const mockEvent = {
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
      target: { ownerSVGElement: mockSvg },
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.onHandleMouseDown(mockEvent);
    });

    // Release immediately without moving
    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(updateTaskSpy).not.toHaveBeenCalled();
    expect(result.current.isDragging).toBe(false);
  });
});
