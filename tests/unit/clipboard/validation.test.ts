import { describe, it, expect } from "vitest";
import {
  canPasteCellValue,
  canCutCellValue,
  getClearValueForField,
} from "../../../src/utils/clipboard/validation";
import { DEFAULT_TASK_COLOR } from "../../../src/styles/design-tokens";
import type { Task } from "../../../src/types/chart.types";
import { tid, hex } from "../../helpers/branded";

// Minimal task factory for test readability
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: tid("t1"),
    name: "Task",
    startDate: "2025-01-01",
    endDate: "2025-01-07",
    duration: 7,
    progress: 0,
    color: hex("#3b82f6"),
    order: 0,
    metadata: {},
    ...overrides,
  };
}

describe("canPasteCellValue", () => {
  describe("Rule 1: field types must match", () => {
    it("should reject paste of name into startDate", () => {
      const result = canPasteCellValue("name", "startDate", makeTask());
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.error).toContain("Cannot paste");
    });

    it("should reject paste of progress into duration", () => {
      const result = canPasteCellValue("progress", "duration", makeTask());
      expect(result.valid).toBe(false);
    });

    it("should accept same-field paste", () => {
      expect(canPasteCellValue("name", "name", makeTask()).valid).toBe(true);
      expect(canPasteCellValue("duration", "duration", makeTask()).valid).toBe(true);
      expect(canPasteCellValue("startDate", "startDate", makeTask()).valid).toBe(true);
    });
  });

  describe("Rule 2: summary tasks have calculated dates", () => {
    const summaryTask = makeTask({ type: "summary" });

    it("should reject startDate paste into summary", () => {
      const result = canPasteCellValue("startDate", "startDate", summaryTask);
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.error).toContain("summary");
    });

    it("should reject endDate paste into summary", () => {
      const result = canPasteCellValue("endDate", "endDate", summaryTask);
      expect(result.valid).toBe(false);
    });

    it("should allow name paste into summary", () => {
      expect(canPasteCellValue("name", "name", summaryTask).valid).toBe(true);
    });

    it("should allow progress paste into summary", () => {
      expect(canPasteCellValue("progress", "progress", summaryTask).valid).toBe(true);
    });
  });

  describe("Rule 3: milestone tasks cannot accept duration or progress", () => {
    const milestone = makeTask({ type: "milestone" });

    it("should reject duration paste into milestone", () => {
      const result = canPasteCellValue("duration", "duration", milestone);
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.error).toContain("milestone");
    });

    it("should reject progress paste into milestone", () => {
      const result = canPasteCellValue("progress", "progress", milestone);
      expect(result.valid).toBe(false);
    });

    it("should allow name paste into milestone", () => {
      expect(canPasteCellValue("name", "name", milestone).valid).toBe(true);
    });

    it("should allow date paste into milestone", () => {
      expect(canPasteCellValue("startDate", "startDate", milestone).valid).toBe(true);
    });
  });

  it("should allow all fields into regular tasks", () => {
    const task = makeTask();
    const fields = ["name", "startDate", "endDate", "duration", "progress", "color", "type"] as const;
    for (const field of fields) {
      expect(canPasteCellValue(field, field, task).valid).toBe(true);
    }
  });
});

describe("canCutCellValue", () => {
  it("should reject cutting type from a summary task", () => {
    const result = canCutCellValue("type", makeTask({ type: "summary" }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("summary");
  });

  it("should allow cutting type from a regular task", () => {
    expect(canCutCellValue("type", makeTask({ type: "task" })).valid).toBe(true);
  });

  it("should allow cutting type from a milestone", () => {
    expect(canCutCellValue("type", makeTask({ type: "milestone" })).valid).toBe(true);
  });

  it("should allow cutting any other field from a summary task", () => {
    const summary = makeTask({ type: "summary" });
    const fields = ["name", "startDate", "endDate", "duration", "progress", "color"] as const;
    for (const field of fields) {
      expect(canCutCellValue(field, summary).valid).toBe(true);
    }
  });

  it("should allow cutting any field from a regular task", () => {
    const task = makeTask();
    const fields = ["name", "startDate", "endDate", "duration", "progress", "color", "type"] as const;
    for (const field of fields) {
      expect(canCutCellValue(field, task).valid).toBe(true);
    }
  });
});

describe("getClearValueForField", () => {
  it("should return empty string for name", () => {
    expect(getClearValueForField("name")).toBe("");
  });

  it("should return empty string for startDate", () => {
    expect(getClearValueForField("startDate")).toBe("");
  });

  it("should return empty string for endDate", () => {
    expect(getClearValueForField("endDate")).toBe("");
  });

  it("should return 0 for duration", () => {
    expect(getClearValueForField("duration")).toBe(0);
  });

  it("should return 0 for progress", () => {
    expect(getClearValueForField("progress")).toBe(0);
  });

  it("should return DEFAULT_TASK_COLOR for color", () => {
    expect(getClearValueForField("color")).toBe(DEFAULT_TASK_COLOR);
  });

  it("should return 'task' for type", () => {
    expect(getClearValueForField("type")).toBe("task");
  });
});
