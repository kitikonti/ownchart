/**
 * AppToolbar - Main application toolbar
 *
 * Design: Refined utilitarian aesthetic inspired by Figma, Linear, Notion
 *
 * Layout Structure:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ [Logo] │ File │ History │ Clipboard │ Insert │ [Add Task] │ Hierarchy  │
 * │        ├──────┴─────────┴───────────┴────────┴────────────┴────────────┤
 * │        │                        ─── SPACER ───                         │
 * │        ├────────────────────────────────────────────────────────────────┤
 * │        │ View │ Project │ App │ Zoom                                   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Separator Guidelines:
 * - Between major workflow phases (Edit → View)
 * - After primary action (Add Task)
 * - Before app-level settings
 */

import {
  ChartBarHorizontal,
  Plus,
  Sliders,
  File,
  FolderOpen,
  FloppyDisk,
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
  Export,
  FlowArrow,
  Gear,
  Question,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsOutLineHorizontal,
} from "@phosphor-icons/react";

import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_TOKENS,
} from "../Toolbar/ToolbarPrimitives";

import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { useHistoryStore } from "../../store/slices/historySlice";
import { useUIStore } from "../../store/slices/uiSlice";
import { useFileOperations } from "../../hooks/useFileOperations";
import { useClipboardOperations } from "../../hooks/useClipboardOperations";
import { MIN_ZOOM, MAX_ZOOM } from "../../utils/timelineUtils";

const ICON_SIZE = TOOLBAR_TOKENS.iconSize;

// Preset zoom levels
const PRESET_ZOOM_LEVELS = [5, 10, 25, 50, 75, 100, 150, 200, 300];

