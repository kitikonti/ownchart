/**
 * SVG Export functionality.
 * Creates native SVG output that works in vector editing applications.
 *
 * Approach: Render ExportRenderer offscreen, extract SVG elements directly,
 * and convert the HTML task table to SVG elements.
 */

// React
import { createRoot } from "react-dom/client";
import { createElement } from "react";

// Local components
import { ExportRenderer } from "../../components/Export/ExportRenderer";

// Local utilities
import { buildFlattenedTaskList } from "../hierarchy";
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

// Types
import type { ColorModeState } from "../../types/colorMode.types";
import type { Task } from "../../types/chart.types";
import type { TaskId } from "../../types/branded.types";
import {
  type ExportOptions,
  type SvgExportOptions,
  type ExportColumnKey,
  type ExportBackground,
  DEFAULT_EXPORT_COLUMNS,
} from "./types";
import type {
  TaskTableHeaderOptions,
  TaskTableRowsOptions,
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
  const { options, svgOptions, projectName, onProgress } = params;

  onProgress?.(10);
  const dimensions = calculateExportDimensions(params);
  onProgress?.(20);

  const container = createOffscreenContainer(
    dimensions.width,
    dimensions.height,
    options.background
  );

  // React root lives outside the try block so the finally clause can always
  // call root.unmount(), preventing leaks on error paths.
  const root = createRoot(container);

  try {
    const svgString = await renderAndSerializeSvg(
      root,
      container,
      params,
      dimensions
    );
    await deliverSvg(svgString, svgOptions, projectName);
    onProgress?.(100);
  } finally {
    // Always clean up even when an error is thrown mid-export.
    root.unmount();
    removeOffscreenContainer(container);
  }
}

/**
 * Render the ExportRenderer into the offscreen container, extract the SVG
 * elements, build the complete SVG document, and serialize it to a string.
 *
 * Separated from {@link exportToSvg} so each phase can be reasoned about and
 * tested in isolation while keeping the top-level orchestrator concise.
 *
 * @internal
 */
async function renderAndSerializeSvg(
  root: ReturnType<typeof createRoot>,
  container: HTMLElement,
  params: ExportToSvgParams,
  dimensions: { width: number; height: number }
): Promise<string> {
  const {
    tasks,
    options,
    svgOptions,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange,
    colorModeState,
    projectName,
    onProgress,
  } = params;

  await renderExportComponentAndWait(root, container, {
    tasks,
    options,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange,
  });
  onProgress?.(40);

  const { chartSvg, headerSvg } = extractSvgElements(container, options);
  onProgress?.(60);

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

  // finalizeSvg mutates finalSvg in-place (adds aria attrs, adjusts viewBox /
  // dimensions) before serializing — finalSvg is a local variable owned by
  // this call, so mutation is safe.
  const svgString = finalizeSvg(finalSvg, svgOptions, projectName);
  onProgress?.(90);

  return svgString;
}

// ---------------------------------------------------------------------------
// Internal helpers — exported for unit testing only (@internal)
// ---------------------------------------------------------------------------

/**
 * Render the ExportRenderer component into the offscreen container and wait
 * for React to commit + fonts to load + paint to settle before returning.
 *
 * Separated from {@link exportToSvg} so the render+wait phase can be tested
 * and reasoned about in isolation.
 *
 * @internal
 */
export async function renderExportComponentAndWait(
  root: ReturnType<typeof createRoot>,
  container: HTMLElement,
  props: {
    tasks: Task[];
    options: ExportOptions;
    columnWidths: Record<string, number>;
    currentAppZoom: number;
    projectDateRange?: { start: Date; end: Date };
    visibleDateRange?: { start: Date; end: Date };
  }
): Promise<void> {
  await new Promise<void>((resolve) => {
    root.render(createElement(ExportRenderer, props));
    // React schedules its commit asynchronously; give it one macro-task to
    // flush before waitForFonts / waitForPaint take over.
    setTimeout(resolve, REACT_RENDER_WAIT_MS);
  });

  await waitForFonts();
  await waitForPaint();

  // Make visible for proper rendering (some browsers skip paint for hidden els)
  container.style.opacity = "1";
  await waitForPaint();
}

/**
 * Query and type-guard the chart body SVG and optional timeline header SVG
 * from the rendered offscreen container.
 *
 * Throws on missing or wrongly-typed chart SVG. Emits a dev-only warning
 * (and returns `null` for `headerSvg`) when `includeHeader` is true but the
 * header element was not found — the export continues with a blank header area.
 *
 * @internal
 */
