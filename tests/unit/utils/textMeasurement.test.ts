/**
 * Unit tests for Text Measurement Utilities
 * Tests for measureTextWidth, getMaxLabelWidth, calculateColumnWidth, and calculateLabelPaddingDays
 */

import { describe, it, expect } from "vitest";
import {
  measureTextWidth,
  getMaxLabelWidth,
  calculateColumnWidth,
  calculateLabelPaddingDays,
} from "../../../src/utils/textMeasurement";
import type { Task } from "../../../src/types/chart.types";

// Helper to create test tasks
function createTask(name: string, overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${name}`,
    name,
    startDate: "2026-01-01",
    endDate: "2026-01-10",
    duration: 10,
    progress: 0,
    color: "#0d9488",
    order: 0,
    metadata: {},
    ...overrides,
  };
}

describe("textMeasurement", () => {
  describe("measureTextWidth", () => {
    it("should return 0 for empty string", () => {
      expect(measureTextWidth("", 12)).toBe(0);
    });

    it("should return positive value for non-empty text", () => {
      const width = measureTextWidth("Test Task", 12);
      expect(width).toBeGreaterThan(0);
    });

    it("should return larger width for longer text", () => {
      const shortWidth = measureTextWidth("Short", 12);
      const longWidth = measureTextWidth("This is a much longer task name", 12);
      expect(longWidth).toBeGreaterThan(shortWidth);
    });

    it("should return larger width for larger font size", () => {
      const smallFont = measureTextWidth("Test", 10);
      const largeFont = measureTextWidth("Test", 16);
      expect(largeFont).toBeGreaterThan(smallFont);
    });

    it("should handle special characters", () => {
      const width = measureTextWidth("Task with special: äöü & symbols!", 12);
      expect(width).toBeGreaterThan(0);
    });

    it("should return a larger width when letterSpacing is applied", () => {
      const withoutSpacing = measureTextWidth("Hello", 12, undefined, 400, 0);
      const withSpacing = measureTextWidth("Hello", 12, undefined, 400, 0.1);
      expect(withSpacing).toBeGreaterThan(withoutSpacing);
    });

    it("should not add letter spacing for a single character", () => {
      // n-1 gaps for n characters: a single char has 0 gaps, so spacing has no effect
      const withoutSpacing = measureTextWidth("A", 12, undefined, 400, 0);
      const withSpacing = measureTextWidth("A", 12, undefined, 400, 0.5);
      expect(withSpacing).toBe(withoutSpacing);
    });
  });

  describe("getMaxLabelWidth", () => {
    it("should return 0 for empty array", () => {
      expect(getMaxLabelWidth([], 12)).toBe(0);
    });

    it("should return correct width for single task", () => {
      const tasks = [createTask("Single Task")];
      const width = getMaxLabelWidth(tasks, 12);
      expect(width).toBeGreaterThan(0);
    });

    it("should return max width among multiple tasks", () => {
      const tasks = [
        createTask("Short"),
        createTask("This is a very long task name that should be the longest"),
        createTask("Medium length"),
      ];
      const maxWidth = getMaxLabelWidth(tasks, 12);
      const longestWidth = measureTextWidth(
        "This is a very long task name that should be the longest",
        12
      );
      expect(maxWidth).toBe(longestWidth);
    });

    it("should handle tasks with empty names", () => {
      const tasks = [createTask(""), createTask("Has Name")];
      const width = getMaxLabelWidth(tasks, 12);
      expect(width).toBe(measureTextWidth("Has Name", 12));
    });
  });

  describe("calculateColumnWidth", () => {
    // In test environments the Canvas API is unavailable, so measureTextWidth uses
    // the FALLBACK_CHAR_WIDTH_RATIO (0.6) heuristic: width ≈ chars × fontSize × 0.6.
    // Tests use relative assertions to stay independent of the exact heuristic value.

    it("should return a positive width for a non-empty header", () => {
      expect(calculateColumnWidth("Name", [], 13, 16)).toBeGreaterThan(0);
    });

    it("should enforce the minimum width of 60px", () => {
      // Empty header and no cell values → raw width is 0 → clamped to 60
      expect(calculateColumnWidth("", [], 13, 0)).toBe(60);
    });

    it("should enforce the maximum width of 600px", () => {
      // Extremely long cell value should be capped
      const longValue = "A".repeat(500);
      const width = calculateColumnWidth("H", [longValue], 13, 16);
      expect(width).toBe(600);
    });

    it("should use cell width when it exceeds header width", () => {
      const shortHeader = "N";
      const longCell = "This is a very long cell value that exceeds the header";
      const width = calculateColumnWidth(shortHeader, [longCell], 13, 16);
      const headerOnlyWidth = calculateColumnWidth(shortHeader, [], 13, 16);
      expect(width).toBeGreaterThan(headerOnlyWidth);
    });

    it("should use header width when no cells are provided", () => {
      const width = calculateColumnWidth("Status", [], 13, 16);
      expect(width).toBeGreaterThanOrEqual(60);
    });

    it("should add extraWidths to the corresponding cell measurement", () => {
      const cellValue = "Task name";
      const widthWithoutExtra = calculateColumnWidth(
        "Name",
        [cellValue],
        13,
        16,
        [0]
      );
      const widthWithExtra = calculateColumnWidth(
        "Name",
        [cellValue],
        13,
        16,
        [50]
      );
      expect(widthWithExtra).toBeGreaterThan(widthWithoutExtra);
    });

    it("should treat a missing extraWidths entry the same as 0", () => {
      const cellValue = "Task name";
      // Passing an empty extraWidths array vs omitting the argument entirely
      const widthNoArray = calculateColumnWidth("Name", [cellValue], 13, 16);
      const widthEmptyArray = calculateColumnWidth(
        "Name",
        [cellValue],
        13,
        16,
        []
      );
      expect(widthNoArray).toBe(widthEmptyArray);
    });

    it("should pick the widest cell when multiple cells are provided", () => {
      const cells = ["Short", "Medium length value", "A"];
      const width = calculateColumnWidth("Col", cells, 13, 16);
      const widthOfWidest = calculateColumnWidth(
        "Col",
        ["Medium length value"],
        13,
        16
      );
      expect(width).toBe(widthOfWidest);
    });

    it("should return a larger width for larger font size", () => {
      const cells = ["Task name"];
      const smallFont = calculateColumnWidth("Name", cells, 10, 16);
      const largeFont = calculateColumnWidth("Name", cells, 18, 16);
      expect(largeFont).toBeGreaterThanOrEqual(smallFont);
    });
  });

  describe("calculateLabelPaddingDays", () => {
    const sampleTasks = [
      createTask("Task One"),
      createTask("Task Two - Longer Name"),
    ];
    const fontSize = 12;
    const pixelsPerDay = 25; // 100% zoom

    describe("position: inside", () => {
      it("should return zero padding for regular tasks", () => {
        const result = calculateLabelPaddingDays(
          sampleTasks,
          "inside",
          fontSize,
          pixelsPerDay
        );
        expect(result).toEqual({ leftDays: 0, rightDays: 0 });
      });

      it("should treat summary tasks as 'after' when position is inside", () => {
        const tasks = [createTask("My Summary", { type: "summary" })];
        const result = calculateLabelPaddingDays(
          tasks,
          "inside",
          fontSize,
          pixelsPerDay
        );
        // Summary doesn't support inside — falls back to after
        expect(result.rightDays).toBeGreaterThan(0);
        expect(result.leftDays).toBe(0);
      });

      it("should treat milestone tasks as 'after' when position is inside", () => {
        const tasks = [createTask("My Milestone", { type: "milestone" })];
        const result = calculateLabelPaddingDays(
          tasks,
          "inside",
          fontSize,
          pixelsPerDay
        );
        expect(result.rightDays).toBeGreaterThan(0);
        expect(result.leftDays).toBe(0);
      });
    });

    describe("position: none", () => {
      it("should return zero padding", () => {
        const result = calculateLabelPaddingDays(
          sampleTasks,
          "none",
          fontSize,
          pixelsPerDay
        );
        expect(result).toEqual({ leftDays: 0, rightDays: 0 });
      });
    });

    describe("position: before", () => {
      it("should return leftDays > 0 and rightDays = 0", () => {
        const result = calculateLabelPaddingDays(
          sampleTasks,
          "before",
          fontSize,
          pixelsPerDay
        );
        expect(result.leftDays).toBeGreaterThan(0);
        expect(result.rightDays).toBe(0);
      });

      it("should increase padding for longer task names", () => {
        const shortTasks = [createTask("A")];
        const longTasks = [createTask("A Very Long Task Name Indeed")];

        const shortPadding = calculateLabelPaddingDays(
          shortTasks,
          "before",
          fontSize,
          pixelsPerDay
        );
        const longPadding = calculateLabelPaddingDays(
          longTasks,
          "before",
          fontSize,
          pixelsPerDay
        );

        expect(longPadding.leftDays).toBeGreaterThanOrEqual(
          shortPadding.leftDays
        );
      });
    });

    describe("position: after", () => {
      it("should return rightDays > 0 and leftDays = 0", () => {
        const result = calculateLabelPaddingDays(
          sampleTasks,
          "after",
          fontSize,
          pixelsPerDay
        );
        expect(result.leftDays).toBe(0);
        expect(result.rightDays).toBeGreaterThan(0);
      });

      it("should increase padding for longer task names", () => {
        const shortTasks = [createTask("A")];
        const longTasks = [createTask("A Very Long Task Name Indeed")];

        const shortPadding = calculateLabelPaddingDays(
          shortTasks,
          "after",
          fontSize,
          pixelsPerDay
        );
        const longPadding = calculateLabelPaddingDays(
          longTasks,
          "after",
          fontSize,
          pixelsPerDay
        );

        expect(longPadding.rightDays).toBeGreaterThanOrEqual(
          shortPadding.rightDays
        );
      });
    });

    describe("edge cases", () => {
      it("should return zero for empty task array", () => {
        const result = calculateLabelPaddingDays(
          [],
          "after",
          fontSize,
          pixelsPerDay
        );
        expect(result).toEqual({ leftDays: 0, rightDays: 0 });
      });

      it("should return zero for pixelsPerDay <= 0", () => {
        const result = calculateLabelPaddingDays(
          sampleTasks,
          "after",
          fontSize,
          0
        );
        expect(result).toEqual({ leftDays: 0, rightDays: 0 });
      });

      it("should increase days at lower zoom (fewer pixels per day)", () => {
        const highZoom = calculateLabelPaddingDays(
          sampleTasks,
          "after",
          fontSize,
          50 // 200% zoom
        );
        const lowZoom = calculateLabelPaddingDays(
          sampleTasks,
          "after",
          fontSize,
          12.5 // 50% zoom
        );

        // At lower zoom, same pixel width needs more days
        expect(lowZoom.rightDays).toBeGreaterThan(highZoom.rightDays);
      });

      it("should cap padding at maximum value", () => {
        // Create a task with extremely long name
        const longTasks = [
          createTask(
            "This is an extremely long task name that would require a lot of space to render fully on screen without any truncation whatsoever"
          ),
        ];

        const result = calculateLabelPaddingDays(
          longTasks,
          "after",
          fontSize,
          pixelsPerDay
        );

        // Max is 250px / 25 pixels per day = 10 days max
        expect(result.rightDays).toBeLessThanOrEqual(10);
      });
    });
  });
});
