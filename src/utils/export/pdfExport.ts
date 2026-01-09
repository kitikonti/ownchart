/**
 * PDF Export functionality using jsPDF.
 * Generates vector PDFs from the chart data.
 */

import { jsPDF } from "jspdf";
import type { Task } from "../../types/chart.types";
import type { Dependency } from "../../types/dependency.types";
import type { TimelineScale } from "../timelineUtils";
import type { ExportOptions, PdfExportOptions } from "./types";
import { sanitizeFilename } from "./sanitizeFilename";
import { getPageDimensions, getMargins, calculateScale, pxToMm } from "./pdfLayout";
import { renderChartToPdf, type PdfRenderContext } from "./pdfRenderer";
import { getTimelineScale } from "../timelineUtils";

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
  onProgress?: (progress: number) => void;
}

/** Row height in pixels (matches normal density) */
const ROW_HEIGHT_PX = 36;
const TASK_BAR_HEIGHT_PX = 26;
const HEADER_HEIGHT_PX = 48;
const TASK_TABLE_WIDTH_PX = 150;

/**
 * Export the chart to PDF.
 */
export async function exportToPdf(params: ExportToPdfParams): Promise<void> {
  const { tasks, dependencies = [], pdfOptions, projectName, onProgress, options } = params;

  onProgress?.(5);

  // Get page dimensions
  const pageDims = getPageDimensions(pdfOptions);
  const margins = getMargins(pdfOptions);

  // Create PDF document
  const doc = new jsPDF({
    orientation: pdfOptions.orientation,
    unit: "mm",
    format: [pageDims.width, pageDims.height],
  });

  onProgress?.(10);

  // Set metadata
  if (pdfOptions.metadata.title || projectName) {
    doc.setProperties({
      title: pdfOptions.metadata.title || projectName || "Project Timeline",
      author: pdfOptions.metadata.author || "",
      subject: pdfOptions.metadata.subject || "Gantt Chart Export",
      creator: "OwnChart",
    });
  }

  // Calculate reserved space for header/footer
  const headerHeight =
    pdfOptions.header.showProjectName || pdfOptions.header.showExportDate ? 8 : 0;
  const footerHeight =
    pdfOptions.footer.showProjectName || pdfOptions.footer.showExportDate ? 8 : 0;

  // Calculate chart dimensions in pixels
  const chartScale = getChartScale(params);
  const chartWidthPx = chartScale.totalWidth;
  const chartHeightPx = tasks.length * ROW_HEIGHT_PX + HEADER_HEIGHT_PX;

  // Include task table width if columns are selected
  const hasTaskTable = options.selectedColumns.length > 0;
  const totalWidthPx = chartWidthPx + (hasTaskTable ? TASK_TABLE_WIDTH_PX : 0);

  // Calculate scale to fit
  const scaleResult = calculateScale(
    totalWidthPx,
    chartHeightPx,
    pdfOptions,
    headerHeight,
    footerHeight
  );

  onProgress?.(20);

  // Render header if configured
  if (pdfOptions.header.showProjectName || pdfOptions.header.showExportDate) {
    renderHeader(doc, pdfOptions, projectName, margins, pageDims.width);
  }

  // Calculate chart origin in mm
  const taskTableWidthMm = hasTaskTable
    ? pxToMm(TASK_TABLE_WIDTH_PX) * scaleResult.scale
    : 0;

  const chartX = margins.left + taskTableWidthMm + scaleResult.offsetX;
  const chartY = margins.top + headerHeight;

  // Create render context
  const ctx: PdfRenderContext = {
    doc,
    scale: chartScale,
    tasks,
    dependencies,
    options,
    pdfOptions,
    projectName,
    chartX,
    chartY,
    chartWidthMm: pxToMm(chartWidthPx) * scaleResult.scale,
    chartHeightMm: pxToMm(tasks.length * ROW_HEIGHT_PX) * scaleResult.scale,
    taskTableWidthMm,
    rowHeightMm: pxToMm(ROW_HEIGHT_PX) * scaleResult.scale,
    taskBarHeightMm: pxToMm(TASK_BAR_HEIGHT_PX) * scaleResult.scale,
    headerHeightMm: pxToMm(HEADER_HEIGHT_PX) * scaleResult.scale,
    scaleFactor: scaleResult.scale,
  };

  onProgress?.(30);

  // Render the chart
  await renderChartToPdf(ctx, (progress) => {
    // Map renderer progress (10-90) to overall progress (30-80)
    onProgress?.(30 + (progress / 100) * 50);
  });

  onProgress?.(85);

  // Render footer if configured
  if (pdfOptions.footer.showProjectName || pdfOptions.footer.showExportDate) {
    renderFooter(doc, pdfOptions, projectName, margins, pageDims.width, pageDims.height);
  }

  onProgress?.(90);

  // Generate filename and save
  const filename = generatePdfFilename(projectName);
  doc.save(filename);

  onProgress?.(100);
}

