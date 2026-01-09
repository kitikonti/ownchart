/**
 * PDF Renderer for Gantt Chart.
 * Renders all chart elements to jsPDF.
 */

import { jsPDF } from "jspdf";
import type { Task } from "../../types/chart.types";
import type { Dependency } from "../../types/dependency.types";
import type { TimelineScale } from "../timelineUtils";
import type { ExportOptions, PdfExportOptions } from "./types";
import {
  pxToMm,
  hexToRgb,
  toGrayscale,
  truncateText,
  type PdfColor,
} from "./pdfLayout";
import { calculateDuration, formatDate } from "../dateUtils";
import { getUnitStart, addUnit } from "../timelineUtils";
import {
  TASK_RENDER_CONSTANTS,
  SUMMARY_RENDER_CONSTANTS,
  LABEL_RENDER_CONSTANTS,
  DEPENDENCY_RENDER_CONSTANTS,
  RENDER_COLORS,
  calculateMilestoneSize,
  getScaledCornerRadius,
} from "./renderConstants";

/** Rendering context passed to all render functions */
export interface PdfRenderContext {
  doc: jsPDF;
  scale: TimelineScale;
  tasks: Task[];
  dependencies: Dependency[];
  options: ExportOptions;
  pdfOptions: PdfExportOptions;
  projectName?: string;

  // Layout dimensions (all in mm)
  chartX: number; // Chart origin X (after margins + task table)
  chartY: number; // Chart origin Y (after margins + header)
  chartWidthMm: number; // Chart content width
  chartHeightMm: number; // Chart content height
  taskTableWidthMm: number; // Left panel width

  // Row configuration
  rowHeightMm: number;
  taskBarHeightMm: number;
  headerHeightMm: number;

  // Scale factor (from fit-to-page or custom)
  scaleFactor: number;
}

/** Colors used in PDF rendering - using shared render constants */
const COLORS = {
  grid: RENDER_COLORS.gridLine,
  weekend: RENDER_COLORS.weekendBackground,
  holiday: RENDER_COLORS.holidayBackground,
  today: RENDER_COLORS.todayMarker,
  taskDefault: RENDER_COLORS.taskDefault,
  text: RENDER_COLORS.tableText,
  textLight: RENDER_COLORS.tableHeaderText,
  textExternal: RENDER_COLORS.textExternal,
  textInternal: RENDER_COLORS.textInternal,
  dependency: RENDER_COLORS.dependency,
  headerBackground: RENDER_COLORS.headerBackground,
};

/**
 * Get color for PDF, optionally converting to grayscale.
 */
function getColor(hex: string, grayscale: boolean): PdfColor {
  const color = hexToRgb(hex);
  return grayscale ? toGrayscale(color) : color;
}

/**
 * Render the entire chart to PDF.
 */
export async function renderChartToPdf(
  ctx: PdfRenderContext,
  onProgress?: (progress: number) => void
): Promise<void> {
  const { options } = ctx;

  onProgress?.(10);

  // Render background layer (weekends, holidays)
  if (options.includeWeekends) {
    renderBackgroundLayer(ctx);
  }
  onProgress?.(20);

  // Render grid lines
  if (options.includeGridLines) {
    renderGridLayer(ctx);
  }
  onProgress?.(30);

  // Render today marker (behind tasks)
  if (options.includeTodayMarker) {
    renderTodayMarker(ctx);
  }
  onProgress?.(40);

  // Render timeline header
  if (options.includeHeader) {
    renderTimelineHeader(ctx);
  }
  onProgress?.(50);

  // Render task bars
  renderTaskLayer(ctx);
  onProgress?.(60);

  // Render task labels
  renderTaskLabels(ctx);
  onProgress?.(70);

  // Render dependencies
  if (options.includeDependencies && ctx.dependencies.length > 0) {
    renderDependencyLayer(ctx);
  }
  onProgress?.(80);

  // Render task table (left panel)
  if (ctx.taskTableWidthMm > 0) {
    renderTaskTable(ctx);
  }
  onProgress?.(90);
}

/**
 * Render weekend and holiday background shading.
 */
