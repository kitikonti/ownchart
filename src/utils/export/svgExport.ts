/**
 * SVG Export functionality.
 * Generates SVG files from the chart DOM or renders custom SVG.
 */

import type { Task } from "../../types/chart.types";
import type { ExportOptions, SvgExportOptions } from "./types";
import { sanitizeFilename } from "./sanitizeFilename";

/** Parameters for SVG export */
export interface ExportToSvgParams {
  tasks: Task[];
  options: ExportOptions;
  svgOptions: SvgExportOptions;
  columnWidths: Record<string, number>;
  currentAppZoom: number;
  projectDateRange?: { start: Date; end: Date };
  visibleDateRange?: { start: Date; end: Date };
  projectName?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Export the chart to SVG.
 */
export async function exportToSvg(params: ExportToSvgParams): Promise<void> {
  const { tasks, svgOptions, projectName, onProgress } = params;

  onProgress?.(10);

  // Try to clone from DOM first
  const chartSvg = document.querySelector(".timeline-chart svg");

  let svgElement: SVGSVGElement;

  if (chartSvg) {
    // Clone existing SVG from DOM
    svgElement = chartSvg.cloneNode(true) as SVGSVGElement;
    onProgress?.(30);
  } else {
    // Create a new SVG if DOM element not found
    svgElement = createFallbackSvg(tasks, params);
    onProgress?.(30);
  }

  // Apply export-specific transformations
  applyExportOptions(svgElement, svgOptions);
  onProgress?.(50);

  // Set dimensions
  setDimensions(svgElement, svgOptions);
  onProgress?.(60);

  // Add background if requested
  if (svgOptions.includeBackground) {
    addBackgroundRect(svgElement);
  }

  // Add accessibility attributes
  if (svgOptions.includeAccessibility) {
    addAccessibilityAttrs(svgElement, projectName);
  }
  onProgress?.(70);

  // Extract styles to classes if requested
  if (svgOptions.styleMode === "classes") {
    extractInlineStylesToClasses(svgElement);
  }

  onProgress?.(80);

  // Serialize to string
  let svgString = serializeSvg(svgElement);

  // Optimize if requested (SVGO would be used here)
  if (svgOptions.optimize) {
    svgString = await optimizeSvg(svgString);
  }

  onProgress?.(90);

  // Handle output (download or copy to clipboard)
  if (svgOptions.copyToClipboard) {
    await copyToClipboard(svgString);
  } else {
    const filename = generateSvgFilename(projectName);
    downloadSvg(svgString, filename);
  }

  onProgress?.(100);
}

/**
 * Create a fallback SVG when DOM element is not available.
 */
function createFallbackSvg(
  tasks: Task[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _params: ExportToSvgParams
): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const width = 800;
  const rowHeight = 30;
  const height = Math.max(200, tasks.length * rowHeight + 50);

  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  // Add a background
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("width", "100%");
  bg.setAttribute("height", "100%");
  bg.setAttribute("fill", "white");
  svg.appendChild(bg);

  // Add tasks
  let y = 30;
  for (const task of tasks) {
    // Task bar
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "150");
    rect.setAttribute("y", String(y));
    rect.setAttribute("width", "200");
    rect.setAttribute("height", "20");
    rect.setAttribute("rx", "4");
    rect.setAttribute("fill", task.color || "#14b8a6");
    svg.appendChild(rect);

    // Task name
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "10");
    text.setAttribute("y", String(y + 15));
    text.setAttribute("font-family", "Inter, Helvetica, Arial, sans-serif");
    text.setAttribute("font-size", "12");
    text.setAttribute("fill", "#1e293b");
    text.textContent = task.name;
    svg.appendChild(text);

    y += rowHeight;
  }

  return svg;
}

/**
 * Apply export options to the SVG element.
 */
