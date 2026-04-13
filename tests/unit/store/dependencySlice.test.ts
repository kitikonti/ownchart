import { describe, it, expect, beforeEach } from "vitest";
import { useDependencyStore } from "@/store/slices/dependencySlice";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useHistoryStore } from "@/store/slices/historySlice";
import { useFileStore } from "@/store/slices/fileSlice";
import { useChartStore } from "@/store/slices/chartSlice";
import type { Dependency } from "@/types/dependency.types";
import type { Task } from "@/types/chart.types";
import { CommandType } from "@/types/command.types";
import { tid, hex } from "../../helpers/branded";

/**
 * Helper to create a minimal task for testing.
 */
function createTestTask(overrides: Partial<Task> = {}): Task {
  return {
    id: tid(crypto.randomUUID()),
    name: "Test Task",
    startDate: "2026-01-10",
    endDate: "2026-01-15",
    duration: 5,
    progress: 0,
    color: hex("#3b82f6"),
    order: 0,
    metadata: {},
    ...overrides,
  };
}

/**
 * Helper to create a minimal dependency for testing.
 */
function createTestDependency(overrides: Partial<Dependency> = {}): Dependency {
  return {
    id: crypto.randomUUID(),
    fromTaskId: tid("task-1"),
    toTaskId: tid("task-2"),
    type: "FS",
    lag: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Dependency Store", () => {
  beforeEach(() => {
    // Reset all stores before each test
    useDependencyStore.setState({
      dependencies: [],
      selectedDependencyId: null,
    });
    useTaskStore.setState({
      tasks: [],
      selectedTaskIds: [],
      lastSelectedTaskId: null,
      activeCell: { taskId: null, field: null },
      isEditingCell: false,
      columnWidths: {},
      taskTableWidth: null,
    });
    useHistoryStore.setState({
      undoStack: [],
      redoStack: [],
      isUndoing: false,
      isRedoing: false,
    });
    useFileStore.setState({
      currentFilePath: null,
      isDirty: false,
      lastSavedAt: null,
      isNewFile: true,
      currentFileName: null,
    });
  });

  describe("addDependency", () => {
    it("should create a dependency between two tasks", () => {
      // Setup: Create two tasks
      const taskA = createTestTask({ id: "task-a", name: "Task A" });
      const taskB = createTestTask({ id: "task-b", name: "Task B" });
      useTaskStore.setState({ tasks: [taskA, taskB] });

      // Act
      const { addDependency } = useDependencyStore.getState();
      const result = addDependency("task-a", "task-b");

      // Assert
      expect(result.success).toBe(true);
      expect(result.dependency).toBeDefined();
      expect(result.dependency?.fromTaskId).toBe("task-a");
      expect(result.dependency?.toTaskId).toBe("task-b");
      expect(result.dependency?.type).toBe("FS");
      expect(result.dependency?.lag).toBe(0);

      const deps = useDependencyStore.getState().dependencies;
      expect(deps).toHaveLength(1);
    });

    it("should create a dependency with custom type and lag", () => {
      const taskA = createTestTask({ id: "task-a" });
      const taskB = createTestTask({ id: "task-b" });
      useTaskStore.setState({ tasks: [taskA, taskB] });

      const { addDependency } = useDependencyStore.getState();
      const result = addDependency("task-a", "task-b", "FS", 2);

      expect(result.success).toBe(true);
      expect(result.dependency?.type).toBe("FS");
      expect(result.dependency?.lag).toBe(2);
    });

    it("should reject dependency on self", () => {
      const task = createTestTask({ id: "task-a" });
      useTaskStore.setState({ tasks: [task] });

      const { addDependency } = useDependencyStore.getState();
      const result = addDependency("task-a", "task-a");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Task cannot depend on itself");
      expect(useDependencyStore.getState().dependencies).toHaveLength(0);
    });

    it("should reject if fromTask does not exist", () => {
      const task = createTestTask({ id: "task-b" });
      useTaskStore.setState({ tasks: [task] });

      const { addDependency } = useDependencyStore.getState();
      const result = addDependency("non-existent", "task-b");

      expect(result.success).toBe(false);
      expect(result.error).toBe("One or both tasks not found");
    });

    it("should reject if toTask does not exist", () => {
      const task = createTestTask({ id: "task-a" });
      useTaskStore.setState({ tasks: [task] });

      const { addDependency } = useDependencyStore.getState();
      const result = addDependency("task-a", "non-existent");

      expect(result.success).toBe(false);
      expect(result.error).toBe("One or both tasks not found");
    });

    it("should reject duplicate dependencies", () => {
      const taskA = createTestTask({ id: "task-a" });
      const taskB = createTestTask({ id: "task-b" });
      useTaskStore.setState({ tasks: [taskA, taskB] });

      const { addDependency } = useDependencyStore.getState();

      // First dependency succeeds
      const result1 = addDependency("task-a", "task-b");
      expect(result1.success).toBe(true);

      // Second (duplicate) fails
      const result2 = addDependency("task-a", "task-b");
      expect(result2.success).toBe(false);
      expect(result2.error).toBe("Dependency already exists");
      expect(useDependencyStore.getState().dependencies).toHaveLength(1);
    });

    it("should reject circular dependency (A → B → A)", () => {
      const taskA = createTestTask({ id: "task-a", name: "Task A" });
      const taskB = createTestTask({ id: "task-b", name: "Task B" });
      useTaskStore.setState({ tasks: [taskA, taskB] });

      const { addDependency } = useDependencyStore.getState();

      // A → B succeeds
      addDependency("task-a", "task-b");

      // B → A would create cycle
      const result = addDependency("task-b", "task-a");
      expect(result.success).toBe(false);
      expect(result.error).toContain("circular dependency");
    });

    it("should reject complex circular dependency (A → B → C → A)", () => {
      const taskA = createTestTask({ id: "task-a", name: "Task A" });
      const taskB = createTestTask({ id: "task-b", name: "Task B" });
      const taskC = createTestTask({ id: "task-c", name: "Task C" });
      useTaskStore.setState({ tasks: [taskA, taskB, taskC] });

      const { addDependency } = useDependencyStore.getState();

      addDependency("task-a", "task-b"); // A → B
      addDependency("task-b", "task-c"); // B → C

      // C → A would create cycle
      const result = addDependency("task-c", "task-a");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("circular dependency");
      }
    });

    it("should fall back to task ID in cycle error when intermediate task is not in task list", () => {
      // Set up dependencies A → B → C with B missing from the task store.
      // Validation only checks fromTask and toTask existence, not intermediates.
      const taskA = createTestTask({ id: "task-a", name: "Task A" });
      const taskB = createTestTask({ id: "task-b", name: "Task B" });
      const taskC = createTestTask({ id: "task-c", name: "Task C" });
      useTaskStore.setState({ tasks: [taskA, taskB, taskC] });

      const { addDependency } = useDependencyStore.getState();
      addDependency("task-a", "task-b"); // A → B
      addDependency("task-b", "task-c"); // B → C

      // Remove intermediate task B from the store
      useTaskStore.setState({ tasks: [taskA, taskC] });

      // C → A would create cycle: A → B → C → A — but B is not in task list
      const result = addDependency("task-c", "task-a");
      expect(result.success).toBe(false);
      if (!result.success) {
        // task-b falls back to its ID since it's not in the task list
        expect(result.error).toContain("task-b");
        expect(result.error).toContain("circular dependency");
      }
    });

    it("should record command to history", () => {
      // Use tasks that don't overlap to avoid date adjustment commands
      const taskA = createTestTask({
        id: "task-a",
        name: "Task A",
        startDate: "2026-01-01",
        endDate: "2026-01-05",
      });
      const taskB = createTestTask({
        id: "task-b",
        name: "Task B",
        startDate: "2026-01-10",
        endDate: "2026-01-15",
      });
      useTaskStore.setState({ tasks: [taskA, taskB] });

      const { addDependency } = useDependencyStore.getState();
      addDependency("task-a", "task-b");

      const history = useHistoryStore.getState();
      // Find the ADD_DEPENDENCY command
      const depCommand = history.undoStack.find(
        (cmd) => cmd.type === CommandType.ADD_DEPENDENCY
      );
      expect(depCommand).toBeDefined();
      expect(depCommand?.description).toContain("Task A");
      expect(depCommand?.description).toContain("Task B");
    });

    it("should not record to history when undoing", () => {
      const taskA = createTestTask({ id: "task-a" });
      const taskB = createTestTask({ id: "task-b" });
      useTaskStore.setState({ tasks: [taskA, taskB] });
      useHistoryStore.setState({ isUndoing: true });

      const { addDependency } = useDependencyStore.getState();
      addDependency("task-a", "task-b");

      expect(useHistoryStore.getState().undoStack).toHaveLength(0);
    });

    it("should not record to history when redoing", () => {
      const taskA = createTestTask({ id: "task-a" });
      const taskB = createTestTask({ id: "task-b" });
      useTaskStore.setState({ tasks: [taskA, taskB] });
      useHistoryStore.setState({ isRedoing: true });

      const { addDependency } = useDependencyStore.getState();
      addDependency("task-a", "task-b");

      expect(useHistoryStore.getState().undoStack).toHaveLength(0);
    });

    it("should mark file as dirty", () => {
      const taskA = createTestTask({ id: "task-a" });
      const taskB = createTestTask({ id: "task-b" });
      useTaskStore.setState({ tasks: [taskA, taskB] });

      expect(useFileStore.getState().isDirty).toBe(false);

      const { addDependency } = useDependencyStore.getState();
      addDependency("task-a", "task-b");

      expect(useFileStore.getState().isDirty).toBe(true);
    });

    it("should not automatically move tasks when creating dependency", () => {
      // Task A: Jan 10-15, Task B: Jan 12-17 (overlaps with A)
      // After dependency A→B, B should NOT be moved - dependency only marks the relationship
      const taskA = createTestTask({
        id: "task-a",
        startDate: "2026-01-10",
        endDate: "2026-01-15",
      });
      const taskB = createTestTask({
        id: "task-b",
        startDate: "2026-01-12",
        endDate: "2026-01-17",
      });
      useTaskStore.setState({ tasks: [taskA, taskB] });

      const { addDependency } = useDependencyStore.getState();
      const result = addDependency("task-a", "task-b");

      expect(result.success).toBe(true);
      // Task B should remain at its original position
      const updatedTaskB = useTaskStore.getState().tasks.find((t) => t.id === "task-b");
      expect(updatedTaskB?.startDate).toBe("2026-01-12");
      expect(updatedTaskB?.endDate).toBe("2026-01-17");
    });
  });

  describe("removeDependency", () => {
    it("should remove an existing dependency", () => {
      const dep = createTestDependency({ id: "dep-1" });
      useDependencyStore.setState({ dependencies: [dep] });

      const { removeDependency } = useDependencyStore.getState();
      removeDependency("dep-1");

      expect(useDependencyStore.getState().dependencies).toHaveLength(0);
    });

    it("should do nothing if dependency does not exist", () => {
      const dep = createTestDependency({ id: "dep-1" });
      useDependencyStore.setState({ dependencies: [dep] });

      const { removeDependency } = useDependencyStore.getState();
      removeDependency("non-existent");

      expect(useDependencyStore.getState().dependencies).toHaveLength(1);
    });

    it("should clear selection if deleted dependency was selected", () => {
      const dep = createTestDependency({ id: "dep-1" });
      useDependencyStore.setState({
        dependencies: [dep],
        selectedDependencyId: "dep-1",
      });

      const { removeDependency } = useDependencyStore.getState();
      removeDependency("dep-1");

      expect(useDependencyStore.getState().selectedDependencyId).toBeNull();
    });

    it("should not clear selection if other dependency deleted", () => {
      const dep1 = createTestDependency({ id: "dep-1" });
      const dep2 = createTestDependency({ id: "dep-2" });
      useDependencyStore.setState({
        dependencies: [dep1, dep2],
        selectedDependencyId: "dep-1",
      });

      const { removeDependency } = useDependencyStore.getState();
      removeDependency("dep-2");

      expect(useDependencyStore.getState().selectedDependencyId).toBe("dep-1");
    });

    it("should record command to history", () => {
      const dep = createTestDependency({ id: "dep-1" });
      const taskA = createTestTask({ id: dep.fromTaskId, name: "From Task" });
      const taskB = createTestTask({ id: dep.toTaskId, name: "To Task" });
      useDependencyStore.setState({ dependencies: [dep] });
      useTaskStore.setState({ tasks: [taskA, taskB] });

      const { removeDependency } = useDependencyStore.getState();
      removeDependency("dep-1");

      const history = useHistoryStore.getState();
      expect(history.undoStack).toHaveLength(1);
      expect(history.undoStack[0].type).toBe(CommandType.DELETE_DEPENDENCY);
    });

    it("should not record to history when undoing", () => {
      const dep = createTestDependency({ id: "dep-1" });
      useDependencyStore.setState({ dependencies: [dep] });
      useHistoryStore.setState({ isUndoing: true });

      const { removeDependency } = useDependencyStore.getState();
      removeDependency("dep-1");

      expect(useHistoryStore.getState().undoStack).toHaveLength(0);
    });

    it("should not record to history when redoing", () => {
      const dep = createTestDependency({ id: "dep-1" });
      useDependencyStore.setState({ dependencies: [dep] });
      useHistoryStore.setState({ isRedoing: true });

      const { removeDependency } = useDependencyStore.getState();
      removeDependency("dep-1");

      expect(useHistoryStore.getState().undoStack).toHaveLength(0);
    });

    it("should mark file as dirty", () => {
      const dep = createTestDependency({ id: "dep-1" });
      useDependencyStore.setState({ dependencies: [dep] });

      const { removeDependency } = useDependencyStore.getState();
      removeDependency("dep-1");

      expect(useFileStore.getState().isDirty).toBe(true);
    });
  });

  describe("updateDependency", () => {
    it("should update an existing dependency", () => {
      const dep = createTestDependency({ id: "dep-1", lag: 0 });
      useDependencyStore.setState({ dependencies: [dep] });

      const { updateDependency } = useDependencyStore.getState();
      updateDependency("dep-1", { lag: 5 });

      const updated = useDependencyStore.getState().dependencies[0];
      expect(updated.lag).toBe(5);
    });

    it("should do nothing if dependency does not exist", () => {
      const dep = createTestDependency({ id: "dep-1", lag: 0 });
      useDependencyStore.setState({ dependencies: [dep] });

      const { updateDependency } = useDependencyStore.getState();
      updateDependency("non-existent", { lag: 5 });

      expect(useDependencyStore.getState().dependencies[0].lag).toBe(0);
    });

    it("should update dependency type", () => {
      const dep = createTestDependency({ id: "dep-1", type: "FS" });
      useDependencyStore.setState({ dependencies: [dep] });

      const { updateDependency } = useDependencyStore.getState();
      updateDependency("dep-1", { type: "SS" });

      const updated = useDependencyStore.getState().dependencies[0];
      expect(updated.type).toBe("SS");

      const history = useHistoryStore.getState();
      expect(history.undoStack[0].params).toMatchObject({
        id: "dep-1",
        updates: { type: "SS" },
        previousValues: { type: "FS" },
      });
    });

    it("should record command to history with previous values", () => {
      const dep = createTestDependency({ id: "dep-1", lag: 0 });
      useDependencyStore.setState({ dependencies: [dep] });

      const { updateDependency } = useDependencyStore.getState();
      updateDependency("dep-1", { lag: 5 });

      const history = useHistoryStore.getState();
      expect(history.undoStack).toHaveLength(1);
      expect(history.undoStack[0].type).toBe(CommandType.UPDATE_DEPENDENCY);
      expect(history.undoStack[0].params).toMatchObject({
        id: "dep-1",
        updates: { lag: 5 },
        previousValues: { lag: 0 },
      });
    });

    it("should not record to history when undoing", () => {
      const dep = createTestDependency({ id: "dep-1", lag: 0 });
      useDependencyStore.setState({ dependencies: [dep] });
      useHistoryStore.setState({ isUndoing: true });

      const { updateDependency } = useDependencyStore.getState();
      updateDependency("dep-1", { lag: 5 });

      expect(useHistoryStore.getState().undoStack).toHaveLength(0);
    });

    it("should not record to history when redoing", () => {
      const dep = createTestDependency({ id: "dep-1", lag: 0 });
      useDependencyStore.setState({ dependencies: [dep] });
      useHistoryStore.setState({ isRedoing: true });

      const { updateDependency } = useDependencyStore.getState();
      updateDependency("dep-1", { lag: 5 });

      expect(useHistoryStore.getState().undoStack).toHaveLength(0);
    });

    it("should mark file as dirty", () => {
      const dep = createTestDependency({ id: "dep-1" });
      useDependencyStore.setState({ dependencies: [dep] });

      const { updateDependency } = useDependencyStore.getState();
      updateDependency("dep-1", { lag: 3 });

      expect(useFileStore.getState().isDirty).toBe(true);
    });
  });

  describe("setDependencies", () => {
    it("should replace all dependencies", () => {
      const oldDep = createTestDependency({ id: "old-dep" });
      useDependencyStore.setState({ dependencies: [oldDep] });

      const newDeps = [
        createTestDependency({ id: "new-dep-1" }),
        createTestDependency({ id: "new-dep-2" }),
      ];

      const { setDependencies } = useDependencyStore.getState();
      setDependencies(newDeps);

      const deps = useDependencyStore.getState().dependencies;
      expect(deps).toHaveLength(2);
      expect(deps[0].id).toBe("new-dep-1");
      expect(deps[1].id).toBe("new-dep-2");
    });

    it("should handle empty array", () => {
      const dep = createTestDependency();
      useDependencyStore.setState({ dependencies: [dep] });

      const { setDependencies } = useDependencyStore.getState();
      setDependencies([]);

      expect(useDependencyStore.getState().dependencies).toHaveLength(0);
    });
  });

  describe("clearDependencies", () => {
    it("should remove all dependencies", () => {
      const deps = [
        createTestDependency({ id: "dep-1" }),
        createTestDependency({ id: "dep-2" }),
      ];
      useDependencyStore.setState({ dependencies: deps });

      const { clearDependencies } = useDependencyStore.getState();
      clearDependencies();

      expect(useDependencyStore.getState().dependencies).toHaveLength(0);
    });

    it("should clear selection", () => {
      const dep = createTestDependency({ id: "dep-1" });
      useDependencyStore.setState({
        dependencies: [dep],
        selectedDependencyId: "dep-1",
      });

      const { clearDependencies } = useDependencyStore.getState();
      clearDependencies();

      expect(useDependencyStore.getState().selectedDependencyId).toBeNull();
    });
  });

  describe("removeDependenciesForTask", () => {
    it("should remove all dependencies where task is predecessor", () => {
      const deps = [
        createTestDependency({ id: "dep-1", fromTaskId: "task-a", toTaskId: "task-b" }),
        createTestDependency({ id: "dep-2", fromTaskId: "task-a", toTaskId: "task-c" }),
        createTestDependency({ id: "dep-3", fromTaskId: "task-b", toTaskId: "task-c" }),
      ];
      useDependencyStore.setState({ dependencies: deps });

      const { removeDependenciesForTask } = useDependencyStore.getState();
      const removed = removeDependenciesForTask("task-a");

      expect(removed).toHaveLength(2);
      expect(useDependencyStore.getState().dependencies).toHaveLength(1);
      expect(useDependencyStore.getState().dependencies[0].id).toBe("dep-3");
    });

    it("should remove all dependencies where task is successor", () => {
      const deps = [
        createTestDependency({ id: "dep-1", fromTaskId: "task-a", toTaskId: "task-b" }),
        createTestDependency({ id: "dep-2", fromTaskId: "task-c", toTaskId: "task-b" }),
      ];
      useDependencyStore.setState({ dependencies: deps });

      const { removeDependenciesForTask } = useDependencyStore.getState();
      const removed = removeDependenciesForTask("task-b");

      expect(removed).toHaveLength(2);
      expect(useDependencyStore.getState().dependencies).toHaveLength(0);
    });

    it("should return empty array if no dependencies for task", () => {
      const deps = [
        createTestDependency({ id: "dep-1", fromTaskId: "task-a", toTaskId: "task-b" }),
      ];
      useDependencyStore.setState({ dependencies: deps });

      const { removeDependenciesForTask } = useDependencyStore.getState();
      const removed = removeDependenciesForTask("task-c");

      expect(removed).toHaveLength(0);
      expect(useDependencyStore.getState().dependencies).toHaveLength(1);
    });

    it("should clear selection if removed dependency was selected", () => {
      const deps = [
        createTestDependency({ id: "dep-1", fromTaskId: "task-a", toTaskId: "task-b" }),
      ];
      useDependencyStore.setState({
        dependencies: deps,
        selectedDependencyId: "dep-1",
      });

      const { removeDependenciesForTask } = useDependencyStore.getState();
      removeDependenciesForTask("task-a");

      expect(useDependencyStore.getState().selectedDependencyId).toBeNull();
    });

    it("should mark file as dirty when dependencies removed", () => {
      const deps = [
        createTestDependency({ id: "dep-1", fromTaskId: "task-a", toTaskId: "task-b" }),
      ];
      useDependencyStore.setState({ dependencies: deps });

      const { removeDependenciesForTask } = useDependencyStore.getState();
      removeDependenciesForTask("task-a");

      expect(useFileStore.getState().isDirty).toBe(true);
    });

    it("should not mark file as dirty when no dependencies removed", () => {
      useDependencyStore.setState({ dependencies: [] });

      const { removeDependenciesForTask } = useDependencyStore.getState();
      removeDependenciesForTask("task-a");

      expect(useFileStore.getState().isDirty).toBe(false);
    });
  });

  describe("selectDependency", () => {
    it("should set selected dependency", () => {
      const { selectDependency } = useDependencyStore.getState();
      selectDependency("dep-1");

      expect(useDependencyStore.getState().selectedDependencyId).toBe("dep-1");
    });

    it("should clear selection with null", () => {
      useDependencyStore.setState({ selectedDependencyId: "dep-1" });

      const { selectDependency } = useDependencyStore.getState();
      selectDependency(null);

      expect(useDependencyStore.getState().selectedDependencyId).toBeNull();
    });
  });

  describe("getDependenciesForTask", () => {
    it("should return predecessors and successors", () => {
      const deps = [
        createTestDependency({ id: "dep-1", fromTaskId: "task-a", toTaskId: "task-b" }),
        createTestDependency({ id: "dep-2", fromTaskId: "task-b", toTaskId: "task-c" }),
        createTestDependency({ id: "dep-3", fromTaskId: "task-d", toTaskId: "task-b" }),
      ];
      useDependencyStore.setState({ dependencies: deps });

      const { getDependenciesForTask } = useDependencyStore.getState();
      const result = getDependenciesForTask("task-b");

      expect(result.predecessors).toHaveLength(2); // dep-1 and dep-3
      expect(result.successors).toHaveLength(1); // dep-2
    });

    it("should return empty arrays for task with no dependencies", () => {
      const deps = [
        createTestDependency({ id: "dep-1", fromTaskId: "task-a", toTaskId: "task-b" }),
      ];
      useDependencyStore.setState({ dependencies: deps });

      const { getDependenciesForTask } = useDependencyStore.getState();
      const result = getDependenciesForTask("task-c");

      expect(result.predecessors).toHaveLength(0);
      expect(result.successors).toHaveLength(0);
    });
  });

  describe("getDependencyById", () => {
    it("should return dependency if found", () => {
      const dep = createTestDependency({ id: "dep-1" });
      useDependencyStore.setState({ dependencies: [dep] });

      const { getDependencyById } = useDependencyStore.getState();
      const result = getDependencyById("dep-1");

      expect(result).toBeDefined();
      expect(result?.id).toBe("dep-1");
    });

    it("should return undefined if not found", () => {
      const { getDependencyById } = useDependencyStore.getState();
      const result = getDependencyById("non-existent");

      expect(result).toBeUndefined();
    });
  });

  describe("hasDependency", () => {
    it("should return true if dependency exists", () => {
      const dep = createTestDependency({ fromTaskId: "task-a", toTaskId: "task-b" });
      useDependencyStore.setState({ dependencies: [dep] });

      const { hasDependency } = useDependencyStore.getState();
      expect(hasDependency("task-a", "task-b")).toBe(true);
    });

    it("should return false if dependency does not exist", () => {
      const dep = createTestDependency({ fromTaskId: "task-a", toTaskId: "task-b" });
      useDependencyStore.setState({ dependencies: [dep] });

      const { hasDependency } = useDependencyStore.getState();
      expect(hasDependency("task-b", "task-a")).toBe(false);
      expect(hasDependency("task-a", "task-c")).toBe(false);
    });

    it("should return false for empty dependencies", () => {
      const { hasDependency } = useDependencyStore.getState();
      expect(hasDependency("task-a", "task-b")).toBe(false);
    });
  });

  describe("checkWouldCreateCycle", () => {
    it("should return false for valid dependency", () => {
      const { checkWouldCreateCycle } = useDependencyStore.getState();
      const result = checkWouldCreateCycle("task-a", "task-b");

      expect(result.hasCycle).toBe(false);
    });

    it("should detect direct cycle", () => {
      const dep = createTestDependency({ fromTaskId: "task-a", toTaskId: "task-b" });
      useDependencyStore.setState({ dependencies: [dep] });

      const { checkWouldCreateCycle } = useDependencyStore.getState();
      const result = checkWouldCreateCycle("task-b", "task-a");

      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toBeDefined();
    });

    it("should detect complex cycle", () => {
      const deps = [
        createTestDependency({ fromTaskId: "task-a", toTaskId: "task-b" }),
        createTestDependency({ fromTaskId: "task-b", toTaskId: "task-c" }),
      ];
      useDependencyStore.setState({ dependencies: deps });

      const { checkWouldCreateCycle } = useDependencyStore.getState();
      const result = checkWouldCreateCycle("task-c", "task-a");

      expect(result.hasCycle).toBe(true);
    });
  });

  // ─── Working-days-aware panel-edit propagation (#82 stage 3) ──────────────
  //
  // These tests pin the new contract: dependency panel edits route through
  // propagateDateChanges with the workingDays context, replacing the deleted
  // enforceDepConstraint post-processor. They also document the (intentional)
  // behaviour change that the cascade is now bidirectional throughout the
  // chain — previously only the direct successor moved bidirectionally.

  describe("updateDependency — working-days mode", () => {
    beforeEach(() => {
      useChartStore.setState({
        autoScheduling: true,
        workingDaysConfig: {
          excludeSaturday: true,
          excludeSunday: true,
          excludeHolidays: false,
        },
        holidayRegion: "US",
      });
    });

    it("snaps successor to Monday when predecessor ends Friday and lag=0wd", () => {
      // Reference week: Mon 2026-01-05 .. Fri 2026-01-09 (predecessor),
      // Sat 10 / Sun 11 excluded, Mon 12 .. (successor).
      const pred = createTestTask({
        id: tid("pred"),
        startDate: "2026-01-05",
        endDate: "2026-01-09",
        duration: 5,
      });
      const succ = createTestTask({
        id: tid("succ"),
        // Start somewhere far away so the panel edit must move it.
        startDate: "2026-01-20",
        endDate: "2026-01-22",
        duration: 3,
      });
      useTaskStore.setState({ tasks: [pred, succ] });

      const dep = createTestDependency({
        id: "dep-fs",
        fromTaskId: tid("pred"),
        toTaskId: tid("succ"),
        type: "FS",
        lag: 5, // arbitrary; will be reset to 0
      });
      useDependencyStore.setState({ dependencies: [dep] });

      const { updateDependency } = useDependencyStore.getState();
      updateDependency("dep-fs", { lag: 0 });

      const after = useTaskStore
        .getState()
        .tasks.find((t) => t.id === tid("succ"));
      // FS lag=0 in WD mode → first working day on/after dayAfterPred (Sat 10)
      // → Mon 2026-01-12. Span = 3 working days → ends Wed 2026-01-14.
      expect(after?.startDate).toBe("2026-01-12");
      expect(after?.endDate).toBe("2026-01-14");
    });

    it("cascades bidirectionally through a 3-task chain on lag reduction", () => {
      // A → B (FS lag=5wd) → C (FS lag=0wd)
      // Initial positions are correct for the *current* lag, then we shrink
      // A→B's lag and verify both B and C move *earlier*. Pre-stage-3 the
      // direct successor (B) would move earlier but C would not, because
      // the cascade was forward-only and only triggered when later positions
      // were forced.
      const a = createTestTask({
        id: tid("a"),
        startDate: "2026-01-05",
        endDate: "2026-01-09",
        duration: 5,
      });
      const b = createTestTask({
        id: tid("b"),
        // FS lag=5wd from A: dayAfter Sat 10 → Mon 12 (lag=0) → +5wd → Mon 19
        startDate: "2026-01-19",
        endDate: "2026-01-21",
        duration: 3,
      });
      const c = createTestTask({
        id: tid("c"),
        // FS lag=0 from B: dayAfter Wed 21 → Thu 22
        startDate: "2026-01-22",
        endDate: "2026-01-23",
        duration: 2,
      });
      useTaskStore.setState({ tasks: [a, b, c] });

      const ab = createTestDependency({
        id: "dep-ab",
        fromTaskId: tid("a"),
        toTaskId: tid("b"),
        type: "FS",
        lag: 5,
      });
      const bc = createTestDependency({
        id: "dep-bc",
        fromTaskId: tid("b"),
        toTaskId: tid("c"),
        type: "FS",
        lag: 0,
      });
      useDependencyStore.setState({ dependencies: [ab, bc] });

      const { updateDependency } = useDependencyStore.getState();
      updateDependency("dep-ab", { lag: 0 });

      const tasks = useTaskStore.getState().tasks;
      const newB = tasks.find((t) => t.id === tid("b"));
      const newC = tasks.find((t) => t.id === tid("c"));
      // B snaps to Mon 12 (FS lag=0 from A ending Fri 09).
      expect(newB?.startDate).toBe("2026-01-12");
      // C cascades bidirectionally — moves earlier to follow B.
      // FS lag=0 from B ending Wed 14 → dayAfter Thu 15 → Thu 15.
      expect(newC?.startDate).toBe("2026-01-15");
    });

    it("hidden tasks still participate in scheduling propagation (#82 stage 6)", () => {
      // hiddenTaskIds removes a row from the rendered table but the task
      // must still cascade through propagateDateChanges — the propagation
      // pass operates on the full task list, not the visible/flattened one.
      // Regression test for the explicit decision in #79 + #82 stage 6 plan.
      // Use no exclusions so WD arithmetic behaves like calendar arithmetic.
      useChartStore.setState({
        autoScheduling: true,
        workingDaysConfig: {
          excludeSaturday: false,
          excludeSunday: false,
          excludeHolidays: false,
        },
        hiddenTaskIds: new Set([tid("middle")]),
      });
      // Confirm the test setup actually applied — we want to prove the
      // cascade ignores hidden state, but only if the state IS hidden.
      expect(useChartStore.getState().hiddenTaskIds.has(tid("middle"))).toBe(
        true
      );
      const a = createTestTask({
        id: tid("a"),
        startDate: "2026-01-05",
        endDate: "2026-01-09",
        duration: 5,
      });
      const middle = createTestTask({
        id: tid("middle"),
        startDate: "2026-01-12",
        endDate: "2026-01-14",
        duration: 3,
      });
      const c = createTestTask({
        id: tid("c"),
        startDate: "2026-01-15",
        endDate: "2026-01-16",
        duration: 2,
      });
      useTaskStore.setState({ tasks: [a, middle, c] });

      const ab = createTestDependency({
        id: "dep-a-mid",
        fromTaskId: tid("a"),
        toTaskId: tid("middle"),
        type: "FS",
        lag: 0,
      });
      const bc = createTestDependency({
        id: "dep-mid-c",
        fromTaskId: tid("middle"),
        toTaskId: tid("c"),
        type: "FS",
        lag: 0,
      });
      useDependencyStore.setState({ dependencies: [ab, bc] });

      // Update the visible-but-hidden middle task should NOT be required —
      // the test exercises the cascade *through* a hidden task. We trigger
      // the cascade by tightening the A→middle lag via panel edit and
      // verify the hidden middle task is moved AND the cascade reaches C.
      useDependencyStore.getState().updateDependency("dep-a-mid", { lag: 1 });

      const tasks = useTaskStore.getState().tasks;
      const newMiddle = tasks.find((t) => t.id === tid("middle"));
      const newC = tasks.find((t) => t.id === tid("c"));
      // Middle is hidden but its dates were updated by the cascade.
      expect(newMiddle?.startDate).toBe("2026-01-11");
      // Cascade reached C through the hidden middle task.
      expect(newC?.startDate).toBe("2026-01-14");
    });

  });

});
