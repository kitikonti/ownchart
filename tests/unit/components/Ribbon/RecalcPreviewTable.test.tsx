import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecalcPreviewTable } from "@/components/Ribbon/RecalcPreviewTable";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useDependencyStore } from "@/store/slices/dependencySlice";
import type { RecalcResult } from "@/utils/graph/computeWorkingDaysRecalc";
import type { TaskId } from "@/types/branded.types";

const TASK_A_ID = "task-a" as TaskId;
const TASK_B_ID = "task-b" as TaskId;

const STUB_TASKS = [
  {
    id: TASK_A_ID,
    name: "Alpha",
    startDate: "2026-04-06",
    endDate: "2026-04-10",
    duration: 5,
    type: "task",
    progress: 0,
    level: 0,
    sortOrder: 0,
    manuallyScheduled: false,
  },
  {
    id: TASK_B_ID,
    name: "Bravo",
    startDate: "2026-04-13",
    endDate: "2026-04-17",
    duration: 5,
    type: "task",
    progress: 0,
    level: 0,
    sortOrder: 1,
    manuallyScheduled: false,
  },
] as never[];

const STUB_DEPS = [
  {
    id: "dep-1",
    fromTaskId: TASK_A_ID,
    toTaskId: TASK_B_ID,
    type: "FS",
    lag: 2,
    createdAt: "2026-04-06T00:00:00Z",
  },
] as never[];

const EMPTY_RESULT: RecalcResult = {
  dateAdjustments: [],
  durationChanges: [],
  lagChanges: [],
};

describe("RecalcPreviewTable", () => {
  beforeEach(() => {
    useTaskStore.setState({ tasks: STUB_TASKS });
    useDependencyStore.setState({ dependencies: STUB_DEPS });
  });

  it("shows 'no changes' message when result is empty", () => {
    render(<RecalcPreviewTable result={EMPTY_RESULT} mode="keep-durations" />);

    expect(screen.getByText(/No changes needed/)).toBeInTheDocument();
  });

  describe("keep-durations mode", () => {
    const result: RecalcResult = {
      dateAdjustments: [
        {
          taskId: TASK_A_ID,
          oldStartDate: "2026-04-06",
          oldEndDate: "2026-04-10",
          newStartDate: "2026-04-06",
          newEndDate: "2026-04-12",
        },
      ],
      durationChanges: [],
      lagChanges: [],
    };

    it("renders date adjustment table with task name", () => {
      render(<RecalcPreviewTable result={result} mode="keep-durations" />);

      expect(
        screen.getByRole("table", { name: "Task date adjustments" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Alpha")).toBeInTheDocument();
    });

    it("shows summary line", () => {
      render(<RecalcPreviewTable result={result} mode="keep-durations" />);

      expect(screen.getByText("1 task will move")).toBeInTheDocument();
    });

    it("does not render duration or lag tables", () => {
      render(<RecalcPreviewTable result={result} mode="keep-durations" />);

      expect(
        screen.queryByRole("table", { name: "Task duration changes" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("table", { name: "Dependency lag changes" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("keep-positions mode", () => {
    const result: RecalcResult = {
      dateAdjustments: [],
      durationChanges: [
        { taskId: TASK_A_ID, oldDuration: 5, newDuration: 4 },
        { taskId: TASK_B_ID, oldDuration: 5, newDuration: 3 },
      ],
      lagChanges: [{ depId: "dep-1", oldLag: 2, newLag: 1 }],
    };

    it("renders duration change table with task names", () => {
      render(<RecalcPreviewTable result={result} mode="keep-positions" />);

      expect(
        screen.getByRole("table", { name: "Task duration changes" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Alpha")).toBeInTheDocument();
      expect(screen.getByText("Bravo")).toBeInTheDocument();
    });

    it("shows old→new duration values", () => {
      const { container } = render(
        <RecalcPreviewTable result={result} mode="keep-positions" />,
      );

      // Both old durations shown struck-through
      const struck = container.querySelectorAll(".line-through");
      const struckTexts = [...struck].map((el) => el.textContent);
      expect(struckTexts).toContain("5d");

      // Full cell text includes old → new
      const cells = container.querySelectorAll("td");
      const cellTexts = [...cells].map((el) => el.textContent);
      expect(cellTexts).toContain("5d → 4d");
      expect(cellTexts).toContain("5d → 3d");
    });

    it("renders lag change table with dependency label", () => {
      render(<RecalcPreviewTable result={result} mode="keep-positions" />);

      expect(
        screen.getByRole("table", { name: "Dependency lag changes" }),
      ).toBeInTheDocument();
      // "Alpha → Bravo" label
      expect(screen.getByText(/Alpha.*Bravo/)).toBeInTheDocument();
    });

    it("shows summary counts for both durations and lags", () => {
      render(<RecalcPreviewTable result={result} mode="keep-positions" />);

      expect(
        screen.getByText("2 durations will change, 1 lag will change"),
      ).toBeInTheDocument();
    });

    it("does not render date adjustment table", () => {
      render(<RecalcPreviewTable result={result} mode="keep-positions" />);

      expect(
        screen.queryByRole("table", { name: "Task date adjustments" }),
      ).not.toBeInTheDocument();
    });
  });

  it("falls back to task ID when task name is missing", () => {
    useTaskStore.setState({ tasks: [] });

    const result: RecalcResult = {
      dateAdjustments: [],
      durationChanges: [
        { taskId: TASK_A_ID, oldDuration: 5, newDuration: 4 },
      ],
      lagChanges: [],
    };

    render(<RecalcPreviewTable result={result} mode="keep-positions" />);

    expect(screen.getByText("task-a")).toBeInTheDocument();
  });
});
