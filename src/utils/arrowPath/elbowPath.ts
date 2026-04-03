/**
 * Arrow Path Calculation for Dependency Arrows
 * Generates orthogonal (elbow-style) SVG paths with rounded corners.
 * Supports all 4 dependency types: FS, SS, FF, SF.
 */

import type {
  ArrowPath,
  DependencyType,
  Point,
  TaskPosition,
} from "@/types/dependency.types";

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

/** Vertical distance (exclusive upper bound) below which two points are treated as same-row. */
const SAME_ROW_THRESHOLD_PX = 2;

/** Multiplier applied to corner radius to compute minimum vertical space needed for S-curve turns. */
const CURVE_SPACE_MULTIPLIER = 4;

/** Row height fraction used to extend routing offset when tasks are vertically too close for curves. */
const ROUTING_OFFSET_RATIO = 0.4;

/** Divisor applied to available space when computing adaptive corner radius in tight spaces. */
const ADAPTIVE_RADIUS_DIVISOR = 4;

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

/** True when the vertical distance between two points is strictly less than SAME_ROW_THRESHOLD_PX. */
function isSameRow(from: Point, to: Point): boolean {
  return Math.abs(to.y - from.y) < SAME_ROW_THRESHOLD_PX;
}

/** Build a straight line path from `from` to `to`. */
function buildStraightLine(from: Point, to: Point): string {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
}

/** Format a single quadratic bezier corner segment. */
function quadraticCorner(controlPoint: Point, end: Point): string {
  return `Q ${controlPoint.x} ${controlPoint.y}, ${end.x} ${end.y}`;
}

/**
 * Build a two-corner elbow path with an explicit turn-X coordinate.
 * Generalizes the standard elbow: the vertical segment is placed at turnX
 * instead of always at the midpoint. This enables "hook" shapes for FF/SS
 * where the turn must be outside both endpoints, not between them.
 * Corner directions (exitH / entryH) are derived from geometry.
 * Degenerates to a straight line when from and to are on the same row.
 */
function buildElbowAtTurnX(
  from: Point,
  to: Point,
  turnX: number,
  cornerRadius: number
): string {
  if (isSameRow(from, to)) {
    return buildStraightLine(from, to);
  }

  const dir = getVerticalDir(from, to);
  const exitH = turnX >= from.x ? 1 : -1;
  const entryH = to.x >= turnX ? 1 : -1;

  // Clamp radius to the shorter horizontal arm to prevent corner overflow
  // (e.g., at rowHeight=88, cornerRadius=16 > HORIZONTAL_SEGMENT=15)
  const armFrom = Math.abs(turnX - from.x);
  const armTo = Math.abs(turnX - to.x);
  const r = Math.min(cornerRadius, armFrom, armTo);

  return [
    `M ${from.x} ${from.y}`,
    `L ${turnX - exitH * r} ${from.y}`,
    quadraticCorner({ x: turnX, y: from.y }, { x: turnX, y: from.y + dir * r }),
    `L ${turnX} ${to.y - dir * r}`,
    quadraticCorner({ x: turnX, y: to.y }, { x: turnX + entryH * r, y: to.y }),
    `L ${to.x} ${to.y}`,
  ].join(" ");
}

/**
 * Build a two-corner (standard elbow) path string.
 * Both corners meet at the horizontal midpoint between from and to.
 * Thin wrapper around buildElbowAtTurnX with turnX = midpoint.
 */
function buildTwoCornerPath(
  from: Point,
  to: Point,
  cornerRadius: number
): string {
  return buildElbowAtTurnX(from, to, (from.x + to.x) / 2, cornerRadius);
}

/**
 * Same-row fallback for FF/SS hooks.
 * A straight line would cross through task bars, so we extend middleY
 * below (or above) to produce a U-shaped S-curve instead.
 */
function buildFFSSSameRowPath(
  from: Point,
  to: Point,
  turnX: number,
  cornerRadius: number,
  rowHeight: number
): string {
  const minSpaceForCurves = CURVE_SPACE_MULTIPLIER * cornerRadius;
  const middleY = calculateMiddleY(from, to, minSpaceForCurves, rowHeight);
  const exitDir: 1 | -1 = turnX >= from.x ? 1 : -1;
  const entryDir: 1 | -1 = turnX >= to.x ? -1 : 1;
  return buildSCurvePath(from, to, middleY, cornerRadius, exitDir, entryDir);
}

