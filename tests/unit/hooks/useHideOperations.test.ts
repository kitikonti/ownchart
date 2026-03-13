/**
 * Tests for useHideOperations hook.
 * Verifies that hide/unhide operations correctly coordinate:
 * - chartSlice state updates (hiddenTaskIds)
 * - historySlice command recording (undo/redo)
 * - fileSlice dirty marking
 * - toast feedback
 *
 * Since useHideOperations is a thin orchestrator over Zustand stores,
 * we test it by directly invoking the same store interactions it performs.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChartStore } from "@/store/slices/chartSlice";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useHistoryStore } from "@/store/slices/historySlice";
import { useFileStore } from "@/store/slices/fileSlice";
import { buildFlattenedTaskList } from "@/utils/hierarchy";
import {
  computeHiddenIdsInSelection,
  useHideOperations,
} from "@/hooks/useHideOperations";
import { CommandType } from "@/types/command.types";
import type { Task } from "@/types/chart.types";

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createTask(
  id: string,
  name: string,
  options: Partial<Task> = {}
): Task {
  return {
    id,
    name,
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

/**
 * Simulate what useHideOperations.hideRows does without React hooks.
 * This mirrors the logic in the hook so we can test the orchestration.
 */
function simulateHideRows(taskIds: string[]): void {
  if (taskIds.length === 0) return;

  const previousHiddenTaskIds = [
    ...useChartStore.getState().hiddenTaskIds,
  ];
  useChartStore.getState().hideTasks(taskIds);
  useFileStore.getState().markDirty();

  const newHiddenIds = useChartStore.getState().hiddenTaskIds;
  const newlyHidden = newHiddenIds.length - previousHiddenTaskIds.length;

  const prevSet = new Set(previousHiddenTaskIds);
  useHistoryStore.getState().recordCommand({
    id: "test-cmd",
    type: CommandType.HIDE_TASKS,
    timestamp: Date.now(),
    description: `Hide ${newlyHidden} task${newlyHidden !== 1 ? "s" : ""}`,
    params: {
      taskIds: newHiddenIds.filter((id) => !prevSet.has(id)),
      previousHiddenTaskIds,
    },
  });
}

/**
 * Simulate what useHideOperations.showAll does.
 */
function simulateShowAll(): void {
  const hiddenTaskIds = useChartStore.getState().hiddenTaskIds;
  if (hiddenTaskIds.length === 0) return;

  const previousHiddenTaskIds = [...hiddenTaskIds];
  useChartStore.getState().unhideAll();
  useFileStore.getState().markDirty();

  useHistoryStore.getState().recordCommand({
    id: "test-cmd",
    type: CommandType.UNHIDE_TASKS,
    timestamp: Date.now(),
    description: `Show all ${previousHiddenTaskIds.length} hidden tasks`,
    params: {
      taskIds: previousHiddenTaskIds,
      previousHiddenTaskIds,
    },
  });
}

/**
 * Simulate what useHideOperations.unhideRange does.
 */
function simulateUnhideRange(fromRowNum: number, toRowNum: number): void {
  const tasks = useTaskStore.getState().tasks;
  const collapsedIds = new Set(
    tasks.filter((t) => t.open === false).map((t) => t.id)
  );
  const allFlattenedTasks = buildFlattenedTaskList(tasks, collapsedIds);

  const idsToUnhide = allFlattenedTasks
    .filter(
      (item) =>
        item.globalRowNumber > fromRowNum && item.globalRowNumber < toRowNum
    )
    .map((item) => item.task.id);

  if (idsToUnhide.length === 0) return;

  const previousHiddenTaskIds = [
    ...useChartStore.getState().hiddenTaskIds,
  ];
  useChartStore.getState().unhideTasks(idsToUnhide);
  useFileStore.getState().markDirty();

  useHistoryStore.getState().recordCommand({
    id: "test-cmd",
    type: CommandType.UNHIDE_TASKS,
    timestamp: Date.now(),
    description: `Show ${idsToUnhide.length} hidden task${idsToUnhide.length !== 1 ? "s" : ""}`,
    params: {
      taskIds: idsToUnhide,
      previousHiddenTaskIds,
    },
  });
}

