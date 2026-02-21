/**
 * SelectionHighlight - Shared SVG overlay for header date range selection.
 * Renders a semi-transparent fill with dashed vertical border lines.
 * Used in both TimelineHeader (GanttLayout) and ChartCanvas.
 */

import { memo } from "react";
import { COLORS } from "../../styles/design-tokens";

interface SelectionHighlightProps {
  /** Pixel rect (x and width) of the selection */
  rect: { x: number; width: number } | null;
  /** Height of the highlight area */
  height: number;
}

export const SelectionHighlight = memo(function SelectionHighlight({
  rect,
  height,
}: SelectionHighlightProps): JSX.Element | null {
  if (!rect) return null;

  return (
    <g pointerEvents="none">
      <rect
        x={rect.x}
        y={0}
        width={rect.width}
        height={height}
        fill={COLORS.chart.marquee}
        fillOpacity={COLORS.chart.marqueeFillOpacity}
      />
      <line
        x1={rect.x}
        y1={0}
        x2={rect.x}
        y2={height}
        stroke={COLORS.chart.marquee}
        strokeWidth={1}
        strokeDasharray="4 2"
      />
      <line
        x1={rect.x + rect.width}
        y1={0}
        x2={rect.x + rect.width}
        y2={height}
        stroke={COLORS.chart.marquee}
        strokeWidth={1}
        strokeDasharray="4 2"
      />
    </g>
  );
});
