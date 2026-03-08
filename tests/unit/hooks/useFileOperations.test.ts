/**
 * Tests for useFileOperations hook.
 *
 * Pure function tests cover generateSuggestedFilename and resolveSuggestedFilename.
 * Hook orchestration tests cover handleNew reset behaviour and handleSave
 * success/cancel/error paths.
 * External I/O (saveFile, openFile, serialize, loadFileIntoApp) is mocked.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import toast from "react-hot-toast";
import {
  useFileOperations,
  generateSuggestedFilename,
  resolveSuggestedFilename,
} from "../../../src/hooks/useFileOperations";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import { useChartStore } from "../../../src/store/slices/chartSlice";
import { useFileStore } from "../../../src/store/slices/fileSlice";
import { useHistoryStore } from "../../../src/store/slices/historySlice";
import type { Task } from "../../../src/types/chart.types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

const mockSaveFile = vi.fn();
const mockOpenFile = vi.fn();
const mockClearFileHandle = vi.fn();

vi.mock("../../../src/utils/fileOperations/fileDialog", () => ({
  saveFile: (...args: unknown[]) => mockSaveFile(...args),
  openFile: (...args: unknown[]) => mockOpenFile(...args),
  clearFileHandle: (...args: unknown[]) => mockClearFileHandle(...args),
  SAVE_CANCELLED: "Save cancelled",
  OPEN_CANCELLED: "Open cancelled",
}));

const mockSerialize = vi.fn().mockReturnValue('{"mock":"content"}');
vi.mock("../../../src/utils/fileOperations/serialize", () => ({
  serializeToGanttFile: (...args: unknown[]) => mockSerialize(...args),
}));

const mockLoadFileIntoApp = vi.fn();
const mockShowLoadNotifications = vi.fn();
vi.mock("../../../src/utils/fileOperations/loadFromFile", () => ({
  loadFileIntoApp: (...args: unknown[]) => mockLoadFileIntoApp(...args),
  showLoadNotifications: (...args: unknown[]) =>
    mockShowLoadNotifications(...args),
}));

// Predictable sanitisation for filename tests
vi.mock("../../../src/utils/export/sanitizeFilename", () => ({
  sanitizeFilename: (name: string) => name.replace(/\s+/g, "_"),
}));

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
// Pure function: generateSuggestedFilename
// ---------------------------------------------------------------------------

describe("generateSuggestedFilename", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return sanitized-name_YYYY-MM-DD.ownchart format", () => {
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
    expect(generateSuggestedFilename("My Project")).toBe(
      "My_Project_2025-06-15.ownchart"
    );
  });

  it("should pad month and day to two digits", () => {
    vi.setSystemTime(new Date("2025-01-05T12:00:00Z"));
    expect(generateSuggestedFilename("X")).toBe("X_2025-01-05.ownchart");
  });
});

// ---------------------------------------------------------------------------
// Pure function: resolveSuggestedFilename
// ---------------------------------------------------------------------------

describe("resolveSuggestedFilename", () => {
  it("should return existing fileName when provided", () => {
    expect(resolveSuggestedFilename("existing.ownchart", "My Project")).toBe(
      "existing.ownchart"
    );
  });

  it("should generate from projectTitle when fileName is null", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

    const result = resolveSuggestedFilename(null, "My Project");
    expect(result).toBe("My_Project_2025-06-15.ownchart");

    vi.useRealTimers();
  });

  it("should return untitled.ownchart when both fileName and title are empty", () => {
    expect(resolveSuggestedFilename(null, "")).toBe("untitled.ownchart");
  });

  it("should prefer existing fileName over projectTitle", () => {
    expect(
      resolveSuggestedFilename("saved.ownchart", "Different Title")
    ).toBe("saved.ownchart");
  });
});

// ---------------------------------------------------------------------------
// Hook: handleNew
// ---------------------------------------------------------------------------

describe("useFileOperations — handleNew", () => {
  beforeEach(() => {
    useTaskStore.setState({
      tasks: [createTask("t1"), createTask("t2")],
    });
    useChartStore.setState({
      projectTitle: "Old Title",
      projectAuthor: "Old Author",
      hiddenTaskIds: ["t1"],
    });
    useFileStore.getState().markDirty();
    useHistoryStore.setState({
      undoStack: [{ id: "cmd" } as never],
      redoStack: [],
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.clearAllMocks();
    mockClearFileHandle.mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should clear tasks, project metadata, and hidden rows", async () => {
    const { result } = renderHook(() => useFileOperations());

    await act(async () => {
      await result.current.handleNew();
    });

    expect(useTaskStore.getState().tasks).toEqual([]);
    expect(useChartStore.getState().projectTitle).toBe("");
    expect(useChartStore.getState().projectAuthor).toBe("");
    expect(useChartStore.getState().hiddenTaskIds).toEqual([]);
  });

  it("should reset zoom and pan to defaults when creating a new chart", async () => {
    useChartStore.setState({ zoom: 3, panOffset: { x: 200, y: 50 } });
    const { result } = renderHook(() => useFileOperations());

    await act(async () => {
      await result.current.handleNew();
    });

    // resetView() resets zoom to DEFAULT_ZOOM and pan to {x:0, y:0}
    expect(useChartStore.getState().panOffset).toEqual({ x: 0, y: 0 });
    expect(useChartStore.getState().zoom).not.toBe(3);
  });

  it("should clear history and reset file store", async () => {
    const { result } = renderHook(() => useFileOperations());

    await act(async () => {
      await result.current.handleNew();
    });

    expect(useHistoryStore.getState().undoStack).toHaveLength(0);
    expect(useFileStore.getState().isDirty).toBe(false);
    expect(useFileStore.getState().fileName).toBeNull();
  });

  it("should call clearFileHandle", async () => {
    const { result } = renderHook(() => useFileOperations());

    await act(async () => {
      await result.current.handleNew();
    });

    expect(mockClearFileHandle).toHaveBeenCalledOnce();
  });

  it("should not reset when user cancels the dirty confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);

    const { result } = renderHook(() => useFileOperations());

    await act(async () => {
      await result.current.handleNew();
    });

    expect(useTaskStore.getState().tasks).toHaveLength(2);
    expect(useChartStore.getState().projectTitle).toBe("Old Title");
  });

  it("should skip the confirmation dialog when the file is clean", async () => {
    useFileStore.getState().markClean();
    const confirmSpy = vi.spyOn(window, "confirm");

    const { result } = renderHook(() => useFileOperations());

    await act(async () => {
      await result.current.handleNew();
    });

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(useTaskStore.getState().tasks).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Hook: handleSave
// ---------------------------------------------------------------------------

describe("useFileOperations — handleSave", () => {
  beforeEach(() => {
    useTaskStore.setState({ tasks: [] });
    useFileStore.getState().markDirty();
    vi.clearAllMocks();
    mockClearFileHandle.mockReturnValue(undefined);
    mockSerialize.mockReturnValue('{"mock":"content"}');
  });

  it("should call serialize then saveFile on save", async () => {
    mockSaveFile.mockResolvedValue({
      success: true,
      fileName: "test.ownchart",
    });

    const { result } = renderHook(() => useFileOperations());

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockSerialize).toHaveBeenCalledOnce();
    expect(mockSaveFile).toHaveBeenCalledOnce();
  });

  it("should mark file clean and update fileName on success", async () => {
    mockSaveFile.mockResolvedValue({
      success: true,
      fileName: "saved.ownchart",
    });

    const { result } = renderHook(() => useFileOperations());

    await act(async () => {
      await result.current.handleSave();
    });

    expect(useFileStore.getState().isDirty).toBe(false);
    expect(useFileStore.getState().fileName).toBe("saved.ownchart");
  });

  it("should not mark clean when save is cancelled", async () => {
    mockSaveFile.mockResolvedValue({
      success: false,
      error: "Save cancelled",
    });

    const { result } = renderHook(() => useFileOperations());

    await act(async () => {
      await result.current.handleSave();
    });

    expect(useFileStore.getState().isDirty).toBe(true);
  });

  it("should show error toast when saveFile returns a failure", async () => {
    mockSaveFile.mockResolvedValue({ success: false, error: "Disk full" });

    const { result } = renderHook(() => useFileOperations());

    await act(async () => {
      await result.current.handleSave();
    });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Disk full")
    );
  });

  it("should show error toast when saveFile throws an Error object", async () => {
    mockSaveFile.mockRejectedValue(new Error("Unexpected failure"));

    const { result } = renderHook(() => useFileOperations());

    await act(async () => {
      await result.current.handleSave();
    });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Unexpected failure")
    );
  });

  it("should handle non-Error thrown values gracefully", async () => {
    mockSaveFile.mockRejectedValue("string error");

    const { result } = renderHook(() => useFileOperations());

    await act(async () => {
      await result.current.handleSave();
    });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("string error")
    );
  });
});
