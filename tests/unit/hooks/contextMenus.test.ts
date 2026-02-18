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

  it("should have 11 items in 4 groups (no unhide)", () => {
    const result = openRowMenu("t1");

    expect(result.current.contextMenuItems).toHaveLength(11);
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
      "ungroup",
      "hide",
    ]);
  });

  it("should show 12 items when unhide is available", () => {
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

    expect(result.current.contextMenuItems).toHaveLength(12);
    expect(result.current.contextMenuItems[11].id).toBe("unhide");
    expect(result.current.contextMenuItems[11].label).toBe("Unhide 1 Row");
  });

  it("should have separators after paste, delete, and group", () => {
    const result = openRowMenu("t1");
    const items = result.current.contextMenuItems;

    expect(items.find((i) => i.id === "paste")?.separator).toBe(true);
    expect(items.find((i) => i.id === "delete")?.separator).toBe(true);
    expect(items.find((i) => i.id === "ungroup")?.separator).toBe(true);
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

// ─── Zone 2: Task Table Header Context Menu (Explorer-style) ───

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

  it("should have 7 items in 3 groups", () => {
    const result = openHeaderMenu("startDate");

    expect(result.current.contextMenuItems).toHaveLength(7);
    expect(result.current.contextMenuItems.map((i) => i.id)).toEqual([
      "sizeToFit",
      "sizeAllToFit",
      "toggle_startDate",
      "toggle_endDate",
      "toggle_duration",
      "toggle_progress",
      "showAllColumns",
    ]);
  });

  it("should show column name in size-to-fit label", () => {
    const result = openHeaderMenu("startDate");
    expect(result.current.contextMenuItems[0].label).toBe(
      'Size "Start Date" to Fit'
    );
  });

  it("should show column name for name column", () => {
    const result = openHeaderMenu("name");
    expect(result.current.contextMenuItems[0].label).toBe(
      'Size "Name" to Fit'
    );
  });

  it("should disable size-to-fit for rowNumber", () => {
    const result = openHeaderMenu("rowNumber");
    expect(result.current.contextMenuItems[0].disabled).toBe(true);
  });

  it("should disable size-to-fit for color", () => {
    const result = openHeaderMenu("color");
    expect(result.current.contextMenuItems[0].disabled).toBe(true);
  });

  it("should enable size-to-fit for name column", () => {
    const result = openHeaderMenu("name");
    expect(result.current.contextMenuItems[0].disabled).toBe(false);
  });

  it("should enable size-to-fit for startDate column", () => {
    const result = openHeaderMenu("startDate");
    expect(result.current.contextMenuItems[0].disabled).toBe(false);
  });

  it("should have separator after sizeAllToFit", () => {
    const result = openHeaderMenu("startDate");
    expect(result.current.contextMenuItems[1].separator).toBe(true);
  });

  it("should show all hideable columns as checked when none hidden", () => {
    const result = openHeaderMenu("startDate");
    const toggleItems = result.current.contextMenuItems.filter((i) =>
      i.id.startsWith("toggle_")
    );

    expect(toggleItems).toHaveLength(4);
    expect(toggleItems.every((i) => i.checked === true)).toBe(true);
  });

  it("should show hidden column as unchecked", () => {
    useChartStore.getState().setHiddenColumns(["endDate"]);

    const result = openHeaderMenu("startDate");
    const endDateToggle = result.current.contextMenuItems.find(
      (i) => i.id === "toggle_endDate"
    );

    expect(endDateToggle?.checked).toBe(false);
  });

  it("should allow hiding all hideable columns (Name is always visible)", () => {
    useChartStore
      .getState()
      .setHiddenColumns(["endDate", "duration", "progress"]);

    const result = openHeaderMenu("startDate");
    const startDateToggle = result.current.contextMenuItems.find(
      (i) => i.id === "toggle_startDate"
    );

    // Not disabled — Name column is always visible, so all hideable can be hidden
    expect(startDateToggle?.disabled).toBeUndefined();
  });

  it("should use menuLabel for progress column", () => {
    const result = openHeaderMenu("startDate");
    const progressToggle = result.current.contextMenuItems.find(
      (i) => i.id === "toggle_progress"
    );

    expect(progressToggle?.label).toBe("Progress");
  });

  it("should have separator after last toggle item", () => {
    const result = openHeaderMenu("startDate");
    const progressToggle = result.current.contextMenuItems.find(
      (i) => i.id === "toggle_progress"
    );

    expect(progressToggle?.separator).toBe(true);
  });

  it("should disable show all when no columns hidden", () => {
    const result = openHeaderMenu("startDate");
    const showAll = result.current.contextMenuItems.find(
      (i) => i.id === "showAllColumns"
    );

    expect(showAll?.disabled).toBe(true);
  });

  it("should enable show all when columns are hidden", () => {
    useChartStore.getState().setHiddenColumns(["endDate"]);

    const result = openHeaderMenu("startDate");
    const showAll = result.current.contextMenuItems.find(
      (i) => i.id === "showAllColumns"
    );

    expect(showAll?.disabled).toBe(false);
  });

  it("should produce identical menu regardless of which column is right-clicked", () => {
    const resultA = openHeaderMenu("startDate");
    const idsA = resultA.current.contextMenuItems.map((i) => i.id);

    const resultB = openHeaderMenu("name");
    const idsB = resultB.current.contextMenuItems.map((i) => i.id);

    // Same item IDs (except sizeToFit label differs)
    expect(idsA).toEqual(idsB);
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

  it("should have 11 items in 4 groups (same as Zone 1)", () => {
    const result = openBarMenu("t1");

    expect(result.current.contextMenuItems).toHaveLength(11);
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
      "ungroup",
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

/** Create a mock SVG ref with a configurable bounding rect. */
function createMockSvgRef(
  top = 0
): React.RefObject<SVGSVGElement | null> {
  return {
    current: {
      getBoundingClientRect: () => ({
        top,
        left: 0,
        right: 1000,
        bottom: 600,
        width: 1000,
        height: 600,
        x: 0,
        y: top,
        toJSON: () => ({}),
      }),
    } as unknown as SVGSVGElement,
  };
}

const ROW_HEIGHT = 36;

describe("Zone 4: Timeline Empty Area Context Menu", () => {
  const svgRef = createMockSvgRef(0);

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  function openAreaMenu(x = 500, y = 300) {
    useTaskStore.getState().setTasks([task1]);

    const flat = [toFlattened(task1, 1)];
    vi.mocked(useFlattenedTasks).mockReturnValue({
      flattenedTasks: flat,
      allFlattenedTasks: flat,
    });

    const { result } = renderHook(() =>
      useTimelineAreaContextMenu({
        svgRef,
        tasks: [task1],
        rowHeight: ROW_HEIGHT,
      })
    );

    act(() => {
      result.current.handleAreaContextMenu(mockMouseEvent(x, y));
    });

    return result;
  }

  it("should have 2 items when clicking outside task rows", () => {
    // y=300 → row index 300/36 = 8, which is beyond tasks.length=1
    const result = openAreaMenu(500, 300);

    expect(result.current.contextMenuItems).toHaveLength(2);
    expect(result.current.contextMenuItems.map((i) => i.id)).toEqual([
      "paste",
      "fitToView",
    ]);
  });

  it("should disable paste when clipboard is empty", () => {
    const result = openAreaMenu(500, 300);
    expect(result.current.contextMenuItems[0].disabled).toBe(true);
  });

  it("should always enable fit to view", () => {
    const result = openAreaMenu(500, 300);
    expect(result.current.contextMenuItems[1].disabled).toBeUndefined();
  });

  it("should have separator after paste", () => {
    const result = openAreaMenu(500, 300);
    expect(result.current.contextMenuItems[0].separator).toBe(true);
  });

  it("should show correct shortcuts", () => {
    const result = openAreaMenu(500, 300);
    expect(result.current.contextMenuItems[0].shortcut).toBe("Ctrl+V");
    expect(result.current.contextMenuItems[1].shortcut).toBe("F");
  });

  it("should show full task menu when clicking on a selected task row", () => {
    useTaskStore.getState().setTasks([task1, task2, task3]);
    useTaskStore.getState().setSelectedTaskIds(["t1"]);

    const flat = [task1, task2, task3].map((t, i) => toFlattened(t, i + 1));
    vi.mocked(useFlattenedTasks).mockReturnValue({
      flattenedTasks: flat,
      allFlattenedTasks: flat,
    });

    const { result } = renderHook(() =>
      useTimelineAreaContextMenu({
        svgRef,
        tasks: [task1, task2, task3],
        rowHeight: ROW_HEIGHT,
      })
    );

    act(() => {
      // y=10 → row index 10/36 = 0 → task1, which is selected
      result.current.handleAreaContextMenu(mockMouseEvent(500, 10));
    });

    expect(result.current.contextMenuItems).toHaveLength(11);
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
      "ungroup",
      "hide",
    ]);
  });

  it("should show default menu when clicking on a non-selected task row", () => {
    useTaskStore.getState().setTasks([task1, task2]);
    useTaskStore.getState().setSelectedTaskIds(["t2"]);

    const flat = [task1, task2].map((t, i) => toFlattened(t, i + 1));
    vi.mocked(useFlattenedTasks).mockReturnValue({
      flattenedTasks: flat,
      allFlattenedTasks: flat,
    });

    const { result } = renderHook(() =>
      useTimelineAreaContextMenu({
        svgRef,
        tasks: [task1, task2],
        rowHeight: ROW_HEIGHT,
      })
    );

    act(() => {
      // y=10 → row index 0 → task1, which is NOT selected
      result.current.handleAreaContextMenu(mockMouseEvent(500, 10));
    });

    expect(result.current.contextMenuItems).toHaveLength(2);
    expect(result.current.contextMenuItems.map((i) => i.id)).toEqual([
      "paste",
      "fitToView",
    ]);
  });

  it("should show default menu when no tasks exist", () => {
    useTaskStore.getState().setTasks([]);

    const { result } = renderHook(() =>
      useTimelineAreaContextMenu({
        svgRef,
        tasks: [],
        rowHeight: ROW_HEIGHT,
      })
    );

    act(() => {
      result.current.handleAreaContextMenu(mockMouseEvent(500, 10));
    });

    expect(result.current.contextMenuItems).toHaveLength(2);
    expect(result.current.contextMenuItems.map((i) => i.id)).toEqual([
      "paste",
      "fitToView",
    ]);
  });

  it("should show unhide item when clicking selected row with hidden rows in range", () => {
    const t4 = createTask("t4", "Task 4", { order: 3 });
    useTaskStore.getState().setTasks([task1, task2, task3, t4]);
    useTaskStore.getState().setSelectedTaskIds(["t1", "t4"]);
    useChartStore.getState().setHiddenTaskIds(["t2", "t3"]);

    const allFlat = [task1, task2, task3, t4].map((t, i) =>
      toFlattened(t, i + 1)
    );
    const visibleFlat = [toFlattened(task1, 1), toFlattened(t4, 4)];
    vi.mocked(useFlattenedTasks).mockReturnValue({
      flattenedTasks: visibleFlat,
      allFlattenedTasks: allFlat,
    });

    const { result } = renderHook(() =>
      useTimelineAreaContextMenu({
        svgRef,
        tasks: [task1, t4],
        rowHeight: ROW_HEIGHT,
      })
    );

    act(() => {
      // y=10 → row index 0 → task1, which is selected
      result.current.handleAreaContextMenu(mockMouseEvent(500, 10));
    });

    expect(result.current.contextMenuItems).toHaveLength(12);
    const unhideItem = result.current.contextMenuItems.find(
      (i) => i.id === "unhide"
    );
    expect(unhideItem?.label).toBe("Unhide 2 Rows");
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