export function AppToolbar() {
  // ─────────────────────────────────────────────────────────────────────────
  // Store Hooks
  // ─────────────────────────────────────────────────────────────────────────

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

  // Chart store
  const zoom = useChartStore((state) => state.zoom);
  const zoomIn = useChartStore((state) => state.zoomIn);
  const zoomOut = useChartStore((state) => state.zoomOut);
  const fitToView = useChartStore((state) => state.fitToView);
  const showDependencies = useChartStore((state) => state.showDependencies);
  const toggleDependencies = useChartStore((state) => state.toggleDependencies);

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

  // UI store
  const openExportDialog = useUIStore((state) => state.openExportDialog);
  const openChartSettingsDialog = useUIStore(
    (state) => state.openChartSettingsDialog
  );
  const openPreferencesDialog = useUIStore(
    (state) => state.openPreferencesDialog
  );
  const openHelpPanel = useUIStore((state) => state.openHelpPanel);

  // File operations
  const { handleNew, handleOpen, handleSave, isDirty } = useFileOperations();

  // Clipboard operations
  const { handleCopy, handleCut, handlePaste, canCopyOrCut, canPaste } =
    useClipboardOperations();

  // ─────────────────────────────────────────────────────────────────────────
  // Derived State
  // ─────────────────────────────────────────────────────────────────────────

  // Single task selection for insert operations
  const singleSelectedTaskId =
    selectedTaskIds.length === 1
      ? selectedTaskIds[0]
      : selectedTaskIds.length === 0 && activeCell.taskId
        ? activeCell.taskId
        : null;

  const canInsert = singleSelectedTaskId !== null;
  const canDelete = selectedTaskIds.length > 0;

  // Zoom state
  const zoomPercentage = Math.round(zoom * 100);
  const canZoomIn = zoom < MAX_ZOOM;
  const canZoomOut = zoom > MIN_ZOOM;

  // Build zoom options list
  const zoomOptions = [...PRESET_ZOOM_LEVELS];
  if (!PRESET_ZOOM_LEVELS.includes(zoomPercentage)) {
    const insertIndex = zoomOptions.findIndex(
      (level) => level > zoomPercentage
    );
    if (insertIndex === -1) {
      zoomOptions.push(zoomPercentage);
    } else {
      zoomOptions.splice(insertIndex, 0, zoomPercentage);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleAddTask = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const formatDate = (date: Date): string => date.toISOString().split("T")[0];

    addTask({
      name: "New Task",
      startDate: formatDate(today),
      endDate: formatDate(nextWeek),
      duration: 7,
      progress: 0,
      color: "#0d9488",
      order: tasks.length,
      type: "task",
      parent: undefined,
      metadata: {},
    });
  };

  const handleInsertAbove = () => {
    if (singleSelectedTaskId) insertTaskAbove(singleSelectedTaskId);
  };

  const handleInsertBelow = () => {
    if (singleSelectedTaskId) insertTaskBelow(singleSelectedTaskId);
  };

  const handleZoomLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "fit") {
      fitToView(tasks);
    } else {
      useChartStore.getState().setZoom(parseInt(value) / 100);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <header className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-slate-200/80 px-4 py-2 flex items-center gap-1 shadow-xs">
      {/* ─── Logo ─── */}
      <div className="flex items-center group cursor-default">
        <div className="p-1.5 rounded-lg bg-slate-800 shadow-sm">
          <ChartBarHorizontal
            size={18}
            weight="bold"
            className="text-white"
          />
        </div>
      </div>

      <ToolbarSeparator />

      {/* ─── Left Section: Editing Tools ─── */}

      {/* File Operations */}
      <ToolbarGroup label="File operations" className="mr-1">
        <ToolbarButton
          onClick={handleNew}
          title="New Chart (Ctrl+Alt+N)"
          aria-label="New Chart"
          icon={<File size={ICON_SIZE} weight="regular" />}
        />
        <ToolbarButton
          onClick={handleOpen}
          title="Open File (Ctrl+O)"
          aria-label="Open File"
          icon={<FolderOpen size={ICON_SIZE} weight="regular" />}
        />
        <ToolbarButton
          onClick={() => handleSave()}
          title="Save (Ctrl+S)"
          aria-label="Save File"
          className={isDirty ? "text-slate-700" : ""}
          icon={
            <FloppyDisk
              size={ICON_SIZE}
              weight={isDirty ? "fill" : "regular"}
            />
          }
        />
      </ToolbarGroup>

      {/* History */}
      <ToolbarGroup label="History" className="mr-1">
        <ToolbarButton
          onClick={undo}
          disabled={!canUndo}
          title={
            canUndo ? `Undo: ${undoDescription} (Ctrl+Z)` : "Nothing to undo"
          }
          aria-label={canUndo ? `Undo: ${undoDescription}` : "Nothing to undo"}
          icon={<ArrowCounterClockwise size={ICON_SIZE} weight="regular" />}
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
          icon={<ArrowClockwise size={ICON_SIZE} weight="regular" />}
        />
      </ToolbarGroup>

      {/* Clipboard */}
      <ToolbarGroup label="Clipboard" className="mr-1">
        <ToolbarButton
          onClick={handleCopy}
          disabled={!canCopyOrCut}
          title="Copy (Ctrl+C)"
          aria-label="Copy"
          icon={<Copy size={ICON_SIZE} weight="regular" />}
        />
        <ToolbarButton
          onClick={handleCut}
          disabled={!canCopyOrCut}
          title="Cut (Ctrl+X)"
          aria-label="Cut"
          icon={<Scissors size={ICON_SIZE} weight="regular" />}
        />
        <ToolbarButton
          onClick={handlePaste}
          disabled={!canPaste}
          title="Paste (Ctrl+V)"
          aria-label="Paste"
          icon={<ClipboardText size={ICON_SIZE} weight="regular" />}
        />
        <ToolbarButton
          onClick={deleteSelectedTasks}
          disabled={!canDelete}
          title="Delete (Del)"
          aria-label="Delete"
          icon={<Trash size={ICON_SIZE} weight="regular" />}
        />
      </ToolbarGroup>

      {/* Insert & Hierarchy */}
      <ToolbarGroup label="Structure" className="mr-2">
        <ToolbarButton
          onClick={handleInsertAbove}
          disabled={!canInsert}
          title="Insert task above"
          aria-label="Insert task above"
          icon={<RowsPlusTop size={ICON_SIZE} weight="regular" />}
        />
        <ToolbarButton
          onClick={handleInsertBelow}
          disabled={!canInsert}
          title="Insert task below"
          aria-label="Insert task below"
          icon={<RowsPlusBottom size={ICON_SIZE} weight="regular" />}
        />
        <ToolbarButton
          onClick={outdentSelectedTasks}
          disabled={!canOutdent}
          title="Move left (outdent) - Shift+Tab"
          aria-label="Outdent"
          icon={<TextOutdent size={ICON_SIZE} weight="regular" />}
        />
        <ToolbarButton
          onClick={indentSelectedTasks}
          disabled={!canIndent}
          title="Move right (indent) - Tab"
          aria-label="Indent"
          icon={<TextIndent size={ICON_SIZE} weight="regular" />}
        />
      </ToolbarGroup>

      {/* Primary Action */}
      <ToolbarButton
        variant="primary"
        onClick={handleAddTask}
        aria-label="Add new task"
        icon={<Plus size={16} weight="bold" />}
        label="Add Task"
      />

      {/* ─── Spacer ─── */}
      <ToolbarSpacer />

      {/* ─── Right Section: View & Settings ─── */}

      {/* View Toggle */}
      <ToolbarGroup label="View" className="mr-1">
        <ToolbarButton
          variant="toggle"
          isActive={showDependencies}
          onClick={toggleDependencies}
          title={
            showDependencies ? "Hide Dependencies (D)" : "Show Dependencies (D)"
          }
          aria-label={
            showDependencies ? "Hide Dependencies" : "Show Dependencies"
          }
          icon={<FlowArrow size={ICON_SIZE} weight="regular" />}
        />
      </ToolbarGroup>

      {/* Export & Settings */}
      <ToolbarGroup label="Project" className="mr-1">
        <ToolbarButton
          onClick={openExportDialog}
          title="Export to PNG (Ctrl+E)"
          aria-label="Export to PNG"
          icon={<Export size={ICON_SIZE} weight="regular" />}
        />
        <ToolbarButton
          onClick={openChartSettingsDialog}
          title="Chart Settings"
          aria-label="Chart Settings"
          icon={<Sliders size={ICON_SIZE} weight="regular" />}
        />
        <ToolbarButton
          onClick={openPreferencesDialog}
          title="Preferences"
          aria-label="Preferences"
          icon={<Gear size={ICON_SIZE} weight="regular" />}
        />
        <ToolbarButton
          onClick={openHelpPanel}
          title="Help (?)"
          aria-label="Help"
          icon={<Question size={ICON_SIZE} weight="regular" />}
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Zoom Controls */}
      <ToolbarGroup label="Zoom">
        <ToolbarButton
          onClick={zoomOut}
          disabled={!canZoomOut}
          title="Zoom Out (Ctrl+-)"
          aria-label="Zoom out"
          icon={<MagnifyingGlassMinus size={ICON_SIZE} weight="regular" />}
        />
        <select
          className="h-6"
          value={zoomPercentage}
          onChange={handleZoomLevelChange}
          aria-label="Zoom level"
        >
          {zoomOptions.map((level) => (
            <option key={level} value={level}>
              {level}%
            </option>
          ))}
          <option value="fit">Fit to Width</option>
        </select>
        <ToolbarButton
          onClick={zoomIn}
          disabled={!canZoomIn}
          title="Zoom In (Ctrl++)"
          aria-label="Zoom in"
          icon={<MagnifyingGlassPlus size={ICON_SIZE} weight="regular" />}
        />
        <ToolbarButton
          onClick={() => fitToView(tasks)}
          title="Fit to width"
          aria-label="Fit to width"
          icon={<ArrowsOutLineHorizontal size={ICON_SIZE} weight="regular" />}
        />
      </ToolbarGroup>
    </header>
  );
}
