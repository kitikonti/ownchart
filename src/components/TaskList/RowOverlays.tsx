/**
 * RowOverlays - Selection and clipboard overlay decorations for task table rows.
 * Extracted from TaskTableRow to keep the parent component focused on layout.
 */

import { memo } from "react";
import type {
  ClipboardPosition,
  SelectionPosition,
} from "../../hooks/useTaskRowData";
import { COLORS, Z_INDEX } from "../../styles/design-tokens";
import { SELECTION_RADIUS } from "./rowNumberConfig";

// ── Constants ────────────────────────────────────────────────────────────────

const SELECTION_BORDER = `2px solid ${COLORS.brand[600]}`;

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

  const showTopBorder = selectionPosition?.isFirstSelected ?? true;
  const showBottomBorder = selectionPosition?.isLastSelected ?? true;

  return (
    <>
      {/* Selection overlay - renders above cell borders */}
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
      {/* Clipboard overlay with dotted border */}
      {isInClipboard && clipboardPosition && (
        <div
          className="absolute inset-0 pointer-events-none border-2 border-dotted border-neutral-500"
          style={{
            borderTopStyle: clipboardPosition.isFirst ? "dotted" : "none",
            borderBottomStyle: clipboardPosition.isLast ? "dotted" : "none",
            zIndex: Z_INDEX.rowIndicator,
          }}
        />
      )}
    </>
  );
});