/**
 * Simulate what useHideOperations.getHiddenIdsInSelection does.
 */
function simulateGetHiddenIdsInSelection(
  selectedTaskIds: string[]
): string[] {
  if (selectedTaskIds.length < 2) return [];

  const tasks = useTaskStore.getState().tasks;
  const collapsedIds = new Set(
    tasks.filter((t) => t.open === false).map((t) => t.id)
  );
  const allFlattenedTasks = buildFlattenedTaskList(tasks, collapsedIds);
  const hiddenSet = new Set(useChartStore.getState().hiddenTaskIds);
  const flattenedTasks = allFlattenedTasks.filter(
    (item) => !hiddenSet.has(item.task.id)
  );

  const selectedSet = new Set(selectedTaskIds);
  const selectedRowNums = flattenedTasks
    .filter(({ task }) => selectedSet.has(task.id))
    .map(({ globalRowNumber }) => globalRowNumber)
    .sort((a, b) => a - b);

  if (selectedRowNums.length < 2) return [];

  const firstRow = selectedRowNums[0];
  const lastRow = selectedRowNums[selectedRowNums.length - 1];

  return allFlattenedTasks
    .filter(
      (item) =>
        item.globalRowNumber >= firstRow &&
        item.globalRowNumber <= lastRow &&
        hiddenSet.has(item.task.id)
    )
    .map((item) => item.task.id);
}

/**
 * Simulate what useHideOperations.unhideSelection does.
 */
function simulateUnhideSelection(selectedTaskIds: string[]): void {
  const idsToUnhide = simulateGetHiddenIdsInSelection(selectedTaskIds);
  if (idsToUnhide.length === 0) return;

  const previousHiddenTaskIds = [
    ...useChartStore.getState().hiddenTaskIds,
  ];
  useChartStore.getState().unhideTasks(idsToUnhide);
  useFileStore.getState().markDirty();

  useHistoryStore.getState().recordCommand({
    id: "test-cmd",
    type: CommandType.UNHIDE_TASKS,
    timestamp: Date.now(),
    description: `Show ${idsToUnhide.length} hidden task${idsToUnhide.length !== 1 ? "s" : ""}`,
    params: {
      taskIds: idsToUnhide,
      previousHiddenTaskIds,
    },
  });
}

