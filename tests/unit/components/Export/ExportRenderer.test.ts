import { describe, it, expect } from "vitest";
import {
  calculateTaskTableWidth,
  EXPORT_COLUMNS,
} from "../../../../src/components/Export/ExportRenderer";

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
  it("should return 0 for empty column selection", () => {
    const width = calculateTaskTableWidth([], {});
    expect(width).toBe(0);
  });

  it("should use default widths when no custom widths provided", () => {
    const width = calculateTaskTableWidth(["name"], {});
    const nameCol = EXPORT_COLUMNS.find((c) => c.key === "name");
    expect(width).toBe(nameCol?.defaultWidth);
  });

  it("should use custom widths when provided", () => {
    const width = calculateTaskTableWidth(["name"], { name: 300 });
    expect(width).toBe(300);
  });

  it("should sum widths for multiple columns", () => {
    const width = calculateTaskTableWidth(["name", "startDate", "endDate"], {});
    const nameCol = EXPORT_COLUMNS.find((c) => c.key === "name");
    const startCol = EXPORT_COLUMNS.find((c) => c.key === "startDate");
    const endCol = EXPORT_COLUMNS.find((c) => c.key === "endDate");
    const expectedWidth =
      (nameCol?.defaultWidth || 0) +
      (startCol?.defaultWidth || 0) +
      (endCol?.defaultWidth || 0);
    expect(width).toBe(expectedWidth);
  });

  it("should mix default and custom widths", () => {
    const width = calculateTaskTableWidth(["name", "startDate"], { name: 250 });
    const startCol = EXPORT_COLUMNS.find((c) => c.key === "startDate");
    expect(width).toBe(250 + (startCol?.defaultWidth || 0));
  });

  it("should calculate width for all columns", () => {
    const allKeys = EXPORT_COLUMNS.map((c) => c.key);
    const width = calculateTaskTableWidth(allKeys, {});
    const totalDefault = EXPORT_COLUMNS.reduce(
      (sum, col) => sum + col.defaultWidth,
      0
    );
    expect(width).toBe(totalDefault);
  });
});
