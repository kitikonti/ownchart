/**
 * Hierarchy navigation buttons for indent/outdent operations.
 * Allows users to move selected tasks between hierarchy levels.
 */

import { useTaskStore } from '../../store/slices/taskSlice';

/**
 * Custom Indent icon - arrow pointing right with horizontal lines.
 */
function IndentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Top line */}
      <line x1="2" y1="3" x2="14" y2="3" />
      {/* Middle lines with arrow */}
      <line x1="6" y1="8" x2="14" y2="8" />
      <polyline points="11,6 14,8 11,10" fill="none" />
      {/* Bottom line */}
      <line x1="2" y1="13" x2="14" y2="13" />
    </svg>
  );
}

/**
 * Custom Outdent icon - arrow pointing left with horizontal lines.
 */
function OutdentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Top line */}
      <line x1="2" y1="3" x2="14" y2="3" />
      {/* Middle lines with arrow */}
      <line x1="2" y1="8" x2="10" y2="8" />
      <polyline points="5,6 2,8 5,10" fill="none" />
      {/* Bottom line */}
      <line x1="2" y1="13" x2="14" y2="13" />
    </svg>
  );
}

export function HierarchyButtons() {
  const indentSelectedTasks = useTaskStore((state) => state.indentSelectedTasks);
  const outdentSelectedTasks = useTaskStore((state) => state.outdentSelectedTasks);
  const canIndent = useTaskStore((state) => state.canIndentSelection());
  const canOutdent = useTaskStore((state) => state.canOutdentSelection());

  return (
    <div className="flex gap-1 border-r border-gray-300 pr-3 mr-3">
      <button
        onClick={outdentSelectedTasks}
        disabled={!canOutdent}
        title="Move left (outdent) - Ctrl+["
        className={`
          px-2 py-1 rounded border flex items-center gap-1 text-sm
          ${
            canOutdent
              ? 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
              : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        <OutdentIcon className="w-4 h-4" />
        <span>Outdent</span>
      </button>

      <button
        onClick={indentSelectedTasks}
        disabled={!canIndent}
        title="Move right (indent) - Ctrl+]"
        className={`
          px-2 py-1 rounded border flex items-center gap-1 text-sm
          ${
            canIndent
              ? 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
              : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        <IndentIcon className="w-4 h-4" />
        <span>Indent</span>
      </button>
    </div>
  );
}
