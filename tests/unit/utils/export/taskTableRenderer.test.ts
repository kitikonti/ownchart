/**
 * Unit tests for taskTableRenderer.ts
 *
 * Tests SVG element creation, attribute values, and rendering logic
 * for the task table header and rows (all densities, task types, edge cases).
 */

import { describe, it, expect } from "vitest";
import type { Task } from "../../../../src/types/chart.types";
import type { TaskId } from "../../../../src/types/branded.types";
import type { ColorModeState } from "../../../../src/types/colorMode.types";
import type { FlattenedTask } from "../../../../src/utils/export/types";
import {
  renderTaskTableHeader,
  renderTaskTableRows,
  type TaskTableHeaderOptions,
  type TaskTableRowsOptions,
} from "../../../../src/utils/export/taskTableRenderer";
import { HEADER_HEIGHT } from "../../../../src/utils/export/constants";

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeSvg(): SVGSVGElement {
  return document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1" as TaskId,
    name: "Test Task",
    type: "task",
    startDate: "2024-01-15",
    endDate: "2024-01-20",
    duration: 5,
    progress: 50,
    color: "#3b82f6",
    order: 0,
    metadata: {},
    ...overrides,
  };
}

function makeFlattenedTask(
  task: Task,
  level = 0,
  hasChildren = false
): FlattenedTask {
  return { task, level, hasChildren };
}

const COLOR_MODE_MANUAL: ColorModeState = {
  mode: "manual",
  themeOptions: { selectedPaletteId: null, customMonochromeBase: null },
  summaryOptions: { useMilestoneAccent: false, milestoneAccentColor: "#ff6b6b" },
  taskTypeOptions: {
    summaryColor: "#8b5cf6",
    taskColor: "#3b82f6",
    milestoneColor: "#ef4444",
  },
  hierarchyOptions: {
    baseColor: "#3b82f6",
    lightenPercentPerLevel: 12,
    maxLightenPercent: 36,
  },
};

// Column widths matching comfortable-density defaults (realistic production values)
const COLUMN_WIDTHS: Record<string, number> = {
  color: 32,
  name: 200,
  startDate: 110,
  endDate: 110,
  duration: 100,
  progress: 70,
};

function makeHeaderOptions(
  partial: Partial<TaskTableHeaderOptions> = {}
): TaskTableHeaderOptions {
  return {
    selectedColumns: ["color", "name", "startDate"],
    columnWidths: COLUMN_WIDTHS,
    totalWidth: 342,
    x: 0,
    y: 0,
    density: "comfortable",
    ...partial,
  };
}

function makeRowsOptions(
  flattenedTasks: FlattenedTask[],
  partial: Partial<TaskTableRowsOptions> = {}
): TaskTableRowsOptions {
  return {
    flattenedTasks,
    selectedColumns: ["color", "name", "startDate"],
    columnWidths: COLUMN_WIDTHS,
    totalWidth: 342,
    x: 0,
    startY: 0,
    density: "comfortable",
    colorModeState: COLOR_MODE_MANUAL,
    ...partial,
  };
}

// ─── SVG query helpers ────────────────────────────────────────────────────────

function getTextElements(parent: Element): SVGTextElement[] {
  return Array.from(parent.querySelectorAll("text")) as SVGTextElement[];
}

function getLineElements(parent: Element): SVGLineElement[] {
  return Array.from(parent.querySelectorAll("line")) as SVGLineElement[];
}

function getRectElements(parent: Element): SVGRectElement[] {
  return Array.from(parent.querySelectorAll("rect")) as SVGRectElement[];
}

// ─── renderTaskTableHeader ────────────────────────────────────────────────────

