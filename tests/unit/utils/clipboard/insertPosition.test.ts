import { describe, it, expect } from "vitest";
import { determineInsertPosition } from "../../../../src/utils/clipboard/insertPosition";
import type { Task } from "../../../../src/types/chart.types";
import type { FlattenedTask } from "../../../../src/utils/hierarchy";

// Special placeholder ID (must match the one in insertPosition.ts)
const PLACEHOLDER_TASK_ID = "__new_task_placeholder__";

// Helper to create test tasks
const createTask = (id: string, name: string): Task => ({
  id,
  name,
  startDate: "2025-01-01",
  endDate: "2025-01-07",
  duration: 7,
  progress: 0,
  color: "#3b82f6",
  order: 0,
  type: "task",
  metadata: {},
});

// Helper to create flattened task entry
const createFlattenedTask = (
  id: string,
  level: number = 0,
  hasChildren: boolean = false
): FlattenedTask => ({
  task: createTask(id, `Task ${id}`),
  level,
  hasChildren,
});

describe("determineInsertPosition", () => {
  describe("priority 1: placeholder row", () => {
    it("should return end position when placeholder is active", () => {
      const flattenedTasks = [
        createFlattenedTask("1"),
        createFlattenedTask("2"),
      ];

      const result = determineInsertPosition(
        { taskId: PLACEHOLDER_TASK_ID },
        [],
        flattenedTasks
      );

      expect(result).toBe(2); // End of list
    });

    it("should return end position when only placeholder is selected", () => {
      const flattenedTasks = [
        createFlattenedTask("1"),
        createFlattenedTask("2"),
      ];

      const result = determineInsertPosition(
        { taskId: null },
        [PLACEHOLDER_TASK_ID],
        flattenedTasks
      );

      expect(result).toBe(2); // End of list
    });

    it("should prioritize active cell over selection including placeholder", () => {
      const flattenedTasks = [
        createFlattenedTask("1"),
        createFlattenedTask("2"),
      ];

      // Placeholder active takes priority
      const result = determineInsertPosition(
        { taskId: PLACEHOLDER_TASK_ID },
        ["1", PLACEHOLDER_TASK_ID],
        flattenedTasks
      );

      expect(result).toBe(2); // End of list (placeholder takes priority)
    });
  });

  describe("priority 2: active cell row", () => {
    it("should return index of active row (insert before)", () => {
      const flattenedTasks = [
        createFlattenedTask("1"),
        createFlattenedTask("2"),
        createFlattenedTask("3"),
      ];

      const result = determineInsertPosition(
        { taskId: "2" },
        [],
        flattenedTasks
      );

      expect(result).toBe(1); // Insert before task 2 (index 1)
    });

    it("should handle active cell as first row", () => {
      const flattenedTasks = [
        createFlattenedTask("1"),
        createFlattenedTask("2"),
      ];

      const result = determineInsertPosition(
        { taskId: "1" },
        [],
        flattenedTasks
      );

      expect(result).toBe(0); // Insert at beginning
    });

    it("should handle active cell as last row", () => {
      const flattenedTasks = [
        createFlattenedTask("1"),
        createFlattenedTask("2"),
      ];

      const result = determineInsertPosition(
        { taskId: "2" },
        [],
        flattenedTasks
      );

      expect(result).toBe(1); // Insert before last row
    });

    it("should prioritize active cell over selection", () => {
      const flattenedTasks = [
        createFlattenedTask("1"),
        createFlattenedTask("2"),
        createFlattenedTask("3"),
      ];

      const result = determineInsertPosition(
        { taskId: "1" },
        ["3"], // Selection at end
        flattenedTasks
      );

      expect(result).toBe(0); // Active cell takes priority
    });
  });

  describe("priority 3: last selected row", () => {
    it("should return position after last selected row", () => {
      const flattenedTasks = [
        createFlattenedTask("1"),
        createFlattenedTask("2"),
        createFlattenedTask("3"),
      ];

      const result = determineInsertPosition(
        { taskId: null },
        ["1", "2"],
        flattenedTasks
      );

      expect(result).toBe(2); // After task 2 (index 1 + 1)
    });

    it("should handle single selected row", () => {
      const flattenedTasks = [
        createFlattenedTask("1"),
        createFlattenedTask("2"),
      ];

      const result = determineInsertPosition(
        { taskId: null },
        ["1"],
        flattenedTasks
      );

      expect(result).toBe(1); // After task 1
    });

    it("should filter out placeholder from selection when finding last", () => {
      const flattenedTasks = [
        createFlattenedTask("1"),
        createFlattenedTask("2"),
      ];

      const result = determineInsertPosition(
        { taskId: null },
        ["1", PLACEHOLDER_TASK_ID],
        flattenedTasks
      );

      expect(result).toBe(1); // After task 1 (placeholder filtered out)
    });

    it("should handle selected row at end of list", () => {
      const flattenedTasks = [
        createFlattenedTask("1"),
        createFlattenedTask("2"),
      ];

      const result = determineInsertPosition(
        { taskId: null },
        ["2"],
        flattenedTasks
      );

      expect(result).toBe(2); // After last row = end of list
    });
  });

  describe("priority 4: end of list (default)", () => {
    it("should return end position when no active cell and no selection", () => {
      const flattenedTasks = [
        createFlattenedTask("1"),
        createFlattenedTask("2"),
      ];

      const result = determineInsertPosition(
        { taskId: null },
        [],
        flattenedTasks
      );

      expect(result).toBe(2); // End of list
    });

    it("should return 0 for empty list", () => {
      const result = determineInsertPosition({ taskId: null }, [], []);

      expect(result).toBe(0);
    });

    it("should return end when active task not found in flattened list", () => {
      const flattenedTasks = [
        createFlattenedTask("1"),
        createFlattenedTask("2"),
      ];

      const result = determineInsertPosition(
        { taskId: "nonexistent" },
        [],
        flattenedTasks
      );

      expect(result).toBe(2); // Falls through to end
    });

    it("should return end when selected tasks not found in flattened list", () => {
      const flattenedTasks = [
        createFlattenedTask("1"),
        createFlattenedTask("2"),
      ];

      const result = determineInsertPosition(
        { taskId: null },
        ["nonexistent1", "nonexistent2"],
        flattenedTasks
      );

      expect(result).toBe(2); // Falls through to end
    });
  });

  describe("edge cases", () => {
    it("should handle hierarchical tasks correctly", () => {
      const flattenedTasks = [
        createFlattenedTask("parent", 0, true),
        createFlattenedTask("child1", 1, false),
        createFlattenedTask("child2", 1, false),
        createFlattenedTask("sibling", 0, false),
      ];

      const result = determineInsertPosition(
        { taskId: "child2" },
        [],
        flattenedTasks
      );

      expect(result).toBe(2); // Insert before child2 (its index)
    });
  });
});
