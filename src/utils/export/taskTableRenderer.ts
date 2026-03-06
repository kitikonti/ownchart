/**
 * Shared task table rendering for SVG/PDF export.
 * Renders the task list portion of exports as native SVG elements.
 */

import type { Task } from "../../types/chart.types";
import type { HexColor } from "../../types/branded.types";
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
import { computeAllTaskColors } from "../computeTaskColor";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Fallback label prefix for tasks without a name, e.g. "Task 1", "Task 2". */
const UNNAMED_TASK_PREFIX = "Task";

/**
 * Columns that require custom rendering (not handled by getColumnDisplayValue).
 * When ExportColumnKey gains a new special-case column, add it here AND update
 * ExportDataColumnKey in types.ts.
 */
const SPECIAL_CASE_COLUMNS = new Set<ExportColumnKey>(["color", "name"]);

/**
 * Expand/collapse indicator for summary tasks with children.
 * Defined as a named constant so source and tests reference the same symbol —
 * a future icon change only needs to happen here.
 */
const EXPAND_ARROW_CHAR = "▼";

/**
 * Data columns that receive lighter/italic styling for summary task rows,
 * matching the app's rendering of computed summary date ranges.
 * When ExportDataColumnKey gains a new date-like column, add it here.
 */
const SUMMARY_DATE_COLUMNS = new Set<ExportDataColumnKey>([
  "startDate",
  "endDate",
  "duration",
]);

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

// ─── Column separator helper ──────────────────────────────────────────────────

/** Position and span of a vertical column separator line. */
interface SeparatorOptions {
  colX: number;
  colWidth: number;
  startY: number;
  height: number;
  color: string;
}

/**
 * Render a vertical column separator at the right edge of a cell.
 * No-ops for the color column — matches app styling where the color
 * swatch column has no right border.
 */
function renderColumnSeparator(
  group: SVGGElement,
  key: ExportColumnKey,
  opts: SeparatorOptions
): void {
  if (key === "color") return;
  group.appendChild(
    createBorderLine(
      opts.colX + opts.colWidth,
      opts.startY,
      opts.colX + opts.colWidth,
      opts.startY + opts.height,
      opts.color
    )
  );
}

// ─── Column width resolver ────────────────────────────────────────────────────

/**
 * Resolve the rendered width for a column: uses the caller-provided override
 * when present, otherwise falls back to the density-specific default.
 */
function resolveColumnWidth(
  key: ExportColumnKey,
  columnWidths: Record<string, number>,
  density: UiDensity
): number {
  return columnWidths[key] ?? getDefaultColumnWidth(key, density);
}

// ─── Type guard ───────────────────────────────────────────────────────────────

/**
 * Narrow ExportColumnKey to ExportDataColumnKey (i.e. not in SPECIAL_CASE_COLUMNS).
 * Invariant: ExportDataColumnKey === Exclude<ExportColumnKey, 'color' | 'name'>.
 * If ExportColumnKey gains new special-case columns, update SPECIAL_CASE_COLUMNS
 * and ExportDataColumnKey in types.ts.
 */
