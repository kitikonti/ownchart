/**
 * PNG/SVG scale options component.
 * Wrapper around ZoomModeSelector for PNG/SVG export.
 */

import type { ExportOptions, ExportZoomMode } from "../../utils/export/types";
import { ZoomModeSelector } from "./ZoomModeSelector";

export interface PngScaleOptionsProps {
  options: ExportOptions;
  onChange: (options: Partial<ExportOptions>) => void;
  currentAppZoom: number;
  projectDurationDays: number;
  taskTableWidth: number;
}

export function PngScaleOptions({
  options,
  onChange,
  currentAppZoom,
}: PngScaleOptionsProps): JSX.Element {
  return (
    <ZoomModeSelector
      zoomMode={options.zoomMode}
      onZoomModeChange={(mode: ExportZoomMode) => onChange({ zoomMode: mode })}
      timelineZoom={options.timelineZoom}
      onTimelineZoomChange={(zoom: number) => onChange({ timelineZoom: zoom })}
      currentAppZoom={currentAppZoom}
      format="png"
      fitToWidth={options.fitToWidth}
      onFitToWidthChange={(width: number) => onChange({ fitToWidth: width })}
    />
  );
}
