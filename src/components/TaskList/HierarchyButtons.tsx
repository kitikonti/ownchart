/**
 * Hierarchy navigation buttons for indent/outdent operations.
 * Allows users to move selected tasks between hierarchy levels.
 */

import { TextIndent, TextOutdent } from '@phosphor-icons/react';
import { useTaskStore } from '../../store/slices/taskSlice';

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
        <TextOutdent size={16} weight="regular" />
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
        <TextIndent size={16} weight="regular" />
        <span>Indent</span>
      </button>
    </div>
  );
}
