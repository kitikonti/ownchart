/**
 * SplitPaneDivider - Visual divider with drag handle for the split pane.
 * When collapsed, shows a wider strip with expand caret.
 */

import type { MouseEvent, KeyboardEvent } from "react";
import { CaretRight } from "@phosphor-icons/react";

const KEYBOARD_RESIZE_STEP = 20; // px per arrow key press
const COLLAPSE_ICON_SIZE = 12;
const ARIA_LABEL_COLLAPSED = "Expand task table. Press Enter or drag right.";
const ARIA_LABEL_EXPANDED = "Resize panel. Use left/right arrow keys.";

interface SplitPaneDividerProps {
  onMouseDown: (e: MouseEvent) => void;
  onResize: (delta: number) => void;
  isDragging: boolean;
  isCollapsed?: boolean;
  onExpand?: () => void;
  /** Current pane width in px — used for aria-valuenow on the separator */
  currentWidth: number;
  /** Minimum pane width in px — used for aria-valuemin */
  minWidth: number;
  /** Maximum pane width in px — used for aria-valuemax */
  maxWidth: number;
}

const DIVIDER_BASE_CLASSES =
  "split-divider flex-shrink-0 transition-colors duration-150 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1";

function getDividerClassName(
  isCollapsed: boolean,
  isDragging: boolean
): string {
  if (isCollapsed) {
    return `${DIVIDER_BASE_CLASSES} w-3 cursor-e-resize bg-slate-200 hover:bg-slate-300 flex items-center justify-center`;
  }
  return `${DIVIDER_BASE_CLASSES} w-1 cursor-col-resize ${isDragging ? "bg-slate-500" : "bg-slate-200"} hover:bg-slate-400 group`;
}

export function SplitPaneDivider({
  onMouseDown,
  onResize,
  isDragging,
  isCollapsed = false,
  onExpand,
  currentWidth,
  minWidth,
  maxWidth,
}: SplitPaneDividerProps): JSX.Element {
  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onResize(-KEYBOARD_RESIZE_STEP);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onResize(KEYBOARD_RESIZE_STEP);
    } else if (e.key === "Enter" && isCollapsed && onExpand) {
      e.preventDefault();
      onExpand();
    }
  };

  const ariaLabel = isCollapsed ? ARIA_LABEL_COLLAPSED : ARIA_LABEL_EXPANDED;

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- separator is a keyboard-operable resize handle
    <div
      role="separator"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-orientation="vertical"
      aria-label={ariaLabel}
      aria-valuenow={currentWidth}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      className={getDividerClassName(isCollapsed, isDragging)}
      onMouseDown={onMouseDown}
      onKeyDown={handleKeyDown}
      // Both onClick and onMouseDown are intentional in collapsed state:
      // onMouseDown starts a drag-from-collapsed gesture (parent guards via
      // dragFromCollapsedRef); onClick fires only when no drag occurred and
      // expands the pane. The parent's mouseUp handler clears the ref before
      // the click event fires, so the two handlers never conflict.
      onClick={isCollapsed && onExpand ? onExpand : undefined}
    >
      {isCollapsed ? (
        <CaretRight
          aria-hidden="true"
          size={COLLAPSE_ICON_SIZE}
          weight="bold"
          className="text-slate-500 pointer-events-none"
        />
      ) : (
        /* Visual indicator on hover - extends hit area */
        <div
          aria-hidden="true"
          className={`absolute inset-y-0 -left-1 -right-1 ${isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        />
      )}
    </div>
  );
}
