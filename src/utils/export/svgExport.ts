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
import type { ExportOptions, SvgExportOptions, ExportColumnKey } from "./types";
import { sanitizeFilename } from "./sanitizeFilename";
import {
  ExportRenderer,
  calculateExportDimensions,
  EXPORT_COLUMNS,
} from "../../components/Export/ExportRenderer";
import {
  calculateTaskTableWidth,
  getDefaultColumnWidth,
} from "./calculations";
import {
  buildFlattenedTaskList,
} from "../../utils/hierarchy";
import {
  DENSITY_CONFIG,
  type UiDensity,
} from "../../types/preferences.types";

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

const HEADER_HEIGHT = 48;

// Font family for SVG text elements - must be set directly on each element
// (style blocks are often ignored by vector apps like Illustrator/Inkscape)
const SVG_FONT_FAMILY = "Inter";

// Tailwind slate colors for consistent styling with the web app
const COLORS = {
  textPrimary: "#1e293b",    // slate-800 - task names
  textSecondary: "#475569",  // slate-600 - dates, progress, icons, header labels
  textSummary: "#64748b",    // slate-500 - summary dates/duration (lighter, italic in app)
  textHeader: "#475569",     // slate-600 - header labels (matches app)
  border: "#e2e8f0",         // slate-200 - header borders
  borderLight: "#f1f5f9",    // slate-100 - row borders
  headerBg: "#f8fafc",       // slate-50 - header background
};

// Header labels matching the app's TASK_COLUMNS (from config/tableColumns.ts)
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
 * Wait for next animation frame (ensures DOM is painted).
 */
function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
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
  const container = document.createElement("div");
  container.id = "export-svg-container";
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
      const filename = generateSvgFilename(projectName);
      downloadSvg(svgString, filename);
    }

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
 * Set font-family attribute on all text elements in an SVG subtree.
 * Vector apps like Illustrator/Inkscape often ignore CSS style blocks,
 * so we need to set font-family directly on each text element.
 */