function applyExportOptions(
  svg: SVGSVGElement,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: SvgExportOptions
): void {
  // Remove any interactive elements
  svg.querySelectorAll("[data-interactive]").forEach((el) => el.remove());

  // Remove any animation classes
  svg.querySelectorAll("[class*='animate']").forEach((el) => {
    const classes = el.getAttribute("class") || "";
    const filtered = classes
      .split(" ")
      .filter((c) => !c.includes("animate"))
      .join(" ");
    el.setAttribute("class", filtered);
  });
}

/**
 * Set dimensions on the SVG element.
 */
function setDimensions(svg: SVGSVGElement, options: SvgExportOptions): void {
  // Get bounding box
  const width = parseFloat(svg.getAttribute("width") || "800");
  const height = parseFloat(svg.getAttribute("height") || "600");

  if (options.responsiveMode) {
    // Remove fixed dimensions, keep only viewBox
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  } else if (options.dimensionMode === "auto") {
    // Use natural dimensions
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  } else {
    // Custom dimensions
    const customWidth = options.customWidth || width;
    let customHeight = options.customHeight;

    if (options.preserveAspectRatio && !customHeight) {
      customHeight = (height / width) * customWidth;
    }

    svg.setAttribute("width", String(customWidth));
    svg.setAttribute("height", String(customHeight || height));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }
}

/**
 * Add a background rectangle to the SVG.
 */
function addBackgroundRect(svg: SVGSVGElement): void {
  const width = svg.getAttribute("width") || "100%";
  const height = svg.getAttribute("height") || "100%";

  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", "0");
  rect.setAttribute("y", "0");
  rect.setAttribute("width", width);
  rect.setAttribute("height", height);
  rect.setAttribute("fill", "white");

  // Insert as first child
  svg.insertBefore(rect, svg.firstChild);
}

/**
 * Add accessibility attributes to the SVG.
 */
function addAccessibilityAttrs(svg: SVGSVGElement, projectName?: string): void {
  svg.setAttribute("role", "img");
  svg.setAttribute(
    "aria-label",
    projectName ? `Gantt chart for ${projectName}` : "Project Gantt chart"
  );
}

/**
 * Extract inline styles to CSS classes.
 */
function extractInlineStylesToClasses(svg: SVGSVGElement): void {
  const styles: Map<string, string> = new Map();
  let classCounter = 0;

  // Walk all elements with inline styles
  svg.querySelectorAll("[style]").forEach((el) => {
    const inlineStyle = el.getAttribute("style") || "";

    // Check if we've seen this style before
    let className = styles.get(inlineStyle);
    if (!className) {
      className = `oc-${classCounter++}`;
      styles.set(inlineStyle, className);
    }

    el.classList.add(className);
    el.removeAttribute("style");
  });

  // Build CSS rules
  let css = "";
  styles.forEach((className, style) => {
    css += `.${className} { ${style} }\n`;
  });

  // Create style element
  if (css) {
    const styleEl = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "style"
    );
    styleEl.textContent = css;
    svg.insertBefore(styleEl, svg.firstChild);
  }
}

/**
 * Serialize SVG element to string.
 */
function serializeSvg(svg: SVGSVGElement): string {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);

  // Add XML declaration and proper namespace
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
${svgString}`;
}

/**
 * Optimize SVG (placeholder for SVGO integration).
 */
async function optimizeSvg(svgString: string): Promise<string> {
  // SVGO would be dynamically imported and used here
  // For now, just return the original string
  // The optimization would be implemented in a future iteration
  console.log("SVG optimization requested (SVGO not yet integrated)");
  return svgString;
}

/**
 * Copy SVG string to clipboard.
 */
async function copyToClipboard(svgString: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(svgString);
  } catch (error) {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = svgString;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

/**
 * Download SVG as file.
 */
function downloadSvg(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Generate filename for SVG export.
 */
function generateSvgFilename(projectName?: string): string {
  const baseName = projectName ? sanitizeFilename(projectName) : "gantt-chart";
  const timestamp = new Date().toISOString().slice(0, 10);
  return `${baseName}-${timestamp}.svg`;
}
