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
import type { Root } from "react-dom/client";
import { createElement } from "react";
import type { Task } from "@/types/chart.types";
import type { TaskId } from "@/types/branded.types";
import type {
  ExportOptions,
  PdfExportOptions,
  PdfHeaderFooter,
  PdfMargins,
  PixelDimensions,
} from "./types";
import {
  getPageDimensions,
  getMargins,
  getReservedSpace,
  pxToMm,
  hexToRgb,
  calculatePdfFitToWidth,
  hasHeaderFooterContent,
  PDF_BANNER_FONT_SIZE_PT,
  PDF_BANNER_CAP_HEIGHT_RATIO,
  PDF_BANNER_LINE_GAP_MM,
  type PageDimensions,
  type PdfColor,
} from "./pdfLayout";
import { ExportRenderer } from "@/components/Export/ExportRenderer";
import { calculateExportDimensions } from "./exportLayout";
import { calculateTaskTableWidth } from "./calculations";
import { buildFlattenedTaskList } from "@/utils/hierarchy";
import { type DateFormat } from "@/types/preferences.types";
import { formatDateByPreference } from "@/utils/dateUtils";
import {
  HEADER_HEIGHT,
  SVG_FONT_FAMILY,
  EXPORT_COLORS,
  EXPORT_CHART_SVG_CLASS,
  EXPORT_TIMELINE_HEADER_SVG_CLASS,
  SVG_NS,
  REACT_RENDER_WAIT_MS,
  SVG_BACKGROUND_WHITE,
} from "./constants";
import { APP_CONFIG } from "@/config/appConfig";
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
  type TaskTableHeaderOptions,
  type TaskTableRowsOptions,
} from "./taskTableRenderer";
import type { ColorModeState } from "@/types/colorMode.types";
import type { ProjectLogo } from "@/types/logo.types";
import { logoToDataUrl, MAX_LOGO_DISPLAY_HEIGHT_PT } from "@/utils/logoUpload";

// =============================================================================
// PDF Rendering Constants
// =============================================================================

/**
 * Text color for header/footer labels.
 * Derived from the design-token EXPORT_COLORS.textSecondary (slate-600)
 * so it stays in sync when the design system changes.
 */
const PDF_TEXT_COLOR: PdfColor = hexToRgb(EXPORT_COLORS.textSecondary);

/**
 * Separator line color.
 * Derived from EXPORT_COLORS.separator (slate-300) — stronger than the SVG
 * border token (slate-200) for reliable visibility in print.
 */
const PDF_BORDER_COLOR: PdfColor = hexToRgb(EXPORT_COLORS.separator);

/** Separator line width in millimeters */
const PDF_SEPARATOR_LINE_WIDTH_MM = 0.1;

/** Middle-dot separator between right-side banner fields (e.g. author · date) */
const PDF_BANNER_SEPARATOR = " \u00B7 ";

/** Gap (mm) between the logo and the project name text */
const PDF_LOGO_TEXT_GAP_MM = 2;

/** Maximum logo width (mm) — prevents wide logos from overlapping right-aligned text */
const MAX_LOGO_DISPLAY_WIDTH_MM = 30;

/** Default PDF document title when neither projectTitle nor projectName is set */
const DEFAULT_PDF_TITLE = "Project Timeline";

/** Default PDF document subject metadata */
const PDF_DEFAULT_SUBJECT = "Gantt Chart Export";

/** jsPDF registered font name for the embedded Inter typeface */
const PDF_FONT_NAME = "Inter";

/** jsPDF font style for Inter Regular */
const PDF_FONT_STYLE = "normal" as const;

/** Progress checkpoint values emitted via onProgress during export */
const EXPORT_PROGRESS = {
  START: 5,
  DIMENSIONS_READY: 10,
  RENDER_COMPLETE: 25,
  SVG_ASSEMBLED: 40,
  PDF_DOCUMENT_READY: 55,
  SVG_EMBEDDED: 90,
  COMPLETE: 100,
} as const;

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
  projectLogo?: ProjectLogo;
  dateFormat: DateFormat;
  colorModeState: ColorModeState;
  workingDaysMode?: boolean;
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
  workingDaysMode?: boolean;
}

