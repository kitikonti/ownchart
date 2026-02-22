import { describe, it, expect } from "vitest";
import { getColumnDisplayValue } from "../../../../src/components/Export/ExportRenderer";
import { calculateExportDimensions } from "../../../../src/utils/export/exportLayout";
import { EXPORT_COLUMNS } from "../../../../src/utils/export/columns";
import { calculateTaskTableWidth } from "../../../../src/utils/export";
import { DENSITY_CONFIG } from "../../../../src/config/densityConfig";
import { DEFAULT_EXPORT_OPTIONS } from "../../../../src/utils/export/types";
import type { Task } from "../../../../src/types/chart.types";

describe("EXPORT_COLUMNS", () => {
  it("should have all required columns", () => {
    const keys = EXPORT_COLUMNS.map((col) => col.key);
    expect(keys).toContain("color");
    expect(keys).toContain("name");
    expect(keys).toContain("startDate");
    expect(keys).toContain("endDate");
    expect(keys).toContain("duration");
    expect(keys).toContain("progress");
  });

  it("should have correct column order", () => {
    expect(EXPORT_COLUMNS[0].key).toBe("color");
    expect(EXPORT_COLUMNS[1].key).toBe("name");
    expect(EXPORT_COLUMNS[2].key).toBe("startDate");
    expect(EXPORT_COLUMNS[3].key).toBe("endDate");
    expect(EXPORT_COLUMNS[4].key).toBe("duration");
    expect(EXPORT_COLUMNS[5].key).toBe("progress");
  });

  it("should have default widths for all columns", () => {
    EXPORT_COLUMNS.forEach((col) => {
      expect(col.defaultWidth).toBeGreaterThan(0);
    });
  });

  it("should have labels for all columns except color", () => {
    const colorCol = EXPORT_COLUMNS.find((c) => c.key === "color");
    expect(colorCol?.label).toBe("");

    const otherCols = EXPORT_COLUMNS.filter((c) => c.key !== "color");
    otherCols.forEach((col) => {
      expect(col.label.length).toBeGreaterThan(0);
    });
  });
});

describe("calculateTaskTableWidth", () => {
  const normalWidths = DENSITY_CONFIG.normal.columnWidths;

  it("should return 0 for empty column selection", () => {
    const width = calculateTaskTableWidth([], {}, "normal");
    expect(width).toBe(0);
  });

  it("should use default widths when no custom widths provided", () => {
    const width = calculateTaskTableWidth(["name"], {}, "normal");
    expect(width).toBe(normalWidths.nameMin);
  });

  it("should use custom widths when provided", () => {
    const width = calculateTaskTableWidth(["name"], { name: 300 }, "normal");
    expect(width).toBe(300);
  });

  it("should sum widths for multiple columns", () => {
    const width = calculateTaskTableWidth(
      ["name", "startDate", "endDate"],
      {},
      "normal"
    );
    const expectedWidth =
      normalWidths.nameMin + normalWidths.startDate + normalWidths.endDate;
    expect(width).toBe(expectedWidth);
  });

  it("should mix default and custom widths", () => {
    const width = calculateTaskTableWidth(
      ["name", "startDate"],
      { name: 250 },
      "normal"
    );
    expect(width).toBe(250 + normalWidths.startDate);
  });

  it("should calculate width for all columns", () => {
    const allKeys = EXPORT_COLUMNS.map((c) => c.key);
    const width = calculateTaskTableWidth(allKeys, {}, "normal");
    const totalDefault =
      normalWidths.color +
      normalWidths.nameMin +
      normalWidths.startDate +
      normalWidths.endDate +
      normalWidths.duration +
      normalWidths.progress;
    expect(width).toBe(totalDefault);
  });

  it("should use different widths for different densities", () => {
    const compactWidth = calculateTaskTableWidth(["name"], {}, "compact");
    const normalWidth = calculateTaskTableWidth(["name"], {}, "normal");
    const comfortableWidth = calculateTaskTableWidth(
      ["name"],
      {},
      "comfortable"
    );

    expect(compactWidth).toBe(DENSITY_CONFIG.compact.columnWidths.nameMin);
    expect(normalWidth).toBe(DENSITY_CONFIG.normal.columnWidths.nameMin);
    expect(comfortableWidth).toBe(
      DENSITY_CONFIG.comfortable.columnWidths.nameMin
    );

    // Compact < Normal < Comfortable
    expect(compactWidth).toBeLessThan(normalWidth);
    expect(normalWidth).toBeLessThan(comfortableWidth);
  });

  it("should calculate total width correctly for each density", () => {
    const cols = ["color", "name", "startDate"] as const;

    const compactWidth = calculateTaskTableWidth([...cols], {}, "compact");
    const normalWidth = calculateTaskTableWidth([...cols], {}, "normal");
    const comfortableWidth = calculateTaskTableWidth(
      [...cols],
      {},
      "comfortable"
    );

    const compactExpected =
      DENSITY_CONFIG.compact.columnWidths.color +
      DENSITY_CONFIG.compact.columnWidths.nameMin +
      DENSITY_CONFIG.compact.columnWidths.startDate;
    const normalExpected =
      DENSITY_CONFIG.normal.columnWidths.color +
      DENSITY_CONFIG.normal.columnWidths.nameMin +
      DENSITY_CONFIG.normal.columnWidths.startDate;
    const comfortableExpected =
      DENSITY_CONFIG.comfortable.columnWidths.color +
      DENSITY_CONFIG.comfortable.columnWidths.nameMin +
      DENSITY_CONFIG.comfortable.columnWidths.startDate;

    expect(compactWidth).toBe(compactExpected);
    expect(normalWidth).toBe(normalExpected);
    expect(comfortableWidth).toBe(comfortableExpected);
  });
});

