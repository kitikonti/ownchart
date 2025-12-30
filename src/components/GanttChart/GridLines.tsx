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
}

const ROW_HEIGHT = 44; // Match TaskTable cell height (h-[44px] with border-box)

export function GridLines({
  scale,
  taskCount,
  showWeekends = true,
}: GridLinesProps) {
  // ADAPTIVE GRID DENSITY (Critical from Frontend + Data Viz reviews)
  const gridInterval = useMemo(() => {
    const pixelsPerDay = scale.pixelsPerDay;
    if (pixelsPerDay < 2) return 30; // Monthly when very zoomed out
    if (pixelsPerDay < 5) return 7; // Weekly when zoomed out
    return 1; // Daily at normal zoom
  }, [scale.pixelsPerDay]);

  // Vertical lines (adaptive interval)
  const verticalLines = useMemo(() => {
    const lines: Array<{ x: number; date: string; isWeekend: boolean }> = [];
    let currentDate = scale.minDate;

    while (currentDate <= scale.maxDate) {
      lines.push({
        x: dateToPixel(currentDate, scale),
        date: currentDate,
        isWeekend: isWeekend(currentDate),
      });
      currentDate = addDays(currentDate, gridInterval);
    }

    return lines;
  }, [scale, gridInterval]);

  // Weekend columns for background highlighting
  const weekendColumns = useMemo(() => {
    if (!showWeekends) return [];

    const columns: Array<{ x: number; date: string }> = [];
    let currentDate = scale.minDate;

    while (currentDate <= scale.maxDate) {
      if (isWeekend(currentDate)) {
        columns.push({
          x: dateToPixel(currentDate, scale),
          date: currentDate,
        });
      }
      currentDate = addDays(currentDate, 1);
    }

    return columns;
  }, [scale, showWeekends]);

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
          x2={scale.totalWidth}
          y2={y}
          stroke="#e9ecef"
          strokeWidth={1}
        />
      ))}
    </g>
  );
}
