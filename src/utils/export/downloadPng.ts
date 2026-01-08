/**
 * PNG download utilities.
 */

import { sanitizeFilename } from "./sanitizeFilename";

/**
 * Generate a filename for the exported chart.
 * Format: {projectName}-YYYYMMDD-HHMMSS.png
 *
 * @param projectName - The project name (will be sanitized)
 * @returns A valid filename for the export
 */
export function generateFilename(projectName?: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const safeName = sanitizeFilename(projectName || "");
  return `${safeName}-${year}${month}${day}-${hours}${minutes}${seconds}.png`;
}

/**
 * Download a blob as a file.
 * Creates a temporary link and triggers download.
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
    }, 100);
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
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create PNG blob"));
          return;
        }

        const finalFilename = filename || generateFilename();
        downloadBlob(blob, finalFilename);
        resolve();
      },
      "image/png",
      1.0
    );
  });
}
