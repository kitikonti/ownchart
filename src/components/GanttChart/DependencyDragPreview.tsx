/**
 * DependencyDragPreview - Temporary arrow shown while creating a dependency
 * Follows the mouse cursor during drag interaction.
 * Sprint 1.4 - Dependencies (Finish-to-Start Only)
 */

import { memo, useMemo } from "react";
import { calculateDragPath, getArrowheadPoints } from "../../utils/arrowPath";
import { COLORS } from "../../styles/design-tokens";

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
        strokeWidth={2}
        strokeDasharray="6 4"
        opacity={0.8}
      />

      {/* Preview arrowhead */}
      <polygon
        points={getArrowheadPoints(8)}
        fill={COLORS.chart.dependencySelected}
        opacity={0.8}
        transform={`translate(${endX}, ${endY}) rotate(${arrowAngle})`}
      />

      {/* Start point indicator */}
      <circle
        cx={startX}
        cy={startY}
        r={5}
        fill={COLORS.chart.dependencySelected}
        opacity={0.8}
      />
    </g>
  );
});
