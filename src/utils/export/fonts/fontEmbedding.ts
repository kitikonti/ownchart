/**
 * Font embedding utilities for jsPDF.
 * Embeds the Inter font family into PDF documents.
 */

import type { jsPDF } from "jspdf";
import { INTER_REGULAR_BASE64, INTER_SEMIBOLD_BASE64 } from "./interFontData";
import { INTER_ITALIC_FONT_BASE64 } from "./interItalicFontData";

/**
 * Embeds the Inter font family into a jsPDF document.
 * Call this before using the Inter font in the document.
 *
 * svg2pdf.js requires fonts to be registered with matching font-weight/style values.
 * We register all combinations used in SVG elements:
 * - "normal" and "400" for regular text
 * - "bold" and "600" for header text (font-weight: 600)
 * - "italic" for summary task dates/durations (font-style: italic)
 *
 * Inter-Italic is embedded for proper italic rendering of summary task text.
 *
 * See: https://github.com/yWorks/svg2pdf.js/issues/128
 *
 * @param doc - The jsPDF document instance
 */
export function embedInterFont(doc: jsPDF): void {
  // Add font files to the virtual file system
  doc.addFileToVFS("Inter-Regular.ttf", INTER_REGULAR_BASE64);
  doc.addFileToVFS("Inter-SemiBold.ttf", INTER_SEMIBOLD_BASE64);
  doc.addFileToVFS("Inter-Italic.ttf", INTER_ITALIC_FONT_BASE64);

  // Register the fonts with all weight/style variants used in SVG
  // Normal weight variants
  doc.addFont("Inter-Regular.ttf", "Inter", "normal");
  doc.addFont("Inter-Regular.ttf", "Inter", "400");

  // Bold/semibold weight variants
  doc.addFont("Inter-SemiBold.ttf", "Inter", "bold");
  doc.addFont("Inter-SemiBold.ttf", "Inter", "600");

  // Italic variant for summary task text
  doc.addFont("Inter-Italic.ttf", "Inter", "italic");
}

/**
 * Font name constant for use with doc.setFont()
 */
export const INTER_FONT_NAME = "Inter";
