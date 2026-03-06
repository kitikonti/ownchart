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
  BORDER_STROKE_WIDTH,
  LETTER_SPACING_WIDER,
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

interface TextElOptions {
  x: number;
  y: number;
  fill: string;
  fontSize: number;
  content: string;
  fontWeight?: string;
  fontStyle?: string;
  letterSpacing?: string;
}

/** Create and configure an SVG <text> element with common export attributes. */
function createTextEl({
  x,
  y,
  fill,
  fontSize,
  content,
  fontWeight,
  fontStyle,
  letterSpacing,
}: TextElOptions): SVGTextElement {
  const el = createSVGEl("text");
  el.setAttribute("x", String(x));
  el.setAttribute("y", String(y));
  el.setAttribute("fill", fill);
  el.setAttribute("font-family", SVG_FONT_FAMILY);
  el.setAttribute("font-size", String(fontSize));
  if (fontWeight !== undefined) el.setAttribute("font-weight", fontWeight);
  if (fontStyle !== undefined) el.setAttribute("font-style", fontStyle);
  if (letterSpacing !== undefined)
    el.setAttribute("letter-spacing", letterSpacing);
  el.textContent = content;
  return el;
}

// ─── Border line helper ───────────────────────────────────────────────────────

/** Create an SVG <line> element for a table border or column separator. */
function createBorderLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
): SVGLineElement {
  const line = createSVGEl("line");
  line.setAttribute("x1", String(x1));
  line.setAttribute("y1", String(y1));
  line.setAttribute("x2", String(x2));
  line.setAttribute("y2", String(y2));
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-width", BORDER_STROKE_WIDTH);
  return line;
}

// ─── Type guard ───────────────────────────────────────────────────────────────

/** Narrow ExportColumnKey to ExportDataColumnKey (i.e. not 'color' or 'name'). */
function isDataColumn(key: ExportColumnKey): key is ExportDataColumnKey {
  return key !== "color" && key !== "name";
}

// ─── Cell render context ──────────────────────────────────────────────────────

/** Shared state forwarded to every private cell renderer for a single row. */
interface CellRenderContext {
  group: SVGGElement;
  rowY: number;
  rowHeight: number;
  densityConfig: DensityConfig;
}

/** Cell position and dimensions, forwarded to each private cell renderer. */
interface CellLayout {
  colX: number;
  colWidth: number;
}

// ─── Name cell sub-renderers ──────────────────────────────────────────────────

function renderNameArrow(group: SVGGElement, textY: number, atX: number): void {
  group.appendChild(
    createTextEl({
      x: atX,
      y: textY,
      fill: EXPORT_COLORS.textSecondary,
      fontSize: ARROW_FONT_SIZE,
      content: "▼",
    })
  );
}

function renderTypeIcon(
  group: SVGGElement,
  task: Task,
  atX: number,
  iconY: number
): void {
  const iconGroup = createSVGEl("g");
  iconGroup.setAttribute(
    "transform",
    `translate(${atX}, ${iconY}) scale(${ICON_SCALE})`
  );
  const iconPath = createSVGEl("path");
  iconPath.setAttribute("fill", EXPORT_COLORS.textSecondary);
  // task.type is optional; fall back to "task" icon when absent.
  iconPath.setAttribute("d", TASK_TYPE_ICON_PATHS[task.type ?? "task"]);
  iconGroup.appendChild(iconPath);
  group.appendChild(iconGroup);
}

function renderNameText(
  group: SVGGElement,
  task: Task,
  rowIndex: number,
  textY: number,
  atX: number,
  availableWidth: number,
  fontSize: number
): void {
  const rawName = task.name || `Task ${rowIndex + 1}`;
  const displayName = truncateToWidth(rawName, availableWidth, fontSize);
  group.appendChild(
    createTextEl({
      x: atX,
      y: textY,
      fill: EXPORT_COLORS.textPrimary,
      fontSize,
      content: displayName,
    })
  );
}

// ─── Private cell renderers ───────────────────────────────────────────────────

function renderColorCell(
  ctx: CellRenderContext,
  task: Task,
  allTasks: Task[],
  colorModeState: ColorModeState,
  layout: CellLayout
): void {
  const { group, rowY, rowHeight, densityConfig } = ctx;
  const { colX, colWidth } = layout;
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
  layout: CellLayout
): void {
  const { group, rowY, rowHeight, densityConfig } = ctx;
  const { colX, colWidth } = layout;
  const { level, hasChildren } = flattenedTask;
  const { indentSize, fontSizeCell, cellPaddingX } = densityConfig;
  const textY = rowY + rowHeight / 2 + TEXT_BASELINE_OFFSET;

  let currentX = colX + level * indentSize;

  // Expand/collapse arrow for summary tasks with children
  if (hasChildren && task.type === "summary") {
    renderNameArrow(group, textY, currentX);
  }
  // Reserve space for the arrow placeholder (ARROW_PLACEHOLDER_WIDTH = w-4 = 16px)
  currentX += ARROW_PLACEHOLDER_WIDTH;

  // Task type icon — Phosphor Icons, 256×256 viewBox, scaled to ICON_RENDER_SIZE
  const iconY = rowY + (rowHeight - ICON_RENDER_SIZE) / 2;
  renderTypeIcon(group, task, currentX, iconY);

  // Advance past icon (ICON_RENDER_SIZE) + gap (ICON_TEXT_GAP)
  currentX += ICON_RENDER_SIZE + ICON_TEXT_GAP;

  // Task name — truncated to remaining available column width
  const availableWidth = colX + colWidth - currentX - cellPaddingX;
  renderNameText(
    group,
    task,
    rowIndex,
    textY,
    currentX,
    availableWidth,
    fontSizeCell
  );
}