describe("calculateExportDimensions", () => {
  function createTasks(count: number): Task[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `task-${i}`,
      name: `Task ${i}`,
      startDate: "2025-01-01",
      endDate: "2025-03-01",
      duration: 59,
      progress: 0,
      type: "task" as const,
      color: "#4299e1",
    }));
  }

  // --- Edge cases ---

  it("handles empty task list without error", () => {
    const result = calculateExportDimensions({
      tasks: [],
      options: DEFAULT_EXPORT_OPTIONS,
    });

    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThanOrEqual(0);
    expect(result.effectiveZoom).toBeGreaterThan(0);
  });

  it("handles empty task list with header — height equals header height", () => {
    const result = calculateExportDimensions({
      tasks: [],
      options: { ...DEFAULT_EXPORT_OPTIONS, includeHeader: true },
    });

    // Only header, no content rows
    expect(result.height).toBe(48);
  });

  it("handles empty task list without header — height is zero", () => {
    const result = calculateExportDimensions({
      tasks: [],
      options: { ...DEFAULT_EXPORT_OPTIONS, includeHeader: false },
    });

    expect(result.height).toBe(0);
  });

  it("handles tasks without dates gracefully", () => {
    const tasks: Task[] = [
      {
        id: "1",
        name: "No dates",
        startDate: "",
        endDate: "",
        duration: 0,
        progress: 0,
        type: "task",
        color: "#4299e1",
      },
    ];

    // Should not throw
    const result = calculateExportDimensions({
      tasks,
      options: DEFAULT_EXPORT_OPTIONS,
    });
    expect(result.width).toBeGreaterThan(0);
    expect(result.effectiveZoom).toBeGreaterThan(0);
  });

  it("fitToWidth with narrow width still produces valid dimensions", () => {
    const tasks = createTasks(3);
    const options = {
      ...DEFAULT_EXPORT_OPTIONS,
      zoomMode: "fitToWidth" as const,
      fitToWidth: 200,
      selectedColumns: ["name" as const],
    };

    const result = calculateExportDimensions({ tasks, options });

    expect(result.width).toBe(200);
    expect(result.height).toBeGreaterThan(0);
  });

  it("no selected columns means no task table width", () => {
    const tasks = createTasks(3);
    const projectDateRange = {
      start: new Date("2025-01-01"),
      end: new Date("2025-03-01"),
    };

    const withColumns = calculateExportDimensions({
      tasks,
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        selectedColumns: ["name", "startDate"],
      },
      currentAppZoom: 1.0,
      projectDateRange,
    });

    const withoutColumns = calculateExportDimensions({
      tasks,
      options: { ...DEFAULT_EXPORT_OPTIONS, selectedColumns: [] },
      currentAppZoom: 1.0,
      projectDateRange,
    });

    expect(withColumns.width).toBeGreaterThan(withoutColumns.width);
  });

  it("height scales linearly with task count", () => {
    const projectDateRange = {
      start: new Date("2025-01-01"),
      end: new Date("2025-03-01"),
    };
    const options = { ...DEFAULT_EXPORT_OPTIONS, includeHeader: false };

    const result5 = calculateExportDimensions({
      tasks: createTasks(5),
      options,
      currentAppZoom: 1.0,
      projectDateRange,
    });
    const result10 = calculateExportDimensions({
      tasks: createTasks(10),
      options,
      currentAppZoom: 1.0,
      projectDateRange,
    });

    expect(result10.height).toBe(result5.height * 2);
  });

  it("respects density setting for row heights", () => {
    const tasks = createTasks(5);
    const projectDateRange = {
      start: new Date("2025-01-01"),
      end: new Date("2025-03-01"),
    };

    const compact = calculateExportDimensions({
      tasks,
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        density: "compact",
        includeHeader: false,
      },
      currentAppZoom: 1.0,
      projectDateRange,
    });
    const comfortable = calculateExportDimensions({
      tasks,
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        density: "comfortable",
        includeHeader: false,
      },
      currentAppZoom: 1.0,
      projectDateRange,
    });

    expect(compact.height).toBeLessThan(comfortable.height);
  });

  it("returns width, height, and effectiveZoom", () => {
    const tasks = createTasks(5);
    const result = calculateExportDimensions({
      tasks,
      options: DEFAULT_EXPORT_OPTIONS,
    });

    expect(result).toHaveProperty("width");
    expect(result).toHaveProperty("height");
    expect(result).toHaveProperty("effectiveZoom");
    expect(typeof result.width).toBe("number");
    expect(typeof result.height).toBe("number");
    expect(typeof result.effectiveZoom).toBe("number");
  });

  it("fitToWidth mode: width equals fitToWidth value", () => {
    const tasks = createTasks(5);
    const options = {
      ...DEFAULT_EXPORT_OPTIONS,
      zoomMode: "fitToWidth" as const,
      fitToWidth: 1920,
    };
    const result = calculateExportDimensions({ tasks, options });

    expect(result.width).toBe(1920);
  });

  it("effectiveZoom is positive", () => {
    const tasks = createTasks(10);
    const result = calculateExportDimensions({
      tasks,
      options: DEFAULT_EXPORT_OPTIONS,
    });

    expect(result.effectiveZoom).toBeGreaterThan(0);
  });

  it("is deterministic (same inputs produce same outputs)", () => {
    const tasks = createTasks(10);
    const projectDateRange = {
      start: new Date("2025-01-01"),
      end: new Date("2025-03-01"),
    };

    const result1 = calculateExportDimensions({
      tasks,
      options: DEFAULT_EXPORT_OPTIONS,
      currentAppZoom: 1.0,
      projectDateRange,
    });

    const result2 = calculateExportDimensions({
      tasks,
      options: DEFAULT_EXPORT_OPTIONS,
      currentAppZoom: 1.0,
      projectDateRange,
    });

    expect(result1.width).toBe(result2.width);
    expect(result1.height).toBe(result2.height);
    expect(result1.effectiveZoom).toBe(result2.effectiveZoom);
  });

  it("header adds 48px to height", () => {
    const tasks = createTasks(5);
    const projectDateRange = {
      start: new Date("2025-01-01"),
      end: new Date("2025-03-01"),
    };

    const withHeader = calculateExportDimensions({
      tasks,
      options: { ...DEFAULT_EXPORT_OPTIONS, includeHeader: true },
      currentAppZoom: 1.0,
      projectDateRange,
    });

    const withoutHeader = calculateExportDimensions({
      tasks,
      options: { ...DEFAULT_EXPORT_OPTIONS, includeHeader: false },
      currentAppZoom: 1.0,
      projectDateRange,
    });

    expect(withHeader.height - withoutHeader.height).toBe(48);
  });
});