/** Shared context for SVG assembly (task-table columns + chart combination) */
interface SvgAssemblyContext {
  tasks: Task[];
  options: ExportOptions;
  columnWidths: Record<string, number>;
  colorModeState: ColorModeState;
  projectName?: string;
  workingDaysMode?: boolean;
}

/** Layout values computed once in buildCompleteSvg and passed to SVG sub-assemblers */
interface SvgChartLayout {
  /** Width of the task-table panel in px (0 when no columns are selected) */
  taskTableWidth: number;
  /** Y offset for chart content — equals HEADER_HEIGHT when a header is included */
  contentY: number;
}

/** Reserved vertical space in mm for PDF header/footer strips */
export interface ReservedSpace {
  header: number;
  footer: number;
}

/** Shared context for banner rendering (header/footer strips) */
interface BannerRenderContext {
  doc: jsPDF;
  margins: PdfMargins;
  /** Page width in mm */
  pageWidth: number;
  /** Page height in mm */
  pageHeight: number;
  dateFormat: DateFormat;
  projectLogo?: ProjectLogo;
}

/** Document-level settings for PDF generation */
interface PdfDocumentSettings {
  metadata: PdfMetadata;
  pdfOptions: PdfExportOptions;
  dateFormat: DateFormat;
  projectName?: string;
  projectLogo?: ProjectLogo;
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
export async function exportToPdf(params: ExportToPdfParams): Promise<void> {
  const {
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
    projectLogo,
    dateFormat,
    colorModeState,
    workingDaysMode,
    onProgress,
  } = params;

  onProgress?.(EXPORT_PROGRESS.START);

  const effectiveOptions = resolveEffectiveOptions(tasks, options, pdfOptions);
  const dimensions = calculateExportDimensions({
    tasks,
    options: effectiveOptions,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange,
  });

  onProgress?.(EXPORT_PROGRESS.DIMENSIONS_READY);

  const rendererProps: RendererProps = {
    options: effectiveOptions,
    tasks,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange,
    workingDaysMode,
  };
  const assemblyCtx: SvgAssemblyContext = {
    options: effectiveOptions,
    tasks,
    columnWidths,
    colorModeState,
    projectName,
    workingDaysMode,
  };
  const svgElement = await renderToSvg(
    dimensions,
    rendererProps,
    assemblyCtx,
    onProgress
  );

  onProgress?.(EXPORT_PROGRESS.SVG_ASSEMBLED);

  await buildAndSavePdf(
    svgElement,
    dimensions,
    {
      metadata: resolvePdfMetadata(projectTitle, projectName, projectAuthor),
      pdfOptions,
      dateFormat,
      projectName,
      projectLogo,
    },
    onProgress
  );

  onProgress?.(EXPORT_PROGRESS.COMPLETE);
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
    title: projectTitle || projectName || DEFAULT_PDF_TITLE,
    author: projectAuthor ?? "",
  };
}

/**
 * Render ExportRenderer in an offscreen container, extract the assembled
 * SVG, then clean up the container — all in a single try/finally lifecycle.
 * Emits RENDER_COMPLETE progress once the React render is flushed.
 */
async function renderToSvg(
  dimensions: PixelDimensions,
  rendererProps: RendererProps,
  assemblyCtx: SvgAssemblyContext,
  onProgress?: (progress: number) => void
): Promise<SVGSVGElement> {
  const container = createOffscreenContainer(
    dimensions.width,
    dimensions.height,
    rendererProps.options.background
  );
  // `root` is declared outside the try block so the finally clause can call
  // root?.unmount() even if createRoot() throws before assignment.
  let root: Root | null = null;
  try {
    root = createRoot(container);
    await mountExportRenderer(root, container, rendererProps);
    onProgress?.(EXPORT_PROGRESS.RENDER_COMPLETE);
    return extractSvgFromContainer(container, dimensions, assemblyCtx);
  } finally {
    root?.unmount();
    removeOffscreenContainer(container);
  }
}

