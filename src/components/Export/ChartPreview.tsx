/**
 * ChartPreview - Preview component for PNG/SVG exports.
 * Displays the rendered chart image with checkerboard for transparency.
 * Includes info panel below preview (Figma-style).
 */

import { memo } from "react";
import {
  Spinner,
  WarningCircle,
  Warning,
  WarningOctagon,
  Image,
} from "@phosphor-icons/react";
import type { ReadabilityStatus } from "@/utils/export/types";
import { COLORS } from "@/styles/design-tokens";
import { estimateFileSize } from "@/utils/export";

/** Checkerboard tile color for transparent background visualization */
const CHECKERBOARD_TILE_COLOR = COLORS.neutral[100];

/** Format types supported by the preview component (excludes PDF) */
type PreviewFormatType = "png" | "svg";

interface PreviewFrameProps {
  dimensions: { width: number; height: number };
  isRendering: boolean;
  error: string | null;
  isTransparent: boolean;
  previewDataUrl: string | null;
  formatType: PreviewFormatType;
}

/** Inner preview frame showing chart states: loading, error, empty, or image. */
const PreviewFrame = memo(function PreviewFrame({
  dimensions,
  isRendering,
  error,
  isTransparent,
  previewDataUrl,
  formatType,
}: PreviewFrameProps): JSX.Element {
  return (
    <div
      className="bg-white border border-neutral-200 shadow-sm flex items-center justify-center relative overflow-hidden"
      style={{
        aspectRatio:
          dimensions.width > 0 && dimensions.height > 0
            ? `${dimensions.width} / ${dimensions.height}`
            : "16 / 9",
        maxWidth: "100%",
        maxHeight: "100%",
        // For wide exports, constrain width; for tall exports, constrain height
        width: dimensions.width >= dimensions.height ? "100%" : "auto",
        height: dimensions.width < dimensions.height ? "100%" : "auto",
      }}
    >
      {/* Checkerboard pattern for transparent background */}
      {isTransparent && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(45deg, ${CHECKERBOARD_TILE_COLOR} 25%, transparent 25%), linear-gradient(-45deg, ${CHECKERBOARD_TILE_COLOR} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${CHECKERBOARD_TILE_COLOR} 75%), linear-gradient(-45deg, transparent 75%, ${CHECKERBOARD_TILE_COLOR} 75%)`,
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
          }}
        />
      )}

      {/* Loading State */}
      {isRendering && (
        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
          <Spinner
            size={32}
            className="animate-spin text-brand-600"
            weight="regular"
          />
          <p className="text-sm text-neutral-600 mt-3">Rendering preview...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isRendering && (
        <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-10 p-4">
          <WarningCircle size={32} className="text-red-500" weight="fill" />
          <p className="text-sm text-red-700 mt-3 text-center">{error}</p>
        </div>
      )}

      {/* Preview Image */}
      {!error && previewDataUrl && (
        <img
          src={previewDataUrl}
          alt="Export preview"
          className="relative z-0 max-w-full max-h-full w-auto h-auto object-contain"
        />
      )}

      {/* Empty State (no preview yet) */}
      {!previewDataUrl && !isRendering && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="w-16 h-16 rounded-2xl bg-neutral-700 flex items-center justify-center mb-4">
            <Image size={32} className="text-white" weight="regular" />
          </div>
          <p className="text-sm text-neutral-700 font-medium">
            Preview will render here
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {formatType === "svg"
              ? "Vector image format"
              : "Raster image format"}
          </p>
        </div>
      )}
    </div>
  );
});

export interface ChartPreviewProps {
  /** Data URL of the preview image */
  previewDataUrl: string | null;
  dimensions: { width: number; height: number };
  isRendering: boolean;
  error: string | null;
  isTransparent: boolean;
  /** Effective zoom percentage (0-1 scale, e.g., 0.5 = 50%) */
  effectiveZoom?: number;
  /** Readability status for labels */
  readabilityStatus?: ReadabilityStatus;
  /** Format type for display */
  formatType?: PreviewFormatType;
}

/**
 * ChartPreview component for PNG/SVG export preview.
 * Shows the chart image scaled to fit the preview area.
 */
export function ChartPreview({
  previewDataUrl,
  dimensions,
  isRendering,
  error,
  isTransparent,
  effectiveZoom,
  readabilityStatus,
  formatType = "png",
}: ChartPreviewProps): JSX.Element {
  const ReadabilityIcon =
    readabilityStatus?.level === "critical" ? WarningOctagon : Warning;
  const isWarning = readabilityStatus?.level === "warning";

  return (
    <div className="flex flex-col h-full">
      {/* Preview Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-neutral-700 mb-1">
          Export Preview
        </h3>
        <p className="text-xs text-neutral-500">Live preview of your export</p>
      </div>

      {/* Preview Area Container - centers the preview frame */}
      <div className="flex-1 flex items-center justify-center p-2 min-h-[200px]">
        <PreviewFrame
          dimensions={dimensions}
          isRendering={isRendering}
          error={error}
          isTransparent={isTransparent}
          previewDataUrl={previewDataUrl}
          formatType={formatType}
        />
      </div>

      {/* Info Panel - Compact */}
      <div className="mt-4 space-y-2">
        {/* Single row with dot separators */}
        <div className="text-xs text-neutral-600">
          <span className="font-medium text-neutral-900">
            {effectiveZoom !== undefined
              ? `${Math.round(effectiveZoom * 100)}%`
              : "—"}
          </span>
          {" zoom"}
          <span className="mx-1.5 text-neutral-300">·</span>
          {dimensions.width > 0 && dimensions.height > 0 ? (
            <>
              <span className="font-medium text-neutral-900">
                {dimensions.width.toLocaleString()}×
                {dimensions.height.toLocaleString()}
              </span>
              {" px"}
            </>
          ) : (
            <span className="text-neutral-400">—</span>
          )}
          <span className="mx-1.5 text-neutral-300">·</span>
          <span className="font-medium text-neutral-900">
            {estimateFileSize(dimensions.width, dimensions.height)}
          </span>
        </div>

        {/* Readability Indicator - only show warnings/critical */}
        <div aria-live="polite">
          {readabilityStatus && readabilityStatus.level !== "good" && (
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded ${
                isWarning
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <ReadabilityIcon
                size={16}
                weight="fill"
                className={isWarning ? "text-amber-600" : "text-red-600"}
              />
              <span
                className={`text-xs font-semibold ${
                  isWarning ? "text-amber-700" : "text-red-700"
                }`}
              >
                {readabilityStatus.message}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