function renderBackgroundLayer(ctx: PdfRenderContext): void {
  const { doc, scale, chartX, chartY, chartHeightMm, pdfOptions, scaleFactor } =
    ctx;
  const grayscale = pdfOptions.grayscale;

  // Weekend color - subtle gray background
  const weekendColor = getColor(COLORS.weekend, grayscale);
  doc.setFillColor(weekendColor.r, weekendColor.g, weekendColor.b);

  // Iterate through each day in the scale
  const startDate = new Date(scale.minDate);
  const endDate = new Date(scale.maxDate);
  const currentDate = new Date(startDate);

  // Day width in mm
  const dayWidthMm = pxToMm(scale.pixelsPerDay) * scaleFactor;

  let dayIndex = 0;
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();

    // Weekend: Saturday (6) or Sunday (0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const x = chartX + dayIndex * dayWidthMm;
      doc.rect(x, chartY, dayWidthMm, chartHeightMm, "F");
    }

    currentDate.setDate(currentDate.getDate() + 1);
    dayIndex++;
  }
}

/**
 * Render horizontal grid lines for each row.
 * Matches app's GridLines.tsx: very subtle horizontal lines.
 */
function renderGridLayer(ctx: PdfRenderContext): void {
  const {
    doc,
    tasks,
    chartX,
    chartY,
    chartWidthMm,
    rowHeightMm,
    pdfOptions,
    taskTableWidthMm,
  } = ctx;

  // Very subtle grid color matching app (#e9ecef)
  const gridColor = getColor("#e9ecef", pdfOptions.grayscale);
  doc.setDrawColor(gridColor.r, gridColor.g, gridColor.b);
  doc.setLineWidth(0.08); // Very thin lines

  // Draw horizontal lines for each row (subtle)
  for (let i = 0; i <= tasks.length; i++) {
    const y = chartY + i * rowHeightMm;
    doc.line(chartX - taskTableWidthMm, y, chartX + chartWidthMm, y);
  }

  // No vertical border between task table and chart - cleaner look
}

/**
 * Render today marker line.
 * Matches app's TodayMarker.tsx: red dashed line.
 */
function renderTodayMarker(ctx: PdfRenderContext): void {
  const { doc, scale, chartX, chartY, chartHeightMm, pdfOptions, scaleFactor } =
    ctx;

  const today = new Date().toISOString().split("T")[0];
  const todayDate = new Date(today);
  const minDate = new Date(scale.minDate);
  const maxDate = new Date(scale.maxDate);

  // Check if today is within the visible range
  if (todayDate < minDate || todayDate > maxDate) {
    return;
  }

  const daysFromStart = calculateDuration(scale.minDate, today) - 1;
  const x =
    chartX +
    pxToMm(daysFromStart * scale.pixelsPerDay + scale.pixelsPerDay / 2) *
      scaleFactor;

  // Color matching app's TodayMarker (#fa5252)
  const todayColor = getColor("#fa5252", pdfOptions.grayscale);
  doc.setDrawColor(todayColor.r, todayColor.g, todayColor.b);

  // Line width: app uses strokeWidth=2, convert to mm (subtle)
  doc.setLineWidth(pxToMm(1.5) * scaleFactor);

  // Dashed line matching app's strokeDasharray="4 4"
  const dashSize = pxToMm(3) * scaleFactor;
  doc.setLineDashPattern([dashSize, dashSize], 0);
  doc.line(x, chartY, x, chartY + chartHeightMm);
  doc.setLineDashPattern([], 0); // Reset dash pattern
}

/**
 * Render timeline header with date labels.
 * Matches app's TimelineHeader.tsx styling.
 */