/**
 * Mount ExportRenderer in the offscreen container and wait for the browser
 * to complete layout and paint before returning.
 */
async function mountExportRenderer(
  root: Root,
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
  dimensions: PixelDimensions,
  ctx: SvgAssemblyContext
): SVGSVGElement {
  const chartSvgEl = container.querySelector(`svg.${EXPORT_CHART_SVG_CLASS}`);
  if (!(chartSvgEl instanceof SVGSVGElement)) {
    // querySelector returns null when not found; instanceof handles both cases
    throw new Error(
      `Chart SVG element (.${EXPORT_CHART_SVG_CLASS}) not found in export container`
    );
  }

  const headerSvgEl = container.querySelector(
    `svg.${EXPORT_TIMELINE_HEADER_SVG_CLASS}`
  );
  const headerSvg = headerSvgEl instanceof SVGSVGElement ? headerSvgEl : null;
  // When includeHeader is true but the header SVG is absent, appendExportHeader
  // no-ops gracefully — the export continues without the timeline header.

  return buildCompleteSvg(chartSvgEl, headerSvg, dimensions, ctx);
}

// =============================================================================
// PDF Document Helpers
// =============================================================================

/**
 * Create the jsPDF document, embed the chart SVG, render header/footer
 * banners, and trigger the file download.
 */
async function buildAndSavePdf(
  svgElement: SVGSVGElement,
  dimensions: PixelDimensions,
  settings: PdfDocumentSettings,
  onProgress?: (progress: number) => void
): Promise<void> {
  const { pdfOptions, dateFormat, projectName, projectLogo, metadata } =
    settings;
  const pageDims = getPageDimensions(pdfOptions);
  const margins = getMargins(pdfOptions);
  const reserved: ReservedSpace = {
    header: getReservedSpace(pdfOptions.header),
    footer: getReservedSpace(pdfOptions.footer),
  };
  const placement = computeChartPlacement(
    dimensions,
    pageDims,
    margins,
    reserved
  );
  const doc = createPdfDocument(pageDims, settings);

  onProgress?.(EXPORT_PROGRESS.PDF_DOCUMENT_READY);

  await embedSvgInDocument(doc, svgElement, placement);

  onProgress?.(EXPORT_PROGRESS.SVG_EMBEDDED);

  await renderBanners(
    {
      doc,
      margins,
      pageWidth: pageDims.width,
      pageHeight: pageDims.height,
      dateFormat,
      projectLogo,
    },
    pdfOptions,
    metadata,
    reserved
  );

  doc.save(generateExportFilename(projectName, "pdf"));
}

/**
 * Instantiate the jsPDF document, register the Inter font, and set document
 * properties. Kept separate from SVG embedding so that creation errors are
 * distinct from render errors.
 */
function createPdfDocument(
  pageDims: PageDimensions,
  settings: PdfDocumentSettings
): jsPDF {
  const { metadata, pdfOptions } = settings;
  const doc = new jsPDF({
    orientation: pdfOptions.orientation,
    unit: "mm",
    format: [pageDims.width, pageDims.height],
    putOnlyUsedFonts: true,
  });

  // Register Inter font for consistent rendering across all platforms
  registerInterFont(doc);
  doc.setFont(PDF_FONT_NAME, PDF_FONT_STYLE);

  doc.setProperties({
    title: metadata.title,
    author: metadata.author,
    subject: pdfOptions.metadata.subject ?? PDF_DEFAULT_SUBJECT,
    creator: APP_CONFIG.name,
  });

  return doc;
}

/**
 * Embed the assembled SVG into the PDF document at the computed placement.
 * Wraps svg2pdf errors with a descriptive message.
 */
