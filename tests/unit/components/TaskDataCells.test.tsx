/**
 * Tests for TaskDataCells component.
 * Verifies cell rendering per field type, read-only cells,
 * column formatter usage, type cycling, and color cell editing.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskDataCells } from "../../../src/components/TaskList/TaskDataCells";
import type { Task } from "../../../src/types/chart.types";
import type { ColumnDefinition } from "../../../src/config/tableColumns";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUpdateTask = vi.fn();
const mockStopCellEdit = vi.fn();

vi.mock("../../../src/store/slices/taskSlice", () => ({
  useTaskStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      updateTask: mockUpdateTask,
      toggleTaskCollapsed: vi.fn(),
      activeCell: { taskId: null, field: null },
      isEditingCell: false,
      setActiveCell: vi.fn(),
      startCellEdit: vi.fn(),
      stopCellEdit: mockStopCellEdit,
      navigateCell: vi.fn(),
      clearSelection: vi.fn(),
      cutCell: null,
    })
  ),
}));

vi.mock("../../../src/store/slices/chartSlice", () => ({
  useChartStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      colorModeState: { mode: "manual" },
    })
  ),
}));

vi.mock("../../../src/store/slices/userPreferencesSlice", () => ({
  useDensityConfig: vi.fn(() => ({
    rowHeight: 36,
    indentSize: 20,
    colorBarHeight: 14,
    cellPaddingY: 6,
    cellPaddingX: 8,
    fontSizeCell: 13,
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

vi.mock("../../../src/hooks/useCellEdit", () => ({
  useCellEdit: vi.fn(() => ({
    localValue: "",
    setLocalValue: vi.fn(),
    error: null,
    inputRef: { current: null },
    shouldOverwriteRef: { current: false },
    saveValue: vi.fn(),
    cancelEdit: vi.fn(),
    handleEditKeyDown: vi.fn(),
    displayValue: "",
  })),
}));

vi.mock(
  "../../../src/components/TaskList/CellEditors/ColorCellEditor",
  () => ({
    ColorCellEditor: (props: {
      onChange: (hex: string) => void;
      onResetOverride: () => void;
      onSave: () => void;
    }) => (
      <div data-testid="color-cell-editor">
        <button
          data-testid="pick-color"
          onClick={() => props.onChange("#FF0000")}
        >
          pick
        </button>
        <button data-testid="reset-override" onClick={props.onResetOverride}>
          reset
        </button>
        <button data-testid="save-color" onClick={props.onSave}>
          save
        </button>
      </div>
    ),
  })
);

import { useTaskStore } from "../../../src/store/slices/taskSlice";
import { useChartStore } from "../../../src/store/slices/chartSlice";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    name: "Test Task",
    startDate: "2025-01-10",
    endDate: "2025-01-17",
    duration: 7,
    progress: 50,
    color: "#4A90D9",
    order: 0,
    type: "task",
    parent: undefined,
    open: true,
    metadata: {},
    ...overrides,
  };
}

function makeColumn(
  overrides: Partial<ColumnDefinition> = {}
): ColumnDefinition {
  return {
    id: "name",
    field: "name",
    label: "Name",
    defaultWidth: "200px",
    editable: true,
    renderer: "text",
    ...overrides,
  } as ColumnDefinition;
}

const durationColumn = makeColumn({
  id: "duration",
  field: "duration",
  label: "Duration",
  defaultWidth: "100px",
  renderer: "number",
  formatter: (value) => `${value} ${Number(value) === 1 ? "day" : "days"}`,
});

const nameColumn = makeColumn();

const startDateColumn = makeColumn({
  id: "startDate",
  field: "startDate",
  label: "Start Date",
  defaultWidth: "130px",
  renderer: "date",
});

const endDateColumn = makeColumn({
  id: "endDate",
  field: "endDate",
  label: "End Date",
  defaultWidth: "130px",
  renderer: "date",
});

const progressColumn = makeColumn({
  id: "progress",
  field: "progress",
  label: "%",
  defaultWidth: "70px",
  renderer: "number",
  formatter: (value) => `${value}%`,
});

const colorColumn = makeColumn({
  id: "color",
  field: "color",
  label: "Color",
  defaultWidth: "40px",
  editable: true,
});

/** Override mocks to simulate editing a specific cell. */
function mockEditingState(
  taskId: string,
  field: string,
  colorMode = "manual"
): void {
  vi.mocked(useTaskStore).mockImplementation(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        updateTask: mockUpdateTask,
        toggleTaskCollapsed: vi.fn(),
        activeCell: { taskId, field },
        isEditingCell: true,
        setActiveCell: vi.fn(),
        startCellEdit: vi.fn(),
        stopCellEdit: mockStopCellEdit,
        navigateCell: vi.fn(),
        clearSelection: vi.fn(),
        cutCell: null,
      }) as never
  );
  vi.mocked(useChartStore).mockImplementation(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        colorModeState: { mode: colorMode },
      }) as never
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TaskDataCells", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Restore default implementations after per-test overrides
    vi.mocked(useTaskStore).mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) =>
        selector({
          updateTask: mockUpdateTask,
          toggleTaskCollapsed: vi.fn(),
          activeCell: { taskId: null, field: null },
          isEditingCell: false,
          setActiveCell: vi.fn(),
          startCellEdit: vi.fn(),
          stopCellEdit: mockStopCellEdit,
          navigateCell: vi.fn(),
          clearSelection: vi.fn(),
          cutCell: null,
        }) as never
    );
    vi.mocked(useChartStore).mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) =>
        selector({
          colorModeState: { mode: "manual" },
        }) as never
    );
  });

  describe("summary task rendering", () => {
    it("renders summary dates as read-only italic text", () => {
      const task = makeTask({ type: "summary" });
      render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[startDateColumn, endDateColumn]}
          level={0}
          hasChildren={true}
          isExpanded={true}
          computedColor="#4A90D9"
        />
      );

      const italicSpans = document.querySelectorAll(".italic");
      expect(italicSpans.length).toBeGreaterThanOrEqual(2);
      expect(italicSpans[0].textContent).toBe("2025-01-10");
      expect(italicSpans[1].textContent).toBe("2025-01-17");
    });

    it("renders summary duration using column formatter with plural", () => {
      const task = makeTask({ type: "summary", duration: 7 });
      render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[durationColumn]}
          level={0}
          hasChildren={true}
          isExpanded={true}
          computedColor="#4A90D9"
        />
      );

      const italicSpan = document.querySelector(".italic");
      expect(italicSpan?.textContent).toBe("7 days");
    });

    it("renders summary duration using column formatter with singular", () => {
      const task = makeTask({ type: "summary", duration: 1 });
      render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[durationColumn]}
          level={0}
          hasChildren={true}
          isExpanded={true}
          computedColor="#4A90D9"
        />
      );

      const italicSpan = document.querySelector(".italic");
      expect(italicSpan?.textContent).toBe("1 day");
    });

    it("renders empty span for summary duration of 0", () => {
      const task = makeTask({ type: "summary", duration: 0 });
      render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[durationColumn]}
          level={0}
          hasChildren={true}
          isExpanded={true}
          computedColor="#4A90D9"
        />
      );

      const italicSpan = document.querySelector(".italic");
      expect(italicSpan).toBeNull();
    });
  });

  describe("milestone task rendering", () => {
    it("renders empty endDate cell for milestones", () => {
      const task = makeTask({ type: "milestone", duration: 0 });
      const { container } = render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[endDateColumn]}
          level={0}
          hasChildren={false}
          isExpanded={false}
          computedColor="#4A90D9"
        />
      );

      const cells = container.querySelectorAll("[role='gridcell']");
      expect(cells.length).toBe(1);
      // endDate cell should have an empty span
      const span = cells[0].querySelector("span");
      expect(span?.textContent).toBe("");
    });

    it("renders empty progress cell for milestones", () => {
      const task = makeTask({ type: "milestone", duration: 0, progress: 0 });
      const { container } = render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[progressColumn]}
          level={0}
          hasChildren={false}
          isExpanded={false}
          computedColor="#4A90D9"
        />
      );

      const cells = container.querySelectorAll("[role='gridcell']");
      expect(cells.length).toBe(1);
      const span = cells[0].querySelector("span");
      expect(span?.textContent).toBe("");
    });

    it("renders empty duration cell for milestones", () => {
      const task = makeTask({ type: "milestone", duration: 0 });
      const { container } = render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[durationColumn]}
          level={0}
          hasChildren={false}
          isExpanded={false}
          computedColor="#4A90D9"
        />
      );

      const cells = container.querySelectorAll("[role='gridcell']");
      expect(cells.length).toBe(1);
      const span = cells[0].querySelector("span");
      expect(span?.textContent).toBe("");
    });
  });

  describe("regular task rendering", () => {
    it("renders default cells for regular task fields", () => {
      const task = makeTask();
      const { container } = render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[startDateColumn, durationColumn, progressColumn]}
          level={0}
          hasChildren={false}
          isExpanded={false}
          computedColor="#4A90D9"
        />
      );

      const cells = container.querySelectorAll("[role='gridcell']");
      expect(cells.length).toBe(3);
    });
  });

  describe("name cell", () => {
    it("renders task name in view mode", () => {
      const task = makeTask({ name: "My Task" });
      render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[nameColumn]}
          level={0}
          hasChildren={false}
          isExpanded={false}
          computedColor="#4A90D9"
        />
      );

      expect(screen.getByText("My Task")).toBeInTheDocument();
    });

    it("renders expand/collapse button for summary tasks with children", () => {
      const task = makeTask({ type: "summary", name: "Group" });
      render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[nameColumn]}
          level={0}
          hasChildren={true}
          isExpanded={true}
          computedColor="#4A90D9"
        />
      );

      const button = screen.getByRole("button", {
        name: /collapse group/i,
      });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("renders task type icon as interactive button", () => {
      const task = makeTask();
      render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[nameColumn]}
          level={0}
          hasChildren={false}
          isExpanded={false}
          computedColor="#4A90D9"
        />
      );

      // TaskTypeIcon should be wrapped in a button
      const typeButton = screen.getByRole("button", {
        name: /task type/i,
      });
      expect(typeButton).toBeInTheDocument();
    });

    it("applies hierarchy indentation based on level", () => {
      const task = makeTask();
      render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[nameColumn]}
          level={2}
          hasChildren={false}
          isExpanded={false}
          computedColor="#4A90D9"
        />
      );

      // Level 2 with indentSize 20 = 40px paddingLeft
      const flexContainer = document.querySelector(".flex.items-center.gap-1");
      expect(flexContainer).toHaveStyle({ paddingLeft: "40px" });
    });

    it("cycles task type on TaskTypeIcon click", () => {
      const task = makeTask({ type: "task" });
      render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[nameColumn]}
          level={0}
          hasChildren={false}
          isExpanded={false}
          computedColor="#4A90D9"
        />
      );

      const typeButton = screen.getByRole("button", {
        name: /task type/i,
      });
      fireEvent.click(typeButton);

      expect(mockUpdateTask).toHaveBeenCalledWith("task-1", {
        type: "summary",
      });
    });
  });

  describe("color cell", () => {
    it("renders color bar in view mode", () => {
      const task = makeTask({ color: "#4A90D9" as never });
      const { container } = render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[colorColumn]}
          level={0}
          hasChildren={false}
          isExpanded={false}
          computedColor="#4A90D9"
        />
      );

      const colorBar = container.querySelector(".w-1\\.5.rounded");
      expect(colorBar).toBeInTheDocument();
      expect(colorBar).toHaveStyle({ backgroundColor: "#4A90D9" });
    });

    it("renders ColorCellEditor when editing", () => {
      mockEditingState("task-1", "color");

      const task = makeTask();
      render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[colorColumn]}
          level={0}
          hasChildren={false}
          isExpanded={false}
          computedColor="#4A90D9"
        />
      );

      expect(screen.getByTestId("color-cell-editor")).toBeInTheDocument();
    });

    it("dispatches updateTask with color in manual mode", () => {
      mockEditingState("task-1", "color", "manual");

      const task = makeTask();
      render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[colorColumn]}
          level={0}
          hasChildren={false}
          isExpanded={false}
          computedColor="#4A90D9"
        />
      );

      fireEvent.click(screen.getByTestId("pick-color"));
      expect(mockUpdateTask).toHaveBeenCalledWith("task-1", {
        color: "#FF0000",
      });
    });

    it("dispatches updateTask with colorOverride in auto mode", () => {
      mockEditingState("task-1", "color", "theme");

      const task = makeTask({ type: "task" });
      render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[colorColumn]}
          level={0}
          hasChildren={false}
          isExpanded={false}
          computedColor="#4A90D9"
        />
      );

      fireEvent.click(screen.getByTestId("pick-color"));
      expect(mockUpdateTask).toHaveBeenCalledWith("task-1", {
        colorOverride: "#FF0000",
      });
    });

    it("dispatches updateTask with color (no override) for summary task in summary mode", () => {
      mockEditingState("task-1", "color", "summary");

      const task = makeTask({ type: "summary" });
      render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[colorColumn]}
          level={0}
          hasChildren={true}
          isExpanded={true}
          computedColor="#4A90D9"
        />
      );

      fireEvent.click(screen.getByTestId("pick-color"));
      expect(mockUpdateTask).toHaveBeenCalledWith("task-1", {
        color: "#FF0000",
        colorOverride: undefined,
      });
    });

    it("resets colorOverride on reset-override click", () => {
      mockEditingState("task-1", "color");

      const task = makeTask({ colorOverride: "#123456" as never });
      render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[colorColumn]}
          level={0}
          hasChildren={false}
          isExpanded={false}
          computedColor="#4A90D9"
        />
      );

      fireEvent.click(screen.getByTestId("reset-override"));
      expect(mockUpdateTask).toHaveBeenCalledWith("task-1", {
        colorOverride: undefined,
      });
    });

    it("calls stopCellEdit on save", () => {
      mockEditingState("task-1", "color");

      const task = makeTask();
      render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[colorColumn]}
          level={0}
          hasChildren={false}
          isExpanded={false}
          computedColor="#4A90D9"
        />
      );

      fireEvent.click(screen.getByTestId("save-color"));
      expect(mockStopCellEdit).toHaveBeenCalled();
    });
  });

  describe("column filtering", () => {
    it("skips columns without a field (non-data columns)", () => {
      const task = makeTask();
      const rowNumberColumn = makeColumn({
        id: "rowNumber",
        field: undefined,
        label: "#",
        defaultWidth: "50px",
        editable: false,
      });

      const { container } = render(
        <TaskDataCells
          task={task}
          displayTask={task}
          visibleColumns={[rowNumberColumn, startDateColumn]}
          level={0}
          hasChildren={false}
          isExpanded={false}
          computedColor="#4A90D9"
        />
      );

      // Only startDate should render (rowNumber has no field)
      const cells = container.querySelectorAll("[role='gridcell']");
      expect(cells.length).toBe(1);
    });
  });
});
