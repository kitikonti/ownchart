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
  addDays as addDaysFns,
  addWeeks,
  addMonths,
} from "date-fns";
import type { TimelineScale } from "../../utils/timelineUtils";
import { dateToPixel } from "../../utils/timelineUtils";
import { addDays, isWeekend } from "../../utils/dateUtils";
import { holidayService } from "../../services/holidayService";
import { useFirstDayOfWeek } from "../../store/slices/userPreferencesSlice";
import { GRID } from "../../styles/design-tokens";

// Grid density thresholds (pixels per day)
const MONTHLY_THRESHOLD_PX = 3; // Below: monthly grid lines only
const WEEKLY_THRESHOLD_PX = 10; // Below: weekly grid lines

// Grid interval constants (days)
const DAILY_INTERVAL = 1;
const WEEKLY_INTERVAL = 7;
const MONTHLY_INTERVAL = 30;

type LineType = "daily" | "weekly" | "monthly";

/** Resolve the vertical-line stroke color based on zoom level and day type. */
export function getVerticalLineStroke(
  lineType: LineType,
  isWeekendDay: boolean
): string {
  if (lineType === "daily") {
    return isWeekendDay ? GRID.lineDailyWeekend : GRID.lineDaily;
  }
  return GRID.lineWeeklyMonthly;
}

interface GridLinesProps {
  scale: TimelineScale;
  taskCount: number;
  showWeekends?: boolean;
  showHolidays?: boolean;
  holidayRegion?: string;
  width?: number;
  rowHeight?: number;
}

