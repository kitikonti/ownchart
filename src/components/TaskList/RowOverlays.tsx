/**
 * RowOverlays - Selection and clipboard overlay decorations for task table rows.
 * Extracted from TaskTableRow to keep the parent component focused on layout.
 */

import { memo } from "react";
import type {
  ClipboardPosition,
  SelectionPosition,
} from "@/hooks/useTaskRowData";
import { COLORS, Z_INDEX } from "@/styles/design-tokens";
import { SELECTION_RADIUS } from "./rowNumberConfig";

// ── Constants ────────────────────────────────────────────────────────────────

const SELECTION_BORDER = `2px solid ${COLORS.brand[600]}`;
const CLIPBOARD_BORDER = `2px dotted ${COLORS.neutral[500]}`;

// ── Props ────────────────────────────────────────────────────────────────────

interface RowOverlaysProps {
  selectionPosition?: SelectionPosition;
  clipboardPosition?: ClipboardPosition;
}

// ── Component ────────────────────────────────────────────────────────────────

export const RowOverlays = memo(function RowOverlays({
  selectionPosition,
  clipboardPosition,
}: RowOverlaysProps): JSX.Element | null {
  const isSelected = selectionPosition !== undefined;
  const isInClipboard = clipboardPosition !== undefined;

  if (!isSelected && !isInClipboard) return null;

  const showTopBorder = selectionPosition?.isFirstSelected ?? false;
  const showBottomBorder = selectionPosition?.isLastSelected ?? false;

  return (
    <>
      {/* Selection overlay - renders above cell borders.
          Left border is always shown; top/bottom only on first/last selected row.
          Right border is intentionally omitted — the overlay spans full row width
          via inset-0, so a right border would appear mid-content between columns. */}
      {isSelected && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderTop: showTopBorder ? SELECTION_BORDER : "none",
            borderBottom: showBottomBorder ? SELECTION_BORDER : "none",
            borderLeft: SELECTION_BORDER,
            borderRadius: `${showTopBorder ? SELECTION_RADIUS : "0"} 0 0 ${showBottomBorder ? SELECTION_RADIUS : "0"}`,
            zIndex: Z_INDEX.rowIndicator,
          }}
        />
      )}
      {/* Clipboard overlay with dotted border.
          Uses inline styles exclusively to avoid Tailwind/inline-style conflicts:
          left border is always shown; top/bottom only on first/last row of the
          clipboard range; right border is intentionally omitted (overlay spans
          full row width via inset-0, so a right border would appear mid-content). */}
      {isInClipboard && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderLeft: CLIPBOARD_BORDER,
            borderTop: clipboardPosition.isFirst ? CLIPBOARD_BORDER : "none",
            borderBottom: clipboardPosition.isLast ? CLIPBOARD_BORDER : "none",
            zIndex: Z_INDEX.rowIndicator,
          }}
        />
      )}
    </>
  );
});
