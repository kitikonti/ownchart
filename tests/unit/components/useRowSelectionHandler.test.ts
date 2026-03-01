/**
 * Tests for useRowSelectionHandler hook.
 * Verifies single, ctrl, and shift-click selection behaviour.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRowSelectionHandler } from "../../../src/components/TaskList/useRowSelectionHandler";
import type { TaskId } from "../../../src/types/branded.types";
import {
  dragState,
  resetDragState,
} from "../../../src/components/TaskList/dragSelectionState";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSetActiveCell = vi.fn();
const mockSetSelectedTaskIds = vi.fn();
const mockToggleTaskSelection = vi.fn();
let mockLastSelectedTaskId: TaskId | null = null;

vi.mock("../../../src/store/slices/taskSlice", () => {
  const useTaskStore = vi.fn(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        setActiveCell: mockSetActiveCell,
        setSelectedTaskIds: mockSetSelectedTaskIds,
        toggleTaskSelection: mockToggleTaskSelection,
        lastSelectedTaskId: mockLastSelectedTaskId,
      })
  );
  (useTaskStore as unknown as Record<string, unknown>).getState = () => ({
    lastSelectedTaskId: mockLastSelectedTaskId,
  });
  return { useTaskStore };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VISIBLE_IDS = ["t1", "t2", "t3", "t4", "t5"] as TaskId[];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useRowSelectionHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLastSelectedTaskId = null;
    resetDragState();
  });

  it("should select a single task on plain click", () => {
    const { result } = renderHook(() =>
      useRowSelectionHandler({ visibleTaskIds: VISIBLE_IDS })
    );

    act(() => {
      result.current.handleSelectRow("t2" as TaskId, false, false);
    });

    expect(mockSetActiveCell).toHaveBeenCalledWith(null, null);
    expect(mockSetSelectedTaskIds).toHaveBeenCalledWith(["t2"], false);
    expect(mockToggleTaskSelection).not.toHaveBeenCalled();
  });

  it("should toggle selection on ctrl+click", () => {
    const { result } = renderHook(() =>
      useRowSelectionHandler({ visibleTaskIds: VISIBLE_IDS })
    );

    act(() => {
      result.current.handleSelectRow("t3" as TaskId, false, true);
    });

    expect(mockSetActiveCell).toHaveBeenCalledWith(null, null);
    expect(mockToggleTaskSelection).toHaveBeenCalledWith("t3");
    expect(mockSetSelectedTaskIds).not.toHaveBeenCalled();
  });

  it("should select a range on shift+click when anchor is set via lastSelectedTaskId", () => {
    mockLastSelectedTaskId = "t2" as TaskId;
    const { result } = renderHook(() =>
      useRowSelectionHandler({ visibleTaskIds: VISIBLE_IDS })
    );

    act(() => {
      result.current.handleSelectRow("t4" as TaskId, true, false);
    });

    expect(mockSetSelectedTaskIds).toHaveBeenCalledWith(
      ["t2", "t3", "t4"],
      false
    );
  });

  it("should select a reverse range when target is before anchor", () => {
    mockLastSelectedTaskId = "t4" as TaskId;
    const { result } = renderHook(() =>
      useRowSelectionHandler({ visibleTaskIds: VISIBLE_IDS })
    );

    act(() => {
      result.current.handleSelectRow("t2" as TaskId, true, false);
    });

    // Range should always be ordered min→max
    expect(mockSetSelectedTaskIds).toHaveBeenCalledWith(
      ["t2", "t3", "t4"],
      false
    );
  });

  it("should fall back to single selection on shift+click with no anchor", () => {
    // mockLastSelectedTaskId is null, dragState.startTaskId is null
    const { result } = renderHook(() =>
      useRowSelectionHandler({ visibleTaskIds: VISIBLE_IDS })
    );

    act(() => {
      result.current.handleSelectRow("t3" as TaskId, true, false);
    });

    expect(mockSetSelectedTaskIds).toHaveBeenCalledWith(["t3"], false);
  });

  it("should prefer dragState.startTaskId over lastSelectedTaskId as anchor", () => {
    mockLastSelectedTaskId = "t1" as TaskId;
    dragState.startTaskId = "t3" as TaskId;

    const { result } = renderHook(() =>
      useRowSelectionHandler({ visibleTaskIds: VISIBLE_IDS })
    );

    act(() => {
      result.current.handleSelectRow("t5" as TaskId, true, false);
    });

    // dragState.startTaskId (t3) wins over lastSelectedTaskId (t1)
    expect(mockSetSelectedTaskIds).toHaveBeenCalledWith(
      ["t3", "t4", "t5"],
      false
    );
  });

  it("should clear the active cell before every selection", () => {
    const { result } = renderHook(() =>
      useRowSelectionHandler({ visibleTaskIds: VISIBLE_IDS })
    );

    act(() => {
      result.current.handleSelectRow("t1" as TaskId, false, true);
    });

    expect(mockSetActiveCell).toHaveBeenCalledWith(null, null);
  });

  it("should return a stable handleSelectRow reference when visibleTaskIds does not change", () => {
    const { result, rerender } = renderHook(() =>
      useRowSelectionHandler({ visibleTaskIds: VISIBLE_IDS })
    );

    const firstRef = result.current.handleSelectRow;
    rerender();
    expect(result.current.handleSelectRow).toBe(firstRef);
  });
});