function renderTimelineHeader(ctx: PdfRenderContext): void {
  const {
    doc,
    scale,
    chartX,
    chartY,
    chartWidthMm,
    headerHeightMm,
    pdfOptions,
    scaleFactor,
  } = ctx;

  // Colors matching app's TimelineHeader.tsx
  const textColor = getColor("#495057", pdfOptions.grayscale); // App's fill color
  const separatorColor = getColor("#dee2e6", pdfOptions.grayscale); // App's stroke color

  // Header background matching app (#f8f9fa)
  const bgColor = getColor("#f8f9fa", pdfOptions.grayscale);
  doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
  doc.rect(chartX, chartY - headerHeightMm, chartWidthMm, headerHeightMm, "F");

  // Get scale configuration
  const scaleConfigs = scale.scales;
  const rowHeight = headerHeightMm / scaleConfigs.length;

  for (let i = 0; i < scaleConfigs.length; i++) {
    const scaleConfig = scaleConfigs[i];
    const rowY = chartY - headerHeightMm + i * rowHeight;

    // Generate intervals for this scale level
    const intervals = generateScaleIntervals(scale, scaleConfig);

    // Font styling matching app: row 0 is bigger/bolder
    const fontSize = i === 0 ? 10 : 9;
    doc.setFontSize(fontSize);
    doc.setFont("Inter", i === 0 ? "bold" : "normal");
    doc.setTextColor(textColor.r, textColor.g, textColor.b);

    for (const interval of intervals) {
      const x = chartX + pxToMm(interval.startPx) * scaleFactor;
      const width = pxToMm(interval.widthPx) * scaleFactor;

      // Draw separator line (subtle, matching app)
      doc.setDrawColor(separatorColor.r, separatorColor.g, separatorColor.b);
      doc.setLineWidth(0.15);
      doc.line(x, rowY, x, rowY + rowHeight);

      // Draw label (centered)
      const label = truncateText(interval.label, width - 2, fontSize);
      const textWidth = doc.getTextWidth(label);
      const textX = x + (width - textWidth) / 2;
      const textY = rowY + rowHeight / 2 + fontSize / 3;
      doc.text(label, textX, textY);
    }
  }

  // Bottom border of header (subtle)
  doc.setDrawColor(separatorColor.r, separatorColor.g, separatorColor.b);
  doc.setLineWidth(0.15);
  doc.line(chartX, chartY, chartX + chartWidthMm, chartY);
}

/** Scale interval for rendering */
interface ScaleInterval {
  startPx: number;
  widthPx: number;
  label: string;
}

/**
 * Generate intervals for a scale configuration.
 */
function generateScaleIntervals(
  scale: TimelineScale,
  config: {
    unit: string;
    step: number;
    format: string | ((date: Date) => string);
  }
): ScaleInterval[] {
  const intervals: ScaleInterval[] = [];
  const minDate = new Date(scale.minDate);
  const maxDate = new Date(scale.maxDate);

  let current = getUnitStart(
    minDate,
    config.unit as "year" | "quarter" | "month" | "week" | "day" | "hour"
  );

  while (current < maxDate) {
    const next = addUnit(
      current,
      config.unit as "year" | "quarter" | "month" | "week" | "day" | "hour",
      config.step
    );

    const startPx = Math.max(
      0,
      ((current.getTime() - minDate.getTime()) / (24 * 60 * 60 * 1000)) *
        scale.pixelsPerDay
    );
    const endPx = Math.min(
      scale.totalWidth,
      ((next.getTime() - minDate.getTime()) / (24 * 60 * 60 * 1000)) *
        scale.pixelsPerDay
    );

    const label =
      typeof config.format === "function"
        ? config.format(current)
        : formatDate(current.toISOString().split("T")[0], config.format);

    intervals.push({
      startPx,
      widthPx: endPx - startPx,
      label,
    });

    current = next;
  }

  return intervals;
}

/**
 * Render all task bars.
 */
function renderTaskLayer(ctx: PdfRenderContext): void {
  const { tasks } = ctx;

  // Render in order
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];

    if (task.type === "milestone") {
      renderMilestone(ctx, task, i);
    } else if (task.type === "summary") {
      renderSummaryBracket(ctx, task, i);
    } else {
      renderTaskBar(ctx, task, i);
    }
  }
}

/**
 * Render a regular task bar with progress.
 * Matches TaskBar.tsx rendering: same color for bar and progress,
 * background has 0.8 opacity when progress shown, progress overlay is 1.0.
 */
