/**
 * Unit tests for clipboardSlice store actions.
 * Covers all clipboard operations: copy, cut, paste (internal + external),
 * clearClipboard, canPasteRows, canPasteCell.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import { useHistoryStore } from "../../../src/store/slices/historySlice";
import { useClipboardStore } from "../../../src/store/slices/clipboardSlice";
import { useDependencyStore } from "../../../src/store/slices/dependencySlice";
import { useFileStore } from "../../../src/store/slices/fileSlice";
import type { Task } from "../../../src/types/chart.types";
import type { Dependency } from "../../../src/types/dependency.types";

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

  // ---------------------------------------------------------------------------
  // copyRows
  // ---------------------------------------------------------------------------
  describe("copyRows", () => {
    it("should set row clipboard with cloned tasks", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0), createTask("2", "Task 2", 1)],
        selectedTaskIds: ["1"],
      });

      useClipboardStore.getState().copyRows(["1"]);

      const state = useClipboardStore.getState();
      expect(state.activeMode).toBe("row");
      expect(state.rowClipboard.operation).toBe("copy");
      expect(state.rowClipboard.tasks).toHaveLength(1);
      expect(state.rowClipboard.tasks[0].name).toBe("Task 1");
      expect(state.rowClipboard.sourceTaskIds).toEqual(["1"]);
    });

    it("should set clipboardTaskIds for visual feedback", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
      });

      useClipboardStore.getState().copyRows(["1"]);

      expect(useTaskStore.getState().clipboardTaskIds).toEqual(["1"]);
    });

    it("should clear previous cell clipboard when copying rows", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
      });

      // First copy a cell
      useClipboardStore.getState().copyCell("1", "name");
      expect(useClipboardStore.getState().activeMode).toBe("cell");

      // Then copy rows — should switch mode
      useClipboardStore.getState().copyRows(["1"]);
      const state = useClipboardStore.getState();
      expect(state.activeMode).toBe("row");
      expect(state.cellClipboard.operation).toBeNull();
    });

    it("should copy multiple rows", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0), createTask("2", "Task 2", 1)],
        selectedTaskIds: ["1", "2"],
      });

      useClipboardStore.getState().copyRows(["1", "2"]);

      const state = useClipboardStore.getState();
      expect(state.rowClipboard.tasks).toHaveLength(2);
      expect(state.rowClipboard.sourceTaskIds).toEqual(["1", "2"]);
    });
  });

  // ---------------------------------------------------------------------------
  // cutRows
  // ---------------------------------------------------------------------------
  describe("cutRows", () => {
    it("should set row clipboard with cut operation", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
      });

      useClipboardStore.getState().cutRows(["1"]);

      const state = useClipboardStore.getState();
      expect(state.activeMode).toBe("row");
      expect(state.rowClipboard.operation).toBe("cut");
      expect(state.rowClipboard.sourceTaskIds).toEqual(["1"]);
    });

    it("should set clipboardTaskIds for visual feedback", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
      });

      useClipboardStore.getState().cutRows(["1"]);

      expect(useTaskStore.getState().clipboardTaskIds).toEqual(["1"]);
    });
  });

  // ---------------------------------------------------------------------------
  // pasteRows (internal)
  // ---------------------------------------------------------------------------
  describe("pasteRows", () => {
    it("should return error when no rows in clipboard", () => {
      const result = useClipboardStore.getState().pasteRows();
      expect(result.success).toBe(false);
      expect(result.error).toBe("No rows in clipboard");
    });

    it("should paste copied rows successfully", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
        activeCell: { taskId: null, field: null },
      });

      useClipboardStore.getState().copyRows(["1"]);
      const result = useClipboardStore.getState().pasteRows();

      expect(result.success).toBe(true);
      expect(useTaskStore.getState().tasks).toHaveLength(2);
    });

    it("should mark file as dirty and record history", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
        activeCell: { taskId: null, field: null },
      });

      useClipboardStore.getState().copyRows(["1"]);
      useClipboardStore.getState().pasteRows();

      expect(useFileStore.getState().isDirty).toBe(true);
      expect(useHistoryStore.getState().undoStack).toHaveLength(1);
    });

    it("should remove source tasks after cut-paste", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0), createTask("2", "Task 2", 1)],
        selectedTaskIds: ["1"],
        activeCell: { taskId: "2", field: "name" },
      });

      useClipboardStore.getState().cutRows(["1"]);
      const result = useClipboardStore.getState().pasteRows();

      expect(result.success).toBe(true);
      // Original "1" removed, new copy inserted — still 2 tasks total
      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(2);
      // Original task ID should no longer exist
      expect(tasks.find((t) => t.id === "1")).toBeUndefined();
    });

    it("should clear clipboard after cut-paste", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0), createTask("2", "Task 2", 1)],
        selectedTaskIds: ["1"],
        activeCell: { taskId: "2", field: "name" },
      });

      useClipboardStore.getState().cutRows(["1"]);
      useClipboardStore.getState().pasteRows();

      const state = useClipboardStore.getState();
      expect(state.activeMode).toBeNull();
      expect(state.rowClipboard.operation).toBeNull();
    });

    it("should keep clipboard after copy-paste (allow multiple pastes)", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
        activeCell: { taskId: null, field: null },
      });

      useClipboardStore.getState().copyRows(["1"]);
      useClipboardStore.getState().pasteRows();

      const state = useClipboardStore.getState();
      expect(state.activeMode).toBe("row");
      expect(state.rowClipboard.operation).toBe("copy");
    });
  });

  // ---------------------------------------------------------------------------
  // copyCell
  // ---------------------------------------------------------------------------
  describe("copyCell", () => {
    it("should set cell clipboard with copied value", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
      });

      useClipboardStore.getState().copyCell("1", "name");

      const state = useClipboardStore.getState();
      expect(state.activeMode).toBe("cell");
      expect(state.cellClipboard.operation).toBe("copy");
      expect(state.cellClipboard.value).toBe("Task 1");
      expect(state.cellClipboard.field).toBe("name");
      expect(state.cellClipboard.sourceTaskId).toBe("1");
    });

    it("should clear previous row clipboard when copying a cell", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
      });

      // First copy rows
      useClipboardStore.getState().copyRows(["1"]);
      expect(useClipboardStore.getState().activeMode).toBe("row");

      // Then copy cell — should switch mode
      useClipboardStore.getState().copyCell("1", "name");
      const state = useClipboardStore.getState();
      expect(state.activeMode).toBe("cell");
      expect(state.rowClipboard.operation).toBeNull();
    });

    it("should not set cutCell mark for copy operation", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
      });

      useClipboardStore.getState().copyCell("1", "name");

      expect(useTaskStore.getState().cutCell).toBeNull();
    });

    it("should do nothing for nonexistent task", () => {
      useTaskStore.setState({ tasks: [] });

      useClipboardStore.getState().copyCell("nonexistent", "name");

      expect(useClipboardStore.getState().activeMode).toBeNull();
    });

    it("should copy progress value", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0, { progress: 75 })],
      });

      useClipboardStore.getState().copyCell("1", "progress");

      expect(useClipboardStore.getState().cellClipboard.value).toBe(75);
      expect(useClipboardStore.getState().cellClipboard.field).toBe("progress");
    });
  });

  // ---------------------------------------------------------------------------
  // cutCell
  // ---------------------------------------------------------------------------
  describe("cutCell", () => {
    it("should set cell clipboard with cut operation", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
      });

      useClipboardStore.getState().cutCell("1", "name");

      const state = useClipboardStore.getState();
      expect(state.activeMode).toBe("cell");
      expect(state.cellClipboard.operation).toBe("cut");
      expect(state.cellClipboard.value).toBe("Task 1");
      expect(state.cellClipboard.field).toBe("name");
    });

    it("should set cutCell visual feedback mark", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
      });

      useClipboardStore.getState().cutCell("1", "name");

      const cutCell = useTaskStore.getState().cutCell;
      expect(cutCell).toEqual({ taskId: "1", field: "name" });
    });

    it("should clear clipboardTaskIds when cutting a cell", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        clipboardTaskIds: ["1"],
      });

      useClipboardStore.getState().cutCell("1", "name");

      expect(useTaskStore.getState().clipboardTaskIds).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // pasteCell (internal)
  // ---------------------------------------------------------------------------
  describe("pasteCell", () => {
    it("should return error when no cell in clipboard", () => {
      const result = useClipboardStore.getState().pasteCell("1", "name");
      expect(result.success).toBe(false);
      expect(result.error).toBe("No cell in clipboard");
    });

    it("should paste copied cell value to target", () => {
      useTaskStore.setState({
        tasks: [
          createTask("1", "Source", 0),
          createTask("2", "Target", 1),
        ],
      });

      useClipboardStore.getState().copyCell("1", "name");
      const result = useClipboardStore.getState().pasteCell("2", "name");

      expect(result.success).toBe(true);
      expect(useTaskStore.getState().tasks[1].name).toBe("Source");
    });

    it("should mark file as dirty and record history on paste", () => {
      useTaskStore.setState({
        tasks: [
          createTask("1", "Source", 0),
          createTask("2", "Target", 1),
        ],
      });

      useClipboardStore.getState().copyCell("1", "name");
      useClipboardStore.getState().pasteCell("2", "name");

      expect(useFileStore.getState().isDirty).toBe(true);
      expect(
        useHistoryStore.getState().undoStack.length
      ).toBeGreaterThanOrEqual(1);
    });

    it("should clear source cell after cut-paste", () => {
      useTaskStore.setState({
        tasks: [
          createTask("1", "Source", 0),
          createTask("2", "Target", 1),
        ],
      });

      useClipboardStore.getState().cutCell("1", "name");
      const result = useClipboardStore.getState().pasteCell("2", "name");

      expect(result.success).toBe(true);
      expect(useTaskStore.getState().tasks[1].name).toBe("Source");
      // Source cell should be cleared to default
      expect(useTaskStore.getState().tasks[0].name).toBe("");
    });

    it("should clear clipboard after cut-paste", () => {
      useTaskStore.setState({
        tasks: [
          createTask("1", "Source", 0),
          createTask("2", "Target", 1),
        ],
      });

      useClipboardStore.getState().cutCell("1", "name");
      useClipboardStore.getState().pasteCell("2", "name");

      const state = useClipboardStore.getState();
      expect(state.activeMode).toBeNull();
      expect(state.cellClipboard.operation).toBeNull();
    });

    it("should keep clipboard after copy-paste", () => {
      useTaskStore.setState({
        tasks: [
          createTask("1", "Source", 0),
          createTask("2", "Target", 1),
        ],
      });

      useClipboardStore.getState().copyCell("1", "name");
      useClipboardStore.getState().pasteCell("2", "name");

      const state = useClipboardStore.getState();
      expect(state.activeMode).toBe("cell");
      expect(state.cellClipboard.operation).toBe("copy");
    });

    it("should clear cutCell visual mark after cut-paste", () => {
      useTaskStore.setState({
        tasks: [
          createTask("1", "Source", 0),
          createTask("2", "Target", 1),
        ],
      });

      useClipboardStore.getState().cutCell("1", "name");
      expect(useTaskStore.getState().cutCell).not.toBeNull();

      useClipboardStore.getState().pasteCell("2", "name");
      expect(useTaskStore.getState().cutCell).toBeNull();
    });

    it("should reject paste when field types do not match", () => {
      useTaskStore.setState({
        tasks: [
          createTask("1", "Source", 0),
          createTask("2", "Target", 1),
        ],
      });

      useClipboardStore.getState().copyCell("1", "name");
      const result = useClipboardStore.getState().pasteCell("2", "progress");

      // Field mismatch is caught by canPasteCellValue inside executeCellPaste
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // getClipboardMode
  // ---------------------------------------------------------------------------
  describe("getClipboardMode", () => {
    it("should return null when clipboard is empty", () => {
      expect(useClipboardStore.getState().getClipboardMode()).toBeNull();
    });

    it("should return 'row' after copyRows", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
      });
      useClipboardStore.getState().copyRows(["1"]);

      expect(useClipboardStore.getState().getClipboardMode()).toBe("row");
    });

    it("should return 'cell' after copyCell", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
      });
      useClipboardStore.getState().copyCell("1", "name");

      expect(useClipboardStore.getState().getClipboardMode()).toBe("cell");
    });
  });

  // ---------------------------------------------------------------------------
  // copyRows with hierarchy (children)
  // ---------------------------------------------------------------------------
  describe("copyRows with hierarchy", () => {
    it("should include children when copying a collapsed parent task", () => {
      useTaskStore.setState({
        tasks: [
          createTask("parent", "Parent", 0, {
            type: "summary",
            open: false,
          }),
          createTask("child1", "Child 1", 1, { parent: "parent" }),
          createTask("child2", "Child 2", 2, { parent: "parent" }),
          createTask("other", "Other", 3),
        ],
        selectedTaskIds: ["parent"],
      });

      useClipboardStore.getState().copyRows(["parent"]);

      const state = useClipboardStore.getState();
      expect(state.rowClipboard.tasks).toHaveLength(3);
      const names = state.rowClipboard.tasks.map((t) => t.name);
      expect(names).toContain("Parent");
      expect(names).toContain("Child 1");
      expect(names).toContain("Child 2");
    });

    it("should NOT include children when parent is expanded (only selected tasks)", () => {
      useTaskStore.setState({
        tasks: [
          createTask("parent", "Parent", 0, { type: "summary" }),
          createTask("child1", "Child 1", 1, { parent: "parent" }),
          createTask("other", "Other", 2),
        ],
        selectedTaskIds: ["parent"],
      });

      useClipboardStore.getState().copyRows(["parent"]);

      const state = useClipboardStore.getState();
      expect(state.rowClipboard.tasks).toHaveLength(1);
      expect(state.rowClipboard.tasks[0].name).toBe("Parent");
    });

    it("should deep-clone tasks so mutations do not affect clipboard", () => {
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0)],
        selectedTaskIds: ["1"],
      });

      useClipboardStore.getState().copyRows(["1"]);
      const clipboardTask = useClipboardStore.getState().rowClipboard.tasks[0];
      const storeTask = useTaskStore.getState().tasks[0];

      expect(clipboardTask).not.toBe(storeTask);
      expect(clipboardTask.name).toBe(storeTask.name);
    });
  });

  // ---------------------------------------------------------------------------
  // copyRows with dependencies
  // ---------------------------------------------------------------------------
  describe("copyRows with dependencies", () => {
    it("should collect internal dependencies between copied tasks", () => {
      const dep: Dependency = {
        id: "dep-1",
        fromTaskId: "1",
        toTaskId: "2",
        type: "finish-to-start",
        createdAt: "2025-01-01T00:00:00.000Z",
      };
      useTaskStore.setState({
        tasks: [createTask("1", "Task 1", 0), createTask("2", "Task 2", 1)],
        selectedTaskIds: ["1", "2"],
      });
      useDependencyStore.setState({ dependencies: [dep] });

      useClipboardStore.getState().copyRows(["1", "2"]);

      const state = useClipboardStore.getState();
      expect(state.rowClipboard.dependencies).toHaveLength(1);
      expect(state.rowClipboard.dependencies[0].fromTaskId).toBe("1");
    });

    it("should NOT collect external dependencies (only one endpoint copied)", () => {
      const dep: Dependency = {
        id: "dep-1",
        fromTaskId: "1",
        toTaskId: "3",
        type: "finish-to-start",
        createdAt: "2025-01-01T00:00:00.000Z",
      };
      useTaskStore.setState({
        tasks: [
          createTask("1", "Task 1", 0),
          createTask("2", "Task 2", 1),
          createTask("3", "Task 3", 2),
        ],
        selectedTaskIds: ["1", "2"],
      });
      useDependencyStore.setState({ dependencies: [dep] });

      useClipboardStore.getState().copyRows(["1", "2"]);

      expect(useClipboardStore.getState().rowClipboard.dependencies).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // pasteRows depth validation
  // ---------------------------------------------------------------------------
  describe("pasteRows depth validation", () => {
    it("should return error when paste would exceed max hierarchy depth", () => {
      // MAX_HIERARCHY_DEPTH is 3, so level 0 → 1 → 2 is max.
      // Create a depth-2 parent chain, then try to paste a parent+child (depth 1)
      // into the deepest level, which would exceed depth 3.
      useTaskStore.setState({
        tasks: [
          createTask("L0", "Level 0", 0, { type: "summary" }),
          createTask("L1", "Level 1", 1, { type: "summary", parent: "L0" }),
          createTask("L2", "Level 2", 2, { parent: "L1" }),
        ],
        activeCell: { taskId: "L2", field: "name" },
        selectedTaskIds: [],
      });

      // Paste a parent+child subtree (depth 1 internally)
      const result = useClipboardStore.getState().pasteExternalRows({
        tasks: [
          createTask("ext-p", "Ext Parent", 0, { type: "summary" }),
          createTask("ext-c", "Ext Child", 1, { parent: "ext-p" }),
        ],
        dependencies: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("maximum nesting depth");
    });
  });

  // ---------------------------------------------------------------------------
  // canPasteCell with task-type validation
  // ---------------------------------------------------------------------------
  describe("canPasteCell with targetTaskId", () => {
    it("should return false for startDate paste into summary task", () => {
      useTaskStore.setState({
        tasks: [
          createTask("1", "Task", 0),
          createTask("2", "Summary", 1, { type: "summary" }),
        ],
      });

      useClipboardStore.getState().copyCell("1", "startDate");

      expect(useClipboardStore.getState().canPasteCell("startDate")).toBe(true);
      expect(
        useClipboardStore.getState().canPasteCell("startDate", "2")
      ).toBe(false);
    });

    it("should return false for progress paste into milestone task", () => {
      useTaskStore.setState({
        tasks: [
          createTask("1", "Task", 0, { progress: 50 }),
          createTask("2", "Milestone", 1, { type: "milestone" }),
        ],
      });

      useClipboardStore.getState().copyCell("1", "progress");

      expect(useClipboardStore.getState().canPasteCell("progress")).toBe(true);
      expect(
        useClipboardStore.getState().canPasteCell("progress", "2")
      ).toBe(false);
    });

    it("should return true when targetTaskId allows the paste", () => {
      useTaskStore.setState({
        tasks: [
          createTask("1", "Source", 0),
          createTask("2", "Target", 1),
        ],
      });

      useClipboardStore.getState().copyCell("1", "name");

      expect(
        useClipboardStore.getState().canPasteCell("name", "2")
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // cut-paste with collapsed groups (order rebuild)
  // ---------------------------------------------------------------------------
  describe("cut-paste with collapsed groups", () => {
    it("should correctly reorder tasks including collapsed children after cut", () => {
      // Set up: parent with collapsed children, then cut a standalone task
      // and paste it after "target". The collapsed children must get valid
      // (non-stale, non-duplicate) order values after the cut deletion.
      useTaskStore.setState({
        tasks: [
          createTask("group", "Group", 0, { type: "summary", open: false }),
          createTask("child1", "Child 1", 1, { parent: "group" }),
          createTask("child2", "Child 2", 2, { parent: "group" }),
          createTask("standalone", "Standalone", 3),
          createTask("target", "Target", 4),
        ],
        selectedTaskIds: ["standalone"],
        activeCell: { taskId: "target", field: "name" },
      });

      useClipboardStore.getState().cutRows(["standalone"]);
      const result = useClipboardStore.getState().pasteRows();

      expect(result.success).toBe(true);

      const tasks = useTaskStore.getState().tasks;

      // "standalone" was cut and re-inserted with new ID — still 5 tasks total
      expect(tasks).toHaveLength(5);

      // All orders must be unique (no duplicates from stale collapsed children)
      const orders = tasks.map((t) => t.order).sort((a, b) => a - b);
      const uniqueOrders = [...new Set(orders)];
      expect(uniqueOrders).toHaveLength(orders.length);

      // Collapsed children must still exist
      const child1 = tasks.find((t) => t.name === "Child 1");
      const child2 = tasks.find((t) => t.name === "Child 2");
      expect(child1).toBeDefined();
      expect(child2).toBeDefined();
    });
  });
});
