import { describe, it, expect } from "vitest";
import {
  EXPORT_COLUMNS,
  calculateExportDimensions,
} from "../../../../src/components/Export/ExportRenderer";
import { calculateTaskTableWidth } from "../../../../src/utils/export";
import { DENSITY_CONFIG } from "../../../../src/types/preferences.types";
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

  it("returns width, height, and effectiveZoom", () => {
    const tasks = createTasks(5);
    const result = calculateExportDimensions(tasks, DEFAULT_EXPORT_OPTIONS);

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
    const result = calculateExportDimensions(tasks, options);

    expect(result.width).toBe(1920);
  });

  it("effectiveZoom is positive", () => {
    const tasks = createTasks(10);
    const result = calculateExportDimensions(tasks, DEFAULT_EXPORT_OPTIONS);

    expect(result.effectiveZoom).toBeGreaterThan(0);
  });

  it("is deterministic (same inputs produce same outputs)", () => {
    const tasks = createTasks(10);
    const projectDateRange = {
      start: new Date("2025-01-01"),
      end: new Date("2025-03-01"),
    };

    const result1 = calculateExportDimensions(
      tasks,
      DEFAULT_EXPORT_OPTIONS,
      {},
      1.0,
      projectDateRange
    );

    const result2 = calculateExportDimensions(
      tasks,
      DEFAULT_EXPORT_OPTIONS,
      {},
      1.0,
      projectDateRange
    );

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

    const withHeader = calculateExportDimensions(
      tasks,
      { ...DEFAULT_EXPORT_OPTIONS, includeHeader: true },
      {},
      1.0,
      projectDateRange
    );

    const withoutHeader = calculateExportDimensions(
      tasks,
      { ...DEFAULT_EXPORT_OPTIONS, includeHeader: false },
      {},
      1.0,
      projectDateRange
    );

    expect(withHeader.height - withoutHeader.height).toBe(48);
  });
});