describe("useHideOperations orchestration", () => {
  beforeEach(() => {
    useChartStore.setState({ hiddenTaskIds: [] });
    useHistoryStore.setState({ undoStack: [], redoStack: [] });
    useFileStore.getState().markClean();
    useTaskStore.setState({
      tasks: [
        createTask("1", "Task 1", { order: 0 }),
        createTask("2", "Task 2", { order: 1 }),
        createTask("3", "Task 3", { order: 2 }),
        createTask("4", "Task 4", { order: 3 }),
        createTask("5", "Task 5", { order: 4 }),
      ],
    });
    vi.clearAllMocks();
  });

  describe("hideRows", () => {
    it("should hide tasks, mark dirty, and record command", () => {
      simulateHideRows(["2", "3"]);

      // State updated
      expect(useChartStore.getState().hiddenTaskIds).toContain("2");
      expect(useChartStore.getState().hiddenTaskIds).toContain("3");

      // File marked dirty
      expect(useFileStore.getState().isDirty).toBe(true);

      // Command recorded
      const undoStack = useHistoryStore.getState().undoStack;
      expect(undoStack).toHaveLength(1);
      expect(undoStack[0].type).toBe(CommandType.HIDE_TASKS);
      expect(undoStack[0].params).toEqual({
        taskIds: ["2", "3"],
        previousHiddenTaskIds: [],
      });
    });

    it("should not act on empty task list", () => {
      simulateHideRows([]);

      expect(useChartStore.getState().hiddenTaskIds).toEqual([]);
      expect(useHistoryStore.getState().undoStack).toHaveLength(0);
    });

    it("should record only newly hidden IDs when some are already hidden", () => {
      useChartStore.getState().setHiddenTaskIds(["1"]);

      simulateHideRows(["1", "2"]);

      const undoStack = useHistoryStore.getState().undoStack;
      expect(undoStack[0].params).toEqual({
        taskIds: ["2"], // only newly hidden
        previousHiddenTaskIds: ["1"],
      });
    });

    it("should include descendants when hiding a summary task", () => {
      useTaskStore.setState({
        tasks: [
          createTask("parent", "Parent", { order: 0, type: "summary" }),
          createTask("child1", "Child 1", { order: 1, parent: "parent" }),
          createTask("child2", "Child 2", { order: 2, parent: "parent" }),
          createTask("other", "Other", { order: 3 }),
        ],
      });

      simulateHideRows(["parent"]);

      const hidden = useChartStore.getState().hiddenTaskIds;
      expect(hidden).toContain("parent");
      expect(hidden).toContain("child1");
      expect(hidden).toContain("child2");
      expect(hidden).not.toContain("other");
    });
  });

  describe("showAll", () => {
    it("should unhide all tasks, mark dirty, and record command", () => {
      useChartStore.getState().setHiddenTaskIds(["1", "2", "3"]);
      useFileStore.getState().markClean();

      simulateShowAll();

      // State cleared
      expect(useChartStore.getState().hiddenTaskIds).toEqual([]);

      // File marked dirty
      expect(useFileStore.getState().isDirty).toBe(true);

      // Command recorded
      const undoStack = useHistoryStore.getState().undoStack;
      expect(undoStack).toHaveLength(1);
      expect(undoStack[0].type).toBe(CommandType.UNHIDE_TASKS);
      expect(undoStack[0].params).toEqual({
        taskIds: ["1", "2", "3"],
        previousHiddenTaskIds: ["1", "2", "3"],
      });
    });

    it("should not act when no tasks are hidden", () => {
      simulateShowAll();

      expect(useHistoryStore.getState().undoStack).toHaveLength(0);
    });
  });

  describe("unhideRange", () => {
    it("should unhide tasks in a specific row range", () => {
      // Hide tasks 2 and 3
      useChartStore.getState().hideTasks(["2", "3"]);
      useFileStore.getState().markClean();

      // Unhide between row 1 and row 4 (exclusive) — should find rows 2 and 3
      simulateUnhideRange(1, 4);

      expect(useChartStore.getState().hiddenTaskIds).toEqual([]);
      expect(useFileStore.getState().isDirty).toBe(true);

      const undoStack = useHistoryStore.getState().undoStack;
      expect(undoStack).toHaveLength(1);
      expect(undoStack[0].type).toBe(CommandType.UNHIDE_TASKS);
    });

    it("should not act when range contains no tasks", () => {
      simulateUnhideRange(10, 20);

      expect(useHistoryStore.getState().undoStack).toHaveLength(0);
    });

    it("should only unhide tasks within the given range", () => {
      // Hide tasks 2, 3, 4
      useChartStore.getState().hideTasks(["2", "3", "4"]);

      // Only unhide between row 1 and row 3 (exclusive) — should find row 2 only
      simulateUnhideRange(1, 3);

      const hidden = useChartStore.getState().hiddenTaskIds;
      expect(hidden).not.toContain("2");
      expect(hidden).toContain("3");
      expect(hidden).toContain("4");
    });
  });

  describe("undo/redo integration", () => {
    it("should undo hideRows and restore previous state", () => {
      simulateHideRows(["2", "3"]);
      expect(useChartStore.getState().hiddenTaskIds).toContain("2");

      useHistoryStore.getState().undo();
      expect(useChartStore.getState().hiddenTaskIds).toEqual([]);
    });

    it("should redo hideRows after undo", () => {
      simulateHideRows(["2"]);
      useHistoryStore.getState().undo();
      expect(useChartStore.getState().hiddenTaskIds).toEqual([]);

      useHistoryStore.getState().redo();
      expect(useChartStore.getState().hiddenTaskIds).toContain("2");
    });

    it("should undo showAll and restore hidden tasks", () => {
      useChartStore.getState().setHiddenTaskIds(["1", "3"]);
      simulateShowAll();
      expect(useChartStore.getState().hiddenTaskIds).toEqual([]);

      useHistoryStore.getState().undo();
      expect(useChartStore.getState().hiddenTaskIds).toEqual(["1", "3"]);
    });

    it("should undo unhideRange and restore hidden tasks", () => {
      useChartStore.getState().hideTasks(["2", "3"]);
      const prevHidden = [...useChartStore.getState().hiddenTaskIds];

      simulateUnhideRange(1, 4);
      expect(useChartStore.getState().hiddenTaskIds).toEqual([]);

      useHistoryStore.getState().undo();
      expect(useChartStore.getState().hiddenTaskIds).toEqual(prevHidden);
    });
  });

  describe("getHiddenInSelectionCount", () => {
    it("should return 0 when fewer than 2 tasks are selected", () => {
      useChartStore.getState().hideTasks(["2"]);

      expect(simulateGetHiddenIdsInSelection([]).length).toBe(0);
      expect(simulateGetHiddenIdsInSelection(["1"]).length).toBe(0);
    });

    it("should return 0 when no hidden tasks exist in selection range", () => {
      // Tasks 1,2,3 visible, select 1 and 3 — nothing hidden between
      expect(simulateGetHiddenIdsInSelection(["1", "3"]).length).toBe(0);
    });

    it("should count hidden tasks spanned by selection", () => {
      // Hide task 3, then select tasks 2 and 4 (spanning the hidden task 3)
      useChartStore.getState().hideTasks(["3"]);

      const count = simulateGetHiddenIdsInSelection(["2", "4"]).length;
      expect(count).toBe(1);
    });

    it("should count multiple hidden tasks in range", () => {
      // Hide tasks 2 and 3, select tasks 1 and 4
      useChartStore.getState().hideTasks(["2", "3"]);

      const count = simulateGetHiddenIdsInSelection(["1", "4"]).length;
      expect(count).toBe(2);
    });

    it("should not count hidden tasks outside selection range", () => {
      // Hide tasks 2 and 5, select tasks 1 and 3 — only task 2 is in range
      useChartStore.getState().hideTasks(["2", "5"]);

      const count = simulateGetHiddenIdsInSelection(["1", "3"]).length;
      expect(count).toBe(1);
    });
  });

  describe("unhideSelection", () => {
    it("should unhide hidden tasks within selection range", () => {
      useChartStore.getState().hideTasks(["3"]);
      useFileStore.getState().markClean();

      simulateUnhideSelection(["2", "4"]);

      expect(useChartStore.getState().hiddenTaskIds).not.toContain("3");
      expect(useFileStore.getState().isDirty).toBe(true);

      const undoStack = useHistoryStore.getState().undoStack;
      expect(undoStack).toHaveLength(1);
      expect(undoStack[0].type).toBe(CommandType.UNHIDE_TASKS);
      expect(undoStack[0].params.taskIds).toEqual(["3"]);
    });

    it("should not act when fewer than 2 tasks selected", () => {
      useChartStore.getState().hideTasks(["2"]);

      simulateUnhideSelection(["1"]);

      expect(useChartStore.getState().hiddenTaskIds).toContain("2");
      expect(useHistoryStore.getState().undoStack).toHaveLength(0);
    });

    it("should not act when no hidden tasks in selection range", () => {
      simulateUnhideSelection(["1", "3"]);

      expect(useHistoryStore.getState().undoStack).toHaveLength(0);
    });

    it("should undo unhideSelection and restore hidden state", () => {
      useChartStore.getState().hideTasks(["3"]);
      const prevHidden = [...useChartStore.getState().hiddenTaskIds];

      simulateUnhideSelection(["2", "4"]);
      expect(useChartStore.getState().hiddenTaskIds).not.toContain("3");

      useHistoryStore.getState().undo();
      expect(useChartStore.getState().hiddenTaskIds).toEqual(prevHidden);
    });
  });
});

