/**
 * DependencyArrow - Single dependency arrow component
 * Renders an SVG path with arrowhead for a single dependency.
 * Sprint 1.4 - Dependencies (Finish-to-Start Only)
 */

import React, { memo, useMemo, useState } from "react";
import type { TaskId } from "../../types/branded.types";
import type { Dependency, TaskPosition } from "../../types/dependency.types";
import {
  ARROWHEAD_SIZE,
  calculateArrowPath,
  getArrowheadPoints,
} from "../../utils/arrowPath";
import { COLORS } from "../../styles/design-tokens";

// ---------------------------------------------------------------------------
// Geometry constants
// ---------------------------------------------------------------------------

/** Invisible hit area width around the arrow path for easier clicking */
const HIT_AREA_STROKE_WIDTH = 14;
/** Default arrow stroke width (unselected) */
const STROKE_WIDTH_DEFAULT = 1.5;
/** Selected arrow stroke width */
const STROKE_WIDTH_SELECTED = 2.5;
/** Selected-state dashed overlay stroke width */
const SELECTION_OVERLAY_WIDTH = 6;
/** Selected-state dashed overlay dash pattern */
const SELECTION_DASH = "4 2";
/** Selected-state dashed overlay opacity */
const SELECTION_OPACITY = 0.3;

interface DependencyArrowProps {
  dependency: Dependency;
  fromTaskName: string;
  toTaskName: string;
  taskPositions: Map<TaskId, TaskPosition>;
  rowHeight: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export const DependencyArrow = memo(function DependencyArrow({
  dependency,
  fromTaskName,
  toTaskName,
  taskPositions,
  rowHeight,
  isSelected,
  onSelect,
  onDelete,
}: DependencyArrowProps) {
  const [isHovered, setIsHovered] = useState(false);

  const fromPos = taskPositions.get(dependency.fromTaskId);
  const toPos = taskPositions.get(dependency.toTaskId);

  // Calculate path using memoization
  const arrowData = useMemo(() => {
    if (!fromPos || !toPos) {
      return null;
    }
    return calculateArrowPath(fromPos, toPos, rowHeight);
  }, [fromPos, toPos, rowHeight]);

  // Don't render if positions not available
  if (!fromPos || !toPos || !arrowData) {
    return null;
  }

  const { path, arrowHead } = arrowData;

  const handleClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onSelect(dependency.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(dependency.id);
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onDelete(dependency.id);
    }
    if (e.key === "Escape") {
      onSelect(""); // Deselect
    }
  };

  // Arrow colors - lighter for less visual noise
  const strokeColor = isSelected
    ? COLORS.chart.dependencySelected
    : isHovered
      ? COLORS.chart.dependencyHover
      : COLORS.chart.dependencyDefault;
  const strokeWidth = isSelected ? STROKE_WIDTH_SELECTED : STROKE_WIDTH_DEFAULT;

  return (
    <g
      className="dependency-arrow outline-none focus-visible:outline-blue-500"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="graphics-symbol"
      aria-label={`Dependency from ${fromTaskName} to ${toTaskName}`}
    >
      {/* Invisible wider hit area for easier clicking */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={HIT_AREA_STROKE_WIDTH}
        className="cursor-pointer"
      />

      {/* Arrow path */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        className="transition-colors duration-150 cursor-pointer"
      />

      {/* Arrowhead */}
      <polygon
        points={getArrowheadPoints(ARROWHEAD_SIZE)}
        fill={strokeColor}
        transform={`translate(${arrowHead.x}, ${arrowHead.y}) rotate(${arrowHead.angle})`}
        className="transition-colors duration-150"
      />

      {/* Selection indicator - dashed outline */}
      {isSelected && (
        <path
          d={path}
          fill="none"
          stroke={COLORS.chart.dependencySelected}
          strokeWidth={SELECTION_OVERLAY_WIDTH}
          strokeDasharray={SELECTION_DASH}
          opacity={SELECTION_OPACITY}
          pointerEvents="none"
        />
      )}
    </g>
  );
});
