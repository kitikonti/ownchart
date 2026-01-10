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
import { sanitizeFilename } from "./sanitizeFilename";
import {
  getPageDimensions,
  getMargins,
  mmToPx,
} from "./pdfLayout";
import {
  ExportRenderer,
  calculateExportDimensions,
  EXPORT_COLUMNS,
} from "../../components/Export/ExportRenderer";
import {
  calculateTaskTableWidth,
  getDefaultColumnWidth,
} from "./calculations";
import { buildFlattenedTaskList } from "../hierarchy";
import { DENSITY_CONFIG, type UiDensity, type DateFormat } from "../../types/preferences.types";
import { embedInterFont } from "./fonts/fontEmbedding";
import { formatDateByPreference } from "../dateUtils";

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

const HEADER_HEIGHT = 48;

// Font family for SVG text elements
const SVG_FONT_FAMILY = "Inter";

// Tailwind slate colors
const COLORS = {
  textPrimary: "#1e293b",
  textSecondary: "#475569",
  textSummary: "#64748b",
  textHeader: "#475569",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  headerBg: "#f8fafc",
};

// Header labels
const HEADER_LABELS: Record<string, string> = {
  color: "",
  name: "Name",
  startDate: "Start Date",
  endDate: "End Date",
  duration: "Duration",
  progress: "%",
};

/**
 * Wait for all fonts to be loaded.
 */
async function waitForFonts(): Promise<void> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
}

/**
 * Wait for next animation frame.
 */
