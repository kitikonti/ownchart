/**
 * Text measurement utilities for calculating label widths.
 * Used by fitToView and export to ensure labels aren't clipped.
 */

import type { Task } from "../types/chart.types";
import type { TaskLabelPosition } from "../types/preferences.types";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default font family used in the app (matches tailwind.config.js) */
const DEFAULT_FONT_FAMILY =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";

/** 8px gap between task bar and label */
const LABEL_GAP = 8;

/** Maximum extra padding in pixels (prevents excessive padding for very long names) */
const MAX_LABEL_PADDING_PX = 250;

/**
 * Fallback character-width ratio used when the Canvas API is unavailable
 * (e.g. server-side rendering or test environments without a real DOM).
 * Approximates ~0.6× fontSize per character for a typical sans-serif font.
 */
const FALLBACK_CHAR_WIDTH_RATIO = 0.6;

/** Minimum column width in pixels */
const MIN_COLUMN_WIDTH_PX = 60;

/** Maximum column width in pixels */
const MAX_COLUMN_WIDTH_PX = 600;

/** Small buffer added to measured widths to prevent text clipping */
const COLUMN_WIDTH_BUFFER_PX = 4;

/** Header font weight (font-semibold = 600) */
const HEADER_FONT_WEIGHT = 600;

/** Header letter spacing in em (tracking-wider = 0.05em) */
const HEADER_LETTER_SPACING = 0.05;

/** Header font size in pixels (text-xs = 12px) */
const HEADER_FONT_SIZE = 12;

/** Header horizontal padding in pixels (px-3 = 12px each side = 24px total) */
const HEADER_PADDING = 24;

// ─── Canvas context cache ─────────────────────────────────────────────────────

/** Cached canvas context for text measurement */
let measureContext: CanvasRenderingContext2D | null = null;

/**
 * True once a canvas creation attempt has failed in this environment.
 * Prevents allocating a new <canvas> element on every measureTextWidth call
 * when the Canvas API is permanently unavailable (e.g. certain SSR contexts
 * or environments where getContext("2d") returns null).
 */
let canvasUnavailable = false;

/**
 * Get or create a cached canvas context for text measurement.
 * Returns null when running outside a browser environment or when the
 * Canvas 2D API is not supported.
 */
function getMeasureContext(): CanvasRenderingContext2D | null {
  if (measureContext) return measureContext;
  if (canvasUnavailable) return null;

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      measureContext = ctx;
    } else {
      canvasUnavailable = true;
    }
  } else {
    canvasUnavailable = true;
  }

  return measureContext;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Compute the padding days required for one side of the chart, based on the
 * maximum label width in the given task list.
 * Returns 0 for an empty task list.
 */
function computeOneSidePaddingDays(
  tasks: Task[],
  fontSize: number,
  pixelsPerDay: number
): number {
  if (tasks.length === 0) return 0;
  const maxWidth = getMaxLabelWidth(tasks, fontSize);
  const totalPadding = Math.min(maxWidth + LABEL_GAP, MAX_LABEL_PADDING_PX);
  return Math.ceil(totalPadding / pixelsPerDay);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Measure text width using the Canvas API.
 *
 * Falls back to a character-count heuristic when the Canvas API is unavailable.
 *
 * @param text - The text to measure
 * @param fontSize - Font size in pixels
 * @param fontFamily - Font family string (defaults to the app's system font stack)
 * @param fontWeight - Font weight (defaults to 400)
 * @param letterSpacing - Letter spacing in em units (defaults to 0)
 * @returns Width in pixels, or 0 for an empty string
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
    // Fallback estimation when Canvas API is unavailable (e.g. SSR, test environments)
    return text.length * fontSize * FALLBACK_CHAR_WIDTH_RATIO;
  }

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  let width = ctx.measureText(text).width;

  // Add letter spacing (in em units, so multiply by fontSize).
  // Applied to n-1 gaps between n characters, matching CSS letter-spacing behaviour.
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
 * @returns Maximum label width in pixels, or 0 for an empty array
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
 * Calculate optimal column width based on header and cell content.
 * This is a pure utility function used by both autoFitColumn and export.
 *
 * Headers are styled with: text-xs (12px), font-semibold (600), uppercase,
 * tracking-wider (0.05em), px-3 (24px horizontal padding).
 *
 * @param headerLabel - Column header text (will be uppercased internally)
 * @param cellValues - Array of formatted cell values
 * @param fontSize - Font size in pixels for cell text
 * @param cellPadding - Total horizontal cell padding in pixels (left + right)
 * @param extraWidths - Per-cell extra widths (e.g. indent + icons for the name column)
 * @returns Optimal column width in pixels, clamped to [MIN_COLUMN_WIDTH_PX, MAX_COLUMN_WIDTH_PX]
 */
export function calculateColumnWidth(
  headerLabel: string,
  cellValues: string[],
  fontSize: number,
  cellPadding: number,
  extraWidths: number[] = []
): number {
  // Measure header width (uppercase, semibold, letter-spaced) + header padding
  const headerTextWidth = measureTextWidth(
    headerLabel.toUpperCase(),
    HEADER_FONT_SIZE,
    DEFAULT_FONT_FAMILY,
    HEADER_FONT_WEIGHT,
    HEADER_LETTER_SPACING
  );
  const headerWidth = headerTextWidth + HEADER_PADDING;

  // Measure each cell, accumulating the maximum.
  // extraWidths[i] ?? 0 safely handles sparse arrays and missing entries.
  let maxCellWidth = 0;
  for (let i = 0; i < cellValues.length; i++) {
    const textWidth =
      measureTextWidth(cellValues[i], fontSize) + (extraWidths[i] ?? 0);
    maxCellWidth = Math.max(maxCellWidth, textWidth + cellPadding);
  }

  const rawWidth = Math.max(headerWidth, maxCellWidth);

  // Add buffer, clamp to [MIN_COLUMN_WIDTH_PX, MAX_COLUMN_WIDTH_PX]
  return Math.min(
    Math.max(MIN_COLUMN_WIDTH_PX, Math.ceil(rawWidth + COLUMN_WIDTH_BUFFER_PX)),
    MAX_COLUMN_WIDTH_PX
  );
}

/**
 * Calculate extra padding (in days) needed to prevent task labels from being clipped.
 *
 * Labels positioned "before" a task bar extend left; labels positioned "after" extend
 * right. Summary and Milestone tasks always use "after" when the global setting is
 * "inside" (they don't support inner labels).
 *
 * @param tasks - Array of tasks
 * @param labelPosition - Global label position setting
 * @param fontSize - Font size in pixels
 * @param pixelsPerDay - Current pixels-per-day at the active zoom level
 * @returns `{ leftDays, rightDays }` — extra padding days on each side
 */
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
  const tasksWithAfterLabels: Task[] = [];
  const tasksWithBeforeLabels: Task[] = [];

  for (const task of tasks) {
    const taskType = task.type || "task";
    let effectivePosition = labelPosition;

    // Summary and Milestone don't support "inside" — fall back to "after"
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
    // "inside" and "none" don't require extra padding
  }

  return {
    leftDays: computeOneSidePaddingDays(
      tasksWithBeforeLabels,
      fontSize,
      pixelsPerDay
    ),
    rightDays: computeOneSidePaddingDays(
      tasksWithAfterLabels,
      fontSize,
      pixelsPerDay
    ),
  };
}