async function embedSvgInDocument(
  doc: jsPDF,
  svgElement: SVGSVGElement,
  placement: ChartPlacement
): Promise<void> {
  try {
    await doc.svg(svgElement, {
      x: placement.offsetX,
      y: placement.offsetY,
      width: placement.finalWidthMm,
      height: placement.finalHeightMm,
    });
  } catch (err) {
    throw new Error(`PDF rendering failed: ${String(err)}`, { cause: err });
  }
}

/**
 * Calculate the scaled position and dimensions of the chart SVG within
 * the PDF page's content area, preserving aspect ratio and centering
 * horizontally.
 *
 * Exported for unit testing.
 */
export function computeChartPlacement(
  dimensions: PixelDimensions,
  pageDims: PageDimensions,
  margins: PdfMargins,
  reserved: ReservedSpace
): ChartPlacement {
  const contentWidth = pageDims.width - margins.left - margins.right;
  const contentHeight =
    pageDims.height -
    margins.top -
    margins.bottom -
    reserved.header -
    reserved.footer;

  // Convert SVG px dimensions to mm so both sides of the ratio are in the
  // same unit, making the resulting scale factor dimensionless.
  const svgWidthMm = pxToMm(dimensions.width);
  const svgHeightMm = pxToMm(dimensions.height);
  const scale = Math.min(
    contentWidth / svgWidthMm,
    contentHeight / svgHeightMm
  );
  const finalWidthMm = svgWidthMm * scale;
  const finalHeightMm = svgHeightMm * scale;

  // Centre horizontally within the content area; pin vertically to header
  const offsetX = margins.left + (contentWidth - finalWidthMm) / 2;
  const offsetY = margins.top + reserved.header;

  return { offsetX, offsetY, finalWidthMm, finalHeightMm };
}

// =============================================================================
// Banner Rendering
// =============================================================================

/**
 * Render header and/or footer banners on the PDF document if any fields
 * are enabled in the respective PdfHeaderFooter config.
 */
async function renderBanners(
  ctx: BannerRenderContext,
  pdfOptions: PdfExportOptions,
  metadata: PdfMetadata,
  reserved: ReservedSpace
): Promise<void> {
  if (hasHeaderFooterContent(pdfOptions.header)) {
    const headerLineY = ctx.margins.top + reserved.header;
    await renderPdfBanner(ctx, pdfOptions.header, metadata, {
      textY: headerLineY - PDF_BANNER_LINE_GAP_MM,
      lineY: headerLineY,
      lineBelowText: true,
    });
  }

  if (hasHeaderFooterContent(pdfOptions.footer)) {
    const footerLineY = ctx.pageHeight - ctx.margins.bottom - reserved.footer;
    // Position text so its visual bottom sits GAP mm below the line.
    // jsPDF text() uses the baseline, so we add the cap height.
    const capHeightMm =
      ((PDF_BANNER_FONT_SIZE_PT * PDF_BANNER_CAP_HEIGHT_RATIO) / 72) * 25.4;
    await renderPdfBanner(ctx, pdfOptions.footer, metadata, {
      textY: footerLineY + PDF_BANNER_LINE_GAP_MM + capHeightMm,
      lineY: footerLineY,
      lineBelowText: false,
    });
  }
}

/**
 * Render a single banner strip: optional logo on the left, left-aligned title
 * (shifted right when logo is present), right-aligned author/date, and a
 * separator line (below text for headers, above text for footers).
 */
