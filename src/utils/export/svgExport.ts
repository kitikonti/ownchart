/**
 * SVG Export functionality.
 * Creates native SVG output that works in vector editing applications.
 *
 * Approach: Render ExportRenderer offscreen, extract SVG elements directly,
 * and convert the HTML task table to SVG elements.
 */

import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { createElement } from "react";
import type { ReactElement } from "react";
import type { Task } from "../../types/chart.types";
import type { TaskId } from "../../types/branded.types";
import type { ExportOptions, SvgExportOptions, PixelDimensions } from "./types";
import { ExportRenderer } from "../../components/Export/ExportRenderer";
import { calculateExportDimensions } from "./exportLayout";
import { calculateTaskTableWidth } from "./calculations";
import { buildFlattenedTaskList } from "../../utils/hierarchy";
// Shared modules
import {
  HEADER_HEIGHT,
  SVG_FONT_FAMILY,
  EXPORT_CHART_SVG_CLASS,
  SVG_NS,
  REACT_RENDER_WAIT_MS,
  SVG_BACKGROUND_WHITE,
} from "./constants";
import {
  waitForFonts,
  waitForPaint,
  generateExportFilename,
  createOffscreenContainer,
  removeOffscreenContainer,
  cloneSvgChildrenIntoGroup,
} from "./helpers";
import {
  renderTaskTableHeader,
  renderTaskTableRows,
  type TaskTableHeaderOptions,
  type TaskTableRowsOptions,
} from "./taskTableRenderer";
import type { ColorModeState } from "../../types/colorMode.types";

// =============================================================================
// Types
// =============================================================================

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
  colorModeState: ColorModeState;
  onProgress?: (progress: number) => void;
}

/** Parameters for buildCompleteSvg */
interface BuildSvgParams {
  chartSvg: SVGSVGElement;
  headerSvg: SVGSVGElement | null;
  tasks: Task[];
  options: ExportOptions;
  columnWidths: Record<string, number>;
  dimensions: PixelDimensions;
  colorModeState: ColorModeState;
  projectName?: string;
}

// =============================================================================
// Public API
// =============================================================================

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
    colorModeState,
    onProgress,
  } = params;

  onProgress?.(10);

  const dimensions = calculateExportDimensions({
    tasks,
    options,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange,
  });

  onProgress?.(20);

  const container = createOffscreenContainer(
    dimensions.width,
    dimensions.height,
    options.background
  );

  // root is declared outside try so it can be unmounted in finally even on error
  let root: Root | null = null;

  try {
    root = await renderReactToOffscreen(
      container,
      createElement(ExportRenderer, {
        tasks,
        options,
        columnWidths,
        currentAppZoom,
        projectDateRange,
        visibleDateRange,
      })
    );

    onProgress?.(40);

    await waitForFonts();
    await waitForPaint();

    // Make visible for proper layout/paint before extracting SVG
    container.style.opacity = "1";
    await waitForPaint();

    onProgress?.(60);

    const { chartSvg, headerSvg } = extractSvgElements(container);

    const finalSvg = buildCompleteSvg({
      chartSvg,
      headerSvg,
      tasks,
      options,
      columnWidths,
      dimensions,
      colorModeState,
      projectName,
    });

    onProgress?.(80);

    const svgString = finalizeSvg(finalSvg, svgOptions, projectName);

    onProgress?.(90);

    if (svgOptions.copyToClipboard) {
      await copyToClipboard(svgString);
    } else {
      const filename = generateExportFilename(projectName, "svg");
      downloadSvg(svgString, filename);
    }

    onProgress?.(100);
  } finally {
    // Always unmount — even when an error is thrown before explicit unmount
    root?.unmount();
    removeOffscreenContainer(container);
  }
}

// =============================================================================
// Private helpers — rendering pipeline
// =============================================================================

