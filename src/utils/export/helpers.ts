/**
 * Shared helper functions for SVG/PDF/PNG export.
 * Used by pdfExport.ts, svgExport.ts, and captureChart.ts.
 */

import {
  SVG_FONT_FAMILY,
  BYTES_PER_KB,
  BYTES_PER_MB,
  EMPTY_SIZE_PLACEHOLDER,
} from "./constants";
import { sanitizeFilename } from "./sanitizeFilename";

/** data-* attribute used to identify offscreen export containers in the DOM */
const OFFSCREEN_CONTAINER_ATTR = "data-export-offscreen";

/**
 * z-index for the offscreen export container.
 * Must be above all app UI (dialogs, tooltips, modals) to prevent any
 * stacking-context clipping during html-to-image capture. The container
 * is hidden via opacity:0 so this value is never visible to the user.
 */
const OFFSCREEN_CONTAINER_Z_INDEX = 99999;

/**
 * Wait for all fonts to be loaded.
 * This ensures text measurements are accurate.
 *
 * The guard on `document.fonts` is intentional: jsdom (used in unit tests)
 * does not implement the CSS Font Loading API, so `document.fonts` is
 * undefined in that environment.
 */
export async function waitForFonts(): Promise<void> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
}

/**
 * Wait for next animation frame (ensures DOM is painted).
 * Double RAF ensures the browser has completed layout and paint.
 *
 * The guard on `requestAnimationFrame` mirrors the `document.fonts` guard in
 * `waitForFonts`: jsdom (used in unit tests) may not implement rAF, so we
 * skip the wait in environments where it is unavailable.
 */
export async function waitForPaint(): Promise<void> {
  if (typeof requestAnimationFrame !== "function") {
    return;
  }
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}

/**
 * Normalise font attributes on all elements in an SVG subtree.
 * Sets explicit font-family and font-weight attributes needed for:
 * - Vector apps (Illustrator/Inkscape) that ignore CSS style blocks
 * - svg2pdf.js which needs explicit font-family attributes and "bold" string
 *   instead of numeric font-weight values (600/700)
 *
 * Also replaces font-family/font-weight values in inline style attributes
 * for any element in the tree (not just text/tspan), because some SVG
 * renderers apply computed styles from parent elements via the style attr.
 *
 * Uses an iterative BFS traversal (queue-based) rather than recursion to
 * avoid call-stack overflow on deeply nested SVG trees (e.g. SVG inside
 * foreignObject inside SVG, which can occur in html-to-image output).
 *
 * @param root - The root element to process iteratively
 */
export function setFontFamilyOnTextElements(root: Element): void {
  // Index-pointer BFS: avoids the O(n) cost of Array.shift() (which re-indexes
  // the remaining elements on every dequeue) at the price of holding the full
  // queue in memory. For typical SVG export trees this is a clear win.
  const queue: Element[] = [root];
  let head = 0;

  while (head < queue.length) {
    const element = queue[head++];
    // SVG element localNames are always lowercase per the SVG specification;
    // .toLowerCase() is unnecessary but was harmless — removed for clarity.
    const localName = element.localName;
    const isTextElement = localName === "text" || localName === "tspan";

    // Set font-family and font-weight attributes on text and tspan elements.
    // Presentation attributes are needed for vector apps (Illustrator/Inkscape)
    // that ignore CSS style blocks.
    if (isTextElement) {
      // Remove any existing font-family attribute to ensure our value takes precedence
      element.removeAttribute("font-family");
      element.setAttribute("font-family", SVG_FONT_FAMILY);

      // Normalize font-weight attribute: svg2pdf.js requires the keyword "bold"
      // instead of the numeric equivalents 600 and 700.
      // Values 400 ("normal") and 500 ("medium") are intentionally left as-is —
      // svg2pdf.js handles the "normal" keyword natively, and 500 is unused in
      // the current design system. If medium-weight text is ever introduced,
      // add a mapping here.
      const fontWeight = element.getAttribute("font-weight");
      if (fontWeight === "600" || fontWeight === "700") {
        element.setAttribute("font-weight", "bold");
      }
    }

    // Normalise font-family/font-weight in inline style attributes on ALL elements
    // (including text/tspan — computed styles can propagate via the style attribute
    // in some SVG renderers, and svg2pdf.js reads both attribute and style values).
    if (element.hasAttribute("style")) {
      let style = element.getAttribute("style") || "";
      // Replace any font-family in inline styles
      style = style.replace(
        /font-family:\s*[^;]+;?/gi,
        `font-family: ${SVG_FONT_FAMILY};`
      );
      // Normalize font-weight in inline styles for svg2pdf.js
      style = style.replace(
        /font-weight:\s*(600|700);?/gi,
        "font-weight: bold;"
      );
      element.setAttribute("style", style);
    } else if (localName === "text") {
      // No existing style attribute on a <text> element — add one so renderers
      // that prefer style over presentation attributes pick up the correct
      // font-family. Skipped for <tspan>: it inherits styling from its parent
      // <text> element and adding a redundant style attribute creates DOM noise.
      element.setAttribute("style", `font-family: ${SVG_FONT_FAMILY};`);
    }

    // Enqueue all children for processing
    for (const child of element.children) {
      queue.push(child);
    }
  }
}