/**
 * Calculate simple elbow path for transition cases (small positive gaps).
 * Uses an adaptive radius that shrinks to fit within the available space.
 */
function calculateSimpleElbow(
  from: Point,
  to: Point,
  baseRadius: number
): string {
  const horizontalGap = Math.abs(to.x - from.x);
  const verticalGap = Math.abs(to.y - from.y);

  // Clamp to zero: at large row heights the S-curve threshold can dip below zero,
  // making horizontalGap near-zero here. A zero radius degrades to a sharp corner
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
      minSpaceForCurves / 2,
      rowHeight * ROUTING_OFFSET_RATIO
    );
    const extremeY =
      dir === 1 ? Math.max(from.y, to.y) : Math.min(from.y, to.y);
    return extremeY + dir * offset;
  }
  return (from.y + to.y) / 2;
}

/**
 * Build the four-corner S-curve path string.
 * The path exits horizontally, turns vertical, crosses the middle Y, reverses
 * horizontal direction, then enters the target horizontally.
 * Vertical direction is derived from the y-coordinates.
 * Horizontal exit/entry directions are parameterized to support all dependency types.
 */
function buildSCurvePath(
  from: Point,
  to: Point,
  middleY: number,
  cornerRadius: number,
  exitDir: 1 | -1 = 1,
  entryDir: 1 | -1 = 1
): string {
  const r = cornerRadius;
  const dir = getVerticalDir(from, to);
  const firstX = from.x + exitDir * HORIZONTAL_SEGMENT;
  const secondX = to.x - entryDir * HORIZONTAL_SEGMENT;

  return [
    `M ${from.x} ${from.y}`,
    // 1. Horizontal out from source (in exitDir direction)
    `L ${firstX - exitDir * r} ${from.y}`,
    // 2. First corner — turn toward middle
    quadraticCorner(
      { x: firstX, y: from.y },
      { x: firstX, y: from.y + dir * r }
    ),
    // 3. Vertical to middle
    `L ${firstX} ${middleY - dir * r}`,
    // 4. Second corner — turn toward target (opposite of exitDir)
    quadraticCorner(
      { x: firstX, y: middleY },
      { x: firstX - exitDir * r, y: middleY }
    ),
    // 5. Horizontal segment between tasks
    `L ${secondX + entryDir * r} ${middleY}`,
    // 6. Third corner — turn toward target row
    quadraticCorner(
      { x: secondX, y: middleY },
      { x: secondX, y: middleY + dir * r }
    ),
    // 7. Vertical to target level
    `L ${secondX} ${to.y - dir * r}`,
    // 8. Fourth corner — turn into target (in entryDir direction)
    quadraticCorner(
      { x: secondX, y: to.y },
      { x: secondX + entryDir * r, y: to.y }
    ),
    // 9. Horizontal into target
    `L ${to.x} ${to.y}`,
  ].join(" ");
}

/**
 * Route a path when the horizontal gap is too small for a standard elbow.
 * Delegates to a compact 2-corner elbow when there is just enough room,
 * or falls back to a 4-corner S-curve when tasks are very close or overlapping.
 */
function calculateRoutedPath(
  from: Point,
  to: Point,
  rowHeight: number,
  cornerRadius: number,
  exitDir: 1 | -1 = 1,
  entryDir: 1 | -1 = 1
): string {
  const horizontalGap = to.x - from.x;

  // Transition case: enough horizontal room for a compact 2-corner elbow.
  // Effective lower-bound gap: HORIZONTAL_SEGMENT * 2 − cornerRadius * 2.
  if (horizontalGap >= 2 * (HORIZONTAL_SEGMENT - cornerRadius)) {
    return calculateSimpleElbow(from, to, cornerRadius);
  }

  const minSpaceForCurves = CURVE_SPACE_MULTIPLIER * cornerRadius;
  const middleY = calculateMiddleY(from, to, minSpaceForCurves, rowHeight);
  return buildSCurvePath(from, to, middleY, cornerRadius, exitDir, entryDir);
}

/**
 * Compute routing parameters shared by calculateArrowPath and calculateDragPath.
 * Extracted to keep both call sites consistent — cornerRadius scales with rowHeight,
 * minGapForElbow derives from cornerRadius, and horizontalGap is the raw x-delta.
 */
