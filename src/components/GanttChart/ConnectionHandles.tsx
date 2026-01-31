/**
 * ConnectionHandles - Connection handles for creating dependencies
 * Renders circular handles at the start and end of task bars.
 * Sprint 1.4 - Dependencies (Finish-to-Start Only)
 */

import React, { memo, useState, useCallback } from "react";

/** Distance from task edge to handle center */
const HANDLE_OFFSET = 10;

/** Handle radius in normal state */
const HANDLE_RADIUS_NORMAL = 6;

/** Handle radius when hovered */
const HANDLE_RADIUS_HOVER = 7;

/** Invisible hit area radius for easier clicking */
const HANDLE_HIT_AREA_RADIUS = 12;

interface ConnectionHandlesProps {
  taskId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isVisible: boolean;
  isValidDropTarget: boolean;
  isInvalidDropTarget: boolean;
  onDragStart: (
    taskId: string,
    side: "start" | "end",
    e: React.MouseEvent
  ) => void;
  onHover?: (taskId: string | null) => void;
  onDrop?: (taskId: string) => void;
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
  const handleRadius = hoveredHandle
    ? HANDLE_RADIUS_HOVER
    : HANDLE_RADIUS_NORMAL;
  const startHandleX = x - HANDLE_OFFSET;
  const endHandleX = x + width + HANDLE_OFFSET;

  // Determine handle colors based on state - neutral by default
  let handleFill = "#e2e8f0"; // neutral-200 (neutral)
  let handleStroke = "#94a3b8"; // neutral-400

  if (isValidDropTarget) {
    handleFill = "#bbf7d0"; // green-200
    handleStroke = "#22c55e"; // green-500
  } else if (isInvalidDropTarget) {
    handleFill = "#fecaca"; // red-200
    handleStroke = "#ef4444"; // red-500
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

  const opacity = isVisible || isValidDropTarget || isInvalidDropTarget ? 1 : 0;

  return (
    <g
      className="connection-handles"
      style={{ opacity, transition: "opacity 150ms" }}
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
    >
      {/* Start handle (left side) - positioned outside task bar */}
      <g
        onMouseEnter={() => setHoveredHandle("start")}
        onMouseLeave={() => setHoveredHandle(null)}
        onMouseDown={handleMouseDown("start")}
      >
        {/* Larger invisible hit area */}
        <circle
          cx={startHandleX}
          cy={handleCenterY}
          r={HANDLE_HIT_AREA_RADIUS}
          fill="transparent"
          className="cursor-crosshair"
        />
        {/* Visible handle */}
        <circle
          cx={startHandleX}
          cy={handleCenterY}
          r={handleRadius}
          fill={handleFill}
          stroke={handleStroke}
          strokeWidth={1.5}
          className="cursor-crosshair transition-all duration-150"
        />
      </g>

      {/* End handle (right side) - positioned outside task bar, primary for FS dependencies */}
      <g
        onMouseEnter={() => setHoveredHandle("end")}
        onMouseLeave={() => setHoveredHandle(null)}
        onMouseDown={handleMouseDown("end")}
      >
        {/* Larger invisible hit area */}
        <circle
          cx={endHandleX}
          cy={handleCenterY}
          r={HANDLE_HIT_AREA_RADIUS}
          fill="transparent"
          className="cursor-crosshair"
        />
        {/* Visible handle */}
        <circle
          cx={endHandleX}
          cy={handleCenterY}
          r={handleRadius}
          fill={handleFill}
          stroke={handleStroke}
          strokeWidth={1.5}
          className="cursor-crosshair transition-all duration-150"
        />
      </g>

      {/* Drop target indicator rings (when task is a valid/invalid target) */}
      {(isValidDropTarget || isInvalidDropTarget) && (
        <>
          {/* Start handle ring */}
          <circle
            cx={startHandleX}
            cy={handleCenterY}
            r={handleRadius + 4}
            fill="none"
            stroke={isValidDropTarget ? "#22c55e" : "#ef4444"}
            strokeWidth={2}
            opacity={0.6}
            pointerEvents="none"
          />
          {/* End handle ring */}
          <circle
            cx={endHandleX}
            cy={handleCenterY}
            r={handleRadius + 4}
            fill="none"
            stroke={isValidDropTarget ? "#22c55e" : "#ef4444"}
            strokeWidth={2}
            opacity={0.6}
            pointerEvents="none"
          />
        </>
      )}
    </g>
  );
});
