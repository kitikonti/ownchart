/**
 * Unit tests for columns.ts — getColumnDisplayValue, EXPORT_COLUMNS, HEADER_LABELS.
 */

import { describe, it, expect } from "vitest";
import {
  getColumnDisplayValue,
  EXPORT_COLUMNS,
  EXPORT_COLUMN_MAP,
  HEADER_LABELS,
} from "../../../../src/utils/export/columns";
import type { Task } from "../../../../src/types/chart.types";
import { toTaskId } from "../../../../src/types/branded.types";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: toTaskId("t1"),
    name: "Test Task",
    type: "task",
    startDate: "2025-01-01",
    endDate: "2025-01-10",
    progress: 50,
    duration: 9,
    parentId: null,
    sortOrder: 0,
    color: null,
    ...overrides,
  };
}

describe("getColumnDisplayValue — startDate", () => {
  it("returns the startDate string when present", () => {
    const task = makeTask({ startDate: "2025-03-15" });
    expect(getColumnDisplayValue(task, "startDate")).toBe("2025-03-15");
  });

  it("returns null when startDate is falsy", () => {
    const task = makeTask({ startDate: "" });
    expect(getColumnDisplayValue(task, "startDate")).toBeNull();
  });
});

describe("getColumnDisplayValue — endDate", () => {
  it("returns the endDate string for a regular task", () => {
    const task = makeTask({ endDate: "2025-03-25" });
    expect(getColumnDisplayValue(task, "endDate")).toBe("2025-03-25");
  });

  it("returns empty string for a milestone (no end date displayed)", () => {
    const task = makeTask({ type: "milestone", endDate: "2025-03-25" });
    expect(getColumnDisplayValue(task, "endDate")).toBe("");
  });

  it("returns null when endDate is falsy on a regular task", () => {
    const task = makeTask({ endDate: "" });
    expect(getColumnDisplayValue(task, "endDate")).toBeNull();
  });
});

describe("getColumnDisplayValue — duration", () => {
  it("returns empty string for a milestone", () => {
    const task = makeTask({ type: "milestone", duration: 0 });
    expect(getColumnDisplayValue(task, "duration")).toBe("");
  });

  it("returns '9 days' for a summary task with positive duration", () => {
    const task = makeTask({ type: "summary", duration: 9 });
    expect(getColumnDisplayValue(task, "duration")).toBe("9 days");
  });

  it("returns null for a summary task with zero duration", () => {
    const task = makeTask({ type: "summary", duration: 0 });
    expect(getColumnDisplayValue(task, "duration")).toBeNull();
  });

  it("returns null for a summary task with undefined duration", () => {
    const task = makeTask({ type: "summary", duration: undefined });
    expect(getColumnDisplayValue(task, "duration")).toBeNull();
  });

  it("returns numeric string (no unit) for a regular task", () => {
    const task = makeTask({ type: "task", duration: 9 });
    expect(getColumnDisplayValue(task, "duration")).toBe("9");
  });

  it("returns '0' for a regular task with zero duration", () => {
    const task = makeTask({ type: "task", duration: 0 });
    expect(getColumnDisplayValue(task, "duration")).toBe("0");
  });

  it("returns null for a regular task with undefined duration", () => {
    const task = makeTask({ type: "task", duration: undefined });
    expect(getColumnDisplayValue(task, "duration")).toBeNull();
  });
});

describe("getColumnDisplayValue — progress", () => {
  it("returns progress as percentage string", () => {
    const task = makeTask({ progress: 75 });
    expect(getColumnDisplayValue(task, "progress")).toBe("75%");
  });

  it("returns '0%' for zero progress", () => {
    const task = makeTask({ progress: 0 });
    expect(getColumnDisplayValue(task, "progress")).toBe("0%");
  });

  it("returns null when progress is undefined", () => {
    const task = makeTask({ progress: undefined });
    expect(getColumnDisplayValue(task, "progress")).toBeNull();
  });
});

describe("EXPORT_COLUMNS", () => {
  it("contains all expected column keys", () => {
    const keys = EXPORT_COLUMNS.map((c) => c.key);
    expect(keys).toContain("color");
    expect(keys).toContain("name");
    expect(keys).toContain("startDate");
    expect(keys).toContain("endDate");
    expect(keys).toContain("duration");
    expect(keys).toContain("progress");
  });

  it("all columns have positive defaultWidth", () => {
    for (const col of EXPORT_COLUMNS) {
      expect(col.defaultWidth).toBeGreaterThan(0);
    }
  });
});

describe("EXPORT_COLUMN_MAP", () => {
  it("has an entry for every EXPORT_COLUMNS key", () => {
    for (const col of EXPORT_COLUMNS) {
      expect(EXPORT_COLUMN_MAP.has(col.key)).toBe(true);
    }
  });
});

describe("HEADER_LABELS", () => {
  it("has a label entry for every column key", () => {
    for (const col of EXPORT_COLUMNS) {
      expect(Object.prototype.hasOwnProperty.call(HEADER_LABELS, col.key)).toBe(
        true
      );
    }
  });
});
