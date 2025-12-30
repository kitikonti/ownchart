/**
 * TaskBar component for rendering individual tasks on the Gantt chart
 * Features: Progress bars, clip-path, responsive milestone rendering, drag-to-edit
 */

import React, { useMemo } from 'react';
import type { Task } from '../../types/chart.types';
import type { TimelineScale } from '../../utils/timelineUtils';
import { getTaskBarGeometry, dateToPixel } from '../../utils/timelineUtils';
import { calculateDuration } from '../../utils/dateUtils';
import { useTaskBarInteraction } from '../../hooks/useTaskBarInteraction';

interface TaskBarProps {
  task: Task;
  scale: TimelineScale;
  rowIndex: number;
  isSelected: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

// Milestone diamond component
function MilestoneDiamond({
  x,
  y,
  size,
  color,
  isSelected,
  onClick,
  onMouseDown,
  onMouseMove,
  cursor,
  opacity = 1,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  isSelected: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent<SVGGElement>) => void;
  onMouseMove?: (e: React.MouseEvent<SVGGElement>) => void;
  cursor?: string;
  opacity?: number;
}) {
  const centerY = y + 16; // Center of 32px bar

  return (
    <g
      className="task-bar milestone"
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      style={{ cursor: cursor || 'pointer' }}
    >
      <path
        d={`M ${x} ${centerY}
            L ${x + size} ${centerY - size}
            L ${x + size * 2} ${centerY}
            L ${x + size} ${centerY + size}
            Z`}
        fill={color}
        fillOpacity={opacity}
        stroke={isSelected ? '#228be6' : 'none'}
        strokeWidth={isSelected ? 2 : 0}
      />
    </g>
  );
}

// Summary bracket component (clamp shape with downward tips)
function SummaryBracket({
  x,
  y,
  width,
  height,
  color,
  isSelected,
  onClick,
  taskName,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isSelected: boolean;
  onClick?: () => void;
  taskName: string;
}) {
  const tipHeight = height * 0.5; // Height of downward triangular tips (50% of bar height)
  const barThickness = height * 0.3; // Horizontal bar thickness (30% of bar height)
  const tipWidth = tipHeight * 0.577; // For 60-degree angle (tipHeight / tan(60°))
  const cornerRadius = 10; // Radius for top corners
  const innerRadius = 3; // Radius for inner corners where tips meet bar

  // Combined path for entire bracket (bar + both tips) with rounded inner corners
  const bracketPath = `
    M ${x + cornerRadius} ${y}
    L ${x + width - cornerRadius} ${y}
    Q ${x + width} ${y} ${x + width} ${y + cornerRadius}
    L ${x + width} ${y + barThickness}
    L ${x + width} ${y + barThickness + tipHeight}
    L ${x + width - tipWidth + innerRadius} ${y + barThickness + innerRadius}
    Q ${x + width - tipWidth} ${y + barThickness} ${x + width - tipWidth - innerRadius} ${y + barThickness}
    L ${x + tipWidth + innerRadius} ${y + barThickness}
    Q ${x + tipWidth} ${y + barThickness} ${x + tipWidth - innerRadius} ${y + barThickness + innerRadius}
    L ${x} ${y + barThickness + tipHeight}
    L ${x} ${y + barThickness}
    L ${x} ${y + cornerRadius}
    Q ${x} ${y} ${x + cornerRadius} ${y}
    Z
  `;

  return (
    <g className="task-bar summary" onClick={onClick}>
      {/* Complete bracket (bar + tips) as single path for unified outline */}
      <path
        d={bracketPath}
        fill={color}
        fillOpacity={0.9}
        stroke={isSelected ? '#228be6' : 'none'}
        strokeWidth={isSelected ? 2 : 0}
        style={{ cursor: 'not-allowed' }}
      />

      {/* Task name label - positioned to the right of the bracket */}
      <text
        x={x + width + 8}
        y={y + height / 2 + 4}
        fontSize={12}
        fill="#495057"
        fontWeight={600}
        pointerEvents="none"
      >
        {taskName}
      </text>
    </g>
  );
}