function computeElbowParams(
  from: Point,
  to: Point,
  rowHeight: number
): { cornerRadius: number; minGapForElbow: number; horizontalGap: number } {
  const cornerRadius = getScaledCornerRadius(rowHeight);
  const minGapForElbow = computeMinGapForElbow(cornerRadius);
  const horizontalGap = to.x - from.x;
  return { cornerRadius, minGapForElbow, horizontalGap };
}

/** FS: Finish-to-Start — source right edge, target left edge. */
function getFSConnectionPoints(
  fromPos: TaskPosition,
  toPos: TaskPosition
): { from: Point; to: Point } {
  return {
    from: { x: fromPos.x + fromPos.width, y: fromPos.y + fromPos.height / 2 },
    to: { x: toPos.x, y: toPos.y + toPos.height / 2 },
  };
}

/** SS: Start-to-Start — both anchors on the left edge. */
function getSSConnectionPoints(
  fromPos: TaskPosition,
  toPos: TaskPosition
): { from: Point; to: Point } {
  return {
    from: { x: fromPos.x, y: fromPos.y + fromPos.height / 2 },
    to: { x: toPos.x, y: toPos.y + toPos.height / 2 },
  };
}

/** FF: Finish-to-Finish — both anchors on the right edge. */
function getFFConnectionPoints(
  fromPos: TaskPosition,
  toPos: TaskPosition
): { from: Point; to: Point } {
  return {
    from: { x: fromPos.x + fromPos.width, y: fromPos.y + fromPos.height / 2 },
    to: { x: toPos.x + toPos.width, y: toPos.y + toPos.height / 2 },
  };
}

/** SF: Start-to-Finish — source left edge, target right edge. */
function getSFConnectionPoints(
  fromPos: TaskPosition,
  toPos: TaskPosition
): { from: Point; to: Point } {
  return {
    from: { x: fromPos.x, y: fromPos.y + fromPos.height / 2 },
    to: { x: toPos.x + toPos.width, y: toPos.y + toPos.height / 2 },
  };
}

/** Get connection points for a dependency based on its type. */
function getConnectionPoints(
  type: DependencyType,
  fromPos: TaskPosition,
  toPos: TaskPosition
): { from: Point; to: Point } {
  switch (type) {
    case "SS":
      return getSSConnectionPoints(fromPos, toPos);
    case "FF":
      return getFFConnectionPoints(fromPos, toPos);
    case "SF":
      return getSFConnectionPoints(fromPos, toPos);
    case "FS":
    default:
      return getFSConnectionPoints(fromPos, toPos);
  }
}

/** Get the horizontal exit direction for the source anchor. */
function getExitDirection(type: DependencyType): 1 | -1 {
  // FS/FF exit right (from right edge), SS/SF exit left (from left edge)
  return type === "SS" || type === "SF" ? -1 : 1;
}

