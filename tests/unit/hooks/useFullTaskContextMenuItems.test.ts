/**
 * Tests for useFullTaskContextMenuItems hook.
 * Focuses on the hook's assembly logic and the unhide-item gate condition,
 * which cannot be covered by the pure-function builder tests alone.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFullTaskContextMenuItems } from "@/hooks/useFullTaskContextMenuItems";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useChartStore } from "@/store/slices/chartSlice";
import { useClipboardStore } from "@/store/slices/clipboardSlice";
import type { Task } from "@/types/chart.types";
import type { FlattenedTask } from "@/utils/hierarchy";

// Mock external dependencies that have side effects or browser APIs
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/utils/clipboard", () => ({
  writeRowsToSystemClipboard: vi.fn().mockResolvedValue(undefined),
  writeCellToSystemClipboard: vi.fn().mockResolvedValue(undefined),
  readRowsFromSystemClipboard: vi.fn().mockResolvedValue(null),
  readCellFromSystemClipboard: vi.fn().mockResolvedValue(null),
  isClipboardApiAvailable: vi.fn().mockReturnValue(false),
}));

vi.mock("@/hooks/useFlattenedTasks", () => ({
  useFlattenedTasks: vi.fn(() => ({
    flattenedTasks: [],
    allFlattenedTasks: [],
  })),
}));

import { useFlattenedTasks } from "@/hooks/useFlattenedTasks";

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

function toFlattened(task: Task, rowNum: number): FlattenedTask {
  return { task, level: 0, hasChildren: false, globalRowNumber: rowNum };
}

// ─── Setup ───

beforeEach(() => {
  useTaskStore.getState().setTasks([]);
  useTaskStore.getState().clearSelection();
  useChartStore.getState().setHiddenColumns([]);
  useChartStore.getState().setHiddenTaskIds([]);
  useClipboardStore.setState({ activeMode: null });

  vi.mocked(useFlattenedTasks).mockReturnValue({
    flattenedTasks: [],
    allFlattenedTasks: [],
  });
});

// ─── Tests ───

describe("useFullTaskContextMenuItems", () => {
  describe("buildItems — item count", () => {
    it("should return the base set of items (no unhide) when no hidden tasks", () => {
      const task1 = createTask("t1");
      useTaskStore.getState().setTasks([task1]);
      useTaskStore.getState().setSelectedTaskIds(["t1"]);

      const { result } = renderHook(() => useFullTaskContextMenuItems());
      const items = result.current.buildItems("t1");

      // Base items: cut, copy, paste, insertAbove, insertBelow, delete,
      // indent, outdent, group, ungroup, hide = 11 items
      expect(items).toHaveLength(11);
    });

    it("should include the unhide item when task is in multi-selection with hidden rows in range", () => {
      const task1 = createTask("t1");
      const task2 = createTask("t2");
      const task3 = createTask("t3");
      useTaskStore.getState().setTasks([task1, task2, task3]);
      // t1 (row 1) and t3 (row 3) are selected; t2 (row 2) is hidden between them
      useTaskStore.getState().setSelectedTaskIds(["t1", "t3"]);
      useChartStore.getState().setHiddenTaskIds(["t2"]);

      // Provide flattened tasks so getHiddenIdsInSelection can compute the row range.
      // allFlattenedTasks includes hidden tasks; flattenedTasks has only visible ones.
      const flat1 = toFlattened(task1, 1);
      const flat2 = toFlattened(task2, 2);
      const flat3 = toFlattened(task3, 3);
      vi.mocked(useFlattenedTasks).mockReturnValue({
        flattenedTasks: [flat1, flat3], // visible tasks (t2 is hidden)
        allFlattenedTasks: [flat1, flat2, flat3], // all tasks including hidden
      });

      const { result } = renderHook(() => useFullTaskContextMenuItems());
      const items = result.current.buildItems("t1"); // t1 is in selection

      const unhideItem = items.find((i) => i.id === "unhide");
      expect(unhideItem).toBeDefined();
      expect(items).toHaveLength(12);
    });
  });

  describe("unhide item gate — selectedTaskIds.includes(taskId)", () => {
    it("should NOT show unhide item when right-clicking a task outside the current selection", () => {
      const task1 = createTask("t1");
      const task2 = createTask("t2");
      const task3 = createTask("t3");
      useTaskStore.getState().setTasks([task1, task2, task3]);
      // t1 and t3 are selected, with a hidden task t2 between them
      useTaskStore.getState().setSelectedTaskIds(["t1", "t3"]);
      useChartStore.getState().setHiddenTaskIds(["t2"]);

      const flat1 = toFlattened(task1, 1);
      const flat2 = toFlattened(task2, 2);
      const flat3 = toFlattened(task3, 3);
      vi.mocked(useFlattenedTasks).mockReturnValue({
        flattenedTasks: [flat1, flat3],
        allFlattenedTasks: [flat1, flat2, flat3],
      });

      const { result } = renderHook(() => useFullTaskContextMenuItems());
      // Right-click on a task that is NOT in the current selection
      const items = result.current.buildItems("t2");

      const unhideItem = items.find((i) => i.id === "unhide");
      expect(unhideItem).toBeUndefined();
    });

    it("should NOT show unhide item for single-task selection even if hidden tasks exist", () => {
      const task1 = createTask("t1");
      const task2 = createTask("t2");
      useTaskStore.getState().setTasks([task1, task2]);
      // Only t1 is selected (length < 2 — buildUnhideItem returns null)
      useTaskStore.getState().setSelectedTaskIds(["t1"]);
      useChartStore.getState().setHiddenTaskIds(["t2"]);

      const { result } = renderHook(() => useFullTaskContextMenuItems());
      const items = result.current.buildItems("t1");

      const unhideItem = items.find((i) => i.id === "unhide");
      expect(unhideItem).toBeUndefined();
    });
  });

  describe("buildItems — item IDs", () => {
    it("should produce items with the expected IDs in order", () => {
      const task1 = createTask("t1");
      useTaskStore.getState().setTasks([task1]);
      useTaskStore.getState().setSelectedTaskIds(["t1"]);

      const { result } = renderHook(() => useFullTaskContextMenuItems());
      const items = result.current.buildItems("t1");

      const ids = items.map((i) => i.id);
      expect(ids).toEqual([
        "cut",
        "copy",
        "paste",
        "insertAbove",
        "insertBelow",
        "delete",
        "indent",
        "outdent",
        "group",
        "ungroup",
        "hide",
      ]);
    });
  });
});
