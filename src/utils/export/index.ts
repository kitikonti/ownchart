/**
 * Export utilities for PNG generation.
 */

export { captureChart, canvasToBlob } from "./captureChart";
export { downloadBlob, downloadCanvasAsPng, generateFilename } from "./downloadPng";
export {
  DEFAULT_EXPORT_OPTIONS,
  EXPORT_WIDTH_PRESETS,
  INITIAL_EXPORT_STATE,
  type ExportOptions,
  type ExportState,
  type ExportWidthPreset,
} from "./types";

import { captureChart, canvasToBlob } from "./captureChart";
import { downloadBlob, generateFilename } from "./downloadPng";
import type { ExportOptions } from "./types";

/**
 * Export the chart to PNG with the given options.
 * This is the main export function that orchestrates the entire process.
 */
export async function exportToPng(options: ExportOptions): Promise<void> {
  // Capture the chart element
  const canvas = await captureChart(options);

  // Convert to blob
  const blob = await canvasToBlob(canvas);

  // Download the file
  const filename = generateFilename();
  downloadBlob(blob, filename);
}
