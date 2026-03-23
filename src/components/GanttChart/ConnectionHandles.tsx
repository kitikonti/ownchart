/**
 * ConnectionHandles - Connection handles for creating dependencies
 * Renders circular handles at the start and end of task bars.
 * Supports handle-based type inference for all 4 dependency types (FS/SS/FF/SF).
 */

import React, { memo, useState, useCallback } from "react";
import type { TaskId } from "@/types/branded.types";
import { CONNECTION_HANDLE } from "@/styles/design-tokens";

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
  onDrop?: (taskId: TaskId, side: "start" | "end") => void;
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

  // Pre-computed per-side handlers — stable references that don't change between renders
  // unless taskId or the callbacks change.
  const handleStartMouseDown = useCallback(
    (e: React.MouseEvent): void => {
      e.stopPropagation();
      e.preventDefault();
      onDragStart(taskId, "start", e);
    },
    [taskId, onDragStart]
  );

  const handleEndMouseDown = useCallback(
    (e: React.MouseEvent): void => {
      e.stopPropagation();
      e.preventDefault();
      onDragStart(taskId, "end", e);
    },
    [taskId, onDragStart]
  );

  const handleStartMouseUp = useCallback((): void => {
    onDrop?.(taskId, "start");
  }, [onDrop, taskId]);

  const handleEndMouseUp = useCallback((): void => {
    onDrop?.(taskId, "end");
  }, [onDrop, taskId]);

  // Keep task hovered when mouse enters handles
  const handleMouseEnter = useCallback(() => {
    onHover?.(taskId);
  }, [onHover, taskId]);

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
    <g className="connection-handles" onMouseEnter={handleMouseEnter}>
      {handles.map(({ cx, side }) => {
        const radius =
          hoveredHandle === side ? HANDLE_RADIUS_HOVER : HANDLE_RADIUS_NORMAL;
        const onMouseDown =
          side === "start" ? handleStartMouseDown : handleEndMouseDown;
        const onMouseUp =
          side === "start" ? handleStartMouseUp : handleEndMouseUp;
        return (
          <g
            key={side}
            onMouseEnter={() => setHoveredHandle(side)}
            onMouseLeave={() => setHoveredHandle(null)}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
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
