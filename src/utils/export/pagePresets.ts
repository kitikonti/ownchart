/**
 * Quick export presets for common page and screen sizes.
 * Runtime data separated from type definitions (SRP).
 */

import {
  PNG_EXPORT_DPI,
  calculatePixelDimensions,
  formatDpiDescription,
} from "./dpi";
import {
  PDF_PAGE_SIZES,
  DEFAULT_FIT_TO_WIDTH_PX,
  HD_SCREEN_HEIGHT_PX,
  UHD_SCREEN_WIDTH_PX,
  UHD_SCREEN_HEIGHT_PX,
} from "./types";
import type { ExportQuickPreset, PdfOrientation } from "./types";

/**
 * Generate a quick preset from a paper page size.
 * Intentionally not exported — internal helper for EXPORT_QUICK_PRESETS only.
 * Uses PNG_EXPORT_DPI (150) for print-quality output.
 * @param key - Unique preset identifier (e.g. "a4-landscape")
 * @param label - Human-readable label shown in the UI
 * @param pageSize - Paper size key from PDF_PAGE_SIZES
 * @param orientation - Page orientation; defaults to "landscape"
 */
function createPagePreset(
  key: string,
  label: string,
  pageSize: keyof typeof PDF_PAGE_SIZES,
  orientation: PdfOrientation = "landscape"
): ExportQuickPreset {
  const size = PDF_PAGE_SIZES[pageSize];
  // PDF_PAGE_SIZES stores sizes in landscape convention: `width` is always the
  // long dimension and `height` is the short dimension. Swap them for portrait.
  const widthMm = orientation === "landscape" ? size.width : size.height;
  const heightMm = orientation === "landscape" ? size.height : size.width;
  const dims = calculatePixelDimensions(widthMm, heightMm, PNG_EXPORT_DPI);

  return {
    key,
    label,
    description: formatDpiDescription(dims.width, dims.height, PNG_EXPORT_DPI),
    targetWidth: dims.width,
  };
}

/**
 * Quick presets for common export target widths.
 * Paper sizes are calculated at PNG_EXPORT_DPI (150 DPI) for print quality.
 * Screen sizes use fixed pixel values.
 */
export const EXPORT_QUICK_PRESETS: ExportQuickPreset[] = [
  // Paper sizes (calculated from mm at 150 DPI)
  createPagePreset("a4-landscape", "A4 Landscape", "a4", "landscape"),
  createPagePreset("a3-landscape", "A3 Landscape", "a3", "landscape"),
  createPagePreset(
    "letter-landscape",
    "Letter Landscape",
    "letter",
    "landscape"
  ),
  // Screen sizes (fixed pixel values)
  {
    key: "hd-screen",
    label: "HD Screen",
    description: `${DEFAULT_FIT_TO_WIDTH_PX} × ${HD_SCREEN_HEIGHT_PX} px`,
    targetWidth: DEFAULT_FIT_TO_WIDTH_PX,
  },
  {
    key: "4k-screen",
    label: "4K Screen",
    description: `${UHD_SCREEN_WIDTH_PX} × ${UHD_SCREEN_HEIGHT_PX} px`,
    targetWidth: UHD_SCREEN_WIDTH_PX,
  },
];
