/**
 * LagDeltaIndicator — live "Xd → Yd" pill that floats near the successor end
 * of a dependency arrow during a drag/resize gesture in auto-update-lag
 * mode (auto-scheduling OFF, no Alt). Introduced in #82 stage 4.
 *
 * The pill is purely an SVG overlay rendered as the last child of
 * `<g class="layer-dependencies">`, so it sits on top of arrows but inside
 * the same coordinate system — no portal, no DOM/SVG transformation.
 *
 * Position is computed by re-running `calculateArrowPath()` for the affected
 * dependency with the current task positions. This guarantees pixel-perfect
 * alignment with the arrow even at non-default zoom levels because both
 * `DependencyArrow` and this component go through the same geometry pipeline.
 */

import { memo, useMemo } from "react";
import type { Dependency, TaskPosition } from "@/types/dependency.types";
import type { TaskId } from "@/types/branded.types";
import { calculateArrowPath } from "@/utils/arrowPath";
import { COLORS } from "@/styles/design-tokens";

/**
 * Format a single lag value for display. Always uses the suffix `d` (matches
 * the existing dependency panel label). Negative values use a Unicode minus
 * (`−`) instead of an ASCII hyphen so they aren't visually mistaken for a
 * hyphenation point inside the `Xd → Yd` arrow form.
 *
 * Exported for unit tests.
 */
export function formatLagValue(value: number): string {
  if (value < 0) return `−${Math.abs(value)}d`;
  return `${value}d`;
}

/**
 * Format the full `Xd → Yd` arrow text for the pill. Exported for tests.
 */
export function formatLagDeltaText(oldLag: number, newLag: number): string {
  return `${formatLagValue(oldLag)} → ${formatLagValue(newLag)}`;
}

// ─── Geometry constants ─────────────────────────────────────────────────────

/** Pill horizontal padding (px). */
const PILL_PADDING_X = 6;
/** Pill vertical padding (px). */
const PILL_PADDING_Y = 2;
/** Pill corner radius (px). */
const PILL_RADIUS = 8;
/** Pill text font-size (px). */
const PILL_FONT_SIZE = 11;
/** Approximate character width at PILL_FONT_SIZE for layout estimation. */
const APPROX_CHAR_WIDTH = 6.2;
/**
 * Vertical offset above the successor endpoint. Pulls the pill clear of
 * the arrowhead glyph so the two never collide visually.
 */
const PILL_VERTICAL_OFFSET = 14;

interface LagDeltaIndicatorProps {
  delta: { depId: string; oldLag: number; newLag: number };
  dependencies: readonly Dependency[];
  taskPositions: Map<TaskId, TaskPosition>;
  rowHeight: number;
}

export const LagDeltaIndicator = memo(function LagDeltaIndicator({
  delta,
  dependencies,
  taskPositions,
  rowHeight,
}: LagDeltaIndicatorProps): JSX.Element | null {
  const dep = useMemo(
    () => dependencies.find((d) => d.id === delta.depId),
    [dependencies, delta.depId]
  );

  const anchor = useMemo(() => {
    if (!dep) return null;
    const fromPos = taskPositions.get(dep.fromTaskId);
    const toPos = taskPositions.get(dep.toTaskId);
    if (!fromPos || !toPos) return null;
    return calculateArrowPath(fromPos, toPos, rowHeight, dep.type).arrowHead;
  }, [dep, taskPositions, rowHeight]);

  if (!dep || !anchor) return null;

  const text = formatLagDeltaText(delta.oldLag, delta.newLag);
  // Estimate text width without measuring the DOM (we run inside the same
  // RAF tick as the drag preview, so a synchronous getBBox would force
  // layout). The approximation is intentional — slight over/undersize is
  // visually invisible at 11px.
  const textWidth = Math.ceil(text.length * APPROX_CHAR_WIDTH);
  const pillWidth = textWidth + PILL_PADDING_X * 2;
  const pillHeight = PILL_FONT_SIZE + PILL_PADDING_Y * 2;
  // Centre the pill on the arrowhead horizontally and pull it above so it
  // doesn't overlap the arrowhead glyph.
  const pillX = anchor.x - pillWidth / 2;
  const pillY = anchor.y - PILL_VERTICAL_OFFSET - pillHeight;

  // i18n note (#82): the tooltip string is currently hard-coded English. The
  // existing dependency panel labels still use literal strings as well —
  // when the project gains an i18n layer (tracked separately), this string
  // moves through it.
  const tooltip = `Lag will update from ${formatLagValue(delta.oldLag)} to ${formatLagValue(delta.newLag)}`;

  return (
    <g
      className="layer-lag-delta-indicator"
      pointerEvents="none"
      data-testid="lag-delta-indicator"
      data-dep-id={dep.id}
    >
      <title>{tooltip}</title>
      <rect
        x={pillX}
        y={pillY}
        width={pillWidth}
        height={pillHeight}
        rx={PILL_RADIUS}
        ry={PILL_RADIUS}
        fill={COLORS.slate[100]}
        stroke={COLORS.slate[300]}
        strokeWidth={1}
      />
      <text
        x={anchor.x}
        y={pillY + pillHeight / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={PILL_FONT_SIZE}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fill={COLORS.slate[600]}
      >
        {text}
      </text>
    </g>
  );
});
