/**
 * Arrow Path Calculation for Dependency Arrows
 * Generates orthogonal (elbow-style) SVG paths with rounded corners.
 * Sprint 1.4 - Dependencies (Finish-to-Start Only)
 */

import type { ArrowPath, TaskPosition } from "../../types/dependency.types";

/**
 * Horizontal segment length coming out of/into tasks.
 */
const HORIZONTAL_SEGMENT = 15;

/**
 * Corner radius for 90° turns.
 */
const CORNER_RADIUS = 8;

/**
 * Extra padding added to the minimum gap calculation.
 * Increase this to switch to S-curve earlier.
 */
const ELBOW_GAP_PADDING = 0;

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
 * @param _rowHeight - Height of each row (unused, kept for API compatibility)
 * @returns ArrowPath with SVG path and arrowhead position
 */
export function calculateArrowPath(
  fromPos: TaskPosition,
  toPos: TaskPosition,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _rowHeight: number = 44
): ArrowPath {
  // Start point: right edge of predecessor, vertically centered
  const startX = fromPos.x + fromPos.width;
  const startY = fromPos.y + fromPos.height / 2;

  // End point: left edge of successor, vertically centered
  const endX = toPos.x;
  const endY = toPos.y + toPos.height / 2;

  // Calculate horizontal gap between tasks
  const horizontalGap = endX - startX;

  let path: string;

  // Minimum gap needed: 2x horizontal segment + 2x corner radius + padding
  const minGapForElbow =
    HORIZONTAL_SEGMENT * 2 + CORNER_RADIUS * 2 + ELBOW_GAP_PADDING;

  if (horizontalGap >= minGapForElbow) {
    // Normal case: enough space for standard elbow
    path = calculateElbowPath(startX, startY, endX, endY);
  } else {
    // Tight/overlap case: use S-curve routing
    path = calculateRoutedPath(startX, startY, endX, endY);
  }

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
 * Calculate standard elbow path with two 90° corners.
 * Used when there's enough horizontal space.
 */
function calculateElbowPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): string {
  const midX = (startX + endX) / 2;
  const r = CORNER_RADIUS;

  // If same row (no vertical movement needed)
  if (Math.abs(endY - startY) < 2) {
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }

  const goingDown = endY > startY;

  // Path segments:
  // 1. Horizontal from start to first corner
  // 2. First 90° corner (turn down or up)
  // 3. Vertical segment
  // 4. Second 90° corner (turn right)
  // 5. Horizontal to end

  if (goingDown) {
    return (
      `M ${startX} ${startY} ` +
      // Horizontal segment
      `L ${midX - r} ${startY} ` +
      // First corner (turn down)
      `Q ${midX} ${startY}, ${midX} ${startY + r} ` +
      // Vertical segment
      `L ${midX} ${endY - r} ` +
      // Second corner (turn right)
      `Q ${midX} ${endY}, ${midX + r} ${endY} ` +
      // Horizontal to end
      `L ${endX} ${endY}`
    );
  } else {
    return (
      `M ${startX} ${startY} ` +
      // Horizontal segment
      `L ${midX - r} ${startY} ` +
      // First corner (turn up)
      `Q ${midX} ${startY}, ${midX} ${startY - r} ` +
      // Vertical segment
      `L ${midX} ${endY + r} ` +
      // Second corner (turn right)
      `Q ${midX} ${endY}, ${midX + r} ${endY} ` +
      // Horizontal to end
      `L ${endX} ${endY}`
    );
  }
}

/**
 * Calculate simple elbow path for transition cases (small positive gaps).
 * Uses 2 corners with adaptive radius for tight spaces.
 */
function calculateSimpleElbow(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  goDown: boolean
): string {
  const horizontalGap = endX - startX;
  const verticalGap = Math.abs(endY - startY);

  // Use smaller radius for tight spaces - limit by available space
  const maxRadiusForHorizontal = horizontalGap / 4;
  const maxRadiusForVertical = verticalGap / 4;
  const r = Math.min(
    CORNER_RADIUS,
    maxRadiusForHorizontal,
    maxRadiusForVertical
  );

  const midX = (startX + endX) / 2;

  // If same row (no vertical movement needed)
  if (verticalGap < 2) {
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }

  if (goDown) {
    return (
      `M ${startX} ${startY} ` +
      `L ${midX - r} ${startY} ` +
      `Q ${midX} ${startY}, ${midX} ${startY + r} ` +
      `L ${midX} ${endY - r} ` +
      `Q ${midX} ${endY}, ${midX + r} ${endY} ` +
      `L ${endX} ${endY}`
    );
  } else {
    return (
      `M ${startX} ${startY} ` +
      `L ${midX - r} ${startY} ` +
      `Q ${midX} ${startY}, ${midX} ${startY - r} ` +
      `L ${midX} ${endY + r} ` +
      `Q ${midX} ${endY}, ${midX + r} ${endY} ` +
      `L ${endX} ${endY}`
    );
  }
}