function renderDataCell(
  ctx: CellRenderContext,
  task: Task,
  key: ExportDataColumnKey,
  layout: CellLayout
): void {
  const { group, rowY, rowHeight, densityConfig } = ctx;
  const { colX, colWidth } = layout;
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

  group.appendChild(
    createTextEl({
      x: colX + cellPaddingX,
      y: rowY + rowHeight / 2 + TEXT_BASELINE_OFFSET,
      fill: useSummaryStyle
        ? EXPORT_COLORS.textSummary
        : EXPORT_COLORS.textPrimary,
      fontSize: fontSizeCell,
      content: value,
      fontStyle: useSummaryStyle ? "italic" : undefined,
    })
  );
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
  group.appendChild(
    createBorderLine(
      x,
      rowY + rowHeight,
      x + totalWidth,
      rowY + rowHeight,
      EXPORT_COLORS.borderLight
    )
  );

  let colX = x;
  for (const key of selectedColumns) {
    const colWidth = columnWidths[key] ?? getDefaultColumnWidth(key, density);
    const layout: CellLayout = { colX, colWidth };

    if (key === "color") {
      renderColorCell(ctx, task, allTasks, colorModeState, layout);
    } else if (key === "name") {
      renderNameCell(ctx, task, flattenedTask, rowIndex, layout);
    } else if (isDataColumn(key)) {
      renderDataCell(ctx, task, key, layout);
    }

    // Column separator (skip for color column — matches app styling)
    if (key !== "color") {
      group.appendChild(
        createBorderLine(
          colX + colWidth,
          rowY,
          colX + colWidth,
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
  layout: CellLayout,
  y: number,
  cellPaddingX: number
): void {
  const { colX, colWidth } = layout;
  const label = HEADER_LABELS[key] ?? "";

  // Column header text — matches app: text-xs font-semibold uppercase tracking-wider
  if (label) {
    group.appendChild(
      createTextEl({
        x: colX + cellPaddingX,
        y: y + HEADER_HEIGHT / 2 + TEXT_BASELINE_OFFSET,
        fill: EXPORT_COLORS.textHeader,
        fontSize: COLUMN_HEADER_FONT_SIZE,
        content: label.toUpperCase(),
        // "bold" for svg2pdf.js compatibility (doesn't support font-weight "600")
        fontWeight: "bold",
        letterSpacing: LETTER_SPACING_WIDER,
      })
    );
  }

  // Column separator (skip for color column — matches app styling)
  if (key !== "color") {
    group.appendChild(
      createBorderLine(
        colX + colWidth,
        y,
        colX + colWidth,
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
  group.appendChild(
    createBorderLine(
      x,
      y + HEADER_HEIGHT,
      x + totalWidth,
      y + HEADER_HEIGHT,
      EXPORT_COLORS.border
    )
  );

  let colX = x;
  for (const key of selectedColumns) {
    const colWidth = columnWidths[key] ?? getDefaultColumnWidth(key, density);
    renderHeaderCell(group, key, { colX, colWidth }, y, cellPaddingX);
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

function buildRowOptions(
  options: TaskTableRowsOptions,
  densityConfig: DensityConfig,
  allTasks: Task[]
): RowRendererOptions {
  return {
    selectedColumns: options.selectedColumns,
    columnWidths: options.columnWidths,
    density: options.density,
    densityConfig,
    colorModeState: options.colorModeState,
    allTasks,
    totalWidth: options.totalWidth,
    x: options.x,
  };
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
  const { flattenedTasks, x, startY, density } = options;
  const densityConfig = DENSITY_CONFIG[density];
  const { rowHeight } = densityConfig;

  const group = createSVGEl("g");
  group.setAttribute("class", "task-table-rows");

  // Right border for the entire table body
  group.appendChild(
    createBorderLine(
      x + options.totalWidth,
      startY,
      x + options.totalWidth,
      startY + flattenedTasks.length * rowHeight,
      EXPORT_COLORS.border
    )
  );

  // Pre-extract Task objects for color computation (avoids repeated mapping per row)
  const allTasks = flattenedTasks.map((ft) => ft.task);
  const rowOptions = buildRowOptions(options, densityConfig, allTasks);

  flattenedTasks.forEach((flattenedTask, rowIndex) => {
    const rowY = startY + rowIndex * rowHeight;
    renderTaskRow(group, flattenedTask, rowIndex, rowY, rowOptions);
  });

  svg.appendChild(group);
  return group;
}
