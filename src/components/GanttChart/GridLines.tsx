/**
 * GridLines component for Gantt chart background
 * Features: Adaptive grid density, weekend highlighting, holiday highlighting
 * Sprint 1.5.9: Added holiday highlighting support
 */

import { useMemo } from "react";
import {
  parseISO,
  format,
  startOfWeek,
  startOfMonth,
  addWeeks,
  addMonths,
} from "date-fns";
import type { TimelineScale } from "../../utils/timelineUtils";
import { dateToPixel } from "../../utils/timelineUtils";
import { addDays, isWeekend } from "../../utils/dateUtils";
import { holidayService } from "../../services/holidayService";
import { useFirstDayOfWeek } from "../../store/slices/userPreferencesSlice";

interface GridLinesProps {
  scale: TimelineScale;
  taskCount: number;
  showWeekends?: boolean;
  showHolidays?: boolean; // Sprint 1.5.9: Holiday highlighting
  holidayRegion?: string; // Sprint 1.5.9: Holiday region code
  width?: number; // Optional override for grid width (defaults to scale.totalWidth)
  rowHeight?: number; // Dynamic row height from density config
}

export function GridLines({
  scale,
  taskCount,
  showWeekends = true,
  showHolidays = false,
  holidayRegion = "",
  width,
  rowHeight = 36, // Default to Normal density
}: GridLinesProps): JSX.Element {
  // Use provided width or fall back to scale.totalWidth
  const gridWidth = width ?? scale.totalWidth;

  // Get first day of week from user preferences (0 = Sunday, 1 = Monday)
  const firstDayOfWeek = useFirstDayOfWeek();
  const weekStartsOn: 0 | 1 = firstDayOfWeek === "sunday" ? 0 : 1;
  // ADAPTIVE GRID DENSITY (Critical from Frontend + Data Viz reviews)
  // Thresholds based on visual readability:
  // - At 25 px/day (zoom 1.0): daily lines are comfortable
  // - At 12.5 px/day (zoom 0.5): daily lines still readable
  // - Below 10 px/day: switch to weekly lines
  // - Below 3 px/day: switch to monthly lines
  const gridInterval = useMemo(() => {
    const pixelsPerDay = scale.pixelsPerDay;
    if (pixelsPerDay < 3) return 30; // Monthly when very zoomed out (< ~12% zoom)
    if (pixelsPerDay < 10) return 7; // Weekly when zoomed out (< ~40% zoom)
    return 1; // Daily at normal zoom (>= 40% zoom)
  }, [scale.pixelsPerDay]);

  // Weekend highlighting is always shown if enabled (regardless of zoom level)

  // Determine line type for styling
  type LineType = "daily" | "weekly" | "monthly";
  const lineType: LineType =
    gridInterval === 1 ? "daily" : gridInterval === 7 ? "weekly" : "monthly";

  // Vertical lines (adaptive interval)
  // Aligns to proper boundaries: week start (Monday) for weekly, month start for monthly
  const verticalLines = useMemo(() => {
    const lines: Array<{ x: number; date: string; isWeekend: boolean }> = [];
    const minDateObj = parseISO(scale.minDate);

    // Calculate end date based on grid width (not just scale.maxDate)
    const endX = gridWidth;
    const daysFromStart = Math.ceil(endX / scale.pixelsPerDay);
    const endDate = addDays(scale.minDate, daysFromStart);

    // Determine start date based on interval type
    let currentDateObj: Date;
    if (gridInterval === 7) {
      // Weekly: align to week start (based on user preference)
      currentDateObj = startOfWeek(minDateObj, {
        weekStartsOn,
      });
    } else if (gridInterval === 30) {
      // Monthly: align to month start
      currentDateObj = startOfMonth(minDateObj);
    } else {
      // Daily: start from minDate
      currentDateObj = minDateObj;
    }

    let currentDate = format(currentDateObj, "yyyy-MM-dd");

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

      // Advance to next interval
      if (gridInterval === 7) {
        currentDateObj = addWeeks(currentDateObj, 1);
      } else if (gridInterval === 30) {
        currentDateObj = addMonths(currentDateObj, 1);
      } else {
        currentDateObj = parseISO(addDays(currentDate, 1));
      }
      currentDate = format(currentDateObj, "yyyy-MM-dd");
    }

    return lines;
  }, [scale, gridInterval, gridWidth, weekStartsOn]);

  // Weekend columns for background highlighting
  // Always shown when enabled, regardless of zoom level
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

  // Holiday columns for background highlighting (Sprint 1.5.9)
  // Similar to weekend highlighting but with a different color
  const holidayColumns = useMemo(() => {
    if (!showHolidays || !holidayRegion) return [];

    // Ensure holiday service is configured for the current region
    holidayService.setRegion(holidayRegion);

    const columns: Array<{ x: number; date: string; name: string }> = [];
    let currentDate = scale.minDate;

    // Calculate end date based on grid width
    const endX = gridWidth;
    const daysFromStart = Math.ceil(endX / scale.pixelsPerDay);
    const endDate = addDays(scale.minDate, daysFromStart);

    while (currentDate <= endDate) {
      const x = dateToPixel(currentDate, scale);

      // Only add holidays that are within visible range (>= 0) and grid width
      if (x >= 0 && x <= gridWidth) {
        const holidayInfo = holidayService.isHolidayString(currentDate);
        if (holidayInfo) {
          columns.push({
            x,
            date: currentDate,
            name: holidayInfo.name,
          });
        }
      }

      currentDate = addDays(currentDate, 1);
    }

    return columns;
  }, [scale, showHolidays, holidayRegion, gridWidth]);

  // Horizontal lines (one per task row)
  const horizontalLines = useMemo(() => {
    return Array.from({ length: taskCount + 1 }, (_, i) => ({
      y: i * rowHeight,
    }));
  }, [taskCount, rowHeight]);

  return (
    <g className="grid-lines">
      {/* Weekend background highlighting */}
      {weekendColumns.map(({ x, date }) => (
        <rect
          key={`weekend-${date}`}
          x={x}
          y={0}
          width={scale.pixelsPerDay}
          height={taskCount * rowHeight}
          fill="#f1f3f5"
          opacity={0.6}
          className="weekend-column"
        />
      ))}

      {/* Holiday background highlighting (Sprint 1.5.9) */}
      {holidayColumns.map(({ x, date, name }) => (
        <rect
          key={`holiday-${date}`}
          x={x}
          y={0}
          width={scale.pixelsPerDay}
          height={taskCount * rowHeight}
          fill="#fce7f3"
          opacity={0.7}
          className="holiday-column"
        >
          <title>{name}</title>
        </rect>
      ))}

      {/* Vertical lines - styled based on zoom level */}
      {verticalLines.map(({ x, date, isWeekend: isWeekendDay }) => {
        // At daily resolution: subtle lines, weekend lines slightly darker
        // At weekly/monthly resolution: slightly more prominent lines
        const getStroke = (): string => {
          if (lineType === "daily") {
            return isWeekendDay ? "#dee2e6" : "#e9ecef";
          }
          // Weekly/monthly lines are slightly more prominent
          return "#d1d5db";
        };

        return (
          <line
            key={`vline-${date}`}
            x1={x}
            y1={0}
            x2={x}
            y2={taskCount * rowHeight}
            stroke={getStroke()}
            strokeWidth={1}
            className={`${lineType}-line`}
          />
        );
      })}

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