/**
 * Render a React element into an offscreen container and wait for the commit.
 * React schedules commits asynchronously; REACT_RENDER_WAIT_MS gives it one
 * macro-task to flush before font/paint waits take over.
 */
async function renderReactToOffscreen(
  container: HTMLDivElement,
  element: ReactElement
): Promise<Root> {
  const root = createRoot(container);
  await new Promise<void>((resolve) => {
    root.render(element);
    setTimeout(resolve, REACT_RENDER_WAIT_MS);
  });
  return root;
}

/**
 * Extract chart and header SVG elements from the rendered offscreen container.
 * Throws with a descriptive message if the required chart SVG is not found.
 */
function extractSvgElements(container: HTMLDivElement): {
  chartSvg: SVGSVGElement;
  headerSvg: SVGSVGElement | null;
} {
  const chartEl = container.querySelector(`svg.${EXPORT_CHART_SVG_CLASS}`);
  if (!chartEl) {
    throw new Error(
      `Chart SVG element (svg.${EXPORT_CHART_SVG_CLASS}) not found in export container`
    );
  }
  const headerEl = container.querySelector(
    ".export-container > div:first-child svg"
  );
  return {
    chartSvg: chartEl as SVGSVGElement,
    headerSvg: headerEl as SVGSVGElement | null,
  };
}

// =============================================================================
// Private helpers — SVG construction
// =============================================================================

/**
 * Append a white background rect (when requested) and a font CSS declaration.
 * The CSS style block is for browsers; cloneSvgChildrenIntoGroup() handles
 * vector app compatibility via explicit font-family attributes on each element.
 */
function appendBackgroundAndDefs(
  svg: SVGSVGElement,
  background: "white" | "transparent"
): void {
  if (background === "white") {
    const bg = document.createElementNS(SVG_NS, "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", SVG_BACKGROUND_WHITE);
    svg.appendChild(bg);
  }

  const defs = document.createElementNS(SVG_NS, "defs");
  const style = document.createElementNS(SVG_NS, "style");
  // CSS style block for browser rendering; vector apps use explicit attributes
  style.textContent = `text { font-family: ${SVG_FONT_FAMILY}; }`;
  defs.appendChild(style);
  svg.appendChild(defs);
}

/**
 * Append task-table column headers and/or the cloned timeline header SVG.
 */
function appendHeaderElements(
  svg: SVGSVGElement,
  hasTaskList: boolean,
  selectedColumns: ExportOptions["selectedColumns"],
  columnWidths: Record<string, number>,
  taskTableWidth: number,
  density: ExportOptions["density"],
  headerSvg: SVGSVGElement | null
): void {
  if (hasTaskList) {
    const headerOpts: TaskTableHeaderOptions = {
      selectedColumns,
      columnWidths,
      totalWidth: taskTableWidth,
      x: 0,
      y: 0,
      density,
    };
    renderTaskTableHeader(svg, headerOpts);
  }

  if (headerSvg) {
    const headerGroup = document.createElementNS(SVG_NS, "g");
    headerGroup.setAttribute("transform", `translate(${taskTableWidth}, 0)`);
    cloneSvgChildrenIntoGroup(headerSvg, headerGroup);
    svg.appendChild(headerGroup);
  }
}

/**
 * Clone the chart SVG into a positioned group and append it to the root SVG.
 */
function appendChartGroup(
  svg: SVGSVGElement,
  chartSvg: SVGSVGElement,
  taskTableWidth: number,
  offsetY: number
): void {
  const chartGroup = document.createElementNS(SVG_NS, "g");
  chartGroup.setAttribute(
    "transform",
    `translate(${taskTableWidth}, ${offsetY})`
  );
  cloneSvgChildrenIntoGroup(chartSvg, chartGroup);
  svg.appendChild(chartGroup);
}

/**
 * Build a complete SVG with the task table rendered as native SVG elements.
 */
