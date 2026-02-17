import { describe, it, expect, beforeEach } from "vitest";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import { useHistoryStore } from "../../../src/store/slices/historySlice";
import { useDependencyStore } from "../../../src/store/slices/dependencySlice";
import type { Task } from "../../../src/types/chart.types";
import type { Dependency } from "../../../src/types/dependency.types";

function makeTask(
  overrides: Partial<Task> & { id: string; name: string }
): Task {
  return {
    startDate: "2025-06-01",
    endDate: "2025-06-07",
    duration: 7,
    progress: 0,
    color: "#0F6CBD",
    order: 0,
    type: "task",
    metadata: {},
    ...overrides,
  };
}

function makeDep(
  overrides: Partial<Dependency> & { id: string; fromTaskId: string; toTaskId: string }
): Dependency {
  return {
    type: "finish-to-start",
    lag: 0,
    ...overrides,
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
  useDependencyStore.setState({
    dependencies: [],
    selectedDependencyId: null,
  });
}

describe("ungroupSelectedTasks", () => {
  beforeEach(resetStores);

  it("should ungroup a simple summary with 2 children to root", () => {
    const tasks = [
      makeTask({
        id: "summary",
        name: "Group",
        order: 0,
        type: "summary",
        open: true,
      }),
      makeTask({ id: "a", name: "Task A", order: 1, parent: "summary" }),
      makeTask({ id: "b", name: "Task B", order: 2, parent: "summary" }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["summary"] });

    useTaskStore.getState().ungroupSelectedTasks();

    const state = useTaskStore.getState();
    // Summary should be deleted
    expect(state.tasks).toHaveLength(2);
    expect(state.tasks.find((t) => t.id === "summary")).toBeUndefined();

    // Children should be at root level
    expect(state.tasks.find((t) => t.id === "a")!.parent).toBeUndefined();
    expect(state.tasks.find((t) => t.id === "b")!.parent).toBeUndefined();
  });

  it("should reparent children to grandparent when summary has a parent", () => {
    const tasks = [
      makeTask({
        id: "grandparent",
        name: "Grandparent",
        order: 0,
        type: "summary",
        open: true,
      }),
      makeTask({
        id: "summary",
        name: "Group",
        order: 1,
        type: "summary",
        parent: "grandparent",
        open: true,
      }),
      makeTask({ id: "a", name: "Task A", order: 2, parent: "summary" }),
      makeTask({ id: "b", name: "Task B", order: 3, parent: "summary" }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["summary"] });

    useTaskStore.getState().ungroupSelectedTasks();

    const state = useTaskStore.getState();
    expect(state.tasks).toHaveLength(3);
    expect(state.tasks.find((t) => t.id === "summary")).toBeUndefined();

    // Children should now be children of the grandparent
    expect(state.tasks.find((t) => t.id === "a")!.parent).toBe("grandparent");
    expect(state.tasks.find((t) => t.id === "b")!.parent).toBe("grandparent");
  });

  it("should ungroup multiple summaries at once (multi-select)", () => {
    const tasks = [
      makeTask({
        id: "s1",
        name: "Group 1",
        order: 0,
        type: "summary",
        open: true,
      }),
      makeTask({ id: "a", name: "Task A", order: 1, parent: "s1" }),
      makeTask({
        id: "s2",
        name: "Group 2",
        order: 2,
        type: "summary",
        open: true,
      }),
      makeTask({ id: "b", name: "Task B", order: 3, parent: "s2" }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["s1", "s2"] });

    useTaskStore.getState().ungroupSelectedTasks();

    const state = useTaskStore.getState();
    expect(state.tasks).toHaveLength(2);
    expect(state.tasks.find((t) => t.type === "summary")).toBeUndefined();
    expect(state.tasks.find((t) => t.id === "a")!.parent).toBeUndefined();
    expect(state.tasks.find((t) => t.id === "b")!.parent).toBeUndefined();
  });

  it("should only ungroup top-level: sub-summaries remain intact", () => {
    const tasks = [
      makeTask({
        id: "outer",
        name: "Outer Group",
        order: 0,
        type: "summary",
        open: true,
      }),
      makeTask({
        id: "inner",
        name: "Inner Group",
        order: 1,
        type: "summary",
        parent: "outer",
        open: true,
      }),
      makeTask({ id: "a", name: "Task A", order: 2, parent: "inner" }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["outer"] });

    useTaskStore.getState().ungroupSelectedTasks();

    const state = useTaskStore.getState();
    // Outer is deleted, inner + a remain
    expect(state.tasks).toHaveLength(2);
    expect(state.tasks.find((t) => t.id === "outer")).toBeUndefined();

    // Inner should now be at root level
    const inner = state.tasks.find((t) => t.id === "inner");
    expect(inner).toBeDefined();
    expect(inner!.parent).toBeUndefined();
    expect(inner!.type).toBe("summary");

    // Task A should still be child of inner
    expect(state.tasks.find((t) => t.id === "a")!.parent).toBe("inner");
  });

  it("should preserve children order", () => {
    const tasks = [
      makeTask({
        id: "summary",
        name: "Group",
        order: 0,
        type: "summary",
        open: true,
      }),
      makeTask({ id: "a", name: "Task A", order: 1, parent: "summary" }),
      makeTask({ id: "b", name: "Task B", order: 2, parent: "summary" }),
      makeTask({ id: "c", name: "Task C", order: 3, parent: "summary" }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["summary"] });

    useTaskStore.getState().ungroupSelectedTasks();

    const state = useTaskStore.getState();
    const sortedByOrder = [...state.tasks].sort((a, b) => a.order - b.order);
    expect(sortedByOrder.map((t) => t.id)).toEqual(["a", "b", "c"]);
  });

  it("should remove dependencies of the summary task", () => {
    const tasks = [
      makeTask({
        id: "summary",
        name: "Group",
        order: 0,
        type: "summary",
        open: true,
      }),
      makeTask({ id: "a", name: "Task A", order: 1, parent: "summary" }),
      makeTask({ id: "other", name: "Other", order: 2 }),
    ];
    const deps: Dependency[] = [
      makeDep({ id: "dep1", fromTaskId: "summary", toTaskId: "other" }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["summary"] });
    useDependencyStore.setState({ dependencies: deps });

    useTaskStore.getState().ungroupSelectedTasks();

    // Dependency of summary should be removed
    expect(useDependencyStore.getState().dependencies).toHaveLength(0);
  });

  it("should keep children's dependencies", () => {
    const tasks = [
      makeTask({
        id: "summary",
        name: "Group",
        order: 0,
        type: "summary",
        open: true,
      }),
      makeTask({ id: "a", name: "Task A", order: 1, parent: "summary" }),
      makeTask({ id: "b", name: "Task B", order: 2, parent: "summary" }),
    ];
    const deps: Dependency[] = [
      makeDep({ id: "dep1", fromTaskId: "a", toTaskId: "b" }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["summary"] });
    useDependencyStore.setState({ dependencies: deps });

    useTaskStore.getState().ungroupSelectedTasks();

    // Child dependency should remain
    expect(useDependencyStore.getState().dependencies).toHaveLength(1);
    expect(useDependencyStore.getState().dependencies[0].id).toBe("dep1");
  });

  it("should do nothing for non-summary tasks", () => {
    const tasks = [
      makeTask({ id: "a", name: "Task A", order: 0 }),
      makeTask({ id: "b", name: "Task B", order: 1 }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["a"] });

    useTaskStore.getState().ungroupSelectedTasks();

    expect(useTaskStore.getState().tasks).toHaveLength(2);
  });

  it("should do nothing for empty summary (no children)", () => {
    const tasks = [
      makeTask({
        id: "summary",
        name: "Empty Group",
        order: 0,
        type: "summary",
        open: true,
      }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["summary"] });

    // canUngroupSelection should be false
    expect(useTaskStore.getState().canUngroupSelection()).toBe(false);

    useTaskStore.getState().ungroupSelectedTasks();

    // Nothing should change
    expect(useTaskStore.getState().tasks).toHaveLength(1);
  });

  it("should only ungroup summaries in a mixed selection", () => {
    const tasks = [
      makeTask({
        id: "summary",
        name: "Group",
        order: 0,
        type: "summary",
        open: true,
      }),
      makeTask({ id: "a", name: "Task A", order: 1, parent: "summary" }),
      makeTask({ id: "regular", name: "Regular", order: 2 }),
    ];
    useTaskStore.setState({
      tasks,
      selectedTaskIds: ["summary", "regular"],
    });

    useTaskStore.getState().ungroupSelectedTasks();

    const state = useTaskStore.getState();
    // Summary deleted, regular + a remain
    expect(state.tasks).toHaveLength(2);
    expect(state.tasks.find((t) => t.id === "summary")).toBeUndefined();
    expect(state.tasks.find((t) => t.id === "a")!.parent).toBeUndefined();
    expect(state.tasks.find((t) => t.id === "regular")).toBeDefined();
  });

  it("should select former children after ungrouping", () => {
    const tasks = [
      makeTask({
        id: "summary",
        name: "Group",
        order: 0,
        type: "summary",
        open: true,
      }),
      makeTask({ id: "a", name: "Task A", order: 1, parent: "summary" }),
      makeTask({ id: "b", name: "Task B", order: 2, parent: "summary" }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["summary"] });

    useTaskStore.getState().ungroupSelectedTasks();

    const state = useTaskStore.getState();
    expect(state.selectedTaskIds).toContain("a");
    expect(state.selectedTaskIds).toContain("b");
    expect(state.selectedTaskIds).not.toContain("summary");
  });
});

describe("canUngroupSelection", () => {
  beforeEach(resetStores);

  it("should return true when a summary with children is selected", () => {
    const tasks = [
      makeTask({
        id: "summary",
        name: "Group",
        order: 0,
        type: "summary",
        open: true,
      }),
      makeTask({ id: "a", name: "Task A", order: 1, parent: "summary" }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["summary"] });
    expect(useTaskStore.getState().canUngroupSelection()).toBe(true);
  });

  it("should return false when only regular tasks are selected", () => {
    const tasks = [
      makeTask({ id: "a", name: "Task A", order: 0 }),
      makeTask({ id: "b", name: "Task B", order: 1 }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["a", "b"] });
    expect(useTaskStore.getState().canUngroupSelection()).toBe(false);
  });

  it("should return false when nothing is selected", () => {
    useTaskStore.setState({
      tasks: [makeTask({ id: "a", name: "A", order: 0 })],
      selectedTaskIds: [],
    });
    expect(useTaskStore.getState().canUngroupSelection()).toBe(false);
  });

  it("should return true for mixed selection with at least one summary with children", () => {
    const tasks = [
      makeTask({
        id: "summary",
        name: "Group",
        order: 0,
        type: "summary",
        open: true,
      }),
      makeTask({ id: "a", name: "Task A", order: 1, parent: "summary" }),
      makeTask({ id: "regular", name: "Regular", order: 2 }),
    ];
    useTaskStore.setState({
      tasks,
      selectedTaskIds: ["summary", "regular"],
    });
    expect(useTaskStore.getState().canUngroupSelection()).toBe(true);
  });

  it("should return false for empty summary (no children)", () => {
    const tasks = [
      makeTask({
        id: "summary",
        name: "Empty",
        order: 0,
        type: "summary",
        open: true,
      }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["summary"] });
    expect(useTaskStore.getState().canUngroupSelection()).toBe(false);
  });
});

describe("ungroup undo/redo", () => {
  beforeEach(resetStores);

  it("should undo ungroup: restore summary, hierarchy, and dependencies", () => {
    const tasks = [
      makeTask({
        id: "summary",
        name: "Group",
        order: 0,
        type: "summary",
        open: true,
        startDate: "2025-06-01",
        endDate: "2025-06-07",
      }),
      makeTask({ id: "a", name: "Task A", order: 1, parent: "summary" }),
      makeTask({ id: "b", name: "Task B", order: 2, parent: "summary" }),
      makeTask({ id: "other", name: "Other", order: 3 }),
    ];
    const deps: Dependency[] = [
      makeDep({ id: "dep1", fromTaskId: "summary", toTaskId: "other" }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["summary"] });
    useDependencyStore.setState({ dependencies: deps });

    useTaskStore.getState().ungroupSelectedTasks();

    // Verify ungroup happened
    expect(useTaskStore.getState().tasks).toHaveLength(3);
    expect(useDependencyStore.getState().dependencies).toHaveLength(0);

    // Undo
    useHistoryStore.getState().undo();

    const state = useTaskStore.getState();
    expect(state.tasks).toHaveLength(4);

    const summary = state.tasks.find((t) => t.id === "summary");
    expect(summary).toBeDefined();
    expect(summary!.type).toBe("summary");
    expect(summary!.name).toBe("Group");

    // Children restored under summary
    expect(state.tasks.find((t) => t.id === "a")!.parent).toBe("summary");
    expect(state.tasks.find((t) => t.id === "b")!.parent).toBe("summary");

    // Dependency restored
    expect(useDependencyStore.getState().dependencies).toHaveLength(1);
    expect(useDependencyStore.getState().dependencies[0].id).toBe("dep1");
  });

  it("should redo ungroup correctly", () => {
    const tasks = [
      makeTask({
        id: "summary",
        name: "Group",
        order: 0,
        type: "summary",
        open: true,
      }),
      makeTask({ id: "a", name: "Task A", order: 1, parent: "summary" }),
      makeTask({ id: "b", name: "Task B", order: 2, parent: "summary" }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["summary"] });

    useTaskStore.getState().ungroupSelectedTasks();
    useHistoryStore.getState().undo();

    // Verify undo
    expect(useTaskStore.getState().tasks).toHaveLength(3);
    expect(
      useTaskStore.getState().tasks.find((t) => t.id === "summary")
    ).toBeDefined();

    // Redo
    useHistoryStore.getState().redo();

    const state = useTaskStore.getState();
    expect(state.tasks).toHaveLength(2);
    expect(state.tasks.find((t) => t.id === "summary")).toBeUndefined();
    expect(state.tasks.find((t) => t.id === "a")!.parent).toBeUndefined();
    expect(state.tasks.find((t) => t.id === "b")!.parent).toBeUndefined();
  });

  it("should support multiple undo/redo cycles", () => {
    const tasks = [
      makeTask({
        id: "summary",
        name: "Group",
        order: 0,
        type: "summary",
        open: true,
      }),
      makeTask({ id: "a", name: "Task A", order: 1, parent: "summary" }),
    ];
    useTaskStore.setState({ tasks, selectedTaskIds: ["summary"] });

    useTaskStore.getState().ungroupSelectedTasks();

    for (let i = 0; i < 3; i++) {
      // Undo
      useHistoryStore.getState().undo();
      expect(useTaskStore.getState().tasks).toHaveLength(2);
      expect(
        useTaskStore.getState().tasks.find((t) => t.id === "summary")
      ).toBeDefined();
      expect(
        useTaskStore.getState().tasks.find((t) => t.id === "a")!.parent
      ).toBe("summary");

      // Redo
      useHistoryStore.getState().redo();
      expect(useTaskStore.getState().tasks).toHaveLength(1);
      expect(
        useTaskStore.getState().tasks.find((t) => t.id === "summary")
      ).toBeUndefined();
      expect(
        useTaskStore.getState().tasks.find((t) => t.id === "a")!.parent
      ).toBeUndefined();
    }
  });
});
