/**
 * SVG Export functionality.
 * Creates native SVG output that works in vector editing applications.
 *
 * Approach: Render ExportRenderer offscreen, extract SVG elements directly,
 * and convert the HTML task table to SVG elements.
 */

import { createRoot } from "react-dom/client";
import { createElement } from "react";

import type { ColorModeState } from "../../types/colorMode.types";
import type { Task } from "../../types/chart.types";
import type { TaskId } from "../../types/branded.types";
import type { ExportOptions, SvgExportOptions } from "./types";
import type {
  TaskTableHeaderOptions,
  TaskTableRowsOptions,
} from "./taskTableRenderer";
import { ExportRenderer } from "../../components/Export/ExportRenderer";
import { buildFlattenedTaskList } from "../hierarchy";
import { DEFAULT_EXPORT_COLUMNS } from "./types";
import { calculateExportDimensions } from "./exportLayout";
import { calculateTaskTableWidth } from "./calculations";
import {
  HEADER_HEIGHT,
  SVG_FONT_FAMILY,
  REACT_RENDER_WAIT_MS,
  EXPORT_CHART_SVG_CLASS,
  EXPORT_TIMELINE_HEADER_SVG_CLASS,
} from "./constants";
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

/**
 * Opaque background fill colour for the SVG canvas.
 * Intentionally hardcoded: pure white is a presentation-layer override for
 * the "opaque background" export option, not a design-system colour that
 * should track theme changes.
 */
const EXPORT_OPAQUE_BACKGROUND_COLOR = "#ffffff";

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

  // Calculate dimensions
  const dimensions = calculateExportDimensions({
    tasks,
    options,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange,
  });

  onProgress?.(20);

  // Create offscreen container
  const container = createOffscreenContainer(
    dimensions.width,
    dimensions.height,
    options.background
  );

  // The React root is created outside the try block so the finally clause
  // can always call root.unmount(), preventing leaks on error paths.
  const root = createRoot(container);

  try {
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
      setTimeout(resolve, REACT_RENDER_WAIT_MS);
    });

    onProgress?.(40);

    await waitForFonts();
    await waitForPaint();

    // Make visible for proper rendering
    container.style.opacity = "1";
    await waitForPaint();

    onProgress?.(60);

    // Extract the timeline SVG elements from the rendered DOM.
    // Use the same named CSS class constants as pdfExport.ts to avoid
    // selector drift if class names change in ExportRenderer.
    const chartSvg = container.querySelector(`svg.${EXPORT_CHART_SVG_CLASS}`);
    const headerSvg = container.querySelector(
      `svg.${EXPORT_TIMELINE_HEADER_SVG_CLASS}`
    );

    if (!chartSvg) {
      throw new Error("Could not find chart SVG element");
    }

    if (!(chartSvg instanceof SVGSVGElement)) {
      throw new Error(
        "Chart SVG element has unexpected type; expected SVGSVGElement"
      );
    }

    // headerSvg may legitimately be null when includeHeader is false.
    // Verify the type only when the element was actually found.
    if (headerSvg !== null && !(headerSvg instanceof SVGSVGElement)) {
      throw new Error(
        "Timeline header element has unexpected type; expected SVGSVGElement"
      );
    }

    if (options.includeHeader && !headerSvg) {
      // This is a non-fatal invariant violation: the chart body will be offset
      // by HEADER_HEIGHT but the header section will be blank. Log a warning
      // so it surfaces in developer consoles without crashing the export.
      if (import.meta.env.DEV) {
        console.warn(
          "[svgExport] includeHeader is true but the timeline header SVG element was not found. " +
            "The export header area will be empty."
        );
      }
    }

    // Build a new complete SVG with task table as SVG elements
    const finalSvg = buildCompleteSvg(
      chartSvg,
      headerSvg,
      tasks,
      options,
      columnWidths,
      dimensions,
      colorModeState,
      projectName
    );

    onProgress?.(80);

    // Apply SVG options and serialize
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
    // Always unmount the React root and remove the container, even on error,
    // to prevent memory leaks on repeated export attempts that fail mid-way.
    root.unmount();
    removeOffscreenContainer(container);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers — exported for unit testing only (@internal)
