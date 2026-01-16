/**
 * ChartPreview - Preview component for PNG/SVG exports.
 * Displays the rendered chart image with checkerboard for transparency.
 * Includes info panel below preview (Figma-style).
 */

import { Spinner, WarningCircle, Warning, Image } from "@phosphor-icons/react";

export interface ReadabilityStatus {
  level: "good" | "warning" | "critical";
  message: string;
}

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
  formatType?: "png" | "svg";
}

/**
 * ChartPreview component for PNG/SVG export preview.
 * Shows the chart image scaled to fit the preview area.
 */
/**
 * Estimate file size based on dimensions.
 * PNG: roughly 4 bytes per pixel with compression (~25% of raw)
 */
function estimateFileSize(width: number, height: number): string {
  if (width === 0 || height === 0) return "—";
  // PNG compression typically reduces to ~25-50% of raw RGBA
  const rawBytes = width * height * 4;
  const estimatedBytes = rawBytes * 0.35; // Conservative estimate

  if (estimatedBytes < 1024) {
    return `~${Math.round(estimatedBytes)} B`;
  } else if (estimatedBytes < 1024 * 1024) {
    return `~${(estimatedBytes / 1024).toFixed(1)} KB`;
  } else {
    return `~${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

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
        {/* Preview Frame - sized to match export aspect ratio */}
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
                backgroundImage:
                  "linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)",
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
              <p className="text-sm text-neutral-600 mt-3">
                Rendering preview...
              </p>
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
        {readabilityStatus && readabilityStatus.level !== "good" && (
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded ${
              readabilityStatus.level === "warning"
                ? "bg-amber-50 border border-amber-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <Warning
              size={16}
              weight="fill"
              className={
                readabilityStatus.level === "warning"
                  ? "text-amber-600"
                  : "text-red-600"
              }
            />
            <span
              className={`text-xs font-semibold ${
                readabilityStatus.level === "warning"
                  ? "text-amber-700"
                  : "text-red-700"
              }`}
            >
              {readabilityStatus.message}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
