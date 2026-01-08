/**
 * Chart capture utilities for PNG export.
 * Uses html-to-image to capture offscreen-rendered chart.
 */

import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { toCanvas } from "html-to-image";
import type { ExportOptions } from "./types";
import type { Task } from "../../types/chart.types";
import {
  ExportRenderer,
  calculateExportDimensions,
} from "../../components/Export/ExportRenderer";

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

export interface CaptureChartParams {
  tasks: Task[];
  options: ExportOptions;
  columnWidths: Record<string, number>;
  currentAppZoom?: number;
  projectDateRange?: { start: Date; end: Date };
  visibleDateRange?: { start: Date; end: Date };
}

/**
 * Capture the chart to a canvas using offscreen rendering.
 * This renders the complete chart (including non-visible areas) at the specified zoom level.
 */
export async function captureChart(
  params: CaptureChartParams
): Promise<HTMLCanvasElement> {
  const { tasks, options, columnWidths, currentAppZoom, projectDateRange, visibleDateRange } = params;

  // Calculate expected dimensions
  const dimensions = calculateExportDimensions(
    tasks,
    options,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange
  );

  // Create container - must be on-screen for html-to-image (uses SVG foreignObject)
  // We use opacity: 0 and pointer-events: none to hide it from the user
  const container = document.createElement("div");
  container.id = "export-offscreen-container";
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

  try {
    // Create React root and render the export component
    const root = createRoot(container);

    await new Promise<void>((resolve) => {
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
      // Wait for React to render
      setTimeout(resolve, 100);
    });

    // Wait for fonts and paint
    await waitForFonts();
    await waitForPaint();

    // Make visible for capture (html-to-image needs visible elements)
    container.style.opacity = "1";
    await waitForPaint();

    // Capture the container using html-to-image
    const canvas = await toCanvas(container, {
      pixelRatio: Math.max(window.devicePixelRatio, 2),
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

    // Cleanup React root
    root.unmount();

    return canvas;
  } finally {
    // Always cleanup the container
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

/**
 * Re-export calculateExportDimensions for use in dialog.
 */
export { calculateExportDimensions } from "../../components/Export/ExportRenderer";
