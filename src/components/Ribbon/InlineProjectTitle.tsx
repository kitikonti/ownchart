/**
 * InlineProjectTitle - Figma-style inline-editable project title for the Ribbon tab bar.
 */

import { useState, useRef, useEffect } from "react";
import { useChartStore } from "../../store/slices/chartSlice";
import { useFileStore } from "../../store/slices/fileSlice";

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
  const inputRef = useRef<HTMLInputElement>(null);

  const projectTitle = useChartStore((state) => state.projectTitle);
  const setProjectTitle = useChartStore((state) => state.setProjectTitle);
  const fileName = useFileStore((state) => state.fileName);
  const isDirty = useFileStore((state) => state.isDirty);

  const displayName =
    projectTitle || fileName?.replace(".ownchart", "") || "Untitled";

  const handleClick = (): void => {
    setDraft(projectTitle || fileName?.replace(".ownchart", "") || "");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerEdit]);

  // Focus and select input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div
      className="absolute left-1/2 transform -translate-x-1/2 flex items-center h-full"
      style={{ fontSize: "14px" }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="bg-white border border-brand-400 rounded px-2 py-0.5 text-sm text-neutral-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400"
          style={{
            width: `${Math.max(80, draft.length * 8 + 24)}px`,
            maxWidth: "300px",
            textAlign: "center",
          }}
          aria-label="Project title"
        />
      ) : (
        <button
          type="button"
          onClick={handleClick}
          title="Click to edit project title"
          className="hover:bg-neutral-200/50 rounded px-2 py-0.5 transition-colors cursor-text text-neutral-400"
        >
          {displayName}
          {isDirty && <span className="text-neutral-500">*</span>}
        </button>
      )}
    </div>
  );
}
