/**
 * Hierarchy navigation buttons for indent/outdent operations.
 * Allows users to move selected tasks between hierarchy levels.
 */

import { TextIndent, TextOutdent } from "@phosphor-icons/react";
import { useTaskStore } from "../../store/slices/taskSlice";

export function HierarchyButtons() {
  const indentSelectedTasks = useTaskStore(
    (state) => state.indentSelectedTasks
  );
  const outdentSelectedTasks = useTaskStore(
    (state) => state.outdentSelectedTasks
  );
  const canIndent = useTaskStore((state) => state.canIndentSelection());
  const canOutdent = useTaskStore((state) => state.canOutdentSelection());

  return (
    <div className="flex gap-1">
      <button
        onClick={outdentSelectedTasks}
        disabled={!canOutdent}
        title="Move left (outdent) - Shift+Tab"
        className={`
          p-1.5 rounded flex items-center justify-center transition-colors
          ${
            canOutdent
              ? "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
              : "text-slate-400 cursor-not-allowed"
          }
        `}
      >
        <TextOutdent size={16} weight="regular" />
      </button>

      <button
        onClick={indentSelectedTasks}
        disabled={!canIndent}
        title="Move right (indent) - Tab"
        className={`
          p-1.5 rounded flex items-center justify-center transition-colors
          ${
            canIndent
              ? "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
              : "text-slate-400 cursor-not-allowed"
          }
        `}
      >
        <TextIndent size={16} weight="regular" />
      </button>
    </div>
  );
}
