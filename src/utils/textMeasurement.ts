/**
 * Text measurement utilities for calculating label widths.
 * Used by fitToView and export to ensure labels aren't clipped.
 */

import type { Task } from "../types/chart.types";
import type { TaskLabelPosition } from "../types/preferences.types";

/** Default font family used in the app (matches tailwind.config.js) */
const DEFAULT_FONT_FAMILY =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";

/** 8px gap between task bar and label */
const LABEL_GAP = 8;

/** Maximum extra padding in pixels (prevents excessive padding for very long names) */
const MAX_LABEL_PADDING_PX = 250;

/** Cached canvas context for text measurement */
let measureContext: CanvasRenderingContext2D | null = null;

/**
 * Get or create a cached canvas context for text measurement.
 */
function getMeasureContext(): CanvasRenderingContext2D | null {
  if (!measureContext) {
    // In browser environment
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      measureContext = canvas.getContext("2d");
    }
  }
  return measureContext;
}

/**
 * Measure text width using Canvas API.
 *
 * @param text - The text to measure
 * @param fontSize - Font size in pixels
 * @param fontFamily - Optional font family (defaults to system font)
 * @param fontWeight - Optional font weight (defaults to 400)
 * @param letterSpacing - Optional letter spacing in em units (defaults to 0)
 * @returns Width in pixels, or 0 if measurement fails
 */
export function measureTextWidth(
  text: string,
  fontSize: number,
  fontFamily: string = DEFAULT_FONT_FAMILY,
  fontWeight: number = 400,
  letterSpacing: number = 0
): number {
  if (!text) return 0;

  const ctx = getMeasureContext();
  if (!ctx) {
    // Fallback estimation: ~0.6 of fontSize per character for sans-serif
    return text.length * fontSize * 0.6;
  }

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  let width = ctx.measureText(text).width;

  // Add letter spacing (in em units, so multiply by fontSize)
  if (letterSpacing > 0) {
    width += (text.length - 1) * letterSpacing * fontSize;
  }

  return width;
}

/**
 * Get the maximum label width from a set of tasks.
 *
 * @param tasks - Array of tasks to measure
 * @param fontSize - Font size in pixels
 * @returns Maximum label width in pixels
 */
export function getMaxLabelWidth(tasks: Task[], fontSize: number): number {
  if (tasks.length === 0) return 0;

  let maxWidth = 0;
  for (const task of tasks) {
    const width = measureTextWidth(task.name, fontSize);
    if (width > maxWidth) {
      maxWidth = width;
    }
  }

  return maxWidth;
}

/**
 * Calculate extra padding (in days) needed for task labels.
 *
 * @param tasks - Array of tasks
 * @param labelPosition - Label position setting (before/inside/after/none)
 * @param fontSize - Font size in pixels
 * @param pixelsPerDay - Current pixels per day (based on zoom)
 * @returns Object with leftDays and rightDays padding needed
 */
/** Header font weight (font-semibold = 600) */
const HEADER_FONT_WEIGHT = 600;

/** Header letter spacing in em (tracking-wider = 0.05em) */
const HEADER_LETTER_SPACING = 0.05;

/** Header font size in pixels (text-xs = 12px) */
const HEADER_FONT_SIZE = 12;

/** Header horizontal padding in pixels (px-3 = 12px each side = 24px total) */
const HEADER_PADDING = 24;

/**
 * Calculate optimal column width based on header and cell content.
 * This is a pure utility function used by both autoFitColumn and export.
 *
 * Headers are styled with: text-xs (12px), font-semibold (600), uppercase, tracking-wider (0.05em), px-3 (24px)
 *
 * @param headerLabel - Column header text
 * @param cellValues - Array of formatted cell values
 * @param fontSize - Font size in pixels for cells
 * @param cellPadding - Total horizontal padding (left + right) for cells
 * @param extraWidths - Array of extra widths per cell (e.g., for indent, icons)
 * @returns Optimal column width in pixels
 */
export function calculateColumnWidth(
  headerLabel: string,
  cellValues: string[],
  fontSize: number,
  cellPadding: number,
  extraWidths: number[] = []
): number {
  // Measure header text width (uppercase, semibold, with letter-spacing)
  // Add header padding (px-3 = 24px) which may be larger than cell padding
  const headerTextWidth = measureTextWidth(
    headerLabel.toUpperCase(),
    HEADER_FONT_SIZE,
    DEFAULT_FONT_FAMILY,
    HEADER_FONT_WEIGHT,
    HEADER_LETTER_SPACING
  );
  const headerWidth = headerTextWidth + HEADER_PADDING;

  // Measure each cell value with cell padding
  let maxCellWidth = 0;
  cellValues.forEach((value, index) => {
    let textWidth = measureTextWidth(value, fontSize);
    // Add extra width for this cell (e.g., indent + icons for name column)
    if (extraWidths[index]) {
      textWidth += extraWidths[index];
    }
    maxCellWidth = Math.max(maxCellWidth, textWidth + cellPadding);
  });

  // Take the larger of header width and max cell width
  const maxWidth = Math.max(headerWidth, maxCellWidth);

  // Add small buffer, cap at 600px, minimum 60px
  const finalWidth = Math.max(60, Math.ceil(maxWidth + 4));
  return Math.min(finalWidth, 600);
}

export function calculateLabelPaddingDays(
  tasks: Task[],
  labelPosition: TaskLabelPosition,
  fontSize: number,
  pixelsPerDay: number
): { leftDays: number; rightDays: number } {
  if (tasks.length === 0 || pixelsPerDay <= 0) {
    return { leftDays: 0, rightDays: 0 };
  }

  // Separate tasks by their effective label position
  // Summary/Milestone tasks always use "after" when setting is "inside"
  const tasksWithAfterLabels: Task[] = [];
  const tasksWithBeforeLabels: Task[] = [];

  for (const task of tasks) {
    const taskType = task.type || "task";
    let effectivePosition = labelPosition;

    // Summary and Milestone don't support "inside" - they use "after" instead
    if (
      (taskType === "summary" || taskType === "milestone") &&
      labelPosition === "inside"
    ) {
      effectivePosition = "after";
    }

    if (effectivePosition === "after") {
      tasksWithAfterLabels.push(task);
    } else if (effectivePosition === "before") {
      tasksWithBeforeLabels.push(task);
    }
    // "inside" and "none" don't need padding
  }

  let leftDays = 0;
  let rightDays = 0;

  // Calculate padding for "before" labels (extends left)
  if (tasksWithBeforeLabels.length > 0) {
    const maxWidth = getMaxLabelWidth(tasksWithBeforeLabels, fontSize);
    const totalPadding = Math.min(maxWidth + LABEL_GAP, MAX_LABEL_PADDING_PX);
    leftDays = Math.ceil(totalPadding / pixelsPerDay);
  }

  // Calculate padding for "after" labels (extends right)
  if (tasksWithAfterLabels.length > 0) {
    const maxWidth = getMaxLabelWidth(tasksWithAfterLabels, fontSize);
    const totalPadding = Math.min(maxWidth + LABEL_GAP, MAX_LABEL_PADDING_PX);
    rightDays = Math.ceil(totalPadding / pixelsPerDay);
  }

  return { leftDays, rightDays };
}
