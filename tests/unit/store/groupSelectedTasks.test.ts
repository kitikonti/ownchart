import { describe, it, expect, beforeEach } from "vitest";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import { useHistoryStore } from "../../../src/store/slices/historySlice";
import type { Task } from "../../../src/types/chart.types";
import { tid, hex } from "../../helpers/branded";

/**
 * Helper: create a task with sensible defaults.
 */
function makeTask(overrides: Partial<Task> & { id: string; name: string }): Task {
  return {
    startDate: "2025-06-01",
    endDate: "2025-06-07",
    duration: 7,
    progress: 0,
    color: hex("#0F6CBD"),
    order: 0,
    type: "task",
    metadata: {},
    ...overrides,
    id: tid(overrides.id),
    parent: overrides.parent ? tid(overrides.parent) : undefined,
  };
}

function resetStores(): void {
  useTaskStore.setState({
    tasks: [],
    selectedTaskIds: [],
    lastSelectedTaskId: null,
    activeCell: { taskId: null, field: null },
    isEditingCell: false,
    columnWidths: {},
    taskTableWidth: null,
    clipboardTaskIds: [],
    cutCell: null,
  });
  useHistoryStore.setState({
    undoStack: [],
    redoStack: [],
    isUndoing: false,
    isRedoing: false,
  });
}

