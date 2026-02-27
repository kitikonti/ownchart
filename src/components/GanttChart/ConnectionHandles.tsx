/**
 * ConnectionHandles - Connection handles for creating dependencies
 * Renders circular handles at the start and end of task bars.
 * Sprint 1.4 - Dependencies (Finish-to-Start Only)
 */

import React, { memo, useState, useCallback } from "react";
import type { TaskId } from "../../types/branded.types";
import { CONNECTION_HANDLE } from "../../styles/design-tokens";

/** Distance from task edge to handle center */
const HANDLE_OFFSET = 10;

/** Handle radius in normal state */
const HANDLE_RADIUS_NORMAL = 6;

/** Handle radius when hovered */
const HANDLE_RADIUS_HOVER = 7;

/** Invisible hit area radius for easier clicking */
const HANDLE_HIT_AREA_RADIUS = 12;

/** Stroke width for handle circles */
const HANDLE_STROKE_WIDTH = 1.5;

/** Drop target ring settings */
const RING_OFFSET = 4;
const RING_OPACITY = 0.6;
const RING_STROKE_WIDTH = 2;

interface ConnectionHandlesProps {
  taskId: TaskId;
  x: number;
  y: number;
  width: number;
  height: number;
  isVisible: boolean;
  isValidDropTarget: boolean;
  isInvalidDropTarget: boolean;
  onDragStart: (
    taskId: TaskId,
    side: "start" | "end",
    e: React.MouseEvent
  ) => void;
  onHover?: (taskId: TaskId | null) => void;
  onDrop?: (taskId: TaskId) => void;
}

export const ConnectionHandles = memo(function ConnectionHandles({
  taskId,
  x,
  y,
  width,
  height,
  isVisible,
  isValidDropTarget,
  isInvalidDropTarget,
  onDragStart,
  onHover,
  onDrop,
}: ConnectionHandlesProps) {
  const [hoveredHandle, setHoveredHandle] = useState<"start" | "end" | null>(
    null
  );

  // Handle positions - offset outside the task bar to avoid conflict with resize handles
  const handleCenterY = y + height / 2;
  const handles: { cx: number; side: "start" | "end" }[] = [
    { cx: x - HANDLE_OFFSET, side: "start" },
    { cx: x + width + HANDLE_OFFSET, side: "end" },
  ];

  // Determine handle colors based on state - neutral by default
  let handleFill: string = CONNECTION_HANDLE.neutralFill;
  let handleStroke: string = CONNECTION_HANDLE.neutralStroke;

  if (isValidDropTarget) {
    handleFill = CONNECTION_HANDLE.validFill;
    handleStroke = CONNECTION_HANDLE.validStroke;
  } else if (isInvalidDropTarget) {
    handleFill = CONNECTION_HANDLE.invalidFill;
    handleStroke = CONNECTION_HANDLE.invalidStroke;
  }

  // Handle mouse down to start drag
  const handleMouseDown = useCallback(
    (side: "start" | "end") =>
      (e: React.MouseEvent): void => {
        e.stopPropagation();
        e.preventDefault();
        onDragStart(taskId, side, e);
      },
    [taskId, onDragStart]
  );

  // Keep task hovered when mouse enters handles
  const handleMouseEnter = useCallback(() => {
    onHover?.(taskId);
  }, [onHover, taskId]);

  // Handle drop on this task's handles
  const handleMouseUp = useCallback(() => {
    onDrop?.(taskId);
  }, [onDrop, taskId]);

  // Don't render if not visible and not a drop target
  if (!isVisible && !isValidDropTarget && !isInvalidDropTarget) {
    return null;
  }

  // Ring stroke color (only needed when drop target)
  const ringStroke = isValidDropTarget
    ? CONNECTION_HANDLE.validStroke
    : CONNECTION_HANDLE.invalidStroke;
  const showRings = isValidDropTarget || isInvalidDropTarget;

  return (
    <g
      className="connection-handles"
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
    >
      {handles.map(({ cx, side }) => {
        const radius =
          hoveredHandle === side ? HANDLE_RADIUS_HOVER : HANDLE_RADIUS_NORMAL;
        return (
          <g
            key={side}
            onMouseEnter={() => setHoveredHandle(side)}
            onMouseLeave={() => setHoveredHandle(null)}
            onMouseDown={handleMouseDown(side)}
          >
            {/* Invisible hit area */}
            <circle
              cx={cx}
              cy={handleCenterY}
              r={HANDLE_HIT_AREA_RADIUS}
              fill="transparent"
              className="cursor-crosshair"
            />
            {/* Visible handle */}
            <circle
              cx={cx}
              cy={handleCenterY}
              r={radius}
              fill={handleFill}
              stroke={handleStroke}
              strokeWidth={HANDLE_STROKE_WIDTH}
              className="cursor-crosshair transition-all duration-150"
            />
            {/* Drop target ring */}
            {showRings && (
              <circle
                cx={cx}
                cy={handleCenterY}
                r={radius + RING_OFFSET}
                fill="none"
                stroke={ringStroke}
                strokeWidth={RING_STROKE_WIDTH}
                opacity={RING_OPACITY}
                pointerEvents="none"
              />
            )}
          </g>
        );
      })}
    </g>
  );
});
