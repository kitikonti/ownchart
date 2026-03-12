/**
 * Tests for useTaskTableHeaderStore hook.
 * Verifies that the hook correctly aggregates task store slices
 * needed by TaskTableHeader.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTaskTableHeaderStore } from "../../../src/hooks/useTaskTableHeaderStore";
import type { Task } from "../../../src/types/chart.types";

// ---------------------------------------------------------------------------
// Mock
// ---------------------------------------------------------------------------

const mockSelectAllTasks = vi.fn();
const mockClearSelection = vi.fn();
const mockSetColumnWidth = vi.fn();
const mockAutoFitColumn = vi.fn();

const defaultState = {
  tasks: [] as Task[],
  selectedTaskIds: [] as string[],
  selectAllTasks: mockSelectAllTasks,
  clearSelection: mockClearSelection,
  columnWidths: {} as Record<string, number>,
  setColumnWidth: mockSetColumnWidth,
  autoFitColumn: mockAutoFitColumn,
};

vi.mock("../../../src/store/slices/taskSlice", () => ({
  useTaskStore: vi.fn(
    (selector: (s: typeof defaultState) => unknown) => selector(defaultState)
  ),
}));

import { useTaskStore } from "../../../src/store/slices/taskSlice";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useTaskTableHeaderStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultState.tasks = [];
    defaultState.selectedTaskIds = [];
    defaultState.columnWidths = {};
  });

  it("returns tasks from the store", () => {
    const task = {
      id: "t1",
      name: "Task 1",
      startDate: "2025-01-01",
      endDate: "2025-01-07",
      duration: 7,
      progress: 0,
      color: "#000",
      order: 0,
      type: "task" as const,
      parent: undefined,
      open: true,
      metadata: {},
    };
    defaultState.tasks = [task];

    const { result } = renderHook(() => useTaskTableHeaderStore());

    expect(result.current.tasks).toEqual([task]);
  });

  it("returns selectedTaskIds from the store", () => {
    defaultState.selectedTaskIds = ["t1", "t2"];

    const { result } = renderHook(() => useTaskTableHeaderStore());

    expect(result.current.selectedTaskIds).toEqual(["t1", "t2"]);
  });

  it("returns selectAllTasks action", () => {
    const { result } = renderHook(() => useTaskTableHeaderStore());

    result.current.selectAllTasks();

    expect(mockSelectAllTasks).toHaveBeenCalledOnce();
  });

  it("returns clearSelection action", () => {
    const { result } = renderHook(() => useTaskTableHeaderStore());

    result.current.clearSelection();

    expect(mockClearSelection).toHaveBeenCalledOnce();
  });

  it("returns columnWidths from the store", () => {
    defaultState.columnWidths = { name: 200, startDate: 100 };

    const { result } = renderHook(() => useTaskTableHeaderStore());

    expect(result.current.columnWidths).toEqual({ name: 200, startDate: 100 });
  });

  it("returns setColumnWidth action", () => {
    const { result } = renderHook(() => useTaskTableHeaderStore());

    result.current.setColumnWidth("name", 250);

    expect(mockSetColumnWidth).toHaveBeenCalledWith("name", 250);
  });

  it("returns autoFitColumn action", () => {
    const { result } = renderHook(() => useTaskTableHeaderStore());

    result.current.autoFitColumn("name");

    expect(mockAutoFitColumn).toHaveBeenCalledWith("name");
  });

  it("calls useTaskStore once per slice member", () => {
    renderHook(() => useTaskTableHeaderStore());

    // 7 slice members = 7 separate useTaskStore calls
    expect(vi.mocked(useTaskStore)).toHaveBeenCalledTimes(7);
  });
});
