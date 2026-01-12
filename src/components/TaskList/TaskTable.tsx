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
  getDensityAwareWidth,
  getVisibleColumns,
} from "../../config/tableColumns";
import { ColumnResizer } from "./ColumnResizer";
import { useTableDimensions } from "../../hooks/useTableDimensions";
import { useFlattenedTasks } from "../../hooks/useFlattenedTasks";
import { useAutoColumnWidth } from "../../hooks/useAutoColumnWidth";

interface TaskTableProps {
  hideHeader?: boolean;
}

export function TaskTable({ hideHeader = true }: TaskTableProps): JSX.Element {
  const tasks = useTaskStore((state) => state.tasks);
  const reorderTasks = useTaskStore((state) => state.reorderTasks);
  const columnWidths = useTaskStore((state) => state.columnWidths);
  const setColumnWidth = useTaskStore((state) => state.setColumnWidth);
  const autoFitColumn = useTaskStore((state) => state.autoFitColumn);
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

  // Extract visible task IDs in display order (for correct range selection)
  const visibleTaskIds = useMemo(
    () => flattenedTasks.map(({ task }) => task.id),
    [flattenedTasks]
  );

  // Auto-fit columns when density or task content changes
  useAutoColumnWidth();

  // Build sets for quick lookup
  const clipboardSet = useMemo(
    () => new Set(clipboardTaskIds),
    [clipboardTaskIds]
  );
  const selectedSet = useMemo(
    () => new Set(selectedTaskIds),
    [selectedTaskIds]
  );

  const allSelected =
    tasks.length > 0 &&
    tasks.every((task) => selectedTaskIds.includes(task.id));

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

  return (
    <div className="task-table-container bg-white border-r border-neutral-200 select-none">
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
                  className={`task-table-header-cell sticky top-0 z-10 ${column.id === "name" ? "pr-3" : "px-3"} py-4 bg-neutral-50 border-b ${column.id !== "color" ? "border-r" : ""} border-neutral-200 text-xs font-semibold text-neutral-600 uppercase tracking-wider relative`}
                  role="columnheader"
                >
                  {column.id === "rowNumber" ? (
                    <button
                      onClick={handleHeaderCheckboxClick}
                      className="w-full h-full flex items-center justify-center"
                      title={allSelected ? "Deselect all" : "Select all"}
                      aria-label={
                        allSelected
                          ? "Deselect all tasks"
                          : "Select all tasks"
                      }
                    />
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
                      onAutoResize={autoFitColumn}
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

                // Check if previous/next tasks are also selected (for contiguous selection borders)
                const isSelected = selectedSet.has(task.id);
                const prevSelected = prevTask
                  ? selectedSet.has(prevTask.task.id)
                  : false;
                const nextSelected = nextTask
                  ? selectedSet.has(nextTask.task.id)
                  : false;

                return (
                  <TaskTableRow
                    key={task.id}
                    task={task}
                    rowIndex={index}
                    level={level}
                    hasChildren={hasChildren}
                    visibleTaskIds={visibleTaskIds}
                    clipboardPosition={
                      isInClipboard
                        ? {
                            isFirst: !prevInClipboard,
                            isLast: !nextInClipboard,
                          }
                        : undefined
                    }
                    selectionPosition={
                      isSelected
                        ? {
                            isFirstSelected: !prevSelected,
                            isLastSelected: !nextSelected,
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