function renderTaskBar(
  ctx: PdfRenderContext,
  task: Task,
  rowIndex: number
): void {
  const {
    doc,
    scale,
    chartX,
    chartY,
    rowHeightMm,
    taskBarHeightMm,
    pdfOptions,
    scaleFactor,
    options,
  } = ctx;

  const daysFromStart = calculateDuration(scale.minDate, task.startDate) - 1;
  const duration = calculateDuration(task.startDate, task.endDate);

  const x = chartX + pxToMm(daysFromStart * scale.pixelsPerDay) * scaleFactor;
  const y =
    chartY + rowIndex * rowHeightMm + (rowHeightMm - taskBarHeightMm) / 2;
  const width = pxToMm(duration * scale.pixelsPerDay) * scaleFactor;
  const height = taskBarHeightMm;

  // Use task's actual color (matching the app)
  const taskColor = getColor(
    task.color || COLORS.taskDefault,
    pdfOptions.grayscale
  );

  // Corner radius matches app (4px converted to mm)
  const radius = pxToMm(TASK_RENDER_CONSTANTS.taskCornerRadius) * scaleFactor;

  // Check if we should show progress
  const showProgress = options.selectedColumns.includes("progress") || true;
  const hasProgress = showProgress && task.progress > 0;

  // Background bar - 0.8 opacity when progress is shown, 1.0 otherwise
  // jsPDF doesn't support alpha directly, so we blend the color with white
  if (hasProgress) {
    // Blend color with white for 0.8 opacity effect
    const bgOpacity = TASK_RENDER_CONSTANTS.taskBackgroundOpacity;
    const blendedColor = {
      r: Math.round(taskColor.r * bgOpacity + 255 * (1 - bgOpacity)),
      g: Math.round(taskColor.g * bgOpacity + 255 * (1 - bgOpacity)),
      b: Math.round(taskColor.b * bgOpacity + 255 * (1 - bgOpacity)),
    };
    doc.setFillColor(blendedColor.r, blendedColor.g, blendedColor.b);
  } else {
    doc.setFillColor(taskColor.r, taskColor.g, taskColor.b);
  }

  // Draw background bar with rounded corners
  doc.roundedRect(x, y, width, height, radius, radius, "F");

  // Draw progress overlay (full opacity, same color) if progress > 0
  if (hasProgress) {
    const progressWidth = width * (task.progress / 100);
    doc.setFillColor(taskColor.r, taskColor.g, taskColor.b);

    // Draw progress bar - needs to respect rounded corners on left side
    if (progressWidth >= radius * 2) {
      doc.roundedRect(x, y, progressWidth, height, radius, radius, "F");
    } else if (progressWidth > 0) {
      // Very small progress - draw simple rect that gets clipped by the visible area
      doc.rect(x, y, progressWidth, height, "F");
    }
  }
}

/**
 * Render a milestone (diamond shape).
 * Matches MilestoneDiamond component: responsive sizing based on pixelsPerDay,
 * centered on the middle of the day.
 */
function renderMilestone(
  ctx: PdfRenderContext,
  task: Task,
  rowIndex: number
): void {
  const {
    doc,
    scale,
    chartX,
    chartY,
    rowHeightMm,
    taskBarHeightMm,
    pdfOptions,
    scaleFactor,
  } = ctx;

  const daysFromStart = calculateDuration(scale.minDate, task.startDate) - 1;

  // Responsive size calculation matching app (min 6, max 10, based on pixelsPerDay/2)
  const sizePx = calculateMilestoneSize(scale.pixelsPerDay);
  const size = pxToMm(sizePx) * scaleFactor;

  // Center the diamond in the middle of the day
  const dayWidthMm = pxToMm(scale.pixelsPerDay) * scaleFactor;
  const centerX =
    chartX + pxToMm(daysFromStart * scale.pixelsPerDay) * scaleFactor + dayWidthMm / 2;
  const centerY = chartY + rowIndex * rowHeightMm + taskBarHeightMm / 2 + (rowHeightMm - taskBarHeightMm) / 2;

  // Use task's actual color (matching the app)
  const milestoneColor = getColor(
    task.color || COLORS.taskDefault,
    pdfOptions.grayscale
  );
  doc.setFillColor(milestoneColor.r, milestoneColor.g, milestoneColor.b);

  // Draw diamond shape matching app's path:
  // M centerX, centerY-size -> L centerX+size, centerY -> L centerX, centerY+size -> L centerX-size, centerY -> Z
  doc.triangle(
    centerX,
    centerY - size, // Top
    centerX + size,
    centerY, // Right
    centerX,
    centerY + size, // Bottom
    "F"
  );
  doc.triangle(
    centerX,
    centerY - size, // Top
    centerX - size,
    centerY, // Left
    centerX,
    centerY + size, // Bottom
    "F"
  );
}

/**
 * Render a summary task bracket.
 * Matches SummaryBracket component: clamp shape with downward tips,
 * rounded corners, and proper proportions.
 */
