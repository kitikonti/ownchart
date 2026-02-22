/**
 * HomeTabContent - Ribbon Home tab toolbar content.
 *
 * Contains: Add Task, History, Clipboard, Structure (insert/indent/group/hide),
 * and Color Mode controls.
 *
 * Pure presentational component — all logic lives in useHomeTabActions.
 */

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
import { useHomeTabActions } from "../../hooks/useHomeTabActions";
import { COLORS } from "../../styles/design-tokens";

const ICON_SIZE = TOOLBAR_TOKENS.iconSize;

export function HomeTabContent(): JSX.Element {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    undoDescription,
    redoDescription,
    handleCopy,
    handleCut,
    handlePaste,
    canCopyOrCut,
    canPaste,
    deleteSelectedTasks,
    canDelete,
    handleAddTask,
    handleInsertAbove,
    handleInsertBelow,
    canInsert,
    indentSelectedTasks,
    outdentSelectedTasks,
    canIndent,
    canOutdent,
    groupSelectedTasks,
    ungroupSelectedTasks,
    canGroup,
    canUngroup,
    handleHideRows,
    handleUnhideSelection,
    canHide,
    hiddenInSelectionCount,
    totalHiddenCount,
  } = useHomeTabActions();

  return (
    <>
      {/* Primary Action - Prominent (Outlook-style) */}
      <ToolbarButton
        variant="primary"
        size="large"
        onClick={handleAddTask}
        aria-label="Add new task"
        icon={<Plus size={ICON_SIZE} weight="regular" />}
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
          onClick={handleHideRows}
          disabled={!canHide}
          title="Hide selected rows (Ctrl+H)"
          aria-label="Hide selected rows"
          icon={<EyeSlash size={ICON_SIZE} weight="light" />}
        />
        <ToolbarButton
          onClick={handleUnhideSelection}
          disabled={hiddenInSelectionCount === 0}
          title="Unhide rows in selection (Ctrl+Shift+H)"
          aria-label={
            totalHiddenCount > 0
              ? `Unhide rows in selection (${totalHiddenCount} hidden)`
              : "Unhide rows in selection"
          }
          icon={
            <span className="relative inline-flex">
              <Eye size={ICON_SIZE} weight="light" />
              {totalHiddenCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-1 text-white text-[8px] font-semibold min-w-[12px] h-3 rounded-full flex items-center justify-center px-0.5 leading-none"
                  style={{ backgroundColor: COLORS.brand[600] }}
                >
                  {totalHiddenCount}
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