export function extractSvgElements(
  container: HTMLElement,
  options: Pick<ExportOptions, "includeHeader">
): { chartSvg: SVGSVGElement; headerSvg: SVGSVGElement | null } {
  // Use the same named CSS class constants as pdfExport.ts to avoid
  // selector drift if class names change in ExportRenderer.
  const chartSvgEl = container.querySelector(`svg.${EXPORT_CHART_SVG_CLASS}`);
  const headerSvgEl = container.querySelector(
    `svg.${EXPORT_TIMELINE_HEADER_SVG_CLASS}`
  );

  if (!chartSvgEl) {
    throw new Error("Could not find chart SVG element");
  }

  if (!(chartSvgEl instanceof SVGSVGElement)) {
    throw new Error(
      "Chart SVG element has unexpected type; expected SVGSVGElement"
    );
  }

  // headerSvg may legitimately be null when includeHeader is false.
  // Verify the type only when the element was actually found.
  if (headerSvgEl !== null && !(headerSvgEl instanceof SVGSVGElement)) {
    throw new Error(
      "Timeline header element has unexpected type; expected SVGSVGElement"
    );
  }

  if (options.includeHeader && !headerSvgEl) {
    // This is a non-fatal invariant violation: the chart body will be offset
    // by HEADER_HEIGHT but the header section will be blank. Limit the
    // warning to development builds so it does not appear in users' consoles
    // in production — the export will still complete with a blank header area.
    if (import.meta.env.DEV) {
      console.warn(
        "[svgExport] includeHeader is true but the timeline header SVG element was not found. " +
          "The export header area will be empty."
      );
    }
  }

  return {
    chartSvg: chartSvgEl,
    headerSvg: headerSvgEl,
  };
}

/**
 * Resolve the effective export columns and compute the task-table panel width.
 * Separates the "what to render" decision from the "how to compose it" logic
 * in {@link buildCompleteSvg}.
 *
 * Falls back to DEFAULT_EXPORT_COLUMNS when the caller passes an empty array.
 * A future timeline-only mode (no task table at all) should be modelled with
 * an explicit ExportOptions flag rather than by passing an empty
 * selectedColumns array.
 *
 * @internal
 */
export function resolveExportLayout(
  options: ExportOptions,
  columnWidths: Record<string, number>
): {
  selectedColumns: NonNullable<ExportOptions["selectedColumns"]>;
  taskTableWidth: number;
} {
  // Guard against undefined (e.g. loose casts from JS callers or future optional paths).
  const cols: ExportColumnKey[] = options.selectedColumns ?? [];
  const selectedColumns = cols.length > 0 ? cols : DEFAULT_EXPORT_COLUMNS;
  const taskTableWidth = calculateTaskTableWidth(
    selectedColumns,
    columnWidths,
    options.density
  );
  return { selectedColumns, taskTableWidth };
}

/**
 * Create the root SVG canvas with title, optional white background, and font defs.
 *
 * @internal
 */