function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
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

  // For PDF "fit to page" mode, calculate the optimal width based on page aspect ratio
  let effectiveOptions = options;
  if (options.zoomMode === "fitToWidth") {
    // Get page dimensions and margins
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

    // Calculate available content area in pixels
    const availableWidthMm = pageDims.width - margins.left - margins.right;
    const availableHeightMm =
      pageDims.height - margins.top - margins.bottom - headerReserved - footerReserved;
    const availableWidthPx = mmToPx(availableWidthMm);
    const availableHeightPx = mmToPx(availableHeightMm);

    // Calculate content height (fixed based on task count and density)
    const densityConfig = DENSITY_CONFIG[options.density];
    const contentHeaderHeight = options.includeHeader ? HEADER_HEIGHT : 0;
    const flattenedTasks = buildFlattenedTaskList(tasks, new Set<string>());
    const contentHeightPx = flattenedTasks.length * densityConfig.rowHeight + contentHeaderHeight;

    // Calculate optimal total width based on page aspect ratio
    // We want the content aspect ratio to match the page aspect ratio
    // so that after scaling, both width and height fill the page exactly
    const pageAspectRatio = availableWidthPx / availableHeightPx;
    const optimalTotalWidthPx = contentHeightPx * pageAspectRatio;

    // The timeline width is the total width minus task table
    // But ensure we don't go smaller than the page width (use page width as minimum)
    const optimalFitToWidth = Math.max(
      Math.round(optimalTotalWidthPx),
      Math.round(availableWidthPx)
    );

    // Update options with calculated fitToWidth
    effectiveOptions = {
      ...options,
      fitToWidth: optimalFitToWidth,
    };
  }

  // Calculate dimensions using effective options
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
  const container = document.createElement("div");
  container.id = "export-pdf-container";
  container.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    width: ${dimensions.width}px;
    height: ${dimensions.height}px;
    overflow: hidden;
    background: ${options.background === "white" ? "#ffffff" : "transparent"};
    z-index: 99999;
    opacity: 0;
    pointer-events: none;
  `;
  document.body.appendChild(container);

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

    // Embed Inter font for svg2pdf.js
    embedInterFont(doc);

    // Set Inter as the default font for the document
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

    // Render header if configured
    const hasHeader = pdfOptions.header.showProjectName || pdfOptions.header.showAuthor || pdfOptions.header.showExportDate;
    if (hasHeader) {
      renderHeader(doc, pdfOptions, pdfTitle, pdfAuthor, margins, pageDims.width, dateFormat);
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
    const hasFooter = pdfOptions.footer.showProjectName || pdfOptions.footer.showAuthor || pdfOptions.footer.showExportDate;
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
    const filename = generatePdfFilename(projectName);
    doc.save(filename);

    onProgress?.(100);
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
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
    options.selectedColumns || (["name", "startDate", "endDate", "progress"] as ExportColumnKey[]);
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

  // Font declaration
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
 * Set font-family attribute on all text and tspan elements.
 * This ensures svg2pdf.js uses the embedded Inter font.
 */
function setFontFamilyOnTextElements(element: Element): void {
  // Handle SVG namespace - tagName can be lowercase or uppercase
  const tagName = element.tagName?.toLowerCase() || "";
  const localName = element.localName?.toLowerCase() || tagName;

  // Set font-family on text and tspan elements
  if (localName === "text" || localName === "tspan") {
    // Remove any existing font-family to ensure our value takes precedence
    element.removeAttribute("font-family");
    element.setAttribute("font-family", SVG_FONT_FAMILY);

    // Also set as style to be extra sure
    const currentStyle = element.getAttribute("style") || "";
    if (!currentStyle.includes("font-family")) {
      element.setAttribute(
        "style",
        currentStyle
          ? `${currentStyle}; font-family: ${SVG_FONT_FAMILY};`
          : `font-family: ${SVG_FONT_FAMILY};`
      );
    }
  }

  // Check for style attribute that might contain font-family
  if (element.hasAttribute("style")) {
    const style = element.getAttribute("style") || "";
    // Replace any font-family in inline styles
    const newStyle = style.replace(
      /font-family:\s*[^;]+;?/gi,
      `font-family: ${SVG_FONT_FAMILY};`
    );
    if (newStyle !== style) {
      element.setAttribute("style", newStyle);
    }
  }

  // Process all child elements
  Array.from(element.children).forEach((child) => {
    setFontFamilyOnTextElements(child);
  });
}

/**
 * Render task table header as SVG elements.
 */
function renderTaskTableHeader(
  svg: SVGSVGElement,
  selectedColumns: ExportColumnKey[],
  columnWidths: Record<string, number>,
  totalWidth: number,
  x: number,
  y: number,
  density: UiDensity
): SVGGElement {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("class", "task-table-header");

  // Header background
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("x", String(x));
  bg.setAttribute("y", String(y));
  bg.setAttribute("width", String(totalWidth));
  bg.setAttribute("height", String(HEADER_HEIGHT));
  bg.setAttribute("fill", COLORS.headerBg);
  group.appendChild(bg);

  // Header border
  const border = document.createElementNS("http://www.w3.org/2000/svg", "line");
  border.setAttribute("x1", String(x));
  border.setAttribute("y1", String(y + HEADER_HEIGHT));
  border.setAttribute("x2", String(x + totalWidth));
  border.setAttribute("y2", String(y + HEADER_HEIGHT));
  border.setAttribute("stroke", COLORS.border);
  border.setAttribute("stroke-width", "1");
  group.appendChild(border);

  // Column headers
  let colX = x;
  for (const key of selectedColumns) {
    const colWidth = columnWidths[key] || getDefaultColumnWidth(key, density);
    const label = HEADER_LABELS[key] || "";

    if (label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", String(colX + 12));
      text.setAttribute("y", String(y + HEADER_HEIGHT / 2 + 4));
      text.setAttribute("fill", COLORS.textHeader);
      text.setAttribute("font-family", SVG_FONT_FAMILY);
      text.setAttribute("font-size", "12"); // text-xs (matches app)
      text.setAttribute("font-weight", "600"); // font-semibold (matches app)
      text.setAttribute("letter-spacing", "0.05em");
      text.textContent = label.toUpperCase();
      group.appendChild(text);
    }

    // Column separator (skip for color column - no border between color and name)
    if (key !== "color") {
      const sep = document.createElementNS("http://www.w3.org/2000/svg", "line");
      sep.setAttribute("x1", String(colX + colWidth));
      sep.setAttribute("y1", String(y));
      sep.setAttribute("x2", String(colX + colWidth));
      sep.setAttribute("y2", String(y + HEADER_HEIGHT));
      sep.setAttribute("stroke", COLORS.border);
      sep.setAttribute("stroke-width", "1");
      group.appendChild(sep);
    }

    colX += colWidth;
  }

  svg.appendChild(group);
  return group;
}

/**
 * Render task table rows as SVG elements.
 */
function renderTaskTableRows(
  svg: SVGSVGElement,
  flattenedTasks: Array<{ task: Task; level: number; hasChildren: boolean }>,
  selectedColumns: ExportColumnKey[],
  columnWidths: Record<string, number>,
  totalWidth: number,
  x: number,
  startY: number,
  density: UiDensity
): SVGGElement {
  const densityConfig = DENSITY_CONFIG[density];
  const rowHeight = densityConfig.rowHeight;
  const indentSize = densityConfig.indentSize;
  const colorBarHeight = densityConfig.colorBarHeight;

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("class", "task-table-rows");

  // Right border
  const tableBorder = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );
  tableBorder.setAttribute("x1", String(x + totalWidth));
  tableBorder.setAttribute("y1", String(startY));
  tableBorder.setAttribute(
    "x2",
    String(x + totalWidth)
  );
  tableBorder.setAttribute(
    "y2",
    String(startY + flattenedTasks.length * rowHeight)
  );
  tableBorder.setAttribute("stroke", COLORS.border);
  tableBorder.setAttribute("stroke-width", "1");
  group.appendChild(tableBorder);

  flattenedTasks.forEach((flattenedTask, index) => {
    const task = flattenedTask.task;
    const level = flattenedTask.level;
    const rowY = startY + index * rowHeight;

    // Row border
    const rowBorder = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    rowBorder.setAttribute("x1", String(x));
    rowBorder.setAttribute("y1", String(rowY + rowHeight));
    rowBorder.setAttribute("x2", String(x + totalWidth));
    rowBorder.setAttribute("y2", String(rowY + rowHeight));
    rowBorder.setAttribute("stroke", COLORS.borderLight);
    rowBorder.setAttribute("stroke-width", "1");
    group.appendChild(rowBorder);

    let colX = x;
    for (const key of selectedColumns) {
      const col = EXPORT_COLUMNS.find((c) => c.key === key);
      if (!col) continue;

      const colWidth = columnWidths[key] || getDefaultColumnWidth(key, density);

      if (key === "color") {
        // Color indicator
        const colorBar = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        colorBar.setAttribute("x", String(colX + (colWidth - 6) / 2));
        colorBar.setAttribute(
          "y",
          String(rowY + (rowHeight - colorBarHeight) / 2)
        );
        colorBar.setAttribute("width", "6");
        colorBar.setAttribute("height", String(colorBarHeight));
        colorBar.setAttribute("rx", "3");
        colorBar.setAttribute("fill", task.color || "#14b8a6");
        group.appendChild(colorBar);
      } else if (key === "name") {
        const hasChildren = flattenedTask.hasChildren;
        const fontSize = densityConfig.fontSizeCell;

        // Base X position with indent (no extra padding, matches app)
        let currentX = colX + level * indentSize;

        // Expand/collapse arrow for summary tasks
        if (hasChildren && task.type === "summary") {
          const arrowText = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );
          arrowText.setAttribute("x", String(currentX));
          arrowText.setAttribute("y", String(rowY + rowHeight / 2 + 4));
          arrowText.setAttribute("fill", COLORS.textSecondary);
          arrowText.setAttribute("font-family", SVG_FONT_FAMILY);
          arrowText.setAttribute("font-size", "11");
          arrowText.textContent = "▼";
          group.appendChild(arrowText);
        }
        currentX += 16;

        // Task type icon
        const iconY = rowY + (rowHeight - 16) / 2;
        const iconGroup = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );
        iconGroup.setAttribute(
          "transform",
          `translate(${currentX}, ${iconY}) scale(0.0625)`
        );

        const iconPath = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        iconPath.setAttribute("fill", COLORS.textSecondary);

        if (task.type === "milestone") {
          iconPath.setAttribute(
            "d",
            "M235.33,116.72,139.28,20.66a16,16,0,0,0-22.56,0l-96,96.06a16,16,0,0,0,0,22.56l96.05,96.06a16,16,0,0,0,22.56,0l96.05-96.06a16,16,0,0,0,0-22.56ZM128,224,32,128,128,32l96,96Z"
          );
        } else if (task.type === "summary") {
          iconPath.setAttribute(
            "d",
            "M216,72H130.67L102.93,51.2a16.12,16.12,0,0,0-9.6-3.2H40A16,16,0,0,0,24,64V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72ZM40,64H93.33l21.34,16H40ZM216,200H40V96H216Z"
          );
        } else {
          iconPath.setAttribute(
            "d",
            "M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208Zm-32.49-101.49-72,72a12,12,0,0,1-17,0l-32-32a12,12,0,0,1,17-17L96,154l63.51-63.52a12,12,0,0,1,17,17Z"
          );
        }

        iconGroup.appendChild(iconPath);
        group.appendChild(iconGroup);

        currentX += 20;

        // Task name
        const text = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        text.setAttribute("x", String(currentX));
        text.setAttribute("y", String(rowY + rowHeight / 2 + 4));
        text.setAttribute("fill", COLORS.textPrimary);
        text.setAttribute("font-family", SVG_FONT_FAMILY);
        text.setAttribute("font-size", String(fontSize));
        text.textContent = task.name || `Task ${index + 1}`;
        group.appendChild(text);
      } else {
        // Other columns
        const isSummary = task.type === "summary";
        const isMilestone = task.type === "milestone";
        const useSummaryStyle =
          isSummary &&
          (key === "startDate" || key === "endDate" || key === "duration");

        let value = "";
        if (key === "startDate") {
          value = task.startDate || "";
        } else if (key === "endDate") {
          value = isMilestone ? "" : task.endDate || "";
        } else if (key === "duration") {
          if (isMilestone) {
            value = "";
          } else if (
            isSummary &&
            task.duration !== undefined &&
            task.duration > 0
          ) {
            value = `${task.duration} days`;
          } else if (!isSummary && task.duration !== undefined) {
            value = `${task.duration}`;
          }
        } else if (key === "progress") {
          value = task.progress !== undefined ? `${task.progress}%` : "";
        }

        if (value) {
          const text = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );
          text.setAttribute("x", String(colX + 12));
          text.setAttribute("y", String(rowY + rowHeight / 2 + 4));
          // Regular cells use textPrimary (slate-800), summary dates/duration use textSummary (slate-500)
          text.setAttribute(
            "fill",
            useSummaryStyle ? COLORS.textSummary : COLORS.textPrimary
          );
          text.setAttribute("font-family", SVG_FONT_FAMILY);
          text.setAttribute("font-size", String(densityConfig.fontSizeCell));
          if (useSummaryStyle) {
            text.setAttribute("font-style", "italic");
          }
          text.textContent = value;
          group.appendChild(text);
        }
      }

      // Column separator (skip for color column - no border between color and name)
      if (key !== "color") {
        const sep = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        sep.setAttribute("x1", String(colX + colWidth));
        sep.setAttribute("y1", String(rowY));
        sep.setAttribute("x2", String(colX + colWidth));
        sep.setAttribute("y2", String(rowY + rowHeight));
        sep.setAttribute("stroke", COLORS.borderLight);
        sep.setAttribute("stroke-width", "1");
        group.appendChild(sep);
      }

      colX += colWidth;
    }
  });

  svg.appendChild(group);
  return group;
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

/**
 * Generate filename for PDF export.
 * Format: {projectName}-YYYYMMDD-HHMMSS.pdf (same as PNG)
 */
function generatePdfFilename(projectName?: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const baseName = projectName ? sanitizeFilename(projectName) : "gantt-chart";
  return `${baseName}-${year}${month}${day}-${hours}${minutes}${seconds}.pdf`;
}
