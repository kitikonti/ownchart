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

/**
 * Extra padding added to the minimum gap calculation.
 * Increase this to switch to S-curve earlier.
 */
const ELBOW_GAP_PADDING = 0;

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

/** Compute the minimum horizontal gap required to use an elbow path at a given corner radius. */
function computeMinGapForElbow(cornerRadius: number): number {
  return HORIZONTAL_SEGMENT * 2 + cornerRadius * 2 + ELBOW_GAP_PADDING;
}

/** Build a straight line path from `from` to `to`. */
function buildStraightLine(from: Point, to: Point): string {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
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
  const goDown = to.y >= from.y;
  const dir = goDown ? 1 : -1;
  const midX = (from.x + to.x) / 2;

  return (
    `M ${from.x} ${from.y} ` +
    `L ${midX - r} ${from.y} ` +
    `Q ${midX} ${from.y}, ${midX} ${from.y + dir * r} ` +
    `L ${midX} ${to.y - dir * r} ` +
    `Q ${midX} ${to.y}, ${midX + r} ${to.y} ` +
    `L ${to.x} ${to.y}`
  );
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
  if (Math.abs(to.y - from.y) < SAME_ROW_TOLERANCE_PX) {
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

  if (verticalGap < SAME_ROW_TOLERANCE_PX) {
    return buildStraightLine(from, to);
  }

  const cornerRadius = Math.min(
    baseRadius,
    horizontalGap / ADAPTIVE_RADIUS_DIVISOR,
    verticalGap / ADAPTIVE_RADIUS_DIVISOR
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
  const goDown = to.y >= from.y;
  const verticalDistance = Math.abs(to.y - from.y);
  if (verticalDistance < minSpaceForCurves) {
    const offset = Math.max(
      minSpaceForCurves / MIDDLE_SPACE_HALVING_DIVISOR,
      rowHeight * ROUTING_OFFSET_RATIO
    );
    return goDown
      ? Math.max(from.y, to.y) + offset
      : Math.min(from.y, to.y) - offset;
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
  const goDown = to.y >= from.y;
  const dir = goDown ? 1 : -1;
  const firstX = from.x + HORIZONTAL_SEGMENT;
  const secondX = to.x - HORIZONTAL_SEGMENT;

  return (
    `M ${from.x} ${from.y} ` +
    // 1. Horizontal out from source
    `L ${firstX - r} ${from.y} ` +
    // 2. First corner — turn toward middle
    `Q ${firstX} ${from.y}, ${firstX} ${from.y + dir * r} ` +
    // 3. Vertical to middle
    `L ${firstX} ${middleY - dir * r} ` +
    // 4. Second corner — turn left (toward target)
    `Q ${firstX} ${middleY}, ${firstX - r} ${middleY} ` +
    // 5. Horizontal segment (going left, between the tasks)
    `L ${secondX + r} ${middleY} ` +
    // 6. Third corner — turn toward target
    `Q ${secondX} ${middleY}, ${secondX} ${middleY + dir * r} ` +
    // 7. Vertical to target level
    `L ${secondX} ${to.y - dir * r} ` +
    // 8. Fourth corner — turn right into target
    `Q ${secondX} ${to.y}, ${secondX + r} ${to.y} ` +
    // 9. Horizontal into target
    `L ${to.x} ${to.y}`
  );
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

  // Transition case: horizontal room too small for a full S-curve — use simple elbow
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
export function calculateDragPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): string {
  const from: Point = { x: startX, y: startY };
  const to: Point = { x: endX, y: endY };
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
