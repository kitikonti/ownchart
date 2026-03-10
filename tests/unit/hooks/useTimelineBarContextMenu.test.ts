/**
 * Tests for useTimelineBarContextMenu hook.
 * Covers right-click selection logic, context menu state management, and item building.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimelineBarContextMenu } from "../../../src/hooks/useTimelineBarContextMenu";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import type { Task } from "../../../src/types/chart.types";

// ─── Mocks ───

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../../../src/utils/clipboard", () => ({
  writeRowsToSystemClipboard: vi.fn().mockResolvedValue(undefined),
  writeCellToSystemClipboard: vi.fn().mockResolvedValue(undefined),
  readRowsFromSystemClipboard: vi.fn().mockResolvedValue(null),
  readCellFromSystemClipboard: vi.fn().mockResolvedValue(null),
  isClipboardApiAvailable: vi.fn().mockReturnValue(false),
}));

vi.mock("../../../src/hooks/useFlattenedTasks", () => ({
  useFlattenedTasks: vi.fn(() => ({
    flattenedTasks: [],
    allFlattenedTasks: [],
  })),
}));

// ─── Helpers ───

function createTask(id: string, options: Partial<Task> = {}): Task {
  return {
    id,
    name: `Task ${id}`,
    startDate: "2025-01-01",
    endDate: "2025-01-05",
    duration: 5,
    progress: 0,
    color: "#3b82f6",
    order: 0,
    metadata: {},
    type: "task",
    ...options,
  };
}

function makeMouseEvent(x = 100, y = 200): React.MouseEvent {
  return {
    clientX: x,
    clientY: y,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as React.MouseEvent;
}

// ─── Setup ───

beforeEach(() => {
  useTaskStore.getState().setTasks([]);
  useTaskStore.getState().setSelectedTaskIds([]);
});

// ─── Tests ───

describe("useTimelineBarContextMenu", () => {
  it("should initialize with no context menu open", () => {
    const { result } = renderHook(() => useTimelineBarContextMenu());

    expect(result.current.contextMenu).toBeNull();
    expect(result.current.contextMenuItems).toEqual([]);
  });

  it("should open context menu with position and taskId on right-click", () => {
    const t1 = createTask("t1");
    useTaskStore.getState().setTasks([t1]);

    const { result } = renderHook(() => useTimelineBarContextMenu());
    const event = makeMouseEvent(150, 250);

    act(() => {
      result.current.handleBarContextMenu(event, "t1" as Task["id"]);
    });

    expect(result.current.contextMenu).toEqual({
      position: { x: 150, y: 250 },
      taskId: "t1",
    });
  });

  it("should call preventDefault and stopPropagation on right-click", () => {
    const t1 = createTask("t1");
    useTaskStore.getState().setTasks([t1]);

    const { result } = renderHook(() => useTimelineBarContextMenu());
    const event = makeMouseEvent();

    act(() => {
      result.current.handleBarContextMenu(event, "t1" as Task["id"]);
    });

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
  });

  it("should replace selection when right-clicking a task not in current selection", () => {
    const t1 = createTask("t1");
    const t2 = createTask("t2");
    useTaskStore.getState().setTasks([t1, t2]);
    useTaskStore.getState().setSelectedTaskIds(["t1" as Task["id"]]);

    const { result } = renderHook(() => useTimelineBarContextMenu());
    const event = makeMouseEvent();

    act(() => {
      result.current.handleBarContextMenu(event, "t2" as Task["id"]);
    });

    expect(useTaskStore.getState().selectedTaskIds).toEqual(["t2"]);
  });

  it("should keep existing selection when right-clicking a task already in the selection", () => {
    const t1 = createTask("t1");
    const t2 = createTask("t2");
    useTaskStore.getState().setTasks([t1, t2]);
    useTaskStore.getState().setSelectedTaskIds([
      "t1" as Task["id"],
      "t2" as Task["id"],
    ]);

    const { result } = renderHook(() => useTimelineBarContextMenu());
    const event = makeMouseEvent();

    act(() => {
      result.current.handleBarContextMenu(event, "t1" as Task["id"]);
    });

    // Selection should be unchanged
    expect(useTaskStore.getState().selectedTaskIds).toEqual(["t1", "t2"]);
  });

  it("should close context menu when closeContextMenu is called", () => {
    const t1 = createTask("t1");
    useTaskStore.getState().setTasks([t1]);

    const { result } = renderHook(() => useTimelineBarContextMenu());

    act(() => {
      result.current.handleBarContextMenu(makeMouseEvent(), "t1" as Task["id"]);
    });

    expect(result.current.contextMenu).not.toBeNull();

    act(() => {
      result.current.closeContextMenu();
    });

    expect(result.current.contextMenu).toBeNull();
    expect(result.current.contextMenuItems).toEqual([]);
  });
});
