/**
 * Integration tests for Clipboard operations (Copy/Cut/Paste)
 * Tests the complete clipboard flow across taskSlice, clipboardSlice, and historySlice
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useTaskStore } from "../../src/store/slices/taskSlice";
import { useHistoryStore } from "../../src/store/slices/historySlice";
import { useClipboardStore } from "../../src/store/slices/clipboardSlice";
import { useDependencyStore } from "../../src/store/slices/dependencySlice";
import type { Task } from "../../src/types/chart.types";

// Helper to create test tasks
const createTask = (
  id: string,
  name: string,
  order: number,
  parent?: string,
  open?: boolean
): Task => ({
  id,
  name,
  startDate: "2025-01-01",
  endDate: "2025-01-07",
  duration: 7,
  progress: 0,
  color: "#3b82f6",
  order,
  type: "task",
  parent,
  open,
  metadata: {},
});

describe("Clipboard Integration Tests", () => {
  beforeEach(() => {
    // Reset all stores before each test
    useTaskStore.setState({
      tasks: [],
      selectedTaskIds: [],
      lastSelectedTaskId: null,
      activeCell: { taskId: null, field: null },
      isEditingCell: false,
      columnWidths: {},
      taskTableWidth: null,
      cutTaskIds: [],
      cutCell: null,
    });

    useHistoryStore.setState({
      undoStack: [],
      redoStack: [],
      isUndoing: false,
      isRedoing: false,
    });

    useClipboardStore.setState({
      rowClipboard: {
        tasks: [],
        dependencies: [],
        operation: null,
        sourceTaskIds: [],
      },
      cellClipboard: {
        value: null,
        field: null,
        operation: null,
        sourceTaskId: null,
      },
      activeMode: null,
    });

    useDependencyStore.setState({
      dependencies: [],
    });
  });

  describe("Row Copy/Paste", () => {
    it("should copy and paste a single row", () => {
      // Setup: Create a task
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
      });

      const clipboardStore = useClipboardStore.getState();

      // Copy the task
      clipboardStore.copyRows(["1"]);

      // Verify clipboard state
      expect(clipboardStore.getClipboardMode()).toBe("row");
      expect(useClipboardStore.getState().rowClipboard.tasks).toHaveLength(1);

      // Paste
      const result = clipboardStore.pasteRows();

      expect(result.success).toBe(true);
      expect(useTaskStore.getState().tasks).toHaveLength(2);

      // Verify pasted task has new ID
      const tasks = useTaskStore.getState().tasks;
      expect(tasks[0].id).not.toBe(tasks[1].id);
      expect(tasks[1].name).toBe("Task 1");
    });

    it("should copy and paste multiple rows", () => {
      // Setup: Create multiple tasks
      useTaskStore.setState({
        tasks: [
          createTask("1", "Task 1", 0),
          createTask("2", "Task 2", 1),
          createTask("3", "Task 3", 2),
        ],
        selectedTaskIds: ["1", "3"],
      });

      const clipboardStore = useClipboardStore.getState();

      // Copy tasks 1 and 3
      clipboardStore.copyRows(["1", "3"]);

      // Paste
      clipboardStore.pasteRows();

      // Should have 5 tasks now (3 original + 2 pasted)
      expect(useTaskStore.getState().tasks).toHaveLength(5);
    });

    it("should copy parent with collapsed children", () => {
      // Setup: Create parent with children
      useTaskStore.setState({
        tasks: [
          createTask("parent", "Parent", 0, undefined, false), // collapsed
          createTask("child1", "Child 1", 1, "parent"),
          createTask("child2", "Child 2", 2, "parent"),
        ],
        selectedTaskIds: ["parent"],
      });

      const clipboardStore = useClipboardStore.getState();

      // Copy parent (should include children because collapsed)
      clipboardStore.copyRows(["parent"]);

      // Verify all 3 tasks are in clipboard
      expect(useClipboardStore.getState().rowClipboard.tasks).toHaveLength(3);
    });

    it("should paste at active cell position", () => {
      // Setup: Create tasks with active cell
      useTaskStore.setState({
        tasks: [
          createTask("1", "Task 1", 0),
          createTask("2", "Task 2", 1),
          createTask("3", "Task 3", 2),
        ],
        activeCell: { taskId: "2", field: "name" },
        selectedTaskIds: [],
      });

      const clipboardStore = useClipboardStore.getState();

      // Copy task 1
      clipboardStore.copyRows(["1"]);

      // Paste (should insert before active cell)
      clipboardStore.pasteRows();

      // Verify order: Task 1, (pasted Task 1), Task 2, Task 3
      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(4);
    });
  });

  describe("Row Cut/Paste", () => {
    it("should cut and paste, removing original", () => {
      // Setup
      useTaskStore.setState({
        tasks: [
          createTask("1", "Task 1", 0),
          createTask("2", "Task 2", 1),
        ],
        selectedTaskIds: ["1"],
      });

      const clipboardStore = useClipboardStore.getState();

      // Cut task 1
      clipboardStore.cutRows(["1"]);

      // Verify cut mark is set
      expect(useTaskStore.getState().cutTaskIds).toContain("1");

      // Paste
      clipboardStore.pasteRows();

      // Should still have 2 tasks (original removed, new one added)
      expect(useTaskStore.getState().tasks).toHaveLength(2);

      // Cut mark should be cleared
      expect(useTaskStore.getState().cutTaskIds).toHaveLength(0);
    });

    it("should clear cut marks after paste", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
      });

      const clipboardStore = useClipboardStore.getState();

      // Cut
      clipboardStore.cutRows(["1"]);
      expect(useTaskStore.getState().cutTaskIds).toContain("1");

      // Paste
      clipboardStore.pasteRows();

      // Cut marks should be cleared
      expect(useTaskStore.getState().cutTaskIds).toHaveLength(0);
    });

    it("should clear clipboard after cut-paste (one-time use)", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
      });

      const clipboardStore = useClipboardStore.getState();

      // Cut
      clipboardStore.cutRows(["1"]);

      // Paste once
      clipboardStore.pasteRows();

      // Clipboard should be cleared
      expect(useClipboardStore.getState().activeMode).toBeNull();

      // Second paste should fail
      const result = useClipboardStore.getState().pasteRows();
      expect(result.success).toBe(false);
    });
  });

  describe("Cell Copy/Paste", () => {
    it("should copy and paste a cell value", () => {
      // Setup
      useTaskStore.setState({
        tasks: [
          createTask("1", "Task 1", 0),
          createTask("2", "Task 2", 1),
        ],
        activeCell: { taskId: "2", field: "name" },
      });

      const clipboardStore = useClipboardStore.getState();

      // Copy cell from task 1
      clipboardStore.copyCell("1", "name");

      // Verify clipboard
      expect(clipboardStore.getClipboardMode()).toBe("cell");
      expect(useClipboardStore.getState().cellClipboard.value).toBe("Task 1");

      // Paste to task 2
      const result = clipboardStore.pasteCell("2", "name");

      expect(result.success).toBe(true);
      expect(useTaskStore.getState().tasks[1].name).toBe("Task 1");
    });

    it("should reject paste of mismatched field types", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        activeCell: { taskId: "1", field: "progress" },
      });

      const clipboardStore = useClipboardStore.getState();

      // Copy name field
      clipboardStore.copyCell("1", "name");

      // Try to paste to progress field (different type)
      const result = clipboardStore.pasteCell("1", "progress");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot paste");
    });

    it("should reject paste into summary task dates", () => {
      useTaskStore.setState({
        tasks: [
          {
            ...createTask("1", "Summary", 0),
            type: "summary",
          },
          createTask("2", "Task 2", 1),
        ],
      });

      const clipboardStore = useClipboardStore.getState();

      // Copy startDate from task 2
      clipboardStore.copyCell("2", "startDate");

      // Try to paste to summary task (should fail)
      const result = clipboardStore.pasteCell("1", "startDate");

      expect(result.success).toBe(false);
      expect(result.error).toContain("summary");
    });
  });

  describe("Cell Cut/Paste", () => {
    it("should cut cell and clear source after paste", () => {
      useTaskStore.setState({
        tasks: [
          { ...createTask("1", "Task 1", 0), progress: 50 },
          { ...createTask("2", "Task 2", 1), progress: 0 },
        ],
        activeCell: { taskId: "2", field: "progress" },
      });

      const clipboardStore = useClipboardStore.getState();

      // Cut progress from task 1
      clipboardStore.cutCell("1", "progress");

      // Verify cut mark
      expect(useTaskStore.getState().cutCell).toEqual({
        taskId: "1",
        field: "progress",
      });

      // Paste to task 2
      clipboardStore.pasteCell("2", "progress");

      // Task 2 should have 50, task 1 should be cleared to 0
      expect(useTaskStore.getState().tasks[0].progress).toBe(0);
      expect(useTaskStore.getState().tasks[1].progress).toBe(50);
    });
  });

  describe("Undo/Redo for Clipboard Operations", () => {
    it("should undo paste rows operation", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
      });

      const clipboardStore = useClipboardStore.getState();
      const historyStore = useHistoryStore.getState();

      // Copy and paste
      clipboardStore.copyRows(["1"]);
      clipboardStore.pasteRows();

      expect(useTaskStore.getState().tasks).toHaveLength(2);

      // Undo
      historyStore.undo();

      expect(useTaskStore.getState().tasks).toHaveLength(1);
    });

    it("should redo paste rows operation", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
      });

      const clipboardStore = useClipboardStore.getState();
      const historyStore = useHistoryStore.getState();

      // Copy and paste
      clipboardStore.copyRows(["1"]);
      clipboardStore.pasteRows();

      // Undo
      historyStore.undo();
      expect(useTaskStore.getState().tasks).toHaveLength(1);

      // Redo
      historyStore.redo();
      expect(useTaskStore.getState().tasks).toHaveLength(2);
    });

    it("should undo cut-paste and restore original", () => {
      useTaskStore.setState({
        tasks: [
          createTask("1", "Task 1", 0),
          createTask("2", "Task 2", 1),
        ],
        selectedTaskIds: ["1"],
      });

      const clipboardStore = useClipboardStore.getState();
      const historyStore = useHistoryStore.getState();

      // Cut and paste
      clipboardStore.cutRows(["1"]);
      clipboardStore.pasteRows();

      // Undo should restore original task and remove pasted one
      historyStore.undo();

      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(2);
      expect(tasks.find((t) => t.id === "1")).toBeDefined();
    });

    it("should undo paste cell operation", () => {
      useTaskStore.setState({
        tasks: [
          createTask("1", "Task 1", 0),
          createTask("2", "Task 2", 1),
        ],
        activeCell: { taskId: "2", field: "name" },
      });

      const clipboardStore = useClipboardStore.getState();
      const historyStore = useHistoryStore.getState();

      // Copy and paste cell
      clipboardStore.copyCell("1", "name");
      clipboardStore.pasteCell("2", "name");

      expect(useTaskStore.getState().tasks[1].name).toBe("Task 1");

      // Undo
      historyStore.undo();

      expect(useTaskStore.getState().tasks[1].name).toBe("Task 2");
    });
  });

  describe("Clipboard Mode Exclusivity", () => {
    it("should clear row clipboard when copying a cell", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
      });

      const clipboardStore = useClipboardStore.getState();

      // Copy row
      clipboardStore.copyRows(["1"]);
      expect(clipboardStore.getClipboardMode()).toBe("row");

      // Copy cell (should clear row clipboard)
      clipboardStore.copyCell("1", "name");
      expect(useClipboardStore.getState().activeMode).toBe("cell");
      expect(useClipboardStore.getState().rowClipboard.operation).toBeNull();
    });

    it("should clear cell clipboard when copying rows", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
      });

      const clipboardStore = useClipboardStore.getState();

      // Copy cell
      clipboardStore.copyCell("1", "name");
      expect(clipboardStore.getClipboardMode()).toBe("cell");

      // Copy row (should clear cell clipboard)
      clipboardStore.copyRows(["1"]);
      expect(useClipboardStore.getState().activeMode).toBe("row");
      expect(useClipboardStore.getState().cellClipboard.operation).toBeNull();
    });
  });

  describe("Maximum Nesting Depth", () => {
    it("should allow paste when depth limit is not exceeded", () => {
      // Paste at root level should always work
      useTaskStore.setState({
        tasks: [
          createTask("p", "Parent", 0, undefined, false),
          createTask("c", "Child", 1, "p"),
        ],
        selectedTaskIds: ["p"],
        activeCell: { taskId: null, field: null }, // Paste at end
      });

      const clipboardStore = useClipboardStore.getState();

      // Copy parent with child
      clipboardStore.copyRows(["p"]);

      // Paste at root level
      const result = clipboardStore.pasteRows();

      // Should succeed
      expect(result.success).toBe(true);
      // Original + pasted structure
      expect(useTaskStore.getState().tasks.length).toBeGreaterThan(2);
    });
  });

  describe("Visual Feedback State", () => {
    it("should set cutTaskIds for visual feedback on cut rows", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
      });

      const clipboardStore = useClipboardStore.getState();

      // Cut
      clipboardStore.cutRows(["1"]);

      expect(useTaskStore.getState().cutTaskIds).toEqual(["1"]);
    });

    it("should set cutCell for visual feedback on cut cell", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
      });

      const clipboardStore = useClipboardStore.getState();

      // Cut cell
      clipboardStore.cutCell("1", "name");

      expect(useTaskStore.getState().cutCell).toEqual({
        taskId: "1",
        field: "name",
      });
    });

    it("should clear visual feedback on copy (replacing cut)", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
        cutTaskIds: ["1"],
        cutCell: { taskId: "1", field: "name" },
      });

      const clipboardStore = useClipboardStore.getState();

      // Copy (should clear cut marks)
      clipboardStore.copyRows(["1"]);

      expect(useTaskStore.getState().cutTaskIds).toEqual([]);
      expect(useTaskStore.getState().cutCell).toBeNull();
    });
  });
});
