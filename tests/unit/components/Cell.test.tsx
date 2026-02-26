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

const mockTaskStoreState = (): Record<string, unknown> => ({
  activeCell: mockActiveCell,
  isEditingCell: mockIsEditing,
  setActiveCell: mockSetActiveCell,
  startCellEdit: mockStartCellEdit,
  stopCellEdit: mockStopCellEdit,
  navigateCell: mockNavigateCell,
  updateTask: mockUpdateTask,
  clearSelection: mockClearSelection,
  cutCell: null,
});

vi.mock("../../../src/store/slices/taskSlice", () => ({
  useTaskStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector(mockTaskStoreState())
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

    it("sets aria-selected=false when not active", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      expect(screen.getByRole("gridcell")).toHaveAttribute(
        "aria-selected",
        "false"
      );
    });

    it("sets aria-selected=true when active", () => {
      mockActiveCell = { taskId: "task-1", field: "name" };
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      expect(screen.getByRole("gridcell")).toHaveAttribute(
        "aria-selected",
        "true"
      );
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

  describe("readOnly prop", () => {
    beforeEach(() => {
      mockActiveCell = { taskId: "task-1", field: "name" };
    });

    it("does not start editing on click when readOnly", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} readOnly />
      );
      fireEvent.click(screen.getByRole("gridcell"));

      expect(mockStartCellEdit).not.toHaveBeenCalled();
      // Should still activate the cell for navigation
      expect(mockSetActiveCell).toHaveBeenCalledWith("task-1", "name");
    });

    it("navigates down on Enter instead of editing when readOnly", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} readOnly />
      );
      fireEvent.keyDown(screen.getByRole("gridcell"), { key: "Enter" });

      expect(mockStartCellEdit).not.toHaveBeenCalled();
      expect(mockNavigateCell).toHaveBeenCalledWith("down");
    });

    it("does not start editing on F2 when readOnly", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} readOnly />
      );
      fireEvent.keyDown(screen.getByRole("gridcell"), { key: "F2" });

      expect(mockStartCellEdit).not.toHaveBeenCalled();
    });

    it("does not start editing on printable key when readOnly", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} readOnly />
      );
      fireEvent.keyDown(screen.getByRole("gridcell"), { key: "a" });

      expect(mockStartCellEdit).not.toHaveBeenCalled();
    });

    it("still allows arrow key navigation when readOnly", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} readOnly />
      );
      fireEvent.keyDown(screen.getByRole("gridcell"), { key: "ArrowRight" });

      expect(mockNavigateCell).toHaveBeenCalledWith("right");
    });

    it("still allows Tab navigation when readOnly", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} readOnly />
      );
      fireEvent.keyDown(screen.getByRole("gridcell"), { key: "Tab" });

      expect(mockNavigateCell).toHaveBeenCalledWith("right");
    });
  });

  describe("edit mode rendering", () => {
    beforeEach(() => {
      mockActiveCell = { taskId: "task-1", field: "name" };
      mockIsEditing = true;
    });

    it("sets aria-selected=true in edit mode", () => {
      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      expect(screen.getByRole("gridcell")).toHaveAttribute(
        "aria-selected",
        "true"
      );
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
            ...mockTaskStoreState(),
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

  describe("accessibility", () => {
    it("renders input with aria-label in edit mode", () => {
      mockActiveCell = { taskId: "task-1", field: "name" };
      mockIsEditing = true;

      render(
        <Cell taskId="task-1" task={task} field="name" column={column} />
      );
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-label", "Edit Name");
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

  it("saveValue calls updateTask for simple fields and returns true", () => {
    const { result } = renderHook(() =>
      useCellEdit({ ...defaultParams, isEditing: true })
    );

    act(() => {
      result.current.setLocalValue("New Name");
    });

    let saved: boolean | undefined;
    act(() => {
      saved = result.current.saveValue();
    });

    expect(saved).toBe(true);
    expect(mockUpdateTask).toHaveBeenCalledWith("task-1", {
      name: "New Name",
    });
    expect(mockStop).toHaveBeenCalled();
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

  it("saveValue returns false and sets error for invalid date validator result", () => {
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

    let saved: boolean | undefined;
    act(() => {
      saved = result.current.saveValue();
    });

    expect(saved).toBe(false);
    expect(result.current.error).toBe("Invalid date format");
    expect(mockUpdateTask).not.toHaveBeenCalled();
  });

  it("saveValue returns false and rejects end date before start date", () => {
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

    let saved: boolean | undefined;
    act(() => {
      saved = result.current.saveValue();
    });

    expect(saved).toBe(false);
    expect(result.current.error).toBe("End date must be after start date");
    expect(mockUpdateTask).not.toHaveBeenCalled();
  });

  it("saveValue clears error after successful save", () => {
    const nameColumn = makeColumn({
      validator: (v: unknown) =>
        typeof v === "string" && v.length > 0
          ? { valid: true }
          : { valid: false, error: "Required" },
    });

    const { result } = renderHook(() =>
      useCellEdit({
        ...defaultParams,
        column: nameColumn,
        isEditing: true,
      })
    );

    // Trigger a validation error first
    act(() => {
      result.current.setLocalValue("");
    });
    act(() => {
      result.current.saveValue();
    });
    expect(result.current.error).toBe("Required");

    // Now provide a valid value and save
    act(() => {
      result.current.setLocalValue("Valid Name");
    });
    act(() => {
      result.current.saveValue();
    });
    expect(result.current.error).toBeNull();
  });

  it("saveValue recalculates end date when duration changes", () => {
    const durationColumn = makeColumn({
      id: "duration",
      field: "duration" as EditableField,
      renderer: "number",
      validator: () => ({ valid: true }),
    });

    const { result } = renderHook(() =>
      useCellEdit({
        ...defaultParams,
        field: "duration",
        column: durationColumn,
        task: makeTask({ startDate: "2025-03-01", endDate: "2025-03-07", duration: 7 }),
        isEditing: true,
      })
    );

    act(() => {
      result.current.setLocalValue("3");
    });
    act(() => {
      result.current.saveValue();
    });

    // 2025-03-01 + 3 days = endDate 2025-03-03
    expect(mockUpdateTask).toHaveBeenCalledWith("task-1", {
      duration: 3,
      endDate: "2025-03-03",
    });
  });

  it("saveValue saves without validator, calls stopCellEdit, and returns true", () => {
    const noValidatorColumn = makeColumn({ validator: undefined });

    const { result } = renderHook(() =>
      useCellEdit({
        ...defaultParams,
        column: noValidatorColumn,
        isEditing: true,
      })
    );

    act(() => {
      result.current.setLocalValue("Any Value");
    });

    let saved: boolean | undefined;
    act(() => {
      saved = result.current.saveValue();
    });

    expect(saved).toBe(true);
    expect(mockUpdateTask).toHaveBeenCalledWith("task-1", { name: "Any Value" });
    expect(mockStop).toHaveBeenCalled();
  });

  describe("handleEditKeyDown", () => {
    it("saves and navigates down on Enter", () => {
      const { result } = renderHook(() =>
        useCellEdit({ ...defaultParams, isEditing: true })
      );

      act(() => {
        result.current.setLocalValue("New Value");
      });

      const event = {
        key: "Enter",
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      act(() => {
        result.current.handleEditKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockUpdateTask).toHaveBeenCalled();
      expect(mockNav).toHaveBeenCalledWith("down");
    });

    it("saves and navigates up on Shift+Enter", () => {
      const { result } = renderHook(() =>
        useCellEdit({ ...defaultParams, isEditing: true })
      );

      const event = {
        key: "Enter",
        shiftKey: true,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      act(() => {
        result.current.handleEditKeyDown(event);
      });

      expect(mockNav).toHaveBeenCalledWith("up");
    });

    it("saves and navigates right on Tab", () => {
      const { result } = renderHook(() =>
        useCellEdit({ ...defaultParams, isEditing: true })
      );

      const event = {
        key: "Tab",
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      act(() => {
        result.current.handleEditKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockUpdateTask).toHaveBeenCalled();
      expect(mockNav).toHaveBeenCalledWith("right");
    });

    it("saves and navigates left on Shift+Tab", () => {
      const { result } = renderHook(() =>
        useCellEdit({ ...defaultParams, isEditing: true })
      );

      const event = {
        key: "Tab",
        shiftKey: true,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      act(() => {
        result.current.handleEditKeyDown(event);
      });

      expect(mockNav).toHaveBeenCalledWith("left");
    });

    it("cancels edit on Escape without saving", () => {
      const { result } = renderHook(() =>
        useCellEdit({ ...defaultParams, isEditing: true })
      );

      act(() => {
        result.current.setLocalValue("Unsaved Change");
      });

      const event = {
        key: "Escape",
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      act(() => {
        result.current.handleEditKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockUpdateTask).not.toHaveBeenCalled();
      expect(mockStop).toHaveBeenCalled();
      expect(result.current.localValue).toBe("Test Task");
    });

    it("does not navigate on Enter when validation fails", () => {
      const strictColumn = makeColumn({
        validator: () => ({ valid: false, error: "Always fails" }),
      });

      const { result } = renderHook(() =>
        useCellEdit({
          ...defaultParams,
          column: strictColumn,
          isEditing: true,
        })
      );

      const event = {
        key: "Enter",
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      act(() => {
        result.current.handleEditKeyDown(event);
      });

      expect(mockUpdateTask).not.toHaveBeenCalled();
      expect(mockNav).not.toHaveBeenCalled();
      expect(result.current.error).toBe("Always fails");
    });

    it("does not navigate on Tab when validation fails", () => {
      const strictColumn = makeColumn({
        validator: () => ({ valid: false, error: "Always fails" }),
      });

      const { result } = renderHook(() =>
        useCellEdit({
          ...defaultParams,
          column: strictColumn,
          isEditing: true,
        })
      );

      const event = {
        key: "Tab",
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      act(() => {
        result.current.handleEditKeyDown(event);
      });

      expect(mockUpdateTask).not.toHaveBeenCalled();
      expect(mockNav).not.toHaveBeenCalled();
      expect(result.current.error).toBe("Always fails");
    });
  });

  describe("displayValue formatting", () => {
    it("formats date fields using date preference", () => {
      const dateColumn = makeColumn({
        id: "startDate",
        field: "startDate" as EditableField,
        renderer: "date",
      });

      const { result } = renderHook(() =>
        useCellEdit({
          ...defaultParams,
          field: "startDate",
          column: dateColumn,
          task: makeTask({ startDate: "2025-03-01" }),
        })
      );

      // With YYYY-MM-DD format, should return the ISO string
      expect(result.current.displayValue).toBe("2025-03-01");
    });

    it("uses column formatter when available", () => {
      const progressColumn = makeColumn({
        id: "progress",
        field: "progress" as EditableField,
        renderer: "number",
        formatter: (v: unknown) => `${v}%`,
      });

      const { result } = renderHook(() =>
        useCellEdit({
          ...defaultParams,
          field: "progress",
          column: progressColumn,
          task: makeTask({ progress: 75 }),
        })
      );

      expect(result.current.displayValue).toBe("75%");
    });

    it("falls back to String() when no formatter", () => {
      const plainColumn = makeColumn({ formatter: undefined });

      const { result } = renderHook(() =>
        useCellEdit({
          ...defaultParams,
          column: plainColumn,
          task: makeTask({ name: "Plain Task" }),
        })
      );

      expect(result.current.displayValue).toBe("Plain Task");
    });
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
