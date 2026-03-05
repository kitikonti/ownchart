/**
 * PDF Export functionality using jsPDF + svg2pdf.js.
 * Generates vector PDFs by converting the SVG chart to PDF.
 *
 * This approach ensures visual consistency between SVG and PDF exports
 * since both use the same SVG rendering code.
 */

import { jsPDF } from "jspdf";
import "svg2pdf.js";
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import type { Task } from "../../types/chart.types";
import type { TaskId } from "../../types/branded.types";
import type { ExportOptions, PdfExportOptions, PdfHeaderFooter } from "./types";
import {
  getPageDimensions,
  getMargins,
  getReservedSpace,
  mmToPx,
  calculatePdfFitToWidth,
  hasHeaderFooterContent,
} from "./pdfLayout";
import { ExportRenderer } from "../../components/Export/ExportRenderer";
import { calculateExportDimensions } from "./exportLayout";
import { calculateTaskTableWidth } from "./calculations";
import { buildFlattenedTaskList, type FlattenedTask } from "../hierarchy";
import { type DateFormat } from "../../types/preferences.types";
import { formatDateByPreference } from "../dateUtils";
import { HEADER_HEIGHT, SVG_FONT_FAMILY } from "./constants";
import { registerInterFont } from "./interFont";
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
import type { ColorModeState } from "../../types/colorMode.types";

// =============================================================================
// PDF Rendering Constants
// =============================================================================

/** Font size for header/footer banner text in points */
const PDF_BANNER_FONT_SIZE_PT = 9;

/** Text color for header/footer labels — neutral-600 (#475569) */
const PDF_TEXT_COLOR_RGB: [number, number, number] = [71, 85, 105];

/** Separator line color — neutral-200 (#e2e8f0) */
const PDF_BORDER_COLOR_RGB: [number, number, number] = [226, 232, 240];

/** Separator line width in millimeters */
const PDF_SEPARATOR_LINE_WIDTH_MM = 0.1;

/** Header text vertical offset from the top margin edge in mm */
const PDF_HEADER_TEXT_OFFSET_MM = 6;

/** Footer text vertical offset from the bottom margin edge in mm */
const PDF_FOOTER_TEXT_BOTTOM_OFFSET_MM = 4;

/**
 * Wait time in ms after root.render() before reading the DOM.
 * React schedules its commit asynchronously; this gives it one macro-task
 * to flush before waitForFonts() / waitForPaint() take over.
 */
const REACT_RENDER_WAIT_MS = 100;

/** White background fill colour for the SVG canvas */
const SVG_BACKGROUND_WHITE = "#ffffff";

/** Middle-dot separator between right-side banner fields (e.g. author · date) */
const PDF_BANNER_SEPARATOR = " \u00B7 ";

// =============================================================================
// Types
// =============================================================================

/** Parameters for PDF export */
export interface ExportToPdfParams {
  tasks: Task[];
  options: ExportOptions;
  pdfOptions: PdfExportOptions;
  /** Full app column-width map (may contain keys beyond ExportColumnKey) */
  columnWidths: Record<string, number>;
  currentAppZoom: number;
  projectDateRange?: { start: Date; end: Date };
  visibleDateRange?: { start: Date; end: Date };
  projectName?: string;
  projectTitle?: string;
  projectAuthor?: string;
  dateFormat: DateFormat;
  colorModeState: ColorModeState;
  onProgress?: (progress: number) => void;
}

/** Resolved title/author strings (with fallbacks applied) */
interface PdfMetadata {
  title: string;
  author: string;
}

/** Y positions and orientation for a banner strip (header or footer) */
interface BannerLayout {
  /** Text baseline Y in mm */
  textY: number;
  /** Separator line Y in mm */
  lineY: number;
  /**
   * True for headers (separator drawn below text, on top of chart content).
   * False for footers (separator drawn above text).
   */
  lineBelowText: boolean;
}

/** Props forwarded to ExportRenderer during offscreen render */
interface RendererProps {
  tasks: Task[];
  options: ExportOptions;
  columnWidths: Record<string, number>;
  currentAppZoom: number;
  projectDateRange?: { start: Date; end: Date };
  visibleDateRange?: { start: Date; end: Date };
}

