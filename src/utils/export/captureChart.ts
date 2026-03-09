/**
 * Chart capture utilities for PNG export.
 * Uses html-to-image to capture offscreen-rendered chart.
 */

import { createRoot } from "react-dom/client";
import { createElement } from "react";
import type { ComponentProps } from "react";
import { toCanvas } from "html-to-image";
import type { ExportLayoutInput } from "./types";
import { ExportRenderer } from "../../components/Export/ExportRenderer";
import { calculateExportDimensions } from "./exportLayout";
import { REACT_RENDER_WAIT_MS } from "./constants";
import {
  waitForFonts,
  waitForPaint,
  createOffscreenContainer,
  removeOffscreenContainer,
} from "./helpers";

/**
 * Minimum device pixel ratio used for canvas capture.
 * Set to 2 (equivalent to standard Retina resolution) so exports remain crisp
 * even on 1× DPI displays where `window.devicePixelRatio` would be 1.
 * Higher values produce larger canvases with no perceptible quality gain.
 */
const MIN_PIXEL_RATIO = 2;

export interface CaptureChartParams extends ExportLayoutInput {
  /** Project name for export filename */
  projectName?: string;
}

/**
 * Render the ExportRenderer component into `container` and wait for
 * React's initial paint to settle before proceeding.
 *
 * The root is created synchronously so the caller can always unmount it in a
 * finally block — even if the settle timeout is somehow interrupted.
 * Unmounting before toCanvas runs would tear down the DOM tree while it is
 * still being captured, producing a blank PNG; the caller must defer unmounting
 * until after capture.
 *
 * @param container - The DOM container to render into
 * @param props - Props forwarded to ExportRenderer
 * @returns The React root (caller must call root.unmount() when done)
 */
async function renderAndSettle(
  container: HTMLDivElement,
  props: ComponentProps<typeof ExportRenderer>
): Promise<ReturnType<typeof createRoot>> {
  // createRoot is synchronous — root is always set before any async work.
  const root = createRoot(container);
  root.render(createElement(ExportRenderer, props));
  // Wait for React to render its first pass before proceeding
  await new Promise<void>((resolve) =>
    setTimeout(resolve, REACT_RENDER_WAIT_MS)
  );
  return root;
}

/**
 * Capture the chart to a canvas using offscreen rendering.
 * Renders the complete chart (including non-visible areas) at the specified
 * zoom level, then converts the DOM to a canvas via html-to-image.
 *
 * @param params - Layout inputs including tasks, options, column widths, and zoom
 * @returns A canvas element containing the rendered chart at the target resolution
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
  const container = createOffscreenContainer(
    dimensions.width,
    dimensions.height,
    options.background
  );

  // root starts undefined; renderAndSettle assigns it synchronously before any
  // async work, so the finally block can always call root?.unmount() safely.
  // Both renderAndSettle and the capture step are inside the try so that any
  // error from either path still triggers container cleanup.
  let root: ReturnType<typeof createRoot> | undefined;

  try {
    // renderAndSettle creates the React root synchronously then waits for the
    // initial paint. Unmounting before toCanvas would tear down the DOM tree
    // mid-capture and produce a blank PNG, so unmounting is deferred to finally.
    root = await renderAndSettle(container, {
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
    // Unmount the React tree only after capture (or on error), then remove
    // the container from the DOM. root may be undefined if renderAndSettle
    // threw before completing, so the optional-chain guard is intentional.
    root?.unmount();
    removeOffscreenContainer(container);
  }
}

/**
 * Convert canvas to PNG blob.
 *
 * Note: PNG is lossless — the browser ignores the `quality` argument for
 * "image/png". The parameter is kept for API symmetry in case this function
 * is ever extended to support lossy formats (JPEG/WebP).
 *
 * @param canvas - The canvas element to serialise
 * @param quality - Quality hint (0–1). Ignored for PNG; only used by JPEG/WebP.
 * @returns A Blob containing the PNG-encoded image
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
