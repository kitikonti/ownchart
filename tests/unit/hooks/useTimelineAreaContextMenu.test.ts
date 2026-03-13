/**
 * Unit tests for useTimelineAreaContextMenu hook.
 * Covers:
 * - Right-click on empty area → paste + fit-to-view items
 * - Right-click on a selected task row → full context menu delegated to buildItems
 * - Right-click on an unselected task row → default (empty area) menu
 * - Edge cases: empty tasks list, zero rowHeight, click outside SVG bounds
 * - closeContextMenu resets state
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimelineAreaContextMenu } from '@/hooks/useTimelineAreaContextMenu';
import { useTaskStore } from '@/store/slices/taskSlice';
import type { Task } from '@/types/chart.types';

// ─── Mock heavy dependencies ───────────────────────────────────────────────

vi.mock('@/hooks/useClipboardOperations', () => ({
  useClipboardOperations: () => ({
    handlePaste: vi.fn().mockResolvedValue(undefined),
    canPaste: true,
  }),
}));

vi.mock('@/hooks/useFullTaskContextMenuItems', () => ({
  useFullTaskContextMenuItems: () => ({
    buildItems: vi.fn().mockReturnValue([{ id: 'full-menu-item', label: 'Cut' }]),
  }),
}));

vi.mock('@/store/slices/chartSlice', () => ({
  useChartStore: (selector: (s: { fitToView: () => void }) => unknown) =>
    selector({ fitToView: vi.fn() }),
}));

// ─── Helpers ───────────────────────────────────────────────────────────────

function createTask(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id: id as Task['id'],
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

/** Build a fake SVGSVGElement whose getBoundingClientRect returns the given top. */
function makeSvgRef(top: number): React.RefObject<SVGSVGElement | null> {
  const fakeEl = {
    getBoundingClientRect: () => ({ top, left: 0, right: 800, bottom: top + 600 }),
  } as unknown as SVGSVGElement;
  return { current: fakeEl };
}

