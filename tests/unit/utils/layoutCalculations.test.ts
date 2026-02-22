/**
 * Unit tests for layoutCalculations utility
 */

import { describe, it, expect } from "vitest";
import {
  calculateLayoutDimensions,
  type LayoutDimensionsInput,
} from "../../../src/utils/layoutCalculations";
import {
  HEADER_HEIGHT,
  SCROLLBAR_HEIGHT,
  MIN_OVERFLOW,
  PLACEHOLDER_ROW_COUNT,
} from "../../../src/config/layoutConstants";

describe("calculateLayoutDimensions", () => {
  const defaults: LayoutDimensionsInput = {
    taskCount: 10,
    rowHeight: 36,
    viewportHeight: 600,
    scaleTotalWidth: 2000,
    containerWidth: 800,
  };

  describe("totalContentHeight", () => {
    it("should include task rows, placeholder row, header, and scrollbar", () => {
      const result = calculateLayoutDimensions(defaults);

      const expected =
        (defaults.taskCount + PLACEHOLDER_ROW_COUNT) * defaults.rowHeight +
        HEADER_HEIGHT +
        SCROLLBAR_HEIGHT;
      expect(result.totalContentHeight).toBe(expected);
    });

    it("should account for placeholder row even with zero tasks", () => {
      const result = calculateLayoutDimensions({ ...defaults, taskCount: 0 });

      const expected =
        PLACEHOLDER_ROW_COUNT * defaults.rowHeight +
        HEADER_HEIGHT +
        SCROLLBAR_HEIGHT;
      expect(result.totalContentHeight).toBe(expected);
    });

    it("should scale with row height", () => {
      const small = calculateLayoutDimensions({
        ...defaults,
        rowHeight: 28,
      });
      const large = calculateLayoutDimensions({
        ...defaults,
        rowHeight: 44,
      });

      expect(large.totalContentHeight).toBeGreaterThan(
        small.totalContentHeight
      );
    });
  });

  describe("timelineHeaderWidth", () => {
    it("should use scaleTotalWidth when larger than container + overflow", () => {
      const result = calculateLayoutDimensions({
        ...defaults,
        scaleTotalWidth: 5000,
        containerWidth: 800,
      });

      expect(result.timelineHeaderWidth).toBe(5000);
    });

    it("should use container + MIN_OVERFLOW when larger than scaleTotalWidth", () => {
      const result = calculateLayoutDimensions({
        ...defaults,
        scaleTotalWidth: 500,
        containerWidth: 1000,
      });

      expect(result.timelineHeaderWidth).toBe(1000 + MIN_OVERFLOW);
    });

    it("should use container + MIN_OVERFLOW when scale is null", () => {
      const result = calculateLayoutDimensions({
        ...defaults,
        scaleTotalWidth: null,
      });

      expect(result.timelineHeaderWidth).toBe(
        defaults.containerWidth + MIN_OVERFLOW
      );
    });
  });

  describe("contentAreaHeight", () => {
    it("should subtract header height from viewport height", () => {
      const result = calculateLayoutDimensions(defaults);

      expect(result.contentAreaHeight).toBe(
        defaults.viewportHeight - HEADER_HEIGHT
      );
    });

    it("should handle small viewport heights", () => {
      const result = calculateLayoutDimensions({
        ...defaults,
        viewportHeight: 100,
      });

      expect(result.contentAreaHeight).toBe(100 - HEADER_HEIGHT);
    });
  });
});
