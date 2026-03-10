/**
 * High-level PNG export orchestration.
 * Captures the chart, converts it to a blob, and triggers a download.
 */

import { captureChart, type CaptureChartParams } from "./captureChart";
import { canvasToBlob } from "./captureChart";
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

  // Download the file with project name
  const filename = generateFilename(params.projectName);
  downloadBlob(blob, filename);
}
