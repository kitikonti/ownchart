/**
 * Shared helper functions for SVG/PDF/PNG export.
 * Used by pdfExport.ts, svgExport.ts, and captureChart.ts.
 */

import { SVG_FONT_FAMILY } from "./constants";
import { sanitizeFilename } from "./sanitizeFilename";

/** data-* attribute used to identify offscreen export containers in the DOM */
const OFFSCREEN_CONTAINER_ATTR = "data-export-offscreen";

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
 */
export function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
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
 * @param element - The root element to process recursively
 */
export function setFontFamilyOnTextElements(element: Element): void {
  const localName = element.localName.toLowerCase();

  // Set font-family and font-weight attributes on text and tspan elements.
  // Presentation attributes are needed for vector apps (Illustrator/Inkscape)
  // that ignore CSS style blocks.
  if (localName === "text" || localName === "tspan") {
    // Remove any existing font-family attribute to ensure our value takes precedence
    element.removeAttribute("font-family");
    element.setAttribute("font-family", SVG_FONT_FAMILY);

    // Normalize font-weight attribute: svg2pdf.js needs "bold" instead of 600/700
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
    style = style.replace(/font-weight:\s*(600|700);?/gi, "font-weight: bold;");
    element.setAttribute("style", style);
  } else if (localName === "text" || localName === "tspan") {
    // No existing style attribute — add one so renderers that prefer style
    // over presentation attributes also pick up the correct font-family.
    element.setAttribute("style", `font-family: ${SVG_FONT_FAMILY};`);
  }

  // Process all child elements recursively
  for (const child of element.children) {
    setFontFamilyOnTextElements(child);
  }
}

/**
 * Generate a timestamped filename for export.
 * Format: {projectName}-YYYYMMDD-HHMMSS.{extension}
 *
 * @param projectName - Optional project name (will be sanitized)
 * @param extension - File extension (e.g., "pdf", "svg", "png")
 * @returns Sanitized filename with timestamp
 */
export function generateExportFilename(
  projectName: string | undefined,
  extension: string
): string {
  const now = new Date();
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
    z-index: 99999;
    opacity: 0;
    pointer-events: none;
  `;
  document.body.appendChild(container);
  return container;
}

/**
 * Remove an offscreen container from the DOM.
 *
 * @param container - The container to remove
 */
export function removeOffscreenContainer(container: HTMLDivElement): void {
  if (container.parentNode) {
    container.parentNode.removeChild(container);
  }
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
const BYTES_PER_KB = 1024;
const BYTES_PER_MB = 1024 * 1024;

/**
 * Estimate PNG file size based on dimensions.
 * Uses conservative 4 bytes/pixel RGBA with ~35% compression ratio.
 *
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns Human-readable size string (e.g. "~1.2 MB")
 */
export function estimateFileSize(width: number, height: number): string {
  if (width === 0 || height === 0) return "—";
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
