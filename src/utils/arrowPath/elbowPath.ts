/**
 * Arrow Path Calculation for Dependency Arrows
 * Generates orthogonal (elbow-style) SVG paths with rounded corners.
 * Sprint 1.4 - Dependencies (Finish-to-Start Only)
 */

import type {
  ArrowPath,
  Point,
  TaskPosition,
} from "../../types/dependency.types";

// ---------------------------------------------------------------------------
// Public constants
// ---------------------------------------------------------------------------

/** Arrowhead polygon size (px) — shared by DependencyArrow and DependencyDragPreview */
export const ARROWHEAD_SIZE = 8;

// ---------------------------------------------------------------------------
// Private constants
// ---------------------------------------------------------------------------

/** Horizontal segment length coming out of/into tasks. */
const HORIZONTAL_SEGMENT = 15;

/** Base corner radius for 90° turns (at comfortable/44px row height). */
const BASE_CORNER_RADIUS = 8;

/** Base row height for scaling calculations. */
const BASE_ROW_HEIGHT = 44;

/** Minimum corner radius regardless of row height scaling. */
const MIN_CORNER_RADIUS_PX = 4;

/** Pixel tolerance below which vertical offset is treated as same row. */
const SAME_ROW_TOLERANCE_PX = 2;

/** Multiplier applied to corner radius to compute minimum vertical space needed for S-curve turns. */
const CURVE_SPACE_MULTIPLIER = 4;

/** Row height fraction used to extend routing offset when tasks are vertically too close for curves. */
const ROUTING_OFFSET_RATIO = 0.4;

/** Divisor applied to available space when computing adaptive corner radius in tight spaces. */
const ADAPTIVE_RADIUS_DIVISOR = 4;

/** Halving divisor for the minimum-space-for-curves value when computing the middle Y offset. */
const MIDDLE_SPACE_HALVING_DIVISOR = 2;

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Get corner radius scaled by row height. */
function getScaledCornerRadius(rowHeight: number): number {
  const scale = rowHeight / BASE_ROW_HEIGHT;
  return Math.max(MIN_CORNER_RADIUS_PX, Math.round(BASE_CORNER_RADIUS * scale));
}

/**
 * Compute the minimum horizontal gap required to use a standard elbow path.
 * Below this threshold, routing falls back to a compact elbow or S-curve.
 * To widen the standard-elbow zone, increase HORIZONTAL_SEGMENT.
 */
function computeMinGapForElbow(cornerRadius: number): number {
  return HORIZONTAL_SEGMENT * 2 + cornerRadius * 2;
}

/** Return +1 when routing goes downward (to is at or below from), −1 when going upward. */
function getVerticalDir(from: Point, to: Point): 1 | -1 {
  return to.y >= from.y ? 1 : -1;
}

/** True when the vertical distance between two points is within the same-row tolerance. */
function isSameRow(from: Point, to: Point): boolean {
  return Math.abs(to.y - from.y) < SAME_ROW_TOLERANCE_PX;
}

/** Build a straight line path from `from` to `to`. */
function buildStraightLine(from: Point, to: Point): string {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
}

/** Format a single quadratic bezier corner segment: `Q anchorX anchorY, endX endY`. */
function qCorner(anchorX: number, anchorY: number, endX: number, endY: number): string {
  return `Q ${anchorX} ${anchorY}, ${endX} ${endY}`;
}

/**
 * Build a two-corner (standard elbow) path string.
 * Both corners meet at the horizontal midpoint between from and to.
 * Routing direction (up vs. down) is derived from the y-coordinates.
 */
function buildTwoCornerPath(
  from: Point,
  to: Point,
  cornerRadius: number
): string {
  const r = cornerRadius;
  const dir = getVerticalDir(from, to);
  const midX = (from.x + to.x) / 2;

  return [
    `M ${from.x} ${from.y}`,
    `L ${midX - r} ${from.y}`,
    qCorner(midX, from.y, midX, from.y + dir * r),
    `L ${midX} ${to.y - dir * r}`,
    qCorner(midX, to.y, midX + r, to.y),
    `L ${to.x} ${to.y}`,
  ].join(" ");
}

