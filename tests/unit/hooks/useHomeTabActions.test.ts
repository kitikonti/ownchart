/**
 * Unit tests for useHomeTabActions hook.
 *
 * Tests derived state (canInsert, canDelete, canHide), handleAddTask defaults,
 * and delegation to store actions. Clipboard and hide operations are mocked
 * since they have their own dedicated test suites.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useHomeTabActions } from "../../../src/hooks/useHomeTabActions";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import { useChartStore } from "../../../src/store/slices/chartSlice";
import { useHistoryStore } from "../../../src/store/slices/historySlice";
import type { Task } from "../../../src/types/chart.types";

// Mock clipboard operations — tested separately in useClipboardOperations tests
const mockHandleCopy = vi.fn();
const mockHandleCut = vi.fn();
const mockHandlePaste = vi.fn();
vi.mock("../../../src/hooks/useClipboardOperations", () => ({
  useClipboardOperations: () => ({
    handleCopy: mockHandleCopy,
    handleCut: mockHandleCut,
    handlePaste: mockHandlePaste,
    canCopyOrCut: false,
    canPaste: false,
  }),
}));

// Mock hide operations — tested separately in useHideOperations tests
const mockHideRows = vi.fn();
const mockUnhideSelection = vi.fn();
const mockGetHiddenInSelectionCount = vi.fn().mockReturnValue(0);
vi.mock("../../../src/hooks/useHideOperations", () => ({
  useHideOperations: () => ({
    hideRows: mockHideRows,
    unhideSelection: mockUnhideSelection,
    getHiddenInSelectionCount: mockGetHiddenInSelectionCount,
  }),
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
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
    endDate: "2025-01-07",
    duration: 7,
    progress: 0,
    color: "#0F6CBD",
    order: 0,
    metadata: {},
    type: "task",
    ...options,
  };
}

describe("useHomeTabActions", () => {
  beforeEach(() => {
    useTaskStore.setState({
      tasks: [
        createTask("t1", "Task 1", { order: 0 }),
        createTask("t2", "Task 2", { order: 1 }),
        createTask("t3", "Task 3", { order: 2 }),
      ],
      selectedTaskIds: [],
      activeCell: { taskId: null, field: null },
    });
    useChartStore.setState({ hiddenTaskIds: [] });
    useHistoryStore.setState({ undoStack: [], redoStack: [] });
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Derived state: canInsert
  // -------------------------------------------------------------------------
  describe("canInsert", () => {
    it("should be false when nothing is selected", () => {
      const { result } = renderHook(() => useHomeTabActions());
      expect(result.current.canInsert).toBe(false);
    });

    it("should be true when exactly one task is selected", () => {
      useTaskStore.setState({ selectedTaskIds: ["t1"] });
      const { result } = renderHook(() => useHomeTabActions());
      expect(result.current.canInsert).toBe(true);
    });

    it("should be false when multiple tasks are selected", () => {
      useTaskStore.setState({ selectedTaskIds: ["t1", "t2"] });
      const { result } = renderHook(() => useHomeTabActions());
      expect(result.current.canInsert).toBe(false);
    });

    it("should be true when no selection but activeCell has taskId", () => {
      useTaskStore.setState({
        selectedTaskIds: [],
        activeCell: { taskId: "t2", field: "name" },
      });
      const { result } = renderHook(() => useHomeTabActions());
      expect(result.current.canInsert).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Derived state: canDelete / canHide
  // -------------------------------------------------------------------------
  describe("canDelete / canHide", () => {
    it("should be false when nothing is selected", () => {
      const { result } = renderHook(() => useHomeTabActions());
      expect(result.current.canDelete).toBe(false);
      expect(result.current.canHide).toBe(false);
    });

    it("should be true when tasks are selected", () => {
      useTaskStore.setState({ selectedTaskIds: ["t1", "t2"] });
      const { result } = renderHook(() => useHomeTabActions());
      expect(result.current.canDelete).toBe(true);
      expect(result.current.canHide).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // handleAddTask
  // -------------------------------------------------------------------------
  describe("handleAddTask", () => {
    it("should add a task with correct defaults", () => {
      const addTaskSpy = vi.fn();
      useTaskStore.setState({ addTask: addTaskSpy } as never);

      const { result } = renderHook(() => useHomeTabActions());
      result.current.handleAddTask();

      expect(addTaskSpy).toHaveBeenCalledOnce();
      const taskData = addTaskSpy.mock.calls[0][0];

      expect(taskData.name).toBe("New Task");
      expect(taskData.duration).toBe(7);
      expect(taskData.progress).toBe(0);
      expect(taskData.type).toBe("task");
      expect(taskData.parent).toBeUndefined();
      expect(taskData.order).toBe(3); // 3 existing tasks
    });

    it("should set startDate to today in YYYY-MM-DD format", () => {
      const addTaskSpy = vi.fn();
      useTaskStore.setState({ addTask: addTaskSpy } as never);

      const { result } = renderHook(() => useHomeTabActions());
      result.current.handleAddTask();

      const taskData = addTaskSpy.mock.calls[0][0];
      const today = new Date().toISOString().split("T")[0];
      expect(taskData.startDate).toBe(today);
    });

    it("should set endDate to 6 days after today", () => {
      const addTaskSpy = vi.fn();
      useTaskStore.setState({ addTask: addTaskSpy } as never);

      const { result } = renderHook(() => useHomeTabActions());
      result.current.handleAddTask();

      const taskData = addTaskSpy.mock.calls[0][0];
      const expected = new Date();
      expected.setDate(expected.getDate() + 6);
      expect(taskData.endDate).toBe(expected.toISOString().split("T")[0]);
    });
  });

  // -------------------------------------------------------------------------
  // handleInsertAbove / handleInsertBelow
  // -------------------------------------------------------------------------
  describe("handleInsertAbove / handleInsertBelow", () => {
    it("should call insertTaskAbove with selected task id", () => {
      const insertAboveSpy = vi.fn();
      useTaskStore.setState({
        selectedTaskIds: ["t2"],
        insertTaskAbove: insertAboveSpy,
      } as never);

      const { result } = renderHook(() => useHomeTabActions());
      result.current.handleInsertAbove();

      expect(insertAboveSpy).toHaveBeenCalledWith("t2");
    });

    it("should call insertTaskBelow with selected task id", () => {
      const insertBelowSpy = vi.fn();
      useTaskStore.setState({
        selectedTaskIds: ["t2"],
        insertTaskBelow: insertBelowSpy,
      } as never);

      const { result } = renderHook(() => useHomeTabActions());
      result.current.handleInsertBelow();

      expect(insertBelowSpy).toHaveBeenCalledWith("t2");
    });

    it("should not call insert when multiple tasks selected", () => {
      const insertAboveSpy = vi.fn();
      const insertBelowSpy = vi.fn();
      useTaskStore.setState({
        selectedTaskIds: ["t1", "t2"],
        insertTaskAbove: insertAboveSpy,
        insertTaskBelow: insertBelowSpy,
      } as never);

      const { result } = renderHook(() => useHomeTabActions());
      result.current.handleInsertAbove();
      result.current.handleInsertBelow();

      expect(insertAboveSpy).not.toHaveBeenCalled();
      expect(insertBelowSpy).not.toHaveBeenCalled();
    });

    it("should use activeCell taskId when no selection", () => {
      const insertAboveSpy = vi.fn();
      useTaskStore.setState({
        selectedTaskIds: [],
        activeCell: { taskId: "t3", field: "name" },
        insertTaskAbove: insertAboveSpy,
      } as never);

      const { result } = renderHook(() => useHomeTabActions());
      result.current.handleInsertAbove();

      expect(insertAboveSpy).toHaveBeenCalledWith("t3");
    });
  });

  // -------------------------------------------------------------------------
  // handleHideRows / handleUnhideSelection
  // -------------------------------------------------------------------------
  describe("handleHideRows / handleUnhideSelection", () => {
    it("should delegate to hideRows with selected task ids", () => {
      useTaskStore.setState({ selectedTaskIds: ["t1", "t3"] });

      const { result } = renderHook(() => useHomeTabActions());
      result.current.handleHideRows();

      expect(mockHideRows).toHaveBeenCalledWith(["t1", "t3"]);
    });

    it("should delegate to unhideSelection with selected task ids", () => {
      useTaskStore.setState({ selectedTaskIds: ["t1", "t2"] });

      const { result } = renderHook(() => useHomeTabActions());
      result.current.handleUnhideSelection();

      expect(mockUnhideSelection).toHaveBeenCalledWith(["t1", "t2"]);
    });
  });

  // -------------------------------------------------------------------------
  // totalHiddenCount
  // -------------------------------------------------------------------------
  describe("totalHiddenCount", () => {
    it("should reflect the number of hidden task ids", () => {
      useChartStore.setState({ hiddenTaskIds: ["t1", "t2"] });

      const { result } = renderHook(() => useHomeTabActions());
      expect(result.current.totalHiddenCount).toBe(2);
    });

    it("should be 0 when no tasks are hidden", () => {
      const { result } = renderHook(() => useHomeTabActions());
      expect(result.current.totalHiddenCount).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // History state passthrough
  // -------------------------------------------------------------------------
  describe("history state", () => {
    it("should reflect canUndo/canRedo from history store", () => {
      const { result } = renderHook(() => useHomeTabActions());
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });
});