// ── Pure function tests for computeHiddenIdsInSelection ───────────────────────

describe("computeHiddenIdsInSelection", () => {
  function makeFlattenedTasks(
    ids: string[],
    hiddenIds: Set<string> = new Set()
  ) {
    const tasks = ids.map((id, i) =>
      createTask(id, `Task ${id}`, { order: i })
    );
    const all = buildFlattenedTaskList(tasks, new Set());
    const visible = all.filter((item) => !hiddenIds.has(item.task.id));
    return { all, visible };
  }

  it("should return empty array when fewer than 2 tasks selected", () => {
    const { all, visible } = makeFlattenedTasks(["1", "2", "3"]);
    expect(computeHiddenIdsInSelection([], visible, all, [])).toEqual([]);
    expect(computeHiddenIdsInSelection(["1"], visible, all, [])).toEqual([]);
  });

  it("should return empty array when no hidden tasks in selection range", () => {
    const { all, visible } = makeFlattenedTasks(["1", "2", "3"]);
    expect(computeHiddenIdsInSelection(["1", "3"], visible, all, [])).toEqual(
      []
    );
  });

  it("should return hidden task IDs within the row range", () => {
    const hiddenIds = new Set(["3"]);
    const { all, visible } = makeFlattenedTasks(
      ["1", "2", "3", "4", "5"],
      hiddenIds
    );
    const result = computeHiddenIdsInSelection(
      ["2", "4"],
      visible,
      all,
      ["3"]
    );
    expect(result).toEqual(["3"]);
  });

  it("should return multiple hidden task IDs within range", () => {
    const hiddenIds = new Set(["2", "3"]);
    const { all, visible } = makeFlattenedTasks(
      ["1", "2", "3", "4"],
      hiddenIds
    );
    const result = computeHiddenIdsInSelection(
      ["1", "4"],
      visible,
      all,
      ["2", "3"]
    );
    expect(result).toContain("2");
    expect(result).toContain("3");
    expect(result).toHaveLength(2);
  });

  it("should not return hidden tasks outside the selection range", () => {
    const hiddenIds = new Set(["2", "5"]);
    const { all, visible } = makeFlattenedTasks(
      ["1", "2", "3", "4", "5"],
      hiddenIds
    );
    const result = computeHiddenIdsInSelection(
      ["1", "3"],
      visible,
      all,
      ["2", "5"]
    );
    expect(result).toEqual(["2"]);
  });

  it("should return empty array when selected tasks are themselves hidden (not in flattenedTasks)", () => {
    // Tasks 2 and 4 are hidden — they are absent from flattenedTasks.
    // Selecting them yields fewer than 2 matches in flattenedTasks, so the function
    // returns [] rather than computing a range from stale row numbers.
    const hiddenIds = new Set(["2", "3", "4"]);
    const { all, visible } = makeFlattenedTasks(
      ["1", "2", "3", "4", "5"],
      hiddenIds
    );
    // Select two hidden tasks — neither appears in visible list
    const result = computeHiddenIdsInSelection(
      ["2", "4"],
      visible,
      all,
      ["2", "3", "4"]
    );
    expect(result).toEqual([]);
  });

  it("should return empty array when only one selected task is visible", () => {
    // Task 3 is hidden. Selecting tasks 2 (visible) and 3 (hidden) gives only
    // one match in flattenedTasks — not enough to establish a range.
    const hiddenIds = new Set(["3"]);
    const { all, visible } = makeFlattenedTasks(
      ["1", "2", "3", "4"],
      hiddenIds
    );
    const result = computeHiddenIdsInSelection(
      ["2", "3"],
      visible,
      all,
      ["3"]
    );
    // selectedRowNums has only one entry (task 2), so returns []
    expect(result).toEqual([]);
  });
});