function buildCompleteSvg(params: BuildSvgParams): SVGSVGElement {
  const {
    chartSvg,
    headerSvg,
    tasks,
    options,
    columnWidths,
    dimensions,
    colorModeState,
    projectName,
  } = params;

  // Empty selectedColumns = timeline-only export (no task table)
  const selectedColumns = options.selectedColumns;
  const hasTaskList = selectedColumns.length > 0;
  const taskTableWidth = hasTaskList
    ? calculateTaskTableWidth(selectedColumns, columnWidths, options.density)
    : 0;

  // No hidden tasks at export time — tasks are pre-filtered by prepareExportTasks
  const flattenedTasks = buildFlattenedTaskList(tasks, new Set<TaskId>());

  // Root SVG element
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("xmlns", SVG_NS);
  svg.setAttribute("width", String(dimensions.width));
  svg.setAttribute("height", String(dimensions.height));
  svg.setAttribute("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

  // Accessibility title
  const title = document.createElementNS(SVG_NS, "title");
  title.textContent = projectName
    ? `Gantt chart: ${projectName}`
    : "Gantt Chart";
  svg.appendChild(title);

  appendBackgroundAndDefs(svg, options.background);

  let currentY = 0;

  if (options.includeHeader) {
    appendHeaderElements(
      svg,
      hasTaskList,
      selectedColumns,
      columnWidths,
      taskTableWidth,
      options.density,
      headerSvg
    );
    currentY = HEADER_HEIGHT;
  }

  if (hasTaskList) {
    const rowsOpts: TaskTableRowsOptions = {
      flattenedTasks,
      selectedColumns,
      columnWidths,
      totalWidth: taskTableWidth,
      x: 0,
      startY: currentY,
      density: options.density,
      colorModeState,
    };
    renderTaskTableRows(svg, rowsOpts);
  }

  appendChartGroup(svg, chartSvg, taskTableWidth, currentY);

  return svg;
}

// =============================================================================
// Private helpers — finalization & output
// =============================================================================

/**
 * Apply accessibility attributes, resolve dimension options, and serialize to string.
 *
 * Option precedence (highest to lowest):
 *   dimensionMode === "custom"  →  explicit width/height applied last (overrides responsive)
 *   responsiveMode === true     →  width/height removed so SVG scales to its container
 *   (default)                  →  fixed pixel dimensions from buildCompleteSvg
 *
 * viewBox is always present (set by buildCompleteSvg), so no fallback is needed here.
 */
function finalizeSvg(
  svg: SVGSVGElement,
  options: SvgExportOptions,
  projectName?: string
): string {
  if (options.includeAccessibility) {
    svg.setAttribute("role", "img");
    svg.setAttribute(
      "aria-label",
      projectName ? `Gantt chart for ${projectName}` : "Project Gantt chart"
    );
  }

  if (options.responsiveMode) {
    svg.removeAttribute("width");
    svg.removeAttribute("height");
  }

  // Custom dimensions are applied after responsiveMode so they always win
  if (options.dimensionMode === "custom") {
    if (options.customWidth) {
      svg.setAttribute("width", String(options.customWidth));
    }
    if (options.customHeight) {
      svg.setAttribute("height", String(options.customHeight));
    }
  }

  const serializer = new XMLSerializer();
  let result = serializer.serializeToString(svg);

  if (!result.startsWith("<?xml")) {
    result = `<?xml version="1.0" encoding="UTF-8"?>\n${result}`;
  }

  return result;
}

/**
 * Copy SVG string to clipboard.
 * Falls back to the deprecated execCommand API when the Clipboard API is
 * unavailable (e.g. non-HTTPS context or older browsers).
 */
async function copyToClipboard(svgString: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(svgString);
  } catch {
    // Clipboard API unavailable — best-effort fallback via deprecated execCommand
    console.warn(
      "[svgExport] navigator.clipboard unavailable; falling back to execCommand copy"
    );
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
 * Trigger a browser download of an SVG file.
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
