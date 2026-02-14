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
import {
  getPageDimensions,
  getMargins,
  mmToPx,
  calculatePdfFitToWidth,
} from "./pdfLayout";
import {
  ExportRenderer,
  calculateExportDimensions,
} from "../../components/Export/ExportRenderer";
import { calculateTaskTableWidth } from "./calculations";
import { buildFlattenedTaskList } from "../hierarchy";
import { type DateFormat } from "../../types/preferences.types";
import { formatDateByPreference } from "../dateUtils";
import { SVG_FONT_FAMILY } from "./constants";
import { registerInterFont } from "./interFont";
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
import type { ColorModeState } from "../../types/colorMode.types";

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
  colorModeState: ColorModeState;
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
    colorModeState,
    onProgress,
  } = params;

  onProgress?.(5);

  // For "fit to page" mode, calculate optimal fitToWidth based on content and page
  let effectiveOptions = options;
  if (options.zoomMode === "fitToWidth") {
    const optimalFitToWidth = calculatePdfFitToWidth(
      tasks,
      options,
      pdfOptions
    );
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
      colorModeState,
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
      pdfOptions.header.showProjectName ||
      pdfOptions.header.showAuthor ||
      pdfOptions.header.showExportDate
        ? 10
        : 0;
    const footerReserved =
      pdfOptions.footer.showProjectName ||
      pdfOptions.footer.showAuthor ||
      pdfOptions.footer.showExportDate
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

    // Register and use Inter font for consistent rendering across all systems
    registerInterFont(doc);
    doc.setFont("Inter", "normal");

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

    // Convert SVG to PDF using svg2pdf.js
    // Note: Fonts are already embedded via embedInterFont() and set on SVG elements
    await doc.svg(svgElement, {
      x: offsetX,
      y: offsetY,
      width: finalWidthMm,
      height: finalHeightMm,
    });

    onProgress?.(90);

    // Render header/footer AFTER chart SVG so lines draw on top of content
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
        headerReserved,
        dateFormat
      );
    }

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
        footerReserved,
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
  colorModeState: ColorModeState,
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
      options.density,
      colorModeState
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
  margins: { top: number; left: number; right: number },
  pageWidth: number,
  headerReserved: number,
  dateFormat: DateFormat
): void {
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // #475569 - matches COLORS.textSecondary

  const textY = margins.top + 6;

  // Left side: Project title
  if (options.header.showProjectName && projectTitle) {
    doc.text(projectTitle, margins.left, textY);
  }

  // Right side: Author and/or date, joined with " · "
  const rightParts: string[] = [];
  if (options.header.showAuthor && projectAuthor) {
    rightParts.push(projectAuthor);
  }
  if (options.header.showExportDate) {
    rightParts.push(formatDateByPreference(new Date(), dateFormat));
  }
  if (rightParts.length > 0) {
    const rightText = rightParts.join(" \u00B7 ");
    const rightWidth = doc.getTextWidth(rightText);
    doc.text(rightText, pageWidth - margins.right - rightWidth, textY);
  }

  // Separator line below header
  doc.setDrawColor(226, 232, 240); // #e2e8f0 - matches COLORS.border
  doc.setLineWidth(0.1);
  doc.line(
    margins.left,
    margins.top + headerReserved,
    pageWidth - margins.right,
    margins.top + headerReserved
  );
}

/**
 * Render the footer on the PDF.
 */
function renderFooter(
  doc: jsPDF,
  options: PdfExportOptions,
  projectTitle: string | undefined,
  projectAuthor: string | undefined,
  margins: { top: number; left: number; bottom: number; right: number },
  pageWidth: number,
  pageHeight: number,
  footerReserved: number,
  dateFormat: DateFormat
): void {
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // #475569 - matches COLORS.textSecondary

  const footerLineY = pageHeight - margins.bottom - footerReserved;
  const textY = pageHeight - margins.bottom - 4;

  // Separator line above footer
  doc.setDrawColor(226, 232, 240); // #e2e8f0 - matches COLORS.border
  doc.setLineWidth(0.1);
  doc.line(margins.left, footerLineY, pageWidth - margins.right, footerLineY);

  // Left side: Project title
  if (options.footer.showProjectName && projectTitle) {
    doc.text(projectTitle, margins.left, textY);
  }

  // Right side: Author and/or date, joined with " · "
  const rightParts: string[] = [];
  if (options.footer.showAuthor && projectAuthor) {
    rightParts.push(projectAuthor);
  }
  if (options.footer.showExportDate) {
    rightParts.push(formatDateByPreference(new Date(), dateFormat));
  }
  if (rightParts.length > 0) {
    const rightText = rightParts.join(" \u00B7 ");
    const rightWidth = doc.getTextWidth(rightText);
    doc.text(rightText, pageWidth - margins.right - rightWidth, textY);
  }
}
