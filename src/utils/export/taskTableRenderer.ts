/**
 * Shared task table rendering for SVG/PDF export.
 * Renders the task list portion of exports as native SVG elements.
 */

import type { Task } from "../../types/chart.types";
import type { UiDensity, DensityConfig } from "../../types/preferences.types";
import { DENSITY_CONFIG } from "../../config/densityConfig";
import type {
  ExportColumnKey,
  ExportDataColumnKey,
  FlattenedTask,
} from "./types";
import { HEADER_LABELS, getColumnDisplayValue } from "./columns";
import { getDefaultColumnWidth } from "./calculations";
import {
  HEADER_HEIGHT,
  SVG_FONT_FAMILY,
  EXPORT_COLORS,
  TASK_TYPE_ICON_PATHS,
  TEXT_BASELINE_OFFSET,
  ARROW_PLACEHOLDER_WIDTH,
  ICON_RENDER_SIZE,
  ICON_TEXT_GAP,
  ICON_SCALE,
  ARROW_FONT_SIZE,
  COLOR_BAR_WIDTH,
  COLOR_BAR_RADIUS,
  COLUMN_HEADER_FONT_SIZE,
} from "./constants";
import type { ColorModeState } from "../../types/colorMode.types";
import { getComputedTaskColor } from "../computeTaskColor";

// ─── SVG namespace helper ─────────────────────────────────────────────────────

const SVG_NS = "http://www.w3.org/2000/svg";

function createSVGEl<K extends keyof SVGElementTagNameMap>(
  tag: K
): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tag) as SVGElementTagNameMap[K];
}

// ─── Text helpers ─────────────────────────────────────────────────────────────

/**
 * Approximate char-width ratio for Inter at any size.
 * Inter digits/dashes average ~6–7 px at 16 px; mixed task-name text is slightly wider.
 * 0.45 keeps typical dates/durations unclipped while still truncating genuinely long names.
 * Safe for both SVG and PDF export (no canvas measurement needed).
 */
const APPROX_CHAR_WIDTH_RATIO = 0.45;

/**
 * Truncate a string to fit within availableWidth pixels at the given fontSize.
 * Appends "…" when truncation occurs.
 */
function truncateToWidth(
  text: string,
  availableWidth: number,
  fontSize: number
): string {
  const maxChars = Math.floor(
    availableWidth / (fontSize * APPROX_CHAR_WIDTH_RATIO)
  );
  if (text.length <= maxChars) return text;
  return text.slice(0, Math.max(0, maxChars - 1)) + "…";
}

// ─── Column separator helper ──────────────────────────────────────────────────

function createColumnSeparatorLine(
  x: number,
  y1: number,
  y2: number,
  color: string
): SVGLineElement {
  const line = createSVGEl("line");
  line.setAttribute("x1", String(x));
  line.setAttribute("y1", String(y1));
  line.setAttribute("x2", String(x));
  line.setAttribute("y2", String(y2));
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-width", "1");
  return line;
}

// ─── Cell render context ──────────────────────────────────────────────────────

/** Shared state forwarded to every private cell renderer for a single row. */
interface CellRenderContext {
  group: SVGGElement;
  rowY: number;
  rowHeight: number;
  densityConfig: DensityConfig;
}

// ─── Private cell renderers ───────────────────────────────────────────────────

function renderColorCell(
  ctx: CellRenderContext,
  task: Task,
  allTasks: Task[],
  colorModeState: ColorModeState,
  colX: number,
  colWidth: number
): void {
  const { group, rowY, rowHeight, densityConfig } = ctx;
  const displayColor = getComputedTaskColor(task, allTasks, colorModeState);

  const colorBar = createSVGEl("rect");
  colorBar.setAttribute("x", String(colX + (colWidth - COLOR_BAR_WIDTH) / 2));
  colorBar.setAttribute(
    "y",
    String(rowY + (rowHeight - densityConfig.colorBarHeight) / 2)
  );
  colorBar.setAttribute("width", String(COLOR_BAR_WIDTH));
  colorBar.setAttribute("height", String(densityConfig.colorBarHeight));
  colorBar.setAttribute("rx", String(COLOR_BAR_RADIUS));
  colorBar.setAttribute("fill", displayColor);
  group.appendChild(colorBar);
}