// ---------------------------------------------------------------------------

/**
 * Resolve the effective export columns and compute the task-table panel width.
 * Separates the "what to render" decision from the "how to compose it" logic
 * in {@link buildCompleteSvg}.
 *
 * @internal
 */
export function resolveExportLayout(
  options: ExportOptions,
  columnWidths: Record<string, number>
): {
  selectedColumns: NonNullable<ExportOptions["selectedColumns"]>;
  taskTableWidth: number;
  hasTaskList: boolean;
} {
  const selectedColumns =
    options.selectedColumns.length > 0
      ? options.selectedColumns
      : DEFAULT_EXPORT_COLUMNS;
  const hasTaskList = selectedColumns.length > 0;
  const taskTableWidth = hasTaskList
    ? calculateTaskTableWidth(selectedColumns, columnWidths, options.density)
    : 0;
  return { selectedColumns, taskTableWidth, hasTaskList };
}

/**
 * Create the root SVG canvas with title, optional white background, and font defs.
 *
 * @internal
 */
export function createRootSvg(
  dimensions: { width: number; height: number },
  background: "white" | "transparent",
  projectName?: string
): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", String(dimensions.width));
  svg.setAttribute("height", String(dimensions.height));
  svg.setAttribute("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

  // Add title for accessibility
  const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
  title.textContent = projectName
    ? `Gantt chart: ${projectName}`
    : "Gantt Chart";
  svg.appendChild(title);

  // Add white background if requested
  if (background === "white") {
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", EXPORT_OPAQUE_BACKGROUND_COLOR);
    svg.appendChild(bg);
  }

  // Font declaration (system font stack — no @import, doesn't work in vector apps).
  // Vector apps will use their system font (Segoe UI on Windows, SF on Mac).
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = `
    text { font-family: ${SVG_FONT_FAMILY}; }
  `;
  defs.appendChild(style);
  svg.appendChild(defs);

  return svg;
}

/**
 * Append the timeline header SVG (cloned from the rendered DOM) into the root SVG,
 * offset horizontally by the task table width.
 */
function appendTimelineHeader(
  svg: SVGSVGElement,
  headerSvg: SVGSVGElement,
  taskTableWidth: number
): void {
  const headerGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  headerGroup.setAttribute("transform", `translate(${taskTableWidth}, 0)`);

  // Clone all children from header SVG
  Array.from(headerSvg.childNodes).forEach((child) => {
    headerGroup.appendChild(child.cloneNode(true));
  });
  // Set font-family on all text elements (vector apps ignore CSS style blocks)
  setFontFamilyOnTextElements(headerGroup);
  svg.appendChild(headerGroup);
}

/**
 * Append the chart body SVG (cloned from the rendered DOM) into the root SVG,
 * offset by the task table width and the header height.
 */
function appendChartBody(
  svg: SVGSVGElement,
  chartSvg: SVGSVGElement,
  taskTableWidth: number,
  yOffset: number
): void {
  const chartGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  chartGroup.setAttribute(
    "transform",
    `translate(${taskTableWidth}, ${yOffset})`
  );

  // Clone all children from chart SVG
  Array.from(chartSvg.childNodes).forEach((child) => {
    chartGroup.appendChild(child.cloneNode(true));
  });
  // Set font-family on all text elements (vector apps ignore CSS style blocks)
  setFontFamilyOnTextElements(chartGroup);
  svg.appendChild(chartGroup);
}

/**
 * Render the task table section (header row + data rows) into the root SVG.
 * Only called when at least one column is selected for the task list panel.
 *
 * @param svg - Root SVG element to append into
 * @param flattenedTasks - Flattened task list (from {@link buildFlattenedTaskList})
 * @param selectedColumns - Ordered list of columns to render
 * @param columnWidths - Per-column pixel widths
 * @param taskTableWidth - Total width of the task table panel in px
 * @param bodyYOffset - Y offset in px where task data rows begin (after header, if any)
 * @param options - Export options (density, includeHeader, etc.)
 * @param colorModeState - Current color mode for row rendering
 */
