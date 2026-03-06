/**
 * Tests for useClipboardOperations hook.
 *
 * Tests derived state (canCopyOrCut, canPaste) and the copy/cut/paste handlers
 * with internal clipboard fallback. System clipboard interactions are mocked
 * to return null so all tests exercise the internal path.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import toast from "react-hot-toast";
import { useClipboardOperations } from "../../../src/hooks/useClipboardOperations";
import { useClipboardStore } from "../../../src/store/slices/clipboardSlice";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import type { Task } from "../../../src/types/chart.types";
import type { TaskId } from "../../../src/types/branded.types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// System clipboard disabled for all tests — exercise internal clipboard path.
// Use importOriginal so clipboardSlice's imports (collectTasksWithChildren etc.)
// still resolve to the real implementations.
vi.mock("../../../src/utils/clipboard", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../src/utils/clipboard")>();
  return {
    ...actual,
    isClipboardApiAvailable: () => false,
    writeRowsToSystemClipboard: vi.fn().mockResolvedValue(undefined),
    writeCellToSystemClipboard: vi.fn().mockResolvedValue(undefined),
    readRowsFromSystemClipboard: vi.fn().mockResolvedValue(null),
    readCellFromSystemClipboard: vi.fn().mockResolvedValue(null),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTask(id: string, options: Partial<Task> = {}): Task {
  return {
    id,
    name: `Task ${id}`,
    startDate: "2025-01-01",
    endDate: "2025-01-07",
    duration: 7,
    progress: 0,
    color: "#3b82f6",
    order: 0,
    metadata: {},
    type: "task",
    ...options,
  };
}

// ---------------------------------------------------------------------------

describe("useClipboardOperations", () => {
  beforeEach(() => {
    useTaskStore.setState({
      tasks: [createTask("t1"), createTask("t2")],
      selectedTaskIds: [],
      activeCell: { taskId: null, field: null },
    });
    useClipboardStore.getState().clearClipboard();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // canCopyOrCut
  // -------------------------------------------------------------------------

  describe("canCopyOrCut", () => {
    it("should be false when nothing is selected and no active cell", () => {
      const { result } = renderHook(() => useClipboardOperations());
      expect(result.current.canCopyOrCut).toBe(false);
    });

    it("should be true when tasks are selected", () => {
      useTaskStore.setState({ selectedTaskIds: ["t1" as TaskId] });
      const { result } = renderHook(() => useClipboardOperations());
      expect(result.current.canCopyOrCut).toBe(true);
    });

    it("should be true when a cell is active", () => {
      useTaskStore.setState({
        activeCell: { taskId: "t1" as TaskId, field: "name" },
      });
      const { result } = renderHook(() => useClipboardOperations());
      expect(result.current.canCopyOrCut).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // canPaste
  // -------------------------------------------------------------------------

  describe("canPaste", () => {
    it("should be false when clipboard is empty", () => {
      const { result } = renderHook(() => useClipboardOperations());
      expect(result.current.canPaste).toBe(false);
    });

    it("should be true after copying rows", () => {
      useClipboardStore.getState().copyRows(["t1" as TaskId]);
      const { result } = renderHook(() => useClipboardOperations());
      expect(result.current.canPaste).toBe(true);
    });

    it("should be true after copying a cell", () => {
      useClipboardStore.getState().copyCell("t1" as TaskId, "name");
      const { result } = renderHook(() => useClipboardOperations());
      expect(result.current.canPaste).toBe(true);
    });

    it("should become false after clearing clipboard", () => {
      useClipboardStore.getState().copyRows(["t1" as TaskId]);
      const { result } = renderHook(() => useClipboardOperations());
      expect(result.current.canPaste).toBe(true);

      act(() => {
        useClipboardStore.getState().clearClipboard();
      });

      expect(result.current.canPaste).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // handleCopy
  // -------------------------------------------------------------------------

  describe("handleCopy", () => {
    it("should copy selected rows to clipboard and set activeMode to 'row'", () => {
      useTaskStore.setState({ selectedTaskIds: ["t1" as TaskId] });
      const { result } = renderHook(() => useClipboardOperations());

      act(() => {
        result.current.handleCopy();
      });

      const { activeMode, rowClipboard } = useClipboardStore.getState();
      expect(activeMode).toBe("row");
      expect(rowClipboard.tasks).toHaveLength(1);
      expect(rowClipboard.operation).toBe("copy");
    });

    it("should copy active cell when no rows are selected", () => {
      useTaskStore.setState({
        selectedTaskIds: [],
        activeCell: { taskId: "t1" as TaskId, field: "name" },
      });
      const { result } = renderHook(() => useClipboardOperations());

      act(() => {
        result.current.handleCopy();
      });

      const { activeMode, cellClipboard } = useClipboardStore.getState();
      expect(activeMode).toBe("cell");
      expect(cellClipboard.field).toBe("name");
      expect(cellClipboard.operation).toBe("copy");
    });

    it("should show info toast when nothing is selected or active", () => {
      const { result } = renderHook(() => useClipboardOperations());

      act(() => {
        result.current.handleCopy();
      });

      expect(toast).toHaveBeenCalledWith(
        "Nothing to copy",
        expect.any(Object)
      );
    });
  });

  // -------------------------------------------------------------------------
  // handleCut
  // -------------------------------------------------------------------------

  describe("handleCut", () => {
    it("should cut selected rows and set operation to 'cut'", () => {
      useTaskStore.setState({ selectedTaskIds: ["t1" as TaskId] });
      const { result } = renderHook(() => useClipboardOperations());

      act(() => {
        result.current.handleCut();
      });

      const { activeMode, rowClipboard } = useClipboardStore.getState();
      expect(activeMode).toBe("row");
      expect(rowClipboard.operation).toBe("cut");
    });

    it("should cut the active cell when no rows are selected", () => {
      useTaskStore.setState({
        selectedTaskIds: [],
        activeCell: { taskId: "t1" as TaskId, field: "name" },
      });
      const { result } = renderHook(() => useClipboardOperations());

      act(() => {
        result.current.handleCut();
      });

      const { activeMode, cellClipboard } = useClipboardStore.getState();
      expect(activeMode).toBe("cell");
      expect(cellClipboard.operation).toBe("cut");
    });

    it("should show info toast when nothing is selected or active", () => {
      const { result } = renderHook(() => useClipboardOperations());

      act(() => {
        result.current.handleCut();
      });

      expect(toast).toHaveBeenCalledWith(
        "Nothing to cut",
        expect.any(Object)
      );
    });
  });

  // -------------------------------------------------------------------------
  // handlePaste — internal clipboard fallback
  // -------------------------------------------------------------------------

  describe("handlePaste — internal clipboard", () => {
    it("should paste rows from internal clipboard in row mode", async () => {
      // Copy t1, position cursor on t2 as target
      useClipboardStore.getState().copyRows(["t1" as TaskId]);
      useTaskStore.setState({
        selectedTaskIds: ["t2" as TaskId],
        activeCell: { taskId: "t2" as TaskId, field: null },
      });

      const { result } = renderHook(() => useClipboardOperations());

      await act(async () => {
        await result.current.handlePaste();
      });

      // Task list should have grown by one pasted row
      expect(useTaskStore.getState().tasks.length).toBeGreaterThan(2);
    });

    it("should paste cell value from internal clipboard in cell mode", async () => {
      useTaskStore.setState({
        tasks: [
          createTask("t1", { name: "Source Name" }),
          createTask("t2", { name: "Original Name" }),
        ],
      });
      useClipboardStore.getState().copyCell("t1" as TaskId, "name");
      useTaskStore.setState({
        activeCell: { taskId: "t2" as TaskId, field: "name" },
      });

      const { result } = renderHook(() => useClipboardOperations());

      await act(async () => {
        await result.current.handlePaste();
      });

      const t2 = useTaskStore.getState().tasks.find((t) => t.id === "t2");
      expect(t2?.name).toBe("Source Name");
    });

    it("should show info toast when clipboard is empty", async () => {
      const { result } = renderHook(() => useClipboardOperations());

      await act(async () => {
        await result.current.handlePaste();
      });

      expect(toast).toHaveBeenCalledWith(
        "Nothing to paste",
        expect.any(Object)
      );
    });
  });
});
