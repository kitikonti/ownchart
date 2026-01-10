/**
 * Shared task table rendering for SVG/PDF export.
 * Renders the task list portion of exports as native SVG elements.
 */

import type { Task } from "../../types/chart.types";
import type { UiDensity } from "../../types/preferences.types";
import { DENSITY_CONFIG } from "../../types/preferences.types";
import type { ExportColumnKey } from "./types";
import { EXPORT_COLUMNS } from "../../components/Export/ExportRenderer";
import { getDefaultColumnWidth } from "./calculations";
import {
  HEADER_HEIGHT,
  SVG_FONT_FAMILY,
  COLORS,
  HEADER_LABELS,
  TASK_TYPE_ICON_PATHS,
} from "./constants";

/**
 * Render task table header as SVG elements.
 *
 * @param svg - The parent SVG element to append to
 * @param selectedColumns - Columns to render
 * @param columnWidths - Width overrides for columns
 * @param totalWidth - Total table width
 * @param x - X offset
 * @param y - Y offset
 * @param density - UI density setting
 * @returns The created group element
 */
export function renderTaskTableHeader(
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

    // Column text - matches app styling: text-xs font-semibold uppercase tracking-wider
    if (label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", String(colX + 12));
      text.setAttribute("y", String(y + HEADER_HEIGHT / 2 + 4));
      text.setAttribute("fill", COLORS.textHeader);
      text.setAttribute("font-family", SVG_FONT_FAMILY);
      text.setAttribute("font-size", "12");
      // Use "bold" for svg2pdf.js compatibility (doesn't support "600")
      text.setAttribute("font-weight", "bold");
      text.setAttribute("letter-spacing", "0.05em");
      text.textContent = label.toUpperCase();
      group.appendChild(text);
    }

    // Column separator (skip for color column - matches app)
    if (key !== "color") {
      const sep = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
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
 * Flattened task with hierarchy information.
 */
export interface FlattenedTask {
  task: Task;
  level: number;
  hasChildren: boolean;
}

/**
 * Render task table rows as SVG elements.
 *
 * @param svg - The parent SVG element to append to
 * @param flattenedTasks - Tasks with hierarchy info
 * @param selectedColumns - Columns to render
 * @param columnWidths - Width overrides for columns
 * @param totalWidth - Total table width
 * @param x - X offset
 * @param startY - Y offset for first row
 * @param density - UI density setting
 * @returns The created group element
 */
export function renderTaskTableRows(
  svg: SVGSVGElement,
  flattenedTasks: FlattenedTask[],
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

  // Right border for the table
  const tableBorder = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );
  tableBorder.setAttribute("x1", String(x + totalWidth));
  tableBorder.setAttribute("y1", String(startY));
  tableBorder.setAttribute("x2", String(x + totalWidth));
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
        renderColorColumn(
          group,
          task,
          colX,
          rowY,
          colWidth,
          rowHeight,
          colorBarHeight
        );
      } else if (key === "name") {
        renderNameColumn(
          group,
          task,
          flattenedTask,
          index,
          colX,
          rowY,
          rowHeight,
          level,
          indentSize,
          densityConfig.fontSizeCell
        );
      } else {
        renderDataColumn(
          group,
          task,
          key,
          colX,
          rowY,
          colWidth,
          rowHeight,
          densityConfig.fontSizeCell
        );
      }

      // Column separator (skip for color column - matches app)
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
 * Render the color indicator column.
 */
function renderColorColumn(
  group: SVGGElement,
  task: Task,
  colX: number,
  rowY: number,
  colWidth: number,
  rowHeight: number,
  colorBarHeight: number
): void {
  const colorBar = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  colorBar.setAttribute("x", String(colX + (colWidth - 6) / 2));
  colorBar.setAttribute("y", String(rowY + (rowHeight - colorBarHeight) / 2));
  colorBar.setAttribute("width", "6");
  colorBar.setAttribute("height", String(colorBarHeight));
  colorBar.setAttribute("rx", "3");
  colorBar.setAttribute("fill", task.color || "#14b8a6");
  group.appendChild(colorBar);
}

/**
 * Render the name column with hierarchy, icons, and text.
 */
function renderNameColumn(
  group: SVGGElement,
  task: Task,
  flattenedTask: FlattenedTask,
  index: number,
  colX: number,
  rowY: number,
  rowHeight: number,
  level: number,
  indentSize: number,
  fontSize: number
): void {
  const hasChildren = flattenedTask.hasChildren;

  // Base X position with indent
  let currentX = colX + level * indentSize;

  // Expand/collapse arrow for summary tasks with children
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
  // Move past the arrow placeholder (16px like w-4 in Tailwind)
  currentX += 16;

  // Task type icon - using Phosphor Icons SVG paths (256x256 viewBox)
  const iconY = rowY + (rowHeight - 16) / 2;
  const iconGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  iconGroup.setAttribute(
    "transform",
    `translate(${currentX}, ${iconY}) scale(0.0625)`
  );

  const iconPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  iconPath.setAttribute("fill", COLORS.textSecondary);

  // Select the appropriate icon path based on task type
  const pathData =
    task.type === "milestone"
      ? TASK_TYPE_ICON_PATHS.milestone
      : task.type === "summary"
        ? TASK_TYPE_ICON_PATHS.summary
        : TASK_TYPE_ICON_PATHS.task;
  iconPath.setAttribute("d", pathData);

  iconGroup.appendChild(iconPath);
  group.appendChild(iconGroup);

  // Move past the icon (16px) + gap (4px)
  currentX += 20;

  // Task name
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", String(currentX));
  text.setAttribute("y", String(rowY + rowHeight / 2 + 4));
  text.setAttribute("fill", COLORS.textPrimary);
  text.setAttribute("font-family", SVG_FONT_FAMILY);
  text.setAttribute("font-size", String(fontSize));
  text.textContent = task.name || `Task ${index + 1}`;
  group.appendChild(text);
}

/**
 * Render a data column (dates, duration, progress).
 */
function renderDataColumn(
  group: SVGGElement,
  task: Task,
  key: ExportColumnKey,
  colX: number,
  rowY: number,
  _colWidth: number,
  rowHeight: number,
  fontSize: number
): void {
  const isSummary = task.type === "summary";
  const isMilestone = task.type === "milestone";
  // Summary dates/duration are styled differently (text-slate-500 italic)
  const useSummaryStyle =
    isSummary &&
    (key === "startDate" || key === "endDate" || key === "duration");

  let value = "";
  if (key === "startDate") {
    value = task.startDate || "";
  } else if (key === "endDate") {
    // Milestones don't have an end date
    value = isMilestone ? "" : task.endDate || "";
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
    text.setAttribute(
      "fill",
      useSummaryStyle ? COLORS.textSummary : COLORS.textPrimary
    );
    text.setAttribute("font-family", SVG_FONT_FAMILY);
    text.setAttribute("font-size", String(fontSize));
    if (useSummaryStyle) {
      text.setAttribute("font-style", "italic");
    }
    text.textContent = value;
    group.appendChild(text);
  }
}
