/**
 * Unit tests for arrow path calculation.
 * Sprint 1.4 - Dependencies
 */

import { describe, it, expect } from "vitest";
import {
  ARROWHEAD_SIZE,
  calculateArrowPath,
  calculateDragPath,
  getArrowheadPoints,
} from "../../../../src/utils/arrowPath/elbowPath";
import type { TaskPosition } from "../../../../src/types/dependency.types";

// Helper to create task position
function pos(x: number, y: number, width: number, height: number): TaskPosition {
  return { x, y, width, height };
}

describe("ARROWHEAD_SIZE", () => {
  it("should equal 8", () => {
    expect(ARROWHEAD_SIZE).toBe(8);
  });
});

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

    it("treats rows within SAME_ROW_THRESHOLD_PX as same-row (straight line)", () => {
      // from.y = 100 + 30/2 = 115, to.y = 101 + 30/2 = 116, |diff| = 1 < SAME_ROW_THRESHOLD_PX(2)
      const fromPos = pos(0, 100, 100, 30);
      const toPos = pos(200, 101, 100, 30);

      const result = calculateArrowPath(fromPos, toPos);

      expect(result.path).not.toContain("Q ");
      expect(result.path).toMatch(/M 100 115 L 200 116/);
    });

    it("curves when vertical offset meets SAME_ROW_THRESHOLD_PX (exclusive)", () => {
      // from.y = 115, to.y = 102 + 30/2 = 117, |diff| = 2 = SAME_ROW_THRESHOLD_PX → not same-row (exclusive bound)
      const fromPos = pos(0, 100, 100, 30);
      const toPos = pos(200, 102, 100, 30);

      const result = calculateArrowPath(fromPos, toPos);

      expect(result.path).toContain("Q ");
    });
  });

  describe("routed path (small/negative gap)", () => {
    it("should use 4-corner S-curve when horizontal gap is very small (< 14px at default rowHeight)", () => {
      // gap=10px < compact-elbow threshold (HORIZONTAL_SEGMENT*2 − cornerRadius*2 = 14px at default)
      // → calculateRoutedPath → gap(10) < 2*(HS-r)(14) → S-curve
      const fromPos = pos(0, 100, 100, 30); // ends at x=100, centerY=115
      const toPos = pos(110, 200, 100, 30); // starts at x=110, centerY=215 (gap=10px)

      const result = calculateArrowPath(fromPos, toPos);

      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(4); // full 4-corner S-curve
    });

    it("should use S-curve for overlapping tasks (negative gap)", () => {
      // ends at x=150, starts at x=100 → gap=-50 (overlap)
      const fromPos = pos(0, 100, 150, 30); // ends at x=150, centerY=115
      const toPos = pos(100, 200, 100, 30); // starts at x=100 (overlap!), centerY=215

      const result = calculateArrowPath(fromPos, toPos);

      // S-curve routes around the overlapping tasks
      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(4);
      expect(result.arrowHead.x).toBe(100);
    });

    it("should handle same-row tasks with small gap via S-curve extending below", () => {
      // gap=10px < minGapForElbow=46 → calculateRoutedPath
      // gap(10) < 2*(HS-r)=14 → S-curve (not simple elbow)
      // isSameRow → verticalDistance=0 < minSpaceForCurves=32 → offset kicks in
      // offset = max(32/2, 44*0.4) = max(16, 17.6) = 17.6 → middleY = 115 + 17.6 = 132.6
      const fromPos = pos(0, 100, 100, 30);  // from: {x:100, y:115}
      const toPos = pos(110, 100, 100, 30);  // to:   {x:110, y:115}

      const result = calculateArrowPath(fromPos, toPos);

      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(4); // 4-corner S-curve
      expect(result.path).toContain("132.6"); // middleY extends below both tasks
      expect(result.arrowHead.x).toBe(110);
    });

    it("should fall back to simple elbow in transition case (gap 20px, default rowHeight → threshold 14–46px)", () => {
      // gap = 20px → in the compact-elbow zone (HORIZONTAL_SEGMENT*2 − r*2 ≤ gap < minGapForElbow)
      // gap(20) ≥ 2*(HS-r)=14 → falls back to calculateSimpleElbow (2 Q corners, not 4)
      const fromPos = pos(0, 100, 100, 30); // ends at x=100, centerY=115
      const toPos = pos(120, 200, 100, 30); // starts at x=120, centerY=215 (gap=20px)

      const result = calculateArrowPath(fromPos, toPos);

      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(2); // simple elbow: 2 corners, not 4
      expect(result.path).toContain("M 100 115");
      expect(result.path).toContain("L 120 215");
    });

    it("should extend routing above tasks when going upward and vertically too close for clean curves", () => {
      // Upward S-curve (dir=-1) with tight vertical space — middleY must extend ABOVE both tasks
      // gap=-40 (overlap) → S-curve; from.y=215, to.y=205 → verticalDistance=10 < minSpaceForCurves=32
      // offset = max(32/2, 44*0.4) = 17.6 → middleY = min(215,205) − 17.6 = 187.4
      const fromPos = pos(0, 200, 100, 30); // ends at x=100, centerY=215
      const toPos = pos(60, 190, 100, 30);  // starts at x=60 (overlap!), centerY=205 (above)

      const result = calculateArrowPath(fromPos, toPos);

      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(4); // 4-corner S-curve
      expect(result.path).toContain("187.4"); // middleY extends above both tasks
      expect(result.arrowHead.x).toBe(60);
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
    it("should give identical results with default and explicit rowHeight=44", () => {
      const fromPos = pos(0, 100, 100, 44);
      const toPos = pos(300, 200, 100, 44);
      expect(calculateArrowPath(fromPos, toPos)).toEqual(
        calculateArrowPath(fromPos, toPos, 44)
      );
    });

    it("should produce a valid path at smaller row heights", () => {
      const fromPos = pos(0, 0, 100, 20);
      const toPos = pos(300, 100, 100, 20);
      const result = calculateArrowPath(fromPos, toPos, 20);
      expect(result.path).toContain("M ");
      expect(result.arrowHead.angle).toBe(0);
    });

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

  describe("routing zone boundaries (default rowHeight=44, cornerRadius=8)", () => {
    // Three routing zones; all thresholds = HORIZONTAL_SEGMENT*2 ± cornerRadius*2 = 30 ± 16:
    //   standard elbow:  gap ≥ 46  (minGapForElbow = HORIZONTAL_SEGMENT*2 + cornerRadius*2)
    //   simple elbow:    14 ≤ gap < 46
    //   S-curve:         gap < 14  (= HORIZONTAL_SEGMENT*2 − cornerRadius*2)
    const fromPos = pos(0, 100, 100, 30); // right edge x=100, centerY=115

    it("uses standard elbow at the minGapForElbow lower boundary (gap=46)", () => {
      const result = calculateArrowPath(fromPos, pos(146, 200, 100, 30));
      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(2); // 2-corner standard elbow
    });

    it("uses compact simple elbow just below standard-elbow zone (gap=45)", () => {
      const result = calculateArrowPath(fromPos, pos(145, 200, 100, 30));
      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(2); // 2-corner compact elbow (adaptive radius)
    });

    it("uses simple elbow at the upper S-curve boundary (gap=14)", () => {
      // gap=14 ≥ 2*(HS-r)=14 → equal → simple elbow
      const result = calculateArrowPath(fromPos, pos(114, 200, 100, 30));
      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(2);
    });

    it("uses S-curve just below the simple-elbow zone (gap=13)", () => {
      // gap=13 < 2*(HS-r)=14 → S-curve
      const result = calculateArrowPath(fromPos, pos(113, 200, 100, 30));
      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(4);
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
    // Default rowHeight=44 → cornerRadius=8 → minGapForElbow = 15*2 + 8*2 = 46
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

  it("should scale threshold with rowHeight to stay consistent with calculateArrowPath", () => {
    // rowHeight=88 → cornerRadius=round(8*88/44)=16 → minGapForElbow=15*2+16*2=62
    const atThreshold = calculateDragPath({ x: 0, y: 0 }, { x: 62, y: 50 }, 88);  // gap=62 → elbow
    const belowThreshold = calculateDragPath({ x: 0, y: 0 }, { x: 61, y: 50 }, 88); // gap=61 → line

    expect(atThreshold).toContain("Q ");
    expect(belowThreshold).not.toContain("Q ");
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

  it("should return a degenerate polygon string for size=0 without throwing", () => {
    // size=0 → three coincident points, invisible in SVG — must not crash
    expect(() => getArrowheadPoints(0)).not.toThrow();
    expect(getArrowheadPoints(0)).toBe("0,0 0,0 0,0");
  });

  it("should clamp negative size to 0", () => {
    expect(getArrowheadPoints(-5)).toBe("0,0 0,0 0,0");
  });
});
