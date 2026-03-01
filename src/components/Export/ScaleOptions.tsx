/**
 * Scale options component for PNG and SVG export.
 * Wrapper around ZoomModeSelector.
 */

import type {
  ExportFormat,
  ExportOptions,
  ExportZoomMode,
} from "../../utils/export/types";
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
  return (
    <ZoomModeSelector
      zoomMode={options.zoomMode}
      onZoomModeChange={(mode: ExportZoomMode) => onChange({ zoomMode: mode })}
      timelineZoom={options.timelineZoom}
      onTimelineZoomChange={(zoom: number) => onChange({ timelineZoom: zoom })}
      currentAppZoom={currentAppZoom}
      format={format}
      fitToWidth={options.fitToWidth}
      onFitToWidthChange={(width: number) => onChange({ fitToWidth: width })}
    />
  );
}
