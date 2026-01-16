/**
 * Shared helper functions for SVG/PDF export.
 * Used by both pdfExport.ts and svgExport.ts.
 */

import { SVG_FONT_FAMILY } from "./constants";
import { sanitizeFilename } from "./sanitizeFilename";

/**
 * Wait for all fonts to be loaded.
 * This ensures text measurements are accurate.
 */
export async function waitForFonts(): Promise<void> {
  if (document.fonts && document.fonts.ready) {
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
 * Set font-family attribute on all text and tspan elements in an SVG subtree.
 * Also normalizes font-weight for svg2pdf.js compatibility.
 * This is necessary because:
 * - Vector apps like Illustrator/Inkscape often ignore CSS style blocks
 * - svg2pdf.js needs explicit font-family attributes for proper rendering
 * - svg2pdf.js needs "bold" string instead of numeric font-weight (600/700)
 *
 * @param element - The root element to process
 */
export function setFontFamilyOnTextElements(element: Element): void {
  // Handle SVG namespace - tagName can be lowercase or uppercase
  const tagName = element.tagName?.toLowerCase() || "";
  const localName = element.localName?.toLowerCase() || tagName;

  // Set font-family on text and tspan elements
  if (localName === "text" || localName === "tspan") {
    // Remove any existing font-family to ensure our value takes precedence
    element.removeAttribute("font-family");
    element.setAttribute("font-family", SVG_FONT_FAMILY);

    // Normalize font-weight: svg2pdf.js needs "bold" instead of 600/700
    const fontWeight = element.getAttribute("font-weight");
    if (fontWeight === "600" || fontWeight === "700") {
      element.setAttribute("font-weight", "bold");
    }

    // Also set as style to be extra sure
    const currentStyle = element.getAttribute("style") || "";
    if (!currentStyle.includes("font-family")) {
      element.setAttribute(
        "style",
        currentStyle
          ? `${currentStyle}; font-family: ${SVG_FONT_FAMILY};`
          : `font-family: ${SVG_FONT_FAMILY};`
      );
    }
  }

  // Check for style attribute that might contain font-family or font-weight
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
  }

  // Process all child elements recursively
  Array.from(element.children).forEach((child) => {
    setFontFamilyOnTextElements(child);
  });
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
 * The container is hidden but allows proper layout calculation.
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
  container.id = "export-offscreen-container";
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