export function GridLines({
  scale,
  taskCount,
  showWeekends = true,
  showHolidays = false,
  holidayRegion = "",
  width,
  rowHeight = 36,
}: GridLinesProps): JSX.Element {
  const gridWidth = width ?? scale.totalWidth;

  const firstDayOfWeek = useFirstDayOfWeek();
  const weekStartsOn: 0 | 1 = firstDayOfWeek === "sunday" ? 0 : 1;

  // Configure holiday service region (idempotent — no-op when region unchanged)
  if (showHolidays && holidayRegion) {
    holidayService.setRegion(holidayRegion);
  }

  // Shared end-date derived from grid pixel width
  const endDate = useMemo(() => {
    const daysFromStart = Math.ceil(gridWidth / scale.pixelsPerDay);
    return addDays(scale.minDate, daysFromStart);
  }, [scale.minDate, scale.pixelsPerDay, gridWidth]);

  // ADAPTIVE GRID DENSITY
  // Thresholds based on visual readability:
  // - At 25 px/day (zoom 1.0): daily lines are comfortable
  // - At 12.5 px/day (zoom 0.5): daily lines still readable
  // - Below WEEKLY_THRESHOLD_PX: switch to weekly lines
  // - Below MONTHLY_THRESHOLD_PX: switch to monthly lines
  const gridInterval = useMemo(() => {
    const pixelsPerDay = scale.pixelsPerDay;
    if (pixelsPerDay < MONTHLY_THRESHOLD_PX) return MONTHLY_INTERVAL;
    if (pixelsPerDay < WEEKLY_THRESHOLD_PX) return WEEKLY_INTERVAL;
    return DAILY_INTERVAL;
  }, [scale.pixelsPerDay]);

  const lineType: LineType =
    gridInterval === DAILY_INTERVAL
      ? "daily"
      : gridInterval === WEEKLY_INTERVAL
        ? "weekly"
        : "monthly";

  // Vertical lines (adaptive interval)
  // Aligns to proper boundaries: week start for weekly, month start for monthly
  const verticalLines = useMemo(() => {
    const lines: Array<{ x: number; date: string; isWeekend: boolean }> = [];
    const minDateObj = parseISO(scale.minDate);

    // Determine start date based on interval type
    let currentDateObj: Date;
    if (gridInterval === WEEKLY_INTERVAL) {
      currentDateObj = startOfWeek(minDateObj, { weekStartsOn });
    } else if (gridInterval === MONTHLY_INTERVAL) {
      currentDateObj = startOfMonth(minDateObj);
    } else {
      currentDateObj = minDateObj;
    }

    let currentDate = format(currentDateObj, "yyyy-MM-dd");

    while (currentDate <= endDate) {
      const x = dateToPixel(currentDate, scale);

      if (x >= 0 && x <= gridWidth) {
        lines.push({
          x,
          date: currentDate,
          isWeekend: isWeekend(currentDate),
        });
      }

      // Advance to next interval
      if (gridInterval === WEEKLY_INTERVAL) {
        currentDateObj = addWeeks(currentDateObj, 1);
      } else if (gridInterval === MONTHLY_INTERVAL) {
        currentDateObj = addMonths(currentDateObj, 1);
      } else {
        currentDateObj = addDaysFns(currentDateObj, 1);
      }
      currentDate = format(currentDateObj, "yyyy-MM-dd");
    }

    return lines;
  }, [scale, gridInterval, gridWidth, weekStartsOn, endDate]);

  // Weekend columns for background highlighting
  const weekendColumns = useMemo(() => {
    if (!showWeekends) return [];

    const columns: Array<{ x: number; date: string }> = [];
    let currentDate = scale.minDate;

    while (currentDate <= endDate) {
      const x = dateToPixel(currentDate, scale);

      if (x >= 0 && x <= gridWidth && isWeekend(currentDate)) {
        columns.push({ x, date: currentDate });
      }

      currentDate = addDays(currentDate, 1);
    }

    return columns;
  }, [scale, showWeekends, gridWidth, endDate]);

  // Holiday columns for background highlighting
  const holidayColumns = useMemo(() => {
    if (!showHolidays || !holidayRegion) return [];

    const columns: Array<{ x: number; date: string; name: string }> = [];
    let currentDate = scale.minDate;

    while (currentDate <= endDate) {
      const x = dateToPixel(currentDate, scale);

      if (x >= 0 && x <= gridWidth) {
        const holidayInfo = holidayService.isHolidayString(currentDate);
        if (holidayInfo) {
          columns.push({ x, date: currentDate, name: holidayInfo.name });
        }
      }

      currentDate = addDays(currentDate, 1);
    }

    return columns;
  }, [scale, showHolidays, holidayRegion, gridWidth, endDate]);

  // Horizontal lines (one per task row)
  const horizontalLines = useMemo(() => {
    return Array.from({ length: taskCount + 1 }, (_, i) => ({
      y: i * rowHeight,
    }));
  }, [taskCount, rowHeight]);

  const gridHeight = taskCount * rowHeight;

  return (
    <g className="grid-lines">
      {/* Weekend background highlighting */}
      {weekendColumns.map(({ x, date }) => (
        <rect
          key={`weekend-${date}`}
          x={x}
          y={0}
          width={scale.pixelsPerDay}
          height={gridHeight}
          fill={GRID.weekendBg}
          opacity={GRID.weekendOpacity}
          className="weekend-column"
        />
      ))}

      {/* Holiday background highlighting */}
      {holidayColumns.map(({ x, date, name }) => (
        <rect
          key={`holiday-${date}`}
          x={x}
          y={0}
          width={scale.pixelsPerDay}
          height={gridHeight}
          fill={GRID.holidayBg}
          opacity={GRID.holidayOpacity}
          className="holiday-column"
        >
          <title>{name}</title>
        </rect>
      ))}

      {/* Vertical lines - styled based on zoom level */}
      {verticalLines.map(({ x, date, isWeekend: isWeekendDay }) => (
        <line
          key={`vline-${date}`}
          x1={x}
          y1={0}
          x2={x}
          y2={gridHeight}
          stroke={getVerticalLineStroke(lineType, isWeekendDay)}
          strokeWidth={1}
          className={`${lineType}-line`}
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
          stroke={GRID.lineHorizontal}
          strokeWidth={1}
        />
      ))}
    </g>
  );
}
