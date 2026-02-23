/**
 * Smoke tests for TaskTable container component.
 * Verifies mounting, row rendering, "all hidden" message, and DnD setup.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskTable } from "../../../src/components/TaskList/TaskTable";
import type { Task } from "../../../src/types/chart.types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("../../../src/store/slices/taskSlice", () => ({
  useTaskStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      reorderTasks: vi.fn(),
      columnWidths: {},
    })
  ),
}));

vi.mock("../../../src/store/slices/chartSlice", () => ({
  useChartStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      hiddenColumns: [],
      hiddenTaskIds: [],
    })
  ),
}));

vi.mock("../../../src/store/slices/userPreferencesSlice", () => ({
  useDensityConfig: vi.fn(() => ({
    rowHeight: 36,
    taskBarHeight: 26,
    taskBarOffset: 5,
    cellPaddingY: 6,
    cellPaddingX: 8,
    headerPaddingY: 4,
    fontSizeCell: 13,
    fontSizeBar: 12,
    fontSizeHeader: 11,
    iconSize: 16,
    checkboxSize: 14,
    indentSize: 20,
    colorBarHeight: 14,
    columnWidths: {
      rowNumber: 52,
      color: 30,
      nameMin: 180,
      startDate: 118,
      endDate: 118,
      duration: 90,
      progress: 62,
    },
  })),
}));

vi.mock("../../../src/hooks/useTableDimensions", () => ({
  useTableDimensions: vi.fn(() => ({ totalColumnWidth: 800 })),
}));

vi.mock("../../../src/hooks/useAutoColumnWidth", () => ({
  useAutoColumnWidth: vi.fn(),
}));

vi.mock("../../../src/hooks/useTaskTableRowContextMenu", () => ({
  useTaskTableRowContextMenu: vi.fn(() => ({
    contextMenu: null,
    contextMenuItems: [],
    handleRowContextMenu: vi.fn(),
    closeContextMenu: vi.fn(),
  })),
}));

vi.mock("../../../src/hooks/useHideOperations", () => ({
  useHideOperations: vi.fn(() => ({
    hideRows: vi.fn(),
    showAll: vi.fn(),
    unhideRange: vi.fn(),
    unhideSelection: vi.fn(),
    getHiddenInSelectionCount: vi.fn(() => 0),
  })),
}));

vi.mock("../../../src/hooks/useTaskRowData", () => ({
  useTaskRowData: vi.fn(() => ({
    taskRowData: [],
    visibleTaskIds: [],
    flattenedTaskCount: 0,
  })),
}));

// Mock child components to isolate container logic
vi.mock("../../../src/components/TaskList/TaskTableRow", () => ({
  TaskTableRow: vi.fn(({ task }: { task: Task }) => (
    <div data-testid={`task-row-${task.id}`}>{task.name}</div>
  )),
}));

vi.mock("../../../src/components/TaskList/NewTaskPlaceholderRow", () => ({
  NewTaskPlaceholderRow: vi.fn(() => (
    <div data-testid="placeholder-row">+ New Task</div>
  )),
}));

vi.mock("../../../src/components/ContextMenu/ContextMenu", () => ({
  ContextMenu: vi.fn(() => <div data-testid="context-menu" />),
}));

vi.mock("../../../src/components/TaskList/dragSelectionState", () => ({
  resetDragState: vi.fn(),
}));

// @dnd-kit pass-through mocks
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dnd-context">{children}</div>
  ),
  closestCenter: vi.fn(),
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
}));

// Re-import for per-test overrides
import { useChartStore } from "../../../src/store/slices/chartSlice";
import { useTaskRowData } from "../../../src/hooks/useTaskRowData";
import { useHideOperations } from "../../../src/hooks/useHideOperations";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTask(id: string, name: string): Task {
  return {
    id,
    name,
    startDate: "2025-01-10",
    endDate: "2025-01-17",
    duration: 7,
    progress: 0,
    color: "#4A90D9",
    order: 0,
    type: "task",
    parent: undefined,
    open: true,
    metadata: {},
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TaskTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Restore default mocks (per-test overrides via mockImplementation persist)
    vi.mocked(useChartStore).mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) =>
        selector({
          hiddenColumns: [],
          hiddenTaskIds: [],
        }) as never
    );

    vi.mocked(useTaskRowData).mockReturnValue({
      taskRowData: [],
      visibleTaskIds: [],
      flattenedTaskCount: 0,
    });

    vi.mocked(useHideOperations).mockReturnValue({
      hideRows: vi.fn(),
      showAll: vi.fn(),
      unhideRange: vi.fn(),
      unhideSelection: vi.fn(),
      getHiddenInSelectionCount: vi.fn(() => 0),
    });
  });

  it("should render the grid container with correct role", () => {
    render(<TaskTable />);
    expect(
      screen.getByRole("grid", { name: "Task spreadsheet" })
    ).toBeInTheDocument();
  });

  it("should render the placeholder row", () => {
    render(<TaskTable />);
    expect(screen.getByTestId("placeholder-row")).toBeInTheDocument();
  });

  it("should render task rows from useTaskRowData", () => {
    const task1 = createTask("t1", "Design");
    const task2 = createTask("t2", "Build");

    vi.mocked(useTaskRowData).mockReturnValue({
      taskRowData: [
        {
          task: task1,
          level: 0,
          hasChildren: false,
          globalRowNumber: 1,
          hasHiddenBelow: false,
          hiddenBelowCount: 0,
          onUnhideBelow: undefined,
          clipboardPosition: undefined,
          selectionPosition: undefined,
        },
        {
          task: task2,
          level: 0,
          hasChildren: false,
          globalRowNumber: 2,
          hasHiddenBelow: false,
          hiddenBelowCount: 0,
          onUnhideBelow: undefined,
          clipboardPosition: undefined,
          selectionPosition: undefined,
        },
      ],
      visibleTaskIds: ["t1", "t2"],
      flattenedTaskCount: 2,
    });

    render(<TaskTable />);
    expect(screen.getByTestId("task-row-t1")).toBeInTheDocument();
    expect(screen.getByTestId("task-row-t2")).toBeInTheDocument();
  });

  describe("all-hidden message", () => {
    it("should show 'show all' message when all tasks are hidden", () => {
      vi.mocked(useChartStore).mockImplementation(
        (selector: (s: Record<string, unknown>) => unknown) =>
          selector({
            hiddenColumns: [],
            hiddenTaskIds: ["t1", "t2", "t3"],
          }) as never
      );

      vi.mocked(useTaskRowData).mockReturnValue({
        taskRowData: [],
        visibleTaskIds: [],
        flattenedTaskCount: 0,
      });

      render(<TaskTable />);
      expect(screen.getByText("3 rows hidden —")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "show all" })
      ).toBeInTheDocument();
    });

    it("should use singular 'row' for one hidden task", () => {
      vi.mocked(useChartStore).mockImplementation(
        (selector: (s: Record<string, unknown>) => unknown) =>
          selector({
            hiddenColumns: [],
            hiddenTaskIds: ["t1"],
          }) as never
      );

      vi.mocked(useTaskRowData).mockReturnValue({
        taskRowData: [],
        visibleTaskIds: [],
        flattenedTaskCount: 0,
      });

      render(<TaskTable />);
      expect(screen.getByText("1 row hidden —")).toBeInTheDocument();
    });

    it("should call showAll when 'show all' button is clicked", () => {
      const mockShowAll = vi.fn();
      vi.mocked(useHideOperations).mockReturnValue({
        hideRows: vi.fn(),
        showAll: mockShowAll,
        unhideRange: vi.fn(),
        unhideSelection: vi.fn(),
        getHiddenInSelectionCount: vi.fn(() => 0),
      });

      vi.mocked(useChartStore).mockImplementation(
        (selector: (s: Record<string, unknown>) => unknown) =>
          selector({
            hiddenColumns: [],
            hiddenTaskIds: ["t1"],
          }) as never
      );

      vi.mocked(useTaskRowData).mockReturnValue({
        taskRowData: [],
        visibleTaskIds: [],
        flattenedTaskCount: 0,
      });

      render(<TaskTable />);
      fireEvent.click(screen.getByRole("button", { name: "show all" }));
      expect(mockShowAll).toHaveBeenCalledOnce();
    });

    it("should NOT show all-hidden message when tasks exist but none are hidden", () => {
      render(<TaskTable />);
      expect(screen.queryByText(/hidden/)).not.toBeInTheDocument();
    });
  });

  it("should register a global mouseup listener for drag cleanup", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const { unmount } = render(<TaskTable />);

    expect(addSpy).toHaveBeenCalledWith("mouseup", expect.any(Function));

    const removeSpy = vi.spyOn(window, "removeEventListener");
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("mouseup", expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
