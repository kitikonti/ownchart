/**
 * TaskBar component for rendering individual tasks on the Gantt chart
 * Features: Progress bars, clip-path, responsive milestone rendering
 */

import React, { useMemo } from 'react';
import type { Task } from '../../types/chart.types';
import type { TimelineScale } from '../../utils/timelineUtils';
import { getTaskBarGeometry } from '../../utils/timelineUtils';

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
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  isSelected: boolean;
  onClick?: () => void;
}) {
  const centerY = y + 16; // Center of 32px bar

  return (
    <g className="task-bar milestone" onClick={onClick}>
      <path
        d={`M ${x} ${centerY}
            L ${x + size} ${centerY - size}
            L ${x + size * 2} ${centerY}
            L ${x + size} ${centerY + size}
            Z`}
        fill={color}
        stroke={isSelected ? '#228be6' : '#495057'}
        strokeWidth={isSelected ? 2 : 1}
        style={{ cursor: 'pointer' }}
      />
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
  const geometry = useMemo(
    () => getTaskBarGeometry(task, scale, rowIndex, 44, 0), // headerHeight = 0 (header in separate SVG)
    [task, scale, rowIndex]
  );

  // Progress bar width
  const progressWidth = (geometry.width * task.progress) / 100;

  // Milestone rendering with responsive sizing (Data Viz review)
  if (task.type === 'milestone') {
    const size = Math.min(10, Math.max(6, scale.pixelsPerDay / 2));
    return (
      <MilestoneDiamond
        x={geometry.x}
        y={geometry.y}
        size={size}
        color={task.color}
        isSelected={isSelected}
        onClick={onClick}
      />
    );
  }

  // Unique clip-path ID for this task
  const clipPathId = `clip-${task.id}`;

  return (
    <g
      className={`task-bar ${task.type}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{ cursor: 'pointer' }}
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

      {/* Background bar */}
      <rect
        x={geometry.x}
        y={geometry.y}
        width={geometry.width}
        height={geometry.height}
        fill={task.color}
        fillOpacity={(task.type || 'task') === 'summary' ? 0.3 : 0.8}
        stroke={isSelected ? '#228be6' : 'none'}
        strokeWidth={isSelected ? 2 : 0}
        rx={4}
        ry={4}
      />

      {/* Progress bar (uses clip-path to prevent overflow) */}
      {task.progress > 0 && (task.type || 'task') !== 'summary' && (
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

      {/* Task name label (with truncation via clip-path only) */}
      {geometry.width > 40 && (
        <text
          x={geometry.x + 8}
          y={geometry.y + geometry.height / 2 + 4}
          fontSize={12}
          fill="#fff"
          fontWeight={(task.type || 'task') === 'summary' ? 600 : 400}
          clipPath={`url(#${clipPathId})`}
        >
          {task.name}
        </text>
      )}
    </g>
  );
});
