/**
 * Export utilities for PNG generation.
 */

export {
  captureChart,
  canvasToBlob,
  calculateExportDimensions,
  type CaptureChartParams,
} from "./captureChart";
export {
  downloadBlob,
  downloadCanvasAsPng,
  generateFilename,
} from "./downloadPng";
export {
  DEFAULT_EXPORT_OPTIONS,
  EXPORT_ZOOM_PRESETS,
  INITIAL_EXPORT_STATE,
  type ExportColumnKey,
  type ExportOptions,
  type ExportState,
  type ExportZoomPreset,
} from "./types";
export {
  BASE_PIXELS_PER_DAY,
  getDefaultColumnWidth,
  calculateTaskTableWidth,
  calculateEffectiveZoom,
  getEffectiveDateRange,
  calculateDurationDays,
} from "./calculations";

import {
  captureChart,
  canvasToBlob,
  type CaptureChartParams,
} from "./captureChart";
import { downloadBlob, generateFilename } from "./downloadPng";

/**
 * Export the chart to PNG with the given options.
 * This is the main export function that orchestrates the entire process.
 */
export async function exportToPng(params: CaptureChartParams): Promise<void> {
  // Capture the chart element
  const canvas = await captureChart(params);

  // Convert to blob
  const blob = await canvasToBlob(canvas);

  // Download the file
  const filename = generateFilename();
  downloadBlob(blob, filename);
}