// ── useHideOperations hook interface tests ────────────────────────────────────
// These tests render the actual hook via renderHook to verify that the
// useCallback wiring and dependency arrays are correct. They complement the
// orchestration tests above which simulate the store interactions directly.

describe("useHideOperations hook interface", () => {
  beforeEach(() => {
    useChartStore.setState({ hiddenTaskIds: [] });
    useHistoryStore.setState({ undoStack: [], redoStack: [] });
    useFileStore.getState().markClean();
    useTaskStore.setState({
      tasks: [
        createTask("1", "Task 1", { order: 0 }),
        createTask("2", "Task 2", { order: 1 }),
        createTask("3", "Task 3", { order: 2 }),
        createTask("4", "Task 4", { order: 3 }),
      ],
    });
    vi.clearAllMocks();
  });

  it("should expose hideRows, showAll, unhideRange, unhideSelection, getHiddenInSelectionCount", () => {
    const { result } = renderHook(() => useHideOperations());
    expect(typeof result.current.hideRows).toBe("function");
    expect(typeof result.current.showAll).toBe("function");
    expect(typeof result.current.unhideRange).toBe("function");
    expect(typeof result.current.unhideSelection).toBe("function");
    expect(typeof result.current.getHiddenInSelectionCount).toBe("function");
  });

  it("hideRows should hide tasks, mark dirty, and push undo command", () => {
    const { result } = renderHook(() => useHideOperations());

    act(() => {
      result.current.hideRows(["2", "3"]);
    });

    expect(useChartStore.getState().hiddenTaskIds).toContain("2");
    expect(useChartStore.getState().hiddenTaskIds).toContain("3");
    expect(useFileStore.getState().isDirty).toBe(true);
    const undoStack = useHistoryStore.getState().undoStack;
    expect(undoStack).toHaveLength(1);
    expect(undoStack[0].type).toBe(CommandType.HIDE_TASKS);
  });

  it("hideRows should do nothing for an empty ID list", () => {
    const { result } = renderHook(() => useHideOperations());

    act(() => {
      result.current.hideRows([]);
    });

    expect(useChartStore.getState().hiddenTaskIds).toHaveLength(0);
    expect(useHistoryStore.getState().undoStack).toHaveLength(0);
  });

  it("showAll should unhide all tasks and push undo command", () => {
    useChartStore.getState().setHiddenTaskIds(["1", "2"]);
    const { result } = renderHook(() => useHideOperations());

    act(() => {
      result.current.showAll();
    });

    expect(useChartStore.getState().hiddenTaskIds).toHaveLength(0);
    expect(useFileStore.getState().isDirty).toBe(true);
    const undoStack = useHistoryStore.getState().undoStack;
    expect(undoStack).toHaveLength(1);
    expect(undoStack[0].type).toBe(CommandType.UNHIDE_TASKS);
  });

  it("showAll should do nothing when no tasks are hidden", () => {
    const { result } = renderHook(() => useHideOperations());

    act(() => {
      result.current.showAll();
    });

    expect(useHistoryStore.getState().undoStack).toHaveLength(0);
  });

  it("unhideRange should unhide tasks within the given row range (exclusive)", () => {
    useChartStore.getState().hideTasks(["2", "3"]);
    useFileStore.getState().markClean();
    const { result } = renderHook(() => useHideOperations());

    act(() => {
      // rows 2 and 3 fall between fromRowNum=1 and toRowNum=4 (exclusive)
      result.current.unhideRange(1, 4);
    });

    expect(useChartStore.getState().hiddenTaskIds).toHaveLength(0);
    expect(useFileStore.getState().isDirty).toBe(true);
  });

  it("getHiddenInSelectionCount should return 0 when fewer than 2 tasks selected", () => {
    useChartStore.getState().hideTasks(["2"]);
    const { result } = renderHook(() => useHideOperations());

    const count = result.current.getHiddenInSelectionCount(["1"]);
    expect(count).toBe(0);
  });

  it("getHiddenInSelectionCount should count hidden tasks spanned by selection", () => {
    useChartStore.getState().hideTasks(["3"]);
    const { result } = renderHook(() => useHideOperations());

    // Tasks 2 and 4 visible, task 3 hidden between them
    const count = result.current.getHiddenInSelectionCount(["2", "4"]);
    expect(count).toBe(1);
  });

  it("unhideSelection should unhide tasks spanned by the selection", () => {
    useChartStore.getState().hideTasks(["3"]);
    useFileStore.getState().markClean();
    const { result } = renderHook(() => useHideOperations());

    act(() => {
      result.current.unhideSelection(["2", "4"]);
    });

    expect(useChartStore.getState().hiddenTaskIds).not.toContain("3");
    expect(useFileStore.getState().isDirty).toBe(true);
    const undoStack = useHistoryStore.getState().undoStack;
    expect(undoStack).toHaveLength(1);
    expect(undoStack[0].type).toBe(CommandType.UNHIDE_TASKS);
  });
});
