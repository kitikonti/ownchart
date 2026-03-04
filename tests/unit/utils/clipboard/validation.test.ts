import { describe, it, expect } from "vitest";
import {
  canPasteCellValue,
  canCutCellValue,
  getClearValueForField,
} from "../../../../src/utils/clipboard/validation";
import { DEFAULT_TASK_COLOR } from "../../../../src/styles/design-tokens";
import type { Task } from "../../../../src/types/chart.types";

// Helper to create test tasks
const createTask = (type: Task["type"] = "task"): Task => ({
  id: "test",
  name: "Test Task",
  startDate: "2025-01-01",
  endDate: "2025-01-07",
  duration: 7,
  progress: 0,
  color: "#3b82f6",
  order: 0,
  type,
  metadata: {},
});

describe("canPasteCellValue", () => {
  describe("field type matching", () => {
    it("should allow pasting name into name", () => {
      const result = canPasteCellValue("name", "name", createTask());
      expect(result.valid).toBe(true);
    });

    it("should allow pasting startDate into startDate", () => {
      const result = canPasteCellValue("startDate", "startDate", createTask());
      expect(result.valid).toBe(true);
    });

    it("should allow pasting endDate into endDate", () => {
      const result = canPasteCellValue("endDate", "endDate", createTask());
      expect(result.valid).toBe(true);
    });

    it("should allow pasting duration into duration", () => {
      const result = canPasteCellValue("duration", "duration", createTask());
      expect(result.valid).toBe(true);
    });

    it("should allow pasting progress into progress", () => {
      const result = canPasteCellValue("progress", "progress", createTask());
      expect(result.valid).toBe(true);
    });

    it("should allow pasting color into color", () => {
      const result = canPasteCellValue("color", "color", createTask());
      expect(result.valid).toBe(true);
    });

    it("should reject pasting name into startDate", () => {
      const result = canPasteCellValue("name", "startDate", createTask());
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Cannot paste name into startDate");
    });

    it("should reject pasting startDate into name", () => {
      const result = canPasteCellValue("startDate", "name", createTask());
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Cannot paste startDate into name");
    });

    it("should reject pasting duration into progress", () => {
      const result = canPasteCellValue("duration", "progress", createTask());
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Cannot paste duration into progress");
    });
  });

  describe("summary task restrictions", () => {
    it("should reject pasting startDate into summary task", () => {
      const result = canPasteCellValue(
        "startDate",
        "startDate",
        createTask("summary")
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "Cannot paste dates into summary tasks (dates are calculated from children)"
      );
    });

    it("should reject pasting endDate into summary task", () => {
      const result = canPasteCellValue(
        "endDate",
        "endDate",
        createTask("summary")
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "Cannot paste dates into summary tasks (dates are calculated from children)"
      );
    });

    it("should allow pasting name into summary task", () => {
      const result = canPasteCellValue("name", "name", createTask("summary"));
      expect(result.valid).toBe(true);
    });

    it("should allow pasting color into summary task", () => {
      const result = canPasteCellValue("color", "color", createTask("summary"));
      expect(result.valid).toBe(true);
    });
  });

  describe("milestone task restrictions", () => {
    it("should reject pasting duration into milestone task", () => {
      const result = canPasteCellValue(
        "duration",
        "duration",
        createTask("milestone")
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Cannot paste duration into milestone tasks");
    });

    it("should reject pasting progress into milestone task", () => {
      const result = canPasteCellValue(
        "progress",
        "progress",
        createTask("milestone")
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Cannot paste progress into milestone tasks");
    });

    it("should allow pasting name into milestone task", () => {
      const result = canPasteCellValue("name", "name", createTask("milestone"));
      expect(result.valid).toBe(true);
    });

    it("should allow pasting startDate into milestone task", () => {
      const result = canPasteCellValue(
        "startDate",
        "startDate",
        createTask("milestone")
      );
      expect(result.valid).toBe(true);
    });

    it("should allow pasting color into milestone task", () => {
      const result = canPasteCellValue(
        "color",
        "color",
        createTask("milestone")
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("regular task allows all pastes", () => {
    const fields = [
      "name",
      "startDate",
      "endDate",
      "duration",
      "progress",
      "color",
    ] as const;

    fields.forEach((field) => {
      it(`should allow pasting ${field} into regular task`, () => {
        const result = canPasteCellValue(field, field, createTask("task"));
        expect(result.valid).toBe(true);
      });
    });
  });
});

describe("canCutCellValue", () => {
  describe("summary task restrictions", () => {
    it("should reject cutting type from a summary task", () => {
      const result = canCutCellValue("type", createTask("summary"));
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "Cannot cut type from summary tasks (would orphan their children)"
      );
    });

    it("should allow cutting other fields from summary task", () => {
      expect(canCutCellValue("name", createTask("summary")).valid).toBe(true);
      expect(canCutCellValue("color", createTask("summary")).valid).toBe(true);
      expect(canCutCellValue("progress", createTask("summary")).valid).toBe(true);
    });
  });

  describe("date field restrictions", () => {
    it("should reject cutting startDate from a regular task", () => {
      const result = canCutCellValue("startDate", createTask("task"));
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "Cannot cut startDate — tasks must always have a valid date"
      );
    });

    it("should reject cutting endDate from a regular task", () => {
      const result = canCutCellValue("endDate", createTask("task"));
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "Cannot cut endDate — tasks must always have a valid date"
      );
    });

    it("should reject cutting startDate from a milestone task", () => {
      expect(canCutCellValue("startDate", createTask("milestone")).valid).toBe(false);
    });

    it("should reject cutting endDate from a summary task", () => {
      expect(canCutCellValue("endDate", createTask("summary")).valid).toBe(false);
    });
  });

  describe("regular and milestone tasks allow non-date cuts", () => {
    const fields = ["name", "duration", "progress", "color", "type"] as const;

    fields.forEach((field) => {
      it(`should allow cutting ${field} from regular task`, () => {
        expect(canCutCellValue(field, createTask("task")).valid).toBe(true);
      });

      if (field !== "type") {
        it(`should allow cutting ${field} from milestone task`, () => {
          expect(canCutCellValue(field, createTask("milestone")).valid).toBe(true);
        });
      }
    });
  });
});

describe("getClearValueForField", () => {
  it('should return empty string for "name"', () => {
    expect(getClearValueForField("name")).toBe("");
  });

  it('should throw for "startDate" — date fields cannot be cleared', () => {
    expect(() => getClearValueForField("startDate")).toThrow(
      'getClearValueForField("startDate")'
    );
  });

  it('should throw for "endDate" — date fields cannot be cleared', () => {
    expect(() => getClearValueForField("endDate")).toThrow(
      'getClearValueForField("endDate")'
    );
  });

  it('should return 0 for "duration"', () => {
    expect(getClearValueForField("duration")).toBe(0);
  });

  it('should return 0 for "progress"', () => {
    expect(getClearValueForField("progress")).toBe(0);
  });

  it('should return default brand color for "color"', () => {
    expect(getClearValueForField("color")).toBe(DEFAULT_TASK_COLOR);
  });

  it('should return "task" for "type"', () => {
    expect(getClearValueForField("type")).toBe("task");
  });
});
