/**
 * Unit tests for useTaskRowData helper functions.
 * Tests getClipboardPosition, getSelectionPosition, and getHiddenGap
 * which compute derived row state for the task table.
 *
 * Also includes integration tests for the useTaskRowData hook itself,
 * verifying the assembled taskRowData (clipboard/selection/hidden state).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  getClipboardPosition,
  getSelectionPosition,
  getHiddenGap,
  getHiddenGapAbove,
  useTaskRowData,
} from "../../../src/hooks/useTaskRowData";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import { useChartStore } from "../../../src/store/slices/chartSlice";
import type { Task } from "../../../src/types/chart.types";

// react-hot-toast is indirectly imported through the store; suppress it in tests.
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

function createTask(id: string, order: number, overrides: Partial<Task> = {}): Task {
  return {
    id,
    name: `Task ${id}`,
    startDate: "2025-01-01",
    endDate: "2025-01-05",
    duration: 5,
    progress: 0,
    color: "#3b82f6",
    order,
    metadata: {},
    type: "task",
    ...overrides,
  };
}

describe("useTaskRowData helpers", () => {
  // ── getClipboardPosition ───────────────────────────────────────────────

  describe("getClipboardPosition", () => {
    const clipboardSet = new Set(["task-2", "task-3", "task-4"]);

    it("should return undefined for tasks not in clipboard", () => {
      expect(
        getClipboardPosition("task-1", undefined, "task-2", clipboardSet)
      ).toBeUndefined();
    });

    it("should mark first task in clipboard group", () => {
      const result = getClipboardPosition(
        "task-2",
        "task-1",
        "task-3",
        clipboardSet
      );
      expect(result).toEqual({ isFirst: true, isLast: false });
    });

    it("should mark middle task in clipboard group", () => {
      const result = getClipboardPosition(
        "task-3",
        "task-2",
        "task-4",
        clipboardSet
      );
      expect(result).toEqual({ isFirst: false, isLast: false });
    });

    it("should mark last task in clipboard group", () => {
      const result = getClipboardPosition(
        "task-4",
        "task-3",
        "task-5",
        clipboardSet
      );
      expect(result).toEqual({ isFirst: false, isLast: true });
    });

    it("should mark single task as both first and last", () => {
      const singleSet = new Set(["task-2"]);
      const result = getClipboardPosition(
        "task-2",
        "task-1",
        "task-3",
        singleSet
      );
      expect(result).toEqual({ isFirst: true, isLast: true });
    });

    it("should treat first visible row (no prev) as first in group", () => {
      const result = getClipboardPosition(
        "task-2",
        undefined,
        "task-3",
        clipboardSet
      );
      expect(result).toEqual({ isFirst: true, isLast: false });
    });

    it("should treat last visible row (no next) as last in group", () => {
      const result = getClipboardPosition(
        "task-4",
        "task-3",
        undefined,
        clipboardSet
      );
      expect(result).toEqual({ isFirst: false, isLast: true });
    });
  });

  // ── getSelectionPosition ───────────────────────────────────────────────

  describe("getSelectionPosition", () => {
    const selectedSet = new Set(["task-1", "task-2", "task-3"]);

    it("should return undefined for unselected tasks", () => {
      expect(
        getSelectionPosition("task-5", "task-4", "task-6", selectedSet)
      ).toBeUndefined();
    });

    it("should mark first selected in contiguous group", () => {
      const result = getSelectionPosition(
        "task-1",
        "task-0",
        "task-2",
        selectedSet
      );
      expect(result).toEqual({
        isFirstSelected: true,
        isLastSelected: false,
      });
    });

    it("should mark middle selected in contiguous group", () => {
      const result = getSelectionPosition(
        "task-2",
        "task-1",
        "task-3",
        selectedSet
      );
      expect(result).toEqual({
        isFirstSelected: false,
        isLastSelected: false,
      });
    });

    it("should mark last selected in contiguous group", () => {
      const result = getSelectionPosition(
        "task-3",
        "task-2",
        "task-4",
        selectedSet
      );
      expect(result).toEqual({
        isFirstSelected: false,
        isLastSelected: true,
      });
    });

    it("should mark single selected as both first and last", () => {
      const singleSet = new Set(["task-2"]);
      const result = getSelectionPosition(
        "task-2",
        "task-1",
        "task-3",
        singleSet
      );
      expect(result).toEqual({
        isFirstSelected: true,
        isLastSelected: true,
      });
    });

    it("should handle first row in list (no prev)", () => {
      const result = getSelectionPosition(
        "task-1",
        undefined,
        "task-2",
        selectedSet
      );
      expect(result).toEqual({
        isFirstSelected: true,
        isLastSelected: false,
      });
    });

    it("should handle last row in list (no next)", () => {
      const result = getSelectionPosition(
        "task-3",
        "task-2",
        undefined,
        selectedSet
      );
      expect(result).toEqual({
        isFirstSelected: false,
        isLastSelected: true,
      });
    });

    it("should handle non-contiguous selection (gaps)", () => {
      const gappedSet = new Set(["task-1", "task-3"]);
      // task-1 is selected, task-2 is not
      const result1 = getSelectionPosition(
        "task-1",
        undefined,
        "task-2",
        gappedSet
      );
      expect(result1).toEqual({
        isFirstSelected: true,
        isLastSelected: true,
      });
      // task-3 is selected, task-2 is not
      const result3 = getSelectionPosition(
        "task-3",
        "task-2",
        "task-4",
        gappedSet
      );
      expect(result3).toEqual({
        isFirstSelected: true,
        isLastSelected: true,
      });
    });
  });

  // ── getHiddenGap ──────────────────────────────────────────────────────

  describe("getHiddenGap", () => {
    it("should return no gap for consecutive rows", () => {
      expect(getHiddenGap(1, 2)).toEqual({
        hasHiddenBelow: false,
        hiddenBelowCount: 0,
      });
    });

    it("should detect a single hidden row", () => {
      expect(getHiddenGap(1, 3)).toEqual({
        hasHiddenBelow: true,
        hiddenBelowCount: 1,
      });
    });

    it("should detect multiple hidden rows", () => {
      expect(getHiddenGap(5, 10)).toEqual({
        hasHiddenBelow: true,
        hiddenBelowCount: 4,
      });
    });

    it("should handle last visible row (next = total + 1)", () => {
      // If this is row 8 and there are 10 total rows, next would be 11
      expect(getHiddenGap(8, 11)).toEqual({
        hasHiddenBelow: true,
        hiddenBelowCount: 2,
      });
    });

    it("should handle last row with no hidden rows after", () => {
      // Row 10 of 10, next = 11
      expect(getHiddenGap(10, 11)).toEqual({
        hasHiddenBelow: false,
        hiddenBelowCount: 0,
      });
    });
  });

  // ── getHiddenGapAbove ────────────────────────────────────────────────

  describe("getHiddenGapAbove", () => {
    it("should return no gap when first row is visible (globalRowNumber = 1)", () => {
      expect(getHiddenGapAbove(1)).toEqual({
        hasHiddenAbove: false,
        hiddenAboveCount: 0,
      });
    });

    it("should detect a single hidden row above", () => {
      expect(getHiddenGapAbove(2)).toEqual({
        hasHiddenAbove: true,
        hiddenAboveCount: 1,
      });
    });

    it("should detect multiple hidden rows above", () => {
      expect(getHiddenGapAbove(4)).toEqual({
        hasHiddenAbove: true,
        hiddenAboveCount: 3,
      });
    });
  });
});

// ── useTaskRowData hook integration tests ─────────────────────────────────────

describe("useTaskRowData hook", () => {
  const noopUnhideRange = vi.fn();

  beforeEach(() => {
    useTaskStore.setState({
      tasks: [
        createTask("t1", 0),
        createTask("t2", 1),
        createTask("t3", 2),
        createTask("t4", 3),
      ],
      selectedTaskIds: [],
      clipboardTaskIds: [],
    });
    useChartStore.setState({ hiddenTaskIds: [], hiddenColumns: [] });
    noopUnhideRange.mockClear();
  });

  it("should return one TaskRowDatum per visible task", () => {
    const { result } = renderHook(() => useTaskRowData(noopUnhideRange));
    expect(result.current.taskRowData).toHaveLength(4);
    expect(result.current.flattenedTaskCount).toBe(4);
  });

  it("should expose visibleTaskIds in display order", () => {
    const { result } = renderHook(() => useTaskRowData(noopUnhideRange));
    expect(result.current.visibleTaskIds).toEqual(["t1", "t2", "t3", "t4"]);
  });

  it("should set selectionPosition only for selected tasks", () => {
    useTaskStore.setState({ selectedTaskIds: ["t2", "t3"] });
    const { result } = renderHook(() => useTaskRowData(noopUnhideRange));
    const [row1, row2, row3, row4] = result.current.taskRowData;

    expect(row1.selectionPosition).toBeUndefined();
    expect(row2.selectionPosition).toEqual({ isFirstSelected: true, isLastSelected: false });
    expect(row3.selectionPosition).toEqual({ isFirstSelected: false, isLastSelected: true });
    expect(row4.selectionPosition).toBeUndefined();
  });

  it("should set clipboardPosition only for clipboard tasks", () => {
    useTaskStore.setState({ clipboardTaskIds: ["t1"] });
    const { result } = renderHook(() => useTaskRowData(noopUnhideRange));
    const [row1, row2] = result.current.taskRowData;

    expect(row1.clipboardPosition).toEqual({ isFirst: true, isLast: true });
    expect(row2.clipboardPosition).toBeUndefined();
  });

  it("should set hasHiddenAbove and call unhideRange when onUnhideAbove is invoked", () => {
    useChartStore.setState({ hiddenTaskIds: ["t1"] });
    const { result } = renderHook(() => useTaskRowData(noopUnhideRange));

    // With t1 hidden, first visible row is t2 at globalRowNumber 2 → 1 hidden above
    const firstRow = result.current.taskRowData[0];
    expect(firstRow.hasHiddenAbove).toBe(true);
    expect(firstRow.hiddenAboveCount).toBe(1);
    expect(firstRow.onUnhideAbove).toBeDefined();

    firstRow.onUnhideAbove!();
    expect(noopUnhideRange).toHaveBeenCalledOnce();
    // fromRowNum = 0 (sentinel for "before the list"), toRowNum = globalRowNumber of t2 = 2
    expect(noopUnhideRange).toHaveBeenCalledWith(0, 2);
  });

  it("should set hasHiddenBelow and call unhideRange when onUnhideBelow is invoked", () => {
    useChartStore.setState({ hiddenTaskIds: ["t3"] });
    const { result } = renderHook(() => useTaskRowData(noopUnhideRange));

    // t2 at globalRowNumber 2, t3 hidden at row 3, t4 at row 4 → gap of 1 below t2
    const rows = result.current.taskRowData;
    const t2Row = rows.find((r) => r.task.id === "t2")!;
    expect(t2Row.hasHiddenBelow).toBe(true);
    expect(t2Row.hiddenBelowCount).toBe(1);
    expect(t2Row.onUnhideBelow).toBeDefined();

    t2Row.onUnhideBelow!();
    expect(noopUnhideRange).toHaveBeenCalledOnce();
    // fromRowNum = globalRowNumber of t2 = 2, toRowNum = globalRowNumber of t4 = 4
    expect(noopUnhideRange).toHaveBeenCalledWith(2, 4);
  });

  it("should not set onUnhideAbove for first visible row when no tasks are hidden above", () => {
    const { result } = renderHook(() => useTaskRowData(noopUnhideRange));
    const firstRow = result.current.taskRowData[0];
    expect(firstRow.hasHiddenAbove).toBe(false);
    expect(firstRow.onUnhideAbove).toBeUndefined();
  });

  it("should not set onUnhideBelow for last visible row when no tasks are hidden below", () => {
    const { result } = renderHook(() => useTaskRowData(noopUnhideRange));
    const lastRow = result.current.taskRowData[result.current.taskRowData.length - 1];
    expect(lastRow.hasHiddenBelow).toBe(false);
    expect(lastRow.onUnhideBelow).toBeUndefined();
  });
});
