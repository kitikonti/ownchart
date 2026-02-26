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
import { usePlaceholderContextMenu } from "../../../src/hooks/usePlaceholderContextMenu";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Set up the mock so the placeholder name cell is active. */
function mockActivePlaceholderNameCell(): void {
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
}

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
      setActiveCell: mockSetActiveCell,
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
      mockActivePlaceholderNameCell();

      render(<NewTaskPlaceholderRow />);
      const nameCell = screen.getByText("Add new task...").closest("[role='gridcell']")!;

      fireEvent.keyDown(nameCell, { key: "Enter" });

      // After Enter, editing mode starts — input should be visible
      expect(screen.getByRole("textbox", { name: "New task name" })).toBeInTheDocument();
    });

    it("deactivates cell on Escape", () => {
      mockActivePlaceholderNameCell();

      render(<NewTaskPlaceholderRow />);
      const nameCell = screen.getByText("Add new task...").closest("[role='gridcell']")!;

      fireEvent.keyDown(nameCell, { key: "Escape" });
      expect(mockSetActiveCell).toHaveBeenCalledWith(null, null);
    });

    it("starts editing with typed character on printable key press", () => {
      mockActivePlaceholderNameCell();

      render(<NewTaskPlaceholderRow />);
      const nameCell = screen.getByText("Add new task...").closest("[role='gridcell']")!;

      fireEvent.keyDown(nameCell, { key: "a" });

      // Input should appear with the typed character
      const input = screen.getByRole("textbox", { name: "New task name" });
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("a");
    });
  });

  describe("task creation", () => {
    it("calls createTask on Enter with non-empty input", () => {
      mockActivePlaceholderNameCell();

      render(<NewTaskPlaceholderRow />);

      // Click to start editing (active → editing transition)
      const nameCell = screen.getByText("Add new task...").closest("[role='gridcell']")!;
      fireEvent.click(nameCell);

      // Input must exist after entering edit mode
      const input = screen.getByRole("textbox", { name: "New task name" });
      fireEvent.change(input, { target: { value: "My New Task" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockCreateTask).toHaveBeenCalledWith("My New Task");
    });

    it("does not create task on Enter with empty input", () => {
      mockActivePlaceholderNameCell();

      render(<NewTaskPlaceholderRow />);

      const nameCell = screen.getByText("Add new task...").closest("[role='gridcell']")!;
      fireEvent.click(nameCell);

      const input = screen.getByRole("textbox", { name: "New task name" });
      fireEvent.change(input, { target: { value: "   " } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockCreateTask).not.toHaveBeenCalled();
    });

    it("cancels editing on Escape and re-shows placeholder text", () => {
      mockActivePlaceholderNameCell();

      render(<NewTaskPlaceholderRow />);

      const nameCell = screen.getByText("Add new task...").closest("[role='gridcell']")!;
      fireEvent.click(nameCell);

      const input = screen.getByRole("textbox", { name: "New task name" });
      fireEvent.change(input, { target: { value: "Draft" } });
      fireEvent.keyDown(input, { key: "Escape" });

      // Should return to placeholder text
      expect(screen.getByText("Add new task...")).toBeInTheDocument();
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

  describe("blur behavior", () => {
    it("commits task on blur when input has text", () => {
      mockActivePlaceholderNameCell();

      render(<NewTaskPlaceholderRow />);
      const nameCell = screen.getByText("Add new task...").closest("[role='gridcell']")!;
      fireEvent.click(nameCell);

      const input = screen.getByRole("textbox", { name: "New task name" });
      fireEvent.change(input, { target: { value: "Blur Task" } });
      fireEvent.blur(input);

      expect(mockCreateTask).toHaveBeenCalledWith("Blur Task");
    });

    it("cancels edit on blur when input is empty", () => {
      mockActivePlaceholderNameCell();

      render(<NewTaskPlaceholderRow />);
      const nameCell = screen.getByText("Add new task...").closest("[role='gridcell']")!;
      fireEvent.click(nameCell);

      const input = screen.getByRole("textbox", { name: "New task name" });
      fireEvent.blur(input);

      expect(mockCreateTask).not.toHaveBeenCalled();
      expect(screen.getByText("Add new task...")).toBeInTheDocument();
    });

    it("trims whitespace before committing on blur", () => {
      mockActivePlaceholderNameCell();

      render(<NewTaskPlaceholderRow />);
      const nameCell = screen.getByText("Add new task...").closest("[role='gridcell']")!;
      fireEvent.click(nameCell);

      const input = screen.getByRole("textbox", { name: "New task name" });
      fireEvent.change(input, { target: { value: "  Trimmed  " } });
      fireEvent.blur(input);

      expect(mockCreateTask).toHaveBeenCalledWith("Trimmed");
    });
  });

  describe("F2 key editing", () => {
    it("starts editing on F2 when name cell is active", () => {
      mockActivePlaceholderNameCell();

      render(<NewTaskPlaceholderRow />);
      const nameCell = screen.getByText("Add new task...").closest("[role='gridcell']")!;

      fireEvent.keyDown(nameCell, { key: "F2" });

      expect(screen.getByRole("textbox", { name: "New task name" })).toBeInTheDocument();
    });
  });

  describe("generic data cell interaction", () => {
    it("activates a data cell on click", () => {
      render(<NewTaskPlaceholderRow />);

      // Find a generic data cell (not name, not row number) — e.g., startDate
      const cells = screen.getAllByRole("gridcell");
      // cells[0] = rowNumber, cells[1] = color, cells[2] = name, cells[3] = startDate
      const dataCell = cells[3];
      fireEvent.click(dataCell);

      expect(mockSetActiveCell).toHaveBeenCalledWith(
        "__new_task_placeholder__",
        expect.any(String)
      );
    });

    it("activates a data cell on Enter key", () => {
      render(<NewTaskPlaceholderRow />);

      const cells = screen.getAllByRole("gridcell");
      const dataCell = cells[3];
      fireEvent.keyDown(dataCell, { key: "Enter" });

      expect(mockSetActiveCell).toHaveBeenCalledWith(
        "__new_task_placeholder__",
        expect.any(String)
      );
    });

    it("activates a data cell on Space key", () => {
      render(<NewTaskPlaceholderRow />);

      const cells = screen.getAllByRole("gridcell");
      const dataCell = cells[3];
      fireEvent.keyDown(dataCell, { key: " " });

      expect(mockSetActiveCell).toHaveBeenCalledWith(
        "__new_task_placeholder__",
        expect.any(String)
      );
    });
  });

  describe("context menu", () => {
    it("renders ContextMenu when contextMenu position is set", () => {
      vi.mocked(usePlaceholderContextMenu).mockReturnValue({
        contextMenu: { x: 100, y: 200 },
        contextMenuItems: [
          { label: "Paste", action: vi.fn() },
        ],
        handlePlaceholderContextMenu: vi.fn(),
        closeContextMenu: vi.fn(),
      } as never);

      render(<NewTaskPlaceholderRow />);

      expect(screen.getByText("Paste")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has aria-label on the task name input", () => {
      mockActivePlaceholderNameCell();

      render(<NewTaskPlaceholderRow />);
      const nameCell = screen.getByText("Add new task...").closest("[role='gridcell']")!;
      fireEvent.click(nameCell);

      expect(
        screen.getByRole("textbox", { name: "New task name" })
      ).toBeInTheDocument();
    });

    it("only makes name cell and row number cell focusable", () => {
      render(<NewTaskPlaceholderRow />);

      const cells = screen.getAllByRole("gridcell");
      cells.forEach((cell) => {
        const tabIndex = cell.getAttribute("tabindex");
        const isRowNumber = cell.getAttribute("aria-label") === "Select new task placeholder row";
        const isNameCell = cell.textContent === "Add new task...";

        if (isRowNumber || isNameCell) {
          expect(tabIndex).toBe("0");
        } else {
          expect(tabIndex).toBe("-1");
        }
      });
    });
  });
});