function renderNameCell(
  ctx: CellRenderContext,
  task: Task,
  flattenedTask: FlattenedTask,
  rowIndex: number,
  colX: number,
  colWidth: number
): void {
  const { group, rowY, rowHeight, densityConfig } = ctx;
  const { level, hasChildren } = flattenedTask;
  const { indentSize, fontSizeCell, cellPaddingX } = densityConfig;
  const textY = rowY + rowHeight / 2 + TEXT_BASELINE_OFFSET;

  let currentX = colX + level * indentSize;

  // Expand/collapse arrow for summary tasks with children
  if (hasChildren && task.type === "summary") {
    const arrow = createSVGEl("text");
    arrow.setAttribute("x", String(currentX));
    arrow.setAttribute("y", String(textY));
    arrow.setAttribute("fill", EXPORT_COLORS.textSecondary);
    arrow.setAttribute("font-family", SVG_FONT_FAMILY);
    arrow.setAttribute("font-size", String(ARROW_FONT_SIZE));
    arrow.textContent = "▼";
    group.appendChild(arrow);
  }
  // Reserve space for the arrow placeholder (ARROW_PLACEHOLDER_WIDTH = w-4 = 16px)
  currentX += ARROW_PLACEHOLDER_WIDTH;

  // Task type icon — Phosphor Icons, 256×256 viewBox, scaled to ICON_RENDER_SIZE
  const iconY = rowY + (rowHeight - ICON_RENDER_SIZE) / 2;
  const iconGroup = createSVGEl("g");
  iconGroup.setAttribute(
    "transform",
    `translate(${currentX}, ${iconY}) scale(${ICON_SCALE})`
  );
  const iconPath = createSVGEl("path");
  iconPath.setAttribute("fill", EXPORT_COLORS.textSecondary);
  iconPath.setAttribute(
    "d",
    task.type === "milestone"
      ? TASK_TYPE_ICON_PATHS.milestone
      : task.type === "summary"
        ? TASK_TYPE_ICON_PATHS.summary
        : TASK_TYPE_ICON_PATHS.task
  );
  iconGroup.appendChild(iconPath);
  group.appendChild(iconGroup);

  // Advance past icon (ICON_RENDER_SIZE) + gap (ICON_TEXT_GAP)
  currentX += ICON_RENDER_SIZE + ICON_TEXT_GAP;

  // Task name — truncated to remaining available column width
  const availableWidth = colX + colWidth - currentX - cellPaddingX;
  const rawName = task.name || `Task ${rowIndex + 1}`;
  const displayName = truncateToWidth(rawName, availableWidth, fontSizeCell);

  const text = createSVGEl("text");
  text.setAttribute("x", String(currentX));
  text.setAttribute("y", String(textY));
  text.setAttribute("fill", EXPORT_COLORS.textPrimary);
  text.setAttribute("font-family", SVG_FONT_FAMILY);
  text.setAttribute("font-size", String(fontSizeCell));
  text.textContent = displayName;
  group.appendChild(text);
}

function renderDataCell(
  ctx: CellRenderContext,
  task: Task,
  key: ExportDataColumnKey,
  colX: number,
  colWidth: number
): void {
  const { group, rowY, rowHeight, densityConfig } = ctx;
  const { fontSizeCell, cellPaddingX } = densityConfig;

  const isSummary = task.type === "summary";
  // Summary dates/duration are styled lighter and italic, matching the app
  const useSummaryStyle =
    isSummary &&
    (key === "startDate" || key === "endDate" || key === "duration");

  const rawValue = getColumnDisplayValue(task, key);
  if (!rawValue) return; // null = no value, "" = intentionally blank (e.g. milestone end date)

  const availableWidth = colWidth - cellPaddingX * 2;
  const value = truncateToWidth(rawValue, availableWidth, fontSizeCell);

  const text = createSVGEl("text");
  text.setAttribute("x", String(colX + cellPaddingX));
  text.setAttribute("y", String(rowY + rowHeight / 2 + TEXT_BASELINE_OFFSET));
  text.setAttribute(
    "fill",
    useSummaryStyle ? EXPORT_COLORS.textSummary : EXPORT_COLORS.textPrimary
  );
  text.setAttribute("font-family", SVG_FONT_FAMILY);
  text.setAttribute("font-size", String(fontSizeCell));
  if (useSummaryStyle) {
    text.setAttribute("font-style", "italic");
  }
  text.textContent = value;
  group.appendChild(text);
}

