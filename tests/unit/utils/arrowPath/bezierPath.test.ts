/**
 * Unit tests for arrow path calculation.
 * Sprint 1.4 - Dependencies
 */

import { describe, it, expect } from "vitest";
import {
  calculateArrowPath,
  calculateDragPath,
  getArrowheadPoints,
} from "../../../../src/utils/arrowPath/bezierPath";
import type { TaskPosition } from "../../../../src/types/dependency.types";

// Helper to create task position
function pos(x: number, y: number, width: number, height: number): TaskPosition {
  return { x, y, width, height };
}

describe("calculateArrowPath", () => {
  describe("elbow path (large gap)", () => {
    it("should return valid path when horizontal gap >= 46px", () => {
      const fromPos = pos(0, 100, 100, 30); // ends at x=100
      const toPos = pos(200, 100, 100, 30); // starts at x=200 (gap = 100px)

      const result = calculateArrowPath(fromPos, toPos);

      expect(result.path).toContain("M 100"); // starts at fromPos right edge
      expect(result.path).toContain("L 200"); // ends at toPos left edge
      expect(result.arrowHead.x).toBe(200);
      expect(result.arrowHead.angle).toBe(0); // pointing right
    });

    it("should draw straight line for same-row tasks", () => {
      const fromPos = pos(0, 100, 100, 30);
      const toPos = pos(200, 100, 100, 30); // same Y

      const result = calculateArrowPath(fromPos, toPos);

      // Should be a simple horizontal line
      expect(result.path).toMatch(/M 100 115 L 200 115/);
    });

    it("should create elbow going down when target is below", () => {
      const fromPos = pos(0, 100, 100, 30); // centerY = 115
      const toPos = pos(200, 200, 100, 30); // centerY = 215 (below)

      const result = calculateArrowPath(fromPos, toPos);

      // Path should contain Q commands for curves
      expect(result.path).toContain("Q ");
      expect(result.arrowHead.y).toBe(215);
    });

    it("should create elbow going up when target is above", () => {
      const fromPos = pos(0, 200, 100, 30); // centerY = 215
      const toPos = pos(200, 100, 100, 30); // centerY = 115 (above)

      const result = calculateArrowPath(fromPos, toPos);

      expect(result.path).toContain("Q ");
      expect(result.arrowHead.y).toBe(115);
    });
  });

  describe("S-curve path (small/negative gap)", () => {
    it("should use S-curve when horizontal gap < 46px", () => {
      const fromPos = pos(0, 100, 100, 30); // ends at x=100
      const toPos = pos(120, 200, 100, 30); // starts at x=120 (gap = 20px)

      const result = calculateArrowPath(fromPos, toPos);

      // Should have multiple Q commands for 4-corner S-curve
      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBeGreaterThanOrEqual(2);
    });

    it("should use S-curve for overlapping tasks (negative gap)", () => {
      const fromPos = pos(0, 100, 150, 30); // ends at x=150
      const toPos = pos(100, 200, 100, 30); // starts at x=100 (overlap!)

      const result = calculateArrowPath(fromPos, toPos);

      expect(result.path).toBeDefined();
      expect(result.arrowHead.x).toBe(100);
    });

    it("should handle same-row tasks with small gap", () => {
      const fromPos = pos(0, 100, 100, 30);
      const toPos = pos(110, 100, 100, 30); // gap = 10px, same row

      const result = calculateArrowPath(fromPos, toPos);

      // Should still produce a valid path
      expect(result.path).toContain("M ");
      expect(result.arrowHead.x).toBe(110);
    });
  });

  describe("arrowhead position", () => {
    it("should position arrowhead at target task left edge", () => {
      const fromPos = pos(0, 100, 100, 30);
      const toPos = pos(200, 150, 80, 40);

      const result = calculateArrowPath(fromPos, toPos);

      expect(result.arrowHead.x).toBe(200); // toPos.x
      expect(result.arrowHead.y).toBe(170); // toPos.y + toPos.height/2
    });

    it("should always have angle 0 (pointing right)", () => {
      const fromPos = pos(0, 100, 100, 30);
      const toPos = pos(200, 50, 100, 30);

      const result = calculateArrowPath(fromPos, toPos);

      expect(result.arrowHead.angle).toBe(0);
    });
  });
});

describe("calculateDragPath", () => {
  it("should use elbow path for large horizontal distances", () => {
    const path = calculateDragPath(100, 100, 200, 150);

    expect(path).toContain("Q "); // Has curves
    expect(path).toContain("M 100 100"); // Starts at correct point
  });

  it("should use simple line for short distances", () => {
    const path = calculateDragPath(100, 100, 110, 110);

    expect(path).toBe("M 100 100 L 110 110");
  });

  it("should use simple line for backwards drag", () => {
    const path = calculateDragPath(200, 100, 100, 150);

    expect(path).toBe("M 200 100 L 100 150");
  });
});

describe("getArrowheadPoints", () => {
  it("should return valid polygon points with default size", () => {
    const points = getArrowheadPoints();

    expect(points).toBe("-8,-4 0,0 -8,4");
  });

  it("should respect custom size parameter", () => {
    const points = getArrowheadPoints(10);

    expect(points).toBe("-10,-5 0,0 -10,5");
  });

  it("should handle small sizes", () => {
    const points = getArrowheadPoints(4);

    expect(points).toBe("-4,-2 0,0 -4,2");
  });
});
