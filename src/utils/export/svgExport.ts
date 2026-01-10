/**
 * SVG Export functionality.
 * Creates native SVG output that works in vector editing applications.
 *
 * Approach: Render ExportRenderer offscreen, extract SVG elements directly,
 * and convert the HTML task table to SVG elements.
 */

import { createRoot } from "react-dom/client";
import { createElement } from "react";
import type { Task } from "../../types/chart.types";
import type { ExportOptions, SvgExportOptions } from "./types";
import {
  ExportRenderer,
  calculateExportDimensions,
} from "../../components/Export/ExportRenderer";
import { calculateTaskTableWidth } from "./calculations";
import { buildFlattenedTaskList } from "../../utils/hierarchy";
// Shared modules
import { HEADER_HEIGHT } from "./constants";
import {
  waitForFonts,
  waitForPaint,
  setFontFamilyOnTextElements,
  generateExportFilename,
  createOffscreenContainer,
  removeOffscreenContainer,
} from "./helpers";
import {
  renderTaskTableHeader,
  renderTaskTableRows,
} from "./taskTableRenderer";

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
 * Export the chart to native SVG.
 * Creates a proper SVG that works in vector editing applications.
 */
export async function exportToSvg(params: ExportToSvgParams): Promise<void> {
  const {
    tasks,
    options,
    svgOptions,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange,
    projectName,
    onProgress,
  } = params;

  onProgress?.(10);

  // Calculate dimensions
  const dimensions = calculateExportDimensions(
    tasks,
    options,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange
  );

  onProgress?.(20);

  // Create offscreen container
  const container = createOffscreenContainer(
    dimensions.width,
    dimensions.height,
    options.background
  );

  try {
    // Render ExportRenderer
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
      setTimeout(resolve, 100);
    });

    onProgress?.(40);

    await waitForFonts();
    await waitForPaint();

    // Make visible for proper rendering
    container.style.opacity = "1";
    await waitForPaint();

    onProgress?.(60);

    // Extract the timeline SVG elements from the rendered DOM
    const chartSvg = container.querySelector("svg.gantt-chart");
    const headerSvg = container.querySelector(".export-container > div:first-child svg");

    if (!chartSvg) {
      throw new Error("Could not find chart SVG element");
    }

    // Build a new complete SVG with task table as SVG elements
    const finalSvg = buildCompleteSvg(
      chartSvg as SVGSVGElement,
      headerSvg as SVGSVGElement | null,
      tasks,
      options,
      columnWidths,
      dimensions,
      projectName
    );

    onProgress?.(80);

    // Cleanup React
    root.unmount();

    // Apply SVG options
    const svgString = finalizeSvg(finalSvg, svgOptions, projectName);

    onProgress?.(90);

    // Output
    if (svgOptions.copyToClipboard) {
      await copyToClipboard(svgString);
    } else {
      const filename = generateExportFilename(projectName, "svg");
      downloadSvg(svgString, filename);
    }

    onProgress?.(100);
  } finally {
    removeOffscreenContainer(container);
  }
}

/**
 * Build a complete SVG with task table rendered as native SVG elements.
 */
function buildCompleteSvg(
  chartSvg: SVGSVGElement,
  headerSvg: SVGSVGElement | null,
  tasks: Task[],
  options: ExportOptions,
  columnWidths: Record<string, number>,
  dimensions: { width: number; height: number },
  projectName?: string
): SVGSVGElement {
  // Calculate task table width
  const selectedColumns = options.selectedColumns || ["name", "startDate", "endDate", "progress"];
  const hasTaskList = selectedColumns.length > 0;
  const taskTableWidth = hasTaskList
    ? calculateTaskTableWidth(selectedColumns, columnWidths, options.density)
    : 0;

  // Build flattened task list
  const flattenedTasks = buildFlattenedTaskList(tasks, new Set<string>());

  // Create the root SVG
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", String(dimensions.width));
  svg.setAttribute("height", String(dimensions.height));
  svg.setAttribute("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

  // Add title for accessibility
  const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
  title.textContent = projectName ? `Gantt chart: ${projectName}` : "Gantt Chart";
  svg.appendChild(title);

  // Add white background if requested
  if (options.background === "white") {
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", "#ffffff");
    svg.appendChild(bg);
  }

  // Font declaration (no @import - doesn't work in vector apps)
  // Vector apps will use their system font or Inter if installed
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = `
    text { font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  `;
  defs.appendChild(style);
  svg.appendChild(defs);

  let currentY = 0;

  // Render header row
  if (options.includeHeader) {
    // Task table header
    if (hasTaskList) {
      renderTaskTableHeader(svg, selectedColumns, columnWidths, taskTableWidth, 0, 0, options.density);
    }

    // Timeline header - clone and position
    if (headerSvg) {
      const headerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      headerGroup.setAttribute("transform", `translate(${taskTableWidth}, 0)`);

      // Clone all children from header SVG
      Array.from(headerSvg.childNodes).forEach(child => {
        headerGroup.appendChild(child.cloneNode(true));
      });
      // Set font-family on all text elements (vector apps ignore CSS style blocks)
      setFontFamilyOnTextElements(headerGroup);
      svg.appendChild(headerGroup);
    }

    currentY = HEADER_HEIGHT;
  }

  // Render task table rows as SVG
  if (hasTaskList) {
    renderTaskTableRows(
      svg,
      flattenedTasks,
      selectedColumns,
      columnWidths,
      taskTableWidth,
      0,
      currentY,
      options.density
    );
  }

  // Add the timeline chart - clone and position
  const chartGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  chartGroup.setAttribute("transform", `translate(${taskTableWidth}, ${currentY})`);

  // Clone all children from chart SVG
  Array.from(chartSvg.childNodes).forEach(child => {
    chartGroup.appendChild(child.cloneNode(true));
  });
  // Set font-family on all text elements (vector apps ignore CSS style blocks)
  setFontFamilyOnTextElements(chartGroup);
  svg.appendChild(chartGroup);

  return svg;
}


/**
 * Finalize SVG with options and serialize.
 */
function finalizeSvg(
  svg: SVGSVGElement,
  options: SvgExportOptions,
  projectName?: string
): string {
  // Add accessibility attributes
  if (options.includeAccessibility) {
    svg.setAttribute("role", "img");
    svg.setAttribute(
      "aria-label",
      projectName ? `Gantt chart for ${projectName}` : "Project Gantt chart"
    );
  }

  // Handle responsive mode
  if (options.responsiveMode) {
    const width = svg.getAttribute("width");
    const height = svg.getAttribute("height");
    if (width && height && !svg.getAttribute("viewBox")) {
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }
    svg.removeAttribute("width");
    svg.removeAttribute("height");
  }

  // Handle custom dimensions
  if (options.dimensionMode === "custom") {
    if (options.customWidth) {
      svg.setAttribute("width", String(options.customWidth));
    }
    if (options.customHeight) {
      svg.setAttribute("height", String(options.customHeight));
    }
  }

  // Serialize
  const serializer = new XMLSerializer();
  let result = serializer.serializeToString(svg);

  // Add XML declaration
  if (!result.startsWith("<?xml")) {
    result = `<?xml version="1.0" encoding="UTF-8"?>\n${result}`;
  }

  return result;
}

/**
 * Copy SVG string to clipboard.
 */
async function copyToClipboard(svgString: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(svgString);
  } catch {
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
