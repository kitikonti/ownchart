/**
 * Arrow Path Calculation for Dependency Arrows
 * Generates orthogonal (elbow-style) SVG paths with rounded corners.
 * Sprint 1.4 - Dependencies (Finish-to-Start Only)
 */

import type { ArrowPath, TaskPosition } from "../../types/dependency.types";

/** Arrowhead polygon size (px) — shared by DependencyArrow and DependencyDragPreview */
export const ARROWHEAD_SIZE = 8;

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

/** Get corner radius scaled by row height. */
function getScaledCornerRadius(rowHeight: number): number {
  const scale = rowHeight / BASE_ROW_HEIGHT;
  return Math.max(MIN_CORNER_RADIUS_PX, Math.round(BASE_CORNER_RADIUS * scale));
}

/**
 * Build a two-corner (standard elbow) path string.
 * Both corners meet at the horizontal midpoint between start and end.
 * Uses a direction multiplier so the same template handles both up and down paths.
 */
function buildTwoCornerPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  cornerRadius: number,
  goDown: boolean
): string {
  const r = cornerRadius;
  const dir = goDown ? 1 : -1;
  const midX = (startX + endX) / 2;

  return (
    `M ${startX} ${startY} ` +
    `L ${midX - r} ${startY} ` +
    `Q ${midX} ${startY}, ${midX} ${startY + dir * r} ` +
    `L ${midX} ${endY - dir * r} ` +
    `Q ${midX} ${endY}, ${midX + r} ${endY} ` +
    `L ${endX} ${endY}`
  );
}

/**
 * Calculate standard elbow path with two 90° corners.
 * Used when there's enough horizontal space.
 */
function calculateElbowPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  cornerRadius: number = BASE_CORNER_RADIUS
): string {
  if (Math.abs(endY - startY) < SAME_ROW_TOLERANCE_PX) {
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }
  return buildTwoCornerPath(
    startX,
    startY,
    endX,
    endY,
    cornerRadius,
    endY > startY
  );
}

/**
 * Calculate simple elbow path for transition cases (small positive gaps).
 * Uses an adaptive radius that shrinks to fit within the available space.
 */
function calculateSimpleElbow(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  goDown: boolean,
  baseRadius: number = BASE_CORNER_RADIUS
): string {
  const horizontalGap = endX - startX;
  const verticalGap = Math.abs(endY - startY);

  if (verticalGap < SAME_ROW_TOLERANCE_PX) {
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }

  const cornerRadius = Math.min(
    baseRadius,
    horizontalGap / ADAPTIVE_RADIUS_DIVISOR,
    verticalGap / ADAPTIVE_RADIUS_DIVISOR
  );

  return buildTwoCornerPath(startX, startY, endX, endY, cornerRadius, goDown);
}

/**
 * Determine the Y-coordinate for the horizontal middle segment of an S-curve.
 * Extends the route further out when tasks are vertically too close for clean curves.
 */
function calculateMiddleY(
  startY: number,
  endY: number,
  goDown: boolean,
  minSpaceForCurves: number,
  rowHeight: number
): number {
  const verticalDistance = Math.abs(endY - startY);
  if (verticalDistance < minSpaceForCurves) {
    const offset = Math.max(
      minSpaceForCurves / 2,
      rowHeight * ROUTING_OFFSET_RATIO
    );
    return goDown
      ? Math.max(startY, endY) + offset
      : Math.min(startY, endY) - offset;
  }
  return (startY + endY) / 2;
}

/**
 * Build the four-corner S-curve path string.
 * The path exits horizontally, turns vertical, crosses the middle Y, reverses
 * horizontal direction, then enters the target horizontally.
 * Uses a direction multiplier so the same template handles both up and down paths.
 */
function buildSCurvePath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  middleY: number,
  cornerRadius: number,
  goDown: boolean
): string {
  const r = cornerRadius;
  const dir = goDown ? 1 : -1;
  const firstX = startX + HORIZONTAL_SEGMENT;
  const secondX = endX - HORIZONTAL_SEGMENT;

  return (
    `M ${startX} ${startY} ` +
    // 1. Horizontal out from source
    `L ${firstX - r} ${startY} ` +
    // 2. First corner — turn toward middle
    `Q ${firstX} ${startY}, ${firstX} ${startY + dir * r} ` +
    // 3. Vertical to middle
    `L ${firstX} ${middleY - dir * r} ` +
    // 4. Second corner — turn left (toward target)
    `Q ${firstX} ${middleY}, ${firstX - r} ${middleY} ` +
    // 5. Horizontal segment (going left, between the tasks)
    `L ${secondX + r} ${middleY} ` +
    // 6. Third corner — turn toward target
    `Q ${secondX} ${middleY}, ${secondX} ${middleY + dir * r} ` +
    // 7. Vertical to target level
    `L ${secondX} ${endY - dir * r} ` +
    // 8. Fourth corner — turn right into target
    `Q ${secondX} ${endY}, ${secondX + r} ${endY} ` +
    // 9. Horizontal into target
    `L ${endX} ${endY}`
  );
}

/**
 * Calculate routed path when tasks are close together or overlapping.
 * Creates an inverted S-shape to route around the tasks.
 */
function calculateRoutedPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  rowHeight: number = BASE_ROW_HEIGHT,
  cornerRadius: number = BASE_CORNER_RADIUS
): string {
  const goDown = endY >= startY;
  const firstVerticalX = startX + HORIZONTAL_SEGMENT;
  const secondVerticalX = endX - HORIZONTAL_SEGMENT;

  // Transition case: horizontal room too small for a full S-curve — use simple elbow
  if (firstVerticalX - cornerRadius <= secondVerticalX + cornerRadius) {
    return calculateSimpleElbow(
      startX,
      startY,
      endX,
      endY,
      goDown,
      cornerRadius
    );
  }

  const minSpaceForCurves = CURVE_SPACE_MULTIPLIER * cornerRadius;
  const middleY = calculateMiddleY(
    startY,
    endY,
    goDown,
    minSpaceForCurves,
    rowHeight
  );
  return buildSCurvePath(
    startX,
    startY,
    endX,
    endY,
    middleY,
    cornerRadius,
    goDown
  );
}

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
  const startX = fromPos.x + fromPos.width;
  const startY = fromPos.y + fromPos.height / 2;

  // End point: left edge of successor, vertically centered
  const endX = toPos.x;
  const endY = toPos.y + toPos.height / 2;

  const horizontalGap = endX - startX;
  const cornerRadius = getScaledCornerRadius(rowHeight);
  const minGapForElbow =
    HORIZONTAL_SEGMENT * 2 + cornerRadius * 2 + ELBOW_GAP_PADDING;

  const path =
    horizontalGap >= minGapForElbow
      ? calculateElbowPath(startX, startY, endX, endY, cornerRadius)
      : calculateRoutedPath(
          startX,
          startY,
          endX,
          endY,
          rowHeight,
          cornerRadius
        );

  return {
    path,
    arrowHead: {
      x: endX,
      y: endY,
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
  const horizontalGap = endX - startX;
  const minGapForElbow =
    HORIZONTAL_SEGMENT * 2 + BASE_CORNER_RADIUS * 2 + ELBOW_GAP_PADDING;

  if (horizontalGap >= minGapForElbow) {
    return calculateElbowPath(startX, startY, endX, endY);
  }

  return `M ${startX} ${startY} L ${endX} ${endY}`;
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