describe("groupSelectedTasks", () => {
  beforeEach(resetStores);

  it("should group 2 sibling root tasks under a new summary", () => {
    const tasks = [
      makeTask({ id: "a", name: "Task A", order: 0 }),
      makeTask({ id: "b", name: "Task B", order: 1 }),
      makeTask({ id: "c", name: "Task C", order: 2 }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["a", "b"] });

    useTaskStore.getState().groupSelectedTasks();

    const state = useTaskStore.getState();
    // Should have 4 tasks now (3 original + 1 summary)
    expect(state.tasks).toHaveLength(4);

    // Find the new summary task
    const summary = state.tasks.find((t) => t.type === "summary");
    expect(summary).toBeDefined();
    expect(summary!.name).toBe("New Group");

    // Task A and B should be children of the summary
    const taskA = state.tasks.find((t) => t.id === "a");
    const taskB = state.tasks.find((t) => t.id === "b");
    expect(taskA!.parent).toBe(summary!.id);
    expect(taskB!.parent).toBe(summary!.id);

    // Task C should remain at root level
    const taskC = state.tasks.find((t) => t.id === "c");
    expect(taskC!.parent).toBeUndefined();
  });

  it("should group a single task", () => {
    const tasks = [
      makeTask({ id: "a", name: "Task A", order: 0 }),
      makeTask({ id: "b", name: "Task B", order: 1 }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["a"] });

    useTaskStore.getState().groupSelectedTasks();

    const state = useTaskStore.getState();
    expect(state.tasks).toHaveLength(3);

    const summary = state.tasks.find((t) => t.type === "summary");
    expect(summary).toBeDefined();

    const taskA = state.tasks.find((t) => t.id === "a");
    expect(taskA!.parent).toBe(summary!.id);
  });

  it("should reject grouping when tasks have different parents", () => {
    const tasks = [
      makeTask({ id: "p1", name: "Parent 1", order: 0, type: "summary" }),
      makeTask({ id: "a", name: "Task A", order: 1, parent: "p1" }),
      makeTask({ id: "p2", name: "Parent 2", order: 2, type: "summary" }),
      makeTask({ id: "b", name: "Task B", order: 3, parent: "p2" }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["a", "b"] });

    useTaskStore.getState().groupSelectedTasks();

    const state = useTaskStore.getState();
    // No new summary should be created
    expect(state.tasks).toHaveLength(4);
    // Parents unchanged
    expect(state.tasks.find((t) => t.id === "a")!.parent).toBe("p1");
    expect(state.tasks.find((t) => t.id === "b")!.parent).toBe("p2");
  });

  it("should reject grouping when max depth would be exceeded", () => {
    // Level 0 → Level 1 → Level 2 tasks — grouping level-2 tasks would push to level 3
    const tasks = [
      makeTask({ id: "g", name: "Grandparent", order: 0, type: "summary" }),
      makeTask({ id: "p", name: "Parent", order: 1, parent: "g", type: "summary" }),
      makeTask({ id: "a", name: "Task A", order: 2, parent: "p" }),
      makeTask({ id: "b", name: "Task B", order: 3, parent: "p" }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["a", "b"] });

    useTaskStore.getState().groupSelectedTasks();

    const state = useTaskStore.getState();
    // No new summary should be created
    expect(state.tasks).toHaveLength(4);
  });

  it("should dedup parent+child: only parent moved", () => {
    const tasks = [
      makeTask({ id: "p", name: "Parent", order: 0, type: "summary" }),
      makeTask({ id: "child", name: "Child", order: 1, parent: "p" }),
      makeTask({ id: "other", name: "Other", order: 2 }),
    ];
    // Select both parent and child
    useTaskStore.setState({ tasks, selectedTaskIds: ["p", "child"] });

    useTaskStore.getState().groupSelectedTasks();

    const state = useTaskStore.getState();
    // Should create 1 new summary
    expect(state.tasks).toHaveLength(4);

    const summary = state.tasks.find(
      (t) => t.type === "summary" && t.name === "New Group"
    );
    expect(summary).toBeDefined();

    // Only parent "p" should be a direct child of the summary
    const parent = state.tasks.find((t) => t.id === "p");
    expect(parent!.parent).toBe(summary!.id);

    // "child" should remain child of "p", not of the summary
    const child = state.tasks.find((t) => t.id === "child");
    expect(child!.parent).toBe("p");
  });

  it("should calculate summary dates from children", () => {
    const tasks = [
      makeTask({
        id: "a",
        name: "Task A",
        order: 0,
        startDate: "2025-06-01",
        endDate: "2025-06-05",
        duration: 5,
      }),
      makeTask({
        id: "b",
        name: "Task B",
        order: 1,
        startDate: "2025-06-10",
        endDate: "2025-06-15",
        duration: 6,
      }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["a", "b"] });

    useTaskStore.getState().groupSelectedTasks();

    const state = useTaskStore.getState();
    const summary = state.tasks.find((t) => t.type === "summary");
    expect(summary).toBeDefined();
    expect(summary!.startDate).toBe("2025-06-01");
    expect(summary!.endDate).toBe("2025-06-15");
  });

  it("should focus summary name cell after grouping (not edit mode)", () => {
    const tasks = [
      makeTask({ id: "a", name: "Task A", order: 0 }),
      makeTask({ id: "b", name: "Task B", order: 1 }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["a", "b"] });

    useTaskStore.getState().groupSelectedTasks();

    const state = useTaskStore.getState();
    const summary = state.tasks.find((t) => t.type === "summary");
    expect(state.activeCell.taskId).toBe(summary!.id);
    expect(state.activeCell.field).toBe("name");
    // Not in edit mode — user types to start editing (Excel behavior)
    expect(state.isEditingCell).toBe(false);
  });

  it("should undo grouping: summary removed, parents restored", () => {
    const tasks = [
      makeTask({ id: "a", name: "Task A", order: 0 }),
      makeTask({ id: "b", name: "Task B", order: 1 }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["a", "b"] });

    useTaskStore.getState().groupSelectedTasks();

    // Verify group was created
    expect(useTaskStore.getState().tasks).toHaveLength(3);

    // Undo
    useHistoryStore.getState().undo();

    const state = useTaskStore.getState();
    expect(state.tasks).toHaveLength(2);
    expect(state.tasks.find((t) => t.type === "summary")).toBeUndefined();

    // Tasks should be back at root level
    expect(state.tasks.find((t) => t.id === "a")!.parent).toBeUndefined();
    expect(state.tasks.find((t) => t.id === "b")!.parent).toBeUndefined();
  });

  it("should redo grouping: re-groups correctly", () => {
    const tasks = [
      makeTask({ id: "a", name: "Task A", order: 0 }),
      makeTask({ id: "b", name: "Task B", order: 1 }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["a", "b"] });

    useTaskStore.getState().groupSelectedTasks();
    useHistoryStore.getState().undo();

    // Verify undo
    expect(useTaskStore.getState().tasks).toHaveLength(2);

    // Redo
    useHistoryStore.getState().redo();

    const state = useTaskStore.getState();
    expect(state.tasks).toHaveLength(3);

    const summary = state.tasks.find((t) => t.type === "summary");
    expect(summary).toBeDefined();
    expect(state.tasks.find((t) => t.id === "a")!.parent).toBe(summary!.id);
    expect(state.tasks.find((t) => t.id === "b")!.parent).toBe(summary!.id);
  });

  it("should group level-1 siblings under existing summary", () => {
    const tasks = [
      makeTask({ id: "parent", name: "Parent", order: 0, type: "summary" }),
      makeTask({ id: "a", name: "Task A", order: 1, parent: "parent" }),
      makeTask({ id: "b", name: "Task B", order: 2, parent: "parent" }),
      makeTask({ id: "c", name: "Task C", order: 3, parent: "parent" }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["a", "b"] });

    useTaskStore.getState().groupSelectedTasks();

    const state = useTaskStore.getState();
    // 4 original + 1 new summary = 5
    expect(state.tasks).toHaveLength(5);

    const newGroup = state.tasks.find(
      (t) => t.type === "summary" && t.name === "New Group"
    );
    expect(newGroup).toBeDefined();
    // New group should be child of "parent"
    expect(newGroup!.parent).toBe("parent");

    // Task A and B should be children of the new group
    expect(state.tasks.find((t) => t.id === "a")!.parent).toBe(newGroup!.id);
    expect(state.tasks.find((t) => t.id === "b")!.parent).toBe(newGroup!.id);

    // Task C should remain a direct child of "parent"
    expect(state.tasks.find((t) => t.id === "c")!.parent).toBe("parent");
  });

  it("should do nothing when no tasks are selected", () => {
    const tasks = [
      makeTask({ id: "a", name: "Task A", order: 0 }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: [] });

    useTaskStore.getState().groupSelectedTasks();

    expect(useTaskStore.getState().tasks).toHaveLength(1);
  });

  describe("canGroupSelection", () => {
    it("should return false when no tasks are selected", () => {
      useTaskStore.setState({
        tasks: [makeTask({ id: "a", name: "A", order: 0 })],
        selectedTaskIds: [],
      });
      expect(useTaskStore.getState().canGroupSelection()).toBe(false);
    });

    it("should return true for sibling root tasks", () => {
      useTaskStore.setState({
        tasks: [
          makeTask({ id: "a", name: "A", order: 0 }),
          makeTask({ id: "b", name: "B", order: 1 }),
        ],
        selectedTaskIds: ["a", "b"],
      });
      expect(useTaskStore.getState().canGroupSelection()).toBe(true);
    });

    it("should return false for tasks with different parents", () => {
      useTaskStore.setState({
        tasks: [
          makeTask({ id: "p1", name: "P1", order: 0, type: "summary" }),
          makeTask({ id: "a", name: "A", order: 1, parent: "p1" }),
          makeTask({ id: "b", name: "B", order: 2 }),
        ],
        selectedTaskIds: ["a", "b"],
      });
      expect(useTaskStore.getState().canGroupSelection()).toBe(false);
    });

    it("should return false when max depth would be exceeded", () => {
      useTaskStore.setState({
        tasks: [
          makeTask({ id: "g", name: "G", order: 0, type: "summary" }),
          makeTask({ id: "p", name: "P", order: 1, parent: "g", type: "summary" }),
          makeTask({ id: "a", name: "A", order: 2, parent: "p" }),
        ],
        selectedTaskIds: ["a"],
      });
      expect(useTaskStore.getState().canGroupSelection()).toBe(false);
    });
  });
});