// ─── Private row renderer ─────────────────────────────────────────────────────

/** Shared rendering options forwarded to every row renderer. */
interface RowRendererOptions {
  selectedColumns: ExportColumnKey[];
  columnWidths: Record<string, number>;
  density: UiDensity;
  densityConfig: DensityConfig;
  colorModeState: ColorModeState;
  allTasks: Task[];
  totalWidth: number;
  x: number;
}

function renderTaskRow(
  group: SVGGElement,
  flattenedTask: FlattenedTask,
  rowIndex: number,
  rowY: number,
  options: RowRendererOptions
): void {
  const {
    selectedColumns,
    columnWidths,
    density,
    densityConfig,
    colorModeState,
    allTasks,
    totalWidth,
    x,
  } = options;
  const { rowHeight } = densityConfig;
  const { task } = flattenedTask;
  const ctx: CellRenderContext = { group, rowY, rowHeight, densityConfig };

  // Row bottom border
  const rowBorder = createSVGEl("line");
  rowBorder.setAttribute("x1", String(x));
  rowBorder.setAttribute("y1", String(rowY + rowHeight));
  rowBorder.setAttribute("x2", String(x + totalWidth));
  rowBorder.setAttribute("y2", String(rowY + rowHeight));
  rowBorder.setAttribute("stroke", EXPORT_COLORS.borderLight);
  rowBorder.setAttribute("stroke-width", "1");
  group.appendChild(rowBorder);

  let colX = x;
  for (const key of selectedColumns) {
    const colWidth = columnWidths[key] ?? getDefaultColumnWidth(key, density);

    if (key === "color") {
      renderColorCell(ctx, task, allTasks, colorModeState, colX, colWidth);
    } else if (key === "name") {
      renderNameCell(ctx, task, flattenedTask, rowIndex, colX, colWidth);
    } else {
      // key is narrowed to ExportDataColumnKey by the preceding guards
      renderDataCell(ctx, task, key as ExportDataColumnKey, colX, colWidth);
    }

    // Column separator (skip for color column — matches app styling)
    if (key !== "color") {
      group.appendChild(
        createColumnSeparatorLine(
          colX + colWidth,
          rowY,
          rowY + rowHeight,
          EXPORT_COLORS.borderLight
        )
      );
    }

    colX += colWidth;
  }
}

// ─── Private header cell renderer ─────────────────────────────────────────────

