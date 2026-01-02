/**
 * GridLines component for Gantt chart background
 * Features: Adaptive grid density, weekend highlighting
 */

import { useMemo } from 'react';
import type { TimelineScale } from '../../utils/timelineUtils';
import { dateToPixel } from '../../utils/timelineUtils';
import { addDays, isWeekend } from '../../utils/dateUtils';

interface GridLinesProps {
  scale: TimelineScale;
  taskCount: number;
  showWeekends?: boolean;
  width?: number; // Optional override for grid width (defaults to scale.totalWidth)
}

const ROW_HEIGHT = 44; // Match TaskTable cell height (h-[44px] with border-box)

export function GridLines({
  scale,
  taskCount,
  showWeekends = true,
  width,
}: GridLinesProps) {
  // Use provided width or fall back to scale.totalWidth
  const gridWidth = width ?? scale.totalWidth;
  // ADAPTIVE GRID DENSITY (Critical from Frontend + Data Viz reviews)
  const gridInterval = useMemo(() => {
    const pixelsPerDay = scale.pixelsPerDay;
    if (pixelsPerDay < 2) return 30; // Monthly when very zoomed out
    if (pixelsPerDay < 5) return 7; // Weekly when zoomed out
    return 1; // Daily at normal zoom
  }, [scale.pixelsPerDay]);

  // Vertical lines (adaptive interval)
  // Draw lines for entire grid width, starting from scale.minDate
  const verticalLines = useMemo(() => {
    const lines: Array<{ x: number; date: string; isWeekend: boolean }> = [];
    let currentDate = scale.minDate;

    // Calculate end date based on grid width (not just scale.maxDate)
    const endX = gridWidth;
    const daysFromStart = Math.ceil(endX / scale.pixelsPerDay);
    const endDate = addDays(scale.minDate, daysFromStart);

    while (currentDate <= endDate) {
      const x = dateToPixel(currentDate, scale);

      // Only add lines that are within grid width and >= 0 (visible range)
      if (x >= 0 && x <= gridWidth) {
        lines.push({
          x,
          date: currentDate,
          isWeekend: isWeekend(currentDate),
        });
      }

      currentDate = addDays(currentDate, gridInterval);
    }

    return lines;
  }, [scale, gridInterval, gridWidth]);

  // Weekend columns for background highlighting
  // Draw weekends for entire grid width, starting from scale.minDate
  const weekendColumns = useMemo(() => {
    if (!showWeekends) return [];

    const columns: Array<{ x: number; date: string }> = [];
    let currentDate = scale.minDate;

    // Calculate end date based on grid width
    const endX = gridWidth;
    const daysFromStart = Math.ceil(endX / scale.pixelsPerDay);
    const endDate = addDays(scale.minDate, daysFromStart);

    while (currentDate <= endDate) {
      const x = dateToPixel(currentDate, scale);

      // Only add weekends that are within visible range (>= 0) and grid width
      if (x >= 0 && x <= gridWidth && isWeekend(currentDate)) {
        columns.push({
          x,
          date: currentDate,
        });
      }

      currentDate = addDays(currentDate, 1);
    }

    return columns;
  }, [scale, showWeekends, gridWidth]);

  // Horizontal lines (one per task row)
  const horizontalLines = useMemo(() => {
    return Array.from({ length: taskCount + 1 }, (_, i) => ({
      y: i * ROW_HEIGHT,
    }));
  }, [taskCount]);

  return (
    <g className="grid-lines">
      {/* Weekend background highlighting */}
      {weekendColumns.map(({ x, date }) => (
        <rect
          key={`weekend-${date}`}
          x={x}
          y={0}
          width={scale.pixelsPerDay}
          height={taskCount * ROW_HEIGHT}
          fill="#f1f3f5"
          opacity={0.6}
          className="weekend-column"
        />
      ))}

      {/* Vertical lines */}
      {verticalLines.map(({ x, date, isWeekend: isWeekendDay }) => (
        <line
          key={`vline-${date}`}
          x1={x}
          y1={0}
          x2={x}
          y2={taskCount * ROW_HEIGHT}
          stroke={isWeekendDay ? '#dee2e6' : '#e9ecef'}
          strokeWidth={1}
          className={isWeekendDay ? 'weekend-line' : 'day-line'}
        />
      ))}

      {/* Horizontal lines */}
      {horizontalLines.map(({ y }, i) => (
        <line
          key={`hline-${i}`}
          x1={0}
          y1={y}
          x2={gridWidth}
          y2={y}
          stroke="#e9ecef"
          strokeWidth={1}
        />
      ))}
    </g>
  );
}
