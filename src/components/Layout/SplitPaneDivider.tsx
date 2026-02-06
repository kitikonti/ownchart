/**
 * SplitPaneDivider - Visual divider with drag handle for the split pane.
 * When collapsed, shows a wider strip with expand caret.
 */

import { CaretRight } from "@phosphor-icons/react";

const KEYBOARD_RESIZE_STEP = 20; // px per arrow key press

interface SplitPaneDividerProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onResize: (delta: number) => void;
  isDragging: boolean;
  isCollapsed?: boolean;
  onExpand?: () => void;
}

export function SplitPaneDivider({
  onMouseDown,
  onResize,
  isDragging,
  isCollapsed = false,
  onExpand,
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

  const handleClick = (): void => {
    if (isCollapsed && onExpand) {
      onExpand();
    }
  };

  if (isCollapsed) {
    return (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- separator is a keyboard-operable resize handle
      <div
        role="separator"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        aria-orientation="vertical"
        aria-label="Expand task table. Press Enter or drag right."
        className="split-divider w-3 cursor-e-resize flex-shrink-0 bg-neutral-200 hover:bg-neutral-300 transition-colors duration-150 relative flex items-center justify-center"
        onMouseDown={onMouseDown}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
      >
        <CaretRight
          size={12}
          weight="bold"
          className="text-neutral-500 pointer-events-none"
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- separator is a keyboard-operable resize handle
    <div
      role="separator"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-orientation="vertical"
      aria-label="Resize panel. Use left/right arrow keys."
      className={`split-divider w-1 cursor-col-resize flex-shrink-0 bg-neutral-200 hover:bg-neutral-400 transition-colors duration-150 relative group ${isDragging ? "bg-neutral-500" : ""}`}
      onMouseDown={onMouseDown}
      onKeyDown={handleKeyDown}
    >
      {/* Visual indicator on hover - extends hit area */}
      <div
        className={`absolute inset-y-0 -left-1 -right-1 ${isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      />
    </div>
  );
}
