/**
 * Unit tests for DependencyArrows component
 * Focus: visibility filtering, safe task lookup (no non-null assertions),
 * density geometry scaling, drag preview rendering
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { DependencyArrows } from "@/components/GanttChart/DependencyArrows";
import type { Task } from "@/types/chart.types";
import type { TaskId } from "@/types/branded.types";
import type { DependencyDragState } from "@/types/dependency.types";
import type { TimelineScale } from "@/utils/timelineUtils";
import { tid, hex } from "../../../helpers/branded";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDependencies = [
  {
    id: "dep-1",
    fromTaskId: tid("task-1"),
    toTaskId: tid("task-2"),
    type: "FS" as const,
    createdAt: "2025-01-01",
  },
];

const mockStoreState = {
  dependencies: mockDependencies,
  selectedDependencyId: null as string | null,
  selectDependency: vi.fn(),
  removeDependency: vi.fn(),
};

vi.mock("@/store/slices/dependencySlice", () => ({
  useDependencyStore: vi.fn((selector: (state: typeof mockStoreState) => unknown) =>
    selector(mockStoreState),
  ),
}));

// Mock DependencyArrow to avoid deep rendering
vi.mock("@/components/GanttChart/DependencyArrow", () => ({
  DependencyArrow: vi.fn(({ dependency }: { dependency: { id: string } }) => (
    <g className="dependency-arrow" data-testid={`arrow-${dependency.id}`} />
  )),
}));

// Mock DependencyDragPreview
vi.mock(
  "@/components/GanttChart/DependencyDragPreview",
  () => ({
    DependencyDragPreview: vi.fn(() => (
      <g className="dependency-drag-preview" data-testid="drag-preview" />
    )),
  }),
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTask(overrides: Partial<Task> & { id?: string } = {}): Task {
  const { id = "task-1", ...rest } = overrides;
  return {
    id: tid(id),
    name: "Task 1",
    startDate: "2025-01-06",
    endDate: "2025-01-10",
    duration: 5,
    progress: 0,
    color: hex("#0F6CBD"),
    order: 0,
    metadata: {},
    type: "task",
    ...rest,
  };
}

function createScale(overrides: Partial<TimelineScale> = {}): TimelineScale {
  return {
    minDate: "2025-01-01",
    maxDate: "2025-01-31",
    pixelsPerDay: 25,
    totalWidth: 775,
    totalDays: 31,
    zoom: 1,
    scales: [],
    ...overrides,
  };
}

function createDragState(
  overrides: Partial<DependencyDragState> = {},
): DependencyDragState {
  return {
    isDragging: false,
    fromTaskId: null,
    fromSide: null,
    currentPosition: { x: 0, y: 0 },
    validTargets: new Set<TaskId>(),
    invalidTargets: new Set<TaskId>(),
    ...overrides,
  };
}

const defaultTasks: Task[] = [
  createTask({ id: "task-1", order: 0 }),
  createTask({ id: "task-2", name: "Task 2", startDate: "2025-01-13", endDate: "2025-01-17", order: 1 }),
];

function renderArrows(
  props: Partial<Parameters<typeof DependencyArrows>[0]> = {},
): ReturnType<typeof render> {
  const defaultProps = {
    tasks: defaultTasks,
    scale: createScale(),
  };
  return render(
    <svg>
      <DependencyArrows {...defaultProps} {...props} />
    </svg>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DependencyArrows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.dependencies = mockDependencies;
    mockStoreState.selectedDependencyId = null;
  });

  // -------------------------------------------------------------------------
  // Basic rendering
  // -------------------------------------------------------------------------

  describe("basic rendering", () => {
    it("renders a layer-dependencies group", () => {
      const { container } = renderArrows();
      expect(
        container.querySelector(".layer-dependencies"),
      ).not.toBeNull();
    });

    it("renders dependency arrows for visible dependencies", () => {
      const { container } = renderArrows();
      const arrows = container.querySelectorAll(".dependency-arrow");
      expect(arrows).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // Visibility filtering
  // -------------------------------------------------------------------------

  describe("visibility filtering", () => {
    it("skips dependencies where fromTask is not in the task list", () => {
      mockStoreState.dependencies = [
        {
          id: "dep-x",
          fromTaskId: tid("nonexistent"),
          toTaskId: tid("task-2"),
          type: "FS" as const,
          createdAt: "2025-01-01",
        },
      ];
      const { container } = renderArrows();
      expect(container.querySelectorAll(".dependency-arrow")).toHaveLength(
        0,
      );
    });

    it("skips dependencies where toTask is not in the task list", () => {
      mockStoreState.dependencies = [
        {
          id: "dep-x",
          fromTaskId: tid("task-1"),
          toTaskId: tid("nonexistent"),
          type: "FS" as const,
          createdAt: "2025-01-01",
        },
      ];
      const { container } = renderArrows();
      expect(container.querySelectorAll(".dependency-arrow")).toHaveLength(
        0,
      );
    });

    it("skips tasks without valid startDate for position calculation", () => {
      const tasks = [
        createTask({ id: "task-1", startDate: "" }),
        createTask({ id: "task-2", name: "Task 2", startDate: "2025-01-13", endDate: "2025-01-17", order: 1 }),
      ];
      const { container } = renderArrows({ tasks });
      // task-1 has no startDate, so no position, so dependency is filtered
      expect(container.querySelectorAll(".dependency-arrow")).toHaveLength(
        0,
      );
    });

    it("skips non-milestone tasks without endDate", () => {
      const tasks = [
        createTask({ id: "task-1", endDate: "", type: "task" }),
        createTask({ id: "task-2", name: "Task 2", startDate: "2025-01-13", endDate: "2025-01-17", order: 1 }),
      ];
      const { container } = renderArrows({ tasks });
      expect(container.querySelectorAll(".dependency-arrow")).toHaveLength(
        0,
      );
    });

    it("includes milestones without endDate in positions", () => {
      const tasks = [
        createTask({ id: "task-1", endDate: "", type: "milestone" }),
        createTask({ id: "task-2", name: "Task 2", startDate: "2025-01-13", endDate: "2025-01-17", order: 1 }),
      ];
      const { container } = renderArrows({ tasks });
      expect(container.querySelectorAll(".dependency-arrow")).toHaveLength(
        1,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Drag preview
  // -------------------------------------------------------------------------

  describe("drag preview", () => {
    it("does not render drag preview when not dragging", () => {
      const { container } = renderArrows();
      expect(
        container.querySelector(".dependency-drag-preview"),
      ).toBeNull();
    });

    it("renders drag preview when dragging from a valid task", () => {
      const { container } = renderArrows({
        dragState: createDragState({
          isDragging: true,
          fromTaskId: tid("task-1"),
          fromSide: "end",
          currentPosition: { x: 300, y: 100 },
        }),
      });
      expect(
        container.querySelector(".dependency-drag-preview"),
      ).not.toBeNull();
    });

    it("does not render drag preview when fromTaskId is null", () => {
      const { container } = renderArrows({
        dragState: createDragState({
          isDragging: true,
          fromTaskId: null,
          currentPosition: { x: 300, y: 100 },
        }),
      });
      expect(
        container.querySelector(".dependency-drag-preview"),
      ).toBeNull();
    });

    it("does not render drag preview when fromTask has no position", () => {
      const { container } = renderArrows({
        tasks: [createTask({ id: "task-1", startDate: "" })],
        dragState: createDragState({
          isDragging: true,
          fromTaskId: tid("task-1"),
          fromSide: "end",
          currentPosition: { x: 300, y: 100 },
        }),
      });
      expect(
        container.querySelector(".dependency-drag-preview"),
      ).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Density geometry scaling
  // -------------------------------------------------------------------------

  describe("density geometry", () => {
    it("accepts custom rowHeight and renders without error", () => {
      const { container } = renderArrows({ rowHeight: 28 });
      expect(
        container.querySelector(".layer-dependencies"),
      ).not.toBeNull();
    });

    it("renders with comfortable rowHeight", () => {
      const { container } = renderArrows({ rowHeight: 44 });
      expect(
        container.querySelector(".layer-dependencies"),
      ).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  describe("empty state", () => {
    it("renders empty group when no dependencies exist", () => {
      mockStoreState.dependencies = [];
      const { container } = renderArrows();
      expect(container.querySelectorAll(".dependency-arrow")).toHaveLength(
        0,
      );
      expect(
        container.querySelector(".layer-dependencies"),
      ).not.toBeNull();
    });

    it("renders empty group when no tasks provided", () => {
      const { container } = renderArrows({ tasks: [] });
      expect(container.querySelectorAll(".dependency-arrow")).toHaveLength(
        0,
      );
    });
  });
});
