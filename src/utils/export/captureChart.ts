/**
 * Chart capture utilities for PNG export.
 * Uses html-to-image to capture offscreen-rendered chart.
 */

import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { toCanvas } from "html-to-image";
import type { ExportLayoutInput } from "./types";
import { EXPORT_MAX_SAFE_WIDTH } from "./types";
import { ExportRenderer } from "../../components/Export/ExportRenderer";
import { calculateExportDimensions } from "./exportLayout";
import { REACT_RENDER_WAIT_MS } from "./constants";

/**
 * Compute the maximum pixel ratio for capture to prevent oversized canvases
 * on high-DPR displays (e.g. 4K at dpr=4 would otherwise produce a canvas
 * wider than EXPORT_MAX_SAFE_WIDTH).
 * Computed lazily inside captureChart() — not at module load time — so that
 * importing this module in non-browser environments (tests, SSR) is safe.
 */
function computeMaxCapturePixelRatio(): number {
  const screenWidth =
    typeof window !== "undefined" ? (window.screen?.width ?? 1920) : 1920;
  return Math.floor(EXPORT_MAX_SAFE_WIDTH / Math.max(screenWidth, 1));
}

/**
 * Wait for all fonts to be loaded.
 */
async function waitForFonts(): Promise<void> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
}

/**
 * Wait for next animation frame (ensures DOM is painted).
 */
function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}

export interface CaptureChartParams extends ExportLayoutInput {
  /** Project name for export filename */
  projectName?: string;
}

/**
 * Capture the chart to a canvas using offscreen rendering.
 * This renders the complete chart (including non-visible areas) at the specified zoom level.
 */
export async function captureChart(
  params: CaptureChartParams
): Promise<HTMLCanvasElement> {
  const {
    tasks,
    options,
    columnWidths = {},
    currentAppZoom,
    projectDateRange,
    visibleDateRange,
  } = params;

  // Calculate expected dimensions
  const dimensions = calculateExportDimensions(params);

  // Create container - must be on-screen for html-to-image (uses SVG foreignObject)
  // We use opacity: 0 and pointer-events: none to hide it from the user.
  // No fixed id — avoids duplicate-id violations if multiple captures run concurrently.
  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    width: ${dimensions.width}px;
    height: ${dimensions.height}px;
    overflow: hidden;
    background: ${options.background === "white" ? "#ffffff" : "transparent"};
    z-index: 99999;
    opacity: 0;
    pointer-events: none;
  `;
  document.body.appendChild(container);

  // Create React root outside try so it's accessible in finally for cleanup.
  const root = createRoot(container);

  try {
    // Render the export component and wait for React to flush.
    // root.render() is synchronous in React 18 concurrent mode for the
    // initial render trigger, but the commit is asynchronous — we give it
    // one macro-task via REACT_RENDER_WAIT_MS before proceeding.
    await new Promise<void>((resolve, reject) => {
      try {
        root.render(
          createElement(ExportRenderer, {
            tasks,
            options,
            columnWidths,
            currentAppZoom,
            projectDateRange,
            visibleDateRange,
          })
        );
      } catch (err) {
        reject(err);
        return;
      }
      setTimeout(resolve, REACT_RENDER_WAIT_MS);
    });

    // Wait for fonts and paint
    await waitForFonts();
    await waitForPaint();

    // Make visible for capture (html-to-image needs visible elements)
    container.style.opacity = "1";
    await waitForPaint();

    // Cap pixel ratio to avoid producing canvases wider than EXPORT_MAX_SAFE_WIDTH.
    const maxCapturePixelRatio = computeMaxCapturePixelRatio();
    const pixelRatio = Math.min(
      Math.max(window.devicePixelRatio, 2),
      Math.max(maxCapturePixelRatio, 2)
    );

    // Capture the container using html-to-image
    const canvas = await toCanvas(container, {
      pixelRatio,
      backgroundColor: options.background === "white" ? "#ffffff" : undefined,
      width: dimensions.width,
      height: dimensions.height,
      style: {
        // Ensure the element is visible for capture
        transform: "none",
        left: "0",
        top: "0",
      },
    });

    return canvas;
  } finally {
    // Always unmount the React root and remove the container, even on error.
    root.unmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/**
 * Convert canvas to PNG blob.
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality = 1.0
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      "image/png",
      quality
    );
  });
}