async function renderPdfBanner(
  ctx: BannerRenderContext,
  sectionOptions: PdfHeaderFooter,
  metadata: PdfMetadata,
  layout: BannerLayout
): Promise<void> {
  const { doc, margins, pageWidth, dateFormat, projectLogo } = ctx;

  doc.setFontSize(PDF_BANNER_FONT_SIZE_PT);
  doc.setTextColor(PDF_TEXT_COLOR.r, PDF_TEXT_COLOR.g, PDF_TEXT_COLOR.b);
  doc.setDrawColor(PDF_BORDER_COLOR.r, PDF_BORDER_COLOR.g, PDF_BORDER_COLOR.b);
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

  // Track left offset — logo shifts title text to the right
  let leftX = margins.left;

  // Render logo if enabled and available
  if (sectionOptions.showLogo && projectLogo) {
    const logoOffsetX = await renderBannerLogo(
      doc,
      projectLogo,
      margins.left,
      layout
    );
    leftX += logoOffsetX;
  }

  if (sectionOptions.showProjectName && metadata.title) {
    doc.text(metadata.title, leftX, layout.textY);
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

/**
 * Render a logo image in the banner strip.
 * SVG logos are rasterized to PNG via an offscreen canvas because jsPDF's
 * addImage does not accept SVG data URLs.
 *
 * Sizing: the logo is fit into a bounding box of MAX_LOGO_DISPLAY_WIDTH_MM ×
 * MAX_LOGO_DISPLAY_HEIGHT_PT (in mm) while preserving aspect ratio.
 *
 * Positioning: baseline-aligned to the separator line — logo bottom edge sits
 * PDF_BANNER_LINE_GAP_MM above (header) or below (footer) the separator.
 *
 * @returns The horizontal space consumed (logo width + gap) in mm.
 */
async function renderBannerLogo(
  doc: jsPDF,
  logo: ProjectLogo,
  marginLeft: number,
  layout: BannerLayout
): Promise<number> {
  // Fit logo into bounding box preserving aspect ratio
  const maxHeightMm = (MAX_LOGO_DISPLAY_HEIGHT_PT / 72) * 25.4;
  const aspectRatio = logo.width / logo.height;
  const logoHeightMm = Math.min(
    maxHeightMm,
    MAX_LOGO_DISPLAY_WIDTH_MM / aspectRatio
  );
  const logoWidthMm = logoHeightMm * aspectRatio;

  // Position logo relative to separator line with consistent gap.
  // Header: logo bottom = lineY - gap (grows upward)
  // Footer: logo top = lineY + gap (grows downward)
  const logoY = layout.lineBelowText
    ? layout.lineY - PDF_BANNER_LINE_GAP_MM - logoHeightMm
    : layout.lineY + PDF_BANNER_LINE_GAP_MM;

  try {
    let imageData: string;
    let format: "PNG" | "JPEG";

    if (logo.mimeType === "image/svg+xml") {
      // jsPDF cannot decode SVG data URLs — rasterize to PNG first
      imageData = await rasterizeSvgToPngDataUrl(logo);
      format = "PNG";
    } else {
      imageData = logoToDataUrl(logo);
      format = logo.mimeType === "image/png" ? "PNG" : "JPEG";
    }

    doc.addImage(
      imageData,
      format,
      marginLeft,
      logoY,
      logoWidthMm,
      logoHeightMm
    );
  } catch {
    // If logo embedding fails, skip silently — the export should still succeed
    if (import.meta.env.DEV) {
      console.warn("[pdfExport] Failed to embed logo in PDF banner");
    }
    return 0;
  }

  return logoWidthMm + PDF_LOGO_TEXT_GAP_MM;
}

/**
 * Rasterize an SVG logo to a PNG data URL via an offscreen canvas.
 * Renders at 2× the intrinsic size for crisp output on HiDPI screens.
 */
function rasterizeSvgToPngDataUrl(logo: ProjectLogo): Promise<string> {
  return new Promise((resolve, reject) => {
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = logo.width * scale;
    canvas.height = logo.height * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas 2D context unavailable"));
      return;
    }

    const img = new Image();
    img.onload = (): void => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (): void => {
      reject(new Error("Failed to rasterize SVG logo"));
    };
    img.src = logoToDataUrl(logo);
  });
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
  dimensions: PixelDimensions,
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
  const svg = createSvgRoot(dimensions, options.background, ctx.projectName);
  const contentY = options.includeHeader ? HEADER_HEIGHT : 0;

  if (options.includeHeader) {
    appendExportHeader(svg, headerSvg, ctx, taskTableWidth);
  }

  appendChartContent(svg, chartSvg, ctx, { taskTableWidth, contentY });

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
  const { options, columnWidths, workingDaysMode } = ctx;

  if (taskTableWidth > 0) {
    const headerOpts: TaskTableHeaderOptions = {
      selectedColumns: options.selectedColumns,
      columnWidths,
      totalWidth: taskTableWidth,
      x: 0,
      y: 0,
      density: options.density,
      workingDaysMode,
    };
    const headerGroup = renderTaskTableHeader(svg, headerOpts);
    setFontFamilyOnTextElements(headerGroup);
  }

  if (headerSvg) {
    appendTranslatedSvgContent(svg, headerSvg, taskTableWidth, 0);
  }
}

/**
 * Append the task-table row content and the main Gantt chart SVG to the
 * root SVG at the layout's content Y offset.
 */
function appendChartContent(
  svg: SVGSVGElement,
  chartSvg: SVGSVGElement,
  ctx: SvgAssemblyContext,
  layout: SvgChartLayout
): void {
  const { options, columnWidths, colorModeState } = ctx;
  const { taskTableWidth, contentY } = layout;

  if (taskTableWidth > 0) {
    // hiddenTaskIds is empty: ctx.tasks is already pre-filtered by prepareExportTasks,
    // so no rows need to be hidden at this stage.
    const flattenedTasks = buildFlattenedTaskList(ctx.tasks, new Set<TaskId>());
    const rowsOpts: TaskTableRowsOptions = {
      flattenedTasks,
      selectedColumns: options.selectedColumns,
      columnWidths,
      totalWidth: taskTableWidth,
      x: 0,
      startY: contentY,
      density: options.density,
      colorModeState,
    };
    const rowsGroup = renderTaskTableRows(svg, rowsOpts);
    setFontFamilyOnTextElements(rowsGroup);
  }

  appendTranslatedSvgContent(svg, chartSvg, taskTableWidth, contentY);
}

/**
 * Create the root SVG element with correct dimensions, an accessibility
 * title, optional white background, and a font-family CSS declaration
 * for svg2pdf.js compatibility.
 */
function createSvgRoot(
  dimensions: PixelDimensions,
  background: ExportOptions["background"],
  projectName?: string
): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("xmlns", SVG_NS);
  svg.setAttribute("width", String(dimensions.width));
  svg.setAttribute("height", String(dimensions.height));
  svg.setAttribute("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

  const title = document.createElementNS(SVG_NS, "title");
  title.textContent = projectName
    ? `Gantt chart: ${projectName}`
    : "Gantt Chart";
  svg.appendChild(title);

  if (background === "white") {
    const bg = document.createElementNS(SVG_NS, "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", SVG_BACKGROUND_WHITE);
    svg.appendChild(bg);
  }

  const defs = document.createElementNS(SVG_NS, "defs");
  const style = document.createElementNS(SVG_NS, "style");
  style.textContent = `text { font-family: ${SVG_FONT_FAMILY}; }`;
  defs.appendChild(style);
  svg.appendChild(defs);

  return svg;
}

/** Create an SVG <g> element translated to the given (x, y) offset. */
function createTranslatedGroup(x: number, y: number): SVGGElement {
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("transform", `translate(${x}, ${y})`);
  return g;
}

/** Deep-clone all child nodes of `source` and append them to `target`. */
function cloneChildrenInto(source: Node, target: Node): void {
  source.childNodes.forEach((child) =>
    target.appendChild(child.cloneNode(true))
  );
}

/**
 * Translate `source` SVG's children into a new <g> at (x, y), apply the
 * Inter font-family declaration to all text elements, and append the group
 * to `parent`. This is the canonical way to embed a rendered SVG fragment
 * into the assembled export SVG.
 */
function appendTranslatedSvgContent(
  parent: SVGSVGElement,
  source: SVGSVGElement,
  x: number,
  y: number
): void {
  const g = createTranslatedGroup(x, y);
  cloneChildrenInto(source, g);
  setFontFamilyOnTextElements(g);
  parent.appendChild(g);
}
