/**
 * Chart capture utilities for PNG export.
 * Uses html-to-image to capture offscreen-rendered chart.
 */

import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { createElement } from "react";
import type { ComponentProps } from "react";
import { toCanvas } from "html-to-image";
import type { ExportLayoutInput } from "./types";
import { ExportRenderer } from "../../components/Export/ExportRenderer";
import { calculateExportDimensions } from "./exportLayout";
import { REACT_RENDER_WAIT_MS, SVG_BACKGROUND_WHITE } from "./constants";
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

/**
 * Maximum time in milliseconds to wait for `toCanvas` to complete.
 * Guards against an indefinite hang when the browser tab is backgrounded
 * during export (requestAnimationFrame is throttled or paused in hidden tabs).
 */
const CANVAS_CAPTURE_TIMEOUT_MS = 30_000;

export interface CaptureChartParams extends ExportLayoutInput {
  /** Project name for export filename */
  projectName?: string;
}

/**
 * Render the ExportRenderer component into `container` and wait for
 * React's initial paint to settle before proceeding.
 *
 * The root is created synchronously so it is always available for the caller
 * to unmount in a finally block, even if the settle timeout is interrupted.
 *
 * @param container - The DOM container to render into
 * @param props - Props forwarded to ExportRenderer
 * @returns The React root (caller must call root.unmount() when done)
 */
async function renderAndSettle(
  container: HTMLDivElement,
  props: ComponentProps<typeof ExportRenderer>
): Promise<Root> {
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
 * Race a promise against a timeout, cancelling the timer on completion.
 *
 * Guards against indefinite hangs when the browser tab is backgrounded and
 * `requestAnimationFrame` is throttled or paused (e.g. during html-to-image
 * capture). The timer is cancelled as soon as `promise` settles so no live
 * timers leak in tests or rapid export sequences.
 *
 * @param promise - The operation to race against the timeout
 * @param timeoutMs - Maximum time to wait in milliseconds
 * @param timeoutMessage - Error message thrown when the timeout fires
 * @returns Resolves with the value from `promise`, or rejects with a timeout error
 */
export async function raceWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Capture the chart to a canvas using offscreen rendering.
 * Renders the complete chart (including non-visible areas) at the specified
 * zoom level, then converts the DOM to a canvas via html-to-image.
 *
 * The React root is unmounted only after capture (or on error) to ensure the
 * DOM tree is intact during the html-to-image capture phase; tearing it down
 * mid-capture produces a blank PNG.
 *
 * @param params - Layout inputs including tasks, options, column widths, and zoom
 * @returns A canvas element containing the rendered chart at the target resolution
 * @throws If canvas capture times out (e.g. tab backgrounded during export)
 */
export async function captureChart(
  params: CaptureChartParams
): Promise<HTMLCanvasElement> {
  const {
    tasks,
    options,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange,
    // projectName is part of CaptureChartParams for the caller's convenience
    // (e.g. the PNG download step uses it for the filename) but is not consumed
    // inside captureChart itself — the function only handles rendering & capture.
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
  let root: Root | undefined;

  try {
    // renderAndSettle creates the React root synchronously then waits for the
    // initial paint. Unmounting before toCanvas would tear down the DOM tree
    // mid-capture and produce a blank PNG, so unmounting is deferred to finally.
    root = await renderAndSettle(container, {
      tasks,
      options,
      columnWidths: columnWidths ?? {},
      currentAppZoom,
      projectDateRange,
      visibleDateRange,
    });

    // Wait for fonts and paint
    await waitForFonts();
    await waitForPaint();

    // Make visible for capture (html-to-image needs visible elements).
    // The container is briefly visible here (opacity 1) but is removed by
    // removeOffscreenContainer() in the finally block as soon as capture
    // completes or throws, so the visible window is bounded by capture duration.
    container.style.opacity = "1";
    await waitForPaint();

    const capturePromise = toCanvas(container, {
      pixelRatio: Math.max(window.devicePixelRatio, MIN_PIXEL_RATIO),
      backgroundColor:
        options.background === "white" ? SVG_BACKGROUND_WHITE : undefined,
      width: dimensions.width,
      height: dimensions.height,
      style: {
        // Ensure the element is visible for capture
        transform: "none",
        left: "0",
        top: "0",
      },
    });

    // Race the capture against a timeout to prevent an indefinite hang when
    // the tab is backgrounded and requestAnimationFrame is throttled/paused.
    const canvas = await raceWithTimeout(
      capturePromise,
      CANVAS_CAPTURE_TIMEOUT_MS,
      `Canvas capture timed out after ${CANVAS_CAPTURE_TIMEOUT_MS / 1000}s. ` +
        "Try keeping the tab in the foreground during export."
    );

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
 *   The value is clamped to [0, 1] for forward-compatibility with lossy formats.
 * @returns A Blob containing the PNG-encoded image
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality = 1.0
): Promise<Blob> {
  const clampedQuality = Math.max(0, Math.min(1, quality));
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert canvas to blob"));
          }
        },
        "image/png",
        clampedQuality
      );
    } catch (err) {
      // canvas.toBlob can throw a SecurityError synchronously when the canvas
      // has been tainted by cross-origin image data.
      reject(err);
    }
  });
}