function renderSummaryBracket(
  ctx: PdfRenderContext,
  task: Task,
  rowIndex: number
): void {
  const {
    doc,
    scale,
    chartX,
    chartY,
    rowHeightMm,
    taskBarHeightMm,
    pdfOptions,
    scaleFactor,
  } = ctx;

  const daysFromStart = calculateDuration(scale.minDate, task.startDate) - 1;
  const duration = calculateDuration(task.startDate, task.endDate);

  const x = chartX + pxToMm(daysFromStart * scale.pixelsPerDay) * scaleFactor;
  const y =
    chartY + rowIndex * rowHeightMm + (rowHeightMm - taskBarHeightMm) / 2;
  const width = pxToMm(duration * scale.pixelsPerDay) * scaleFactor;
  const height = taskBarHeightMm;

  // Use task's actual color (matching the app)
  const summaryColor = getColor(
    task.color || COLORS.taskDefault,
    pdfOptions.grayscale
  );

  // Calculate bracket dimensions matching app constants
  const tipHeight = height * SUMMARY_RENDER_CONSTANTS.tipHeightRatio;
  const barThickness = height * SUMMARY_RENDER_CONSTANTS.barThicknessRatio;
  const tipWidth = tipHeight * SUMMARY_RENDER_CONSTANTS.tipWidthFactor;

  // Blend color for 0.9 opacity effect (matching app's fillOpacity={opacity * 0.9})
  const blendedOpacity = SUMMARY_RENDER_CONSTANTS.fillOpacity;
  const blendedColor = {
    r: Math.round(summaryColor.r * blendedOpacity + 255 * (1 - blendedOpacity)),
    g: Math.round(summaryColor.g * blendedOpacity + 255 * (1 - blendedOpacity)),
    b: Math.round(summaryColor.b * blendedOpacity + 255 * (1 - blendedOpacity)),
  };
  doc.setFillColor(blendedColor.r, blendedColor.g, blendedColor.b);

  // Draw simplified bracket shape using jsPDF primitives
  // Since jsPDF doesn't support complex paths with quadratic curves easily,
  // we approximate with rectangles and triangles

  // Main horizontal bar (top part of bracket)
  doc.rect(x, y, width, barThickness, "F");

  // Left tip (downward triangle)
  doc.triangle(
    x, y + barThickness,                    // Top left of tip
    x + tipWidth, y + barThickness,         // Top right of tip
    x, y + barThickness + tipHeight,        // Bottom point
    "F"
  );

  // Right tip (downward triangle)
  doc.triangle(
    x + width - tipWidth, y + barThickness, // Top left of tip
    x + width, y + barThickness,            // Top right of tip
    x + width, y + barThickness + tipHeight, // Bottom point
    "F"
  );
}

/**
 * Render task labels on the timeline.
 * Matches TaskBar.tsx label positioning: vertically centered with proper offsets.
 */
