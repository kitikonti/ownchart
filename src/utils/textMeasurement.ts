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
 * @returns Width in pixels, or 0 if measurement fails
 */
export function measureTextWidth(
  text: string,
  fontSize: number,
  fontFamily: string = DEFAULT_FONT_FAMILY
): number {
  if (!text) return 0;

  const ctx = getMeasureContext();
  if (!ctx) {
    // Fallback estimation: ~0.6 of fontSize per character for sans-serif
    return text.length * fontSize * 0.6;
  }

  ctx.font = `${fontSize}px ${fontFamily}`;
  return ctx.measureText(text).width;
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
/**
 * Calculate optimal column width based on header and cell content.
 * This is a pure utility function used by both autoFitColumn and export.
 *
 * @param headerLabel - Column header text
 * @param cellValues - Array of formatted cell values
 * @param fontSize - Font size in pixels for cells
 * @param cellPadding - Total horizontal padding (left + right)
 * @param extraWidths - Array of extra widths per cell (e.g., for indent, icons)
 * @param headerFontSize - Font size for header (defaults to fontSize)
 * @returns Optimal column width in pixels
 */
export function calculateColumnWidth(
  headerLabel: string,
  cellValues: string[],
  fontSize: number,
  cellPadding: number,
  extraWidths: number[] = [],
  headerFontSize: number = fontSize
): number {
  // Measure header text width
  let maxWidth = measureTextWidth(headerLabel, headerFontSize);

  // Measure each cell value
  cellValues.forEach((value, index) => {
    let textWidth = measureTextWidth(value, fontSize);
    // Add extra width for this cell (e.g., indent + icons for name column)
    if (extraWidths[index]) {
      textWidth += extraWidths[index];
    }
    maxWidth = Math.max(maxWidth, textWidth);
  });

  // Add padding and buffer, cap at 600px
  const finalWidth = Math.max(60, Math.ceil(maxWidth + cellPadding + 4));
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
