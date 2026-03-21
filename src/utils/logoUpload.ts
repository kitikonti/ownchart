/**
 * Logo upload utility.
 * Handles file validation, Base64 reading, and dimension extraction.
 */

import type { ProjectLogo, LogoMimeType } from "@/types/logo.types";

// =============================================================================
// Constants
// =============================================================================

/** Maximum logo file size in bytes (512 KB) */
export const MAX_LOGO_FILE_SIZE = 512 * 1024;

/** Allowed MIME types for logo files */
export const ALLOWED_LOGO_MIME_TYPES: ReadonlySet<string> = new Set([
  "image/png",
  "image/jpeg",
  "image/svg+xml",
]);

/** File extensions accepted by the file input */
export const LOGO_ACCEPT = ".png,.jpg,.jpeg,.svg";

/** Maximum display height in the PDF banner (pt) — ~5mm, ≈1.5× the 9pt banner text */
export const MAX_LOGO_DISPLAY_HEIGHT_PT = 14;

// =============================================================================
// Public API
// =============================================================================

/**
 * Process a logo file: validate, read as Base64, and extract dimensions.
 * @throws Error with a user-friendly message if validation fails
 */
export async function processLogoFile(file: File): Promise<ProjectLogo> {
  validateFile(file);
  const { data, mimeType } = await readFileAsBase64(file);
  const { width, height } = await extractDimensions(data, mimeType);

  return {
    data,
    mimeType,
    fileName: file.name,
    width,
    height,
  };
}

/**
 * Build a data URL from a ProjectLogo for use in <img> elements or jsPDF.
 */
export function logoToDataUrl(logo: ProjectLogo): string {
  return `data:${logo.mimeType};base64,${logo.data}`;
}

/**
 * Format file size for display (e.g. "245 KB").
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes / 1024)} KB`;
}

// =============================================================================
// Validation
// =============================================================================

function validateFile(file: File): void {
  if (!ALLOWED_LOGO_MIME_TYPES.has(file.type)) {
    throw new Error(
      `Unsupported file type "${file.type || "unknown"}". Use PNG, JPG, or SVG.`
    );
  }

  if (file.size > MAX_LOGO_FILE_SIZE) {
    throw new Error(
      `File too large (${formatFileSize(file.size)}). Maximum is ${formatFileSize(MAX_LOGO_FILE_SIZE)}.`
    );
  }

  if (file.size === 0) {
    throw new Error("File is empty.");
  }
}

// =============================================================================
// File Reading
// =============================================================================

function readFileAsBase64(
  file: File
): Promise<{ data: string; mimeType: LogoMimeType }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (): void => {
      const result = reader.result as string;
      // FileReader.readAsDataURL returns "data:<mime>;base64,<data>"
      const commaIndex = result.indexOf(",");
      if (commaIndex === -1) {
        reject(new Error("Failed to read file as Base64."));
        return;
      }
      resolve({
        data: result.substring(commaIndex + 1),
        mimeType: file.type as LogoMimeType,
      });
    };
    reader.onerror = (): void => {
      reject(new Error("Failed to read file."));
    };
    reader.readAsDataURL(file);
  });
}

// =============================================================================
// Dimension Extraction
// =============================================================================

function extractDimensions(
  base64Data: string,
  mimeType: LogoMimeType
): Promise<{ width: number; height: number }> {
  if (mimeType === "image/svg+xml") {
    return extractSvgDimensions(base64Data);
  }
  return extractRasterDimensions(base64Data, mimeType);
}

function extractRasterDimensions(
  base64Data: string,
  mimeType: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = (): void => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = (): void => {
      reject(new Error("Failed to load image for dimension extraction."));
    };
    img.src = `data:${mimeType};base64,${base64Data}`;
  });
}

async function extractSvgDimensions(
  base64Data: string
): Promise<{ width: number; height: number }> {
  const svgText = atob(base64Data);
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const svg = doc.querySelector("svg");

  if (!svg) {
    throw new Error("Invalid SVG file.");
  }

  // Try explicit width/height attributes first
  const widthAttr = parseFloat(svg.getAttribute("width") ?? "");
  const heightAttr = parseFloat(svg.getAttribute("height") ?? "");
  if (widthAttr > 0 && heightAttr > 0) {
    return { width: widthAttr, height: heightAttr };
  }

  // Fall back to viewBox
  const viewBox = svg.getAttribute("viewBox");
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/);
    if (parts.length === 4) {
      const vbWidth = parseFloat(parts[2]);
      const vbHeight = parseFloat(parts[3]);
      if (vbWidth > 0 && vbHeight > 0) {
        return { width: vbWidth, height: vbHeight };
      }
    }
  }

  // Default fallback
  return { width: 100, height: 100 };
}
