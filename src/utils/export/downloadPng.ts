/**
 * PNG download utilities.
 */

import { generateExportFilename } from "./helpers";

/**
 * Delay in ms before revoking the object URL after triggering a download.
 * Gives browsers time to start the download before the URL is invalidated.
 */
const BLOB_URL_REVOKE_DELAY_MS = 100;

/**
 * Generate a PNG filename for the exported chart.
 * Format: {projectName}-YYYYMMDD-HHMMSS.png
 * Delegates to generateExportFilename for consistent date-stamp formatting.
 *
 * @param projectName - The project name (will be sanitized). Defaults to "untitled".
 * @returns A valid filename for the PNG export
 */
export function generateFilename(projectName?: string): string {
  return generateExportFilename(projectName || "untitled", "png");
}

/**
 * Download a blob as a file.
 * Creates a temporary anchor element and programmatically triggers a download.
 *
 * **Browser-only**: Requires `document` and `URL.createObjectURL` to be
 * available. Do not call in a server-side or non-browser environment.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);

  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    // Append to body to ensure it works in all browsers
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    // Clean up the object URL
    // Use a small delay to ensure the download has started
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, BLOB_URL_REVOKE_DELAY_MS);
  }
}

/**
 * Download a canvas as a PNG file.
 */
export async function downloadCanvasAsPng(
  canvas: HTMLCanvasElement,
  filename?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create PNG blob"));
        return;
      }

      const finalFilename = filename || generateFilename();
      downloadBlob(blob, finalFilename);
      resolve();
    }, "image/png");
  });
}