function makeMouseEvent(clientX: number, clientY: number): React.MouseEvent {
  return {
    preventDefault: vi.fn(),
    clientX,
    clientY,
  } as unknown as React.MouseEvent;
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('useTimelineAreaContextMenu', () => {
  const ROW_HEIGHT = 40;

  beforeEach(() => {
    useTaskStore.getState().setTasks([]);
    useTaskStore.setState({ selectedTaskIds: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start with contextMenu null and empty items', () => {
      const svgRef = makeSvgRef(0);
      const { result } = renderHook(() =>
        useTimelineAreaContextMenu({ svgRef, tasks: [], rowHeight: ROW_HEIGHT })
      );

      expect(result.current.contextMenu).toBeNull();
      expect(result.current.contextMenuItems).toEqual([]);
    });
  });

  describe('right-click on empty area (no task targeted)', () => {
    it('should set contextMenu position', () => {
      const svgRef = makeSvgRef(0);
      const tasks: Task[] = [];
      const { result } = renderHook(() =>
        useTimelineAreaContextMenu({ svgRef, tasks, rowHeight: ROW_HEIGHT })
      );

      act(() => {
        result.current.handleAreaContextMenu(makeMouseEvent(200, 300));
      });

      expect(result.current.contextMenu).toEqual({ x: 200, y: 300 });
    });

    it('should provide paste and fit-to-view items', () => {
      const svgRef = makeSvgRef(0);
      const tasks: Task[] = [];
      const { result } = renderHook(() =>
        useTimelineAreaContextMenu({ svgRef, tasks, rowHeight: ROW_HEIGHT })
      );

      act(() => {
        result.current.handleAreaContextMenu(makeMouseEvent(200, 300));
      });

      const ids = result.current.contextMenuItems.map((i) => i.id);
      expect(ids).toContain('paste');
      expect(ids).toContain('fitToView');
    });

    it('should show "F" as fit-to-view shortcut', () => {
      const svgRef = makeSvgRef(0);
      const { result } = renderHook(() =>
        useTimelineAreaContextMenu({ svgRef, tasks: [], rowHeight: ROW_HEIGHT })
      );

      act(() => {
        result.current.handleAreaContextMenu(makeMouseEvent(200, 300));
      });

      const fitItem = result.current.contextMenuItems.find((i) => i.id === 'fitToView');
      expect(fitItem?.shortcut).toBe('F');
    });
  });

  describe('right-click on a selected task row', () => {
    it('should delegate to buildItems and return full menu', () => {
      const task = createTask('task-1');
      const svgRef = makeSvgRef(0); // SVG top = 0

      // clientY=10, svgY=10, rowIndex=0 → tasks[0]
      useTaskStore.setState({ selectedTaskIds: [task.id] });

      const { result } = renderHook(() =>
        useTimelineAreaContextMenu({
          svgRef,
          tasks: [task],
          rowHeight: ROW_HEIGHT,
        })
      );

      act(() => {
        // clientY=10 → rowIndex = floor(10/40) = 0
        result.current.handleAreaContextMenu(makeMouseEvent(200, 10));
      });

      // The mock buildItems returns [{ id: 'full-menu-item', label: 'Cut' }]
      expect(result.current.contextMenuItems).toEqual([
        { id: 'full-menu-item', label: 'Cut' },
      ]);
    });
  });

  describe('right-click on an unselected task row', () => {
    it('should fall back to default (paste + fit-to-view) menu', () => {
      const task = createTask('task-1');
      const svgRef = makeSvgRef(0);

      // Task exists at row 0 but is NOT selected
      useTaskStore.setState({ selectedTaskIds: [] });

      const { result } = renderHook(() =>
        useTimelineAreaContextMenu({
          svgRef,
          tasks: [task],
          rowHeight: ROW_HEIGHT,
        })
      );

      act(() => {
        result.current.handleAreaContextMenu(makeMouseEvent(200, 10));
      });

      const ids = result.current.contextMenuItems.map((i) => i.id);
      expect(ids).toContain('paste');
      expect(ids).toContain('fitToView');
    });
  });

  describe('edge cases', () => {
    it('should not crash when tasks is empty', () => {
      const svgRef = makeSvgRef(0);
      const { result } = renderHook(() =>
        useTimelineAreaContextMenu({ svgRef, tasks: [], rowHeight: ROW_HEIGHT })
      );

      expect(() => {
        act(() => {
          result.current.handleAreaContextMenu(makeMouseEvent(100, 50));
        });
      }).not.toThrow();
    });

    it('should fall back to default menu when rowHeight is 0', () => {
      const task = createTask('task-1');
      const svgRef = makeSvgRef(0);
      useTaskStore.setState({ selectedTaskIds: [task.id] });

      const { result } = renderHook(() =>
        useTimelineAreaContextMenu({ svgRef, tasks: [task], rowHeight: 0 })
      );

      act(() => {
        result.current.handleAreaContextMenu(makeMouseEvent(100, 10));
      });

      // rowHeight=0 guard → default menu
      const ids = result.current.contextMenuItems.map((i) => i.id);
      expect(ids).toContain('paste');
    });

    it('should fall back to default menu when svgRef.current is null', () => {
      const task = createTask('task-1');
      const nullRef = { current: null } as React.RefObject<SVGSVGElement | null>;
      useTaskStore.setState({ selectedTaskIds: [task.id] });

      const { result } = renderHook(() =>
        useTimelineAreaContextMenu({
          svgRef: nullRef,
          tasks: [task],
          rowHeight: ROW_HEIGHT,
        })
      );

      act(() => {
        result.current.handleAreaContextMenu(makeMouseEvent(100, 10));
      });

      const ids = result.current.contextMenuItems.map((i) => i.id);
      expect(ids).toContain('paste');
    });

    it('should fall back when click row index is out of tasks bounds', () => {
      const task = createTask('task-1');
      const svgRef = makeSvgRef(0);
      useTaskStore.setState({ selectedTaskIds: [task.id] });

      const { result } = renderHook(() =>
        useTimelineAreaContextMenu({
          svgRef,
          tasks: [task], // only 1 task
          rowHeight: ROW_HEIGHT,
        })
      );

      act(() => {
        // clientY=200 → rowIndex=floor(200/40)=5 → out of bounds
        result.current.handleAreaContextMenu(makeMouseEvent(100, 200));
      });

      const ids = result.current.contextMenuItems.map((i) => i.id);
      expect(ids).toContain('paste');
    });
  });

  describe('closeContextMenu', () => {
    it('should reset contextMenu to null', () => {
      const svgRef = makeSvgRef(0);
      const { result } = renderHook(() =>
        useTimelineAreaContextMenu({ svgRef, tasks: [], rowHeight: ROW_HEIGHT })
      );

      act(() => {
        result.current.handleAreaContextMenu(makeMouseEvent(100, 100));
      });

      expect(result.current.contextMenu).not.toBeNull();

      act(() => {
        result.current.closeContextMenu();
      });

      expect(result.current.contextMenu).toBeNull();
      expect(result.current.contextMenuItems).toEqual([]);
    });
  });
});
