/**
 * Unit tests for useTaskTableRowContextMenu hook.
 * Covers: right-click selection logic, contextMenu state, closeContextMenu,
 * and contextMenuItems derivation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTaskTableRowContextMenu } from "@/hooks/useTaskTableRowContextMenu";

// ---------------------------------------------------------------------------
// Store mock
// ---------------------------------------------------------------------------

const mockSetSelectedTaskIds = vi.fn();
let mockSelectedTaskIds: string[] = [];

vi.mock("@/store/slices/taskSlice", () => ({
  useTaskStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      setSelectedTaskIds: mockSetSelectedTaskIds,
      selectedTaskIds: mockSelectedTaskIds,
    })
  ),
}));

// ---------------------------------------------------------------------------
// useFullTaskContextMenuItems mock
// ---------------------------------------------------------------------------

const mockBuildItems = vi.fn().mockReturnValue([]);

vi.mock("@/hooks/useFullTaskContextMenuItems", () => ({
  useFullTaskContextMenuItems: vi.fn(() => ({ buildItems: mockBuildItems })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMouseEvent(
  x: number,
  y: number
): React.MouseEvent {
  return {
    preventDefault: vi.fn(),
    clientX: x,
    clientY: y,
  } as unknown as React.MouseEvent;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useTaskTableRowContextMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedTaskIds = [];
    mockBuildItems.mockReturnValue([]);
  });

  it("starts with null contextMenu and empty items", () => {
    const { result } = renderHook(() => useTaskTableRowContextMenu());

    expect(result.current.contextMenu).toBeNull();
    expect(result.current.contextMenuItems).toEqual([]);
  });

  it("handleRowContextMenu opens the context menu with position and taskId", () => {
    const { result } = renderHook(() => useTaskTableRowContextMenu());
    const event = makeMouseEvent(100, 200);

    act(() => {
      result.current.handleRowContextMenu(event, "task-1");
    });

    expect(result.current.contextMenu).toEqual({
      position: { x: 100, y: 200 },
      taskId: "task-1",
    });
  });

  it("handleRowContextMenu calls e.preventDefault()", () => {
    const { result } = renderHook(() => useTaskTableRowContextMenu());
    const event = makeMouseEvent(0, 0);

    act(() => {
      result.current.handleRowContextMenu(event, "task-1");
    });

    expect(event.preventDefault).toHaveBeenCalledOnce();
  });

  it("switches selection to right-clicked task when it is not in the current selection", () => {
    mockSelectedTaskIds = ["task-2", "task-3"];
    const { result } = renderHook(() => useTaskTableRowContextMenu());

    act(() => {
      result.current.handleRowContextMenu(makeMouseEvent(0, 0), "task-1");
    });

    expect(mockSetSelectedTaskIds).toHaveBeenCalledWith(["task-1"]);
  });

  it("does NOT change selection when right-clicked task is already selected", () => {
    mockSelectedTaskIds = ["task-1", "task-2"];
    const { result } = renderHook(() => useTaskTableRowContextMenu());

    act(() => {
      result.current.handleRowContextMenu(makeMouseEvent(0, 0), "task-1");
    });

    expect(mockSetSelectedTaskIds).not.toHaveBeenCalled();
  });

  it("closeContextMenu sets contextMenu back to null", () => {
    const { result } = renderHook(() => useTaskTableRowContextMenu());

    act(() => {
      result.current.handleRowContextMenu(makeMouseEvent(50, 75), "task-1");
    });
    expect(result.current.contextMenu).not.toBeNull();

    act(() => {
      result.current.closeContextMenu();
    });

    expect(result.current.contextMenu).toBeNull();
  });

  it("contextMenuItems is empty when contextMenu is null", () => {
    const { result } = renderHook(() => useTaskTableRowContextMenu());

    expect(result.current.contextMenuItems).toEqual([]);
    expect(mockBuildItems).not.toHaveBeenCalled();
  });

  it("contextMenuItems is populated by buildItems when contextMenu is open", () => {
    const fakeItems = [{ id: "cut", label: "Cut", onClick: vi.fn() }];
    mockBuildItems.mockReturnValue(fakeItems);

    const { result } = renderHook(() => useTaskTableRowContextMenu());

    act(() => {
      result.current.handleRowContextMenu(makeMouseEvent(0, 0), "task-1");
    });

    expect(mockBuildItems).toHaveBeenCalledWith("task-1");
    expect(result.current.contextMenuItems).toBe(fakeItems);
  });
});