/** Get the horizontal entry direction for the target anchor. */
function getEntryDirection(type: DependencyType): 1 | -1 {
  // FS/SS enter from left (into left edge), FF/SF enter from right (into right edge)
  return type === "FF" || type === "SF" ? -1 : 1;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate the SVG path for a dependency arrow.
 * Uses orthogonal routing with rounded 90° corners.
 *
 * Routing strategy per type:
 * - FS: 3-zone routing (standard elbow → compact elbow → S-curve)
 * - FF: Hook-right — vertical turn to the right of both right edges
 * - SS: Hook-left — vertical turn to the left of both left edges
 * - SF: Reversed 3-zone (elbow → compact elbow → S-curve, gap = from.x − to.x)
 *
 * @param fromPos - Position of predecessor task bar
 * @param toPos - Position of successor task bar
 * @param rowHeight - Height of each row (used for scaling corners)
 * @param type - Dependency type (FS, SS, FF, SF) — defaults to FS
 * @returns ArrowPath with SVG path and arrowhead position
 */
export function calculateArrowPath(
  fromPos: TaskPosition,
  toPos: TaskPosition,
  rowHeight: number = BASE_ROW_HEIGHT,
  type: DependencyType = "FS"
): ArrowPath {
  const { from, to } = getConnectionPoints(type, fromPos, toPos);
  const { cornerRadius, minGapForElbow } = computeElbowParams(
    from,
    to,
    rowHeight
  );

  const exitDir = getExitDirection(type);
  const entryDir = getEntryDirection(type);

  let path: string;
  switch (type) {
    case "FS": {
      // FS: 3-zone routing (standard elbow, compact elbow, S-curve)
      const horizontalGap = to.x - from.x;
      path =
        horizontalGap >= minGapForElbow
          ? buildTwoCornerPath(from, to, cornerRadius)
          : calculateRoutedPath(
              from,
              to,
              rowHeight,
              cornerRadius,
              exitDir,
              entryDir
            );
      break;
    }
    case "FF": {
      // Hook-right: vertical turn to the right of both right edges
      const turnX = Math.max(from.x, to.x) + HORIZONTAL_SEGMENT;
      path = isSameRow(from, to)
        ? buildFFSSSameRowPath(from, to, turnX, cornerRadius, rowHeight)
        : buildElbowAtTurnX(from, to, turnX, cornerRadius);
      break;
    }
    case "SS": {
      // Hook-left: vertical turn to the left of both left edges
      const turnX = Math.min(from.x, to.x) - HORIZONTAL_SEGMENT;
      path = isSameRow(from, to)
        ? buildFFSSSameRowPath(from, to, turnX, cornerRadius, rowHeight)
        : buildElbowAtTurnX(from, to, turnX, cornerRadius);
      break;
    }
    case "SF": {
      // Reversed 3-zone: gap measured as from.x − to.x
      const reversedGap = from.x - to.x;
      if (reversedGap >= minGapForElbow) {
        path = buildElbowAtTurnX(from, to, (from.x + to.x) / 2, cornerRadius);
      } else if (reversedGap >= 2 * (HORIZONTAL_SEGMENT - cornerRadius)) {
        path = calculateSimpleElbow(from, to, cornerRadius);
      } else {
        const minSpaceForCurves = CURVE_SPACE_MULTIPLIER * cornerRadius;
        const middleY = calculateMiddleY(
          from,
          to,
          minSpaceForCurves,
          rowHeight
        );
        path = buildSCurvePath(
          from,
          to,
          middleY,
          cornerRadius,
          exitDir,
          entryDir
        );
      }
      break;
    }
  }

  // Arrowhead: 0° for left-edge targets (FS, SS), 180° for right-edge targets (FF, SF)
  const arrowAngle = type === "FF" || type === "SF" ? 180 : 0;

  return {
    path,
    arrowHead: {
      x: to.x,
      y: to.y,
      angle: arrowAngle,
    },
  };
}

/**
 * Calculate arrow path for a "temporary" dependency while dragging.
 * Uses the same elbow style for consistency. Tight/backwards gaps fall back to a
 * straight line — compact-elbow and S-curve routing are intentionally omitted during
 * drag for visual clarity. Corner radius and gap threshold scale with rowHeight to
 * stay consistent with calculateArrowPath at any zoom level.
 *
 * @param from - Current drag source point
 * @param to - Current drag target point
 * @param rowHeight - Height of each row (defaults to BASE_ROW_HEIGHT)
 * @returns SVG path string (`d` attribute)
 */
export function calculateDragPath(
  from: Point,
  to: Point,
  rowHeight: number = BASE_ROW_HEIGHT
): string {
  const { cornerRadius, minGapForElbow, horizontalGap } = computeElbowParams(
    from,
    to,
    rowHeight
  );

  if (horizontalGap >= minGapForElbow) {
    return buildTwoCornerPath(from, to, cornerRadius);
  }

  return buildStraightLine(from, to);
}

/**
 * Calculate the SVG points for an arrowhead polygon.
 * The polygon points left (negative X) so the tip sits at the origin (0,0),
 * letting the consumer translate/rotate as needed.
 *
 * Negative sizes are clamped to 0 (degenerate polygon, invisible in SVG).
 *
 * @param size - Size of the arrowhead in pixels (default 8px); negative values treated as 0
 * @returns SVG polygon points string in "x1,y1 x2,y2 x3,y3" format
 */
export function getArrowheadPoints(size: number = ARROWHEAD_SIZE): string {
  const s = Math.max(0, size);
  return `${-s},${-(s / 2)} 0,0 ${-s},${s / 2}`;
}
