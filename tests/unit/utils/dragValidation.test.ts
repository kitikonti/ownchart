import { describe, it, expect } from "vitest";
import { validateDragOperation } from "../../../src/utils/dragValidation";
import type { Task } from "../../../src/types/chart.types";

// Helper to create a minimal task
function createTask(
  id: string,
  name: string,
  options: Partial<Task> = {}
): Task {
  return {
    id,
    name,
    startDate: "2025-01-01",
    endDate: "2025-01-05",
    duration: 5,
    progress: 0,
    color: "#3b82f6",
    order: 0,
    metadata: {},
    type: "task",
    ...options,
  };
}

describe("validateDragOperation", () => {
  describe("regular tasks", () => {
    it("should return valid for a normal drag operation", () => {
      const task = createTask("1", "Task 1");

      const result = validateDragOperation(task, "2025-01-06", "2025-01-10");

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return invalid when end date is before start date", () => {
      const task = createTask("1", "Task 1");

      const result = validateDragOperation(task, "2025-01-10", "2025-01-05");

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should return invalid when duration is less than 1 day", () => {
      const task = createTask("1", "Task 1");

      // Same date means 0 days duration using calculateDuration logic
      const result = validateDragOperation(task, "2025-01-10", "2025-01-09");

      expect(result.valid).toBe(false);
    });

    it("should return valid for 1-day task", () => {
      const task = createTask("1", "Task 1", {
        startDate: "2025-01-01",
        endDate: "2025-01-01",
        duration: 1,
      });

      const result = validateDragOperation(task, "2025-01-10", "2025-01-10");

      expect(result.valid).toBe(true);
    });
  });

  describe("summary tasks", () => {
    it("should allow dragging summary tasks", () => {
      const summaryTask = createTask("1", "Summary", {
        type: "summary",
        startDate: "2025-01-01",
        endDate: "2025-01-10",
      });

      const result = validateDragOperation(summaryTask, "2025-01-05", "2025-01-14");

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should not apply minimum duration check to summary tasks", () => {
      const summaryTask = createTask("1", "Summary", {
        type: "summary",
        startDate: "2025-01-01",
        endDate: "2025-01-10",
      });

      // Even with same start/end (which would fail for regular tasks),
      // summaries should pass because they auto-calculate from children
      const result = validateDragOperation(summaryTask, "2025-01-05", "2025-01-05");

      // This should still be valid for summaries because they skip the duration check
      expect(result.valid).toBe(true);
    });

    it("should still validate basic date format for summary tasks", () => {
      const summaryTask = createTask("1", "Summary", {
        type: "summary",
      });

      // Empty dates should fail basic validation
      const result = validateDragOperation(summaryTask, "", "2025-01-10");

      expect(result.valid).toBe(false);
    });
  });

  describe("milestones", () => {
    it("should allow dragging milestones", () => {
      const milestone = createTask("1", "Milestone", {
        type: "milestone",
        startDate: "2025-01-01",
        endDate: "",
        duration: 0,
      });

      const result = validateDragOperation(milestone, "2025-01-10", "");

      expect(result.valid).toBe(true);
    });

    it("should not apply minimum duration check to milestones", () => {
      const milestone = createTask("1", "Milestone", {
        type: "milestone",
        startDate: "2025-01-01",
        endDate: "",
        duration: 0,
      });

      // Milestones have duration 0 by definition
      const result = validateDragOperation(milestone, "2025-01-10", "");

      expect(result.valid).toBe(true);
    });
  });

  describe("date validation", () => {
    it("should return invalid for empty start date", () => {
      const task = createTask("1", "Task 1");

      const result = validateDragOperation(task, "", "2025-01-10");

      expect(result.valid).toBe(false);
    });

    it("should return invalid for empty end date on regular task", () => {
      const task = createTask("1", "Task 1");

      const result = validateDragOperation(task, "2025-01-05", "");

      expect(result.valid).toBe(false);
    });

    it("should handle tasks moving across month boundaries", () => {
      const task = createTask("1", "Task 1");

      const result = validateDragOperation(task, "2025-01-28", "2025-02-03");

      expect(result.valid).toBe(true);
    });

    it("should handle tasks moving across year boundaries", () => {
      const task = createTask("1", "Task 1");

      const result = validateDragOperation(task, "2024-12-28", "2025-01-03");

      expect(result.valid).toBe(true);
    });
  });
});
