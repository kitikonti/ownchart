/**
 * Unit tests for arrow path calculation.
 * Sprint 1.4 - Dependencies + Sprint 1.5.2 Package 1 - All 4 types
 */

import { describe, it, expect } from "vitest";
import {
  ARROWHEAD_SIZE,
  calculateArrowPath,
  calculateDragPath,
  getArrowheadPoints,
} from "@/utils/arrowPath/elbowPath";
import type { TaskPosition } from "@/types/dependency.types";

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

// ===========================================================================
// Sprint 1.5.2 Package 1 — All 4 dependency types
// ===========================================================================

describe("calculateArrowPath — dependency type support", () => {
  describe("backward compatibility", () => {
    it("produces identical output with and without type parameter", () => {
      const fromPos = pos(0, 100, 100, 30);
      const toPos = pos(200, 200, 100, 30);

      const withoutType = calculateArrowPath(fromPos, toPos);
      const withFS = calculateArrowPath(fromPos, toPos, 44, "FS");

      expect(withoutType).toEqual(withFS);
    });

    it("produces identical output for default rowHeight with explicit FS", () => {
      const fromPos = pos(0, 100, 150, 30);
      const toPos = pos(100, 200, 100, 30);

      const withoutType = calculateArrowPath(fromPos, toPos);
      const withFS = calculateArrowPath(fromPos, toPos, 44, "FS");

      expect(withoutType).toEqual(withFS);
    });
  });

  describe("arrowhead angle per type", () => {
    const fromPos = pos(0, 100, 100, 30);
    const toPos = pos(200, 200, 100, 30);

    it("FS: angle=0 (pointing right into left edge)", () => {
      const result = calculateArrowPath(fromPos, toPos, 44, "FS");
      expect(result.arrowHead.angle).toBe(0);
    });

    it("SS: angle=0 (pointing right into left edge)", () => {
      const result = calculateArrowPath(fromPos, toPos, 44, "SS");
      expect(result.arrowHead.angle).toBe(0);
    });

    it("FF: angle=180 (pointing left into right edge)", () => {
      const result = calculateArrowPath(fromPos, toPos, 44, "FF");
      expect(result.arrowHead.angle).toBe(180);
    });

    it("SF: angle=180 (pointing left into right edge)", () => {
      const result = calculateArrowPath(fromPos, toPos, 44, "SF");
      expect(result.arrowHead.angle).toBe(180);
    });
  });

  describe("connection points per type", () => {
    const fromPos = pos(50, 100, 100, 30); // left=50, right=150, centerY=115
    const toPos = pos(300, 200, 80, 40); // left=300, right=380, centerY=220

    it("FS: from right edge of source, to left edge of target", () => {
      const result = calculateArrowPath(fromPos, toPos, 44, "FS");
      // Path starts at right edge (x=150) and ends at left edge (x=300)
      expect(result.path).toContain("M 150 115");
      expect(result.arrowHead.x).toBe(300);
      expect(result.arrowHead.y).toBe(220);
    });

    it("SS: from left edge of source, to left edge of target", () => {
      const result = calculateArrowPath(fromPos, toPos, 44, "SS");
      // Path starts at left edge (x=50) and ends at left edge (x=300)
      expect(result.path).toContain("M 50 115");
      expect(result.arrowHead.x).toBe(300);
      expect(result.arrowHead.y).toBe(220);
    });

    it("FF: from right edge of source, to right edge of target", () => {
      const result = calculateArrowPath(fromPos, toPos, 44, "FF");
      // Path starts at right edge (x=150) and ends at right edge (x=380)
      expect(result.path).toContain("M 150 115");
      expect(result.arrowHead.x).toBe(380);
      expect(result.arrowHead.y).toBe(220);
    });

    it("SF: from left edge of source, to right edge of target", () => {
      const result = calculateArrowPath(fromPos, toPos, 44, "SF");
      // Path starts at left edge (x=50) and ends at right edge (x=380)
      expect(result.path).toContain("M 50 115");
      expect(result.arrowHead.x).toBe(380);
      expect(result.arrowHead.y).toBe(220);
    });
  });

  describe("SS path routing", () => {
    it("uses 2-corner hook path (vertical turn left of both left edges)", () => {
      // Large horizontal gap — SS uses hook-left, not S-curve
      const fromPos = pos(50, 100, 100, 30); // left=50
      const toPos = pos(300, 200, 100, 30); // left=300

      const result = calculateArrowPath(fromPos, toPos, 44, "SS");

      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(2);
    });

    it("hook extends left of both left edges", () => {
      const fromPos = pos(100, 100, 100, 30); // left=100
      const toPos = pos(200, 200, 100, 30); // left=200

      const result = calculateArrowPath(fromPos, toPos, 44, "SS");

      // Path starts at x=100 (left edge)
      expect(result.path).toContain("M 100 115");
      // turnX = min(100, 200) - 15 = 85 → first L goes toward 85 area (leftward)
      expect(result.path).toMatch(/M 100 115 L (8[0-9]|9[0-3])/);
      // 2-corner hook, not 4-corner S-curve
      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(2);
    });

    it("handles same-row tasks by extending middleY below (S-curve fallback)", () => {
      const fromPos = pos(50, 100, 100, 30); // left=50, centerY=115
      const toPos = pos(200, 100, 100, 30); // left=200, centerY=115

      const result = calculateArrowPath(fromPos, toPos, 44, "SS");

      // Same-row FF/SS falls back to S-curve to avoid crossing task bars
      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(4);
    });
  });

  describe("FF path routing", () => {
    it("uses 2-corner hook path (vertical turn right of both right edges)", () => {
      const fromPos = pos(0, 100, 100, 30); // right=100
      const toPos = pos(300, 200, 100, 30); // right=400

      const result = calculateArrowPath(fromPos, toPos, 44, "FF");

      // Hook-right: 2-corner path, not 4-corner S-curve
      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(2);
    });

    it("enters target from the right via hook path", () => {
      const fromPos = pos(0, 100, 100, 30); // right=100
      const toPos = pos(300, 200, 100, 30); // right=400

      const result = calculateArrowPath(fromPos, toPos, 44, "FF");

      // Arrowhead at right edge of target
      expect(result.arrowHead.x).toBe(400);
      // Path should end with L going to 400 (right edge)
      expect(result.path).toContain("L 400 215");
      // turnX = max(100, 400) + 15 = 415 — path routes through x=415
      expect(result.path).toContain("415");
    });

    it("handles overlapping tasks with hook path", () => {
      const fromPos = pos(0, 100, 200, 30); // right=200
      const toPos = pos(50, 200, 100, 30); // right=150

      const result = calculateArrowPath(fromPos, toPos, 44, "FF");

      // Hook-right still works: turnX = max(200, 150) + 15 = 215
      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(2);
      expect(result.arrowHead.x).toBe(150);
    });
  });

  describe("SF path routing", () => {
    it("uses S-curve when from.x < to.x (common case)", () => {
      const fromPos = pos(50, 100, 100, 30); // left=50
      const toPos = pos(300, 200, 80, 40); // right=380

      const result = calculateArrowPath(fromPos, toPos, 44, "SF");

      // from.x(50) < to.x(380) → reversed gap negative → S-curve
      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(4);
    });

    it("uses 2-corner elbow when reversed gap is large (from.x >> to.x)", () => {
      // source.left=400, target.right=50 → reversedGap = 400-50 = 350 >> minGapForElbow(46)
      const fromPos = pos(400, 100, 100, 30); // left=400
      const toPos = pos(0, 200, 50, 30); // right=50

      const result = calculateArrowPath(fromPos, toPos, 44, "SF");

      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(2);
      expect(result.arrowHead.x).toBe(50);
      expect(result.arrowHead.angle).toBe(180);
    });

    it("exits left and enters right", () => {
      const fromPos = pos(100, 100, 100, 30); // left=100
      const toPos = pos(300, 200, 100, 30); // right=400

      const result = calculateArrowPath(fromPos, toPos, 44, "SF");

      // Starts at left edge of source
      expect(result.path).toContain("M 100 115");
      // Arrowhead at right edge of target
      expect(result.arrowHead.x).toBe(400);
      expect(result.arrowHead.angle).toBe(180);
    });

    it("handles tasks far apart with S-curve (from.x < to.x)", () => {
      const fromPos = pos(0, 100, 50, 30); // left=0
      const toPos = pos(500, 200, 100, 30); // right=600

      const result = calculateArrowPath(fromPos, toPos, 44, "SF");

      // from.x(0) < to.x(600) → S-curve
      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(4);
      expect(result.arrowHead.x).toBe(600);
    });
  });

  describe("FS routing remains unchanged", () => {
    it("still uses standard 2-corner elbow for large gaps", () => {
      const fromPos = pos(0, 100, 100, 30);
      const toPos = pos(200, 200, 100, 30);

      const result = calculateArrowPath(fromPos, toPos, 44, "FS");

      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(2);
    });

    it("still uses S-curve for small gaps", () => {
      const fromPos = pos(0, 100, 100, 30);
      const toPos = pos(110, 200, 100, 30);

      const result = calculateArrowPath(fromPos, toPos, 44, "FS");

      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(4);
    });
  });

  describe("rowHeight scaling for non-FS types", () => {
    const fromPos = pos(50, 100, 100, 20);
    const toPos = pos(300, 200, 100, 20);

    it.each(["SS", "FF"] as const)(
      "%s produces valid 2-corner hook at small rowHeight=20",
      (type) => {
        const result = calculateArrowPath(fromPos, toPos, 20, type);
        const qCount = (result.path.match(/Q /g) || []).length;
        expect(qCount).toBe(2);
        expect(result.path).toContain("M ");
      }
    );

    it("SF produces valid 4-corner S-curve at small rowHeight=20", () => {
      // from.x(50) < to.x(400) → S-curve
      const result = calculateArrowPath(fromPos, toPos, 20, "SF");
      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(4);
      expect(result.path).toContain("M ");
    });

    it.each(["SS", "FF"] as const)(
      "%s produces valid 2-corner hook at large rowHeight=88",
      (type) => {
        const result = calculateArrowPath(fromPos, toPos, 88, type);
        const qCount = (result.path.match(/Q /g) || []).length;
        expect(qCount).toBe(2);
        expect(result.path).toContain("M ");
      }
    );

    it("SF produces valid 4-corner S-curve at large rowHeight=88", () => {
      const result = calculateArrowPath(fromPos, toPos, 88, "SF");
      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(4);
      expect(result.path).toContain("M ");
    });
  });

  describe("edge cases for non-FS types", () => {
    it("SS with vertically aligned left edges uses 2-corner hook", () => {
      const fromPos = pos(100, 100, 80, 30); // left=100
      const toPos = pos(101, 200, 120, 30); // left=101 (nearly same x)

      const result = calculateArrowPath(fromPos, toPos, 44, "SS");

      // Hook-left: turnX = min(100,101) - 15 = 85
      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(2);
      expect(result.path).not.toMatch(/NaN/);
    });

    it("FF with identical right edges uses 2-corner hook", () => {
      const fromPos = pos(0, 100, 200, 30); // right=200
      const toPos = pos(100, 200, 100, 30); // right=200 (same!)

      const result = calculateArrowPath(fromPos, toPos, 44, "FF");

      // Hook-right: turnX = max(200,200) + 15 = 215
      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(2);
      expect(result.path).not.toMatch(/NaN/);
    });

    it("SF with zero-width milestone task", () => {
      const fromPos = pos(100, 100, 0, 30); // milestone at x=100, width=0
      const toPos = pos(200, 200, 100, 30); // right=300

      const result = calculateArrowPath(fromPos, toPos, 44, "SF");

      expect(result.path).toContain("M 100 115");
      expect(result.arrowHead.x).toBe(300);
      expect(result.path).not.toMatch(/NaN/);
    });

    it("all non-FS types produce no NaN from direction math", () => {
      // Tight layout that could expose sign errors in corner offset math
      const fromPos = pos(10, 50, 30, 20);
      const toPos = pos(15, 80, 25, 20);

      for (const type of ["SS", "FF", "SF"] as const) {
        const result = calculateArrowPath(fromPos, toPos, 30, type);
        expect(result.path).not.toMatch(/NaN/);
        expect(result.arrowHead.angle).toBe(
          type === "FF" || type === "SF" ? 180 : 0
        );
      }
    });

    it("FF/SS hooks don't produce backwards segments at large rowHeight", () => {
      // rowHeight=88 → cornerRadius=16 > HORIZONTAL_SEGMENT=15
      // Radius must be clamped to prevent corner overflow
      const fromPos = pos(0, 100, 100, 30); // right=100
      const toPos = pos(300, 200, 100, 30); // right=400

      const ffResult = calculateArrowPath(fromPos, toPos, 88, "FF");
      const ssResult = calculateArrowPath(fromPos, toPos, 88, "SS");

      // Both should produce valid 2-corner hooks
      expect((ffResult.path.match(/Q /g) || []).length).toBe(2);
      expect((ssResult.path.match(/Q /g) || []).length).toBe(2);
      // No NaN or degenerate coordinates
      expect(ffResult.path).not.toMatch(/NaN/);
      expect(ssResult.path).not.toMatch(/NaN/);
    });

    it("FF same-row uses S-curve fallback (not straight line)", () => {
      const fromPos = pos(0, 100, 100, 30); // right=100, centerY=115
      const toPos = pos(200, 100, 100, 30); // right=300, centerY=115

      const result = calculateArrowPath(fromPos, toPos, 44, "FF");

      // Same-row should NOT be a straight line (would cross task bars)
      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(4);
    });

    it("SS same-row uses S-curve fallback (not straight line)", () => {
      const fromPos = pos(100, 100, 100, 30); // left=100, centerY=115
      const toPos = pos(200, 100, 100, 30); // left=200, centerY=115

      const result = calculateArrowPath(fromPos, toPos, 44, "SS");

      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(4);
    });

    it("SF compact elbow in transition zone has rounded corners", () => {
      // reversedGap must be in [2*(15-8), 46) = [14, 46) for compact elbow
      // from.x=60, to.x=30 → reversedGap = 30, which is in [14, 46)
      const fromPos = pos(60, 100, 100, 30); // left=60
      const toPos = pos(0, 200, 30, 30); // right=30

      const result = calculateArrowPath(fromPos, toPos, 44, "SF");

      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(2); // compact 2-corner elbow
      // Adaptive radius = min(8, 30/4, 100/4) = min(8, 7.5, 25) = 7.5
      // Corners must NOT be sharp (radius > 0)
      expect(result.path).toMatch(/Q \d/); // Q commands have non-zero offsets
    });

    it("SF 2-corner elbow when reversed gap is large", () => {
      // from.x=500, to.x=50 → reversedGap = 450 >> minGapForElbow(46)
      const fromPos = pos(500, 100, 100, 30); // left=500
      const toPos = pos(0, 200, 50, 30); // right=50

      const result = calculateArrowPath(fromPos, toPos, 44, "SF");

      const qCount = (result.path.match(/Q /g) || []).length;
      expect(qCount).toBe(2);
      expect(result.arrowHead.angle).toBe(180);
    });

    it("buildTwoCornerPath wrapper produces identical output to direct midpoint call", () => {
      // Regression guard: FS routing must be pixel-identical
      const fromPos = pos(0, 100, 100, 30);
      const toPos = pos(200, 200, 100, 30);

      const withoutType = calculateArrowPath(fromPos, toPos);
      const withFS = calculateArrowPath(fromPos, toPos, 44, "FS");

      expect(withoutType).toEqual(withFS);
    });
  });
});
