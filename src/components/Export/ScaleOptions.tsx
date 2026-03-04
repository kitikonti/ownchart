/**
 * Scale options component for PNG and SVG export.
 * Wrapper around ZoomModeSelector.
 */

import { memo, useCallback } from "react";
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

export const ScaleOptions = memo(function ScaleOptions({
  options,
  onChange,
  currentAppZoom,
  format,
}: ScaleOptionsProps): JSX.Element {
  const handleZoomModeChange = useCallback(
    (mode: ExportZoomMode): void => onChange({ zoomMode: mode }),
    [onChange]
  );
  const handleTimelineZoomChange = useCallback(
    (zoom: number): void => onChange({ timelineZoom: zoom }),
    [onChange]
  );
  const handleFitToWidthChange = useCallback(
    (width: number): void => onChange({ fitToWidth: width }),
    [onChange]
  );

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
});