function renderTaskLabels(ctx: PdfRenderContext): void {
  const {
    doc,
    tasks,
    scale,
    chartX,
    chartY,
    rowHeightMm,
    taskBarHeightMm,
    pdfOptions,
    scaleFactor,
    options,
  } = ctx;

  // Get label position from options
  const labelPosition = options.taskLabelPosition;

  // Skip if labels are disabled
  if (labelPosition === "none") return;

  // Font size - scale appropriately for PDF (use 8pt as base)
  const fontSize = 8;
  doc.setFontSize(fontSize);
  doc.setFont("Inter", "normal");

  // Calculate label padding in mm (matching app's 8px padding)
  const labelPadding = pxToMm(LABEL_RENDER_CONSTANTS.padding) * scaleFactor;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];

    // For milestones and summaries, "inside" position falls back to "after"
    const effectivePosition: "before" | "inside" | "after" =
      (task.type === "milestone" || task.type === "summary") &&
      labelPosition === "inside"
        ? "after"
        : (labelPosition as "before" | "inside" | "after");

    const daysFromStart = calculateDuration(scale.minDate, task.startDate) - 1;
    let barX: number;
    let barWidth: number;
    let barY: number;

    if (task.type === "milestone") {
      // Milestone: position relative to diamond center
      const dayWidthMm = pxToMm(scale.pixelsPerDay) * scaleFactor;
      const sizePx = calculateMilestoneSize(scale.pixelsPerDay);
      const size = pxToMm(sizePx) * scaleFactor;
      barX = chartX + pxToMm(daysFromStart * scale.pixelsPerDay) * scaleFactor + dayWidthMm / 2 - size;
      barWidth = size * 2;
      barY = chartY + i * rowHeightMm + (rowHeightMm - taskBarHeightMm) / 2;
    } else {
      // Regular task or summary
      const duration = calculateDuration(task.startDate, task.endDate);
      barX = chartX + pxToMm(daysFromStart * scale.pixelsPerDay) * scaleFactor;
      barWidth = pxToMm(duration * scale.pixelsPerDay) * scaleFactor;
      barY = chartY + i * rowHeightMm + (rowHeightMm - taskBarHeightMm) / 2;
    }

    // Vertical center of the task bar + font offset for visual centering
    // Matching app: y + height/2 + fontSize/3
    const textY = barY + taskBarHeightMm / 2 + pxToMm(fontSize * LABEL_RENDER_CONSTANTS.verticalOffsetFactor) * scaleFactor;

    let textX: number;
    let maxTextWidth: number;

    switch (effectivePosition) {
      case "before":
        // Label before the task bar (right-aligned)
        textX = barX - labelPadding;
        maxTextWidth = barX - chartX - labelPadding; // Don't extend past chart edge
        {
          const externalColor = getColor(COLORS.textExternal, pdfOptions.grayscale);
          doc.setTextColor(externalColor.r, externalColor.g, externalColor.b);
          const label = truncateText(task.name, Math.max(maxTextWidth, 20), fontSize);
          const textWidth = doc.getTextWidth(label);
          doc.text(label, textX - textWidth, textY);
        }
        break;

      case "inside":
        // Label inside the task bar (white text, clipped to bar width)
        textX = barX + labelPadding;
        maxTextWidth = barWidth - labelPadding * 2;
        if (maxTextWidth > pxToMm(20) * scaleFactor) {
          const internalColor = getColor(COLORS.textInternal, pdfOptions.grayscale);
          doc.setTextColor(internalColor.r, internalColor.g, internalColor.b);
          const label = truncateText(task.name, maxTextWidth, fontSize);
          doc.text(label, textX, textY);
        }
        break;

      case "after":
        // Label after the task bar (left-aligned)
        textX = barX + barWidth + labelPadding;
        maxTextWidth = 50; // Reasonable max width for after labels
        {
          const externalColor = getColor(COLORS.textExternal, pdfOptions.grayscale);
          doc.setTextColor(externalColor.r, externalColor.g, externalColor.b);
          const label = truncateText(task.name, maxTextWidth, fontSize);
          doc.text(label, textX, textY);
        }
        break;
    }
  }
}

/**
 * Render dependency arrows.
 * Matches bezierPath.ts: orthogonal routing with elbow paths and S-curves.
 */
function renderDependencyLayer(ctx: PdfRenderContext): void {
  const {
    doc,
    tasks,
    dependencies,
    scale,
    chartX,
    chartY,
    rowHeightMm,
    taskBarHeightMm,
    pdfOptions,
    scaleFactor,
  } = ctx;

  const depColor = getColor(COLORS.dependency, pdfOptions.grayscale);
  doc.setDrawColor(depColor.r, depColor.g, depColor.b);
  doc.setLineWidth(pxToMm(DEPENDENCY_RENDER_CONSTANTS.strokeWidth) * scaleFactor);

  // Build task position map
  const taskMap = new Map(tasks.map((t, i) => [t.id, { task: t, index: i }]));

  for (const dep of dependencies) {
    const fromData = taskMap.get(dep.fromTaskId);
    const toData = taskMap.get(dep.toTaskId);

    if (!fromData || !toData) continue;

    const fromTask = fromData.task;
    const toTask = toData.task;

    // Calculate from position: right edge of source task, vertically centered
    const fromDuration = calculateDuration(fromTask.startDate, fromTask.endDate);
    const fromStartDays = calculateDuration(scale.minDate, fromTask.startDate) - 1;
    const fromTaskWidth = pxToMm(fromDuration * scale.pixelsPerDay) * scaleFactor;
    const fromX = chartX + pxToMm(fromStartDays * scale.pixelsPerDay) * scaleFactor + fromTaskWidth;
    const fromY = chartY + fromData.index * rowHeightMm + (rowHeightMm - taskBarHeightMm) / 2 + taskBarHeightMm / 2;

    // Calculate to position: left edge of target task, vertically centered
    const toStartDays = calculateDuration(scale.minDate, toTask.startDate) - 1;
    const toX = chartX + pxToMm(toStartDays * scale.pixelsPerDay) * scaleFactor;
    const toY = chartY + toData.index * rowHeightMm + (rowHeightMm - taskBarHeightMm) / 2 + taskBarHeightMm / 2;

    // Draw orthogonal path matching app's bezierPath.ts logic
    renderOrthogonalArrow(doc, fromX, fromY, toX, toY, rowHeightMm, scaleFactor, depColor);
  }
}