export const TaskBar = React.memo(function TaskBar({
  task,
  scale,
  rowIndex,
  isSelected,
  onClick,
  onDoubleClick,
}: TaskBarProps) {
  // Don't render if task has no valid dates (e.g., empty summary)
  // Milestones only need startDate, other types need both startDate and endDate
  if (task.type === 'milestone') {
    if (!task.startDate || task.startDate === '') {
      return null;
    }
  } else {
    if (!task.startDate || !task.endDate || task.startDate === '' || task.endDate === '') {
      return null;
    }
  }

  const geometry = useMemo(
    () => getTaskBarGeometry(task, scale, rowIndex, 44, 0), // headerHeight = 0 (header in separate SVG)
    [task, scale, rowIndex]
  );

  // Interaction hook for drag-to-edit functionality
  const {
    mode,
    previewGeometry,
    cursor,
    isDragging,
    onMouseDown,
    onMouseMove: onMouseMoveForCursor,
  } = useTaskBarInteraction(task, scale, geometry);

  // Prevent onClick when dragging
  const handleClick = () => {
    if (!isDragging && onClick) {
      onClick();
    }
  };

  // Calculate preview geometry if dragging/resizing
  const preview = useMemo(() => {
    if (!previewGeometry) return null;

    const x = dateToPixel(previewGeometry.startDate, scale);
    const width = calculateDuration(previewGeometry.startDate, previewGeometry.endDate) * scale.pixelsPerDay;

    return {
      x,
      y: geometry.y,
      width,
      height: geometry.height,
    };
  }, [previewGeometry, scale, geometry]);

  // Progress bar width
  const progressWidth = (geometry.width * task.progress) / 100;

  // Milestone rendering with responsive sizing (Data Viz review)
  if (task.type === 'milestone') {
    const size = Math.min(10, Math.max(6, scale.pixelsPerDay / 2));
    // Center the diamond in the middle of the day (offset by half day width minus diamond size)
    const centeredX = geometry.x + scale.pixelsPerDay / 2 - size;

    // Calculate preview position if dragging
    const previewX = preview ? preview.x + scale.pixelsPerDay / 2 - size : null;

    return (
      <g>
        {/* Original milestone (faded during drag) */}
        <MilestoneDiamond
          x={centeredX}
          y={geometry.y}
          size={size}
          color={task.color}
          isSelected={isSelected}
          onClick={handleClick}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMoveForCursor}
          cursor={cursor}
          opacity={mode !== 'idle' ? 0.3 : 1}
        />

        {/* Preview milestone (solid outline during drag) */}
        {previewX !== null && (
          <path
            d={`M ${previewX} ${geometry.y + 16}
                L ${previewX + size} ${geometry.y + 16 - size}
                L ${previewX + size * 2} ${geometry.y + 16}
                L ${previewX + size} ${geometry.y + 16 + size}
                Z`}
            fill="none"
            stroke="#228be6"
            strokeWidth={2}
            pointerEvents="none"
          />
        )}
      </g>
    );
  }

  // Summary rendering with bracket/clamp shape
  if (task.type === 'summary') {
    return (
      <SummaryBracket
        x={geometry.x}
        y={geometry.y}
        width={geometry.width}
        height={geometry.height}
        color={task.color}
        isSelected={isSelected}
        onClick={handleClick}
        taskName={task.name}
      />
    );
  }

  // Unique clip-path ID for this task
  const clipPathId = `clip-${task.id}`;

  return (
    <g
      className={`task-bar ${task.type}`}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMoveForCursor}
      style={{ cursor }}
    >
      {/* Clip-path definition */}
      <defs>
        <clipPath id={clipPathId}>
          <rect
            x={geometry.x}
            y={geometry.y}
            width={geometry.width}
            height={geometry.height}
            rx={4}
            ry={4}
          />
        </clipPath>
      </defs>

      {/* Background bar (fades during drag/resize) */}
      <rect
        x={geometry.x}
        y={geometry.y}
        width={geometry.width}
        height={geometry.height}
        fill={task.color}
        fillOpacity={mode !== 'idle' ? 0.3 : 0.8}
        stroke={isSelected ? '#228be6' : 'none'}
        strokeWidth={isSelected ? 2 : 0}
        rx={4}
        ry={4}
      />

      {/* Progress bar (uses clip-path to prevent overflow) */}
      {task.progress > 0 && (
        <rect
          x={geometry.x}
          y={geometry.y}
          width={progressWidth}
          height={geometry.height}
          fill={task.color}
          fillOpacity={1}
          clipPath={`url(#${clipPathId})`}
        />
      )}

      {/* Preview outline (shown during drag/resize) */}
      {preview && (
        <rect
          x={preview.x}
          y={preview.y}
          width={preview.width}
          height={preview.height}
          fill="none"
          stroke="#228be6"
          strokeWidth={2}
          strokeDasharray="4 4"
          rx={4}
          ry={4}
          pointerEvents="none"
        />
      )}

      {/* Task name label (with truncation via clip-path only) */}
      {geometry.width > 40 && (
        <text
          x={geometry.x + 8}
          y={geometry.y + geometry.height / 2 + 4}
          fontSize={12}
          fill="#fff"
          clipPath={`url(#${clipPathId})`}
        >
          {task.name}
        </text>
      )}
    </g>
  );
});
