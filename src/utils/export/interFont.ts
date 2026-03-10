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
 * Registers regular, italic, and semi-bold (bold) variants.
 *
 * @throws {Error} If font registration fails (e.g. jsPDF internal error or
 *   calling addFont before addFileToVFS has completed).
 */
export function registerInterFont(doc: jsPDF): void {
  try {
    // Register Inter Regular
    doc.addFileToVFS("Inter-Regular.ttf", INTER_REGULAR_BASE64);
    doc.addFont("Inter-Regular.ttf", "Inter", "normal");

    // Register Inter Italic
    doc.addFileToVFS("Inter-Italic.ttf", INTER_ITALIC_FONT_BASE64);
    doc.addFont("Inter-Italic.ttf", "Inter", "italic");

    // Register Inter SemiBold (weight 600).
    // jsPDF has no font-weight axis; "bold" is the closest available style
    // name — SemiBold is the heaviest Inter variant embedded in this build.
    doc.addFileToVFS("Inter-SemiBold.ttf", INTER_SEMIBOLD_BASE64);
    doc.addFont("Inter-SemiBold.ttf", "Inter", "bold");
  } catch (err) {
    throw new Error(
      `Failed to register Inter font for PDF export: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
