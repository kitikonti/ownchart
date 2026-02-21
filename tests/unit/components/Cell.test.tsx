/**
 * Unit tests for Cell component and useCellEdit hook.
 * Covers: keyboard navigation, edit/save flow, date validation,
 * working days display, and accessibility.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { Cell } from "../../../src/components/TaskList/Cell";
import { useCellEdit } from "../../../src/hooks/useCellEdit";
import type { Task } from "../../../src/types/chart.types";
import type { ColumnDefinition } from "../../../src/config/tableColumns";
import type { EditableField } from "../../../src/store/slices/taskSlice";
import { createRef } from "react";

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: "task-1",
  name: "Test Task",
  startDate: "2025-03-01",
  endDate: "2025-03-07",
  duration: 7,
  progress: 50,
  type: "task",
  color: "#3b82f6",
  parentId: null,
  collapsed: false,
  ...overrides,
});

const makeColumn = (overrides: Partial<ColumnDefinition> = {}): ColumnDefinition =>
  ({
    id: "name",
    label: "Name",
    field: "name" as EditableField,
    width: 200,
    minWidth: 100,
    editable: true,
    renderer: "text",
    ...overrides,
  }) as ColumnDefinition;

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

let mockActiveCell = { taskId: null as string | null, field: null as EditableField | null };
let mockIsEditing = false;
const mockSetActiveCell = vi.fn();
const mockStartCellEdit = vi.fn();
const mockStopCellEdit = vi.fn();
const mockNavigateCell = vi.fn();
const mockUpdateTask = vi.fn();
const mockClearSelection = vi.fn();

vi.mock("../../../src/hooks/useCellNavigation", () => ({
  useCellNavigation: vi.fn(() => ({
    activeCell: mockActiveCell,
    isEditingCell: mockIsEditing,
    setActiveCell: mockSetActiveCell,
    startCellEdit: mockStartCellEdit,
    stopCellEdit: mockStopCellEdit,
    navigateCell: mockNavigateCell,
    isCellActive: (taskId: string, field: string): boolean =>
      mockActiveCell.taskId === taskId && mockActiveCell.field === field,
    isCellEditing: (taskId: string, field: string): boolean =>
      mockActiveCell.taskId === taskId &&
      mockActiveCell.field === field &&
      mockIsEditing,
  })),
}));

vi.mock("../../../src/store/slices/taskSlice", () => ({
  useTaskStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      updateTask: mockUpdateTask,
      clearSelection: mockClearSelection,
      cutCell: null,
    })
  ),
}));

vi.mock("../../../src/store/slices/chartSlice", () => ({
  useChartStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      workingDaysMode: false,
      workingDaysConfig: {
        excludeSaturday: true,
        excludeSunday: true,
        excludeHolidays: false,
      },
      holidayRegion: "",
    })
  ),
}));

vi.mock("../../../src/store/slices/userPreferencesSlice", () => ({
  useUserPreferencesStore: vi.fn(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        preferences: { dateFormat: "YYYY-MM-DD" },
      })
  ),
}));

// ---------------------------------------------------------------------------
// Tests — Cell component
// ---------------------------------------------------------------------------

describe("Cell", () => {
  const task = makeTask();
  const column = makeColumn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveCell = { taskId: null, field: null };
    mockIsEditing = false;
  });

  describe("view mode rendering", () => {
    it("renders with role=gridcell", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      expect(screen.getByRole("gridcell")).toBeInTheDocument();
    });

    it("displays the task field value", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      expect(screen.getByText("Test Task")).toBeInTheDocument();
    });

    it("renders custom children instead of display value", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column}>
          <span data-testid="custom">Custom</span>
        </Cell>
      );
      expect(screen.getByTestId("custom")).toBeInTheDocument();
      expect(screen.queryByText("Test Task")).not.toBeInTheDocument();
    });

    it("applies non-editable styling when column is read-only", () => {
      const readOnlyColumn = makeColumn({ editable: false });
      render(
        <Cell
          taskId="task-1"
          task={task}
          field="name"
          column={readOnlyColumn}
        />
      );
      const cell = screen.getByRole("gridcell");
      expect(cell.className).toContain("bg-neutral-50");
    });
  });

  describe("click behavior", () => {
    it("activates cell on click", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      fireEvent.click(screen.getByRole("gridcell"));

      expect(mockClearSelection).toHaveBeenCalled();
      expect(mockSetActiveCell).toHaveBeenCalledWith("task-1", "name");
    });

    it("starts editing on click when already active", () => {
      mockActiveCell = { taskId: "task-1", field: "name" };

      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      fireEvent.click(screen.getByRole("gridcell"));

      expect(mockStartCellEdit).toHaveBeenCalled();
    });

    it("only activates non-editable cell on click (does not edit)", () => {
      mockActiveCell = { taskId: "task-1", field: "name" };
      const readOnlyColumn = makeColumn({ editable: false });

      render(
        <Cell
          taskId="task-1"
          task={task}
          field="name"
          column={readOnlyColumn}
        />
      );
      fireEvent.click(screen.getByRole("gridcell"));

      expect(mockStartCellEdit).not.toHaveBeenCalled();
    });
  });

  describe("keyboard navigation (view mode)", () => {
    beforeEach(() => {
      mockActiveCell = { taskId: "task-1", field: "name" };
    });

    it("navigates up on ArrowUp", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      fireEvent.keyDown(screen.getByRole("gridcell"), { key: "ArrowUp" });
      expect(mockNavigateCell).toHaveBeenCalledWith("up");
    });

    it("navigates down on ArrowDown", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      fireEvent.keyDown(screen.getByRole("gridcell"), { key: "ArrowDown" });
      expect(mockNavigateCell).toHaveBeenCalledWith("down");
    });

    it("navigates left on ArrowLeft", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      fireEvent.keyDown(screen.getByRole("gridcell"), { key: "ArrowLeft" });
      expect(mockNavigateCell).toHaveBeenCalledWith("left");
    });

    it("navigates right on ArrowRight", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      fireEvent.keyDown(screen.getByRole("gridcell"), { key: "ArrowRight" });
      expect(mockNavigateCell).toHaveBeenCalledWith("right");
    });

    it("navigates right on Tab, left on Shift+Tab", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      const cell = screen.getByRole("gridcell");

      fireEvent.keyDown(cell, { key: "Tab" });
      expect(mockNavigateCell).toHaveBeenCalledWith("right");

      fireEvent.keyDown(cell, { key: "Tab", shiftKey: true });
      expect(mockNavigateCell).toHaveBeenCalledWith("left");
    });

    it("starts editing on Enter for editable cell", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      fireEvent.keyDown(screen.getByRole("gridcell"), { key: "Enter" });
      expect(mockStartCellEdit).toHaveBeenCalled();
    });

    it("navigates down on Enter for non-editable cell", () => {
      const readOnlyColumn = makeColumn({ editable: false });
      render(
        <Cell
          taskId="task-1"
          task={task}
          field="name"
          column={readOnlyColumn}
        />
      );
      fireEvent.keyDown(screen.getByRole("gridcell"), { key: "Enter" });
      expect(mockNavigateCell).toHaveBeenCalledWith("down");
    });

    it("starts editing on F2", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      fireEvent.keyDown(screen.getByRole("gridcell"), { key: "F2" });
      expect(mockStartCellEdit).toHaveBeenCalled();
    });

    it("deactivates on Escape", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      fireEvent.keyDown(screen.getByRole("gridcell"), { key: "Escape" });
      expect(mockSetActiveCell).toHaveBeenCalledWith(null, null);
    });

    it("starts editing with typed character (overwrite mode)", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      fireEvent.keyDown(screen.getByRole("gridcell"), { key: "a" });
      expect(mockStartCellEdit).toHaveBeenCalled();
    });

    it("does not start editing on Ctrl+key", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      fireEvent.keyDown(screen.getByRole("gridcell"), {
        key: "a",
        ctrlKey: true,
      });
      expect(mockStartCellEdit).not.toHaveBeenCalled();
    });
  });

  describe("edit mode rendering", () => {
    beforeEach(() => {
      mockActiveCell = { taskId: "task-1", field: "name" };
      mockIsEditing = true;
    });

    it("renders with role=gridcell in edit mode (F008)", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      expect(screen.getByRole("gridcell")).toBeInTheDocument();
    });

    it("renders an input in edit mode", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("renders date input for date columns", () => {
      mockActiveCell = { taskId: "task-1", field: "startDate" as EditableField };
      const dateColumn = makeColumn({
        id: "startDate",
        field: "startDate" as EditableField,
        renderer: "date",
      });
      render(
        <Cell
          taskId="task-1"
          task={task}
          field="startDate"
          column={dateColumn}
        />
      );
      // Date inputs don't have role=textbox, find by display value
      const input = screen.getByDisplayValue("2025-03-01");
      expect(input).toHaveAttribute("type", "date");
    });

    it("renders number input for number columns", () => {
      mockActiveCell = { taskId: "task-1", field: "duration" as EditableField };
      const numberColumn = makeColumn({
        id: "duration",
        field: "duration" as EditableField,
        renderer: "number",
      });
      render(
        <Cell
          taskId="task-1"
          task={task}
          field="duration"
          column={numberColumn}
        />
      );
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("type", "number");
    });

    it("renders custom children in edit mode", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column}>
          <span data-testid="editor">Editor</span>
        </Cell>
      );
      expect(screen.getByTestId("editor")).toBeInTheDocument();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
  });

  describe("cut cell styling", () => {
    it("applies cut styling when cell is cut", async () => {
      // Override cutCell mock
      const { useTaskStore } = await import(
        "../../../src/store/slices/taskSlice"
      );
      vi.mocked(useTaskStore).mockImplementation(
        (selector: (s: Record<string, unknown>) => unknown) =>
          selector({
            updateTask: mockUpdateTask,
            clearSelection: mockClearSelection,
            cutCell: { taskId: "task-1", field: "name" },
          }) as ReturnType<typeof selector>
      );

      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      const cell = screen.getByRole("gridcell");
      expect(cell.className).toContain("opacity-50");
      expect(cell.className).toContain("outline-dashed");
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — useCellEdit hook
// ---------------------------------------------------------------------------

describe("useCellEdit", () => {
  const task = makeTask();
  const column = makeColumn();
  const mockStop = vi.fn();
  const mockNav = vi.fn();

  const defaultParams = {
    taskId: "task-1",
    task,
    field: "name" as EditableField,
    column,
    isActive: false,
    isEditing: false,
    cellRef: createRef<HTMLDivElement>(),
    stopCellEdit: mockStop,
    navigateCell: mockNav,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns display value from task field", () => {
    const { result } = renderHook(() => useCellEdit(defaultParams));
    expect(result.current.displayValue).toBe("Test Task");
  });

  it("returns formatted duration display value", () => {
    const durationColumn = makeColumn({
      id: "duration",
      field: "duration" as EditableField,
      renderer: "number",
      formatter: (v: unknown) => `${v} days`,
    });

    const { result } = renderHook(() =>
      useCellEdit({
        ...defaultParams,
        field: "duration",
        column: durationColumn,
      })
    );
    expect(result.current.displayValue).toBe("7 days");
  });

  it("initializes localValue when entering edit mode", () => {
    const { result, rerender } = renderHook(
      (props) => useCellEdit(props),
      { initialProps: { ...defaultParams, isEditing: false } }
    );

    expect(result.current.localValue).toBe("");

    rerender({ ...defaultParams, isEditing: true });
    expect(result.current.localValue).toBe("Test Task");
  });

  it("updates localValue on setLocalValue", () => {
    const { result } = renderHook(() =>
      useCellEdit({ ...defaultParams, isEditing: true })
    );

    act(() => {
      result.current.setLocalValue("Updated");
    });

    expect(result.current.localValue).toBe("Updated");
  });

  it("cancelEdit restores original value and calls stopCellEdit", () => {
    const { result } = renderHook(() =>
      useCellEdit({ ...defaultParams, isEditing: true })
    );

    act(() => {
      result.current.setLocalValue("Changed");
    });

    act(() => {
      result.current.cancelEdit();
    });

    expect(result.current.localValue).toBe("Test Task");
    expect(result.current.error).toBeNull();
    expect(mockStop).toHaveBeenCalled();
  });

  it("saveValue calls updateTask for simple fields", () => {
    const { result } = renderHook(() =>
      useCellEdit({ ...defaultParams, isEditing: true })
    );

    act(() => {
      result.current.setLocalValue("New Name");
    });
    act(() => {
      result.current.saveValue();
    });

    expect(mockUpdateTask).toHaveBeenCalledWith("task-1", {
      name: "New Name",
    });
  });

  it("saveValue converts duration to number", () => {
    const durationColumn = makeColumn({
      id: "duration",
      field: "duration" as EditableField,
      renderer: "number",
    });

    const { result } = renderHook(() =>
      useCellEdit({
        ...defaultParams,
        field: "duration",
        column: durationColumn,
        isEditing: true,
      })
    );

    act(() => {
      result.current.setLocalValue("10");
    });
    act(() => {
      result.current.saveValue();
    });

    expect(mockUpdateTask).toHaveBeenCalledWith(
      "task-1",
      expect.objectContaining({ duration: expect.any(Number) })
    );
  });

  it("saveValue sets error for invalid date validator result", () => {
    const dateColumn = makeColumn({
      id: "startDate",
      field: "startDate" as EditableField,
      renderer: "date",
      validator: (v: string) =>
        /^\d{4}-\d{2}-\d{2}$/.test(v)
          ? { valid: true }
          : { valid: false, error: "Invalid date format" },
    });

    const { result } = renderHook(() =>
      useCellEdit({
        ...defaultParams,
        field: "startDate",
        column: dateColumn,
        isEditing: true,
      })
    );

    act(() => {
      result.current.setLocalValue("not-a-date");
    });
    act(() => {
      result.current.saveValue();
    });

    expect(result.current.error).toBe("Invalid date format");
    expect(mockUpdateTask).not.toHaveBeenCalled();
  });

  it("saveValue rejects end date before start date", () => {
    const dateColumn = makeColumn({
      id: "endDate",
      field: "endDate" as EditableField,
      renderer: "date",
      validator: () => ({ valid: true }),
    });

    const { result } = renderHook(() =>
      useCellEdit({
        ...defaultParams,
        field: "endDate",
        column: dateColumn,
        task: makeTask({ startDate: "2025-03-10", endDate: "2025-03-15" }),
        isEditing: true,
      })
    );

    act(() => {
      result.current.setLocalValue("2025-03-05"); // before start
    });
    act(() => {
      result.current.saveValue();
    });

    expect(result.current.error).toBe("End date must be after start date");
    expect(mockUpdateTask).not.toHaveBeenCalled();
  });

  it("saveValue calculates duration when date changes", () => {
    const dateColumn = makeColumn({
      id: "startDate",
      field: "startDate" as EditableField,
      renderer: "date",
      validator: () => ({ valid: true }),
    });

    const { result } = renderHook(() =>
      useCellEdit({
        ...defaultParams,
        field: "startDate",
        column: dateColumn,
        task: makeTask({ startDate: "2025-03-01", endDate: "2025-03-10" }),
        isEditing: true,
      })
    );

    act(() => {
      result.current.setLocalValue("2025-03-05");
    });
    act(() => {
      result.current.saveValue();
    });

    // 2025-03-05 to 2025-03-10 = 6 days (inclusive)
    expect(mockUpdateTask).toHaveBeenCalledWith("task-1", {
      startDate: "2025-03-05",
      duration: 6,
    });
  });
});
