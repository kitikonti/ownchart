/**
 * TaskTable container component.
 * Excel-like spreadsheet table for task management.
 */

import { useMemo, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";
import { TaskTableRow } from "./TaskTableRow";
import { NewTaskPlaceholderRow } from "./NewTaskPlaceholderRow";
import {
  TASK_COLUMNS,
  getDensityAwareWidth,
  getVisibleColumns,
} from "../../config/tableColumns";
import { ColumnResizer } from "./ColumnResizer";
import { useTableDimensions } from "../../hooks/useTableDimensions";
import { useFlattenedTasks } from "../../hooks/useFlattenedTasks";

interface TaskTableProps {
  hideHeader?: boolean;
}

export function TaskTable({ hideHeader = true }: TaskTableProps): JSX.Element {
  const tasks = useTaskStore((state) => state.tasks);
  const reorderTasks = useTaskStore((state) => state.reorderTasks);
  const columnWidths = useTaskStore((state) => state.columnWidths);
  const setColumnWidth = useTaskStore((state) => state.setColumnWidth);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const selectAllTasks = useTaskStore((state) => state.selectAllTasks);
  const clearSelection = useTaskStore((state) => state.clearSelection);
  const indentSelectedTasks = useTaskStore(
    (state) => state.indentSelectedTasks
  );
  const outdentSelectedTasks = useTaskStore(
    (state) => state.outdentSelectedTasks
  );
  const canIndent = useTaskStore((state) => state.canIndentSelection());
  const canOutdent = useTaskStore((state) => state.canOutdentSelection());
  const activeCell = useTaskStore((state) => state.activeCell);
  const clipboardTaskIds = useTaskStore((state) => state.clipboardTaskIds);
  const densityConfig = useDensityConfig();
  const showProgress = useChartStore((state) => state.showProgress);

  // Get visible columns based on settings (Sprint 1.5.9)
  const visibleColumns = useMemo(
    () => getVisibleColumns(showProgress),
    [showProgress]
  );

  // Get total column width for proper scrolling
  const { totalColumnWidth } = useTableDimensions();

  // Build flattened list respecting collapsed state (centralized in hook)
  const { flattenedTasks } = useFlattenedTasks();

  // Build a set for quick lookup
  const clipboardSet = useMemo(
    () => new Set(clipboardTaskIds),
    [clipboardTaskIds]
  );

  const allSelected =
    tasks.length > 0 &&
    tasks.every((task) => selectedTaskIds.includes(task.id));
  const someSelected =
    tasks.some((task) => selectedTaskIds.includes(task.id)) && !allSelected;

  // Keyboard shortcuts for indent/outdent
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Tab shortcuts when NO cell is active
      // (When a cell is active, Cell.tsx handles Tab for column navigation)
      const noCellActive = !activeCell.taskId && !activeCell.field;

      if (e.key === "Tab" && noCellActive && selectedTaskIds.length > 0) {
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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeCell,
    canIndent,
    canOutdent,
    selectedTaskIds,
    indentSelectedTasks,
    outdentSelectedTasks,
  ]);

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
   * Uses density-aware widths when no custom width is set.
   * Uses visibleColumns for show/hide progress column (Sprint 1.5.9).
   */
  const gridTemplateColumns = useMemo(() => {
    return visibleColumns
      .map((col) => {
        const customWidth = columnWidths[col.id];
        return customWidth
          ? `${customWidth}px`
          : getDensityAwareWidth(col.id, densityConfig);
      })
      .join(" ");
  }, [columnWidths, densityConfig, visibleColumns]);

  /**
   * Get current width of a column in pixels.
   * Uses density-aware widths when no custom width is set.
   */
  const getColumnWidth = (columnId: string): number => {
    const customWidth = columnWidths[columnId];
    if (customWidth) return customWidth;

    // Get density-aware default width
    const densityWidth = getDensityAwareWidth(columnId, densityConfig);
    const match = densityWidth.match(/(\d+)px/);
    if (match) return parseInt(match[1], 10);

    // For minmax, extract the first value
    const minmaxMatch = densityWidth.match(/minmax\((\d+)px/);
    if (minmaxMatch) return parseInt(minmaxMatch[1], 10);

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
      let valueStr = "";

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
    <div className="task-table-container bg-white border-r border-slate-200 select-none">
      {/* Table Content - no overflow here, handled by parent */}
      <div className="task-table-wrapper">
        <div
          className="task-table"
          style={{
            display: "grid",
            gridTemplateColumns,
            minWidth: totalColumnWidth,
          }}
          role="grid"
          aria-label="Task spreadsheet"
        >
          {/* Header Row - Hidden when rendered on App level */}
          {!hideHeader && (
            <div className="task-table-header contents" role="row">
              {visibleColumns.map((column) => (
                <div
                  key={column.id}
                  className={`task-table-header-cell sticky top-0 z-10 ${column.id === "name" ? "pr-3" : "px-3"} py-4 bg-slate-50 border-b ${column.id !== "color" ? "border-r" : ""} border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider relative`}
                  role="columnheader"
                >
                  {column.id === "checkbox" ? (
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
                        className="cursor-pointer"
                        style={{
                          transform: `scale(${densityConfig.checkboxSize / 16})`,
                        }}
                        title={allSelected ? "Deselect all" : "Select all"}
                        aria-label={
                          allSelected
                            ? "Deselect all tasks"
                            : "Select all tasks"
                        }
                      />
                    </div>
                  ) : column.id === "color" ? (
                    ""
                  ) : (
                    column.label
                  )}
                  {/* Column Resizer - only for name column */}
                  {column.id === "name" && (
                    <ColumnResizer
                      columnId={column.id}
                      currentWidth={getColumnWidth(column.id)}
                      onResize={handleColumnResize}
                      onAutoResize={handleAutoResize}
                      minWidth={100}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

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
              {flattenedTasks.map(({ task, level, hasChildren }, index) => {
                const isInClipboard = clipboardSet.has(task.id);
                const prevTask = index > 0 ? flattenedTasks[index - 1] : null;
                const nextTask =
                  index < flattenedTasks.length - 1
                    ? flattenedTasks[index + 1]
                    : null;

                // Check if previous/next tasks are also in clipboard
                const prevInClipboard = prevTask
                  ? clipboardSet.has(prevTask.task.id)
                  : false;
                const nextInClipboard = nextTask
                  ? clipboardSet.has(nextTask.task.id)
                  : false;

                return (
                  <TaskTableRow
                    key={task.id}
                    task={task}
                    level={level}
                    hasChildren={hasChildren}
                    clipboardPosition={
                      isInClipboard
                        ? {
                            isFirst: !prevInClipboard,
                            isLast: !nextInClipboard,
                          }
                        : undefined
                    }
                  />
                );
              })}
            </SortableContext>
          </DndContext>

          {/* Placeholder row for adding new tasks */}
          <NewTaskPlaceholderRow />
        </div>
      </div>
    </div>
  );
}
