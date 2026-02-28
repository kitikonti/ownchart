import { describe, it, expect, beforeEach, vi } from "vitest";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import { useHistoryStore } from "../../../src/store/slices/historySlice";
import { useDependencyStore } from "../../../src/store/slices/dependencySlice";
import { useChartStore } from "../../../src/store/slices/chartSlice";
import { useFileStore } from "../../../src/store/slices/fileSlice";
import { CommandType } from "../../../src/types/command.types";
import type { Command } from "../../../src/types/command.types";
import type { Task } from "../../../src/types/chart.types";
import type { Dependency } from "../../../src/types/dependency.types";
import type { ColorModeState } from "../../../src/types/colorMode.types";
import { DEFAULT_COLOR_MODE_STATE } from "../../../src/config/colorModeDefaults";
import { tid, hex } from "../../helpers/branded";

// Mock react-hot-toast as a callable function with .success/.error
const toastMock = vi.hoisted(() =>
  Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  })
);
vi.mock("react-hot-toast", () => ({
  default: toastMock,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    type: "task",
    metadata: {},
    ...options,
  };
}

function makeCommand(
  type: CommandType,
  description: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any
): Command {
  return {
    id: crypto.randomUUID(),
    type,
    timestamp: Date.now(),
    description,
    params,
  } as Command;
}

function createDependency(
  id: string,
  fromTaskId: string,
  toTaskId: string
): Dependency {
  return {
    id,
    fromTaskId,
    toTaskId,
    type: "FS",
    lag: 0,
    createdAt: new Date().toISOString(),
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
  toastMock.mockClear();
  toastMock.success.mockClear();
  toastMock.error.mockClear();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("History Store - Helper methods", () => {
  beforeEach(resetStores);

  it("canUndo returns false when undo stack is empty", () => {
    expect(useHistoryStore.getState().canUndo()).toBe(false);
  });

  it("canUndo returns true when undo stack has commands", () => {
    const cmd = makeCommand(CommandType.UPDATE_TASK, "test", {
      id: "t1",
      updates: {},
      previousValues: {},
    });
    useHistoryStore.getState().recordCommand(cmd);
    expect(useHistoryStore.getState().canUndo()).toBe(true);
  });

  it("canRedo returns false when redo stack is empty", () => {
    expect(useHistoryStore.getState().canRedo()).toBe(false);
  });

  it("canRedo returns true after undo", () => {
    const task = createTask("t1", "Task 1");
    useTaskStore.setState({ tasks: [task] });
    const cmd = makeCommand(CommandType.UPDATE_TASK, "update", {
      id: "t1",
      updates: { name: "Updated" },
      previousValues: { name: "Task 1" },
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();
    expect(useHistoryStore.getState().canRedo()).toBe(true);
  });

  it("clearHistory empties both stacks", () => {
    const cmd = makeCommand(CommandType.UPDATE_TASK, "test", {
      id: "t1",
      updates: {},
      previousValues: {},
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().clearHistory();
    expect(useHistoryStore.getState().undoStack).toHaveLength(0);
    expect(useHistoryStore.getState().redoStack).toHaveLength(0);
  });

  it("getUndoDescription returns null when empty", () => {
    expect(useHistoryStore.getState().getUndoDescription()).toBeNull();
  });

  it("getUndoDescription returns last command description", () => {
    const cmd = makeCommand(CommandType.UPDATE_TASK, "Changed name", {
      id: "t1",
      updates: {},
      previousValues: {},
    });
    useHistoryStore.getState().recordCommand(cmd);
    expect(useHistoryStore.getState().getUndoDescription()).toBe(
      "Changed name"
    );
  });

  it("getRedoDescription returns null when empty", () => {
    expect(useHistoryStore.getState().getRedoDescription()).toBeNull();
  });

  it("getRedoDescription returns description after undo", () => {
    const task = createTask("t1", "Task 1");
    useTaskStore.setState({ tasks: [task] });
    const cmd = makeCommand(CommandType.UPDATE_TASK, "Changed name", {
      id: "t1",
      updates: { name: "Updated" },
      previousValues: { name: "Task 1" },
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();
    expect(useHistoryStore.getState().getRedoDescription()).toBe(
      "Changed name"
    );
  });
});

describe("History Store - recordCommand", () => {
  beforeEach(resetStores);

  it("pushes command onto undo stack", () => {
    const cmd = makeCommand(CommandType.UPDATE_TASK, "test", {
      id: "t1",
      updates: {},
      previousValues: {},
    });
    useHistoryStore.getState().recordCommand(cmd);
    expect(useHistoryStore.getState().undoStack).toHaveLength(1);
  });

  it("clears redo stack on new command", () => {
    const task = createTask("t1", "Task 1");
    useTaskStore.setState({ tasks: [task] });

    const cmd1 = makeCommand(CommandType.UPDATE_TASK, "first", {
      id: "t1",
      updates: { name: "A" },
      previousValues: { name: "Task 1" },
    });
    useHistoryStore.getState().recordCommand(cmd1);
    useHistoryStore.getState().undo();
    expect(useHistoryStore.getState().redoStack).toHaveLength(1);

    const cmd2 = makeCommand(CommandType.UPDATE_TASK, "second", {
      id: "t1",
      updates: { name: "B" },
      previousValues: { name: "Task 1" },
    });
    useHistoryStore.getState().recordCommand(cmd2);
    expect(useHistoryStore.getState().redoStack).toHaveLength(0);
  });

  it("skips recording during isUndoing", () => {
    useHistoryStore.getState().setUndoing(true);
    const cmd = makeCommand(CommandType.UPDATE_TASK, "test", {
      id: "t1",
      updates: {},
      previousValues: {},
    });
    useHistoryStore.getState().recordCommand(cmd);
    expect(useHistoryStore.getState().undoStack).toHaveLength(0);
  });

  it("skips recording during isRedoing", () => {
    useHistoryStore.getState().setRedoing(true);
    const cmd = makeCommand(CommandType.UPDATE_TASK, "test", {
      id: "t1",
      updates: {},
      previousValues: {},
    });
    useHistoryStore.getState().recordCommand(cmd);
    expect(useHistoryStore.getState().undoStack).toHaveLength(0);
  });

  it("enforces MAX_STACK_SIZE of 100", () => {
    for (let i = 0; i < 105; i++) {
      const cmd = makeCommand(CommandType.UPDATE_TASK, `cmd-${i}`, {
        id: "t1",
        updates: {},
        previousValues: {},
      });
      useHistoryStore.getState().recordCommand(cmd);
    }
    expect(useHistoryStore.getState().undoStack).toHaveLength(100);
    // Oldest commands should have been shifted off
    expect(useHistoryStore.getState().undoStack[0].description).toBe("cmd-5");
  });
});

describe("History Store - ADD_TASK undo/redo", () => {
  beforeEach(resetStores);

  it("undo removes single added task by generatedId", () => {
    const task = createTask("gen-1", "New Task", { order: 0 });
    useTaskStore.setState({ tasks: [task] });

    const cmd = makeCommand(CommandType.ADD_TASK, 'Created task "New Task"', {
      mode: "single",
      task: { ...task, id: undefined },
      generatedId: "gen-1",
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    expect(useTaskStore.getState().tasks).toHaveLength(0);
  });

  it("undo removes batch-added tasks by generatedIds", () => {
    const t1 = createTask("gen-1", "Task A", { order: 0 });
    const t2 = createTask("gen-2", "Task B", { order: 1 });
    const existing = createTask("existing", "Existing", { order: 2 });
    useTaskStore.setState({ tasks: [t1, t2, existing] });

    const cmd = makeCommand(CommandType.ADD_TASK, "Created 2 tasks", {
      mode: "batch",
      task: { name: "Task A" },
      tasks: [
        { ...t1, id: undefined },
        { ...t2, id: undefined },
      ],
      generatedIds: ["gen-1", "gen-2"],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    const tasks = useTaskStore.getState().tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe("existing");
  });

  it("redo restores single task with same generatedId", () => {
    const task = createTask("gen-1", "New Task", { order: 0 });
    useTaskStore.setState({ tasks: [task] });

    const cmd = makeCommand(CommandType.ADD_TASK, 'Created task "New Task"', {
      mode: "single",
      task: { ...task, id: undefined },
      generatedId: "gen-1",
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();
    useHistoryStore.getState().redo();

    const tasks = useTaskStore.getState().tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe("gen-1");
    expect(tasks[0].name).toBe("New Task");
  });

  it("redo restores batch tasks with same generatedIds", () => {
    const t1 = createTask("gen-1", "Task A", { order: 0 });
    const t2 = createTask("gen-2", "Task B", { order: 1 });
    useTaskStore.setState({ tasks: [t1, t2] });

    const cmd = makeCommand(CommandType.ADD_TASK, "Created 2 tasks", {
      mode: "batch",
      task: { name: "Task A" },
      tasks: [
        { ...t1, id: undefined },
        { ...t2, id: undefined },
      ],
      generatedIds: ["gen-1", "gen-2"],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();
    useHistoryStore.getState().redo();

    const tasks = useTaskStore.getState().tasks;
    expect(tasks).toHaveLength(2);
    expect(tasks.map((t) => t.id).sort()).toEqual(["gen-1", "gen-2"]);
  });
});

describe("History Store - DELETE_TASK undo/redo", () => {
  beforeEach(resetStores);

  it("undo restores deleted tasks", () => {
    const task = createTask("t1", "Deleted Task");
    useTaskStore.setState({ tasks: [] }); // already deleted

    const cmd = makeCommand(CommandType.DELETE_TASK, 'Deleted task "Deleted"', {
      id: "t1",
      deletedIds: ["t1"],
      cascade: false,
      deletedTasks: [task],
      deletedDependencies: [],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    expect(useTaskStore.getState().tasks).toHaveLength(1);
    expect(useTaskStore.getState().tasks[0].id).toBe("t1");
  });

  it("undo restores deleted dependencies", () => {
    const task = createTask("t1", "Task 1");
    const dep = createDependency("dep-1", "t1", "t2");
    useTaskStore.setState({ tasks: [] });
    useDependencyStore.setState({ dependencies: [] });

    const cmd = makeCommand(CommandType.DELETE_TASK, "Deleted task", {
      id: "t1",
      deletedIds: ["t1"],
      cascade: false,
      deletedTasks: [task],
      deletedDependencies: [dep],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    expect(useDependencyStore.getState().dependencies).toHaveLength(1);
    expect(useDependencyStore.getState().dependencies[0].id).toBe("dep-1");
  });

  it("redo re-deletes tasks and cleans dependencies", () => {
    const t1 = createTask("t1", "Task 1", { order: 0 });
    const t2 = createTask("t2", "Task 2", { order: 1 });
    const dep = createDependency("dep-1", "t1", "t2");
    // State after deletion: t1 is gone, dep is gone
    useTaskStore.setState({ tasks: [t2] });
    useDependencyStore.setState({ dependencies: [] });

    const cmd = makeCommand(CommandType.DELETE_TASK, "Deleted task", {
      id: "t1",
      deletedIds: ["t1"],
      cascade: false,
      deletedTasks: [t1],
      deletedDependencies: [dep],
    });
    useHistoryStore.getState().recordCommand(cmd);
    // Undo restores t1 and dep
    useHistoryStore.getState().undo();
    expect(useTaskStore.getState().tasks).toHaveLength(2);
    expect(useDependencyStore.getState().dependencies).toHaveLength(1);

    // Redo re-deletes t1 and cleans dep
    useHistoryStore.getState().redo();
    expect(
      useTaskStore
        .getState()
        .tasks.find((t) => t.id === "t1")
    ).toBeUndefined();
    expect(useTaskStore.getState().tasks).toHaveLength(1);
    expect(useDependencyStore.getState().dependencies).toHaveLength(0);
  });

  it("undo restores cascadeUpdates on surviving parent (frozen-object regression)", () => {
    // Setup: summary parent + child, child deleted, cascadeUpdates restores parent dates
    const parent = createTask("parent", "Summary Parent", {
      order: 0,
      type: "summary",
      startDate: "2025-01-01",
      endDate: "2025-01-10",
    });
    const child = createTask("child", "Child Task", {
      order: 1,
      parent: "parent",
      startDate: "2025-01-01",
      endDate: "2025-01-10",
    });

    // After deletion: child is gone, parent remains with recalculated dates
    useTaskStore.setState({
      tasks: [
        { ...parent, startDate: "2025-01-01", endDate: "2025-01-01" },
      ],
    });

    const cmd = makeCommand(CommandType.DELETE_TASK, "Deleted child", {
      id: "child",
      deletedIds: ["child"],
      cascade: false,
      deletedTasks: [child],
      deletedDependencies: [],
      cascadeUpdates: [
        {
          id: "parent",
          updates: { startDate: "2025-01-01", endDate: "2025-01-01" },
          previousValues: { startDate: "2025-01-01", endDate: "2025-01-10" },
        },
      ],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    const tasks = useTaskStore.getState().tasks;
    expect(tasks).toHaveLength(2);
    const restoredParent = tasks.find((t) => t.id === "parent")!;
    // cascadeUpdates should have restored the parent's original dates
    expect(restoredParent.startDate).toBe("2025-01-01");
    expect(restoredParent.endDate).toBe("2025-01-10");
  });
});

describe("History Store - UPDATE_TASK undo/redo", () => {
  beforeEach(resetStores);

  it("undo reverts previousValues", () => {
    const task = createTask("t1", "Updated Name");
    useTaskStore.setState({ tasks: [task] });

    const cmd = makeCommand(CommandType.UPDATE_TASK, "Updated task", {
      id: "t1",
      updates: { name: "Updated Name" },
      previousValues: { name: "Original Name" },
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    expect(useTaskStore.getState().tasks[0].name).toBe("Original Name");
  });

  it("redo reapplies updates", () => {
    const task = createTask("t1", "Original Name");
    useTaskStore.setState({ tasks: [task] });

    const cmd = makeCommand(CommandType.UPDATE_TASK, "Updated task", {
      id: "t1",
      updates: { name: "Updated Name" },
      previousValues: { name: "Original Name" },
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();
    useHistoryStore.getState().redo();

    expect(useTaskStore.getState().tasks[0].name).toBe("Updated Name");
  });

  it("undo/redo handles cascadeUpdates", () => {
    const parent = createTask("p1", "Parent", {
      order: 0,
      type: "summary",
      startDate: "2025-01-06",
      endDate: "2025-01-10",
    });
    const child = createTask("c1", "Child", {
      order: 1,
      parent: "p1",
      startDate: "2025-01-06",
      endDate: "2025-01-10",
    });
    useTaskStore.setState({ tasks: [parent, child] });

    const cmd = makeCommand(CommandType.UPDATE_TASK, "Updated task", {
      id: "c1",
      updates: { startDate: "2025-01-11", endDate: "2025-01-15" },
      previousValues: { startDate: "2025-01-06", endDate: "2025-01-10" },
      cascadeUpdates: [
        {
          id: "p1",
          updates: { startDate: "2025-01-11", endDate: "2025-01-15" },
          previousValues: { startDate: "2025-01-06", endDate: "2025-01-10" },
        },
      ],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    expect(useTaskStore.getState().tasks.find((t) => t.id === "p1")?.startDate).toBe(
      "2025-01-06"
    );

    useHistoryStore.getState().redo();
    expect(useTaskStore.getState().tasks.find((t) => t.id === "p1")?.startDate).toBe(
      "2025-01-11"
    );
  });
});

describe("History Store - PASTE_ROWS undo/redo", () => {
  beforeEach(resetStores);

  it("undo removes pasted tasks and restores cut tasks", () => {
    const pasted = createTask("pasted-1", "Pasted", { order: 0 });
    const cut = createTask("cut-1", "Cut Source", { order: 0 });
    useTaskStore.setState({ tasks: [pasted] });

    const cmd = makeCommand(CommandType.PASTE_ROWS, "Pasted rows", {
      pastedTasks: [pasted],
      pastedDependencies: [],
      insertIndex: 0,
      idMapping: { "old-1": "pasted-1" },
      deletedTasks: [cut],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    const tasks = useTaskStore.getState().tasks;
    expect(tasks.find((t) => t.id === "pasted-1")).toBeUndefined();
    expect(tasks.find((t) => t.id === "cut-1")).toBeDefined();
  });

  it("redo cut-paste uses fresh dependency state (regression for stale dep fix)", () => {
    const existing = createTask("existing", "Existing", { order: 0 });
    const cut = createTask("cut-1", "Cut", { order: 1 });
    const pasted = createTask("pasted-1", "Pasted", { order: 1 });
    const pastedDep = createDependency("pd-1", "pasted-1", "existing");
    const cutDep = createDependency("cd-1", "cut-1", "existing");

    useTaskStore.setState({ tasks: [existing, pasted] });
    useDependencyStore.setState({ dependencies: [pastedDep] });

    const cmd = makeCommand(CommandType.PASTE_ROWS, "Pasted rows", {
      pastedTasks: [pasted],
      pastedDependencies: [pastedDep],
      insertIndex: 1,
      idMapping: { "cut-1": "pasted-1" },
      deletedTasks: [cut],
    });
    useHistoryStore.getState().recordCommand(cmd);

    // Undo: removes pasted, restores cut
    useHistoryStore.getState().undo();
    expect(useDependencyStore.getState().dependencies).toHaveLength(0);

    // Add a dep that only exists after undo (simulates new state)
    useDependencyStore.setState({ dependencies: [cutDep] });

    // Redo: should use fresh dep state, not stale captured state
    useHistoryStore.getState().redo();
    const deps = useDependencyStore.getState().dependencies;
    // cutDep should be removed (cut task removed), pastedDep should be added
    expect(deps.find((d) => d.id === "pd-1")).toBeDefined();
    // cut-1's dep should be removed since cut-1 is deleted
    expect(deps.find((d) => d.id === "cd-1")).toBeUndefined();
  });
});

describe("History Store - PASTE_CELL undo/redo", () => {
  beforeEach(resetStores);

  it("undo restores previous value", () => {
    const task = createTask("t1", "New Value");
    useTaskStore.setState({ tasks: [task] });

    const cmd = makeCommand(CommandType.PASTE_CELL, "Pasted cell", {
      taskId: "t1",
      field: "name",
      newValue: "New Value",
      previousValue: "Old Value",
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    expect(useTaskStore.getState().tasks[0].name).toBe("Old Value");
  });

  it("undo restores cut cell source", () => {
    const t1 = createTask("t1", "Pasted", { order: 0 });
    const t2 = createTask("t2", "", { order: 1 });
    useTaskStore.setState({ tasks: [t1, t2] });

    const cmd = makeCommand(CommandType.PASTE_CELL, "Pasted cell", {
      taskId: "t1",
      field: "name",
      newValue: "Pasted",
      previousValue: "Original",
      previousCutCell: { taskId: "t2", field: "name", value: "Cut Source" },
      cutClearValue: "",
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    expect(useTaskStore.getState().tasks[0].name).toBe("Original");
    expect(useTaskStore.getState().tasks[1].name).toBe("Cut Source");
  });

  it("redo reapplies paste and cut clear", () => {
    const t1 = createTask("t1", "Original", { order: 0 });
    const t2 = createTask("t2", "Cut Source", { order: 1 });
    useTaskStore.setState({ tasks: [t1, t2] });

    const cmd = makeCommand(CommandType.PASTE_CELL, "Pasted cell", {
      taskId: "t1",
      field: "name",
      newValue: "Pasted",
      previousValue: "Original",
      previousCutCell: { taskId: "t2", field: "name", value: "Cut Source" },
      cutClearValue: "",
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();
    useHistoryStore.getState().redo();

    expect(useTaskStore.getState().tasks[0].name).toBe("Pasted");
    expect(useTaskStore.getState().tasks[1].name).toBe("");
  });
});

describe("History Store - Dependency commands", () => {
  beforeEach(resetStores);

  it("undo ADD_DEPENDENCY removes the dependency", () => {
    const dep = createDependency("dep-1", "t1", "t2");
    useDependencyStore.setState({ dependencies: [dep] });

    const cmd = makeCommand(CommandType.ADD_DEPENDENCY, "Created dep", {
      dependency: dep,
      dateAdjustments: [],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    expect(useDependencyStore.getState().dependencies).toHaveLength(0);
  });

  it("redo ADD_DEPENDENCY restores the dependency", () => {
    const dep = createDependency("dep-1", "t1", "t2");
    useDependencyStore.setState({ dependencies: [dep] });

    const cmd = makeCommand(CommandType.ADD_DEPENDENCY, "Created dep", {
      dependency: dep,
      dateAdjustments: [],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();
    useHistoryStore.getState().redo();

    expect(useDependencyStore.getState().dependencies).toHaveLength(1);
    expect(useDependencyStore.getState().dependencies[0].id).toBe("dep-1");
  });

  it("undo ADD_DEPENDENCY restores previous dates from dateAdjustments", () => {
    const t1 = createTask("t1", "Task 1", {
      order: 0,
      startDate: "2025-01-06",
      endDate: "2025-01-10",
    });
    const t2 = createTask("t2", "Task 2", {
      order: 1,
      startDate: "2025-01-11",
      endDate: "2025-01-15",
    });
    useTaskStore.setState({ tasks: [t1, t2] });

    const dep = createDependency("dep-1", "t1", "t2");
    useDependencyStore.setState({ dependencies: [dep] });

    const cmd = makeCommand(CommandType.ADD_DEPENDENCY, "Created dep", {
      dependency: dep,
      dateAdjustments: [
        {
          taskId: "t2",
          oldStartDate: "2025-01-06",
          oldEndDate: "2025-01-10",
          newStartDate: "2025-01-11",
          newEndDate: "2025-01-15",
        },
      ],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    expect(useDependencyStore.getState().dependencies).toHaveLength(0);
    const task2 = useTaskStore.getState().tasks.find((t) => t.id === "t2")!;
    expect(task2.startDate).toBe("2025-01-06");
    expect(task2.endDate).toBe("2025-01-10");
  });

  it("undo DELETE_DEPENDENCY restores the dependency", () => {
    const dep = createDependency("dep-1", "t1", "t2");
    useDependencyStore.setState({ dependencies: [] }); // already deleted

    const cmd = makeCommand(CommandType.DELETE_DEPENDENCY, "Removed dep", {
      dependency: dep,
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    expect(useDependencyStore.getState().dependencies).toHaveLength(1);
  });

  it("redo DELETE_DEPENDENCY removes the dependency", () => {
    const dep = createDependency("dep-1", "t1", "t2");
    useDependencyStore.setState({ dependencies: [] });

    const cmd = makeCommand(CommandType.DELETE_DEPENDENCY, "Removed dep", {
      dependency: dep,
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();
    expect(useDependencyStore.getState().dependencies).toHaveLength(1);

    useHistoryStore.getState().redo();
    expect(useDependencyStore.getState().dependencies).toHaveLength(0);
  });

  it("undo UPDATE_DEPENDENCY reverts to previousValues", () => {
    const dep = createDependency("dep-1", "t1", "t2");
    dep.lag = 5;
    useDependencyStore.setState({ dependencies: [dep] });

    const cmd = makeCommand(CommandType.UPDATE_DEPENDENCY, "Updated dep", {
      id: "dep-1",
      updates: { lag: 5 },
      previousValues: { lag: 0 },
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    expect(useDependencyStore.getState().dependencies[0].lag).toBe(0);
  });

  it("redo UPDATE_DEPENDENCY reapplies updates", () => {
    const dep = createDependency("dep-1", "t1", "t2");
    useDependencyStore.setState({ dependencies: [dep] });

    const cmd = makeCommand(CommandType.UPDATE_DEPENDENCY, "Updated dep", {
      id: "dep-1",
      updates: { lag: 5 },
      previousValues: { lag: 0 },
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();
    useHistoryStore.getState().redo();

    expect(useDependencyStore.getState().dependencies[0].lag).toBe(5);
  });
});

describe("History Store - HIDE/UNHIDE_TASKS undo/redo", () => {
  beforeEach(resetStores);

  it("undo HIDE_TASKS restores previousHiddenTaskIds", () => {
    useChartStore.getState().setHiddenTaskIds(["t1", "t2"]);

    const cmd = makeCommand(CommandType.HIDE_TASKS, "Hid tasks", {
      taskIds: ["t2"],
      previousHiddenTaskIds: ["t1"],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    expect(useChartStore.getState().hiddenTaskIds).toEqual(["t1"]);
  });

  it("redo HIDE_TASKS re-hides the tasks", () => {
    useChartStore.getState().setHiddenTaskIds(["t1", "t2"]);

    const cmd = makeCommand(CommandType.HIDE_TASKS, "Hid tasks", {
      taskIds: ["t2"],
      previousHiddenTaskIds: ["t1"],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();
    useHistoryStore.getState().redo();

    expect(useChartStore.getState().hiddenTaskIds).toContain("t1");
    expect(useChartStore.getState().hiddenTaskIds).toContain("t2");
  });

  it("undo UNHIDE_TASKS restores previousHiddenTaskIds", () => {
    useChartStore.getState().setHiddenTaskIds([]);

    const cmd = makeCommand(CommandType.UNHIDE_TASKS, "Unhid tasks", {
      taskIds: ["t1"],
      previousHiddenTaskIds: ["t1"],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    expect(useChartStore.getState().hiddenTaskIds).toEqual(["t1"]);
  });

  it("redo UNHIDE_TASKS removes unhidden ids", () => {
    useChartStore.getState().setHiddenTaskIds(["t1"]);

    const cmd = makeCommand(CommandType.UNHIDE_TASKS, "Unhid tasks", {
      taskIds: ["t1"],
      previousHiddenTaskIds: ["t1"],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();
    useHistoryStore.getState().redo();

    expect(useChartStore.getState().hiddenTaskIds).not.toContain("t1");
  });
});

describe("History Store - NON_DATA_COMMANDS", () => {
  beforeEach(resetStores);

  it("copy/cut commands are no-ops on undo/redo and do not mark dirty", () => {
    // Reset dirty state
    useFileStore.setState({ isDirty: false });

    const cmd = makeCommand(CommandType.COPY_ROWS, "Copied rows", {
      taskIds: ["t1"],
      tasks: [],
      dependencies: [],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    // File should NOT be marked dirty for non-data commands
    expect(useFileStore.getState().isDirty).toBe(false);
  });
});

describe("History Store - Error handling", () => {
  beforeEach(resetStores);

  it("shows toast.error when undo executor throws", () => {
    // Create an invalid command that will cause the executor to throw
    const cmd = makeCommand(CommandType.UPDATE_TASK, "Will fail", {
      id: "nonexistent",
      updates: { name: "X" },
      previousValues: { name: "Y" },
    });
    useHistoryStore.getState().recordCommand(cmd);

    // Mock updateTask to throw
    const original = useTaskStore.getState().updateTask;
    useTaskStore.setState({
      ...useTaskStore.getState(),
      updateTask: () => {
        throw new Error("Test error");
      },
    });

    useHistoryStore.getState().undo();
    expect(toastMock.error).toHaveBeenCalledWith(
      "Undo failed. Please refresh the page if issues persist."
    );

    // isUndoing should be reset to false
    expect(useHistoryStore.getState().isUndoing).toBe(false);

    // Restore
    useTaskStore.setState({
      ...useTaskStore.getState(),
      updateTask: original,
    });
  });

  it("shows toast when nothing to undo", () => {
    useHistoryStore.getState().undo();
    expect(toastMock).toHaveBeenCalledWith("Nothing to undo", {
      icon: "ℹ️",
    });
  });

  it("shows toast when nothing to redo", () => {
    useHistoryStore.getState().redo();
    expect(toastMock).toHaveBeenCalledWith("Nothing to redo", {
      icon: "ℹ️",
    });
  });

  it("removes broken command from undo stack after failure so next undo proceeds", () => {
    // Record two commands
    const cmd1 = makeCommand(CommandType.UPDATE_TASK, "First update", {
      id: "t1",
      updates: { name: "After1" },
      previousValues: { name: "Original" },
    });
    const cmd2 = makeCommand(CommandType.UPDATE_TASK, "Second update", {
      id: "t1",
      updates: { name: "After2" },
      previousValues: { name: "After1" },
    });

    useTaskStore.setState({
      tasks: [createTask("t1", "After2")],
    });
    useHistoryStore.getState().recordCommand(cmd1);
    useHistoryStore.getState().recordCommand(cmd2);

    expect(useHistoryStore.getState().undoStack).toHaveLength(2);

    // Mock updateTask to throw (simulates broken undo of cmd2)
    const original = useTaskStore.getState().updateTask;
    useTaskStore.setState({
      updateTask: () => {
        throw new Error("Simulated failure");
      },
    });

    // First undo fails — broken cmd2 should be removed from stack
    useHistoryStore.getState().undo();
    expect(toastMock.error).toHaveBeenCalledWith(
      "Undo failed. Please refresh the page if issues persist."
    );
    expect(useHistoryStore.getState().undoStack).toHaveLength(1);
    // Broken command must NOT end up on the redo stack
    expect(useHistoryStore.getState().redoStack).toHaveLength(0);

    // Restore real updateTask
    useTaskStore.setState({ updateTask: original });

    // Second undo should succeed with cmd1
    useHistoryStore.getState().undo();
    expect(toastMock.success).toHaveBeenCalled();
    expect(useHistoryStore.getState().undoStack).toHaveLength(0);
  });

  it("removes broken command from redo stack after failure so next redo proceeds", () => {
    const task = createTask("t1", "Task 1");
    useTaskStore.setState({ tasks: [task] });

    // Record two commands, then undo both to fill redo stack
    const cmd1 = makeCommand(CommandType.UPDATE_TASK, "First update", {
      id: "t1",
      updates: { name: "After1" },
      previousValues: { name: "Task 1" },
    });
    const cmd2 = makeCommand(CommandType.UPDATE_TASK, "Second update", {
      id: "t1",
      updates: { name: "After2" },
      previousValues: { name: "After1" },
    });
    useHistoryStore.getState().recordCommand(cmd1);
    useHistoryStore.getState().recordCommand(cmd2);
    useHistoryStore.getState().undo();
    useHistoryStore.getState().undo();

    expect(useHistoryStore.getState().redoStack).toHaveLength(2);

    // Mock updateTask to throw (simulates broken redo of cmd1)
    const original = useTaskStore.getState().updateTask;
    useTaskStore.setState({
      updateTask: () => {
        throw new Error("Simulated failure");
      },
    });

    // First redo fails — broken cmd1 should be removed from redo stack
    useHistoryStore.getState().redo();
    expect(toastMock.error).toHaveBeenCalledWith(
      "Redo failed. Please refresh the page if issues persist."
    );
    expect(useHistoryStore.getState().redoStack).toHaveLength(1);
    expect(useHistoryStore.getState().isRedoing).toBe(false);

    // Restore real updateTask
    useTaskStore.setState({ updateTask: original });

    // Second redo should succeed with cmd2
    useHistoryStore.getState().redo();
    expect(toastMock.success).toHaveBeenCalled();
    expect(useHistoryStore.getState().redoStack).toHaveLength(0);
  });
});

describe("History Store - MULTI_DRAG_TASKS", () => {
  beforeEach(resetStores);

  describe("undo", () => {
    it("should undo multi-drag operation and restore previous dates", () => {
      const tasks: Task[] = [
        createTask("task-1", "Task 1", {
          startDate: "2025-01-01",
          endDate: "2025-01-05",
          order: 0,
        }),
        createTask("task-2", "Task 2", {
          startDate: "2025-01-06",
          endDate: "2025-01-10",
          order: 1,
        }),
      ];
      useTaskStore.setState({ tasks });

      const { updateMultipleTasks } = useTaskStore.getState();

      updateMultipleTasks([
        {
          id: "task-1",
          updates: {
            startDate: "2025-01-06",
            endDate: "2025-01-10",
            duration: 5,
          },
        },
        {
          id: "task-2",
          updates: {
            startDate: "2025-01-11",
            endDate: "2025-01-15",
            duration: 5,
          },
        },
      ]);

      let updatedTasks = useTaskStore.getState().tasks;
      expect(updatedTasks[0].startDate).toBe("2025-01-06");
      expect(updatedTasks[1].startDate).toBe("2025-01-11");

      useHistoryStore.getState().undo();

      updatedTasks = useTaskStore.getState().tasks;
      expect(updatedTasks[0].startDate).toBe("2025-01-01");
      expect(updatedTasks[0].endDate).toBe("2025-01-05");
      expect(updatedTasks[1].startDate).toBe("2025-01-06");
      expect(updatedTasks[1].endDate).toBe("2025-01-10");
    });

    it("should undo cascade updates to summary parents", () => {
      const tasks: Task[] = [
        createTask("summary", "Summary", {
          startDate: "2025-01-01",
          endDate: "2025-01-10",
          duration: 10,
          order: 0,
          type: "summary",
        }),
        createTask("child-1", "Child 1", {
          startDate: "2025-01-01",
          endDate: "2025-01-05",
          order: 1,
          parent: "summary",
        }),
        createTask("child-2", "Child 2", {
          startDate: "2025-01-06",
          endDate: "2025-01-10",
          order: 2,
          parent: "summary",
        }),
      ];
      useTaskStore.setState({ tasks });

      useTaskStore.getState().updateMultipleTasks([
        {
          id: "child-1",
          updates: {
            startDate: "2025-01-06",
            endDate: "2025-01-10",
            duration: 5,
          },
        },
        {
          id: "child-2",
          updates: {
            startDate: "2025-01-11",
            endDate: "2025-01-15",
            duration: 5,
          },
        },
      ]);

      let summary = useTaskStore
        .getState()
        .tasks.find((t) => t.id === "summary");
      expect(summary?.startDate).toBe("2025-01-06");
      expect(summary?.endDate).toBe("2025-01-15");

      useHistoryStore.getState().undo();

      summary = useTaskStore.getState().tasks.find((t) => t.id === "summary");
      expect(summary?.startDate).toBe("2025-01-01");
      expect(summary?.endDate).toBe("2025-01-10");
    });

    it("should move command from undo stack to redo stack", () => {
      const tasks: Task[] = [
        createTask("task-1", "Task 1", { order: 0 }),
      ];
      useTaskStore.setState({ tasks });

      useTaskStore.getState().updateMultipleTasks([
        {
          id: "task-1",
          updates: {
            startDate: "2025-01-06",
            endDate: "2025-01-10",
            duration: 5,
          },
        },
      ]);

      expect(useHistoryStore.getState().undoStack).toHaveLength(1);
      expect(useHistoryStore.getState().redoStack).toHaveLength(0);

      useHistoryStore.getState().undo();

      expect(useHistoryStore.getState().undoStack).toHaveLength(0);
      expect(useHistoryStore.getState().redoStack).toHaveLength(1);
    });
  });

  describe("redo", () => {
    it("should redo multi-drag operation and reapply dates", () => {
      const tasks: Task[] = [
        createTask("task-1", "Task 1", {
          startDate: "2025-01-01",
          endDate: "2025-01-05",
          order: 0,
        }),
        createTask("task-2", "Task 2", {
          startDate: "2025-01-06",
          endDate: "2025-01-10",
          order: 1,
        }),
      ];
      useTaskStore.setState({ tasks });

      useTaskStore.getState().updateMultipleTasks([
        {
          id: "task-1",
          updates: {
            startDate: "2025-01-06",
            endDate: "2025-01-10",
            duration: 5,
          },
        },
        {
          id: "task-2",
          updates: {
            startDate: "2025-01-11",
            endDate: "2025-01-15",
            duration: 5,
          },
        },
      ]);

      useHistoryStore.getState().undo();
      useHistoryStore.getState().redo();

      const updatedTasks = useTaskStore.getState().tasks;
      expect(updatedTasks[0].startDate).toBe("2025-01-06");
      expect(updatedTasks[0].endDate).toBe("2025-01-10");
      expect(updatedTasks[1].startDate).toBe("2025-01-11");
      expect(updatedTasks[1].endDate).toBe("2025-01-15");
    });

    it("should redo cascade updates to summary parents", () => {
      const tasks: Task[] = [
        createTask("summary", "Summary", {
          startDate: "2025-01-01",
          endDate: "2025-01-10",
          duration: 10,
          order: 0,
          type: "summary",
        }),
        createTask("child-1", "Child 1", {
          startDate: "2025-01-01",
          endDate: "2025-01-05",
          order: 1,
          parent: "summary",
        }),
      ];
      useTaskStore.setState({ tasks });

      useTaskStore.getState().updateMultipleTasks([
        {
          id: "child-1",
          updates: {
            startDate: "2025-01-06",
            endDate: "2025-01-10",
            duration: 5,
          },
        },
      ]);

      useHistoryStore.getState().undo();

      let summary = useTaskStore
        .getState()
        .tasks.find((t) => t.id === "summary");
      expect(summary?.startDate).toBe("2025-01-01");

      useHistoryStore.getState().redo();

      summary = useTaskStore.getState().tasks.find((t) => t.id === "summary");
      expect(summary?.startDate).toBe("2025-01-06");
      expect(summary?.endDate).toBe("2025-01-10");
    });

    it("should move command from redo stack back to undo stack", () => {
      const tasks: Task[] = [
        createTask("task-1", "Task 1", { order: 0 }),
      ];
      useTaskStore.setState({ tasks });

      useTaskStore.getState().updateMultipleTasks([
        {
          id: "task-1",
          updates: {
            startDate: "2025-01-06",
            endDate: "2025-01-10",
            duration: 5,
          },
        },
      ]);

      useHistoryStore.getState().undo();
      useHistoryStore.getState().redo();

      expect(useHistoryStore.getState().undoStack).toHaveLength(1);
      expect(useHistoryStore.getState().redoStack).toHaveLength(0);
    });
  });

  describe("multiple undo/redo cycles", () => {
    it("should handle multiple undo/redo operations correctly", () => {
      const tasks: Task[] = [
        createTask("task-1", "Task 1", {
          startDate: "2025-01-01",
          endDate: "2025-01-05",
          order: 0,
        }),
      ];
      useTaskStore.setState({ tasks });

      const { updateMultipleTasks } = useTaskStore.getState();

      updateMultipleTasks([
        {
          id: "task-1",
          updates: {
            startDate: "2025-01-06",
            endDate: "2025-01-10",
            duration: 5,
          },
        },
      ]);

      updateMultipleTasks([
        {
          id: "task-1",
          updates: {
            startDate: "2025-01-11",
            endDate: "2025-01-15",
            duration: 5,
          },
        },
      ]);

      let task = useTaskStore.getState().tasks[0];
      expect(task.startDate).toBe("2025-01-11");

      useHistoryStore.getState().undo();
      task = useTaskStore.getState().tasks[0];
      expect(task.startDate).toBe("2025-01-06");

      useHistoryStore.getState().undo();
      task = useTaskStore.getState().tasks[0];
      expect(task.startDate).toBe("2025-01-01");

      useHistoryStore.getState().redo();
      task = useTaskStore.getState().tasks[0];
      expect(task.startDate).toBe("2025-01-06");

      useHistoryStore.getState().redo();
      task = useTaskStore.getState().tasks[0];
      expect(task.startDate).toBe("2025-01-11");
    });
  });
});

describe("History Store - INDENT/OUTDENT", () => {
  const makeTasks = (): Task[] => [
    createTask("task-a", "Task A", { order: 0, parent: undefined }),
    createTask("task-b", "Task B", {
      order: 1,
      parent: undefined,
      startDate: "2025-01-11",
      endDate: "2025-01-20",
      duration: 10,
    }),
    createTask("task-c", "Task C", {
      order: 2,
      parent: undefined,
      startDate: "2025-01-21",
      endDate: "2025-01-30",
      duration: 10,
    }),
  ];

  beforeEach(() => {
    resetStores();
    useTaskStore.setState({ tasks: makeTasks() });
  });

  describe("indent undo", () => {
    it("should restore original parent and order on undo", () => {
      const originalTasks = useTaskStore.getState().tasks.map((t) => ({
        id: t.id,
        parent: t.parent,
        order: t.order,
      }));

      useTaskStore.getState().toggleTaskSelection("task-b");
      useTaskStore.getState().indentSelectedTasks();

      const taskB = useTaskStore
        .getState()
        .tasks.find((t) => t.id === "task-b")!;
      expect(taskB.parent).toBe("task-a");

      useHistoryStore.getState().undo();

      const afterUndo = useTaskStore.getState().tasks;
      for (const original of originalTasks) {
        const restored = afterUndo.find((t) => t.id === original.id)!;
        expect(restored.parent).toBe(original.parent);
        expect(restored.order).toBe(original.order);
      }
    });

    it("should restore correct order when multiple tasks are indented", () => {
      useTaskStore.getState().toggleTaskSelection("task-b");
      useTaskStore.getState().toggleTaskSelection("task-c");

      const originalTasks = useTaskStore.getState().tasks.map((t) => ({
        id: t.id,
        parent: t.parent,
        order: t.order,
      }));

      useTaskStore.getState().indentSelectedTasks();

      const afterIndent = useTaskStore.getState().tasks;
      expect(afterIndent.find((t) => t.id === "task-b")!.parent).toBe(
        "task-a"
      );
      expect(afterIndent.find((t) => t.id === "task-c")!.parent).toBe(
        "task-a"
      );

      useHistoryStore.getState().undo();

      const afterUndo = useTaskStore.getState().tasks;
      for (const original of originalTasks) {
        const restored = afterUndo.find((t) => t.id === original.id)!;
        expect(restored.parent).toBe(original.parent);
        expect(restored.order).toBe(original.order);
      }
    });
  });

  describe("outdent undo", () => {
    it("should restore original parent and order on undo", () => {
      useTaskStore.getState().toggleTaskSelection("task-b");
      useTaskStore.getState().indentSelectedTasks();

      useHistoryStore.setState({ undoStack: [], redoStack: [] });

      const beforeOutdent = useTaskStore.getState().tasks.map((t) => ({
        id: t.id,
        parent: t.parent,
        order: t.order,
      }));

      useTaskStore.getState().outdentSelectedTasks();

      const taskB = useTaskStore
        .getState()
        .tasks.find((t) => t.id === "task-b")!;
      expect(taskB.parent).toBeUndefined();

      useHistoryStore.getState().undo();

      const afterUndo = useTaskStore.getState().tasks;
      for (const before of beforeOutdent) {
        const restored = afterUndo.find((t) => t.id === before.id)!;
        expect(restored.parent).toBe(before.parent);
        expect(restored.order).toBe(before.order);
      }
    });
  });

  describe("indent redo", () => {
    it("should re-apply indent after undo+redo", () => {
      useTaskStore.getState().toggleTaskSelection("task-b");
      useTaskStore.getState().indentSelectedTasks();

      const afterIndent = useTaskStore.getState().tasks.map((t) => ({
        id: t.id,
        parent: t.parent,
        order: t.order,
      }));

      useHistoryStore.getState().undo();
      useHistoryStore.getState().redo();

      const afterRedo = useTaskStore.getState().tasks;
      for (const expected of afterIndent) {
        const actual = afterRedo.find((t) => t.id === expected.id)!;
        expect(actual.parent).toBe(expected.parent);
        expect(actual.order).toBe(expected.order);
      }
    });
  });
});

describe("History Store - REORDER_TASKS undo/redo", () => {
  beforeEach(resetStores);

  it("undo restores original task order", () => {
    const t1 = createTask("t1", "Task 1", { order: 0 });
    const t2 = createTask("t2", "Task 2", { order: 1 });
    const t3 = createTask("t3", "Task 3", { order: 2 });
    useTaskStore.setState({ tasks: [t1, t2, t3] });

    // Reorder: move t3 before t1
    useTaskStore.getState().reorderTasks("t3", "t1");

    const afterReorder = useTaskStore.getState().tasks;
    const t3After = afterReorder.find((t) => t.id === "t3")!;
    expect(t3After.order).toBeLessThan(
      afterReorder.find((t) => t.id === "t1")!.order
    );

    useHistoryStore.getState().undo();

    const afterUndo = useTaskStore.getState().tasks;
    expect(afterUndo.find((t) => t.id === "t1")!.order).toBe(0);
    expect(afterUndo.find((t) => t.id === "t2")!.order).toBe(1);
    expect(afterUndo.find((t) => t.id === "t3")!.order).toBe(2);
  });

  it("redo re-applies the reorder via reorderTasks", () => {
    const t1 = createTask("t1", "Task 1", { order: 0 });
    const t2 = createTask("t2", "Task 2", { order: 1 });
    const t3 = createTask("t3", "Task 3", { order: 2 });
    useTaskStore.setState({ tasks: [t1, t2, t3] });

    useTaskStore.getState().reorderTasks("t3", "t1");

    const afterReorder = useTaskStore
      .getState()
      .tasks.map((t) => ({ id: t.id, order: t.order }));

    useHistoryStore.getState().undo();
    useHistoryStore.getState().redo();

    const afterRedo = useTaskStore.getState().tasks;
    for (const expected of afterReorder) {
      expect(afterRedo.find((t) => t.id === expected.id)!.order).toBe(
        expected.order
      );
    }
  });
});

describe("History Store - GROUP_TASKS undo/redo", () => {
  beforeEach(resetStores);

  it("undo removes summary task and restores children parents/order", () => {
    const childA = createTask("child-a", "Child A", {
      order: 0,
      parent: "summary-1",
    });
    const childB = createTask("child-b", "Child B", {
      order: 1,
      parent: "summary-1",
    });
    const summaryTask = createTask("summary-1", "Summary", {
      order: 0,
      type: "summary",
    });
    useTaskStore.setState({ tasks: [summaryTask, childA, childB] });

    const cmd = makeCommand(CommandType.GROUP_TASKS, "Grouped tasks", {
      summaryTaskId: "summary-1",
      summaryTask,
      changes: [
        { taskId: "child-a", oldParent: undefined, oldOrder: 0 },
        { taskId: "child-b", oldParent: undefined, oldOrder: 1 },
      ],
      previousOrder: [
        { id: "child-a", order: 0 },
        { id: "child-b", order: 1 },
      ],
      cascadeUpdates: [],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    const tasks = useTaskStore.getState().tasks;
    expect(tasks.find((t) => t.id === "summary-1")).toBeUndefined();
    expect(tasks.find((t) => t.id === "child-a")?.parent).toBeUndefined();
    expect(tasks.find((t) => t.id === "child-b")?.parent).toBeUndefined();
  });

  it("undo restores cascadeUpdates on summary parent dates", () => {
    const summaryTask = createTask("summary-1", "Summary", {
      order: 0,
      type: "summary",
      startDate: "2025-01-06",
      endDate: "2025-01-15",
    });
    const childA = createTask("child-a", "Child A", {
      order: 1,
      parent: "summary-1",
      startDate: "2025-01-06",
      endDate: "2025-01-10",
    });
    const childB = createTask("child-b", "Child B", {
      order: 2,
      parent: "summary-1",
      startDate: "2025-01-11",
      endDate: "2025-01-15",
    });
    useTaskStore.setState({ tasks: [summaryTask, childA, childB] });

    const cmd = makeCommand(CommandType.GROUP_TASKS, "Grouped tasks", {
      summaryTaskId: "summary-1",
      summaryTask,
      changes: [
        { taskId: "child-a", oldParent: undefined, oldOrder: 0 },
        { taskId: "child-b", oldParent: undefined, oldOrder: 1 },
      ],
      previousOrder: [
        { id: "child-a", order: 0 },
        { id: "child-b", order: 1 },
      ],
      cascadeUpdates: [
        {
          id: "child-a",
          updates: { startDate: "2025-01-06", endDate: "2025-01-10" },
          previousValues: { startDate: "2025-01-01", endDate: "2025-01-05" },
        },
      ],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    const tasks = useTaskStore.getState().tasks;
    const restoredChild = tasks.find((t) => t.id === "child-a")!;
    expect(restoredChild.startDate).toBe("2025-01-01");
    expect(restoredChild.endDate).toBe("2025-01-05");
  });

  it("redo re-inserts summary and reparents children", () => {
    const childA = createTask("child-a", "Child A", {
      order: 0,
      parent: "summary-1",
    });
    const childB = createTask("child-b", "Child B", {
      order: 1,
      parent: "summary-1",
    });
    const summaryTask = createTask("summary-1", "Summary", {
      order: 0,
      type: "summary",
    });
    useTaskStore.setState({ tasks: [summaryTask, childA, childB] });

    const cmd = makeCommand(CommandType.GROUP_TASKS, "Grouped tasks", {
      summaryTaskId: "summary-1",
      summaryTask,
      changes: [
        { taskId: "child-a", oldParent: undefined, oldOrder: 0 },
        { taskId: "child-b", oldParent: undefined, oldOrder: 1 },
      ],
      previousOrder: [
        { id: "child-a", order: 0 },
        { id: "child-b", order: 1 },
      ],
      cascadeUpdates: [],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();
    useHistoryStore.getState().redo();

    const tasks = useTaskStore.getState().tasks;
    expect(tasks.find((t) => t.id === "summary-1")).toBeDefined();
    expect(tasks.find((t) => t.id === "child-a")?.parent).toBe("summary-1");
    expect(tasks.find((t) => t.id === "child-b")?.parent).toBe("summary-1");
  });
});

describe("History Store - UNGROUP_TASKS undo/redo", () => {
  beforeEach(resetStores);

  it("undo restores summary tasks and reparents children back", () => {
    const childA = createTask("child-a", "Child A", {
      order: 0,
      parent: undefined,
    });
    const childB = createTask("child-b", "Child B", {
      order: 1,
      parent: undefined,
    });
    // After ungrouping, summary is gone — children have no parent
    useTaskStore.setState({ tasks: [childA, childB] });

    const summaryTask = createTask("summary-1", "Summary", {
      order: 0,
      type: "summary",
    });
    const dep = createDependency("dep-1", "summary-1", "child-a");

    const cmd = makeCommand(CommandType.UNGROUP_TASKS, "Ungrouped tasks", {
      ungroupedSummaries: [
        {
          summaryTask,
          childChanges: [
            { taskId: "child-a", oldParent: "summary-1", oldOrder: 0 },
            { taskId: "child-b", oldParent: "summary-1", oldOrder: 1 },
          ],
          removedDependencies: [dep],
        },
      ],
      previousOrder: [
        { id: "summary-1", order: 0 },
        { id: "child-a", order: 1 },
        { id: "child-b", order: 2 },
      ],
      cascadeUpdates: [],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    const tasks = useTaskStore.getState().tasks;
    expect(tasks.find((t) => t.id === "summary-1")).toBeDefined();
    expect(tasks.find((t) => t.id === "child-a")?.parent).toBe("summary-1");
    expect(tasks.find((t) => t.id === "child-b")?.parent).toBe("summary-1");
    expect(useDependencyStore.getState().dependencies).toHaveLength(1);
    expect(useDependencyStore.getState().dependencies[0].id).toBe("dep-1");
  });

  it("undo restores cascadeUpdates on surviving tasks", () => {
    const childA = createTask("child-a", "Child A", {
      order: 0,
      parent: undefined,
      startDate: "2025-01-06",
      endDate: "2025-01-10",
    });
    const childB = createTask("child-b", "Child B", {
      order: 1,
      parent: undefined,
      startDate: "2025-01-11",
      endDate: "2025-01-15",
    });
    useTaskStore.setState({ tasks: [childA, childB] });

    const summaryTask = createTask("summary-1", "Summary", {
      order: 0,
      type: "summary",
      startDate: "2025-01-06",
      endDate: "2025-01-15",
    });

    const cmd = makeCommand(CommandType.UNGROUP_TASKS, "Ungrouped tasks", {
      ungroupedSummaries: [
        {
          summaryTask,
          childChanges: [
            { taskId: "child-a", oldParent: "summary-1", oldOrder: 1 },
            { taskId: "child-b", oldParent: "summary-1", oldOrder: 2 },
          ],
          removedDependencies: [],
        },
      ],
      previousOrder: [
        { id: "summary-1", order: 0 },
        { id: "child-a", order: 1 },
        { id: "child-b", order: 2 },
      ],
      cascadeUpdates: [
        {
          id: "child-a",
          updates: { startDate: "2025-01-06", endDate: "2025-01-10" },
          previousValues: { startDate: "2025-01-01", endDate: "2025-01-05" },
        },
      ],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    const tasks = useTaskStore.getState().tasks;
    const restoredChild = tasks.find((t) => t.id === "child-a")!;
    expect(restoredChild.startDate).toBe("2025-01-01");
    expect(restoredChild.endDate).toBe("2025-01-05");
  });

  it("redo removes summaries and reparents children", () => {
    const childA = createTask("child-a", "Child A", {
      order: 0,
      parent: undefined,
    });
    const childB = createTask("child-b", "Child B", {
      order: 1,
      parent: undefined,
    });
    useTaskStore.setState({ tasks: [childA, childB] });

    const summaryTask = createTask("summary-1", "Summary", {
      order: 0,
      type: "summary",
    });

    const cmd = makeCommand(CommandType.UNGROUP_TASKS, "Ungrouped tasks", {
      ungroupedSummaries: [
        {
          summaryTask,
          childChanges: [
            { taskId: "child-a", oldParent: "summary-1", oldOrder: 0 },
            { taskId: "child-b", oldParent: "summary-1", oldOrder: 1 },
          ],
          removedDependencies: [],
        },
      ],
      previousOrder: [
        { id: "summary-1", order: 0 },
        { id: "child-a", order: 1 },
        { id: "child-b", order: 2 },
      ],
      cascadeUpdates: [],
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();
    useHistoryStore.getState().redo();

    const tasks = useTaskStore.getState().tasks;
    expect(tasks.find((t) => t.id === "summary-1")).toBeUndefined();
    expect(tasks.find((t) => t.id === "child-a")?.parent).toBe(
      summaryTask.parent
    );
    expect(tasks.find((t) => t.id === "child-b")?.parent).toBe(
      summaryTask.parent
    );
  });
});

describe("History Store - APPLY_COLORS_TO_MANUAL undo/redo", () => {
  beforeEach(resetStores);

  it("undo restores previous ColorModeState and task colors", () => {
    const task = createTask("t1", "Task 1", {
      color: "#ff0000",
      order: 0,
    });
    useTaskStore.setState({ tasks: [task] });

    const previousColorModeState: ColorModeState = {
      ...DEFAULT_COLOR_MODE_STATE,
      mode: "taskType",
    };

    useChartStore.getState().setColorMode("manual");

    const cmd = makeCommand(
      CommandType.APPLY_COLORS_TO_MANUAL,
      "Applied colors to manual",
      {
        previousColorModeState,
        colorChanges: [
          {
            id: "t1",
            previousColor: "#3b82f6",
            previousColorOverride: undefined,
            newColor: "#ff0000",
          },
        ],
      }
    );
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    expect(useTaskStore.getState().tasks[0].color).toBe("#3b82f6");
    expect(useChartStore.getState().colorModeState.mode).toBe("taskType");
  });

  it("redo reapplies colors and switches to manual mode", () => {
    const task = createTask("t1", "Task 1", {
      color: "#3b82f6",
      order: 0,
    });
    useTaskStore.setState({ tasks: [task] });

    const previousColorModeState: ColorModeState = {
      ...DEFAULT_COLOR_MODE_STATE,
      mode: "taskType",
    };

    const cmd = makeCommand(
      CommandType.APPLY_COLORS_TO_MANUAL,
      "Applied colors to manual",
      {
        previousColorModeState,
        colorChanges: [
          {
            id: "t1",
            previousColor: "#3b82f6",
            previousColorOverride: undefined,
            newColor: "#ff0000",
          },
        ],
      }
    );
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();
    useHistoryStore.getState().redo();

    expect(useTaskStore.getState().tasks[0].color).toBe("#ff0000");
    expect(useChartStore.getState().colorModeState.mode).toBe("manual");
  });
});

describe("History Store - markDirty behavior", () => {
  beforeEach(resetStores);

  it("marks file dirty on data command undo", () => {
    const task = createTask("t1", "Task 1");
    useTaskStore.setState({ tasks: [task] });
    useFileStore.setState({ isDirty: false });

    const cmd = makeCommand(CommandType.UPDATE_TASK, "Updated task", {
      id: "t1",
      updates: { name: "New" },
      previousValues: { name: "Task 1" },
    });
    useHistoryStore.getState().recordCommand(cmd);
    useHistoryStore.getState().undo();

    expect(useFileStore.getState().isDirty).toBe(true);
  });
});
