/**
 * Chart capture utilities for PNG export.
 * Uses html2canvas to capture DOM elements to canvas.
 */

import type { ExportOptions } from "./types";

/**
 * Lazily import html2canvas to reduce initial bundle size.
 */
async function getHtml2Canvas(): Promise<typeof import("html2canvas").default> {
  const module = await import("html2canvas");
  return module.default;
}

/**
 * Prepare element for capture by temporarily hiding scrollbars
 * and setting up styles for clean capture.
 * Returns a cleanup function to restore original state.
 */
function prepareForCapture(element: HTMLElement): () => void {
  const originalOverflow = element.style.overflow;
  const originalScrollLeft = element.scrollLeft;
  const originalScrollTop = element.scrollTop;

  // Reset scroll position for capture
  element.scrollLeft = 0;
  element.scrollTop = 0;

  // Hide scrollbars during capture
  element.style.overflow = "hidden";

  return () => {
    element.style.overflow = originalOverflow;
    element.scrollLeft = originalScrollLeft;
    element.scrollTop = originalScrollTop;
  };
}

/**
 * Find elements to ignore during capture based on options.
 */
function shouldIgnoreElement(
  element: Element,
  options: ExportOptions
): boolean {
  // Ignore task list if option is disabled
  if (!options.includeTaskList && element.classList.contains("task-table")) {
    return true;
  }

  // Ignore the resizer divider if task list is not included
  if (!options.includeTaskList && element.classList.contains("split-divider")) {
    return true;
  }

  // Ignore the header if option is disabled
  if (!options.includeHeader && element.classList.contains("timeline-header")) {
    return true;
  }

  // Always ignore zoom indicator
  if (element.classList.contains("zoom-indicator")) {
    return true;
  }

  // Ignore placeholder row
  if (element.classList.contains("placeholder-row")) {
    return true;
  }

  return false;
}

/**
 * Capture the chart element to a canvas.
 */
export async function captureChart(
  options: ExportOptions
): Promise<HTMLCanvasElement> {
  // Find the main layout element to capture
  const chartElement = document.querySelector(
    ".gantt-layout"
  ) as HTMLElement | null;

  if (!chartElement) {
    throw new Error(
      "Chart element not found. Please ensure the chart is visible."
    );
  }

  const html2canvas = await getHtml2Canvas();

  // Calculate scale factor for target width
  const currentWidth = chartElement.offsetWidth;
  const scale = options.width / currentWidth;

  // Use higher scale for better quality (considering device pixel ratio)
  const finalScale = scale * Math.max(window.devicePixelRatio, 1);

  // Prepare element for capture
  const cleanup = prepareForCapture(chartElement);

  try {
    const canvas = await html2canvas(chartElement, {
      scale: finalScale,
      backgroundColor: options.background === "white" ? "#ffffff" : null,
      useCORS: true,
      logging: false,
      allowTaint: true,
      // Filter out elements based on options
      ignoreElements: (element) => shouldIgnoreElement(element, options),
      // Handle SVG elements properly
      onclone: (clonedDoc) => {
        // Ensure SVG elements are visible in the clone
        const svgElements = clonedDoc.querySelectorAll("svg");
        svgElements.forEach((svg) => {
          svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        });
      },
    });

    return canvas;
  } finally {
    cleanup();
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
