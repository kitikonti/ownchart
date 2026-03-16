/**
 * Zoom mode selector component.
 * Used by PNG and PDF export for timeline scale selection.
 * Supports current view, fit to width/page, and custom zoom modes.
 */

import { RadioOptionCard } from "@/components/common/RadioOptionCard";
import type { ExportZoomMode, ExportFormat } from "@/utils/export/types";
import { DEFAULT_FIT_TO_WIDTH_PX } from "@/utils/export/types";
import { FitToWidthSelector } from "./FitToWidthSelector";
import { CustomZoomControl } from "./CustomZoomControl";

export interface ZoomModeSelectorProps {
  /** Current zoom mode */
  zoomMode: ExportZoomMode;
  /** Called when zoom mode changes */
  onZoomModeChange: (mode: ExportZoomMode) => void;
  /** Current timeline zoom value (for custom mode) */
  timelineZoom: number;
  /** Called when timeline zoom changes */
  onTimelineZoomChange: (zoom: number) => void;
  /** Current app zoom level (displayed in "Use current view") */
  currentAppZoom: number;
  /** Export format - determines available options */
  format: ExportFormat;
  /** Fit to width value in pixels (PNG/SVG only) */
  fitToWidth?: number;
  /** Called when fit to width changes (PNG/SVG only) */
  onFitToWidthChange?: (width: number) => void;
}

export function ZoomModeSelector({
  zoomMode,
  onZoomModeChange,
  timelineZoom,
  onTimelineZoomChange,
  currentAppZoom,
  format,
  fitToWidth = DEFAULT_FIT_TO_WIDTH_PX,
  onFitToWidthChange,
}: ZoomModeSelectorProps): JSX.Element {
  const isPngOrSvg = format === "png" || format === "svg";
  const radioName = `${format}ZoomMode`;

  return (
    <fieldset className="border-0 p-0 m-0">
      <legend className="block text-sm font-semibold text-slate-900 mb-3">
        Timeline Scale
      </legend>

      <div className="space-y-2">
        {/* Use Current View */}
        <RadioOptionCard
          name={radioName}
          selected={zoomMode === "currentView"}
          onChange={() => onZoomModeChange("currentView")}
          title="Use current view"
          description="Export at your current zoom level"
          badge={`${Math.round(currentAppZoom * 100)}%`}
        />

        {/* Fit to Width/Page */}
        <RadioOptionCard
          name={radioName}
          selected={zoomMode === "fitToWidth"}
          onChange={() => onZoomModeChange("fitToWidth")}
          title={isPngOrSvg ? "Fit to width" : "Fit to page"}
          description={
            isPngOrSvg ? undefined : "Automatically scale to fit page width"
          }
        >
          {isPngOrSvg && (
            <FitToWidthSelector
              fitToWidth={fitToWidth}
              onFitToWidthChange={onFitToWidthChange}
            />
          )}
        </RadioOptionCard>

        {/* Custom Zoom */}
        <RadioOptionCard
          name={radioName}
          selected={zoomMode === "custom"}
          onChange={() => onZoomModeChange("custom")}
          title="Custom zoom"
          description="Set a specific zoom percentage"
        >
          <CustomZoomControl
            timelineZoom={timelineZoom}
            onTimelineZoomChange={onTimelineZoomChange}
            isPngOrSvg={isPngOrSvg}
          />
        </RadioOptionCard>
      </div>
    </fieldset>
  );
}
