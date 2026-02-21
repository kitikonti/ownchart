/**
 * DependencyDragPreview - Temporary arrow shown while creating a dependency
 * Follows the mouse cursor during drag interaction.
 * Sprint 1.4 - Dependencies (Finish-to-Start Only)
 */

import { memo, useMemo } from "react";
import { calculateDragPath, getArrowheadPoints } from "../../utils/arrowPath";
import { COLORS } from "../../styles/design-tokens";

// ---------------------------------------------------------------------------
// Geometry constants
// ---------------------------------------------------------------------------

/** Arrowhead polygon size (px) — matches DependencyArrow */
const ARROWHEAD_SIZE = 8;
/** Drag preview line stroke width */
const PREVIEW_STROKE_WIDTH = 2;
/** Drag preview dash pattern */
const PREVIEW_DASH = "6 4";
/** Drag preview opacity for line, arrowhead, and start indicator */
const PREVIEW_OPACITY = 0.8;
/** Start point indicator circle radius */
const START_POINT_RADIUS = 5;

interface DependencyDragPreviewProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export const DependencyDragPreview = memo(function DependencyDragPreview({
  startX,
  startY,
  endX,
  endY,
}: DependencyDragPreviewProps) {
  // Calculate path from start to current mouse position
  const path = useMemo(() => {
    return calculateDragPath(startX, startY, endX, endY);
  }, [startX, startY, endX, endY]);

  // Calculate arrowhead angle
  const arrowAngle = useMemo(() => {
    const dx = endX - startX;
    const dy = endY - startY;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }, [startX, startY, endX, endY]);

  return (
    <g className="dependency-drag-preview" pointerEvents="none">
      {/* Preview path */}
      <path
        d={path}
        fill="none"
        stroke={COLORS.chart.dependencySelected}
        strokeWidth={PREVIEW_STROKE_WIDTH}
        strokeDasharray={PREVIEW_DASH}
        opacity={PREVIEW_OPACITY}
      />

      {/* Preview arrowhead */}
      <polygon
        points={getArrowheadPoints(ARROWHEAD_SIZE)}
        fill={COLORS.chart.dependencySelected}
        opacity={PREVIEW_OPACITY}
        transform={`translate(${endX}, ${endY}) rotate(${arrowAngle})`}
      />

      {/* Start point indicator */}
      <circle
        cx={startX}
        cy={startY}
        r={START_POINT_RADIUS}
        fill={COLORS.chart.dependencySelected}
        opacity={PREVIEW_OPACITY}
      />
    </g>
  );
});
