/**
 * TaskTable container component.
 * Excel-like spreadsheet table for task management.
 */

import { useMemo, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { useTaskStore } from '../../store/slices/taskSlice';
import { TaskTableRow } from './TaskTableRow';
import { TASK_COLUMNS } from '../../config/tableColumns';
import { ColumnResizer } from './ColumnResizer';
import { buildFlattenedTaskList } from '../../utils/hierarchy';

export function TaskTable(): JSX.Element {
  const tasks = useTaskStore((state) => state.tasks);
  const reorderTasks = useTaskStore((state) => state.reorderTasks);
  const columnWidths = useTaskStore((state) => state.columnWidths);
  const setColumnWidth = useTaskStore((state) => state.setColumnWidth);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const selectAllTasks = useTaskStore((state) => state.selectAllTasks);
  const clearSelection = useTaskStore((state) => state.clearSelection);
  const indentSelectedTasks = useTaskStore((state) => state.indentSelectedTasks);
  const outdentSelectedTasks = useTaskStore((state) => state.outdentSelectedTasks);
  const canIndent = useTaskStore((state) => state.canIndentSelection());
  const canOutdent = useTaskStore((state) => state.canOutdentSelection());
  const activeCell = useTaskStore((state) => state.activeCell);

  // Build flattened list respecting collapsed state
  const flattenedTasks = useMemo(() => {
    const collapsedIds = new Set(
      tasks.filter((t) => t.open === false).map((t) => t.id)
    );
    return buildFlattenedTaskList(tasks, collapsedIds);
  }, [tasks]);

  const allSelected = tasks.length > 0 && tasks.every((task) => selectedTaskIds.includes(task.id));
  const someSelected = tasks.some((task) => selectedTaskIds.includes(task.id)) && !allSelected;

  // Keyboard shortcuts for indent/outdent
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Tab shortcuts when NO cell is active
      // (When a cell is active, Cell.tsx handles Tab for column navigation)
      const noCellActive = !activeCell.taskId && !activeCell.field;

      if (e.key === 'Tab' && noCellActive && selectedTaskIds.length > 0) {
        e.preventDefault();

        if (e.shiftKey && canOutdent) {
          // Shift+Tab: Outdent
          outdentSelectedTasks();
        } else if (!e.shiftKey && canIndent) {
          // Tab: Indent
          indentSelectedTasks();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCell, canIndent, canOutdent, selectedTaskIds, indentSelectedTasks, outdentSelectedTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderTasks(oldIndex, newIndex);
      }
    }
  };

  const handleHeaderCheckboxClick = () => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAllTasks();
    }
  };

  /**
   * Generate CSS grid template columns based on column widths.
   */
  const gridTemplateColumns = useMemo(() => {
    return TASK_COLUMNS.map((col) => {
      const customWidth = columnWidths[col.id];
      return customWidth ? `${customWidth}px` : col.defaultWidth;
    }).join(' ');
  }, [columnWidths]);

  /**
   * Get current width of a column in pixels.
   * Parse the default width or use custom width.
   */
  const getColumnWidth = (columnId: string): number => {
    const customWidth = columnWidths[columnId];
    if (customWidth) return customWidth;

    // Parse default width from column config
    const column = TASK_COLUMNS.find((col) => col.id === columnId);
    if (!column) return 100;

    // Extract pixel value from defaultWidth (e.g., "130px" -> 130)
    const match = column.defaultWidth.match(/(\d+)px/);
    if (match) return parseInt(match[1], 10);

    // For minmax or other complex values, use a reasonable default
    return 200;
  };

  /**
   * Handle column resize.
   */
  const handleColumnResize = (columnId: string, width: number) => {
    setColumnWidth(columnId, width);
  };

  /**
   * Calculate optimal width for a column based on content.
   */
  const calculateOptimalWidth = (columnId: string): number => {
    const column = TASK_COLUMNS.find((col) => col.id === columnId);
    if (!column || !column.field) return 100;

    const field = column.field;

    // Find the longest value in this column
    let maxLength = column.label.length; // Start with header length

    tasks.forEach((task) => {
      let valueStr = '';

      if (column.formatter) {
        valueStr = column.formatter(task[field]);
      } else {
        valueStr = String(task[field]);
      }

      maxLength = Math.max(maxLength, valueStr.length);
    });

    // Estimate width: ~8px per character + padding (24px) + some buffer
    const estimatedWidth = Math.max(60, maxLength * 8 + 40);

    return Math.min(estimatedWidth, 400); // Cap at 400px
  };

  /**
   * Handle auto-resize on double-click.
   */
  const handleAutoResize = (columnId: string) => {
    const optimalWidth = calculateOptimalWidth(columnId);
    setColumnWidth(columnId, optimalWidth);
  };

  return (
    <div className="task-table-container h-full flex flex-col bg-white border-r border-gray-200">
      {/* Table Content */}
      <div className="task-table-wrapper flex-1 overflow-auto">
        {tasks.length === 0 ? (
          <div className="empty-state flex flex-col items-center justify-center h-full text-gray-500">
            <svg
              className="w-16 h-16 mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-sm">No tasks yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Click &quot;Add Task&quot; to create your first task
            </p>
          </div>
        ) : (
          <div
            className="task-table"
            style={{
              display: 'grid',
              gridTemplateColumns,
              width: '100%',
            }}
            role="grid"
            aria-label="Task spreadsheet"
          >
            {/* Header Row */}
            <div className="task-table-header contents" role="row">
              {TASK_COLUMNS.map((column, index) => (
                <div
                  key={column.id}
                  className={`task-table-header-cell sticky top-0 z-10 ${column.id === 'name' ? 'pr-3' : 'px-3'} py-2 bg-gray-50 border-b ${column.id !== 'color' ? 'border-r' : ''} border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider relative`}
                  role="columnheader"
                >
                  {column.id === 'checkbox' ? (
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate = someSelected;
                          }
                        }}
                        onChange={handleHeaderCheckboxClick}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        title={allSelected ? 'Deselect all' : 'Select all'}
                      />
                    </div>
                  ) : column.id === 'color' ? (
                    ''
                  ) : (
                    column.label
                  )}
                  {/* Column Resizer - not on last column */}
                  {index < TASK_COLUMNS.length - 1 && (
                    <ColumnResizer
                      columnId={column.id}
                      currentWidth={getColumnWidth(column.id)}
                      onResize={handleColumnResize}
                      onAutoResize={handleAutoResize}
                      minWidth={40}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Task Rows with Drag and Drop */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={flattenedTasks.map(({ task }) => task.id)}
                strategy={verticalListSortingStrategy}
              >
                {flattenedTasks.map(({ task, level, hasChildren }) => (
                  <TaskTableRow
                    key={task.id}
                    task={task}
                    level={level}
                    hasChildren={hasChildren}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}
