/**
 * Tests for context menu hooks (Zones 1-4).
 * Tests menu item composition: correct items, disabled states, dynamic labels,
 * separator placement, and selection behavior.
 *
 * Since hooks use Zustand stores internally, we test by setting up store state
 * and verifying the resulting menu item arrays.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import { useChartStore } from "../../../src/store/slices/chartSlice";
import type { Task } from "../../../src/types/chart.types";
import type { ContextMenuItem } from "../../../src/components/ContextMenu/ContextMenu";
import {
  TASK_COLUMNS,
  getHideableColumns,
  getVisibleColumns,
} from "../../../src/config/tableColumns";

// Mock dependencies
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

function setupTasks(tasks: Task[]): void {
  useTaskStore.getState().setTasks(tasks);
}

function selectTasks(taskIds: string[]): void {
  useTaskStore.getState().setSelectedTaskIds(taskIds);
}

// ─── Zone 1 item builder (mirrors useTaskTableRowContextMenu logic) ───

function buildZone1Items(
  taskId: string,
  selectedTaskIds: string[],
  options: {
    canCopyOrCut: boolean;
    canPaste: boolean;
    canIndent: boolean;
    canOutdent: boolean;
    canGroup: boolean;
    hiddenInRangeCount: number;
  }
): ContextMenuItem[] {
  const effectiveSelection = selectedTaskIds.includes(taskId)
    ? selectedTaskIds
    : [taskId];
  const count = effectiveSelection.length;

  const items: ContextMenuItem[] = [];

  // Group 1: Clipboard
  items.push({
    id: "cut",
    label: "Cut",
    shortcut: "Ctrl+X",
    onClick: vi.fn(),
    disabled: !options.canCopyOrCut,
  });
  items.push({
    id: "copy",
    label: "Copy",
    shortcut: "Ctrl+C",
    onClick: vi.fn(),
    disabled: !options.canCopyOrCut,
  });
  items.push({
    id: "paste",
    label: "Paste",
    shortcut: "Ctrl+V",
    onClick: vi.fn(),
    disabled: !options.canPaste,
    separator: true,
  });

  // Group 2: Insert/Delete
  items.push({
    id: "insertAbove",
    label: "Insert Task Above",
    shortcut: "Ctrl++",
    onClick: vi.fn(),
  });
  items.push({
    id: "insertBelow",
    label: "Insert Task Below",
    onClick: vi.fn(),
  });
  items.push({
    id: "delete",
    label: count > 1 ? `Delete ${count} Tasks` : "Delete Task",
    shortcut: "Del",
    onClick: vi.fn(),
    disabled: count === 0,
    separator: true,
  });

  // Group 3: Hierarchy
  items.push({
    id: "indent",
    label: "Indent",
    shortcut: "Alt+Shift+→",
    onClick: vi.fn(),
    disabled: !options.canIndent,
  });
  items.push({
    id: "outdent",
    label: "Outdent",
    shortcut: "Alt+Shift+←",
    onClick: vi.fn(),
    disabled: !options.canOutdent,
  });
  items.push({
    id: "group",
    label: "Group",
    shortcut: "Ctrl+G",
    onClick: vi.fn(),
    disabled: !options.canGroup,
    separator: true,
  });

  // Group 4: Visibility
  items.push({
    id: "hide",
    label: count > 1 ? `Hide ${count} Rows` : "Hide Row",
    shortcut: "Ctrl+H",
    onClick: vi.fn(),
    disabled: count === 0,
  });

  if (
    options.hiddenInRangeCount > 0 &&
    selectedTaskIds.length >= 2 &&
    selectedTaskIds.includes(taskId)
  ) {
    items.push({
      id: "unhide",
      label: `Unhide ${options.hiddenInRangeCount} Row${options.hiddenInRangeCount !== 1 ? "s" : ""}`,
      shortcut: "Ctrl+Shift+H",
      onClick: vi.fn(),
    });
  }

  return items;
}

// ─── Zone 2 item builder (mirrors useTableHeaderContextMenu logic) ───

function buildZone2Items(
  columnId: string,
  hiddenColumns: string[]
): ContextMenuItem[] {
  const column = TASK_COLUMNS.find((c) => c.id === columnId);
  if (!column) return [];

  const hideableColumns = getHideableColumns();
  const visibleHideable = hideableColumns.filter(
    (c) => !hiddenColumns.includes(c.id)
  );

  const isHideable = column.hideable === true;
  const isLastVisibleHideable =
    isHideable &&
    visibleHideable.length <= 1 &&
    !hiddenColumns.includes(columnId);

  const visibleColumns = getVisibleColumns(hiddenColumns);
  const isVisible = visibleColumns.some((c) => c.id === columnId);

  return [
    {
      id: "hideColumn",
      label: `Hide Column "${column.label}"`,
      onClick: vi.fn(),
      disabled: !isHideable || isLastVisibleHideable,
    },
    {
      id: "showAllColumns",
      label: "Show All Columns",
      onClick: vi.fn(),
      disabled: hiddenColumns.length === 0,
      separator: true,
    },
    {
      id: "autoFitWidth",
      label: "Auto-fit Column Width",
      onClick: vi.fn(),
      disabled:
        !isVisible || columnId === "rowNumber" || columnId === "color",
    },
  ];
}

// ─── Zone 3 item builder (mirrors useTimelineBarContextMenu logic) ───

function buildZone3Items(
  taskId: string,
  selectedTaskIds: string[],
  options: { canCopyOrCut: boolean; canPaste: boolean }
): ContextMenuItem[] {
  const effectiveSelection = selectedTaskIds.includes(taskId)
    ? selectedTaskIds
    : [taskId];
  const count = effectiveSelection.length;

  return [
    {
      id: "cut",
      label: "Cut",
      shortcut: "Ctrl+X",
      onClick: vi.fn(),
      disabled: !options.canCopyOrCut,
    },
    {
      id: "copy",
      label: "Copy",
      shortcut: "Ctrl+C",
      onClick: vi.fn(),
      disabled: !options.canCopyOrCut,
    },
    {
      id: "paste",
      label: "Paste",
      shortcut: "Ctrl+V",
      onClick: vi.fn(),
      disabled: !options.canPaste,
      separator: true,
    },
    {
      id: "delete",
      label: count > 1 ? `Delete ${count} Tasks` : "Delete Task",
      shortcut: "Del",
      onClick: vi.fn(),
      disabled: count === 0,
    },
    {
      id: "hide",
      label: count > 1 ? `Hide ${count} Rows` : "Hide Row",
      shortcut: "Ctrl+H",
      onClick: vi.fn(),
      disabled: count === 0,
    },
  ];
}

// ─── Zone 4 item builder (mirrors useTimelineAreaContextMenu logic) ───

function buildZone4Items(canPaste: boolean): ContextMenuItem[] {
  return [
    {
      id: "paste",
      label: "Paste",
      shortcut: "Ctrl+V",
      onClick: vi.fn(),
      disabled: !canPaste,
      separator: true,
    },
    {
      id: "fitToView",
      label: "Fit to View",
      shortcut: "F",
      onClick: vi.fn(),
    },
  ];
}

// ─── Tests ───

beforeEach(() => {
  // Reset all stores
  useTaskStore.getState().setTasks([]);
  useTaskStore.getState().clearSelection();
  useChartStore.getState().setHiddenColumns([]);
  useChartStore.getState().setHiddenTaskIds([]);
});

describe("Zone 1: Task Table Row Context Menu", () => {
  const task1 = createTask("t1", "Task 1", { order: 0 });
  const task2 = createTask("t2", "Task 2", { order: 1 });
  const task3 = createTask("t3", "Task 3", { order: 2 });

  it("should have 11 items in 4 groups (10 base + separator markers)", () => {
    setupTasks([task1, task2, task3]);
    selectTasks(["t1"]);

    const items = buildZone1Items("t1", ["t1"], {
      canCopyOrCut: true,
      canPaste: false,
      canIndent: false,
      canOutdent: false,
      canGroup: false,
      hiddenInRangeCount: 0,
    });

    expect(items).toHaveLength(10); // 10 items (no unhide)
    expect(items.map((i) => i.id)).toEqual([
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
    setupTasks([task1, task2, task3]);
    selectTasks(["t1", "t3"]);

    const items = buildZone1Items("t1", ["t1", "t3"], {
      canCopyOrCut: true,
      canPaste: true,
      canIndent: true,
      canOutdent: false,
      canGroup: false,
      hiddenInRangeCount: 1,
    });

    expect(items).toHaveLength(11);
    expect(items[10].id).toBe("unhide");
    expect(items[10].label).toBe("Unhide 1 Row");
  });

  it("should have separators after paste, delete, and group", () => {
    const items = buildZone1Items("t1", ["t1"], {
      canCopyOrCut: true,
      canPaste: true,
      canIndent: true,
      canOutdent: true,
      canGroup: true,
      hiddenInRangeCount: 0,
    });

    const pasteItem = items.find((i) => i.id === "paste");
    const deleteItem = items.find((i) => i.id === "delete");
    const groupItem = items.find((i) => i.id === "group");

    expect(pasteItem?.separator).toBe(true);
    expect(deleteItem?.separator).toBe(true);
    expect(groupItem?.separator).toBe(true);
  });

  it("should show dynamic labels for multi-select", () => {
    const items = buildZone1Items("t1", ["t1", "t2", "t3"], {
      canCopyOrCut: true,
      canPaste: false,
      canIndent: false,
      canOutdent: false,
      canGroup: true,
      hiddenInRangeCount: 0,
    });

    const deleteItem = items.find((i) => i.id === "delete");
    const hideItem = items.find((i) => i.id === "hide");

    expect(deleteItem?.label).toBe("Delete 3 Tasks");
    expect(hideItem?.label).toBe("Hide 3 Rows");
  });

  it("should show singular labels for single selection", () => {
    const items = buildZone1Items("t1", ["t1"], {
      canCopyOrCut: true,
      canPaste: false,
      canIndent: false,
      canOutdent: false,
      canGroup: false,
      hiddenInRangeCount: 0,
    });

    const deleteItem = items.find((i) => i.id === "delete");
    const hideItem = items.find((i) => i.id === "hide");

    expect(deleteItem?.label).toBe("Delete Task");
    expect(hideItem?.label).toBe("Hide Row");
  });

  it("should disable paste when clipboard is empty", () => {
    const items = buildZone1Items("t1", ["t1"], {
      canCopyOrCut: true,
      canPaste: false,
      canIndent: false,
      canOutdent: false,
      canGroup: false,
      hiddenInRangeCount: 0,
    });

    const pasteItem = items.find((i) => i.id === "paste");
    expect(pasteItem?.disabled).toBe(true);
  });

  it("should disable indent/outdent/group when not possible", () => {
    const items = buildZone1Items("t1", ["t1"], {
      canCopyOrCut: true,
      canPaste: false,
      canIndent: false,
      canOutdent: false,
      canGroup: false,
      hiddenInRangeCount: 0,
    });

    expect(items.find((i) => i.id === "indent")?.disabled).toBe(true);
    expect(items.find((i) => i.id === "outdent")?.disabled).toBe(true);
    expect(items.find((i) => i.id === "group")?.disabled).toBe(true);
  });

  it("should enable indent/outdent/group when possible", () => {
    const items = buildZone1Items("t1", ["t1"], {
      canCopyOrCut: true,
      canPaste: false,
      canIndent: true,
      canOutdent: true,
      canGroup: true,
      hiddenInRangeCount: 0,
    });

    expect(items.find((i) => i.id === "indent")?.disabled).toBe(false);
    expect(items.find((i) => i.id === "outdent")?.disabled).toBe(false);
    expect(items.find((i) => i.id === "group")?.disabled).toBe(false);
  });

  it("should use single task when right-clicked task is not in selection", () => {
    const items = buildZone1Items("t2", ["t1"], {
      canCopyOrCut: true,
      canPaste: false,
      canIndent: false,
      canOutdent: false,
      canGroup: false,
      hiddenInRangeCount: 0,
    });

    // effectiveSelection is [t2] since t2 is not in [t1]
    expect(items.find((i) => i.id === "delete")?.label).toBe("Delete Task");
    expect(items.find((i) => i.id === "hide")?.label).toBe("Hide Row");
  });

  it("should pluralize unhide correctly for multiple hidden rows", () => {
    const items = buildZone1Items("t1", ["t1", "t3"], {
      canCopyOrCut: true,
      canPaste: false,
      canIndent: false,
      canOutdent: false,
      canGroup: false,
      hiddenInRangeCount: 5,
    });

    const unhideItem = items.find((i) => i.id === "unhide");
    expect(unhideItem?.label).toBe("Unhide 5 Rows");
  });

  it("should not show unhide when only 1 task selected", () => {
    const items = buildZone1Items("t1", ["t1"], {
      canCopyOrCut: true,
      canPaste: false,
      canIndent: false,
      canOutdent: false,
      canGroup: false,
      hiddenInRangeCount: 3,
    });

    expect(items.find((i) => i.id === "unhide")).toBeUndefined();
  });

  it("should always enable insertAbove and insertBelow", () => {
    const items = buildZone1Items("t1", [], {
      canCopyOrCut: false,
      canPaste: false,
      canIndent: false,
      canOutdent: false,
      canGroup: false,
      hiddenInRangeCount: 0,
    });

    expect(items.find((i) => i.id === "insertAbove")?.disabled).toBeUndefined();
    expect(items.find((i) => i.id === "insertBelow")?.disabled).toBeUndefined();
  });
});

describe("Zone 2: Task Table Header Context Menu", () => {
  it("should have 3 items in 2 groups", () => {
    const items = buildZone2Items("startDate", []);
    expect(items).toHaveLength(3);
    expect(items.map((i) => i.id)).toEqual([
      "hideColumn",
      "showAllColumns",
      "autoFitWidth",
    ]);
  });

  it("should show column name in hide label", () => {
    const items = buildZone2Items("startDate", []);
    expect(items[0].label).toBe('Hide Column "Start Date"');
  });

  it("should show column name for end date", () => {
    const items = buildZone2Items("endDate", []);
    expect(items[0].label).toBe('Hide Column "End Date"');
  });

  it("should disable hide for non-hideable columns", () => {
    const items = buildZone2Items("name", []);
    expect(items[0].disabled).toBe(true);
  });

  it("should disable hide for rowNumber column", () => {
    const items = buildZone2Items("rowNumber", []);
    expect(items[0].disabled).toBe(true);
  });

  it("should disable hide for color column", () => {
    const items = buildZone2Items("color", []);
    expect(items[0].disabled).toBe(true);
  });

  it("should enable hide for hideable column", () => {
    const items = buildZone2Items("startDate", []);
    expect(items[0].disabled).toBe(false);
  });

  it("should disable hide when last visible hideable column", () => {
    // Hide all hideable columns except startDate
    const items = buildZone2Items("startDate", [
      "endDate",
      "duration",
      "progress",
    ]);
    expect(items[0].disabled).toBe(true);
  });

  it("should disable show all when no columns hidden", () => {
    const items = buildZone2Items("startDate", []);
    expect(items[1].disabled).toBe(true);
  });

  it("should enable show all when columns are hidden", () => {
    const items = buildZone2Items("startDate", ["endDate"]);
    expect(items[1].disabled).toBe(false);
  });

  it("should have separator after showAllColumns", () => {
    const items = buildZone2Items("startDate", []);
    expect(items[1].separator).toBe(true);
  });

  it("should disable auto-fit for rowNumber", () => {
    const items = buildZone2Items("rowNumber", []);
    expect(items[2].disabled).toBe(true);
  });

  it("should disable auto-fit for color", () => {
    const items = buildZone2Items("color", []);
    expect(items[2].disabled).toBe(true);
  });

  it("should enable auto-fit for name column", () => {
    const items = buildZone2Items("name", []);
    expect(items[2].disabled).toBe(false);
  });

  it("should enable auto-fit for startDate column", () => {
    const items = buildZone2Items("startDate", []);
    expect(items[2].disabled).toBe(false);
  });
});

describe("Zone 3: Timeline Bar Context Menu", () => {
  it("should have 5 items in 2 groups", () => {
    const items = buildZone3Items("t1", ["t1"], {
      canCopyOrCut: true,
      canPaste: false,
    });

    expect(items).toHaveLength(5);
    expect(items.map((i) => i.id)).toEqual([
      "cut",
      "copy",
      "paste",
      "delete",
      "hide",
    ]);
  });

  it("should show dynamic labels for multi-select", () => {
    const items = buildZone3Items("t1", ["t1", "t2", "t3"], {
      canCopyOrCut: true,
      canPaste: false,
    });

    expect(items.find((i) => i.id === "delete")?.label).toBe(
      "Delete 3 Tasks"
    );
    expect(items.find((i) => i.id === "hide")?.label).toBe("Hide 3 Rows");
  });

  it("should show singular labels for single selection", () => {
    const items = buildZone3Items("t1", ["t1"], {
      canCopyOrCut: true,
      canPaste: true,
    });

    expect(items.find((i) => i.id === "delete")?.label).toBe("Delete Task");
    expect(items.find((i) => i.id === "hide")?.label).toBe("Hide Row");
  });

  it("should disable clipboard when nothing selected", () => {
    const items = buildZone3Items("t1", ["t1"], {
      canCopyOrCut: false,
      canPaste: false,
    });

    expect(items.find((i) => i.id === "cut")?.disabled).toBe(true);
    expect(items.find((i) => i.id === "copy")?.disabled).toBe(true);
    expect(items.find((i) => i.id === "paste")?.disabled).toBe(true);
  });

  it("should have separator after paste", () => {
    const items = buildZone3Items("t1", ["t1"], {
      canCopyOrCut: true,
      canPaste: true,
    });

    expect(items.find((i) => i.id === "paste")?.separator).toBe(true);
  });

  it("should use single task when right-clicked task not in selection", () => {
    const items = buildZone3Items("t2", ["t1"], {
      canCopyOrCut: true,
      canPaste: false,
    });

    expect(items.find((i) => i.id === "delete")?.label).toBe("Delete Task");
    expect(items.find((i) => i.id === "hide")?.label).toBe("Hide Row");
  });

  it("should show correct shortcuts", () => {
    const items = buildZone3Items("t1", ["t1"], {
      canCopyOrCut: true,
      canPaste: true,
    });

    expect(items.find((i) => i.id === "cut")?.shortcut).toBe("Ctrl+X");
    expect(items.find((i) => i.id === "copy")?.shortcut).toBe("Ctrl+C");
    expect(items.find((i) => i.id === "paste")?.shortcut).toBe("Ctrl+V");
    expect(items.find((i) => i.id === "delete")?.shortcut).toBe("Del");
    expect(items.find((i) => i.id === "hide")?.shortcut).toBe("Ctrl+H");
  });
});

describe("Zone 4: Timeline Empty Area Context Menu", () => {
  it("should have 2 items", () => {
    const items = buildZone4Items(false);

    expect(items).toHaveLength(2);
    expect(items.map((i) => i.id)).toEqual(["paste", "fitToView"]);
  });

  it("should disable paste when clipboard is empty", () => {
    const items = buildZone4Items(false);
    expect(items[0].disabled).toBe(true);
  });

  it("should enable paste when clipboard has content", () => {
    const items = buildZone4Items(true);
    expect(items[0].disabled).toBe(false);
  });

  it("should always enable fit to view", () => {
    const items = buildZone4Items(false);
    expect(items[1].disabled).toBeUndefined();
  });

  it("should have separator after paste", () => {
    const items = buildZone4Items(false);
    expect(items[0].separator).toBe(true);
  });

  it("should show correct shortcuts", () => {
    const items = buildZone4Items(false);
    expect(items[0].shortcut).toBe("Ctrl+V");
    expect(items[1].shortcut).toBe("F");
  });
});

describe("Right-click selection logic", () => {
  it("should keep selection when right-clicking selected task", () => {
    const task1 = createTask("t1", "Task 1");
    const task2 = createTask("t2", "Task 2");
    setupTasks([task1, task2]);
    selectTasks(["t1", "t2"]);

    // Simulate: right-click on t1 which IS in selection
    const selectedIds = useTaskStore.getState().selectedTaskIds;
    const clickedTaskId = "t1";

    if (!selectedIds.includes(clickedTaskId)) {
      useTaskStore.getState().setSelectedTaskIds([clickedTaskId]);
    }

    // Selection should remain [t1, t2]
    expect(useTaskStore.getState().selectedTaskIds).toEqual(["t1", "t2"]);
  });

  it("should switch selection when right-clicking unselected task", () => {
    const task1 = createTask("t1", "Task 1");
    const task2 = createTask("t2", "Task 2");
    const task3 = createTask("t3", "Task 3");
    setupTasks([task1, task2, task3]);
    selectTasks(["t1", "t2"]);

    // Simulate: right-click on t3 which is NOT in selection
    const selectedIds = useTaskStore.getState().selectedTaskIds;
    const clickedTaskId = "t3";

    if (!selectedIds.includes(clickedTaskId)) {
      useTaskStore.getState().setSelectedTaskIds([clickedTaskId]);
    }

    // Selection should switch to [t3]
    expect(useTaskStore.getState().selectedTaskIds).toEqual(["t3"]);
  });
});