/**
 * Generate a timestamped filename for export.
 * Format: {projectName}-YYYYMMDD-HHMMSS.{extension}
 *
 * @param projectName - Optional project name (will be sanitized)
 * @param extension - File extension without leading dot (e.g., "pdf", "svg", "png").
 *   Must be a non-empty string.
 * @returns Sanitized filename with timestamp
 */
export function generateExportFilename(
  projectName: string | undefined,
  extension: string
): string {
  if (!extension) {
    throw new Error(
      "generateExportFilename: extension must be a non-empty string"
    );
  }
  const now = new Date();
  // Uses local time so the timestamp matches what the user sees on their clock.
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const baseName = projectName ? sanitizeFilename(projectName) : "gantt-chart";
  return `${baseName}-${year}${month}${day}-${hours}${minutes}${seconds}.${extension}`;
}

/**
 * Create an offscreen container for rendering export content.
 * The container is hidden (opacity: 0, pointer-events: none) but attached to
 * the DOM so that html-to-image and SVG foreignObject layout work correctly.
 *
 * @param width - Container width in pixels
 * @param height - Container height in pixels
 * @param background - Background color ("white" or "transparent")
 * @returns The created container element
 */
export function createOffscreenContainer(
  width: number,
  height: number,
  background: "white" | "transparent"
): HTMLDivElement {
  const container = document.createElement("div");
  container.setAttribute(OFFSCREEN_CONTAINER_ATTR, "true");
  container.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    background: ${background === "white" ? "#ffffff" : "transparent"};
    z-index: ${OFFSCREEN_CONTAINER_Z_INDEX};
    opacity: 0;
    pointer-events: none;
  `;
  document.body.appendChild(container);
  return container;
}

/**
 * Remove an offscreen container from the DOM.
 * Thin wrapper for symmetry with `createOffscreenContainer`; does not perform
 * any additional cleanup beyond removing the element.
 *
 * @param container - The container to remove
 */
export function removeOffscreenContainer(container: HTMLDivElement): void {
  container.remove();
}

/**
 * Clone all child nodes of source into group and normalise font attributes.
 * Vector apps (Illustrator, Inkscape) ignore CSS style blocks, so font-family
 * must be set as an explicit attribute on every text element after cloning.
 *
 * @param source - The source SVG element whose children are cloned
 * @param group - The target group element to receive the cloned children
 */
export function cloneSvgChildrenIntoGroup(
  source: SVGElement,
  group: SVGElement
): void {
  for (const child of source.childNodes) {
    group.appendChild(child.cloneNode(true));
  }
  setFontFamilyOnTextElements(group);
}

/** Conservative PNG compression ratio (typical range: 25–50% of raw RGBA) */
const PNG_COMPRESSION_RATIO = 0.35;

/**
 * Estimate PNG file size based on dimensions.
 * Uses conservative 4 bytes/pixel RGBA with ~35% compression ratio.
 *
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns Human-readable size string with tilde prefix indicating an estimate
 *   (e.g. "~1.2 MB", "~350 KB", "~140 B"), or EMPTY_SIZE_PLACEHOLDER ("—")
 *   when either dimension is zero.
 */
export function estimateFileSize(width: number, height: number): string {
  if (width <= 0 || height <= 0) return EMPTY_SIZE_PLACEHOLDER;
  const rawBytes = width * height * 4;
  const estimatedBytes = rawBytes * PNG_COMPRESSION_RATIO;

  if (estimatedBytes < BYTES_PER_KB) {
    return `~${Math.round(estimatedBytes)} B`;
  } else if (estimatedBytes < BYTES_PER_MB) {
    return `~${(estimatedBytes / BYTES_PER_KB).toFixed(1)} KB`;
  } else {
    return `~${(estimatedBytes / BYTES_PER_MB).toFixed(1)} MB`;
  }
}
