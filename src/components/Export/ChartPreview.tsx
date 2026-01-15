/**
 * ChartPreview - Preview component for PNG/SVG exports.
 * Displays the rendered chart canvas with checkerboard for transparency.
 */

import { useEffect, useRef } from "react";
import { Spinner, WarningCircle } from "@phosphor-icons/react";

export interface ChartPreviewProps {
  canvas: HTMLCanvasElement | null;
  dimensions: { width: number; height: number };
  isRendering: boolean;
  error: string | null;
  isTransparent: boolean;
}

/**
 * ChartPreview component for PNG/SVG export preview.
 * Shows the chart canvas scaled to fit the preview area.
 */
export function ChartPreview({
  canvas,
  dimensions,
  isRendering,
  error,
  isTransparent,
}: ChartPreviewProps): JSX.Element {
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Append canvas to container when it changes
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    // Clear previous canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Append new canvas if available
    if (canvas) {
      // Style the canvas for responsive display
      canvas.style.maxWidth = "100%";
      canvas.style.maxHeight = "100%";
      canvas.style.width = "auto";
      canvas.style.height = "auto";
      canvas.style.objectFit = "contain";
      canvas.style.display = "block";
      container.appendChild(canvas);
    }
  }, [canvas]);

  return (
    <div className="flex flex-col h-full">
      {/* Preview Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-neutral-700 mb-1">
          Export Preview
        </h3>
        <p className="text-xs text-neutral-500">
          Live preview of your export
        </p>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-white rounded-lg border-2 border-neutral-200 shadow-sm flex items-center justify-center relative overflow-hidden min-h-[200px]">
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
            <WarningCircle
              size={32}
              className="text-red-500"
              weight="fill"
            />
            <p className="text-sm text-red-700 mt-3 text-center">
              {error}
            </p>
          </div>
        )}

        {/* Canvas Container */}
        {!error && (
          <div
            ref={canvasContainerRef}
            className="relative z-0 flex items-center justify-center w-full h-full p-4"
          />
        )}

        {/* Empty State (no canvas yet) */}
        {!canvas && !isRendering && !error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <p className="text-sm text-neutral-400">
              Preview will appear here
            </p>
          </div>
        )}
      </div>

      {/* Dimensions Info */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-neutral-500">Output size</span>
        {dimensions.width > 0 && dimensions.height > 0 ? (
          <span className="font-medium text-neutral-700">
            {dimensions.width.toLocaleString()} × {dimensions.height.toLocaleString()} px
          </span>
        ) : (
          <span className="text-neutral-400">—</span>
        )}
      </div>
    </div>
  );
}
