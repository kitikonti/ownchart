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

/** Colors used in PDF rendering */
const COLORS = {
  grid: "#e2e8f0",
  weekend: "#f8fafc",
  holiday: "#fef3c7",
  today: "#ef4444",
  taskDefault: "#14b8a6",
  taskProgress: "#0d9488",
  milestone: "#f59e0b",
  summary: "#64748b",
  text: "#1e293b",
  textLight: "#64748b",
  dependency: "#94a3b8",
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

  // Weekend color
  const weekendColor = getColor(COLORS.weekend, grayscale);
  doc.setFillColor(weekendColor.r, weekendColor.g, weekendColor.b);

  // Iterate through each day in the scale
  const startDate = new Date(scale.minDate);
  const endDate = new Date(scale.maxDate);
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();

    // Weekend: Saturday (6) or Sunday (0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const daysFromStart =
        Math.floor(
          (currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
        ) + 1;
      const x =
        chartX + pxToMm(daysFromStart * scale.pixelsPerDay) * scaleFactor;
      const width = pxToMm(scale.pixelsPerDay) * scaleFactor;

      doc.rect(x, chartY, width, chartHeightMm, "F");
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }
}

/**
 * Render horizontal grid lines for each row.
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

  const gridColor = getColor(COLORS.grid, pdfOptions.grayscale);
  doc.setDrawColor(gridColor.r, gridColor.g, gridColor.b);
  doc.setLineWidth(0.1);

  // Draw horizontal lines for each row
  for (let i = 0; i <= tasks.length; i++) {
    const y = chartY + i * rowHeightMm;
    doc.line(chartX - taskTableWidthMm, y, chartX + chartWidthMm, y);
  }

  // Draw vertical border between task table and chart
  if (taskTableWidthMm > 0) {
    doc.line(
      chartX,
      chartY - ctx.headerHeightMm,
      chartX,
      chartY + tasks.length * rowHeightMm
    );
  }
}

/**
 * Render today marker line.
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

  const todayColor = getColor(COLORS.today, pdfOptions.grayscale);
  doc.setDrawColor(todayColor.r, todayColor.g, todayColor.b);
  doc.setLineWidth(0.5);

  // Dashed line
  doc.setLineDashPattern([1, 1], 0);
  doc.line(x, chartY, x, chartY + chartHeightMm);
  doc.setLineDashPattern([], 0); // Reset dash pattern
}

/**
 * Render timeline header with date labels.
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

  const textColor = getColor(COLORS.text, pdfOptions.grayscale);
  const gridColor = getColor(COLORS.grid, pdfOptions.grayscale);

  // Header background
  doc.setFillColor(255, 255, 255);
  doc.rect(chartX, chartY - headerHeightMm, chartWidthMm, headerHeightMm, "F");

  // Bottom border of header
  doc.setDrawColor(gridColor.r, gridColor.g, gridColor.b);
  doc.setLineWidth(0.2);
  doc.line(chartX, chartY, chartX + chartWidthMm, chartY);

  // Get scale configuration
  const scaleConfigs = scale.scales;
  const rowHeight = headerHeightMm / scaleConfigs.length;

  for (let i = 0; i < scaleConfigs.length; i++) {
    const scaleConfig = scaleConfigs[i];
    const rowY = chartY - headerHeightMm + i * rowHeight;

    // Generate intervals for this scale level
    const intervals = generateScaleIntervals(scale, scaleConfig);

    doc.setFontSize(8);
    doc.setTextColor(textColor.r, textColor.g, textColor.b);

    for (const interval of intervals) {
      const x = chartX + pxToMm(interval.startPx) * scaleFactor;
      const width = pxToMm(interval.widthPx) * scaleFactor;

      // Draw separator line
      doc.setDrawColor(gridColor.r, gridColor.g, gridColor.b);
      doc.setLineWidth(0.1);
      doc.line(x, rowY, x, rowY + rowHeight);

      // Draw label (centered)
      const label = truncateText(interval.label, width - 2, 8);
      const textWidth = doc.getTextWidth(label);
      const textX = x + (width - textWidth) / 2;
      doc.text(label, textX, rowY + rowHeight - 2);
    }
  }
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
  } = ctx;

  const daysFromStart = calculateDuration(scale.minDate, task.startDate) - 1;
  const duration = calculateDuration(task.startDate, task.endDate);

  const x = chartX + pxToMm(daysFromStart * scale.pixelsPerDay) * scaleFactor;
  const y =
    chartY + rowIndex * rowHeightMm + (rowHeightMm - taskBarHeightMm) / 2;
  const width = pxToMm(duration * scale.pixelsPerDay) * scaleFactor;
  const height = taskBarHeightMm;

  // Task bar color
  const taskColor = getColor(
    task.color || COLORS.taskDefault,
    pdfOptions.grayscale
  );
  doc.setFillColor(taskColor.r, taskColor.g, taskColor.b);

  // Draw rounded rectangle for task bar
  const radius = Math.min(1.5, height / 4);
  doc.roundedRect(x, y, width, height, radius, radius, "F");

  // Draw progress fill (always show if progress > 0)
  if (task.progress > 0) {
    const progressWidth = width * (task.progress / 100);
    const progressColor = getColor(COLORS.taskProgress, pdfOptions.grayscale);
    doc.setFillColor(progressColor.r, progressColor.g, progressColor.b);

    if (progressWidth >= radius * 2) {
      doc.roundedRect(x, y, progressWidth, height, radius, radius, "F");
    } else {
      doc.rect(x, y, progressWidth, height, "F");
    }
  }
}

/**
 * Render a milestone (diamond shape).
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
  const centerX =
    chartX + pxToMm((daysFromStart + 0.5) * scale.pixelsPerDay) * scaleFactor;
  const centerY = chartY + rowIndex * rowHeightMm + rowHeightMm / 2;

  const size = taskBarHeightMm * 0.7;
  const halfSize = size / 2;

  const milestoneColor = getColor(
    task.color || COLORS.milestone,
    pdfOptions.grayscale
  );
  doc.setFillColor(milestoneColor.r, milestoneColor.g, milestoneColor.b);

  // Draw diamond shape as a rotated square (using triangle fills)
  doc.triangle(
    centerX,
    centerY - halfSize, // Top
    centerX + halfSize,
    centerY, // Right
    centerX,
    centerY + halfSize, // Bottom
    "F"
  );
  doc.triangle(
    centerX,
    centerY - halfSize, // Top
    centerX - halfSize,
    centerY, // Left
    centerX,
    centerY + halfSize, // Bottom
    "F"
  );
}

/**
 * Render a summary task bracket.
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
  const height = taskBarHeightMm * 0.3;
  const bracketHeight = taskBarHeightMm * 0.4;

  const summaryColor = getColor(COLORS.summary, pdfOptions.grayscale);
  doc.setFillColor(summaryColor.r, summaryColor.g, summaryColor.b);

  // Main bar
  doc.rect(x, y, width, height, "F");

  // Left bracket
  doc.triangle(x, y, x + 2, y, x, y + bracketHeight, "F");

  // Right bracket
  doc.triangle(
    x + width,
    y,
    x + width - 2,
    y,
    x + width,
    y + bracketHeight,
    "F"
  );
}

/**
 * Render task labels on the timeline.
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

  const textColor = getColor(COLORS.text, pdfOptions.grayscale);
  doc.setTextColor(textColor.r, textColor.g, textColor.b);
  doc.setFontSize(8);

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];

    // Skip milestones and summaries for inline labels
    if (task.type === "milestone" || task.type === "summary") continue;

    const daysFromStart = calculateDuration(scale.minDate, task.startDate) - 1;
    const duration = calculateDuration(task.startDate, task.endDate);

    const barX =
      chartX + pxToMm(daysFromStart * scale.pixelsPerDay) * scaleFactor;
    const barWidth = pxToMm(duration * scale.pixelsPerDay) * scaleFactor;
    const barY = chartY + i * rowHeightMm + (rowHeightMm - taskBarHeightMm) / 2;

    // Inside label (only if bar is wide enough)
    if (labelPosition === "inside" && barWidth > 15) {
      const label = truncateText(task.name, barWidth - 4, 8);
      doc.setTextColor(255, 255, 255); // White text on colored bar
      doc.text(label, barX + 2, barY + taskBarHeightMm - 2);
      doc.setTextColor(textColor.r, textColor.g, textColor.b); // Reset
    } else if (labelPosition === "after") {
      // Label after the task bar
      const label = truncateText(task.name, 50, 8);
      doc.text(label, barX + barWidth + 2, barY + taskBarHeightMm - 2);
    } else if (labelPosition === "before") {
      // Label before the task bar
      const label = truncateText(task.name, 50, 8);
      const textWidth = doc.getTextWidth(label);
      doc.text(label, barX - textWidth - 2, barY + taskBarHeightMm - 2);
    }
  }
}

/**
 * Render dependency arrows.
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
    pdfOptions,
    scaleFactor,
  } = ctx;

  const depColor = getColor(COLORS.dependency, pdfOptions.grayscale);
  doc.setDrawColor(depColor.r, depColor.g, depColor.b);
  doc.setLineWidth(0.3);

  // Build task position map
  const taskMap = new Map(tasks.map((t, i) => [t.id, { task: t, index: i }]));

  for (const dep of dependencies) {
    const fromData = taskMap.get(dep.fromTaskId);
    const toData = taskMap.get(dep.toTaskId);

    if (!fromData || !toData) continue;

    const fromTask = fromData.task;
    const toTask = toData.task;

    // Calculate positions
    const fromDays = calculateDuration(scale.minDate, fromTask.endDate) - 1;
    const toDays = calculateDuration(scale.minDate, toTask.startDate) - 1;

    const fromX = chartX + pxToMm(fromDays * scale.pixelsPerDay) * scaleFactor;
    const fromY = chartY + fromData.index * rowHeightMm + rowHeightMm / 2;

    const toX = chartX + pxToMm(toDays * scale.pixelsPerDay) * scaleFactor;
    const toY = chartY + toData.index * rowHeightMm + rowHeightMm / 2;

    // Draw simple elbow path
    renderDependencyArrow(doc, fromX, fromY, toX, toY, depColor);
  }
}

/**
 * Render a single dependency arrow.
 */