function renderHeaderCell(
  group: SVGGElement,
  key: ExportColumnKey,
  colX: number,
  colWidth: number,
  y: number,
  cellPaddingX: number
): void {
  const label = HEADER_LABELS[key] ?? "";

  // Column header text — matches app: text-xs font-semibold uppercase tracking-wider
  if (label) {
    const text = createSVGEl("text");
    text.setAttribute("x", String(colX + cellPaddingX));
    text.setAttribute(
      "y",
      String(y + HEADER_HEIGHT / 2 + TEXT_BASELINE_OFFSET)
    );
    text.setAttribute("fill", EXPORT_COLORS.textHeader);
    text.setAttribute("font-family", SVG_FONT_FAMILY);
    text.setAttribute("font-size", String(COLUMN_HEADER_FONT_SIZE));
    // "bold" for svg2pdf.js compatibility (doesn't support font-weight "600")
    text.setAttribute("font-weight", "bold");
    text.setAttribute("letter-spacing", "0.05em");
    text.textContent = label.toUpperCase();
    group.appendChild(text);
  }

  // Column separator (skip for color column — matches app styling)
  if (key !== "color") {
    group.appendChild(
      createColumnSeparatorLine(
        colX + colWidth,
        y,
        y + HEADER_HEIGHT,
        EXPORT_COLORS.border
      )
    );
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Options for renderTaskTableHeader. */
export interface TaskTableHeaderOptions {
  selectedColumns: ExportColumnKey[];
  columnWidths: Record<string, number>;
  totalWidth: number;
  x: number;
  y: number;
  density: UiDensity;
}

/**
 * Render task table header as SVG elements.
 *
 * @param svg - The parent SVG element to append to
 * @param options - Layout and column configuration
 * @returns The created group element
 */
export function renderTaskTableHeader(
  svg: SVGSVGElement,
  options: TaskTableHeaderOptions
): SVGGElement {
  const { selectedColumns, columnWidths, totalWidth, x, y, density } = options;
  const { cellPaddingX } = DENSITY_CONFIG[density];

  const group = createSVGEl("g");
  group.setAttribute("class", "task-table-header");

  // Header background
  const bg = createSVGEl("rect");
  bg.setAttribute("x", String(x));
  bg.setAttribute("y", String(y));
  bg.setAttribute("width", String(totalWidth));
  bg.setAttribute("height", String(HEADER_HEIGHT));
  bg.setAttribute("fill", EXPORT_COLORS.headerBg);
  group.appendChild(bg);

  // Header bottom border
  const border = createSVGEl("line");
  border.setAttribute("x1", String(x));
  border.setAttribute("y1", String(y + HEADER_HEIGHT));
  border.setAttribute("x2", String(x + totalWidth));
  border.setAttribute("y2", String(y + HEADER_HEIGHT));
  border.setAttribute("stroke", EXPORT_COLORS.border);
  border.setAttribute("stroke-width", "1");
  group.appendChild(border);

  let colX = x;
  for (const key of selectedColumns) {
    const colWidth = columnWidths[key] ?? getDefaultColumnWidth(key, density);
    renderHeaderCell(group, key, colX, colWidth, y, cellPaddingX);
    colX += colWidth;
  }

  svg.appendChild(group);
  return group;
}

/** Options for renderTaskTableRows. */
export interface TaskTableRowsOptions {
  flattenedTasks: FlattenedTask[];
  selectedColumns: ExportColumnKey[];
  columnWidths: Record<string, number>;
  totalWidth: number;
  x: number;
  startY: number;
  density: UiDensity;
  colorModeState: ColorModeState;
}

/**
 * Render task table rows as SVG elements.
 *
 * @param svg - The parent SVG element to append to
 * @param options - Layout, column, and colour configuration
 * @returns The created group element
 */
export function renderTaskTableRows(
  svg: SVGSVGElement,
  options: TaskTableRowsOptions
): SVGGElement {
  const {
    flattenedTasks,
    selectedColumns,
    columnWidths,
    totalWidth,
    x,
    startY,
    density,
    colorModeState,
  } = options;
  const densityConfig = DENSITY_CONFIG[density];
  const { rowHeight } = densityConfig;

  const group = createSVGEl("g");
  group.setAttribute("class", "task-table-rows");

  // Right border for the entire table body
  const tableBorder = createSVGEl("line");
  tableBorder.setAttribute("x1", String(x + totalWidth));
  tableBorder.setAttribute("y1", String(startY));
  tableBorder.setAttribute("x2", String(x + totalWidth));
  tableBorder.setAttribute(
    "y2",
    String(startY + flattenedTasks.length * rowHeight)
  );
  tableBorder.setAttribute("stroke", EXPORT_COLORS.border);
  tableBorder.setAttribute("stroke-width", "1");
  group.appendChild(tableBorder);

  // Pre-extract Task objects for color computation (avoids repeated mapping per row)
  const allTasks = flattenedTasks.map((ft) => ft.task);

  const rowOptions: RowRendererOptions = {
    selectedColumns,
    columnWidths,
    density,
    densityConfig,
    colorModeState,
    allTasks,
    totalWidth,
    x,
  };

  let rowIndex = 0;
  for (const flattenedTask of flattenedTasks) {
    const rowY = startY + rowIndex * rowHeight;
    renderTaskRow(group, flattenedTask, rowIndex, rowY, rowOptions);
    rowIndex++;
  }

  svg.appendChild(group);
  return group;
}

// Re-export FlattenedTask so existing callers that import it from here continue to work
export type { FlattenedTask };
