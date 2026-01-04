import { describe, it, expect, beforeEach, vi } from "vitest";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import { useHistoryStore } from "../../../src/store/slices/historySlice";
import type { Task } from "../../../src/types/chart.types";

// Mock react-hot-toast to prevent console errors
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  toast: vi.fn(),
}));

describe("History Store - MULTI_DRAG_TASKS", () => {
  beforeEach(() => {
    // Reset stores before each test
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
  });

  describe("undo", () => {
    it("should undo multi-drag operation and restore previous dates", () => {
      const tasks: Task[] = [
        {
          id: "task-1",
          name: "Task 1",
          startDate: "2025-01-01",
          endDate: "2025-01-05",
          duration: 5,
          progress: 0,
          color: "#3b82f6",
          order: 0,
          type: "task",
          metadata: {},
        },
        {
          id: "task-2",
          name: "Task 2",
          startDate: "2025-01-06",
          endDate: "2025-01-10",
          duration: 5,
          progress: 0,
          color: "#3b82f6",
          order: 1,
          type: "task",
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { updateMultipleTasks } = useTaskStore.getState();

      // Move both tasks forward by 5 days
      updateMultipleTasks([
        {
          id: "task-1",
          updates: { startDate: "2025-01-06", endDate: "2025-01-10", duration: 5 },
        },
        {
          id: "task-2",
          updates: { startDate: "2025-01-11", endDate: "2025-01-15", duration: 5 },
        },
      ]);

      // Verify changes were applied
      let updatedTasks = useTaskStore.getState().tasks;
      expect(updatedTasks[0].startDate).toBe("2025-01-06");
      expect(updatedTasks[1].startDate).toBe("2025-01-11");

      // Undo the operation
      const { undo } = useHistoryStore.getState();
      undo();

      // Verify tasks are restored
      updatedTasks = useTaskStore.getState().tasks;
      expect(updatedTasks[0].startDate).toBe("2025-01-01");
      expect(updatedTasks[0].endDate).toBe("2025-01-05");
      expect(updatedTasks[1].startDate).toBe("2025-01-06");
      expect(updatedTasks[1].endDate).toBe("2025-01-10");
    });

    it("should undo cascade updates to summary parents", () => {
      const tasks: Task[] = [
        {
          id: "summary",
          name: "Summary",
          startDate: "2025-01-01",
          endDate: "2025-01-10",
          duration: 10,
          progress: 0,
          color: "#3b82f6",
          order: 0,
          type: "summary",
          metadata: {},
        },
        {
          id: "child-1",
          name: "Child 1",
          startDate: "2025-01-01",
          endDate: "2025-01-05",
          duration: 5,
          progress: 0,
          color: "#3b82f6",
          order: 1,
          type: "task",
          parent: "summary",
          metadata: {},
        },
        {
          id: "child-2",
          name: "Child 2",
          startDate: "2025-01-06",
          endDate: "2025-01-10",
          duration: 5,
          progress: 0,
          color: "#3b82f6",
          order: 2,
          type: "task",
          parent: "summary",
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { updateMultipleTasks } = useTaskStore.getState();

      // Move children forward
      updateMultipleTasks([
        {
          id: "child-1",
          updates: { startDate: "2025-01-06", endDate: "2025-01-10", duration: 5 },
        },
        {
          id: "child-2",
          updates: { startDate: "2025-01-11", endDate: "2025-01-15", duration: 5 },
        },
      ]);

      // Verify summary was updated
      let summary = useTaskStore.getState().tasks.find((t) => t.id === "summary");
      expect(summary?.startDate).toBe("2025-01-06");
      expect(summary?.endDate).toBe("2025-01-15");

      // Undo
      const { undo } = useHistoryStore.getState();
      undo();

      // Verify summary is restored
      summary = useTaskStore.getState().tasks.find((t) => t.id === "summary");
      expect(summary?.startDate).toBe("2025-01-01");
      expect(summary?.endDate).toBe("2025-01-10");
    });

    it("should move command from undo stack to redo stack", () => {
      const tasks: Task[] = [
        {
          id: "task-1",
          name: "Task 1",
          startDate: "2025-01-01",
          endDate: "2025-01-05",
          duration: 5,
          progress: 0,
          color: "#3b82f6",
          order: 0,
          type: "task",
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { updateMultipleTasks } = useTaskStore.getState();
      updateMultipleTasks([
        {
          id: "task-1",
          updates: { startDate: "2025-01-06", endDate: "2025-01-10", duration: 5 },
        },
      ]);

      expect(useHistoryStore.getState().undoStack).toHaveLength(1);
      expect(useHistoryStore.getState().redoStack).toHaveLength(0);

      const { undo } = useHistoryStore.getState();
      undo();

      expect(useHistoryStore.getState().undoStack).toHaveLength(0);
      expect(useHistoryStore.getState().redoStack).toHaveLength(1);
    });
  });

  describe("redo", () => {
    it("should redo multi-drag operation and reapply dates", () => {
      const tasks: Task[] = [
        {
          id: "task-1",
          name: "Task 1",
          startDate: "2025-01-01",
          endDate: "2025-01-05",
          duration: 5,
          progress: 0,
          color: "#3b82f6",
          order: 0,
          type: "task",
          metadata: {},
        },
        {
          id: "task-2",
          name: "Task 2",
          startDate: "2025-01-06",
          endDate: "2025-01-10",
          duration: 5,
          progress: 0,
          color: "#3b82f6",
          order: 1,
          type: "task",
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { updateMultipleTasks } = useTaskStore.getState();

      // Move both tasks forward by 5 days
      updateMultipleTasks([
        {
          id: "task-1",
          updates: { startDate: "2025-01-06", endDate: "2025-01-10", duration: 5 },
        },
        {
          id: "task-2",
          updates: { startDate: "2025-01-11", endDate: "2025-01-15", duration: 5 },
        },
      ]);

      // Undo
      const { undo, redo } = useHistoryStore.getState();
      undo();

      // Verify undo worked
      let updatedTasks = useTaskStore.getState().tasks;
      expect(updatedTasks[0].startDate).toBe("2025-01-01");
      expect(updatedTasks[1].startDate).toBe("2025-01-06");

      // Redo
      redo();

      // Verify redo restored the dragged positions
      updatedTasks = useTaskStore.getState().tasks;
      expect(updatedTasks[0].startDate).toBe("2025-01-06");
      expect(updatedTasks[0].endDate).toBe("2025-01-10");
      expect(updatedTasks[1].startDate).toBe("2025-01-11");
      expect(updatedTasks[1].endDate).toBe("2025-01-15");
    });

    it("should redo cascade updates to summary parents", () => {
      const tasks: Task[] = [
        {
          id: "summary",
          name: "Summary",
          startDate: "2025-01-01",
          endDate: "2025-01-10",
          duration: 10,
          progress: 0,
          color: "#3b82f6",
          order: 0,
          type: "summary",
          metadata: {},
        },
        {
          id: "child-1",
          name: "Child 1",
          startDate: "2025-01-01",
          endDate: "2025-01-05",
          duration: 5,
          progress: 0,
          color: "#3b82f6",
          order: 1,
          type: "task",
          parent: "summary",
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { updateMultipleTasks } = useTaskStore.getState();

      // Move child forward
      updateMultipleTasks([
        {
          id: "child-1",
          updates: { startDate: "2025-01-06", endDate: "2025-01-10", duration: 5 },
        },
      ]);

      // Undo
      const { undo, redo } = useHistoryStore.getState();
      undo();

      // Verify summary is back to original
      let summary = useTaskStore.getState().tasks.find((t) => t.id === "summary");
      expect(summary?.startDate).toBe("2025-01-01");

      // Redo
      redo();

      // Verify summary is updated again
      summary = useTaskStore.getState().tasks.find((t) => t.id === "summary");
      expect(summary?.startDate).toBe("2025-01-06");
      expect(summary?.endDate).toBe("2025-01-10");
    });

    it("should move command from redo stack back to undo stack", () => {
      const tasks: Task[] = [
        {
          id: "task-1",
          name: "Task 1",
          startDate: "2025-01-01",
          endDate: "2025-01-05",
          duration: 5,
          progress: 0,
          color: "#3b82f6",
          order: 0,
          type: "task",
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { updateMultipleTasks } = useTaskStore.getState();
      updateMultipleTasks([
        {
          id: "task-1",
          updates: { startDate: "2025-01-06", endDate: "2025-01-10", duration: 5 },
        },
      ]);

      const { undo, redo } = useHistoryStore.getState();
      undo();

      expect(useHistoryStore.getState().undoStack).toHaveLength(0);
      expect(useHistoryStore.getState().redoStack).toHaveLength(1);

      redo();

      expect(useHistoryStore.getState().undoStack).toHaveLength(1);
      expect(useHistoryStore.getState().redoStack).toHaveLength(0);
    });
  });

  describe("multiple undo/redo cycles", () => {
    it("should handle multiple undo/redo operations correctly", () => {
      const tasks: Task[] = [
        {
          id: "task-1",
          name: "Task 1",
          startDate: "2025-01-01",
          endDate: "2025-01-05",
          duration: 5,
          progress: 0,
          color: "#3b82f6",
          order: 0,
          type: "task",
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { updateMultipleTasks } = useTaskStore.getState();

      // First drag
      updateMultipleTasks([
        {
          id: "task-1",
          updates: { startDate: "2025-01-06", endDate: "2025-01-10", duration: 5 },
        },
      ]);

      // Second drag
      updateMultipleTasks([
        {
          id: "task-1",
          updates: { startDate: "2025-01-11", endDate: "2025-01-15", duration: 5 },
        },
      ]);

      // Verify current state
      let task = useTaskStore.getState().tasks[0];
      expect(task.startDate).toBe("2025-01-11");

      // Undo second drag
      useHistoryStore.getState().undo();
      task = useTaskStore.getState().tasks[0];
      expect(task.startDate).toBe("2025-01-06");

      // Undo first drag
      useHistoryStore.getState().undo();
      task = useTaskStore.getState().tasks[0];
      expect(task.startDate).toBe("2025-01-01");

      // Redo first drag
      useHistoryStore.getState().redo();
      task = useTaskStore.getState().tasks[0];
      expect(task.startDate).toBe("2025-01-06");

      // Redo second drag
      useHistoryStore.getState().redo();
      task = useTaskStore.getState().tasks[0];
      expect(task.startDate).toBe("2025-01-11");
    });
  });
});
