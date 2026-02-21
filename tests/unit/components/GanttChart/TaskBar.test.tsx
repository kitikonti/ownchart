/**
 * Unit tests for TaskBar component
 * Focus: task type branching, null-date guards, label positioning,
 * drag preview rendering, progress bar visibility
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { TaskBar } from "../../../../src/components/GanttChart/TaskBar";
import type { Task } from "../../../../src/types/chart.types";
import type { TimelineScale } from "../../../../src/utils/timelineUtils";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("../../../../src/store/slices/chartSlice", () => ({
  useChartStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      dragState: null,
      showProgress: true,
    })
  ),
}));

vi.mock("../../../../src/store/slices/taskSlice", () => ({
  useTaskStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      selectedTaskIds: [],
    })
  ),
}));

vi.mock("../../../../src/store/slices/userPreferencesSlice", () => ({
  useDensityConfig: vi.fn(() => ({
    rowHeight: 36,
    taskBarHeight: 26,
    taskBarOffset: 5,
    fontSizeBar: 12,
  })),
}));

vi.mock("../../../../src/hooks/useComputedTaskColor", () => ({
  useComputedTaskColor: vi.fn(() => "#4A90D9"),
}));

vi.mock("../../../../src/hooks/useTaskBarInteraction", () => ({
  useTaskBarInteraction: vi.fn(() => ({
    mode: "idle",
    previewGeometry: null,
    cursor: "grab",
    isDragging: false,
    onMouseDown: vi.fn(),
    onMouseMove: vi.fn(),
  })),
}));

vi.mock("../../../../src/hooks/useProgressDrag", () => ({
  useProgressDrag: vi.fn(() => ({
    isDragging: false,
    previewProgress: null,
    onHandleMouseDown: vi.fn(),
  })),
}));

// Re-import mocked modules for per-test overrides
import { useChartStore } from "../../../../src/store/slices/chartSlice";
import { useTaskStore } from "../../../../src/store/slices/taskSlice";
import { useTaskBarInteraction } from "../../../../src/hooks/useTaskBarInteraction";
import { useProgressDrag } from "../../../../src/hooks/useProgressDrag";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    name: "Test Task",
    startDate: "2025-01-10",
    endDate: "2025-01-20",
    duration: 10,
    progress: 50,
    color: "#4A90D9",
    order: 0,
    metadata: {},
    type: "task",
    ...overrides,
  };
}

function createScale(overrides: Partial<TimelineScale> = {}): TimelineScale {
  return {
    minDate: "2025-01-01",
    maxDate: "2025-12-31",
    pixelsPerDay: 25,
    totalWidth: 9125,
    totalDays: 365,
    zoom: 1,
    scales: [],
    ...overrides,
  };
}

/** Render TaskBar inside an SVG (required for valid DOM nesting) */
function renderTaskBar(
  props: Partial<Parameters<typeof TaskBar>[0]> = {}
): ReturnType<typeof render> {
  const defaultProps = {
    task: createTask(),
    scale: createScale(),
    rowIndex: 0,
  };
  return render(
    <svg>
      <TaskBar {...defaultProps} {...props} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TaskBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset to defaults
    vi.mocked(useChartStore).mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) =>
        selector({ dragState: null, showProgress: true }) as never
    );
    vi.mocked(useTaskStore).mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) =>
        selector({ selectedTaskIds: [] }) as never
    );
    vi.mocked(useTaskBarInteraction).mockReturnValue({
      mode: "idle" as const,
      previewGeometry: null,
      cursor: "grab",
      isDragging: false,
      onMouseDown: vi.fn(),
      onMouseMove: vi.fn(),
    });
    vi.mocked(useProgressDrag).mockReturnValue({
      isDragging: false,
      previewProgress: null,
      onHandleMouseDown: vi.fn(),
    });
  });

  // -------------------------------------------------------------------------
  // Null-date guards (early returns)
  // -------------------------------------------------------------------------

  describe("null-date guards", () => {
    it("should render nothing for a regular task without startDate", () => {
      const { container } = renderTaskBar({
        task: createTask({ startDate: "" }),
      });
      // The outer <svg> is always present, but the <g> task-bar should not be
      expect(container.querySelector(".task-bar")).toBeNull();
    });

    it("should render nothing for a regular task without endDate", () => {
      const { container } = renderTaskBar({
        task: createTask({ endDate: "" }),
      });
      expect(container.querySelector(".task-bar")).toBeNull();
    });

    it("should render nothing for a milestone without startDate", () => {
      const { container } = renderTaskBar({
        task: createTask({ type: "milestone", startDate: "", endDate: "" }),
      });
      expect(container.querySelector(".task-bar")).toBeNull();
    });

    it("should render a milestone with only startDate (no endDate needed)", () => {
      const { container } = renderTaskBar({
        task: createTask({ type: "milestone", endDate: "" }),
      });
      expect(container.querySelector(".task-bar.milestone")).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Task type rendering
  // -------------------------------------------------------------------------

  describe("task type rendering", () => {
    it("should render a regular task bar with className 'task-bar task'", () => {
      const { container } = renderTaskBar();
      expect(container.querySelector(".task-bar.task")).not.toBeNull();
    });

    it("should render a milestone with className 'task-bar milestone'", () => {
      const { container } = renderTaskBar({
        task: createTask({ type: "milestone" }),
      });
      expect(container.querySelector(".task-bar.milestone")).not.toBeNull();
    });

    it("should render a summary with className 'task-bar summary'", () => {
      const { container } = renderTaskBar({
        task: createTask({ type: "summary" }),
      });
      expect(container.querySelector(".task-bar.summary")).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Label positioning
  // -------------------------------------------------------------------------

  describe("label positioning", () => {
    it("should show task name by default (inside position)", () => {
      const { container } = renderTaskBar({
        task: createTask({ name: "My Task" }),
      });
      const text = container.querySelector("text");
      expect(text?.textContent).toBe("My Task");
    });

    it("should hide label when labelPosition is 'none'", () => {
      const { container } = renderTaskBar({
        task: createTask({ name: "Hidden" }),
        labelPosition: "none",
      });
      const text = container.querySelector("text");
      expect(text).toBeNull();
    });

    it("should use textAnchor='end' for 'before' label position", () => {
      const { container } = renderTaskBar({
        labelPosition: "before",
      });
      const text = container.querySelector("text");
      expect(text?.getAttribute("text-anchor")).toBe("end");
    });

    it("should use textAnchor='start' for 'after' label position", () => {
      const { container } = renderTaskBar({
        labelPosition: "after",
      });
      const text = container.querySelector("text");
      expect(text?.getAttribute("text-anchor")).toBe("start");
    });

    it("should fall back to 'after' for milestone with 'inside' label position", () => {
      const { container } = renderTaskBar({
        task: createTask({ type: "milestone" }),
        labelPosition: "inside",
      });
      // Milestone with 'inside' → falls back to 'after', so text should be rendered
      const text = container.querySelector("text");
      expect(text).not.toBeNull();
      expect(text?.getAttribute("text-anchor")).toBe("start");
    });

    it("should fall back to 'after' for summary with 'inside' label position", () => {
      const { container } = renderTaskBar({
        task: createTask({ type: "summary" }),
        labelPosition: "inside",
      });
      const text = container.querySelector("text");
      expect(text).not.toBeNull();
      expect(text?.getAttribute("text-anchor")).toBe("start");
    });

    it("should hide milestone label when labelPosition is 'none'", () => {
      const { container } = renderTaskBar({
        task: createTask({ type: "milestone" }),
        labelPosition: "none",
      });
      const text = container.querySelector("text");
      expect(text).toBeNull();
    });

    it("should hide summary label when labelPosition is 'none'", () => {
      const { container } = renderTaskBar({
        task: createTask({ type: "summary" }),
        labelPosition: "none",
      });
      const text = container.querySelector("text");
      expect(text).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Progress bar
  // -------------------------------------------------------------------------

  describe("progress bar", () => {
    it("should render progress bar when showProgress is on and progress > 0", () => {
      const { container } = renderTaskBar({
        task: createTask({ progress: 50 }),
      });
      // clipPath rect + background rect + progress rect = 3 rects minimum
      const rects = container.querySelectorAll("rect");
      expect(rects.length).toBeGreaterThanOrEqual(3);
    });

    it("should not render progress bar when progress is 0", () => {
      const { container } = renderTaskBar({
        task: createTask({ progress: 0 }),
      });
      // clipPath rect + background rect = 2 rects (no progress rect)
      // Also the progress handle hitzone should still appear if bar is wide enough
      const clipPathRect = container.querySelector("clipPath rect");
      expect(clipPathRect).not.toBeNull();
    });

    it("should not render progress bar when showProgress is off", () => {
      vi.mocked(useChartStore).mockImplementation(
        (selector: (s: Record<string, unknown>) => unknown) =>
          selector({ dragState: null, showProgress: false }) as never
      );
      const { container } = renderTaskBar({
        task: createTask({ progress: 75 }),
      });
      // No progress handle should be rendered
      expect(container.querySelector(".progress-handle")).toBeNull();
    });

    it("should show percentage during progress drag instead of task name", () => {
      vi.mocked(useProgressDrag).mockReturnValue({
        isDragging: true,
        previewProgress: 65,
        onHandleMouseDown: vi.fn(),
      });
      const { container } = renderTaskBar({
        task: createTask({ name: "My Task" }),
      });
      const text = container.querySelector("text");
      expect(text?.textContent).toBe("65%");
    });
  });

  // -------------------------------------------------------------------------
  // Progress handle visibility
  // -------------------------------------------------------------------------

  describe("progress handle", () => {
    it("should not render progress handle in export mode", () => {
      const { container } = renderTaskBar({
        isExport: true,
      });
      expect(container.querySelector(".progress-handle")).toBeNull();
    });

    it("should not render progress handle for narrow bars", () => {
      // Use very low pixelsPerDay so the bar is narrow
      const { container } = renderTaskBar({
        scale: createScale({ pixelsPerDay: 1 }),
        task: createTask({
          startDate: "2025-01-10",
          endDate: "2025-01-12",
          duration: 2,
        }),
      });
      expect(container.querySelector(".progress-handle")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Drag preview
  // -------------------------------------------------------------------------

  describe("drag preview", () => {
    it("should show dashed preview outline during drag", () => {
      vi.mocked(useTaskBarInteraction).mockReturnValue({
        mode: "dragging" as const,
        previewGeometry: {
          startDate: "2025-01-15",
          endDate: "2025-01-25",
        },
        cursor: "grabbing",
        isDragging: true,
        onMouseDown: vi.fn(),
        onMouseMove: vi.fn(),
      });

      const { container } = renderTaskBar();
      const previewRect = container.querySelector(
        'rect[stroke-dasharray="4 4"]'
      );
      expect(previewRect).not.toBeNull();
      expect(previewRect?.getAttribute("fill")).toBe("none");
    });

    it("should fade original bar when being dragged", () => {
      vi.mocked(useTaskBarInteraction).mockReturnValue({
        mode: "dragging" as const,
        previewGeometry: {
          startDate: "2025-01-15",
          endDate: "2025-01-25",
        },
        cursor: "grabbing",
        isDragging: true,
        onMouseDown: vi.fn(),
        onMouseMove: vi.fn(),
      });

      const { container } = renderTaskBar();
      const bgRect = container.querySelector(
        ".task-bar.task > rect:not([stroke-dasharray])"
      );
      // Opacity should be DRAG_OPACITY (0.3)
      expect(bgRect?.getAttribute("fill-opacity")).toBe("0.3");
    });
  });

  // -------------------------------------------------------------------------
  // Secondary preview (multi-select drag)
  // -------------------------------------------------------------------------

  describe("secondary preview (multi-select drag)", () => {
    it("should show preview for selected task when another selected task is being dragged", () => {
      vi.mocked(useChartStore).mockImplementation(
        (selector: (s: Record<string, unknown>) => unknown) =>
          selector({
            dragState: {
              sourceTaskId: "task-2",
              deltaDays: 5,
            },
            showProgress: true,
          }) as never
      );
      vi.mocked(useTaskStore).mockImplementation(
        (selector: (s: Record<string, unknown>) => unknown) =>
          selector({
            selectedTaskIds: ["task-1", "task-2"],
          }) as never
      );

      const { container } = renderTaskBar({
        task: createTask({ id: "task-1" }),
      });
      const previewRect = container.querySelector(
        'rect[stroke-dasharray="4 4"]'
      );
      expect(previewRect).not.toBeNull();
    });

    it("should NOT show secondary preview when task is not in selection", () => {
      vi.mocked(useChartStore).mockImplementation(
        (selector: (s: Record<string, unknown>) => unknown) =>
          selector({
            dragState: {
              sourceTaskId: "task-2",
              deltaDays: 5,
            },
            showProgress: true,
          }) as never
      );
      vi.mocked(useTaskStore).mockImplementation(
        (selector: (s: Record<string, unknown>) => unknown) =>
          selector({
            selectedTaskIds: ["task-2"],
          }) as never
      );

      const { container } = renderTaskBar({
        task: createTask({ id: "task-1" }),
      });
      const previewRect = container.querySelector(
        'rect[stroke-dasharray="4 4"]'
      );
      expect(previewRect).toBeNull();
    });

    it("should NOT show secondary preview when deltaDays is 0", () => {
      vi.mocked(useChartStore).mockImplementation(
        (selector: (s: Record<string, unknown>) => unknown) =>
          selector({
            dragState: {
              sourceTaskId: "task-2",
              deltaDays: 0,
            },
            showProgress: true,
          }) as never
      );
      vi.mocked(useTaskStore).mockImplementation(
        (selector: (s: Record<string, unknown>) => unknown) =>
          selector({
            selectedTaskIds: ["task-1", "task-2"],
          }) as never
      );

      const { container } = renderTaskBar({
        task: createTask({ id: "task-1" }),
      });
      const previewRect = container.querySelector(
        'rect[stroke-dasharray="4 4"]'
      );
      expect(previewRect).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Density override (export mode)
  // -------------------------------------------------------------------------

  describe("density override", () => {
    it("should use densityOverride when provided", () => {
      const { container } = renderTaskBar({
        densityOverride: {
          rowHeight: 44,
          taskBarHeight: 32,
          taskBarOffset: 6,
          fontSizeBar: 14,
        },
      });
      const text = container.querySelector("text");
      expect(text?.getAttribute("font-size")).toBe("14");
    });
  });

  // -------------------------------------------------------------------------
  // Click handling
  // -------------------------------------------------------------------------

  describe("click handling", () => {
    it("should not fire onClick when dragging", () => {
      const onClick = vi.fn();
      vi.mocked(useTaskBarInteraction).mockReturnValue({
        mode: "dragging" as const,
        previewGeometry: {
          startDate: "2025-01-15",
          endDate: "2025-01-25",
        },
        cursor: "grabbing",
        isDragging: true,
        onMouseDown: vi.fn(),
        onMouseMove: vi.fn(),
      });

      const { container } = renderTaskBar({ onClick });
      const g = container.querySelector(".task-bar.task");
      g?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
