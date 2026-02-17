/**
 * HomeTabContent - Ribbon Home tab toolbar content.
 *
 * Contains: Add Task, History, Clipboard, Structure (insert/indent/group/hide),
 * and Color Mode controls.
 */

import { useMemo } from "react";
import {
  Plus,
  ArrowCounterClockwise,
  ArrowClockwise,
  Copy,
  Scissors,
  ClipboardText,
  Trash,
  RowsPlusTop,
  RowsPlusBottom,
  TextOutdent,
  TextIndent,
  EyeSlash,
  Eye,
} from "@phosphor-icons/react";
import GroupIcon from "../../assets/icons/group-light.svg?react";
import UngroupIcon from "../../assets/icons/ungroup-light.svg?react";

import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
  TOOLBAR_TOKENS,
} from "../Toolbar/ToolbarPrimitives";
import { ColorDropdown } from "./ColorDropdown";

import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { useHistoryStore } from "../../store/slices/historySlice";
import { useClipboardOperations } from "../../hooks/useClipboardOperations";
import { useHideOperations } from "../../hooks/useHideOperations";
import { COLORS } from "../../styles/design-tokens";

const ICON_SIZE = TOOLBAR_TOKENS.iconSize;

export function HomeTabContent(): JSX.Element {
  // Task store
  const tasks = useTaskStore((state) => state.tasks);
  const addTask = useTaskStore((state) => state.addTask);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const activeCell = useTaskStore((state) => state.activeCell);
  const insertTaskAbove = useTaskStore((state) => state.insertTaskAbove);
  const insertTaskBelow = useTaskStore((state) => state.insertTaskBelow);
  const deleteSelectedTasks = useTaskStore(
    (state) => state.deleteSelectedTasks
  );
  const indentSelectedTasks = useTaskStore(
    (state) => state.indentSelectedTasks
  );
  const outdentSelectedTasks = useTaskStore(
    (state) => state.outdentSelectedTasks
  );
  const canIndent = useTaskStore((state) => state.canIndentSelection());
  const canOutdent = useTaskStore((state) => state.canOutdentSelection());
  const groupSelectedTasks = useTaskStore((state) => state.groupSelectedTasks);
  const canGroup = useTaskStore((state) => state.canGroupSelection());
  const ungroupSelectedTasks = useTaskStore(
    (state) => state.ungroupSelectedTasks
  );
  const canUngroup = useTaskStore((state) => state.canUngroupSelection());

  // History store
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const canUndo = useHistoryStore((state) => state.canUndo());
  const canRedo = useHistoryStore((state) => state.canRedo());
  const undoDescription = useHistoryStore((state) =>
    state.getUndoDescription()
  );
  const redoDescription = useHistoryStore((state) =>
    state.getRedoDescription()
  );

  // Clipboard
  const { handleCopy, handleCut, handlePaste, canCopyOrCut, canPaste } =
    useClipboardOperations();

  // Hidden tasks
  const hiddenTaskIds = useChartStore((state) => state.hiddenTaskIds);
  const {
    hideRows: handleHideRows,
    unhideSelection: handleUnhideSelection,
    getHiddenInSelectionCount,
  } = useHideOperations();
  const hiddenInSelectionCount = useMemo(
    () => getHiddenInSelectionCount(selectedTaskIds),
    [getHiddenInSelectionCount, selectedTaskIds]
  );

  // Derived state
  const singleSelectedTaskId =
    selectedTaskIds.length === 1
      ? selectedTaskIds[0]
      : selectedTaskIds.length === 0 && activeCell.taskId
        ? activeCell.taskId
        : null;

  const canInsert = singleSelectedTaskId !== null;
  const canDelete = selectedTaskIds.length > 0;

  // Handlers
  const handleAddTask = (): void => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 6);

    const formatDate = (date: Date): string => date.toISOString().split("T")[0];

    addTask({
      name: "New Task",
      startDate: formatDate(today),
      endDate: formatDate(nextWeek),
      duration: 7,
      progress: 0,
      color: COLORS.chart.taskDefault,
      order: tasks.length,
      type: "task",
      parent: undefined,
      metadata: {},
    });
  };

  const handleInsertAbove = (): void => {
    if (singleSelectedTaskId) insertTaskAbove(singleSelectedTaskId);
  };

  const handleInsertBelow = (): void => {
    if (singleSelectedTaskId) insertTaskBelow(singleSelectedTaskId);
  };

  return (
    <>
      {/* Primary Action - Prominent (Outlook-style) */}
      <ToolbarButton
        variant="primary"
        size="large"
        onClick={handleAddTask}
        aria-label="Add new task"
        icon={<Plus size={20} weight="regular" />}
        label="Add Task"
      />

      {/* History */}
      <ToolbarGroup label="History">
        <ToolbarButton
          onClick={undo}
          disabled={!canUndo}
          title={
            canUndo ? `Undo: ${undoDescription} (Ctrl+Z)` : "Nothing to undo"
          }
          aria-label={canUndo ? `Undo: ${undoDescription}` : "Nothing to undo"}
          icon={<ArrowCounterClockwise size={ICON_SIZE} weight="light" />}
        />
        <ToolbarButton
          onClick={redo}
          disabled={!canRedo}
          title={
            canRedo
              ? `Redo: ${redoDescription} (Ctrl+Shift+Z)`
              : "Nothing to redo"
          }
          aria-label={canRedo ? `Redo: ${redoDescription}` : "Nothing to redo"}
          icon={<ArrowClockwise size={ICON_SIZE} weight="light" />}
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Clipboard */}
      <ToolbarGroup label="Clipboard">
        <ToolbarButton
          onClick={handleCopy}
          disabled={!canCopyOrCut}
          title="Copy (Ctrl+C)"
          aria-label="Copy"
          icon={<Copy size={ICON_SIZE} weight="light" />}
        />
        <ToolbarButton
          onClick={handleCut}
          disabled={!canCopyOrCut}
          title="Cut (Ctrl+X)"
          aria-label="Cut"
          icon={<Scissors size={ICON_SIZE} weight="light" />}
        />
        <ToolbarButton
          onClick={handlePaste}
          disabled={!canPaste}
          title="Paste (Ctrl+V)"
          aria-label="Paste"
          icon={<ClipboardText size={ICON_SIZE} weight="light" />}
        />
        <ToolbarButton
          onClick={deleteSelectedTasks}
          disabled={!canDelete}
          title="Delete (Del / Ctrl+-)"
          aria-label="Delete"
          icon={<Trash size={ICON_SIZE} weight="light" />}
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Insert & Hierarchy */}
      <ToolbarGroup label="Structure">
        <ToolbarButton
          onClick={handleInsertAbove}
          disabled={!canInsert}
          title="Insert task above (Ctrl++)"
          aria-label="Insert task above"
          icon={<RowsPlusTop size={ICON_SIZE} weight="light" />}
        />
        <ToolbarButton
          onClick={handleInsertBelow}
          disabled={!canInsert}
          title="Insert task below"
          aria-label="Insert task below"
          icon={<RowsPlusBottom size={ICON_SIZE} weight="light" />}
        />
        <ToolbarButton
          onClick={outdentSelectedTasks}
          disabled={!canOutdent}
          title="Move left (outdent) - Alt+Shift+Left"
          aria-label="Outdent"
          icon={<TextOutdent size={ICON_SIZE} weight="light" />}
        />
        <ToolbarButton
          onClick={indentSelectedTasks}
          disabled={!canIndent}
          title="Move right (indent) - Alt+Shift+Right"
          aria-label="Indent"
          icon={<TextIndent size={ICON_SIZE} weight="light" />}
        />
        <ToolbarButton
          onClick={groupSelectedTasks}
          disabled={!canGroup}
          title="Group selected tasks (Ctrl+G)"
          aria-label="Group selected tasks"
          icon={<GroupIcon width={ICON_SIZE} height={ICON_SIZE} />}
        />
        <ToolbarButton
          onClick={ungroupSelectedTasks}
          disabled={!canUngroup}
          title="Ungroup selected tasks (Ctrl+Shift+G)"
          aria-label="Ungroup selected tasks"
          icon={<UngroupIcon width={ICON_SIZE} height={ICON_SIZE} />}
        />
        <ToolbarButton
          onClick={() => handleHideRows(selectedTaskIds)}
          disabled={selectedTaskIds.length === 0}
          title="Hide selected rows (Ctrl+H)"
          aria-label="Hide selected rows"
          icon={<EyeSlash size={ICON_SIZE} weight="light" />}
        />
        <ToolbarButton
          onClick={() => handleUnhideSelection(selectedTaskIds)}
          disabled={hiddenInSelectionCount === 0}
          title="Unhide rows in selection (Ctrl+Shift+H)"
          aria-label="Unhide rows in selection"
          icon={
            <span className="relative inline-flex">
              <Eye size={ICON_SIZE} weight="light" />
              {hiddenTaskIds.length > 0 && (
                <span
                  className="absolute -top-0.5 -right-1 text-white text-[8px] font-semibold min-w-[12px] h-3 rounded-full flex items-center justify-center px-0.5 leading-none"
                  style={{ backgroundColor: COLORS.brand[600] }}
                >
                  {hiddenTaskIds.length}
                </span>
              )}
            </span>
          }
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Color Mode (Smart Color Management) */}
      <ToolbarGroup label="Colors">
        <ColorDropdown labelPriority={1} />
      </ToolbarGroup>
    </>
  );
}
