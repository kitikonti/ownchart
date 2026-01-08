/**
 * Unit tests for Text Measurement Utilities
 * Tests for measureTextWidth, getMaxLabelWidth, and calculateLabelPaddingDays
 */

import { describe, it, expect } from "vitest";
import {
  measureTextWidth,
  getMaxLabelWidth,
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

  describe("calculateLabelPaddingDays", () => {
    const sampleTasks = [
      createTask("Task One"),
      createTask("Task Two - Longer Name"),
    ];
    const fontSize = 12;
    const pixelsPerDay = 25; // 100% zoom

    describe("position: inside", () => {
      it("should return zero padding", () => {
        const result = calculateLabelPaddingDays(
          sampleTasks,
          "inside",
          fontSize,
          pixelsPerDay
        );
        expect(result).toEqual({ leftDays: 0, rightDays: 0 });
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