/**
 * Calculate standard elbow path with two 90° corners.
 * Used when there's enough horizontal space.
 */
function calculateElbowPath(
  from: Point,
  to: Point,
  cornerRadius: number = BASE_CORNER_RADIUS
): string {
  if (isSameRow(from, to)) {
    return buildStraightLine(from, to);
  }
  return buildTwoCornerPath(from, to, cornerRadius);
}

/**
 * Calculate simple elbow path for transition cases (small positive gaps).
 * Uses an adaptive radius that shrinks to fit within the available space.
 */
function calculateSimpleElbow(
  from: Point,
  to: Point,
  baseRadius: number = BASE_CORNER_RADIUS
): string {
  const horizontalGap = to.x - from.x;
  const verticalGap = Math.abs(to.y - from.y);

  if (isSameRow(from, to)) {
    return buildStraightLine(from, to);
  }

  // Clamp to zero: at large row heights the S-curve threshold can dip below zero,
  // making horizontalGap negative here. A zero radius degrades to a sharp corner
  // rather than producing geometrically invalid (negative-coordinate) path data.
  const cornerRadius = Math.max(
    0,
    Math.min(
      baseRadius,
      horizontalGap / ADAPTIVE_RADIUS_DIVISOR,
      verticalGap / ADAPTIVE_RADIUS_DIVISOR
    )
  );

  return buildTwoCornerPath(from, to, cornerRadius);
}

/**
 * Determine the Y-coordinate for the horizontal middle segment of an S-curve.
 * Extends the route further out when tasks are vertically too close for clean curves.
 * Routing direction is derived from the y-coordinates.
 */
function calculateMiddleY(
  from: Point,
  to: Point,
  minSpaceForCurves: number,
  rowHeight: number
): number {
  const dir = getVerticalDir(from, to);
  const verticalDistance = Math.abs(to.y - from.y);
  if (verticalDistance < minSpaceForCurves) {
    const offset = Math.max(
      minSpaceForCurves / MIDDLE_SPACE_HALVING_DIVISOR,
      rowHeight * ROUTING_OFFSET_RATIO
    );
    const extremeY = dir === 1 ? Math.max(from.y, to.y) : Math.min(from.y, to.y);
    return extremeY + dir * offset;
  }
  return (from.y + to.y) / 2;
}

/**
 * Build the four-corner S-curve path string.
 * The path exits horizontally, turns vertical, crosses the middle Y, reverses
 * horizontal direction, then enters the target horizontally.
 * Routing direction is derived from the y-coordinates.
 */
function buildSCurvePath(
  from: Point,
  to: Point,
  middleY: number,
  cornerRadius: number
): string {
  const r = cornerRadius;
  const dir = getVerticalDir(from, to);
  const firstX = from.x + HORIZONTAL_SEGMENT;
  const secondX = to.x - HORIZONTAL_SEGMENT;

  return [
    `M ${from.x} ${from.y}`,
    // 1. Horizontal out from source
    `L ${firstX - r} ${from.y}`,
    // 2. First corner — turn toward middle
    qCorner(firstX, from.y, firstX, from.y + dir * r),
    // 3. Vertical to middle
    `L ${firstX} ${middleY - dir * r}`,
    // 4. Second corner — turn left (toward target)
    qCorner(firstX, middleY, firstX - r, middleY),
    // 5. Horizontal segment (going left, between the tasks)
    `L ${secondX + r} ${middleY}`,
    // 6. Third corner — turn toward target
    qCorner(secondX, middleY, secondX, middleY + dir * r),
    // 7. Vertical to target level
    `L ${secondX} ${to.y - dir * r}`,
    // 8. Fourth corner — turn right into target
    qCorner(secondX, to.y, secondX + r, to.y),
    // 9. Horizontal into target
    `L ${to.x} ${to.y}`,
  ].join(" ");
}

/**
 * Calculate routed path when tasks are close together or overlapping.
 * Creates an inverted S-shape to route around the tasks.
 */
