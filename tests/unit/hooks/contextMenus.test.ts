/**
 * Tests for context menu hooks (Zones 1-4).
 * Uses renderHook to test actual hooks with store state,
 * mocking only external dependencies (clipboard API, toast, flattenedTasks).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTaskTableRowContextMenu } from "../../../src/hooks/useTaskTableRowContextMenu";
import { useTimelineBarContextMenu } from "../../../src/hooks/useTimelineBarContextMenu";
import { useTableHeaderContextMenu } from "../../../src/hooks/useTableHeaderContextMenu";
import { useTimelineAreaContextMenu } from "../../../src/hooks/useTimelineAreaContextMenu";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import { useChartStore } from "../../../src/store/slices/chartSlice";
import type { Task } from "../../../src/types/chart.types";
import type { FlattenedTask } from "../../../src/utils/hierarchy";

// Mock external dependencies
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../../src/utils/clipboard", () => ({
  writeRowsToSystemClipboard: vi.fn().mockResolvedValue(undefined),
  writeCellToSystemClipboard: vi.fn().mockResolvedValue(undefined),
  readRowsFromSystemClipboard: vi.fn().mockResolvedValue(null),
  readCellFromSystemClipboard: vi.fn().mockResolvedValue(null),
  isClipboardApiAvailable: vi.fn().mockReturnValue(false),
}));

vi.mock("../../../src/hooks/useFlattenedTasks", () => ({
  useFlattenedTasks: vi.fn(() => ({
    flattenedTasks: [],
    allFlattenedTasks: [],
  })),
}));

import { useFlattenedTasks } from "../../../src/hooks/useFlattenedTasks";

// ─── Helpers ───

function createTask(
  id: string,
  name: string,
  options: Partial<Task> = {}
): Task {
  return {
    id,
    name,
    startDate: "2025-01-01",
    endDate: "2025-01-05",
    duration: 5,
    progress: 0,
    color: "#3b82f6",
    order: 0,
    metadata: {},
    type: "task",
    ...options,
  };
}

function mockMouseEvent(x: number, y: number): React.MouseEvent {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    clientX: x,
    clientY: y,
  } as unknown as React.MouseEvent;
}

function toFlattened(task: Task, rowNum: number): FlattenedTask {
  return { task, level: 0, hasChildren: false, globalRowNumber: rowNum };
}

// ─── Setup ───

const task1 = createTask("t1", "Task 1", { order: 0 });
const task2 = createTask("t2", "Task 2", { order: 1 });
const task3 = createTask("t3", "Task 3", { order: 2 });

beforeEach(() => {
  useTaskStore.getState().setTasks([]);
  useTaskStore.getState().clearSelection();
  useChartStore.getState().setHiddenColumns([]);
  useChartStore.getState().setHiddenTaskIds([]);

  vi.mocked(useFlattenedTasks).mockReturnValue({
    flattenedTasks: [],
    allFlattenedTasks: [],
  });
});

// ─── Zone 1: Task Table Row Context Menu ───

describe("Zone 1: Task Table Row Context Menu", () => {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  function openRowMenu(taskId: string) {
    useTaskStore.getState().setTasks([task1, task2, task3]);
    useTaskStore.getState().setSelectedTaskIds([taskId]);

    const flat = [task1, task2, task3].map((t, i) => toFlattened(t, i + 1));
    vi.mocked(useFlattenedTasks).mockReturnValue({
      flattenedTasks: flat,
      allFlattenedTasks: flat,
    });

    const { result } = renderHook(() => useTaskTableRowContextMenu());

    act(() => {
      result.current.handleRowContextMenu(mockMouseEvent(200, 300), taskId);
    });

    return result;
  }

  it("should have 10 items in 4 groups (no unhide)", () => {
    const result = openRowMenu("t1");

    expect(result.current.contextMenuItems).toHaveLength(10);
    expect(result.current.contextMenuItems.map((i) => i.id)).toEqual([
      "cut",
      "copy",
      "paste",
      "insertAbove",
      "insertBelow",
      "delete",
      "indent",
      "outdent",
      "group",
      "hide",
    ]);
  });

  it("should show 11 items when unhide is available", () => {
    useTaskStore.getState().setTasks([task1, task2, task3]);
    useTaskStore.getState().setSelectedTaskIds(["t1", "t3"]);
    useChartStore.getState().setHiddenTaskIds(["t2"]);

    const allFlat = [task1, task2, task3].map((t, i) => toFlattened(t, i + 1));
    const visibleFlat = [toFlattened(task1, 1), toFlattened(task3, 3)];
    vi.mocked(useFlattenedTasks).mockReturnValue({
      flattenedTasks: visibleFlat,
      allFlattenedTasks: allFlat,
    });

    const { result } = renderHook(() => useTaskTableRowContextMenu());

    act(() => {
      result.current.handleRowContextMenu(mockMouseEvent(200, 300), "t1");
    });

    expect(result.current.contextMenuItems).toHaveLength(11);
    expect(result.current.contextMenuItems[10].id).toBe("unhide");
    expect(result.current.contextMenuItems[10].label).toBe("Unhide 1 Row");
  });

  it("should have separators after paste, delete, and group", () => {
    const result = openRowMenu("t1");
    const items = result.current.contextMenuItems;

    expect(items.find((i) => i.id === "paste")?.separator).toBe(true);
    expect(items.find((i) => i.id === "delete")?.separator).toBe(true);
    expect(items.find((i) => i.id === "group")?.separator).toBe(true);
  });

  it("should show dynamic labels for multi-select", () => {
    useTaskStore.getState().setTasks([task1, task2, task3]);
    useTaskStore.getState().setSelectedTaskIds(["t1", "t2", "t3"]);

    const flat = [task1, task2, task3].map((t, i) => toFlattened(t, i + 1));
    vi.mocked(useFlattenedTasks).mockReturnValue({
      flattenedTasks: flat,
      allFlattenedTasks: flat,
    });

    const { result } = renderHook(() => useTaskTableRowContextMenu());

    act(() => {
      result.current.handleRowContextMenu(mockMouseEvent(200, 300), "t1");
    });

    const items = result.current.contextMenuItems;
    expect(items.find((i) => i.id === "delete")?.label).toBe(
      "Delete 3 Tasks"
    );
    expect(items.find((i) => i.id === "hide")?.label).toBe("Hide 3 Rows");
  });

  it("should show singular labels for single selection", () => {
    const result = openRowMenu("t1");
    const items = result.current.contextMenuItems;

    expect(items.find((i) => i.id === "delete")?.label).toBe("Delete Task");
    expect(items.find((i) => i.id === "hide")?.label).toBe("Hide Row");
  });

  it("should disable paste when clipboard is empty", () => {
    const result = openRowMenu("t1");
    expect(
      result.current.contextMenuItems.find((i) => i.id === "paste")?.disabled
    ).toBe(true);
  });

  it("should disable indent/outdent/group when not possible", () => {
    const result = openRowMenu("t1");
    const items = result.current.contextMenuItems;

    // Single first task can't indent (no sibling above) or outdent (already root)
    expect(items.find((i) => i.id === "indent")?.disabled).toBe(true);
    expect(items.find((i) => i.id === "outdent")?.disabled).toBe(true);
  });

  it("should enable indent when possible", () => {
    useTaskStore.getState().setTasks([task1, task2]);
    useTaskStore.getState().setSelectedTaskIds(["t2"]);

    const flat = [task1, task2].map((t, i) => toFlattened(t, i + 1));
    vi.mocked(useFlattenedTasks).mockReturnValue({
      flattenedTasks: flat,
      allFlattenedTasks: flat,
    });

    const { result } = renderHook(() => useTaskTableRowContextMenu());

    act(() => {
      result.current.handleRowContextMenu(mockMouseEvent(200, 300), "t2");
    });

    // t2 can indent under t1
    expect(
      result.current.contextMenuItems.find((i) => i.id === "indent")?.disabled
    ).toBe(false);
  });

  it("should use single task when right-clicked task is not in selection", () => {
    useTaskStore.getState().setTasks([task1, task2, task3]);
    useTaskStore.getState().setSelectedTaskIds(["t1"]);

    const flat = [task1, task2, task3].map((t, i) => toFlattened(t, i + 1));
    vi.mocked(useFlattenedTasks).mockReturnValue({
      flattenedTasks: flat,
      allFlattenedTasks: flat,
    });

    const { result } = renderHook(() => useTaskTableRowContextMenu());

    // Right-click on t2 which is NOT in selection [t1]
    // The handler will switch selection to [t2]
    act(() => {
      result.current.handleRowContextMenu(mockMouseEvent(200, 300), "t2");
    });

    const items = result.current.contextMenuItems;
    expect(items.find((i) => i.id === "delete")?.label).toBe("Delete Task");
    expect(items.find((i) => i.id === "hide")?.label).toBe("Hide Row");
  });

  it("should pluralize unhide correctly for multiple hidden rows", () => {
    useTaskStore
      .getState()
      .setTasks([
        task1,
        task2,
        task3,
        createTask("t4", "Task 4", { order: 3 }),
        createTask("t5", "Task 5", { order: 4 }),
      ]);
    useTaskStore.getState().setSelectedTaskIds(["t1", "t5"]);
    useChartStore.getState().setHiddenTaskIds(["t2", "t3", "t4"]);

    const t4 = createTask("t4", "Task 4", { order: 3 });
    const t5 = createTask("t5", "Task 5", { order: 4 });
    const allFlat = [task1, task2, task3, t4, t5].map((t, i) =>
      toFlattened(t, i + 1)
    );
    const visibleFlat = [toFlattened(task1, 1), toFlattened(t5, 5)];
    vi.mocked(useFlattenedTasks).mockReturnValue({
      flattenedTasks: visibleFlat,
      allFlattenedTasks: allFlat,
    });

    const { result } = renderHook(() => useTaskTableRowContextMenu());

    act(() => {
      result.current.handleRowContextMenu(mockMouseEvent(200, 300), "t1");
    });

    const unhideItem = result.current.contextMenuItems.find(
      (i) => i.id === "unhide"
    );
    expect(unhideItem?.label).toBe("Unhide 3 Rows");
  });

  it("should not show unhide when only 1 task selected", () => {
    useTaskStore.getState().setTasks([task1, task2, task3]);
    useTaskStore.getState().setSelectedTaskIds(["t1"]);
    useChartStore.getState().setHiddenTaskIds(["t2"]);

    const allFlat = [task1, task2, task3].map((t, i) => toFlattened(t, i + 1));
    const visibleFlat = [toFlattened(task1, 1), toFlattened(task3, 3)];
    vi.mocked(useFlattenedTasks).mockReturnValue({
      flattenedTasks: visibleFlat,
      allFlattenedTasks: allFlat,
    });

    const { result } = renderHook(() => useTaskTableRowContextMenu());

    act(() => {
      result.current.handleRowContextMenu(mockMouseEvent(200, 300), "t1");
    });

    expect(
      result.current.contextMenuItems.find((i) => i.id === "unhide")
    ).toBeUndefined();
  });

  it("should always enable insertAbove and insertBelow", () => {
    const result = openRowMenu("t1");
    const items = result.current.contextMenuItems;

    expect(
      items.find((i) => i.id === "insertAbove")?.disabled
    ).toBeUndefined();
    expect(
      items.find((i) => i.id === "insertBelow")?.disabled
    ).toBeUndefined();
  });
});

// ─── Zone 2: Task Table Header Context Menu ───

describe("Zone 2: Task Table Header Context Menu", () => {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  function openHeaderMenu(columnId: string) {
    const { result } = renderHook(() => useTableHeaderContextMenu());

    act(() => {
      result.current.handleHeaderContextMenu(
        mockMouseEvent(200, 50),
        columnId
      );
    });

    return result;
  }

  it("should have 3 items in 2 groups", () => {
    const result = openHeaderMenu("startDate");

    expect(result.current.contextMenuItems).toHaveLength(3);
    expect(result.current.contextMenuItems.map((i) => i.id)).toEqual([
      "hideColumn",
      "showAllColumns",
      "autoFitWidth",
    ]);
  });

  it("should show column name in hide label", () => {
    const result = openHeaderMenu("startDate");
    expect(result.current.contextMenuItems[0].label).toBe(
      'Hide Column "Start Date"'
    );
  });

  it("should show column name for end date", () => {
    const result = openHeaderMenu("endDate");
    expect(result.current.contextMenuItems[0].label).toBe(
      'Hide Column "End Date"'
    );
  });

  it("should disable hide for non-hideable columns", () => {
    const result = openHeaderMenu("name");
    expect(result.current.contextMenuItems[0].disabled).toBe(true);
  });

  it("should disable hide for rowNumber column", () => {
    const result = openHeaderMenu("rowNumber");
    expect(result.current.contextMenuItems[0].disabled).toBe(true);
  });

  it("should disable hide for color column", () => {
    const result = openHeaderMenu("color");
    expect(result.current.contextMenuItems[0].disabled).toBe(true);
  });

  it("should enable hide for hideable column", () => {
    const result = openHeaderMenu("startDate");
    expect(result.current.contextMenuItems[0].disabled).toBe(false);
  });

  it("should disable hide when last visible hideable column", () => {
    useChartStore
      .getState()
      .setHiddenColumns(["endDate", "duration", "progress"]);

    const result = openHeaderMenu("startDate");
    expect(result.current.contextMenuItems[0].disabled).toBe(true);
  });

  it("should disable show all when no columns hidden", () => {
    const result = openHeaderMenu("startDate");
    expect(result.current.contextMenuItems[1].disabled).toBe(true);
  });

  it("should enable show all when columns are hidden", () => {
    useChartStore.getState().setHiddenColumns(["endDate"]);

    const result = openHeaderMenu("startDate");
    expect(result.current.contextMenuItems[1].disabled).toBe(false);
  });

  it("should have separator after showAllColumns", () => {
    const result = openHeaderMenu("startDate");
    expect(result.current.contextMenuItems[1].separator).toBe(true);
  });

  it("should disable auto-fit for rowNumber", () => {
    const result = openHeaderMenu("rowNumber");
    expect(result.current.contextMenuItems[2].disabled).toBe(true);
  });

  it("should disable auto-fit for color", () => {
    const result = openHeaderMenu("color");
    expect(result.current.contextMenuItems[2].disabled).toBe(true);
  });

  it("should enable auto-fit for name column", () => {
    const result = openHeaderMenu("name");
    expect(result.current.contextMenuItems[2].disabled).toBe(false);
  });

  it("should enable auto-fit for startDate column", () => {
    const result = openHeaderMenu("startDate");
    expect(result.current.contextMenuItems[2].disabled).toBe(false);
  });
});

// ─── Zone 3: Timeline Bar Context Menu ───

describe("Zone 3: Timeline Bar Context Menu", () => {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  function openBarMenu(taskId: string, selectedIds?: string[]) {
    useTaskStore.getState().setTasks([task1, task2, task3]);
    useTaskStore
      .getState()
      .setSelectedTaskIds(selectedIds ?? [taskId]);

    const flat = [task1, task2, task3].map((t, i) => toFlattened(t, i + 1));
    vi.mocked(useFlattenedTasks).mockReturnValue({
      flattenedTasks: flat,
      allFlattenedTasks: flat,
    });

    const { result } = renderHook(() => useTimelineBarContextMenu());

    act(() => {
      result.current.handleBarContextMenu(mockMouseEvent(400, 200), taskId);
    });

    return result;
  }

  it("should have 5 items in 2 groups", () => {
    const result = openBarMenu("t1");

    expect(result.current.contextMenuItems).toHaveLength(5);
    expect(result.current.contextMenuItems.map((i) => i.id)).toEqual([
      "cut",
      "copy",
      "paste",
      "delete",
      "hide",
    ]);
  });

  it("should show dynamic labels for multi-select", () => {
    const result = openBarMenu("t1", ["t1", "t2", "t3"]);
    const items = result.current.contextMenuItems;

    expect(items.find((i) => i.id === "delete")?.label).toBe(
      "Delete 3 Tasks"
    );
    expect(items.find((i) => i.id === "hide")?.label).toBe("Hide 3 Rows");
  });

  it("should show singular labels for single selection", () => {
    const result = openBarMenu("t1");
    const items = result.current.contextMenuItems;

    expect(items.find((i) => i.id === "delete")?.label).toBe("Delete Task");
    expect(items.find((i) => i.id === "hide")?.label).toBe("Hide Row");
  });

  it("should disable clipboard when canCopyOrCut is false", () => {
    // No tasks, no selection → canCopyOrCut = false
    const { result } = renderHook(() => useTimelineBarContextMenu());

    // Open menu without setting up tasks/selection
    act(() => {
      result.current.handleBarContextMenu(mockMouseEvent(400, 200), "t1");
    });

    // After right-click, selection is set to ["t1"], but task doesn't exist
    // canCopyOrCut should be true (selectedTaskIds.length > 0)
    // canPaste is false (no clipboard content)
    const items = result.current.contextMenuItems;
    expect(items.find((i) => i.id === "paste")?.disabled).toBe(true);
  });

  it("should have separator after paste", () => {
    const result = openBarMenu("t1");
    expect(
      result.current.contextMenuItems.find((i) => i.id === "paste")?.separator
    ).toBe(true);
  });

  it("should use single task when right-clicked task not in selection", () => {
    const result = openBarMenu("t2", ["t1"]);
    const items = result.current.contextMenuItems;

    // Right-clicking t2 when t1 is selected → selection switches to [t2]
    expect(items.find((i) => i.id === "delete")?.label).toBe("Delete Task");
    expect(items.find((i) => i.id === "hide")?.label).toBe("Hide Row");
  });

  it("should show correct shortcuts", () => {
    const result = openBarMenu("t1");
    const items = result.current.contextMenuItems;

    expect(items.find((i) => i.id === "cut")?.shortcut).toBe("Ctrl+X");
    expect(items.find((i) => i.id === "copy")?.shortcut).toBe("Ctrl+C");
    expect(items.find((i) => i.id === "paste")?.shortcut).toBe("Ctrl+V");
    expect(items.find((i) => i.id === "delete")?.shortcut).toBe("Del");
    expect(items.find((i) => i.id === "hide")?.shortcut).toBe("Ctrl+H");
  });
});

// ─── Zone 4: Timeline Empty Area Context Menu ───

describe("Zone 4: Timeline Empty Area Context Menu", () => {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  function openAreaMenu() {
    useTaskStore.getState().setTasks([task1]);

    const { result } = renderHook(() => useTimelineAreaContextMenu());

    act(() => {
      result.current.handleAreaContextMenu(mockMouseEvent(500, 300));
    });

    return result;
  }

  it("should have 2 items", () => {
    const result = openAreaMenu();

    expect(result.current.contextMenuItems).toHaveLength(2);
    expect(result.current.contextMenuItems.map((i) => i.id)).toEqual([
      "paste",
      "fitToView",
    ]);
  });

  it("should disable paste when clipboard is empty", () => {
    const result = openAreaMenu();
    expect(result.current.contextMenuItems[0].disabled).toBe(true);
  });

  it("should always enable fit to view", () => {
    const result = openAreaMenu();
    expect(result.current.contextMenuItems[1].disabled).toBeUndefined();
  });

  it("should have separator after paste", () => {
    const result = openAreaMenu();
    expect(result.current.contextMenuItems[0].separator).toBe(true);
  });

  it("should show correct shortcuts", () => {
    const result = openAreaMenu();
    expect(result.current.contextMenuItems[0].shortcut).toBe("Ctrl+V");
    expect(result.current.contextMenuItems[1].shortcut).toBe("F");
  });
});

// ─── Right-click selection logic ───

describe("Right-click selection logic", () => {
  it("should keep selection when right-clicking selected task", () => {
    useTaskStore.getState().setTasks([task1, task2]);
    useTaskStore.getState().setSelectedTaskIds(["t1", "t2"]);

    const flat = [task1, task2].map((t, i) => toFlattened(t, i + 1));
    vi.mocked(useFlattenedTasks).mockReturnValue({
      flattenedTasks: flat,
      allFlattenedTasks: flat,
    });

    const { result } = renderHook(() => useTaskTableRowContextMenu());

    act(() => {
      // Right-click on t1 which IS in selection
      result.current.handleRowContextMenu(mockMouseEvent(200, 300), "t1");
    });

    // Selection should remain [t1, t2]
    expect(useTaskStore.getState().selectedTaskIds).toEqual(["t1", "t2"]);
  });

  it("should switch selection when right-clicking unselected task", () => {
    useTaskStore.getState().setTasks([task1, task2, task3]);
    useTaskStore.getState().setSelectedTaskIds(["t1", "t2"]);

    const flat = [task1, task2, task3].map((t, i) => toFlattened(t, i + 1));
    vi.mocked(useFlattenedTasks).mockReturnValue({
      flattenedTasks: flat,
      allFlattenedTasks: flat,
    });

    const { result } = renderHook(() => useTaskTableRowContextMenu());

    act(() => {
      // Right-click on t3 which is NOT in selection
      result.current.handleRowContextMenu(mockMouseEvent(200, 300), "t3");
    });

    // Selection should switch to [t3]
    expect(useTaskStore.getState().selectedTaskIds).toEqual(["t3"]);
  });
});
