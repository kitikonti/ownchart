/**
 * Chart capture utilities for PNG export.
 * Uses html-to-image to capture offscreen-rendered chart.
 */

import { createRoot } from "react-dom/client";
import { createElement, type ComponentProps } from "react";
import { toCanvas } from "html-to-image";
import type { ExportLayoutInput } from "./types";
import { ExportRenderer } from "../../components/Export/ExportRenderer";
import { calculateExportDimensions } from "./exportLayout";
import {
  waitForFonts,
  waitForPaint,
  createOffscreenContainer,
  removeOffscreenContainer,
} from "./helpers";

/** Minimum device pixel ratio used for canvas capture (ensures crisp output on low-DPI screens) */
const MIN_PIXEL_RATIO = 2;

/**
 * Time in milliseconds to wait after React's initial render call before
 * proceeding. React renders asynchronously and this delay ensures the first
 * paint has completed before we attempt font loading and capture.
 */
const REACT_RENDER_SETTLE_MS = 100;

export interface CaptureChartParams extends ExportLayoutInput {
  /** Project name for export filename */
  projectName?: string;
}

/**
 * Render the ExportRenderer component into `container` and wait for
 * React's initial paint to settle before proceeding.
 */
async function renderAndSettle(
  container: HTMLDivElement,
  props: ComponentProps<typeof ExportRenderer>
): Promise<void> {
  const root = createRoot(container);
  try {
    await new Promise<void>((resolve) => {
      root.render(createElement(ExportRenderer, props));
      // Wait for React to render its first pass before proceeding
      setTimeout(resolve, REACT_RENDER_SETTLE_MS);
    });
  } finally {
    root.unmount();
  }
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
  // Container is created before the try block; cleanup is guaranteed in finally.
  const container = createOffscreenContainer(
    dimensions.width,
    dimensions.height,
    options.background
  );

  try {
    // Render component into container and wait for React's first paint to settle.
    // renderAndSettle handles its own root lifecycle internally.
    await renderAndSettle(container, {
      tasks,
      options,
      columnWidths,
      currentAppZoom,
      projectDateRange,
      visibleDateRange,
    });

    // Wait for fonts and paint
    await waitForFonts();
    await waitForPaint();

    // Make visible for capture (html-to-image needs visible elements)
    container.style.opacity = "1";
    await waitForPaint();

    // Capture the container using html-to-image
    const canvas = await toCanvas(container, {
      pixelRatio: Math.max(window.devicePixelRatio, MIN_PIXEL_RATIO),
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
    // Always remove the DOM container regardless of success or failure
    removeOffscreenContainer(container);
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