function setFontFamilyOnTextElements(element: Element): void {
  // Set on this element if it's a text element
  if (element.tagName === "text") {
    element.setAttribute("font-family", SVG_FONT_FAMILY);
  }

  // Recursively process all child elements
  Array.from(element.children).forEach(child => {
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
): void {
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

    // Column text - matches app styling: text-xs font-semibold uppercase tracking-wider text-slate-600
    if (label) {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", String(colX + 12));
      text.setAttribute("y", String(y + HEADER_HEIGHT / 2 + 4));
      text.setAttribute("fill", COLORS.textHeader);
      text.setAttribute("font-family", SVG_FONT_FAMILY);
      text.setAttribute("font-size", "11"); // text-xs (12px) but slightly smaller for tracking
      text.setAttribute("font-weight", "600"); // font-semibold
      text.setAttribute("letter-spacing", "0.05em"); // tracking-wider
      text.textContent = label.toUpperCase(); // uppercase
      group.appendChild(text);
    }

    // Column separator
    const sep = document.createElementNS("http://www.w3.org/2000/svg", "line");
    sep.setAttribute("x1", String(colX + colWidth));
    sep.setAttribute("y1", String(y));
    sep.setAttribute("x2", String(colX + colWidth));
    sep.setAttribute("y2", String(y + HEADER_HEIGHT));
    sep.setAttribute("stroke", COLORS.border);
    sep.setAttribute("stroke-width", "1");
    group.appendChild(sep);

    colX += colWidth;
  }

  svg.appendChild(group);
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
): void {
  const densityConfig = DENSITY_CONFIG[density];
  const rowHeight = densityConfig.rowHeight;
  const indentSize = densityConfig.indentSize;
  const colorBarHeight = densityConfig.colorBarHeight;

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("class", "task-table-rows");

  // Right border for the table
  const tableBorder = document.createElementNS("http://www.w3.org/2000/svg", "line");
  tableBorder.setAttribute("x1", String(x + totalWidth));
  tableBorder.setAttribute("y1", String(startY));
  tableBorder.setAttribute("x2", String(x + totalWidth));
  tableBorder.setAttribute("y2", String(startY + flattenedTasks.length * rowHeight));
  tableBorder.setAttribute("stroke", COLORS.border);
  tableBorder.setAttribute("stroke-width", "1");
  group.appendChild(tableBorder);

  flattenedTasks.forEach((flattenedTask, index) => {
    const task = flattenedTask.task;
    const level = flattenedTask.level;
    const rowY = startY + index * rowHeight;

    // Row border
    const rowBorder = document.createElementNS("http://www.w3.org/2000/svg", "line");
    rowBorder.setAttribute("x1", String(x));
    rowBorder.setAttribute("y1", String(rowY + rowHeight));
    rowBorder.setAttribute("x2", String(x + totalWidth));
    rowBorder.setAttribute("y2", String(rowY + rowHeight));
    rowBorder.setAttribute("stroke", COLORS.borderLight);
    rowBorder.setAttribute("stroke-width", "1");
    group.appendChild(rowBorder);

    let colX = x;
    for (const key of selectedColumns) {
      const col = EXPORT_COLUMNS.find(c => c.key === key);
      if (!col) continue;

      const colWidth = columnWidths[key] || getDefaultColumnWidth(key, density);

      if (key === "color") {
        // Color indicator
        const colorBar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        colorBar.setAttribute("x", String(colX + (colWidth - 6) / 2));
        colorBar.setAttribute("y", String(rowY + (rowHeight - colorBarHeight) / 2));
        colorBar.setAttribute("width", "6");
        colorBar.setAttribute("height", String(colorBarHeight));
        colorBar.setAttribute("rx", "3");
        colorBar.setAttribute("fill", task.color || "#14b8a6");
        group.appendChild(colorBar);
      } else if (key === "name") {
        const hasChildren = flattenedTask.hasChildren;

        // Base X position with indent
        let currentX = colX + 12 + level * indentSize;

        // Expand/collapse arrow placeholder (16px wide, matches app)
        // Show "▼" for summary tasks with children (all expanded in export)
        if (hasChildren && task.type === "summary") {
          const arrowText = document.createElementNS("http://www.w3.org/2000/svg", "text");
          arrowText.setAttribute("x", String(currentX));
          arrowText.setAttribute("y", String(rowY + rowHeight / 2 + 4));
          arrowText.setAttribute("fill", COLORS.textSecondary);
          arrowText.setAttribute("font-family", SVG_FONT_FAMILY);
          arrowText.setAttribute("font-size", "11");
          arrowText.textContent = "▼";
          group.appendChild(arrowText);
        }
        // Move past the arrow placeholder (16px like w-4 in Tailwind)
        currentX += 16;

        // Task type icon - using Phosphor Icons SVG paths (16x16)
        const iconY = rowY + (rowHeight - 16) / 2;

        const iconGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        iconGroup.setAttribute("transform", `translate(${currentX}, ${iconY}) scale(0.0625)`);

        const iconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        iconPath.setAttribute("fill", COLORS.textSecondary);

        if (task.type === "milestone") {
          // Phosphor Diamond icon (256x256 viewBox)
          iconPath.setAttribute("d", "M235.33,116.72,139.28,20.66a16,16,0,0,0-22.56,0l-96,96.06a16,16,0,0,0,0,22.56l96.05,96.06a16,16,0,0,0,22.56,0l96.05-96.06a16,16,0,0,0,0-22.56ZM128,224,32,128,128,32l96,96Z");
        } else if (task.type === "summary") {
          // Phosphor Folder icon (256x256 viewBox)
          iconPath.setAttribute("d", "M216,72H130.67L102.93,51.2a16.12,16.12,0,0,0-9.6-3.2H40A16,16,0,0,0,24,64V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72ZM40,64H93.33l21.34,16H40ZM216,200H40V96H216Z");
        } else {
          // Phosphor CheckSquare icon (256x256 viewBox)
          iconPath.setAttribute("d", "M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208Zm-32.49-101.49-72,72a12,12,0,0,1-17,0l-32-32a12,12,0,0,1,17-17L96,154l63.51-63.52a12,12,0,0,1,17,17Z");
        }

        iconGroup.appendChild(iconPath);
        group.appendChild(iconGroup);

        // Move past the icon (16px) + gap (4px)
        currentX += 20;

        // Task name - no special font-weight for summary (matches ExportRenderer)
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", String(currentX));
        text.setAttribute("y", String(rowY + rowHeight / 2 + 4));
        text.setAttribute("fill", COLORS.textPrimary);
        text.setAttribute("font-family", SVG_FONT_FAMILY);
        text.setAttribute("font-size", "13");
        text.textContent = task.name || `Task ${index + 1}`;
        group.appendChild(text);
      } else {
        // Other columns (dates, duration, progress)
        const isSummary = task.type === "summary";
        const isMilestone = task.type === "milestone";
        // Summary dates/duration are styled differently in the app (text-slate-500 italic)
        const useSummaryStyle = isSummary && (key === "startDate" || key === "endDate" || key === "duration");

        let value = "";
        if (key === "startDate") {
          value = task.startDate || "";
        } else if (key === "endDate") {
          // Milestones don't have an end date (only start date)
          value = isMilestone ? "" : (task.endDate || "");
        } else if (key === "duration") {
          // Milestones don't have duration, summaries show "X days"
          if (isMilestone) {
            value = "";
          } else if (isSummary && task.duration !== undefined && task.duration > 0) {
            value = `${task.duration} days`;
          } else if (!isSummary && task.duration !== undefined) {
            value = `${task.duration}`;
          }
        } else if (key === "progress") {
          value = task.progress !== undefined ? `${task.progress}%` : "";
        }

        // Only render text if there's a value
        if (value) {
          const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
          text.setAttribute("x", String(colX + 12));
          text.setAttribute("y", String(rowY + rowHeight / 2 + 4));
          text.setAttribute("fill", useSummaryStyle ? COLORS.textSummary : COLORS.textSecondary);
          text.setAttribute("font-family", SVG_FONT_FAMILY);
          text.setAttribute("font-size", "13");
          if (useSummaryStyle) {
            text.setAttribute("font-style", "italic");
          }
          text.textContent = value;
          group.appendChild(text);
        }
      }

      // Column separator
      const sep = document.createElementNS("http://www.w3.org/2000/svg", "line");
      sep.setAttribute("x1", String(colX + colWidth));
      sep.setAttribute("y1", String(rowY));
      sep.setAttribute("x2", String(colX + colWidth));
      sep.setAttribute("y2", String(rowY + rowHeight));
      sep.setAttribute("stroke", COLORS.borderLight);
      sep.setAttribute("stroke-width", "1");
      group.appendChild(sep);

      colX += colWidth;
    }
  });

  svg.appendChild(group);
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

/**
 * Generate filename for SVG export.
 * Format: {projectName}-YYYYMMDD-HHMMSS.svg (same as PNG)
 */
function generateSvgFilename(projectName?: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const baseName = projectName ? sanitizeFilename(projectName) : "gantt-chart";
  return `${baseName}-${year}${month}${day}-${hours}${minutes}${seconds}.svg`;
}