function renderDependencyArrow(
  doc: jsPDF,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: PdfColor
): void {
  const horizontalGap = toX - fromX;
  const cornerRadius = 1.5;

  if (Math.abs(toY - fromY) < 0.5) {
    // Same row - straight line
    doc.line(fromX, fromY, toX, toY);
  } else if (horizontalGap > cornerRadius * 4) {
    // Standard elbow with corners
    const midX = (fromX + toX) / 2;
    const goDown = toY > fromY;

    // Draw path segments
    doc.line(fromX, fromY, midX - cornerRadius, fromY);

    // First corner (using lines for simplicity - PDF doesn't have bezier easily)
    const vertY1 = goDown ? fromY + cornerRadius : fromY - cornerRadius;
    const vertY2 = goDown ? toY - cornerRadius : toY + cornerRadius;
    doc.line(midX, vertY1, midX, vertY2);

    doc.line(midX + cornerRadius, toY, toX, toY);
  } else {
    // Simple line for small gaps
    doc.line(fromX, fromY, toX, toY);
  }

  // Draw arrowhead
  doc.setFillColor(color.r, color.g, color.b);
  const arrowSize = 1.2;
  doc.triangle(
    toX,
    toY,
    toX - arrowSize,
    toY - arrowSize / 2,
    toX - arrowSize,
    toY + arrowSize / 2,
    "F"
  );
}