function isDataColumn(key: ExportColumnKey): key is ExportDataColumnKey {
  return !SPECIAL_CASE_COLUMNS.has(key);
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
      content: EXPAND_ARROW_CHAR,
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

/** Options for the renderNameText sub-renderer. */
interface NameTextOptions {
  group: SVGGElement;
  task: Task;
  rowIndex: number;
  textY: number;
  atX: number;
  availableWidth: number;
  fontSize: number;
}

function renderNameText({
  group,
  task,
  rowIndex,
  textY,
  atX,
  availableWidth,
  fontSize,
}: NameTextOptions): void {
  // Export-local numbering: intentionally uses the row's position within the exported
  // subset, not globalRowNumber — fallback names read "Task 1, 2, 3 …" sequentially.
  const rawName = task.name || `${UNNAMED_TASK_PREFIX} ${rowIndex + 1}`;
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
  color: HexColor,
  layout: CellLayout
): void {
  const { group, rowY, rowHeight, densityConfig } = ctx;
  const { colX, colWidth } = layout;

  const colorBar = createSVGEl("rect");
  colorBar.setAttribute("x", String(colX + (colWidth - COLOR_BAR_WIDTH) / 2));
  colorBar.setAttribute(
    "y",
    String(rowY + (rowHeight - densityConfig.colorBarHeight) / 2)
  );
  colorBar.setAttribute("width", String(COLOR_BAR_WIDTH));
  colorBar.setAttribute("height", String(densityConfig.colorBarHeight));
  colorBar.setAttribute("rx", String(COLOR_BAR_RADIUS));
  colorBar.setAttribute("fill", color);
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
  renderNameText({
    group,
    task,
    rowIndex,
    textY,
    atX: currentX,
    availableWidth,
    fontSize: fontSizeCell,
  });
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
  // When adding a date-like ExportDataColumnKey, add it to SUMMARY_DATE_COLUMNS above.
  const useSummaryStyle = isSummary && SUMMARY_DATE_COLUMNS.has(key);

  const rawValue = getColumnDisplayValue(task, key);
  if (!rawValue) return; // skip — null (no value) or "" (intentionally blank, e.g. milestone end date)

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
  /**
   * Caller-provided column-width overrides (may include keys beyond ExportColumnKey).
   * Falls back to density-specific defaults via resolveColumnWidth for any missing key.
   */
  columnWidths: Record<string, number>;
  density: UiDensity;
  densityConfig: DensityConfig;
  /** Pre-computed per-task colors — avoids O(n²) color computation in auto modes. */
  colorCache: Map<string, HexColor>;
  totalWidth: number;
  x: number;
}

/** Render all cell columns for a single row, advancing colX across selected columns. */
function renderRowCells(
  ctx: CellRenderContext,
  flattenedTask: FlattenedTask,
  rowIndex: number,
  options: RowRendererOptions
): void {
  const { selectedColumns, columnWidths, density, colorCache, x } = options;
  const { task } = flattenedTask;

  let colX = x;
  for (const key of selectedColumns) {
    const colWidth = resolveColumnWidth(key, columnWidths, density);
    const layout: CellLayout = { colX, colWidth };

    if (key === "color") {
      // colorCache always contains every exported task; fallback guards against gaps.
      const color = colorCache.get(task.id) ?? task.color;
      renderColorCell(ctx, color, layout);
    } else if (key === "name") {
      renderNameCell(ctx, task, flattenedTask, rowIndex, layout);
    } else if (isDataColumn(key)) {
      renderDataCell(ctx, task, key, layout);
    }

    renderColumnSeparator(ctx.group, key, {
      colX,
      colWidth,
      startY: ctx.rowY,
      height: ctx.rowHeight,
      color: EXPORT_COLORS.borderLight,
    });

    colX += colWidth;
  }
}

function renderTaskRow(
  group: SVGGElement,
  flattenedTask: FlattenedTask,
  rowIndex: number,
  rowY: number,
  options: RowRendererOptions
): void {
  const { densityConfig, totalWidth, x } = options;
  const { rowHeight } = densityConfig;
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

  renderRowCells(ctx, flattenedTask, rowIndex, options);
}

// ─── Private header cell renderer ─────────────────────────────────────────────

/** Rendering context passed to each header cell renderer. */
interface HeaderCellContext {
  y: number;
  cellPaddingX: number;
}

function renderHeaderCell(
  group: SVGGElement,
  key: ExportColumnKey,
  layout: CellLayout,
  ctx: HeaderCellContext
): void {
  const { colX, colWidth } = layout;
  const { y, cellPaddingX } = ctx;
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

  renderColumnSeparator(group, key, {
    colX,
    colWidth,
    startY: y,
    height: HEADER_HEIGHT,
    color: EXPORT_COLORS.border,
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Options for renderTaskTableHeader. */
export interface TaskTableHeaderOptions {
  selectedColumns: ExportColumnKey[];
  /**
   * Caller-provided column-width overrides (may include keys beyond ExportColumnKey).
   * Falls back to density-specific defaults for any missing key.
   */
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
  const densityConfig = DENSITY_CONFIG[density];
  const headerCtx: HeaderCellContext = {
    y,
    cellPaddingX: densityConfig.cellPaddingX,
  };

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
    const colWidth = resolveColumnWidth(key, columnWidths, density);
    renderHeaderCell(group, key, { colX, colWidth }, headerCtx);
    colX += colWidth;
  }

  svg.appendChild(group);
  return group;
}

/** Options for renderTaskTableRows. */
export interface TaskTableRowsOptions {
  flattenedTasks: FlattenedTask[];
  selectedColumns: ExportColumnKey[];
  /**
   * Caller-provided column-width overrides (may include keys beyond ExportColumnKey).
   * Falls back to density-specific defaults for any missing key.
   */
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
  colorCache: Map<string, HexColor>
): RowRendererOptions {
  return {
    selectedColumns: options.selectedColumns,
    columnWidths: options.columnWidths,
    density: options.density,
    densityConfig,
    colorCache,
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
  const { flattenedTasks, x, startY, density, colorModeState } = options;
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

  // Pre-compute all task colors in one pass — avoids O(n²) per-row color
  // computation in non-manual modes (theme/hierarchy/summary call expensive
  // shared operations that are O(n) each if recomputed inside the render loop).
  const allTasks = flattenedTasks.map((ft) => ft.task);
  const colorCache = computeAllTaskColors(allTasks, colorModeState);
  const rowOptions = buildRowOptions(options, densityConfig, colorCache);

  for (const [rowIndex, flattenedTask] of flattenedTasks.entries()) {
    const rowY = startY + rowIndex * rowHeight;
    renderTaskRow(group, flattenedTask, rowIndex, rowY, rowOptions);
  }

  svg.appendChild(group);
  return group;
}