/**
 * Get or create timeline scale for export.
 */
function getChartScale(params: ExportToPdfParams): TimelineScale {
  const { scale, tasks, projectDateRange, options, currentAppZoom } = params;

  // Use provided scale if available
  if (scale) {
    return scale;
  }

  // Calculate scale from tasks
  if (tasks.length === 0) {
    const today = new Date().toISOString().split("T")[0];
    return getTimelineScale(today, today, 1000, 1);
  }

  // Get date range based on mode
  let minDate: string;
  let maxDate: string;

  if (options.dateRangeMode === "visible" && params.visibleDateRange) {
    minDate = params.visibleDateRange.start.toISOString().split("T")[0];
    maxDate = params.visibleDateRange.end.toISOString().split("T")[0];
  } else if (options.dateRangeMode === "custom" && options.customDateStart && options.customDateEnd) {
    minDate = options.customDateStart;
    maxDate = options.customDateEnd;
  } else if (projectDateRange) {
    minDate = projectDateRange.start.toISOString().split("T")[0];
    maxDate = projectDateRange.end.toISOString().split("T")[0];
  } else {
    // Calculate from tasks
    minDate = tasks.reduce(
      (min, t) => (t.startDate < min ? t.startDate : min),
      tasks[0].startDate
    );
    maxDate = tasks.reduce(
      (max, t) => (t.endDate > max ? t.endDate : max),
      tasks[0].endDate
    );
  }

  // Determine zoom level based on mode
  let zoom: number;
  if (options.zoomMode === "custom") {
    zoom = options.timelineZoom;
  } else {
    zoom = currentAppZoom;
  }

  return getTimelineScale(minDate, maxDate, 1000, zoom);
}

/**
 * Render the header on the PDF.
 */
function renderHeader(
  doc: jsPDF,
  options: PdfExportOptions,
  projectName: string | undefined,
  margins: { top: number; left: number },
  pageWidth: number
): void {
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);

  if (options.header.showProjectName && projectName) {
    doc.text(projectName, margins.left, margins.top - 3);
  }

  if (options.header.showExportDate) {
    const date = new Date().toLocaleDateString();
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
  projectName: string | undefined,
  margins: { top: number; left: number; bottom: number },
  pageWidth: number,
  pageHeight: number
): void {
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);

  const y = pageHeight - margins.bottom + 5;

  if (options.footer.showProjectName && projectName) {
    doc.text(projectName, margins.left, y);
  }

  if (options.footer.showExportDate) {
    const date = new Date().toLocaleDateString();
    const dateWidth = doc.getTextWidth(date);
    doc.text(date, pageWidth - margins.left - dateWidth, y);
  }
}

/**
 * Generate filename for PDF export.
 */
function generatePdfFilename(projectName?: string): string {
  const baseName = projectName
    ? sanitizeFilename(projectName)
    : "gantt-chart";
  const timestamp = new Date().toISOString().slice(0, 10);
  return `${baseName}-${timestamp}.pdf`;
}