describe("renderTaskTableHeader", () => {
  it("returns a <g> with class task-table-header and appends it to the SVG", () => {
    const svg = makeSvg();
    const group = renderTaskTableHeader(svg, makeHeaderOptions());

    expect(group.tagName).toBe("g");
    expect(group.getAttribute("class")).toBe("task-table-header");
    expect(svg.contains(group)).toBe(true);
  });

  it("creates a background rect with correct position and dimensions", () => {
    const svg = makeSvg();
    const group = renderTaskTableHeader(
      svg,
      makeHeaderOptions({ x: 10, y: 5, totalWidth: 300 })
    );

    const bg = getRectElements(group)[0];
    expect(bg.getAttribute("x")).toBe("10");
    expect(bg.getAttribute("y")).toBe("5");
    expect(bg.getAttribute("width")).toBe("300");
    expect(bg.getAttribute("height")).toBe(String(HEADER_HEIGHT));
  });

  it("renders uppercase label text for non-empty-label columns", () => {
    const svg = makeSvg();
    const group = renderTaskTableHeader(
      svg,
      makeHeaderOptions({ selectedColumns: ["name", "startDate", "endDate", "duration", "progress"] })
    );

    const textContents = getTextElements(group).map((t) => t.textContent);
    expect(textContents).toContain("NAME");
    expect(textContents).toContain("START DATE");
    expect(textContents).toContain("END DATE");
    expect(textContents).toContain("DURATION");
    expect(textContents).toContain("%");
  });

  it("does not render label text for the color column (empty label)", () => {
    const svg = makeSvg();
    const group = renderTaskTableHeader(
      svg,
      makeHeaderOptions({ selectedColumns: ["color"] })
    );

    // Color column has empty label — no text elements should be created
    expect(getTextElements(group).length).toBe(0);
  });

  it("creates column separators for non-color columns only", () => {
    const svg = makeSvg();
    // 3 columns: color, name, startDate
    // Lines: 1 header bottom border + 2 column separators (name, startDate) = 3
    const group = renderTaskTableHeader(
      svg,
      makeHeaderOptions({ selectedColumns: ["color", "name", "startDate"] })
    );

    const lines = getLineElements(group);
    expect(lines.length).toBe(3);
  });

  it("skips the column separator for the color column", () => {
    const svg = makeSvg();
    // 1 column: color only → 1 bottom border, 0 column separators
    const group = renderTaskTableHeader(
      svg,
      makeHeaderOptions({ selectedColumns: ["color"] })
    );

    const lines = getLineElements(group);
    expect(lines.length).toBe(1); // only the header bottom border
  });

  it("uses header text y-position derived from HEADER_HEIGHT", () => {
    const svg = makeSvg();
    const group = renderTaskTableHeader(
      svg,
      makeHeaderOptions({ y: 0, selectedColumns: ["name"] })
    );

    const text = getTextElements(group)[0];
    // y = 0 + HEADER_HEIGHT / 2 + TEXT_BASELINE_OFFSET = 0 + 24 + 4 = 28
    expect(text.getAttribute("y")).toBe("28");
  });

  it("works correctly for all three density modes", () => {
    for (const density of ["compact", "normal", "comfortable"] as const) {
      const svg = makeSvg();
      const group = renderTaskTableHeader(svg, makeHeaderOptions({ density }));
      expect(group.getAttribute("class")).toBe("task-table-header");
      // Background rect always present
      expect(getRectElements(group).length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ─── renderTaskTableRows ──────────────────────────────────────────────────────

describe("renderTaskTableRows", () => {
  it("returns a <g> with class task-table-rows and appends it to the SVG", () => {
    const svg = makeSvg();
    const group = renderTaskTableRows(
      svg,
      makeRowsOptions([makeFlattenedTask(makeTask())])
    );

    expect(group.getAttribute("class")).toBe("task-table-rows");
    expect(svg.contains(group)).toBe(true);
  });

  it("creates one row bottom border per task plus one table right border", () => {
    const svg = makeSvg();
    const tasks = [
      makeFlattenedTask(makeTask({ id: "t1" as TaskId })),
      makeFlattenedTask(makeTask({ id: "t2" as TaskId })),
      makeFlattenedTask(makeTask({ id: "t3" as TaskId })),
    ];
    const group = renderTaskTableRows(
      svg,
      makeRowsOptions(tasks, { selectedColumns: [] })
    );

    // 1 table right border + 3 row bottom borders = 4 lines
    expect(getLineElements(group).length).toBe(4);
  });

  it("handles empty task list without error and only creates the right border", () => {
    const svg = makeSvg();
    const group = renderTaskTableRows(svg, makeRowsOptions([]));

    const lines = getLineElements(group);
    expect(lines.length).toBe(1); // only the table right border
  });

  it("works correctly for all three density modes", () => {
    for (const density of ["compact", "normal", "comfortable"] as const) {
      const svg = makeSvg();
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(makeTask())], { density })
      );
      expect(group.getAttribute("class")).toBe("task-table-rows");
      expect(getRectElements(group).length).toBeGreaterThanOrEqual(1);
    }
  });

  describe("color column", () => {
    it("renders a color rect (not text) for the color column", () => {
      const svg = makeSvg();
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(makeTask())], {
          selectedColumns: ["color"],
        })
      );

      expect(getRectElements(group).length).toBeGreaterThanOrEqual(1);
      expect(getTextElements(group).length).toBe(0);
    });

    it("uses the task color in manual mode", () => {
      const svg = makeSvg();
      const task = makeTask({ color: "#ff0000" });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task)], { selectedColumns: ["color"] })
      );

      const rects = getRectElements(group);
      const colorBar = rects.find((r) => r.getAttribute("fill") === "#ff0000");
      expect(colorBar).toBeDefined();
    });
  });

  describe("name column", () => {
    it("renders the task name as text", () => {
      const svg = makeSvg();
      const task = makeTask({ name: "My Important Task" });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task)], { selectedColumns: ["name"] })
      );

      const texts = getTextElements(group);
      expect(texts.some((t) => t.textContent === "My Important Task")).toBe(true);
    });

    it("uses fallback 'Task N' when name is empty", () => {
      const svg = makeSvg();
      const task = makeTask({ name: "" });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task)], { selectedColumns: ["name"] })
      );

      const texts = getTextElements(group);
      expect(texts.some((t) => t.textContent === "Task 1")).toBe(true);
    });

    it("truncates a long task name with '…' when column is narrow", () => {
      const svg = makeSvg();
      const longName = "A".repeat(200);
      const task = makeTask({ name: longName });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task)], {
          selectedColumns: ["name"],
          columnWidths: { name: 80 }, // narrow enough to force truncation
        })
      );

      const texts = getTextElements(group);
      const nameText = texts.find((t) => t.textContent?.endsWith("…"));
      expect(nameText).toBeDefined();
      expect(nameText!.textContent!.length).toBeLessThan(longName.length);
    });

    it("renders expand arrow '▼' for summary tasks with children", () => {
      const svg = makeSvg();
      const task = makeTask({ type: "summary" });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task, 0, true)], {
          selectedColumns: ["name"],
        })
      );

      const texts = getTextElements(group);
      expect(texts.some((t) => t.textContent === "▼")).toBe(true);
    });

    it("does not render expand arrow for summary tasks without children", () => {
      const svg = makeSvg();
      const task = makeTask({ type: "summary" });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task, 0, false)], {
          selectedColumns: ["name"],
        })
      );

      const texts = getTextElements(group);
      expect(texts.some((t) => t.textContent === "▼")).toBe(false);
    });

    it("does not render expand arrow for regular task with children flag", () => {
      const svg = makeSvg();
      // A non-summary task should never get an arrow even if hasChildren is true
      const task = makeTask({ type: "task" });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task, 0, true)], {
          selectedColumns: ["name"],
        })
      );

      const texts = getTextElements(group);
      expect(texts.some((t) => t.textContent === "▼")).toBe(false);
    });

    it("produces sequential fallback names 'Task 1', 'Task 2', 'Task 3' for multiple unnamed tasks", () => {
      const svg = makeSvg();
      const tasks = [
        makeFlattenedTask(makeTask({ id: "t1" as TaskId, name: "" })),
        makeFlattenedTask(makeTask({ id: "t2" as TaskId, name: "" })),
        makeFlattenedTask(makeTask({ id: "t3" as TaskId, name: "" })),
      ];
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions(tasks, { selectedColumns: ["name"] })
      );

      const texts = getTextElements(group).map((t) => t.textContent);
      expect(texts).toContain("Task 1");
      expect(texts).toContain("Task 2");
      expect(texts).toContain("Task 3");
    });

    describe("icon rendering", () => {
      it("renders a <path> element for the task type icon", () => {
        const svg = makeSvg();
        const group = renderTaskTableRows(
          svg,
          makeRowsOptions([makeFlattenedTask(makeTask({ type: "task" }))], {
            selectedColumns: ["name"],
          })
        );

        const paths = Array.from(group.querySelectorAll("path")) as SVGPathElement[];
        expect(paths.length).toBeGreaterThanOrEqual(1);
        expect(paths[0].getAttribute("d")).toBeTruthy();
      });

      it("renders distinct icon paths for task, summary and milestone types", () => {
        const types = ["task", "summary", "milestone"] as const;
        const dValues = types.map((type) => {
          const svg = makeSvg();
          const group = renderTaskTableRows(
            svg,
            makeRowsOptions([makeFlattenedTask(makeTask({ type }))], {
              selectedColumns: ["name"],
            })
          );
          return (
            Array.from(group.querySelectorAll("path")) as SVGPathElement[]
          )[0]?.getAttribute("d");
        });

        expect(dValues.every(Boolean)).toBe(true);
        expect(dValues[0]).not.toBe(dValues[1]); // task ≠ summary
        expect(dValues[0]).not.toBe(dValues[2]); // task ≠ milestone
      });

      it("does not throw when task.type is undefined — falls back to task icon", () => {
        const svg = makeSvg();
        const task = { ...makeTask(), type: undefined } as unknown as Task;
        const group = renderTaskTableRows(
          svg,
          makeRowsOptions([makeFlattenedTask(task)], { selectedColumns: ["name"] })
        );

        const paths = Array.from(group.querySelectorAll("path")) as SVGPathElement[];
        expect(paths.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("data columns — regular task", () => {
    it("renders start date text", () => {
      const svg = makeSvg();
      const task = makeTask({ startDate: "2024-03-01" });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task)], { selectedColumns: ["startDate"] })
      );

      expect(getTextElements(group).some((t) => t.textContent === "2024-03-01")).toBe(true);
    });

    it("renders end date text", () => {
      const svg = makeSvg();
      const task = makeTask({ endDate: "2024-03-15" });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task)], { selectedColumns: ["endDate"] })
      );

      expect(getTextElements(group).some((t) => t.textContent === "2024-03-15")).toBe(true);
    });

    it("renders duration as plain number (no suffix) for regular tasks", () => {
      const svg = makeSvg();
      const task = makeTask({ duration: 7 });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task)], { selectedColumns: ["duration"] })
      );

      expect(getTextElements(group).some((t) => t.textContent === "7")).toBe(true);
    });

    it("renders progress with percent sign", () => {
      const svg = makeSvg();
      const task = makeTask({ progress: 75 });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task)], { selectedColumns: ["progress"] })
      );

      expect(getTextElements(group).some((t) => t.textContent === "75%")).toBe(true);
    });

    it("renders regular date cells without italic styling", () => {
      const svg = makeSvg();
      const task = makeTask({ startDate: "2024-01-01" });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task)], { selectedColumns: ["startDate"] })
      );

      const dateText = getTextElements(group).find(
        (t) => t.textContent === "2024-01-01"
      );
      expect(dateText?.getAttribute("font-style")).toBeNull();
    });
  });

  describe("data columns — milestone task", () => {
    it("does not render end date for milestone", () => {
      const svg = makeSvg();
      const task = makeTask({ type: "milestone", endDate: "2024-03-15" });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task)], { selectedColumns: ["endDate"] })
      );

      expect(getTextElements(group).length).toBe(0);
    });

    it("does not render duration for milestone", () => {
      const svg = makeSvg();
      const task = makeTask({ type: "milestone", duration: 0 });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task)], { selectedColumns: ["duration"] })
      );

      expect(getTextElements(group).length).toBe(0);
    });

    it("still renders start date for milestone", () => {
      const svg = makeSvg();
      const task = makeTask({ type: "milestone", startDate: "2024-06-01" });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task)], { selectedColumns: ["startDate"] })
      );

      expect(getTextElements(group).some((t) => t.textContent === "2024-06-01")).toBe(true);
    });
  });

  describe("data columns — summary task", () => {
    it("renders duration with 'days' suffix for summary tasks", () => {
      const svg = makeSvg();
      const task = makeTask({ type: "summary", duration: 14 });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task, 0, true)], {
          selectedColumns: ["duration"],
        })
      );

      expect(getTextElements(group).some((t) => t.textContent === "14 days")).toBe(true);
    });

    it("renders summary start date with italic font-style", () => {
      const svg = makeSvg();
      const task = makeTask({ type: "summary", startDate: "2024-01-01" });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task, 0, true)], {
          selectedColumns: ["startDate"],
        })
      );

      const dateText = getTextElements(group).find(
        (t) => t.textContent === "2024-01-01"
      );
      expect(dateText?.getAttribute("font-style")).toBe("italic");
    });

    it("renders summary end date with italic font-style", () => {
      const svg = makeSvg();
      const task = makeTask({ type: "summary", endDate: "2024-12-31" });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task, 0, true)], {
          selectedColumns: ["endDate"],
        })
      );

      const dateText = getTextElements(group).find(
        (t) => t.textContent === "2024-12-31"
      );
      expect(dateText?.getAttribute("font-style")).toBe("italic");
    });

    it("renders summary duration with italic font-style", () => {
      const svg = makeSvg();
      const task = makeTask({ type: "summary", duration: 10 });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task, 0, true)], {
          selectedColumns: ["duration"],
        })
      );

      const durText = getTextElements(group).find(
        (t) => t.textContent === "10 days"
      );
      expect(durText?.getAttribute("font-style")).toBe("italic");
    });

    it("renders progress for summary tasks without italic styling", () => {
      const svg = makeSvg();
      const task = makeTask({ type: "summary", progress: 80 });
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task, 0, true)], {
          selectedColumns: ["progress"],
        })
      );

      const progText = getTextElements(group).find((t) => t.textContent === "80%");
      expect(progText).toBeDefined();
      expect(progText?.getAttribute("font-style")).toBeNull();
    });
  });

  describe("layout — column separators", () => {
    it("creates column separators for non-color columns", () => {
      const svg = makeSvg();
      const task = makeTask();
      // 3 columns: color, name, startDate
      // Lines per row: 1 row border + 2 separators (name, startDate)
      // Plus 1 table right border = total 4 lines
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task)], {
          selectedColumns: ["color", "name", "startDate"],
        })
      );

      expect(getLineElements(group).length).toBe(4);
    });

    it("does not create a separator for the color column", () => {
      const svg = makeSvg();
      const task = makeTask();
      // color only: 1 table right border + 1 row border = 2 lines (no separator)
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions([makeFlattenedTask(task)], { selectedColumns: ["color"] })
      );

      expect(getLineElements(group).length).toBe(2);
    });
  });

  describe("row positioning", () => {
    it("positions rows at correct y offsets based on density rowHeight", () => {
      const svg = makeSvg();
      const tasks = [
        makeFlattenedTask(makeTask({ id: "t1" as TaskId })),
        makeFlattenedTask(makeTask({ id: "t2" as TaskId })),
      ];
      // comfortable: rowHeight = 44
      const group = renderTaskTableRows(
        svg,
        makeRowsOptions(tasks, { selectedColumns: [], startY: 10, density: "comfortable" })
      );

      const lines = getLineElements(group);
      // Row 1 bottom border: y1 = startY + rowHeight = 10 + 44 = 54
      // Row 2 bottom border: y1 = startY + 2 * rowHeight = 10 + 88 = 98
      // Row borders are horizontal (x1 ≠ x2); right border and separators are vertical (x1 = x2)
      const rowBorderYValues = lines
        .filter((l) => l.getAttribute("x1") !== l.getAttribute("x2"))
        .map((l) => l.getAttribute("y1"));
      expect(rowBorderYValues).toContain("54");
      expect(rowBorderYValues).toContain("98");
    });

    it("offsets column content when x > 0", () => {
      const task = makeTask({ color: "#aabbcc" });

      const svg0 = makeSvg();
      const group0 = renderTaskTableRows(
        svg0,
        makeRowsOptions([makeFlattenedTask(task)], { selectedColumns: ["color"], x: 0 })
      );

      const svg50 = makeSvg();
      const group50 = renderTaskTableRows(
        svg50,
        makeRowsOptions([makeFlattenedTask(task)], { selectedColumns: ["color"], x: 50 })
      );

      const bar0 = getRectElements(group0).find((r) => r.getAttribute("fill") === "#aabbcc");
      const bar50 = getRectElements(group50).find((r) => r.getAttribute("fill") === "#aabbcc");

      expect(bar0).toBeDefined();
      expect(bar50).toBeDefined();
      expect(Number(bar50!.getAttribute("x"))).toBeGreaterThan(
        Number(bar0!.getAttribute("x"))
      );
    });
  });
});
