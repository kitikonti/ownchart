/**
 * DependencyArrow - Single dependency arrow component
 * Renders an SVG path with arrowhead for a single dependency.
 * Sprint 1.4 - Dependencies (Finish-to-Start Only)
 */

import React, { memo, useMemo } from "react";
import type { Dependency, TaskPosition } from "../../types/dependency.types";
import type { Task } from "../../types/chart.types";
import { calculateArrowPath, getArrowheadPoints } from "../../utils/arrowPath";
import { COLORS } from "../../styles/design-tokens";

interface DependencyArrowProps {
  dependency: Dependency;
  fromTask: Task;
  toTask: Task;
  taskPositions: Map<string, TaskPosition>;
  rowHeight: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export const DependencyArrow = memo(function DependencyArrow({
  dependency,
  fromTask,
  toTask,
  taskPositions,
  rowHeight,
  isSelected,
  onSelect,
  onDelete,
}: DependencyArrowProps) {
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
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onDelete(dependency.id);
    }
    if (e.key === "Escape") {
      onSelect(""); // Deselect
    }
  };

  // Arrow colors - lighter for less visual noise
  const strokeColor = isSelected ? COLORS.chart.dependencySelected : COLORS.chart.dependencyDefault;
  const strokeWidth = isSelected ? 2.5 : 1.5;

  return (
    <g
      className="dependency-arrow"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="graphics-symbol"
      aria-label={`Dependency from ${fromTask.name} to ${toTask.name}`}
      style={{ outline: "none" }}
    >
      {/* Invisible wider hit area for easier clicking */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
        className="cursor-pointer"
      />

      {/* Arrow path */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        className="transition-colors duration-150 cursor-pointer hover:stroke-neutral-600"
      />

      {/* Arrowhead */}
      <polygon
        points={getArrowheadPoints(8)}
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
          strokeWidth={6}
          strokeDasharray="4 2"
          opacity={0.3}
          pointerEvents="none"
        />
      )}
    </g>
  );
});