function calculateRoutedPath(
  from: Point,
  to: Point,
  rowHeight: number = BASE_ROW_HEIGHT,
  cornerRadius: number = BASE_CORNER_RADIUS
): string {
  const firstVerticalX = from.x + HORIZONTAL_SEGMENT;
  const secondVerticalX = to.x - HORIZONTAL_SEGMENT;

  // Transition case: both vertical-segment lines (offset inward by one corner radius) still fit
  // left-to-right, so there is just enough horizontal room for a compact 2-corner elbow instead
  // of a full S-curve. Effective lower-bound gap: HORIZONTAL_SEGMENT * 2 − cornerRadius * 2.
  if (firstVerticalX - cornerRadius <= secondVerticalX + cornerRadius) {
    return calculateSimpleElbow(from, to, cornerRadius);
  }

  const minSpaceForCurves = CURVE_SPACE_MULTIPLIER * cornerRadius;
  const middleY = calculateMiddleY(from, to, minSpaceForCurves, rowHeight);
  return buildSCurvePath(from, to, middleY, cornerRadius);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate the SVG path for a dependency arrow.
 * Uses orthogonal routing with rounded 90° corners.
 *
 * Path structure:
 * 1. Horizontal segment out from source task
 * 2. 90° rounded corner
 * 3. Vertical segment
 * 4. 90° rounded corner
 * 5. Horizontal segment into target task
 *
 * NOTE: Entry/exit points are hardcoded for Finish-to-Start (FS) dependency type
 * (right edge → left edge). To support SS/FF/SF, pass connection-side as a
 * parameter and adjust start/end x accordingly.
 *
 * @param fromPos - Position of predecessor task bar
 * @param toPos - Position of successor task bar
 * @param rowHeight - Height of each row (used for scaling corners)
 * @returns ArrowPath with SVG path and arrowhead position
 */
export function calculateArrowPath(
  fromPos: TaskPosition,
  toPos: TaskPosition,
  rowHeight: number = BASE_ROW_HEIGHT
): ArrowPath {
  // Start point: right edge of predecessor, vertically centered
  const from: Point = {
    x: fromPos.x + fromPos.width,
    y: fromPos.y + fromPos.height / 2,
  };

  // End point: left edge of successor, vertically centered
  const to: Point = {
    x: toPos.x,
    y: toPos.y + toPos.height / 2,
  };

  const cornerRadius = getScaledCornerRadius(rowHeight);
  const minGapForElbow = computeMinGapForElbow(cornerRadius);
  const horizontalGap = to.x - from.x;

  const path =
    horizontalGap >= minGapForElbow
      ? calculateElbowPath(from, to, cornerRadius)
      : calculateRoutedPath(from, to, rowHeight, cornerRadius);

  return {
    path,
    arrowHead: {
      x: to.x,
      y: to.y,
      angle: 0, // Always pointing right (into the task)
    },
  };
}

/**
 * Calculate arrow path for a "temporary" dependency while dragging.
 * Uses the same elbow style for consistency. Tight/backwards gaps fall back to a
 * straight line — S-curve routing is intentionally omitted during drag for visual
 * clarity. The elbow threshold matches the default-rowHeight case of calculateArrowPath.
 */
export function calculateDragPath(from: Point, to: Point): string {
  const horizontalGap = to.x - from.x;
  const minGapForElbow = computeMinGapForElbow(BASE_CORNER_RADIUS);

  if (horizontalGap >= minGapForElbow) {
    return calculateElbowPath(from, to);
  }

  return buildStraightLine(from, to);
}

/**
 * Calculate the SVG points for an arrowhead polygon.
 * The polygon points left (negative X) so the tip sits at the origin (0,0),
 * letting the consumer translate/rotate as needed.
 *
 * @param size - Size of the arrowhead in pixels (default 8px)
 * @returns SVG polygon points string in "x1,y1 x2,y2 x3,y3" format
 */
export function getArrowheadPoints(size: number = ARROWHEAD_SIZE): string {
  return `${-size},-${size / 2} 0,0 ${-size},${size / 2}`;
}
