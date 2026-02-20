/**
 * Unit tests for clipboardSlice store actions.
 * Covers: clearClipboard, canPasteRows, canPasteCell, pasteExternalRows, pasteExternalCell.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import { useHistoryStore } from "../../../src/store/slices/historySlice";
import { useClipboardStore } from "../../../src/store/slices/clipboardSlice";
import { useDependencyStore } from "../../../src/store/slices/dependencySlice";
import { useFileStore } from "../../../src/store/slices/fileSlice";
import type { Task } from "../../../src/types/chart.types";

const createTask = (
  id: string,
  name: string,
  order: number,
  overrides?: Partial<Task>
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
  metadata: {},
  ...overrides,
});

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
  useDependencyStore.setState({ dependencies: [] });
  useFileStore.setState({ isDirty: false });
}

describe("clipboardSlice", () => {
  beforeEach(resetStores);

  // ---------------------------------------------------------------------------
  // clearClipboard
  // ---------------------------------------------------------------------------
  describe("clearClipboard", () => {
    it("should reset both clipboards and activeMode", () => {
      // Set up some clipboard state
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
      });
      const store = useClipboardStore.getState();
      store.copyRows(["1"]);

      // Verify clipboard has data
      expect(useClipboardStore.getState().activeMode).toBe("row");

      // Clear
      store.clearClipboard();

      const state = useClipboardStore.getState();
      expect(state.activeMode).toBeNull();
      expect(state.rowClipboard.tasks).toHaveLength(0);
      expect(state.rowClipboard.operation).toBeNull();
      expect(state.cellClipboard.value).toBeNull();
      expect(state.cellClipboard.field).toBeNull();
    });

    it("should clear visual feedback marks in taskStore", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
        clipboardTaskIds: ["1"],
        cutCell: { taskId: "1", field: "name" },
      });

      useClipboardStore.getState().clearClipboard();

      expect(useTaskStore.getState().clipboardTaskIds).toHaveLength(0);
      expect(useTaskStore.getState().cutCell).toBeNull();
    });

    it("should clear cell clipboard state", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
      });
      const store = useClipboardStore.getState();
      store.copyCell("1", "name");

      expect(useClipboardStore.getState().activeMode).toBe("cell");

      store.clearClipboard();

      const state = useClipboardStore.getState();
      expect(state.activeMode).toBeNull();
      expect(state.cellClipboard.operation).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // canPasteRows
  // ---------------------------------------------------------------------------
  describe("canPasteRows", () => {
    it("should return true when row mode and operation set", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
      });
      useClipboardStore.getState().copyRows(["1"]);

      expect(useClipboardStore.getState().canPasteRows()).toBe(true);
    });

    it("should return false when no clipboard data", () => {
      expect(useClipboardStore.getState().canPasteRows()).toBe(false);
    });

    it("should return false when in cell mode", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
      });
      useClipboardStore.getState().copyCell("1", "name");

      expect(useClipboardStore.getState().canPasteRows()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // canPasteCell
  // ---------------------------------------------------------------------------
  describe("canPasteCell", () => {
    it("should return true when cell mode and matching field", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
      });
      useClipboardStore.getState().copyCell("1", "name");

      expect(useClipboardStore.getState().canPasteCell("name")).toBe(true);
    });

    it("should return false on field mismatch", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
      });
      useClipboardStore.getState().copyCell("1", "name");

      expect(useClipboardStore.getState().canPasteCell("progress")).toBe(false);
    });

    it("should return false when in row mode", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
      });
      useClipboardStore.getState().copyRows(["1"]);

      expect(useClipboardStore.getState().canPasteCell("name")).toBe(false);
    });

    it("should return false when no clipboard data", () => {
      expect(useClipboardStore.getState().canPasteCell("name")).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // pasteExternalRows
  // ---------------------------------------------------------------------------
  describe("pasteExternalRows", () => {
    it("should return error on empty tasks array", () => {
      const result = useClipboardStore.getState().pasteExternalRows({
        tasks: [],
        dependencies: [],
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe("No rows in external clipboard");
    });

    it("should paste tasks from external data", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        activeCell: { taskId: null, field: null },
        selectedTaskIds: [],
      });

      const externalTasks = [createTask("ext-1", "External Task", 0)];
      const result = useClipboardStore.getState().pasteExternalRows({
        tasks: externalTasks,
        dependencies: [],
      });

      expect(result.success).toBe(true);
      expect(useTaskStore.getState().tasks).toHaveLength(2);
    });

    it("should mark file as dirty after paste", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        activeCell: { taskId: null, field: null },
        selectedTaskIds: [],
      });

      useClipboardStore.getState().pasteExternalRows({
        tasks: [createTask("ext-1", "External Task", 0)],
        dependencies: [],
      });

      expect(useFileStore.getState().isDirty).toBe(true);
    });

    it("should record history command after paste", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        activeCell: { taskId: null, field: null },
        selectedTaskIds: [],
      });

      useClipboardStore.getState().pasteExternalRows({
        tasks: [createTask("ext-1", "External Task", 0)],
        dependencies: [],
      });

      expect(useHistoryStore.getState().undoStack).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // pasteExternalCell
  // ---------------------------------------------------------------------------
  describe("pasteExternalCell", () => {
    it("should return error when target task not found", () => {
      useTaskStore.setState({ tasks: [] });

      const result = useClipboardStore.getState().pasteExternalCell(
        { value: "hello", field: "name" },
        "nonexistent",
        "name"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Target task not found");
    });

    it("should return error on field type mismatch", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
      });

      const result = useClipboardStore.getState().pasteExternalCell(
        { value: "hello", field: "name" },
        "1",
        "progress"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot paste");
    });

    it("should paste matching field value successfully", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
      });

      const result = useClipboardStore.getState().pasteExternalCell(
        { value: "New Name", field: "name" },
        "1",
        "name"
      );

      expect(result.success).toBe(true);
      expect(useTaskStore.getState().tasks[0].name).toBe("New Name");
    });

    it("should mark file as dirty and record history", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
      });

      useClipboardStore.getState().pasteExternalCell(
        { value: "New Name", field: "name" },
        "1",
        "name"
      );

      expect(useFileStore.getState().isDirty).toBe(true);
      expect(useHistoryStore.getState().undoStack.length).toBeGreaterThanOrEqual(
        1
      );
    });

    it("should reject paste into summary task dates", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Summary", 0, { type: "summary" })],
      });

      const result = useClipboardStore.getState().pasteExternalCell(
        { value: "2025-06-01", field: "startDate" },
        "1",
        "startDate"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("summary");
    });
  });
});
