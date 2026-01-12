/**
 * TodayMarker component
 * Shows a thin red vertical line at the current date
 */

import { format } from "date-fns";
import type { TimelineScale } from "../../utils/timelineUtils";
import { dateToPixel } from "../../utils/timelineUtils";

interface TodayMarkerProps {
  scale: TimelineScale;
  svgHeight: number;
}

export function TodayMarker({ scale, svgHeight }: TodayMarkerProps) {
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
        stroke="#fa5252"
        strokeWidth={1}
      />
    </g>
  );
}
