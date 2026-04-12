/**
 * LagDeltaIndicator — live "Xd → Yd" pills that float next to the dragged
 * task bar during a drag/resize gesture in auto-update-lag mode
 * (auto-scheduling OFF, no Alt). Introduced in #82 stage 4.
 *
 * Pills always render on the **same row** as the task being dragged/resized.
 * Outgoing deps (task is predecessor) show on the right; incoming deps
 * (task is successor) show on the left. Each side is positioned at the
 * outermost edge of original bar or preview bar (whichever extends further),
 * with a horizontal offset to clear the dependency handle circles.
 *
 * During resize, only pills whose lag is affected by the changed date edge
 * are shown (see `isDepAffectedByMode`).
 *
 * The pills are purely SVG overlays rendered as the last child of
 * `<g class="layer-dependencies">`, so they sit on top of arrows but inside
 * the same coordinate system — no portal, no DOM/SVG transformation.
 */

import { memo, useMemo } from "react";
import type { TaskPosition } from "@/types/dependency.types";
import type { TaskId } from "@/types/branded.types";
import type { LagDelta } from "@/utils/lagDeltaHelpers";
import type { Dependency } from "@/types/dependency.types";
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
/** Horizontal offset between the task bar edge and the pill (px). */
const PILL_HORIZONTAL_OFFSET = 22;
/** Vertical gap between stacked pills (px). */
const PILL_STACK_GAP = 2;

// ─── Anchor type ────────────────────────────────────────────────────────────

export type LagDeltaMode = "drag" | "resize-left" | "resize-right";

export interface LagDeltaAnchor {
  taskId: TaskId;
  previewLeft: number;
  previewRight: number;
  /** Interaction mode — used to filter pills to only those whose relevant
   *  date edge actually changed during a resize. */
  mode: LagDeltaMode;
}

/**
 * Whether a dependency's lag is affected by a change to a specific date edge
 * of the anchor task. During drag both edges move so all deps are affected.
 * During resize only start OR end moves, so we filter by dep type.
 *
 * | Dep Type | Predecessor uses | Successor uses |
 * |----------|-----------------|----------------|
 * | FS       | end             | start          |
 * | SS       | start           | start          |
 * | FF       | end             | end            |
 * | SF       | start           | end            |
 */
/** Exported for unit tests. */
export function isDepAffectedByMode(
  dep: Dependency,
  anchorTaskId: TaskId,
  mode: LagDeltaMode
): boolean {
  if (mode === "drag") return true;

  const changedEdge = mode === "resize-left" ? "start" : "end";
  const isPredecessor = dep.fromTaskId === anchorTaskId;

  // Which edge of the anchor task does this dep type use?
  const edgeUsed = isPredecessor
    ? dep.type === "SS" || dep.type === "SF"
      ? "start"
      : "end" // FS, FF use predecessor's end
    : dep.type === "FF" || dep.type === "SF"
      ? "end"
      : "start"; // FS, SS use successor's start

  return edgeUsed === changedEdge;
}

// ─── Single pill (internal) ─────────────────────────────────────────────────

interface LagDeltaPillProps {
  delta: LagDelta;
  anchor: LagDeltaAnchor;
  taskPositions: Map<TaskId, TaskPosition>;
  /** Which side of the task bar to place the pill on. */
  side: "left" | "right";
  /** 0-based stacking index per side — higher index renders further above. */
  stackIndex: number;
}

const LagDeltaPill = memo(function LagDeltaPill({
  delta,
  anchor,
  taskPositions,
  side,
  stackIndex,
}: LagDeltaPillProps): JSX.Element | null {
  const taskPos = taskPositions.get(anchor.taskId);
  if (!taskPos) return null;

  const text = formatLagDeltaText(delta.oldLag, delta.newLag);
  // Estimate text width without measuring the DOM (we run inside the same
  // RAF tick as the drag preview, so a synchronous getBBox would force
  // layout). The approximation is intentional — slight over/undersize is
  // visually invisible at 11px.
  const textWidth = Math.ceil(text.length * APPROX_CHAR_WIDTH);
  const pillWidth = textWidth + PILL_PADDING_X * 2;
  const pillHeight = PILL_FONT_SIZE + PILL_PADDING_Y * 2;

  // Position at the outermost edge so the pill never overlaps with either
  // the original bar or the preview bar.
  let pillX: number;
  if (side === "right") {
    const taskRight = taskPos.x + taskPos.width;
    const outerRight = Math.max(taskRight, anchor.previewRight);
    pillX = outerRight + PILL_HORIZONTAL_OFFSET;
  } else {
    const taskLeft = taskPos.x;
    const outerLeft = Math.min(taskLeft, anchor.previewLeft);
    pillX = outerLeft - PILL_HORIZONTAL_OFFSET - pillWidth;
  }

  // Vertically centred on the task row, stacked upward for multiple pills.
  const centerY = taskPos.y + taskPos.height / 2;
  const pillY =
    centerY - pillHeight / 2 - stackIndex * (pillHeight + PILL_STACK_GAP);

  const tooltip = `Lag will update from ${formatLagValue(delta.oldLag)} to ${formatLagValue(delta.newLag)}`;

  return (
    <g
      className="layer-lag-delta-indicator"
      pointerEvents="none"
      data-testid="lag-delta-indicator"
      data-dep-id={delta.depId}
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
        x={pillX + pillWidth / 2}
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

// ─── Multi-pill container (exported) ────────────────────────────────────────

interface LagDeltaIndicatorsProps {
  deltas: LagDelta[];
  dependencies: readonly Dependency[];
  taskPositions: Map<TaskId, TaskPosition>;
  anchor: LagDeltaAnchor;
}

/**
 * Renders one pill per lag delta. Pills stack vertically on the dragged
 * task's row so they don't overlap each other.
 */
export const LagDeltaIndicators = memo(function LagDeltaIndicators({
  deltas,
  dependencies,
  taskPositions,
  anchor,
}: LagDeltaIndicatorsProps): JSX.Element {
  // Resolve deps, assign side (left/right) and per-side stack indices.
  // Outgoing deps (dragged task is predecessor) → right side.
  // Incoming deps (dragged task is successor)  → left side.
  const resolved = useMemo(() => {
    const depMap = new Map(dependencies.map((d) => [d.id, d]));
    const items: {
      delta: LagDelta;
      side: "left" | "right";
      stackIndex: number;
    }[] = [];
    let leftCount = 0;
    let rightCount = 0;

    for (const delta of deltas) {
      const dep = depMap.get(delta.depId);
      if (!dep) continue;
      if (!isDepAffectedByMode(dep, anchor.taskId, anchor.mode)) continue;
      const side = dep.fromTaskId === anchor.taskId ? "right" : "left";
      const stackIndex = side === "right" ? rightCount++ : leftCount++;
      items.push({ delta, side, stackIndex });
    }
    return items;
  }, [deltas, dependencies, anchor.taskId, anchor.mode]);

  return (
    <>
      {resolved.map(({ delta, side, stackIndex }) => (
        <LagDeltaPill
          key={delta.depId}
          delta={delta}
          anchor={anchor}
          taskPositions={taskPositions}
          side={side}
          stackIndex={stackIndex}
        />
      ))}
    </>
  );
});
