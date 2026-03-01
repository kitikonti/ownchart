/**
 * Scale options component for PNG and SVG export.
 * Wrapper around ZoomModeSelector.
 */

import type {
  ExportFormat,
  ExportOptions,
  ExportZoomMode,
} from "@/utils/export/types";
import { ZoomModeSelector } from "./ZoomModeSelector";

export interface ScaleOptionsProps {
  options: ExportOptions;
  onChange: (options: Partial<ExportOptions>) => void;
  currentAppZoom: number;
  format: ExportFormat;
}

export function ScaleOptions({
  options,
  onChange,
  currentAppZoom,
  format,
}: ScaleOptionsProps): JSX.Element {
  const handleZoomModeChange = (mode: ExportZoomMode): void =>
    onChange({ zoomMode: mode });
  const handleTimelineZoomChange = (zoom: number): void =>
    onChange({ timelineZoom: zoom });
  const handleFitToWidthChange = (width: number): void =>
    onChange({ fitToWidth: width });

  return (
    <ZoomModeSelector
      zoomMode={options.zoomMode}
      onZoomModeChange={handleZoomModeChange}
      timelineZoom={options.timelineZoom}
      onTimelineZoomChange={handleTimelineZoomChange}
      currentAppZoom={currentAppZoom}
      format={format}
      fitToWidth={options.fitToWidth}
      onFitToWidthChange={handleFitToWidthChange}
    />
  );
}
