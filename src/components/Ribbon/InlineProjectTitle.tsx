/**
 * InlineProjectTitle - Figma-style inline-editable project title for the Ribbon tab bar.
 *
 * Uses a hidden span to measure text width for accurate input auto-sizing.
 */

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useChartStore } from "../../store/slices/chartSlice";
import { useFileStore } from "../../store/slices/fileSlice";
import { APP_CONFIG } from "../../config/appConfig";

const MIN_INPUT_WIDTH = 80;
const MAX_INPUT_WIDTH = 300;
const MEASUREMENT_PADDING_PX = 2;
const UNTITLED_LABEL = "Untitled";

function stripExtension(name: string): string {
  const ext = APP_CONFIG.fileExtension;
  return name.endsWith(ext) ? name.slice(0, -ext.length) : name;
}

/** Derive the editable title value (empty string fallback for editing). */
function getEditableTitle(
  projectTitle: string,
  fileName: string | null
): string {
  return projectTitle || (fileName ? stripExtension(fileName) : "");
}

interface InlineProjectTitleProps {
  triggerEdit?: boolean;
  onEditTriggered?: () => void;
}

export function InlineProjectTitle({
  triggerEdit,
  onEditTriggered,
}: InlineProjectTitleProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [inputWidth, setInputWidth] = useState(MIN_INPUT_WIDTH);
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  const projectTitle = useChartStore((state) => state.projectTitle);
  const setProjectTitle = useChartStore((state) => state.setProjectTitle);
  const fileName = useFileStore((state) => state.fileName);
  const isDirty = useFileStore((state) => state.isDirty);

  const displayName =
    getEditableTitle(projectTitle, fileName) || UNTITLED_LABEL;
  const isPlaceholder = displayName === UNTITLED_LABEL;

  const handleClick = (): void => {
    setDraft(getEditableTitle(projectTitle, fileName));
    setIsEditing(true);
  };

  const handleSave = (): void => {
    setProjectTitle(draft.trim());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  // Enter edit mode when triggered externally (e.g. File > Rename or F2)
  useEffect(() => {
    if (triggerEdit) {
      handleClick();
      onEditTriggered?.();
    }
    // Only re-run when triggerEdit changes — handler identity is irrelevant
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerEdit]);

  // Focus and select input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Measure text width after DOM commit so the span's scrollWidth is available.
  // useLayoutEffect runs synchronously before paint → user never sees wrong width.
  useLayoutEffect(() => {
    if (isEditing && measureRef.current) {
      const measured = measureRef.current.scrollWidth;
      setInputWidth(
        Math.min(
          MAX_INPUT_WIDTH,
          Math.max(MIN_INPUT_WIDTH, measured + MEASUREMENT_PADDING_PX)
        )
      );
    }
  }, [isEditing, draft]);

  return (
    <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center h-full text-sm">
      {/* Hidden span mirrors input styling for accurate width measurement */}
      {isEditing && (
        <span
          ref={measureRef}
          aria-hidden="true"
          className="absolute invisible whitespace-pre px-2 py-0.5 text-sm"
        >
          {draft || " "}
        </span>
      )}

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="bg-white border border-brand-400 rounded px-2 py-0.5 text-sm text-neutral-800 text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400"
          style={{ width: `${inputWidth}px`, maxWidth: `${MAX_INPUT_WIDTH}px` }}
          aria-label="Project title"
        />
      ) : (
        <button
          type="button"
          onClick={handleClick}
          title="Click to edit project title"
          aria-label={
            isDirty ? `${displayName} (unsaved changes)` : displayName
          }
          className={`max-w-[300px] truncate hover:bg-neutral-200/50 rounded px-2 py-0.5 transition-colors cursor-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400 ${isPlaceholder ? "text-neutral-500 italic" : "text-neutral-600"}`}
        >
          {displayName}
          {isDirty && (
            <span className="text-neutral-500" aria-hidden="true">
              *
            </span>
          )}
        </button>
      )}
    </div>
  );
}