describe("getColumnDisplayValue", () => {
  const baseTask: Task = {
    id: "1",
    name: "Test Task",
    startDate: "2025-01-15",
    endDate: "2025-02-15",
    duration: 31,
    progress: 50,
    type: "task",
    color: "#4299e1",
  };

  const milestone: Task = { ...baseTask, type: "milestone" };
  const summary: Task = { ...baseTask, type: "summary" };

  // --- startDate ---

  it("returns startDate for regular task", () => {
    expect(getColumnDisplayValue(baseTask, "startDate")).toBe("2025-01-15");
  });

  it("returns null when startDate is empty", () => {
    expect(
      getColumnDisplayValue({ ...baseTask, startDate: "" }, "startDate")
    ).toBeNull();
  });

  // --- endDate ---

  it("returns endDate for regular task", () => {
    expect(getColumnDisplayValue(baseTask, "endDate")).toBe("2025-02-15");
  });

  it("returns empty string for milestone endDate", () => {
    expect(getColumnDisplayValue(milestone, "endDate")).toBe("");
  });

  it("returns null when endDate is empty", () => {
    expect(
      getColumnDisplayValue({ ...baseTask, endDate: "" }, "endDate")
    ).toBeNull();
  });

  // --- duration ---

  it("returns duration as plain number for regular task", () => {
    expect(getColumnDisplayValue(baseTask, "duration")).toBe("31");
  });

  it("returns duration with 'days' suffix for summary", () => {
    expect(getColumnDisplayValue(summary, "duration")).toBe("31 days");
  });

  it("returns empty string for milestone duration", () => {
    expect(getColumnDisplayValue(milestone, "duration")).toBe("");
  });

  it("returns null for summary with zero duration", () => {
    expect(
      getColumnDisplayValue({ ...summary, duration: 0 }, "duration")
    ).toBeNull();
  });

  it("returns null when duration is undefined", () => {
    const task = { ...baseTask };
    delete (task as Partial<Task>).duration;
    expect(getColumnDisplayValue(task as Task, "duration")).toBeNull();
  });

  // --- progress ---

  it("returns progress with % suffix", () => {
    expect(getColumnDisplayValue(baseTask, "progress")).toBe("50%");
  });

  it("returns 0% for zero progress", () => {
    expect(
      getColumnDisplayValue({ ...baseTask, progress: 0 }, "progress")
    ).toBe("0%");
  });

  it("returns null when progress is undefined", () => {
    const task = { ...baseTask };
    delete (task as Partial<Task>).progress;
    expect(getColumnDisplayValue(task as Task, "progress")).toBeNull();
  });

});