/**
 * Render task table (left panel with task names).
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
  } = ctx;

  if (taskTableWidthMm <= 0) return;

  const textColor = getColor(COLORS.text, pdfOptions.grayscale);
  const gridColor = getColor(COLORS.grid, pdfOptions.grayscale);

  // Table header
  doc.setFillColor(250, 250, 250);
  doc.rect(
    chartX - taskTableWidthMm,
    chartY - headerHeightMm,
    taskTableWidthMm,
    headerHeightMm,
    "F"
  );

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textColor.r, textColor.g, textColor.b);
  doc.text("Task", chartX - taskTableWidthMm + 2, chartY - 3);

  doc.setFont("helvetica", "normal");

  // Task names
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const y = chartY + i * rowHeightMm + rowHeightMm / 2 + 1;

    // Indent for hierarchy
    const indent = getTaskIndent(task, tasks);
    const x = chartX - taskTableWidthMm + 2 + indent * 3;

    // Type indicator
    let prefix = "";
    if (task.type === "summary") {
      prefix = task.open === false ? "▸ " : "▾ ";
    } else if (task.type === "milestone") {
      prefix = "◆ ";
    }

    const maxWidth = taskTableWidthMm - 4 - indent * 3;
    const label = truncateText(prefix + task.name, maxWidth, 8);

    doc.text(label, x, y);
  }

  // Vertical separator
  doc.setDrawColor(gridColor.r, gridColor.g, gridColor.b);
  doc.setLineWidth(0.2);
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
