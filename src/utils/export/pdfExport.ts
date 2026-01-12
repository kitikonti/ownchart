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
import type { Dependency } from "../../types/dependency.types";
import type { TimelineScale } from "../timelineUtils";
import type { ExportOptions, PdfExportOptions, ExportColumnKey } from "./types";
import { getPageDimensions, getMargins, mmToPx } from "./pdfLayout";
import { PNG_EXPORT_DPI, MM_PER_INCH } from "./dpi";
import {
  ExportRenderer,
  calculateExportDimensions,
} from "../../components/Export/ExportRenderer";
import { calculateTaskTableWidth } from "./calculations";
import { buildFlattenedTaskList } from "../hierarchy";
import { DENSITY_CONFIG, type DateFormat } from "../../types/preferences.types";
import { formatDateByPreference } from "../dateUtils";
import { SVG_FONT_FAMILY } from "./constants";
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

/** Parameters for PDF export */
export interface ExportToPdfParams {
  tasks: Task[];
  dependencies?: Dependency[];
  scale?: TimelineScale | null;
  options: ExportOptions;
  pdfOptions: PdfExportOptions;
  columnWidths: Record<string, number>;
  currentAppZoom: number;
  projectDateRange?: { start: Date; end: Date };
  visibleDateRange?: { start: Date; end: Date };
  projectName?: string;
  projectTitle?: string;
  projectAuthor?: string;
  dateFormat: DateFormat;
  onProgress?: (progress: number) => void;
}

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
    dateFormat,
    onProgress,
  } = params;

  onProgress?.(5);

  // For "fit to page" mode, calculate optimal fitToWidth based on content and page
  let effectiveOptions = options;
  if (options.zoomMode === "fitToWidth") {
    const pageDims = getPageDimensions(pdfOptions);
    const margins = getMargins(pdfOptions);

    // Calculate available space for content (accounting for margins and header/footer)
    const headerReserved =
      pdfOptions.header.showProjectName || pdfOptions.header.showExportDate
        ? 10
        : 0;
    const footerReserved =
      pdfOptions.footer.showProjectName || pdfOptions.footer.showExportDate
        ? 10
        : 0;
    const availableWidthMm = pageDims.width - margins.left - margins.right;
    const availableHeightMm =
      pageDims.height -
      margins.top -
      margins.bottom -
      headerReserved -
      footerReserved;

    // Convert to pixels at PNG_EXPORT_DPI for consistency with PNG presets
    const availableWidthPx = (availableWidthMm / MM_PER_INCH) * PNG_EXPORT_DPI;
    const availableHeightPx =
      (availableHeightMm / MM_PER_INCH) * PNG_EXPORT_DPI;

    // Calculate content height based on task count
    const densityConfig = DENSITY_CONFIG[options.density];
    const contentHeaderHeight = options.includeHeader ? HEADER_HEIGHT : 0;
    const flattenedTasks = buildFlattenedTaskList(tasks, new Set<string>());
    const contentHeightPx =
      flattenedTasks.length * densityConfig.rowHeight + contentHeaderHeight;

    // Base width matches PNG preset (full page at 150 DPI)
    const baseWidthPx = (pageDims.width / MM_PER_INCH) * PNG_EXPORT_DPI;

    // If content is taller than available space, it will be scaled down.
    // To fill the page after scaling, we need a wider content.
    // Formula: optimalWidth = contentHeight * (availableWidth / availableHeight)
    let optimalFitToWidth = baseWidthPx;
    if (contentHeightPx > availableHeightPx) {
      const pageAspectRatio = availableWidthPx / availableHeightPx;
      optimalFitToWidth = Math.max(
        baseWidthPx,
        Math.round(contentHeightPx * pageAspectRatio)
      );
    }

    effectiveOptions = {
      ...options,
      fitToWidth: optimalFitToWidth,
    };
  }

  // Calculate dimensions - uses same calculation as PNG export
  const dimensions = calculateExportDimensions(
    tasks,
    effectiveOptions,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange
  );

  onProgress?.(10);

  // Create offscreen container for rendering
  const container = createOffscreenContainer(
    dimensions.width,
    dimensions.height,
    effectiveOptions.background
  );

  try {
    // Render ExportRenderer
    const root = createRoot(container);

    await new Promise<void>((resolve) => {
      root.render(
        createElement(ExportRenderer, {
          tasks,
          options: effectiveOptions,
          columnWidths,
          currentAppZoom,
          projectDateRange,
          visibleDateRange,
        })
      );
      setTimeout(resolve, 100);
    });

    onProgress?.(25);

    await waitForFonts();
    await waitForPaint();

    container.style.opacity = "1";
    await waitForPaint();

    onProgress?.(40);

    // Extract SVG elements from the rendered DOM
    const chartSvg = container.querySelector("svg.gantt-chart");
    const headerSvg = container.querySelector(
      ".export-container > div:first-child svg"
    );

    if (!chartSvg) {
      throw new Error("Could not find chart SVG element");
    }

    // Build complete SVG with task table
    const svgElement = buildCompleteSvg(
      chartSvg as SVGSVGElement,
      headerSvg as SVGSVGElement | null,
      tasks,
      effectiveOptions,
      columnWidths,
      dimensions,
      projectName
    );

    onProgress?.(55);

    // Cleanup React
    root.unmount();

    // Get page dimensions
    const pageDims = getPageDimensions(pdfOptions);
    const margins = getMargins(pdfOptions);

    // Calculate reserved space for header/footer
    const headerReserved =
      pdfOptions.header.showProjectName || pdfOptions.header.showExportDate
        ? 10
        : 0;
    const footerReserved =
      pdfOptions.footer.showProjectName || pdfOptions.footer.showExportDate
        ? 10
        : 0;

    // Calculate available content area in mm
    const contentWidth = pageDims.width - margins.left - margins.right;
    const contentHeight =
      pageDims.height -
      margins.top -
      margins.bottom -
      headerReserved -
      footerReserved;

    // Calculate scale to fit SVG into content area
    const svgWidth = dimensions.width;
    const svgHeight = dimensions.height;

    const scaleX = mmToPx(contentWidth) / svgWidth;
    const scaleY = mmToPx(contentHeight) / svgHeight;
    const scale = Math.min(scaleX, scaleY);

    // Final dimensions in mm
    const finalWidthMm = (svgWidth * scale) / mmToPx(1);
    const finalHeightMm = (svgHeight * scale) / mmToPx(1);

    // Center horizontally
    const offsetX = margins.left + (contentWidth - finalWidthMm) / 2;
    const offsetY = margins.top + headerReserved;

    onProgress?.(65);

    // Create PDF document
    const doc = new jsPDF({
      orientation: pdfOptions.orientation,
      unit: "mm",
      format: [pageDims.width, pageDims.height],
    });

    // Use Helvetica (built into jsPDF) as fallback for PDF text
    // SVG elements use system font stack via SVG_FONT_FAMILY
    doc.setFont("helvetica", "normal");

    // Set metadata - use projectTitle/projectAuthor from chart settings, fallback to projectName
    const pdfTitle = projectTitle || projectName || "Project Timeline";
    const pdfAuthor = projectAuthor || "";
    doc.setProperties({
      title: pdfTitle,
      author: pdfAuthor,
      subject: pdfOptions.metadata.subject || "Gantt Chart Export",
      creator: "OwnChart",
    });

    onProgress?.(70);

    // Render header if configured
    const hasHeader =
      pdfOptions.header.showProjectName ||
      pdfOptions.header.showAuthor ||
      pdfOptions.header.showExportDate;
    if (hasHeader) {
      renderHeader(
        doc,
        pdfOptions,
        pdfTitle,
        pdfAuthor,
        margins,
        pageDims.width,
        dateFormat
      );
    }

    // Convert SVG to PDF using svg2pdf.js
    // Note: Fonts are already embedded via embedInterFont() and set on SVG elements
    await doc.svg(svgElement, {
      x: offsetX,
      y: offsetY,
      width: finalWidthMm,
      height: finalHeightMm,
    });

    onProgress?.(90);

    // Render footer if configured
    const hasFooter =
      pdfOptions.footer.showProjectName ||
      pdfOptions.footer.showAuthor ||
      pdfOptions.footer.showExportDate;
    if (hasFooter) {
      renderFooter(
        doc,
        pdfOptions,
        pdfTitle,
        pdfAuthor,
        margins,
        pageDims.width,
        pageDims.height,
        dateFormat
      );
    }

    // Generate filename and save
    const filename = generateExportFilename(projectName, "pdf");
    doc.save(filename);

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
  const selectedColumns =
    options.selectedColumns ||
    (["name", "startDate", "endDate", "progress"] as ExportColumnKey[]);
  const hasTaskList = selectedColumns.length > 0;
  const taskTableWidth = hasTaskList
    ? calculateTaskTableWidth(selectedColumns, columnWidths, options.density)
    : 0;

  const flattenedTasks = buildFlattenedTaskList(tasks, new Set<string>());

  // Create root SVG
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", String(dimensions.width));
  svg.setAttribute("height", String(dimensions.height));
  svg.setAttribute("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

  // Title for accessibility
  const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
  title.textContent = projectName
    ? `Gantt chart: ${projectName}`
    : "Gantt Chart";
  svg.appendChild(title);

  // White background
  if (options.background === "white") {
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", "#ffffff");
    svg.appendChild(bg);
  }

  // Font declaration (system font stack)
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = `
    text { font-family: ${SVG_FONT_FAMILY}; }
  `;
  defs.appendChild(style);
  svg.appendChild(defs);

  let currentY = 0;

  // Render header row
  if (options.includeHeader) {
    if (hasTaskList) {
      const headerGroup = renderTaskTableHeader(
        svg,
        selectedColumns,
        columnWidths,
        taskTableWidth,
        0,
        0,
        options.density
      );
      // Ensure font-family is set on all text elements for svg2pdf.js
      setFontFamilyOnTextElements(headerGroup);
    }

    if (headerSvg) {
      const headerGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      headerGroup.setAttribute("transform", `translate(${taskTableWidth}, 0)`);
      Array.from(headerSvg.childNodes).forEach((child) => {
        headerGroup.appendChild(child.cloneNode(true));
      });
      setFontFamilyOnTextElements(headerGroup);
      svg.appendChild(headerGroup);
    }

    currentY = HEADER_HEIGHT;
  }

  // Render task table rows
  if (hasTaskList) {
    const rowsGroup = renderTaskTableRows(
      svg,
      flattenedTasks,
      selectedColumns,
      columnWidths,
      taskTableWidth,
      0,
      currentY,
      options.density
    );
    // Ensure font-family is set on all text elements for svg2pdf.js
    setFontFamilyOnTextElements(rowsGroup);
  }

  // Add timeline chart
  const chartGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  chartGroup.setAttribute(
    "transform",
    `translate(${taskTableWidth}, ${currentY})`
  );
  Array.from(chartSvg.childNodes).forEach((child) => {
    chartGroup.appendChild(child.cloneNode(true));
  });
  setFontFamilyOnTextElements(chartGroup);
  svg.appendChild(chartGroup);

  return svg;
}

/**
 * Render the header on the PDF.
 */
function renderHeader(
  doc: jsPDF,
  options: PdfExportOptions,
  projectTitle: string | undefined,
  projectAuthor: string | undefined,
  margins: { top: number; left: number },
  pageWidth: number,
  dateFormat: DateFormat
): void {
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);

  // Left side: Project name and/or author
  const leftParts: string[] = [];
  if (options.header.showProjectName && projectTitle) {
    leftParts.push(projectTitle);
  }
  if (options.header.showAuthor && projectAuthor) {
    leftParts.push(projectAuthor);
  }
  if (leftParts.length > 0) {
    doc.text(leftParts.join(" | "), margins.left, margins.top - 3);
  }

  // Right side: Export date
  if (options.header.showExportDate) {
    const date = formatDateByPreference(new Date(), dateFormat);
    const dateWidth = doc.getTextWidth(date);
    doc.text(date, pageWidth - margins.left - dateWidth, margins.top - 3);
  }
}

/**
 * Render the footer on the PDF.
 */
function renderFooter(
  doc: jsPDF,
  options: PdfExportOptions,
  projectTitle: string | undefined,
  projectAuthor: string | undefined,
  margins: { top: number; left: number; bottom: number },
  pageWidth: number,
  pageHeight: number,
  dateFormat: DateFormat
): void {
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);

  const y = pageHeight - margins.bottom + 5;

  // Left side: Project name and/or author
  const leftParts: string[] = [];
  if (options.footer.showProjectName && projectTitle) {
    leftParts.push(projectTitle);
  }
  if (options.footer.showAuthor && projectAuthor) {
    leftParts.push(projectAuthor);
  }
  if (leftParts.length > 0) {
    doc.text(leftParts.join(" | "), margins.left, y);
  }

  // Right side: Export date
  if (options.footer.showExportDate) {
    const date = formatDateByPreference(new Date(), dateFormat);
    const dateWidth = doc.getTextWidth(date);
    doc.text(date, pageWidth - margins.left - dateWidth, y);
  }
}
