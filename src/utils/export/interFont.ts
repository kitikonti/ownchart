/**
 * Inter font registration for PDF embedding.
 * Inter is the primary font used in OwnChart.
 */

import type { jsPDF } from "jspdf";
import { INTER_REGULAR_BASE64 } from "./fonts/interFontData";
import { INTER_ITALIC_FONT_BASE64 } from "./fonts/interItalicFontData";
import { INTER_SEMIBOLD_BASE64 } from "./fonts/interSemiBoldFontData";

/**
 * Font variants to register with jsPDF.
 * Each entry keeps the VFS filename, base64 data, and jsPDF style name
 * co-located so they cannot be accidentally misaligned.
 *
 * jsPDF has no font-weight axis; "bold" is the closest available style name —
 * SemiBold (weight 600) is the heaviest Inter variant embedded in this build.
 */
const INTER_FONT_VARIANTS = [
  { file: "Inter-Regular.ttf", data: INTER_REGULAR_BASE64, style: "normal" },
  { file: "Inter-Italic.ttf", data: INTER_ITALIC_FONT_BASE64, style: "italic" },
  { file: "Inter-SemiBold.ttf", data: INTER_SEMIBOLD_BASE64, style: "bold" },
] as const;

/**
 * Register Inter font with jsPDF for consistent PDF rendering.
 * Registers regular, italic, and semi-bold (bold) variants.
 *
 * @throws {Error} If font registration fails (e.g. jsPDF internal error or
 *   calling addFont before addFileToVFS has completed).
 */
export function registerInterFont(doc: jsPDF): void {
  try {
    for (const { file, data, style } of INTER_FONT_VARIANTS) {
      doc.addFileToVFS(file, data);
      doc.addFont(file, "Inter", style);
    }
  } catch (err) {
    throw new Error(
      `Failed to register Inter font for PDF export: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
