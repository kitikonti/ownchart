/**
 * Inter font registration for PDF embedding.
 * Inter is the primary font used in OwnChart.
 */

import type { jsPDF } from "jspdf";
import { INTER_REGULAR_BASE64 } from "./fonts/interFontData";
import { INTER_ITALIC_FONT_BASE64 } from "./fonts/interItalicFontData";
import { INTER_SEMIBOLD_BASE64 } from "./fonts/interSemiBoldFontData";

/**
 * Register Inter font with jsPDF for consistent PDF rendering.
 * Registers both regular and italic variants.
 */
export function registerInterFont(doc: jsPDF): void {
  // Register Inter Regular
  doc.addFileToVFS("Inter-Regular.ttf", INTER_REGULAR_BASE64);
  doc.addFont("Inter-Regular.ttf", "Inter", "normal");

  // Register Inter Italic
  doc.addFileToVFS("Inter-Italic.ttf", INTER_ITALIC_FONT_BASE64);
  doc.addFont("Inter-Italic.ttf", "Inter", "italic");

  // Register Inter SemiBold (weight 600)
  doc.addFileToVFS("Inter-SemiBold.ttf", INTER_SEMIBOLD_BASE64);
  doc.addFont("Inter-SemiBold.ttf", "Inter", "bold");
}