/**
 * Calculate routed path when tasks are close together or overlapping.
 * Creates an "inverted S" shape:
 * 1. Horizontal out from source
 * 2. 90° turn down (or up)
 * 3. 90° turn same direction (now going horizontally between tasks)
 * 4. 90° turn counter (now going toward target vertically)
 * 5. 90° turn counter (now going horizontally into target)
 */
function calculateRoutedPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): string {
  const r = CORNER_RADIUS;

  // Determine routing direction - go down if target is below or same level
  const goDown = endY >= startY;

  // Calculate the Y position for the horizontal middle segment
  // Should be vertically centered between the two tasks
  const verticalDistance = Math.abs(endY - startY);
  const minSpaceForCurves = 4 * r; // Need room for curves at both ends

  let middleY: number;
  if (verticalDistance < minSpaceForCurves) {
    // Tasks too close vertically - route further out to have room for all curves
    middleY = goDown
      ? Math.max(startY, endY) + minSpaceForCurves / 2
      : Math.min(startY, endY) - minSpaceForCurves / 2;
  } else {
    // Enough vertical space - route through the exact middle
    middleY = (startY + endY) / 2;
  }

  // X position for the first vertical drop (right after source)
  const firstVerticalX = startX + HORIZONTAL_SEGMENT;

  // X position for the second vertical segment (just before target)
  const secondVerticalX = endX - HORIZONTAL_SEGMENT;

  // Handle transition case: the horizontal segment goes from (firstVerticalX - r) to (secondVerticalX + r)
  // If first - r <= second + r, the segment would go RIGHT instead of LEFT (wrong direction)
  // In this case, use a simple elbow path instead of S-curve
  if (firstVerticalX - r <= secondVerticalX + r) {
    return calculateSimpleElbow(startX, startY, endX, endY, goDown);
  }

  if (goDown) {
    // Inverted S going down then left then down then right
    return (
      `M ${startX} ${startY} ` +
      // 1. Horizontal out from source
      `L ${firstVerticalX - r} ${startY} ` +
      // 2. First corner - turn down
      `Q ${firstVerticalX} ${startY}, ${firstVerticalX} ${startY + r} ` +
      // 3. Vertical down to middle
      `L ${firstVerticalX} ${middleY - r} ` +
      // 4. Second corner - turn left
      `Q ${firstVerticalX} ${middleY}, ${firstVerticalX - r} ${middleY} ` +
      // 5. Horizontal segment going left (between the tasks)
      `L ${secondVerticalX + r} ${middleY} ` +
      // 6. Third corner - turn down
      `Q ${secondVerticalX} ${middleY}, ${secondVerticalX} ${middleY + r} ` +
      // 7. Vertical down to target level
      `L ${secondVerticalX} ${endY - r} ` +
      // 8. Fourth corner - turn right
      `Q ${secondVerticalX} ${endY}, ${secondVerticalX + r} ${endY} ` +
      // 9. Horizontal into target
      `L ${endX} ${endY}`
    );
  } else {
    // Inverted S going up then left then up then right
    return (
      `M ${startX} ${startY} ` +
      // 1. Horizontal out from source
      `L ${firstVerticalX - r} ${startY} ` +
      // 2. First corner - turn up
      `Q ${firstVerticalX} ${startY}, ${firstVerticalX} ${startY - r} ` +
      // 3. Vertical up to middle
      `L ${firstVerticalX} ${middleY + r} ` +
      // 4. Second corner - turn left
      `Q ${firstVerticalX} ${middleY}, ${firstVerticalX - r} ${middleY} ` +
      // 5. Horizontal segment going left (between the tasks)
      `L ${secondVerticalX + r} ${middleY} ` +
      // 6. Third corner - turn up
      `Q ${secondVerticalX} ${middleY}, ${secondVerticalX} ${middleY - r} ` +
      // 7. Vertical up to target level
      `L ${secondVerticalX} ${endY + r} ` +
      // 8. Fourth corner - turn right
      `Q ${secondVerticalX} ${endY}, ${secondVerticalX + r} ${endY} ` +
      // 9. Horizontal into target
      `L ${endX} ${endY}`
    );
  }
}

/**
 * Calculate arrow path for a "temporary" dependency while dragging.
 * Uses the same elbow style for consistency.
 */
export function calculateDragPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): string {
  const horizontalGap = endX - startX;

  if (horizontalGap > HORIZONTAL_SEGMENT * 2) {
    return calculateElbowPath(startX, startY, endX, endY);
  }

  // For short distances or backwards, use simple line
  return `M ${startX} ${startY} L ${endX} ${endY}`;
}

/**
 * Calculate the SVG points for an arrowhead polygon.
 *
 * @param size - Size of the arrowhead (default 8px)
 * @returns SVG polygon points string
 */
export function getArrowheadPoints(size: number = 8): string {
  return `${-size},-${size / 2} 0,0 ${-size},${size / 2}`;
}
