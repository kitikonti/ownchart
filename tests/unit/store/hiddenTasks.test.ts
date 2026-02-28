/**
 * Tests for Hide/Show Rows feature
 * Tests chartSlice hiddenTaskIds state and actions,
 * globalRowNumber assignment, gap detection, and undo/redo.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useChartStore } from "../../../src/store/slices/chartSlice";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import { useHistoryStore } from "../../../src/store/slices/historySlice";
import { buildFlattenedTaskList } from "../../../src/utils/hierarchy";
import { CommandType } from "../../../src/types/command.types";
import type { Task } from "../../../src/types/chart.types";
import { tid, hex } from "../../helpers/branded";

// Helper to create a minimal task
function createTask(
  id: string,
  name: string,
  options: Partial<Task> = {}
): Task {
  return {
    id: tid(id),
    name,
    startDate: "2025-01-01",
    endDate: "2025-01-05",
    duration: 5,
    progress: 0,
    color: hex("#3b82f6"),
    order: 0,
    metadata: {},
    type: "task",
    ...options,
  };
}

describe("hiddenTaskIds state", () => {
  beforeEach(() => {
    useChartStore.setState({ hiddenTaskIds: [] });
    useTaskStore.setState({
      tasks: [
        createTask("1", "Task 1", { order: 0 }),
        createTask("2", "Task 2", { order: 1 }),
        createTask("3", "Task 3", { order: 2 }),
        createTask("4", "Task 4", { order: 3 }),
      ],
    });
  });

  it("should start with empty hiddenTaskIds", () => {
    expect(useChartStore.getState().hiddenTaskIds).toEqual([]);
  });

  it("should hide a single task", () => {
    useChartStore.getState().hideTasks(["2"]);
    expect(useChartStore.getState().hiddenTaskIds).toEqual(["2"]);
  });

  it("should hide multiple tasks", () => {
    useChartStore.getState().hideTasks(["1", "3"]);
    expect(useChartStore.getState().hiddenTaskIds).toContain("1");
    expect(useChartStore.getState().hiddenTaskIds).toContain("3");
    expect(useChartStore.getState().hiddenTaskIds).toHaveLength(2);
  });

  it("should not duplicate when hiding already-hidden tasks", () => {
    useChartStore.getState().hideTasks(["2"]);
    useChartStore.getState().hideTasks(["2", "3"]);
    const hidden = useChartStore.getState().hiddenTaskIds;
    expect(hidden.filter((id) => id === "2")).toHaveLength(1);
    expect(hidden).toContain("3");
  });

  it("should unhide specific tasks", () => {
    useChartStore.getState().hideTasks(["1", "2", "3"]);
    useChartStore.getState().unhideTasks(["2"]);
    const hidden = useChartStore.getState().hiddenTaskIds;
    expect(hidden).toContain("1");
    expect(hidden).not.toContain("2");
    expect(hidden).toContain("3");
  });

  it("should unhide all tasks", () => {
    useChartStore.getState().hideTasks(["1", "2", "3"]);
    useChartStore.getState().unhideAll();
    expect(useChartStore.getState().hiddenTaskIds).toEqual([]);
  });

  it("should set hidden task IDs directly", () => {
    useChartStore.getState().setHiddenTaskIds(["1", "4"]);
    expect(useChartStore.getState().hiddenTaskIds).toEqual(["1", "4"]);
  });
});

describe("hideTasks with summary task descendants", () => {
  beforeEach(() => {
    useChartStore.setState({ hiddenTaskIds: [] });
    useTaskStore.setState({
      tasks: [
        createTask("parent", "Parent", {
          order: 0,
          type: "summary",
        }),
        createTask("child1", "Child 1", {
          order: 1,
          parent: "parent",
        }),
        createTask("child2", "Child 2", {
          order: 2,
          parent: "parent",
        }),
        createTask("grandchild", "Grandchild", {
          order: 3,
          parent: "child1",
        }),
        createTask("other", "Other", { order: 4 }),
      ],
    });
  });

  it("should hide summary task and all descendants", () => {
    useChartStore.getState().hideTasks(["parent"]);
    const hidden = useChartStore.getState().hiddenTaskIds;
    expect(hidden).toContain("parent");
    expect(hidden).toContain("child1");
    expect(hidden).toContain("child2");
    expect(hidden).toContain("grandchild");
    expect(hidden).not.toContain("other");
  });

  it("should hide individual child without affecting parent", () => {
    useChartStore.getState().hideTasks(["child2"]);
    const hidden = useChartStore.getState().hiddenTaskIds;
    expect(hidden).toEqual(["child2"]);
  });
});

describe("globalRowNumber in buildFlattenedTaskList", () => {
  it("should assign sequential globalRowNumber starting at 1", () => {
    const tasks: Task[] = [
      createTask("1", "Task 1", { order: 0 }),
      createTask("2", "Task 2", { order: 1 }),
      createTask("3", "Task 3", { order: 2 }),
    ];

    const result = buildFlattenedTaskList(tasks, new Set());
    expect(result[0].globalRowNumber).toBe(1);
    expect(result[1].globalRowNumber).toBe(2);
    expect(result[2].globalRowNumber).toBe(3);
  });

  it("should assign globalRowNumber respecting collapsed state", () => {
    const tasks: Task[] = [
      createTask("parent", "Parent", {
        order: 0,
        type: "summary",
      }),
      createTask("child1", "Child 1", {
        order: 1,
        parent: "parent",
      }),
      createTask("child2", "Child 2", {
        order: 2,
        parent: "parent",
      }),
      createTask("next", "Next Task", { order: 3 }),
    ];

    // Not collapsed: parent(1), child1(2), child2(3), next(4)
    const expanded = buildFlattenedTaskList(tasks, new Set());
    expect(expanded).toHaveLength(4);
    expect(expanded[0].globalRowNumber).toBe(1);
    expect(expanded[3].globalRowNumber).toBe(4);

    // Collapsed: parent(1), next(2)
    const collapsed = buildFlattenedTaskList(tasks, new Set(["parent"]));
    expect(collapsed).toHaveLength(2);
    expect(collapsed[0].globalRowNumber).toBe(1);
    expect(collapsed[1].globalRowNumber).toBe(2);
  });
});

describe("hidden row gap detection", () => {
  it("should detect gaps between visible rows", () => {
    const tasks: Task[] = [
      createTask("1", "Task 1", { order: 0 }),
      createTask("2", "Task 2", { order: 1 }),
      createTask("3", "Task 3", { order: 2 }),
      createTask("4", "Task 4", { order: 3 }),
      createTask("5", "Task 5", { order: 4 }),
    ];

    const allFlattened = buildFlattenedTaskList(tasks, new Set());
    // Simulate hiding tasks 2 and 3
    const hiddenSet = new Set(["2", "3"]);
    const visible = allFlattened.filter(
      (item) => !hiddenSet.has(item.task.id)
    );

    // Visible: 1(rowNum=1), 4(rowNum=4), 5(rowNum=5)
    expect(visible).toHaveLength(3);
    expect(visible[0].globalRowNumber).toBe(1);
    expect(visible[1].globalRowNumber).toBe(4);
    expect(visible[2].globalRowNumber).toBe(5);

    // Gap between row 1 and row 4 = 4 - 1 - 1 = 2 hidden rows
    const gap = visible[1].globalRowNumber - visible[0].globalRowNumber - 1;
    expect(gap).toBe(2);
  });

  it("should detect gap at the beginning", () => {
    const tasks: Task[] = [
      createTask("1", "Task 1", { order: 0 }),
      createTask("2", "Task 2", { order: 1 }),
      createTask("3", "Task 3", { order: 2 }),
    ];

    const allFlattened = buildFlattenedTaskList(tasks, new Set());
    const hiddenSet = new Set(["1"]);
    const visible = allFlattened.filter(
      (item) => !hiddenSet.has(item.task.id)
    );

    // Visible: 2(rowNum=2), 3(rowNum=3)
    // Gap before first visible: 2 - 0 - 1 = 1
    const firstGap = visible[0].globalRowNumber - 0 - 1;
    expect(firstGap).toBe(1);
  });

  it("should detect gap at the end", () => {
    const tasks: Task[] = [
      createTask("1", "Task 1", { order: 0 }),
      createTask("2", "Task 2", { order: 1 }),
      createTask("3", "Task 3", { order: 2 }),
    ];

    const allFlattened = buildFlattenedTaskList(tasks, new Set());
    const hiddenSet = new Set(["3"]);
    const visible = allFlattened.filter(
      (item) => !hiddenSet.has(item.task.id)
    );

    // Visible: 1(rowNum=1), 2(rowNum=2)
    // Trailing gap: totalRows(3) - lastVisible.globalRowNumber(2) = 1
    const trailingGap =
      allFlattened.length - visible[visible.length - 1].globalRowNumber;
    expect(trailingGap).toBe(1);
  });
});

describe("setViewSettings with hiddenTaskIds", () => {
  beforeEach(() => {
    useChartStore.setState({ hiddenTaskIds: [] });
  });

  it("should restore hiddenTaskIds from view settings", () => {
    useChartStore.getState().setViewSettings({
      hiddenTaskIds: ["a", "b", "c"],
    });
    expect(useChartStore.getState().hiddenTaskIds).toEqual(["a", "b", "c"]);
  });

  it("should not change hiddenTaskIds when not provided in settings", () => {
    useChartStore.getState().setHiddenTaskIds(["x"]);
    useChartStore.getState().setViewSettings({
      zoom: 1.5,
    });
    expect(useChartStore.getState().hiddenTaskIds).toEqual(["x"]);
  });
});

describe("undo/redo for hide/unhide", () => {
  beforeEach(() => {
    useChartStore.setState({ hiddenTaskIds: [] });
    useHistoryStore.setState({ undoStack: [], redoStack: [] });
    useTaskStore.setState({
      tasks: [
        createTask("1", "Task 1", { order: 0 }),
        createTask("2", "Task 2", { order: 1 }),
        createTask("3", "Task 3", { order: 2 }),
      ],
    });
  });

  it("should undo hide operation", () => {
    // Hide tasks
    const previousHiddenTaskIds: string[] = [];
    useChartStore.getState().hideTasks(["2"]);

    useHistoryStore.getState().recordCommand({
      id: "test-hide",
      type: CommandType.HIDE_TASKS,
      timestamp: Date.now(),
      description: "Hide 1 task",
      params: {
        taskIds: ["2"],
        previousHiddenTaskIds,
      },
    });

    expect(useChartStore.getState().hiddenTaskIds).toEqual(["2"]);

    // Undo
    useHistoryStore.getState().undo();
    expect(useChartStore.getState().hiddenTaskIds).toEqual([]);
  });

  it("should redo hide operation", () => {
    // Hide tasks
    const previousHiddenTaskIds: string[] = [];
    useChartStore.getState().hideTasks(["2"]);

    useHistoryStore.getState().recordCommand({
      id: "test-hide",
      type: CommandType.HIDE_TASKS,
      timestamp: Date.now(),
      description: "Hide 1 task",
      params: {
        taskIds: ["2"],
        previousHiddenTaskIds,
      },
    });

    // Undo then redo
    useHistoryStore.getState().undo();
    expect(useChartStore.getState().hiddenTaskIds).toEqual([]);

    useHistoryStore.getState().redo();
    expect(useChartStore.getState().hiddenTaskIds).toContain("2");
  });

  it("should undo unhide operation", () => {
    // Start with hidden tasks
    useChartStore.getState().setHiddenTaskIds(["1", "2"]);

    // Unhide task 2
    const previousHiddenTaskIds = ["1", "2"];
    useChartStore.getState().unhideTasks(["2"]);

    useHistoryStore.getState().recordCommand({
      id: "test-unhide",
      type: CommandType.UNHIDE_TASKS,
      timestamp: Date.now(),
      description: "Show 1 task",
      params: {
        taskIds: ["2"],
        previousHiddenTaskIds,
      },
    });

    expect(useChartStore.getState().hiddenTaskIds).toEqual(["1"]);

    // Undo should restore both hidden
    useHistoryStore.getState().undo();
    expect(useChartStore.getState().hiddenTaskIds).toEqual(["1", "2"]);
  });

  it("should redo unhide operation", () => {
    // Start with hidden tasks
    useChartStore.getState().setHiddenTaskIds(["1", "2"]);

    // Unhide task 2
    const previousHiddenTaskIds = ["1", "2"];
    useChartStore.getState().unhideTasks(["2"]);

    useHistoryStore.getState().recordCommand({
      id: "test-unhide",
      type: CommandType.UNHIDE_TASKS,
      timestamp: Date.now(),
      description: "Show 1 task",
      params: {
        taskIds: ["2"],
        previousHiddenTaskIds,
      },
    });

    // Undo then redo
    useHistoryStore.getState().undo();
    expect(useChartStore.getState().hiddenTaskIds).toEqual(["1", "2"]);

    useHistoryStore.getState().redo();
    expect(useChartStore.getState().hiddenTaskIds).toEqual(["1"]);
  });
});