export function createRootSvg(
  dimensions: { width: number; height: number },
  background: ExportBackground,
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
 * Clone all children of `sourceSvg` into a new `<g>` element with the given
 * SVG transform, set font-family on all text descendants (vector apps ignore
 * CSS style blocks), and append the group to `svg`.
 *
 * Extracted from {@link appendTimelineHeader} and {@link appendChartBody} to
 * eliminate the duplicated clone-and-append pattern.
 *
 * @internal
 */
export function cloneSvgIntoGroup(
  svg: SVGSVGElement,
  sourceSvg: SVGSVGElement,
  transform: string
): void {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("transform", transform);
  for (const child of sourceSvg.childNodes) {
    group.appendChild(child.cloneNode(true));
  }
  // Set font-family on all text elements (vector apps ignore CSS style blocks)
  setFontFamilyOnTextElements(group);
  svg.appendChild(group);
}

/**
 * Append the timeline header SVG (cloned from the rendered DOM) into the root SVG,
 * offset horizontally by the task table width.
 *
 * @internal
 */
export function appendTimelineHeader(
  svg: SVGSVGElement,
  headerSvg: SVGSVGElement,
  taskTableWidth: number
): void {
  cloneSvgIntoGroup(svg, headerSvg, `translate(${taskTableWidth}, 0)`);
}

/**
 * Append the chart body SVG (cloned from the rendered DOM) into the root SVG,
 * offset by the task table width and the header height.
 *
 * @internal
 */
export function appendChartBody(
  svg: SVGSVGElement,
  chartSvg: SVGSVGElement,
  taskTableWidth: number,
  yOffset: number
): void {
  cloneSvgIntoGroup(svg, chartSvg, `translate(${taskTableWidth}, ${yOffset})`);
}

/** Options for {@link renderTaskTableSection}. */
interface RenderTaskTableSectionOptions {
  flattenedTasks: ReturnType<typeof buildFlattenedTaskList>;
  selectedColumns: NonNullable<ExportOptions["selectedColumns"]>;
  columnWidths: Record<string, number>;
  taskTableWidth: number;
  bodyYOffset: number;
  options: ExportOptions;
  colorModeState: ColorModeState;
}

/**
 * Render the task table section (header row + data rows) into the root SVG.
 * Only called when at least one column is selected for the task list panel.
 */
function renderTaskTableSection(
  svg: SVGSVGElement,
  sectionOpts: RenderTaskTableSectionOptions
): void {
  const {
    flattenedTasks,
    selectedColumns,
    columnWidths,
    taskTableWidth,
    bodyYOffset,
    options,
    colorModeState,
  } = sectionOpts;

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

/** Parameters for {@link buildCompleteSvg}. */
interface BuildCompleteSvgParams {
  chartSvg: SVGSVGElement;
  headerSvg: SVGSVGElement | null;
  tasks: Task[];
  options: ExportOptions;
  columnWidths: Record<string, number>;
  dimensions: { width: number; height: number };
  colorModeState: ColorModeState;
  projectName?: string;
}

/**
 * Build a complete SVG document from the rendered React export DOM.
 *
 * Composes the final SVG by:
 * 1. Creating a root canvas sized to `dimensions`.
 * 2. Rendering the task table (header row + data rows) as native SVG elements
 *    at the left edge.
 * 3. Cloning and appending the timeline header SVG (offset right by task-table
 *    width) when `options.includeHeader` is true and `headerSvg` is present.
 * 4. Cloning and appending the chart body SVG (offset right and down by header
 *    height when applicable).
 *
 * @returns The composed root SVGSVGElement ready for serialization
 */
function buildCompleteSvg(params: BuildCompleteSvgParams): SVGSVGElement {
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

  const { selectedColumns, taskTableWidth } = resolveExportLayout(
    options,
    columnWidths
  );

  // tasks has already been pre-filtered by prepareExportTasks (single source
  // of truth for export visibility). No hidden tasks remain at this point,
  // so an empty hiddenTaskIds set is correct here.
  const flattenedTasks = buildFlattenedTaskList(tasks, new Set<TaskId>());

  const svg = createRootSvg(dimensions, options.background, projectName);

  const bodyYOffset = options.includeHeader ? HEADER_HEIGHT : 0;

  // selectedColumns is always non-empty after resolveExportLayout's fallback
  // to DEFAULT_EXPORT_COLUMNS, so the task table section is always rendered.
  // A future timeline-only mode should use an explicit ExportOptions flag.
  renderTaskTableSection(svg, {
    flattenedTasks,
    selectedColumns,
    columnWidths,
    taskTableWidth,
    bodyYOffset,
    options,
    colorModeState,
  });

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
 * Deliver the serialized SVG to the user — either copies it to the clipboard
 * or triggers a file download, depending on `options.copyToClipboard`.
 */
async function deliverSvg(
  svgString: string,
  options: SvgExportOptions,
  projectName?: string
): Promise<void> {
  if (options.copyToClipboard) {
    await copyToClipboard(svgString);
  } else {
    const filename = generateExportFilename(projectName, "svg");
    downloadSvg(svgString, filename);
  }
}

/**
 * Copy SVG string to clipboard.
 * Prefers the modern Clipboard API; falls back to the legacy execCommand
 * approach for environments where the Clipboard API is unavailable (e.g.
 * insecure contexts).
 *
 * Throws if both methods fail — the thrown error is intended to be caught by
 * the caller (`exportToSvg` → the `useExport` hook) for user-facing display.
 * No silent failures: either the text is on the clipboard or an error is thrown.
 */
async function copyToClipboard(svgString: string): Promise<void> {
  // Prefer modern Clipboard API (available in secure contexts)
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(svgString);
    return;
  }

  // Fallback: legacy execCommand (deprecated but still works in some environments).
  // The textarea is placed off-screen (left: -9999px) so it is never visible,
  // even transiently, regardless of transition or opacity timing on the host page.
  const textarea = document.createElement("textarea");
  textarea.value = svgString;
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  textarea.setAttribute("aria-hidden", "true");
  document.body.appendChild(textarea);
  try {
    textarea.select();
    // execCommand is deprecated; this branch is only reached when the
    // Clipboard API is unavailable (e.g. non-HTTPS context or older browser).
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