/** Shared context for SVG assembly (task-table columns + chart combination) */
interface SvgAssemblyContext {
  tasks: Task[];
  options: ExportOptions;
  columnWidths: Record<string, number>;
  colorModeState: ColorModeState;
  projectName?: string;
}

/** Shared context for banner rendering (header/footer strips) */
interface BannerRenderContext {
  doc: jsPDF;
  margins: { top: number; bottom: number; left: number; right: number };
  /** Page width in mm */
  pageWidth: number;
  /** Page height in mm */
  pageHeight: number;
  dateFormat: DateFormat;
}

/** Document-level settings for PDF generation */
interface PdfDocumentSettings {
  metadata: PdfMetadata;
  pdfOptions: PdfExportOptions;
  dateFormat: DateFormat;
  projectName?: string;
}

/** Scaled placement of the chart SVG within a PDF page */
interface ChartPlacement {
  /** X offset in mm from the page origin */
  offsetX: number;
  /** Y offset in mm from the page origin */
  offsetY: number;
  /** Final rendered width in mm */
  finalWidthMm: number;
  /** Final rendered height in mm */
  finalHeightMm: number;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Export the chart to PDF using SVG-to-PDF conversion.
 */
export async function exportToPdf({
  tasks,
  options,
  pdfOptions,
  columnWidths,
  currentAppZoom,
  projectDateRange,
  visibleDateRange,
  projectName,
  projectTitle,
  projectAuthor,
  dateFormat,
  colorModeState,
  onProgress,
}: ExportToPdfParams): Promise<void> {
  onProgress?.(5);

  const effectiveOptions = resolveEffectiveOptions(tasks, options, pdfOptions);
  const dimensions = calculateExportDimensions({
    tasks,
    options: effectiveOptions,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange,
  });

  onProgress?.(10);

  const container = createOffscreenContainer(
    dimensions.width,
    dimensions.height,
    effectiveOptions.background
  );
  const root = createRoot(container);

  try {
    await mountExportRenderer(root, container, {
      tasks,
      options: effectiveOptions,
      columnWidths,
      currentAppZoom,
      projectDateRange,
      visibleDateRange,
    });

    onProgress?.(25);

    const svgElement = extractSvgFromContainer(container, dimensions, {
      tasks,
      options: effectiveOptions,
      columnWidths,
      colorModeState,
      projectName,
    });

    onProgress?.(40);

    await buildAndSavePdf(
      svgElement,
      dimensions,
      {
        metadata: resolvePdfMetadata(projectTitle, projectName, projectAuthor),
        pdfOptions,
        dateFormat,
        projectName,
      },
      onProgress
    );

    onProgress?.(100);
  } finally {
    root.unmount();
    removeOffscreenContainer(container);
  }
}

// =============================================================================
// Step Helpers
// =============================================================================

/**
 * For "fit to page" mode, compute the optimal fitToWidth based on content
 * and page dimensions. Otherwise returns the options unchanged.
 *
 * Exported for unit testing.
 */
export function resolveEffectiveOptions(
  tasks: Task[],
  options: ExportOptions,
  pdfOptions: PdfExportOptions
): ExportOptions {
  if (options.zoomMode !== "fitToWidth") {
    return options;
  }
  return {
    ...options,
    fitToWidth: calculatePdfFitToWidth(tasks, options, pdfOptions),
  };
}

/**
 * Mount ExportRenderer in the offscreen container and wait for the browser
 * to complete layout and paint before returning.
 */
async function mountExportRenderer(
  root: ReturnType<typeof createRoot>,
  container: HTMLDivElement,
  props: RendererProps
): Promise<void> {
  await new Promise<void>((resolve) => {
    root.render(createElement(ExportRenderer, props));
    setTimeout(resolve, REACT_RENDER_WAIT_MS);
  });
  await waitForFonts();
  await waitForPaint();
  container.style.opacity = "1";
  await waitForPaint();
}

/**
 * Pull the rendered SVG elements from the offscreen container and assemble
 * a complete, self-contained SVG ready for svg2pdf conversion.
 */
function extractSvgFromContainer(
  container: HTMLDivElement,
  dimensions: { width: number; height: number },
  ctx: SvgAssemblyContext
): SVGSVGElement {
  const chartSvgEl = container.querySelector("svg.gantt-chart");
  if (!chartSvgEl) {
    throw new Error("Could not find chart SVG element");
  }
  if (!(chartSvgEl instanceof SVGSVGElement)) {
    throw new Error("Chart SVG element is not an SVGSVGElement");
  }

  const headerSvgEl = container.querySelector("svg.export-timeline-header");
  const headerSvg = headerSvgEl instanceof SVGSVGElement ? headerSvgEl : null;

  if (ctx.options.includeHeader && !headerSvg) {
    console.warn(
      "[pdfExport] Timeline header SVG not found — PDF will be rendered without it"
    );
  }

  return buildCompleteSvg(chartSvgEl, headerSvg, dimensions, ctx);
}

/**
 * Apply PDF metadata fallback logic: prefer explicit title/author values,
 * fall back to project name for title and empty string for author.
 *
 * Exported for unit testing.
 */
export function resolvePdfMetadata(
  projectTitle: string | undefined,
  projectName: string | undefined,
  projectAuthor: string | undefined
): PdfMetadata {
  return {
    title: projectTitle || projectName || "Project Timeline",
    author: projectAuthor ?? "",
  };
}

/**
 * Create the jsPDF document, embed the chart SVG, render header/footer
 * banners, and trigger the file download.
 */
async function buildAndSavePdf(
  svgElement: SVGSVGElement,
  dimensions: { width: number; height: number },
  settings: PdfDocumentSettings,
  onProgress?: (progress: number) => void
): Promise<void> {
  const { metadata, pdfOptions, dateFormat, projectName } = settings;

  const pageDims = getPageDimensions(pdfOptions);
  const margins = getMargins(pdfOptions);
  const headerReserved = getReservedSpace(pdfOptions.header);
  const footerReserved = getReservedSpace(pdfOptions.footer);
  const placement = computeChartPlacement(
    dimensions,
    pageDims,
    margins,
    headerReserved,
    footerReserved
  );

  const doc = new jsPDF({
    orientation: pdfOptions.orientation,
    unit: "mm",
    format: [pageDims.width, pageDims.height],
  });

  // Register Inter font for consistent rendering across all platforms
  registerInterFont(doc);
  doc.setFont("Inter", "normal");

  doc.setProperties({
    title: metadata.title,
    author: metadata.author,
    subject: pdfOptions.metadata.subject ?? "Gantt Chart Export",
    creator: "OwnChart",
  });

  onProgress?.(55);

  // Note: fonts are already embedded via registerInterFont() and set on SVG
  // elements via setFontFamilyOnTextElements().
  try {
    await doc.svg(svgElement, {
      x: placement.offsetX,
      y: placement.offsetY,
      width: placement.finalWidthMm,
      height: placement.finalHeightMm,
    });
  } catch (err) {
    throw new Error(`PDF rendering failed: ${String(err)}`);
  }

  onProgress?.(90);

  // Render banners after chart SVG so separator lines draw on top of content
  const bannerCtx: BannerRenderContext = {
    doc,
    margins,
    pageWidth: pageDims.width,
    pageHeight: pageDims.height,
    dateFormat,
  };
  renderBanners(
    bannerCtx,
    pdfOptions,
    metadata,
    headerReserved,
    footerReserved
  );

  const filename = generateExportFilename(projectName, "pdf");
  doc.save(filename);
}

/**
 * Calculate the scaled position and dimensions of the chart SVG within
 * the PDF page's content area, preserving aspect ratio and centering
 * horizontally.
 */
function computeChartPlacement(
  dimensions: { width: number; height: number },
  pageDims: { width: number; height: number },
  margins: { top: number; bottom: number; left: number; right: number },
  headerReserved: number,
  footerReserved: number
): ChartPlacement {
  const contentWidth = pageDims.width - margins.left - margins.right;
  const contentHeight =
    pageDims.height -
    margins.top -
    margins.bottom -
    headerReserved -
    footerReserved;

  // Scale SVG to fit the available content area while preserving aspect ratio
  const scale = Math.min(
    mmToPx(contentWidth) / dimensions.width,
    mmToPx(contentHeight) / dimensions.height
  );
  const finalWidthMm = (dimensions.width * scale) / mmToPx(1);
  const finalHeightMm = (dimensions.height * scale) / mmToPx(1);

  // Centre horizontally within the content area; pin vertically to header
  const offsetX = margins.left + (contentWidth - finalWidthMm) / 2;
  const offsetY = margins.top + headerReserved;

  return { offsetX, offsetY, finalWidthMm, finalHeightMm };
}

// =============================================================================
// Banner Rendering
// =============================================================================

/**
 * Render header and/or footer banners on the PDF document if any fields
 * are enabled in the respective PdfHeaderFooter config.
 */
function renderBanners(
  ctx: BannerRenderContext,
  pdfOptions: PdfExportOptions,
  metadata: PdfMetadata,
  headerReserved: number,
  footerReserved: number
): void {
  if (hasHeaderFooterContent(pdfOptions.header)) {
    renderPdfBanner(ctx, pdfOptions.header, metadata, {
      textY: ctx.margins.top + PDF_HEADER_TEXT_OFFSET_MM,
      lineY: ctx.margins.top + headerReserved,
      lineBelowText: true,
    });
  }

  if (hasHeaderFooterContent(pdfOptions.footer)) {
    renderPdfBanner(ctx, pdfOptions.footer, metadata, {
      textY:
        ctx.pageHeight - ctx.margins.bottom - PDF_FOOTER_TEXT_BOTTOM_OFFSET_MM,
      lineY: ctx.pageHeight - ctx.margins.bottom - footerReserved,
      lineBelowText: false,
    });
  }
}

/**
 * Render a single banner strip: left-aligned title, right-aligned author/date,
 * and a separator line (below text for headers, above text for footers).
 */
function renderPdfBanner(
  ctx: BannerRenderContext,
  sectionOptions: PdfHeaderFooter,
  metadata: PdfMetadata,
  layout: BannerLayout
): void {
  const { doc, margins, pageWidth, dateFormat } = ctx;

  doc.setFontSize(PDF_BANNER_FONT_SIZE_PT);
  doc.setTextColor(...PDF_TEXT_COLOR_RGB);
  doc.setDrawColor(...PDF_BORDER_COLOR_RGB);
  doc.setLineWidth(PDF_SEPARATOR_LINE_WIDTH_MM);

  // Footer: separator above text so text renders on top
  if (!layout.lineBelowText) {
    doc.line(
      margins.left,
      layout.lineY,
      pageWidth - margins.right,
      layout.lineY
    );
  }

  if (sectionOptions.showProjectName && metadata.title) {
    doc.text(metadata.title, margins.left, layout.textY);
  }

  const rightParts: string[] = [];
  if (sectionOptions.showAuthor && metadata.author) {
    rightParts.push(metadata.author);
  }
  if (sectionOptions.showExportDate) {
    rightParts.push(formatDateByPreference(new Date(), dateFormat));
  }
  if (rightParts.length > 0) {
    const rightText = rightParts.join(PDF_BANNER_SEPARATOR);
    const rightWidth = doc.getTextWidth(rightText);
    doc.text(rightText, pageWidth - margins.right - rightWidth, layout.textY);
  }

  // Header: separator below text so it draws on top of the chart SVG
  if (layout.lineBelowText) {
    doc.line(
      margins.left,
      layout.lineY,
      pageWidth - margins.right,
      layout.lineY
    );
  }
}

// =============================================================================
// SVG Construction
// =============================================================================

/**
 * Build a complete SVG combining the task table (rendered as native SVG
 * elements) and the Gantt chart SVG extracted from the offscreen container.
 */
function buildCompleteSvg(
  chartSvg: SVGSVGElement,
  headerSvg: SVGSVGElement | null,
  dimensions: { width: number; height: number },
  ctx: SvgAssemblyContext
): SVGSVGElement {
  const { options, columnWidths } = ctx;
  const hasTaskList = options.selectedColumns.length > 0;
  const taskTableWidth = hasTaskList
    ? calculateTaskTableWidth(
        options.selectedColumns,
        columnWidths,
        options.density
      )
    : 0;
  const flattenedTasks = buildFlattenedTaskList(ctx.tasks, new Set<TaskId>());
  const svg = createSvgRoot(dimensions, options.background, ctx.projectName);
  let currentY = 0;

  if (options.includeHeader) {
    appendExportHeader(svg, headerSvg, ctx, taskTableWidth);
    currentY = HEADER_HEIGHT;
  }

  appendChartContent(
    svg,
    chartSvg,
    ctx,
    taskTableWidth,
    currentY,
    flattenedTasks
  );

  return svg;
}

/**
 * Append the task-table header columns and the timeline header SVG to the
 * root SVG. No-ops gracefully when either section is absent.
 */
function appendExportHeader(
  svg: SVGSVGElement,
  headerSvg: SVGSVGElement | null,
  ctx: SvgAssemblyContext,
  taskTableWidth: number
): void {
  const { options, columnWidths } = ctx;

  if (taskTableWidth > 0) {
    const headerGroup = renderTaskTableHeader(
      svg,
      options.selectedColumns,
      columnWidths,
      taskTableWidth,
      0,
      0,
      options.density
    );
    setFontFamilyOnTextElements(headerGroup);
  }

  if (headerSvg) {
    const headerGroup = createTranslatedGroup(taskTableWidth, 0);
    Array.from(headerSvg.childNodes).forEach((child) => {
      headerGroup.appendChild(child.cloneNode(true));
    });
    setFontFamilyOnTextElements(headerGroup);
    svg.appendChild(headerGroup);
  }
}

/**
 * Append the task-table row content and the main Gantt chart SVG to the
 * root SVG at the given Y offset.
 */
function appendChartContent(
  svg: SVGSVGElement,
  chartSvg: SVGSVGElement,
  ctx: SvgAssemblyContext,
  taskTableWidth: number,
  currentY: number,
  flattenedTasks: FlattenedTask[]
): void {
  const { options, columnWidths, colorModeState } = ctx;

  if (taskTableWidth > 0) {
    const rowsGroup = renderTaskTableRows(
      svg,
      flattenedTasks,
      options.selectedColumns,
      columnWidths,
      taskTableWidth,
      0,
      currentY,
      options.density,
      colorModeState
    );
    setFontFamilyOnTextElements(rowsGroup);
  }

  const chartGroup = createTranslatedGroup(taskTableWidth, currentY);
  Array.from(chartSvg.childNodes).forEach((child) => {
    chartGroup.appendChild(child.cloneNode(true));
  });
  setFontFamilyOnTextElements(chartGroup);
  svg.appendChild(chartGroup);
}

/**
 * Create the root SVG element with correct dimensions, an accessibility
 * title, optional white background, and a font-family CSS declaration
 * for svg2pdf.js compatibility.
 */
function createSvgRoot(
  dimensions: { width: number; height: number },
  background: ExportOptions["background"],
  projectName?: string
): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", String(dimensions.width));
  svg.setAttribute("height", String(dimensions.height));
  svg.setAttribute("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

  const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
  title.textContent = projectName
    ? `Gantt chart: ${projectName}`
    : "Gantt Chart";
  svg.appendChild(title);

  if (background === "white") {
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", SVG_BACKGROUND_WHITE);
    svg.appendChild(bg);
  }

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = `\n    text { font-family: ${SVG_FONT_FAMILY}; }\n  `;
  defs.appendChild(style);
  svg.appendChild(defs);

  return svg;
}

/** Create an SVG <g> element translated to the given (x, y) offset. */
function createTranslatedGroup(x: number, y: number): SVGGElement {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", `translate(${x}, ${y})`);
  return g;
}
