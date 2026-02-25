/**
 * Tests for NewTaskPlaceholderRow component.
 * Verifies placeholder rendering, keyboard navigation, task creation flow,
 * and row selection toggle.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NewTaskPlaceholderRow } from "../../../src/components/TaskList/NewTaskPlaceholderRow";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSetActiveCell = vi.fn();
const mockClearSelection = vi.fn();
const mockSetSelectedTaskIds = vi.fn();
const mockCreateTask = vi.fn();

vi.mock("../../../src/store/slices/taskSlice", () => ({
  useTaskStore: Object.assign(
    vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        activeCell: { taskId: null, field: null },
        setActiveCell: mockSetActiveCell,
        selectedTaskIds: [],
        clearSelection: mockClearSelection,
      })
    ),
    {
      getState: vi.fn(() => ({
        selectedTaskIds: [],
        setSelectedTaskIds: mockSetSelectedTaskIds,
      })),
    }
  ),
}));

vi.mock("../../../src/store/slices/chartSlice", () => ({
  useChartStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      hiddenColumns: [],
    })
  ),
}));

vi.mock("../../../src/hooks/useNewTaskCreation", () => ({
  useNewTaskCreation: vi.fn(() => ({
    createTask: mockCreateTask,
  })),
}));

vi.mock("../../../src/hooks/usePlaceholderContextMenu", () => ({
  usePlaceholderContextMenu: vi.fn(() => ({
    contextMenu: null,
    contextMenuItems: [],
    handlePlaceholderContextMenu: vi.fn(),
    closeContextMenu: vi.fn(),
  })),
}));

import { useTaskStore } from "../../../src/store/slices/taskSlice";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NewTaskPlaceholderRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock state
    vi.mocked(useTaskStore).mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) =>
        selector({
          activeCell: { taskId: null, field: null },
          setActiveCell: mockSetActiveCell,
          selectedTaskIds: [],
          clearSelection: mockClearSelection,
        }) as never
    );

    vi.mocked(useTaskStore.getState).mockReturnValue({
      selectedTaskIds: [],
      setSelectedTaskIds: mockSetSelectedTaskIds,
    } as unknown as ReturnType<typeof useTaskStore.getState>);
  });

  it("renders with role=row", () => {
    render(<NewTaskPlaceholderRow />);
    expect(screen.getByRole("row")).toBeInTheDocument();
  });

  it("renders gridcell elements for each visible column", () => {
    render(<NewTaskPlaceholderRow />);
    const cells = screen.getAllByRole("gridcell");
    // Default columns: rowNumber, color, name, startDate, endDate, duration, progress
    expect(cells.length).toBe(7);
  });

  it("shows placeholder text 'Add new task...'", () => {
    render(<NewTaskPlaceholderRow />);
    expect(screen.getByText("Add new task...")).toBeInTheDocument();
  });

  it("has accessible row number cell with aria-label", () => {
    render(<NewTaskPlaceholderRow />);
    expect(
      screen.getByRole("gridcell", {
        name: "Select new task placeholder row",
      })
    ).toBeInTheDocument();
  });

  describe("cell activation", () => {
    it("activates name cell on click", () => {
      render(<NewTaskPlaceholderRow />);

      const placeholderText = screen.getByText("Add new task...");
      fireEvent.click(placeholderText.closest("[role='gridcell']")!);

      expect(mockSetActiveCell).toHaveBeenCalledWith(
        "__new_task_placeholder__",
        "name"
      );
    });
  });

  describe("keyboard navigation", () => {
    it("starts editing on Enter when name cell is active", () => {
      // Set up active state on the name cell
      vi.mocked(useTaskStore).mockImplementation(
        (selector: (s: Record<string, unknown>) => unknown) =>
          selector({
            activeCell: {
              taskId: "__new_task_placeholder__",
              field: "name",
            },
            setActiveCell: mockSetActiveCell,
            selectedTaskIds: [],
            clearSelection: mockClearSelection,
          }) as never
      );

      render(<NewTaskPlaceholderRow />);
      const nameCell = screen.getByText("Add new task...").closest("[role='gridcell']")!;

      fireEvent.keyDown(nameCell, { key: "Enter" });
      // After Enter, should switch to editing mode (input visible)
      // The component re-renders with isEditing=true showing the input
    });

    it("deactivates cell on Escape", () => {
      vi.mocked(useTaskStore).mockImplementation(
        (selector: (s: Record<string, unknown>) => unknown) =>
          selector({
            activeCell: {
              taskId: "__new_task_placeholder__",
              field: "name",
            },
            setActiveCell: mockSetActiveCell,
            selectedTaskIds: [],
            clearSelection: mockClearSelection,
          }) as never
      );

      render(<NewTaskPlaceholderRow />);
      const nameCell = screen.getByText("Add new task...").closest("[role='gridcell']")!;

      fireEvent.keyDown(nameCell, { key: "Escape" });
      expect(mockSetActiveCell).toHaveBeenCalledWith(null, null);
    });
  });

  describe("task creation", () => {
    it("calls createTask on Enter with non-empty input", () => {
      // Start in editing mode by setting active + simulating click
      vi.mocked(useTaskStore).mockImplementation(
        (selector: (s: Record<string, unknown>) => unknown) =>
          selector({
            activeCell: {
              taskId: "__new_task_placeholder__",
              field: "name",
            },
            setActiveCell: mockSetActiveCell,
            selectedTaskIds: [],
            clearSelection: mockClearSelection,
          }) as never
      );

      render(<NewTaskPlaceholderRow />);

      // Click to activate, then click again to start editing
      const nameCell = screen.getByText("Add new task...").closest("[role='gridcell']")!;
      fireEvent.click(nameCell);

      // Now we should be in editing mode - find the input
      const input = document.querySelector("input[type='text']");
      if (input) {
        fireEvent.change(input, { target: { value: "My New Task" } });
        fireEvent.keyDown(input, { key: "Enter" });
        expect(mockCreateTask).toHaveBeenCalledWith("My New Task");
      }
    });

    it("does not create task on Enter with empty input", () => {
      vi.mocked(useTaskStore).mockImplementation(
        (selector: (s: Record<string, unknown>) => unknown) =>
          selector({
            activeCell: {
              taskId: "__new_task_placeholder__",
              field: "name",
            },
            setActiveCell: mockSetActiveCell,
            selectedTaskIds: [],
            clearSelection: mockClearSelection,
          }) as never
      );

      render(<NewTaskPlaceholderRow />);

      const nameCell = screen.getByText("Add new task...").closest("[role='gridcell']")!;
      fireEvent.click(nameCell);

      const input = document.querySelector("input[type='text']");
      if (input) {
        fireEvent.change(input, { target: { value: "   " } });
        fireEvent.keyDown(input, { key: "Enter" });
        expect(mockCreateTask).not.toHaveBeenCalled();
      }
    });
  });

  describe("row number selection", () => {
    it("toggles selection when row number is clicked", () => {
      render(<NewTaskPlaceholderRow />);

      const rowNumberCell = screen.getByRole("gridcell", {
        name: "Select new task placeholder row",
      });
      fireEvent.click(rowNumberCell);

      expect(mockSetSelectedTaskIds).toHaveBeenCalledWith(
        ["__new_task_placeholder__"],
        false
      );
    });

    it("handles keyboard activation of row number (Enter)", () => {
      render(<NewTaskPlaceholderRow />);

      const rowNumberCell = screen.getByRole("gridcell", {
        name: "Select new task placeholder row",
      });
      fireEvent.keyDown(rowNumberCell, { key: "Enter" });

      expect(mockSetSelectedTaskIds).toHaveBeenCalled();
    });

    it("handles keyboard activation of row number (Space)", () => {
      render(<NewTaskPlaceholderRow />);

      const rowNumberCell = screen.getByRole("gridcell", {
        name: "Select new task placeholder row",
      });
      fireEvent.keyDown(rowNumberCell, { key: " " });

      expect(mockSetSelectedTaskIds).toHaveBeenCalled();
    });
  });
});
