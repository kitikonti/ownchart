/**
 * TimelineHeader component for Gantt chart
 * Features: Multi-level scales, zoom-aware adaptation, weekday letters
 * Inspired by SVAR React Gantt's scale system
 */

import { useMemo } from 'react';
import { parseISO, format } from 'date-fns';
import type { TimelineScale, ScaleConfig } from '../../utils/timelineUtils';
import { dateToPixel, addUnit } from '../../utils/timelineUtils';

interface TimelineHeaderProps {
  scale: TimelineScale;
}

interface ScaleCell {
  date: Date;
  x: number;
  width: number;
  label: string;
}

const ROW_HEIGHT = 24; // Match table header height exactly (2×24px + 1px border = 49px)

/**
 * Generate cells for a scale configuration row
 * Inspired by SVAR's scale generation logic
 */
function generateScaleCells(
  scale: TimelineScale,
  config: ScaleConfig
): ScaleCell[] {
  const cells: ScaleCell[] = [];
  let currentDate = parseISO(scale.minDate);
  const endDate = parseISO(scale.maxDate);

  while (currentDate <= endDate) {
    const cellStart = currentDate;

    // Calculate cell position and width
    const x = dateToPixel(format(cellStart, 'yyyy-MM-dd'), scale);

    // For proper width calculation, use the next unit's start position
    const nextUnit = addUnit(currentDate, config.unit, config.step);
    const endX = dateToPixel(format(nextUnit, 'yyyy-MM-dd'), scale);
    const width = endX - x;

    // Format label
    const label =
      typeof config.format === 'function'
        ? config.format(cellStart)
        : format(cellStart, config.format);

    cells.push({
      date: cellStart,
      x,
      width,
      label,
    });

    // Move to next unit
    currentDate = addUnit(currentDate, config.unit, config.step);
  }

  return cells;
}

export function TimelineHeader({ scale }: TimelineHeaderProps) {
  // Generate cells for each scale row
  const scaleRows = useMemo(() => {
    return scale.scales.map((scaleConfig) => {
      return {
        config: scaleConfig,
        cells: generateScaleCells(scale, scaleConfig),
      };
    });
  }, [scale]);

  return (
    <g className="timeline-header">
      {/* Background */}
      <rect
        x={0}
        y={0}
        width={scale.totalWidth}
        height={scale.scales.length * ROW_HEIGHT}
        fill="#f8f9fa"
      />

      {/* Render each scale row */}
      {scaleRows.map(({ cells }, rowIndex) => (
        <g key={rowIndex} className={`scale-row scale-row-${rowIndex}`}>
          {cells.map((cell, cellIndex) => (
            <g key={cellIndex}>
              {/* Cell separator line */}
              <line
                x1={cell.x}
                y1={rowIndex * ROW_HEIGHT}
                x2={cell.x}
                y2={(rowIndex + 1) * ROW_HEIGHT}
                stroke="#dee2e6"
                strokeWidth={1}
              />

              {/* Cell label */}
              <text
                x={cell.x + cell.width / 2}
                y={rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2 + 4}
                fontSize={rowIndex === 0 ? 12 : 11}
                fontWeight={rowIndex === 0 ? 600 : 400}
                fill="#495057"
                textAnchor="middle"
              >
                {cell.label}
              </text>
            </g>
          ))}
        </g>
      ))}

      {/* Bottom border */}
      <line
        x1={0}
        y1={scale.scales.length * ROW_HEIGHT}
        x2={scale.totalWidth}
        y2={scale.scales.length * ROW_HEIGHT}
        stroke="#dee2e6"
        strokeWidth={1}
      />
    </g>
  );
}
