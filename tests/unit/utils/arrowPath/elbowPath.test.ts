/**
 * Unit tests for arrow path calculation.
 * Sprint 1.4 - Dependencies
 */

import { describe, it, expect } from "vitest";
import {
  calculateArrowPath,
  calculateDragPath,
  getArrowheadPoints,
} from "../../../../src/utils/arrowPath/elbowPath";
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

    it("should fall back to simple elbow in transition case (gap 20px, default rowHeight → threshold 14–46px)", () => {
      // gap = 20px → in the compact-elbow zone (HORIZONTAL_SEGMENT*2 − r*2 ≤ gap < minGapForElbow)
      // firstVerticalX - r <= secondVerticalX + r → falls back to calculateSimpleElbow (2 Q corners, not 4)
      const fromPos = pos(0, 100, 100, 30); // ends at x=100, centerY=115
      const toPos = pos(120, 200, 100, 30); // starts at x=120, centerY=215 (gap=20px)

      const result = calculateArrowPath(fromPos, toPos);

      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(2); // simple elbow: 2 corners, not 4
      expect(result.path).toContain("M 100 115");
      expect(result.path).toContain("L 120 215");
    });

    it("should extend routing beyond tasks when vertically too close for clean curves", () => {
      // Overlapping tasks that are also close vertically — middleY must extend beyond bounds
      const fromPos = pos(0, 100, 150, 30); // ends at x=150, centerY=115
      const toPos = pos(60, 110, 100, 30);  // starts at x=60 (overlap!), centerY=125

      const result = calculateArrowPath(fromPos, toPos);

      // Should produce a 4-corner S-curve
      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(4);

      // The middleY routing must extend below both tasks. With default rowHeight=44:
      //   cornerRadius = max(4, round(8 * 44/44)) = 8
      //   minSpaceForCurves = 4 * 8 = 32
      //   verticalDistance = |115 - 125| = 10 < 32 → offset kicks in
      //   offset = max(32 / 2, 44 * 0.4) = max(16, 17.6) = 17.6
      //   middleY = max(115, 125) + 17.6 = 142.6
      expect(result.path).toContain("142.6");
      expect(result.arrowHead.x).toBe(60);
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

  describe("rowHeight scaling", () => {
    it("should scale corner radius with rowHeight", () => {
      const fromPos = pos(0, 100, 100, 30);
      const toPos = pos(200, 200, 100, 30);

      const smallRowResult = calculateArrowPath(fromPos, toPos, 22); // half BASE_ROW_HEIGHT
      const largeRowResult = calculateArrowPath(fromPos, toPos, 88); // double BASE_ROW_HEIGHT

      // Both produce valid curved paths
      expect(smallRowResult.path).toContain("Q ");
      expect(largeRowResult.path).toContain("Q ");

      // Paths differ because corner radius changes with row height
      expect(smallRowResult.path).not.toBe(largeRowResult.path);
    });

    it("should enforce minimum corner radius for very small row heights", () => {
      const fromPos = pos(0, 100, 100, 30);
      const toPos = pos(200, 200, 100, 30);

      // Very small rowHeight — corner radius floors at MIN_CORNER_RADIUS_PX (4)
      const result = calculateArrowPath(fromPos, toPos, 10);

      expect(result.path).toContain("Q ");
      expect(result.arrowHead.x).toBe(200);
    });

    it("should not produce negative corner radius at large rowHeight with near-zero gap", () => {
      // rowHeight=90 → cornerRadius=round(8*90/44)=16
      // minGapForElbow = 15*2 + 16*2 = 62  → calculateRoutedPath fires (gap=-1 < 62)
      // transition check: firstX-r <= secondX+r → (100+15-16) <= (99-15+16) → 99 <= 100 → TRUE
      // → calculateSimpleElbow receives horizontalGap=-1, previously yielding cornerRadius=-0.25
      const fromPos = pos(0, 100, 100, 30); // from.x=100, from.y=115
      const toPos = pos(99, 200, 100, 30);  // to.x=99 (gap=-1), to.y=215

      const result = calculateArrowPath(fromPos, toPos, 90);

      expect(result.path).toMatch(/^M 100 115/);
      // Zero radius degrades to sharp corners — path must not contain negative coordinates
      // that would result from a negative radius being passed to buildTwoCornerPath.
      expect(result.path).not.toMatch(/[LMQ] -\d/);
    });
  });
});

describe("calculateDragPath", () => {
  it("should use elbow path for large horizontal distances", () => {
    const path = calculateDragPath({ x: 100, y: 100 }, { x: 200, y: 150 });

    expect(path).toContain("Q "); // Has curves
    expect(path).toContain("M 100 100"); // Starts at correct point
  });

  it("should use simple line for short distances", () => {
    const path = calculateDragPath({ x: 100, y: 100 }, { x: 110, y: 110 });

    expect(path).toBe("M 100 100 L 110 110");
  });

  it("should use simple line for backwards drag", () => {
    const path = calculateDragPath({ x: 200, y: 100 }, { x: 100, y: 150 });

    expect(path).toBe("M 200 100 L 100 150");
  });

  it("should switch to elbow at the same threshold as calculateArrowPath default", () => {
    // minGapForElbow = HORIZONTAL_SEGMENT*2 + BASE_CORNER_RADIUS*2 = 30 + 16 = 46
    const elbowPath = calculateDragPath({ x: 100, y: 100 }, { x: 146, y: 150 }); // gap = 46 → elbow
    const linePath = calculateDragPath({ x: 100, y: 100 }, { x: 145, y: 150 });  // gap = 45 → straight line

    expect(elbowPath).toContain("Q ");
    expect(linePath).not.toContain("Q ");
  });

  it("should produce straight line when gap is large but Y is the same", () => {
    // gap = 200 ≥ minGapForElbow → calculateElbowPath → isSameRow → straight line
    const path = calculateDragPath({ x: 0, y: 100 }, { x: 200, y: 100 });

    expect(path).toBe("M 0 100 L 200 100");
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