/**
 * Render a single dependency arrow with orthogonal routing.
 * Matches bezierPath.ts: standard elbow or S-curve routing.
 */
function renderOrthogonalArrow(
  doc: jsPDF,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  rowHeightMm: number,
  scaleFactor: number,
  color: PdfColor
): void {
  const horizontalGap = toX - fromX;
  const verticalGap = Math.abs(toY - fromY);

  // Scale corner radius based on row height (matching app)
  const rowHeightPx = rowHeightMm / pxToMm(1) / scaleFactor;
  const cornerRadiusPx = getScaledCornerRadius(rowHeightPx);
  const cornerRadius = pxToMm(cornerRadiusPx) * scaleFactor;

  // Horizontal segment length (matching app's 15px)
  const horizontalSegment = pxToMm(DEPENDENCY_RENDER_CONSTANTS.horizontalSegment) * scaleFactor;

  // Arrowhead size
  const arrowSize = pxToMm(DEPENDENCY_RENDER_CONSTANTS.arrowheadSize) * scaleFactor;

  // Minimum gap for standard elbow
  const minGapForElbow = horizontalSegment * 2 + cornerRadius * 2;

  // Same row: straight line
  if (verticalGap < 0.5) {
    doc.line(fromX, fromY, toX - arrowSize, toY);
    drawArrowhead(doc, toX, toY, arrowSize, color);
    return;
  }

  const goDown = toY > fromY;

  if (horizontalGap >= minGapForElbow) {
    // Standard elbow path with two 90° turns
    const midX = (fromX + toX) / 2;

    // Horizontal from start
    doc.line(fromX, fromY, midX - cornerRadius, fromY);

    // First turn (approximated with short line segments since jsPDF doesn't have bezier curves easily)
    // For simplicity, draw a corner as two connected lines
    if (goDown) {
      // Turn downward
      doc.line(midX - cornerRadius, fromY, midX, fromY + cornerRadius);
      // Vertical segment
      doc.line(midX, fromY + cornerRadius, midX, toY - cornerRadius);
      // Turn right
      doc.line(midX, toY - cornerRadius, midX + cornerRadius, toY);
    } else {
      // Turn upward
      doc.line(midX - cornerRadius, fromY, midX, fromY - cornerRadius);
      // Vertical segment
      doc.line(midX, fromY - cornerRadius, midX, toY + cornerRadius);
      // Turn right
      doc.line(midX, toY + cornerRadius, midX + cornerRadius, toY);
    }

    // Horizontal to end (leave room for arrowhead)
    doc.line(midX + cornerRadius, toY, toX - arrowSize, toY);

  } else if (horizontalGap > 0) {
    // Tight space - use S-curve routing
    const firstVerticalX = fromX + horizontalSegment;
    const secondVerticalX = toX - horizontalSegment;

    // Calculate middle Y for routing between tasks
    const minSpaceForCurves = cornerRadius * 4;
    let middleY: number;
    if (verticalGap < minSpaceForCurves) {
      const offset = Math.max(minSpaceForCurves / 2, rowHeightMm * 0.4);
      middleY = goDown
        ? Math.max(fromY, toY) + offset
        : Math.min(fromY, toY) - offset;
    } else {
      middleY = (fromY + toY) / 2;
    }

    // Draw S-curve path (simplified for PDF)
    doc.line(fromX, fromY, firstVerticalX, fromY);
    if (goDown) {
      doc.line(firstVerticalX, fromY, firstVerticalX, middleY);
      doc.line(firstVerticalX, middleY, secondVerticalX, middleY);
      doc.line(secondVerticalX, middleY, secondVerticalX, toY);
    } else {
      doc.line(firstVerticalX, fromY, firstVerticalX, middleY);
      doc.line(firstVerticalX, middleY, secondVerticalX, middleY);
      doc.line(secondVerticalX, middleY, secondVerticalX, toY);
    }
    doc.line(secondVerticalX, toY, toX - arrowSize, toY);

  } else {
    // Overlap or backward - simple direct line
    doc.line(fromX, fromY, toX - arrowSize, toY);
  }

  // Draw arrowhead
  drawArrowhead(doc, toX, toY, arrowSize, color);
}

