/**
 * Font embedding utilities for jsPDF.
 * Embeds the Inter font family into PDF documents.
 */

import type { jsPDF } from "jspdf";
import { INTER_REGULAR_BASE64, INTER_SEMIBOLD_BASE64 } from "./interFontData";

/**
 * Embeds the Inter font family into a jsPDF document.
 * Call this before using the Inter font in the document.
 *
 * svg2pdf.js requires fonts to be registered with matching font-weight values.
 * We register "600" separately because SVG elements often use numeric font-weights.
 * See: https://github.com/yWorks/svg2pdf.js/issues/128
 *
 * @param doc - The jsPDF document instance
 */
export function embedInterFont(doc: jsPDF): void {
  // Add font files to the virtual file system
  doc.addFileToVFS("Inter-Regular.ttf", INTER_REGULAR_BASE64);
  doc.addFileToVFS("Inter-SemiBold.ttf", INTER_SEMIBOLD_BASE64);

  // Register the fonts with all weight variants used in SVG
  doc.addFont("Inter-Regular.ttf", "Inter", "normal");
  doc.addFont("Inter-Regular.ttf", "Inter", "400");
  doc.addFont("Inter-SemiBold.ttf", "Inter", "bold");
  doc.addFont("Inter-SemiBold.ttf", "Inter", "600");
}

/**
 * Font name constant for use with doc.setFont()
 */
export const INTER_FONT_NAME = "Inter";