function renderTaskTableSection(
  svg: SVGSVGElement,
  flattenedTasks: ReturnType<typeof buildFlattenedTaskList>,
  selectedColumns: NonNullable<ExportOptions["selectedColumns"]>,
  columnWidths: Record<string, number>,
  taskTableWidth: number,
  bodyYOffset: number,
  options: ExportOptions,
  colorModeState: ColorModeState
): void {
  if (options.includeHeader) {
    const headerOpts: TaskTableHeaderOptions = {
      selectedColumns,
      columnWidths,
      totalWidth: taskTableWidth,
      x: 0,
      y: 0,
      density: options.density,
    };
    renderTaskTableHeader(svg, headerOpts);
  }

  const rowsOpts: TaskTableRowsOptions = {
    flattenedTasks,
    selectedColumns,
    columnWidths,
    totalWidth: taskTableWidth,
    x: 0,
    startY: bodyYOffset,
    density: options.density,
    colorModeState,
  };
  renderTaskTableRows(svg, rowsOpts);
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
  colorModeState: ColorModeState,
  projectName?: string
): SVGSVGElement {
  const { selectedColumns, taskTableWidth, hasTaskList } = resolveExportLayout(
    options,
    columnWidths
  );

  const flattenedTasks = buildFlattenedTaskList(tasks, new Set<TaskId>());

  const svg = createRootSvg(dimensions, options.background, projectName);

  const bodyYOffset = options.includeHeader ? HEADER_HEIGHT : 0;

  if (hasTaskList) {
    renderTaskTableSection(
      svg,
      flattenedTasks,
      selectedColumns,
      columnWidths,
      taskTableWidth,
      bodyYOffset,
      options,
      colorModeState
    );
  }

  if (options.includeHeader && headerSvg) {
    appendTimelineHeader(svg, headerSvg, taskTableWidth);
  }

  appendChartBody(svg, chartSvg, taskTableWidth, bodyYOffset);

  return svg;
}

/**
 * Apply SVG export options to the root SVG element and serialize it to a string.
 *
 * This function performs four steps in order:
 * 1. Adds accessibility attributes (`role="img"`, `aria-label`) if requested.
 * 2. Switches to responsive mode by removing `width`/`height` and ensuring a `viewBox` exists.
 * 3. Applies custom pixel dimensions if `dimensionMode` is `"custom"`.
 * 4. Serializes the SVG to an XML string and prepends the XML declaration.
 *
 * @param svg - The fully constructed root SVG element (mutated in place)
 * @param options - SVG-specific export options
 * @param projectName - Optional project name used for the `aria-label` value
 * @returns The serialized SVG string including the `<?xml ...?>` declaration
 *
 * @internal
 */
export function finalizeSvg(
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
 * Prefers the modern Clipboard API; falls back to the legacy execCommand
 * approach for environments where the Clipboard API is unavailable (e.g.
 * insecure contexts). Throws if both methods fail so the caller can surface
 * a user-facing error rather than silently doing nothing.
 */
async function copyToClipboard(svgString: string): Promise<void> {
  // Prefer modern Clipboard API (available in secure contexts)
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(svgString);
    return;
  }

  // Fallback: legacy execCommand (deprecated but still works in some environments)
  const textarea = document.createElement("textarea");
  textarea.value = svgString;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  try {
    textarea.select();
    // execCommand is deprecated; this is only reached when the Clipboard API
    // is unavailable (e.g. non-HTTPS context or older browser).
    const success = document.execCommand("copy");
    if (!success) {
      throw new Error("execCommand copy returned false");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

/**
 * Download SVG as a file via an ephemeral anchor element.
 * The anchor is briefly appended to and then removed from `document.body`
 * so that `.click()` fires the download in all browsers (Firefox requires the
 * element to be in the DOM). Revokes the object URL after triggering the
 * download even if `.click()` throws, and rethrows any error so the caller
 * can surface it to the user.
 */
function downloadSvg(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);

  try {
    link.click();
  } finally {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
