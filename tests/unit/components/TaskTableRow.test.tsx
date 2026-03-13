/**
 * Tests for TaskTableRow component.
 * Verifies rendering, selection, drag-select, and context menu behavior.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskTableRow } from "@/components/TaskList/TaskTableRow";
import type { Task } from "@/types/chart.types";
import type { TaskId } from "@/types/branded.types";
import {
  dragState,
  resetDragState,
} from "@/components/TaskList/dragSelectionState";
import { TABLE_ROW } from "@/styles/design-tokens";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockToggleTaskSelection = vi.fn();
const mockSetSelectedTaskIds = vi.fn();
const mockSetActiveCell = vi.fn();
const mockInsertTaskAbove = vi.fn();
const mockInsertTaskBelow = vi.fn();
const mockLastSelectedTaskId: TaskId | null = null;

vi.mock("../../../src/store/slices/taskSlice", () => {
  const useTaskStore = vi.fn(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        tasks: null,
        toggleTaskSelection: mockToggleTaskSelection,
        setSelectedTaskIds: mockSetSelectedTaskIds,
        setActiveCell: mockSetActiveCell,
        insertTaskAbove: mockInsertTaskAbove,
        insertTaskBelow: mockInsertTaskBelow,
        lastSelectedTaskId: mockLastSelectedTaskId,
      })
  );
  // Expose getState() for shift+click
  (useTaskStore as unknown as Record<string, unknown>).getState = () => ({
    lastSelectedTaskId: mockLastSelectedTaskId,
  });
  return { useTaskStore };
});

vi.mock("../../../src/hooks/useComputedTaskColor", () => ({
  useComputedTaskColor: () => "#4A90D9",
}));

vi.mock("../../../src/utils/taskDisplayUtils", () => ({
  computeDisplayTask: (task: Task) => task,
}));

// Mock dnd-kit
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => null } },
}));

// Mock child components to keep tests focused
vi.mock("../../../src/components/TaskList/RowNumberCell", () => ({
  RowNumberCell: (props: Record<string, unknown>) => (
    <div data-testid="row-number-cell" data-row={props.rowNumber} />
  ),
}));

vi.mock("../../../src/components/TaskList/TaskDataCells", () => ({
  TaskDataCells: () => <div data-testid="task-data-cells" />,
}));

vi.mock("../../../src/components/TaskList/RowOverlays", () => ({
  RowOverlays: () => <div data-testid="row-overlays" />,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1" as TaskId,
    name: "Test Task",
    startDate: "2025-01-10",
    endDate: "2025-01-17",
    duration: 7,
    progress: 50,
    color: "#4A90D9",
    order: 0,
    type: "task",
    metadata: {},
    ...overrides,
  } as Task;
}

const defaultProps = {
  task: makeTask(),
  globalRowNumber: 1,
  visibleTaskIds: ["task-1" as TaskId, "task-2" as TaskId, "task-3" as TaskId],
  visibleColumns: [],
  gridTemplateColumns: "40px 200px",
  onContextMenu: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TaskTableRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDragState();
  });

  it('should render with role="row"', () => {
    render(<TaskTableRow {...defaultProps} />);
    expect(screen.getByRole("row")).toBeInTheDocument();
  });

  it("should render child components", () => {
    render(<TaskTableRow {...defaultProps} />);
    expect(screen.getByTestId("row-number-cell")).toBeInTheDocument();
    expect(screen.getByTestId("task-data-cells")).toBeInTheDocument();
    expect(screen.getByTestId("row-overlays")).toBeInTheDocument();
  });

  it("should use default background color when not selected", () => {
    render(<TaskTableRow {...defaultProps} />);
    const row = screen.getByRole("row");
    // Background is set via inline style from TABLE_ROW.defaultBg (#ffffff).
    // jsdom normalizes hex colors to rgb(), so we compare the normalized form.
    expect(row.style.backgroundColor).toBe("rgb(255, 255, 255)");
  });

  it("should use selection background color when selected", () => {
    render(
      <TaskTableRow
        {...defaultProps}
        selectionPosition={{ isFirstSelected: true, isLastSelected: true }}
      />
    );
    const row = screen.getByRole("row");
    // TABLE_ROW.selectionBg is already in rgba() form — jsdom keeps it as-is.
    expect(row.style.backgroundColor).toBe(TABLE_ROW.selectionBg);
  });

  it("should fire onContextMenu with task.id", () => {
    const onContextMenu = vi.fn();
    render(<TaskTableRow {...defaultProps} onContextMenu={onContextMenu} />);
    const row = screen.getByRole("row");

    fireEvent.contextMenu(row);

    expect(onContextMenu).toHaveBeenCalledWith(
      expect.any(Object),
      "task-1"
    );
  });

  it("should call dragState.onDragSelect on mouseEnter during drag", () => {
    const onDragSelect = vi.fn();
    dragState.isDragging = true;
    dragState.onDragSelect = onDragSelect;

    render(<TaskTableRow {...defaultProps} />);
    const row = screen.getByRole("row");

    fireEvent.mouseEnter(row);

    expect(onDragSelect).toHaveBeenCalledWith("task-1");
  });

  it("should not call onDragSelect on mouseEnter when not dragging", () => {
    const onDragSelect = vi.fn();
    dragState.isDragging = false;
    dragState.onDragSelect = onDragSelect;

    render(<TaskTableRow {...defaultProps} />);
    const row = screen.getByRole("row");

    fireEvent.mouseEnter(row);

    expect(onDragSelect).not.toHaveBeenCalled();
  });
});
