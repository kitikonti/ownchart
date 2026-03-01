/**
 * SplitPaneDivider - Visual divider with drag handle for the split pane.
 * When collapsed, shows a wider strip with expand caret.
 */

import { CaretRight } from "@phosphor-icons/react";

const KEYBOARD_RESIZE_STEP = 20; // px per arrow key press
const COLLAPSE_ICON_SIZE = 12;
const ARIA_LABEL_COLLAPSED = "Expand task table. Press Enter or drag right.";
const ARIA_LABEL_EXPANDED = "Resize panel. Use left/right arrow keys.";

interface SplitPaneDividerProps {
  onMouseDown: (e: React.MouseEvent) => void;
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
  const handleKeyDown = (e: React.KeyboardEvent): void => {
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

  const className = isCollapsed
    ? "split-divider w-3 cursor-e-resize flex-shrink-0 bg-neutral-200 hover:bg-neutral-300 transition-colors duration-150 relative flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
    : `split-divider w-1 cursor-col-resize flex-shrink-0 ${isDragging ? "bg-neutral-500" : "bg-neutral-200"} hover:bg-neutral-400 transition-colors duration-150 relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1`;

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
      className={className}
      onMouseDown={onMouseDown}
      onKeyDown={handleKeyDown}
      onClick={isCollapsed && onExpand ? onExpand : undefined}
    >
      {isCollapsed ? (
        <CaretRight
          aria-hidden="true"
          size={COLLAPSE_ICON_SIZE}
          weight="bold"
          className="text-neutral-500 pointer-events-none"
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