/**
 * Draw arrowhead pointing right.
 */
function drawArrowhead(
  doc: jsPDF,
  x: number,
  y: number,
  size: number,
  color: PdfColor
): void {
  doc.setFillColor(color.r, color.g, color.b);
  doc.triangle(
    x, y,                    // Tip
    x - size, y - size / 2,  // Top back
    x - size, y + size / 2,  // Bottom back
    "F"
  );
}

/**
 * Render task table (left panel with task names).
 * Includes color indicators on the left side of each row matching the app's UI.
 */
function renderTaskTable(ctx: PdfRenderContext): void {
  const {
    doc,
    tasks,
    chartX,
    chartY,
    taskTableWidthMm,
    rowHeightMm,
    pdfOptions,
    headerHeightMm,
    scaleFactor,
  } = ctx;

  if (taskTableWidthMm <= 0) return;

  const textColor = getColor(COLORS.text, pdfOptions.grayscale);
  const textLightColor = getColor(COLORS.textLight, pdfOptions.grayscale);
  const headerBgColor = getColor(COLORS.headerBackground, pdfOptions.grayscale);

  // Color indicator width (matching app's colored bar on left)
  const colorIndicatorWidth = pxToMm(4) * scaleFactor;
  const tableLeftX = chartX - taskTableWidthMm;

  // Table header background
  doc.setFillColor(headerBgColor.r, headerBgColor.g, headerBgColor.b);
  doc.rect(
    tableLeftX,
    chartY - headerHeightMm,
    taskTableWidthMm,
    headerHeightMm,
    "F"
  );

  // Header text - "Name" column header
  doc.setFontSize(8);
  doc.setFont("Inter", "bold");
  doc.setTextColor(textLightColor.r, textLightColor.g, textLightColor.b);
  doc.text("Name", tableLeftX + colorIndicatorWidth + 4, chartY - headerHeightMm / 2 + 1);

  doc.setFont("Inter", "normal");
  doc.setTextColor(textColor.r, textColor.g, textColor.b);

  // Indent size in mm (matching app's indent per level)
  const indentSizeMm = pxToMm(16) * scaleFactor;

  // Task rows
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const rowY = chartY + i * rowHeightMm;

    // Draw color indicator bar on the left side of each row
    const taskColor = getColor(task.color || COLORS.taskDefault, pdfOptions.grayscale);
    doc.setFillColor(taskColor.r, taskColor.g, taskColor.b);
    doc.rect(tableLeftX, rowY, colorIndicatorWidth, rowHeightMm, "F");

    // Vertically center text in row
    const textY = rowY + rowHeightMm / 2 + 1;

    // Calculate indent based on hierarchy level
    const indentLevel = getTaskIndent(task, tasks);
    const indentMm = indentLevel * indentSizeMm;
    const textX = tableLeftX + colorIndicatorWidth + 4 + indentMm;

    // Use bold for summary tasks to differentiate them
    if (task.type === "summary") {
      doc.setFont("Inter", "bold");
    } else {
      doc.setFont("Inter", "normal");
    }

    // Calculate available width for text (account for color indicator)
    const maxWidth = taskTableWidthMm - colorIndicatorWidth - 8 - indentMm;

    // Task name only (timeline shapes indicate task type)
    const label = truncateText(task.name, maxWidth, 8);

    doc.text(label, textX, textY);
  }

  // Reset font
  doc.setFont("Inter", "normal");

  // Subtle vertical separator line between table and chart
  const separatorColor = getColor("#e9ecef", pdfOptions.grayscale);
  doc.setDrawColor(separatorColor.r, separatorColor.g, separatorColor.b);
  doc.setLineWidth(0.1);
  doc.line(
    chartX,
    chartY - headerHeightMm,
    chartX,
    chartY + tasks.length * rowHeightMm
  );
}

/**
 * Calculate indent level for a task based on hierarchy.
 */
function getTaskIndent(task: Task, allTasks: Task[]): number {
  let indent = 0;
  let current: Task | undefined = task;

  while (current?.parent) {
    indent++;
    current = allTasks.find((t) => t.id === current?.parent);
  }

  return indent;
}
