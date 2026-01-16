/**
 * TimelineHeader component for Gantt chart
 * Features: Multi-level scales, zoom-aware adaptation, weekday letters
 * Inspired by SVAR React Gantt's scale system
 */

import { useMemo } from "react";
import { parseISO, format, getWeek, isSameDay, startOfDay } from "date-fns";
import type { TimelineScale, ScaleConfig } from "../../utils/timelineUtils";
import {
  dateToPixel,
  addUnit,
  getUnitStart,
  getScaleConfig,
  FIXED_BASE_PIXELS_PER_DAY,
} from "../../utils/timelineUtils";
import { SVG_FONT_FAMILY } from "../../utils/export/constants";
import {
  useFirstDayOfWeek,
  useWeekNumberingSystem,
} from "../../store/slices/userPreferencesSlice";
import { COLORS } from "../../styles/design-tokens";

interface TimelineHeaderProps {
  scale: TimelineScale;
  width?: number; // Optional override for header width (defaults to scale.totalWidth)
}

interface ScaleCell {
  date: Date;
  x: number;
  width: number;
  label: string;
  isToday: boolean;
}

const ROW_HEIGHT = 24; // Match table header height exactly (2×24px + 1px border = 49px)

/**
 * Week options for date-fns getWeek function
 */
interface WeekOptions {
  weekStartsOn: 0 | 1;
  firstWeekContainsDate: 1 | 4;
}

/**
 * Format a label for a scale cell, using explicit week options for week units
 */
function formatLabel(
  date: Date,
  config: ScaleConfig,
  weekOptions: WeekOptions
): string {
  // For week units, format with explicit week options from preferences
  if (config.unit === "week") {
    const weekNum = getWeek(date, weekOptions);
    // Check if format function expects "Week X", "WX", or just number style
    if (typeof config.format === "function") {
      const sample = config.format(date);
      if (sample.startsWith("Week ")) {
        return `Week ${weekNum}`;
      }
      // If format returns just a number, keep it as number only
      if (/^\d+$/.test(sample)) {
        return `${weekNum}`;
      }
    }
    return `W${weekNum}`;
  }

  // For other units, use the config format
  if (typeof config.format === "function") {
    return config.format(date);
  }
  return format(date, config.format);
}

/**
 * Generate cells for a scale configuration row
 * Inspired by SVAR's scale generation logic
 * Draws cells for entire header width, not just task date range
 * IMPORTANT: Cells are aligned to unit boundaries (e.g., weeks start on Monday)
 * but only visible portions (>= scale.minDate) are drawn
 */
function generateScaleCells(
  scale: TimelineScale,
  config: ScaleConfig,
  headerWidth: number,
  weekOptions: WeekOptions,
  today: Date
): ScaleCell[] {
  const cells: ScaleCell[] = [];

  // Start at the beginning of the unit that contains minDate
  // This ensures weeks start on Monday, months on 1st, etc.
  let currentDate = getUnitStart(parseISO(scale.minDate), config.unit);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const cellStart = currentDate;

    // Calculate cell position and width
    const x = dateToPixel(format(cellStart, "yyyy-MM-dd"), scale);

    // For proper width calculation, use the next unit's start position
    const nextUnit = addUnit(currentDate, config.unit, config.step);
    const endX = dateToPixel(format(nextUnit, "yyyy-MM-dd"), scale);

    // Stop if we've exceeded the header width
    if (x >= headerWidth) break;

    // Skip cells that end before scale.minDate (outside visible range)
    const scaleMinDate = parseISO(scale.minDate);
    if (nextUnit < scaleMinDate) {
      currentDate = addUnit(currentDate, config.unit, config.step);
      continue;
    }

    // Clip cell to visible range [0, headerWidth]
    const clippedX = Math.max(x, 0);
    const clippedEndX = Math.min(endX, headerWidth);
    const clippedWidth = clippedEndX - clippedX;

    // Skip if cell is completely outside visible range
    if (clippedWidth <= 0) {
      currentDate = addUnit(currentDate, config.unit, config.step);
      continue;
    }

    // Format label using explicit week options
    const label = formatLabel(cellStart, config, weekOptions);

    // Check if this cell represents today (only relevant for day unit)
    const isToday = config.unit === "day" && isSameDay(cellStart, today);

    cells.push({
      date: cellStart,
      x: clippedX,
      width: clippedWidth,
      label,
      isToday,
    });

    // Move to next unit
    currentDate = addUnit(currentDate, config.unit, config.step);
  }

  return cells;
}

export function TimelineHeader({ scale, width }: TimelineHeaderProps) {
  // Use provided width or fall back to scale.totalWidth
  const headerWidth = width ?? scale.totalWidth;

  // Get regional preferences to trigger re-render when they change
  const firstDayOfWeek = useFirstDayOfWeek();
  const weekNumberingSystem = useWeekNumberingSystem();

  // Compute week options from preferences
  const weekOptions: WeekOptions = useMemo(
    () => ({
      weekStartsOn: firstDayOfWeek === "sunday" ? 0 : 1,
      firstWeekContainsDate: weekNumberingSystem === "us" ? 1 : 4,
    }),
    [firstDayOfWeek, weekNumberingSystem]
  );

  // Recompute scale configs when zoom changes
  const currentScales = useMemo(() => {
    return getScaleConfig(scale.zoom, FIXED_BASE_PIXELS_PER_DAY);
  }, [scale.zoom]);

  // Get today's date for highlighting (stable reference via startOfDay)
  const today = useMemo(() => startOfDay(new Date()), []);

  // Generate cells for each scale row
  // Includes weekOptions in deps to regenerate when preferences change
  const scaleRows = useMemo(() => {
    return currentScales.map((scaleConfig) => {
      return {
        config: scaleConfig,
        cells: generateScaleCells(
          scale,
          scaleConfig,
          headerWidth,
          weekOptions,
          today
        ),
      };
    });
  }, [scale, headerWidth, currentScales, weekOptions, today]);

  return (
    <g className="timeline-header">
      {/* Background */}
      <rect
        x={0}
        y={0}
        width={headerWidth}
        height={currentScales.length * ROW_HEIGHT}
        fill="#f8f9fa"
      />

      {/* Render each scale row */}
      {scaleRows.map(({ cells }, rowIndex) => (
        <g key={rowIndex} className={`scale-row scale-row-${rowIndex}`}>
          {cells.map((cell, cellIndex) => (
            <g key={cellIndex}>
              {/* Today highlight background (only for day cells) */}
              {cell.isToday && (
                <rect
                  x={cell.x}
                  y={rowIndex * ROW_HEIGHT}
                  width={cell.width}
                  height={ROW_HEIGHT}
                  fill={COLORS.chart.todayHighlight}
                />
              )}

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
                fontWeight={cell.isToday ? 600 : rowIndex === 0 ? 600 : 400}
                fontFamily={SVG_FONT_FAMILY}
                fill={cell.isToday ? COLORS.chart.todayMarker : "#495057"}
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
        y1={currentScales.length * ROW_HEIGHT}
        x2={headerWidth}
        y2={currentScales.length * ROW_HEIGHT}
        stroke="#dee2e6"
        strokeWidth={1}
      />
    </g>
  );
}
