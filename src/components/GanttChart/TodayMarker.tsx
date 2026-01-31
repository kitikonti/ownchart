/**
 * TodayMarker component
 * Shows a vertical line at the current date
 */

import { format } from "date-fns";
import type { TimelineScale } from "../../utils/timelineUtils";
import { dateToPixel } from "../../utils/timelineUtils";
import { COLORS } from "../../styles/design-tokens";

interface TodayMarkerProps {
  scale: TimelineScale;
  svgHeight: number;
}

export function TodayMarker({
  scale,
  svgHeight,
}: TodayMarkerProps): JSX.Element | null {
  const today = format(new Date(), "yyyy-MM-dd");

  // Don't render if today is outside visible range
  if (today < scale.minDate || today > scale.maxDate) {
    return null;
  }

  const x = dateToPixel(today, scale);

  return (
    <g className="today-marker">
      <line
        x1={x}
        y1={0}
        x2={x}
        y2={svgHeight}
        stroke={COLORS.chart.todayMarker}
        strokeWidth={1}
      />
    </g>
  );
}
