/**
 * Unit tests for useKeyboardShortcuts hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useKeyboardShortcuts,
  isTextInputElement,
} from '@/hooks/useKeyboardShortcuts';
import { useHistoryStore } from '@/store/slices/historySlice';
import { useChartStore } from '@/store/slices/chartSlice';
import { useTaskStore } from '@/store/slices/taskSlice';
import { useUIStore } from '@/store/slices/uiSlice';
import { useClipboardStore } from '@/store/slices/clipboardSlice';
import type { Task } from '@/types/chart.types';

// ── Module mocks ────────────────────────────────────────────────────────────

const mockHandleSave = vi.fn();
const mockHandleSaveAs = vi.fn();
const mockHandleOpen = vi.fn();
const mockHandleNew = vi.fn();

vi.mock('../../../src/hooks/useFileOperations', () => ({
  useFileOperations: () => ({
    handleSave: mockHandleSave,
    handleSaveAs: mockHandleSaveAs,
    handleOpen: mockHandleOpen,
    handleNew: mockHandleNew,
    fileName: null,
    isDirty: false,
    lastSaved: null,
  }),
}));

const mockHandleCopy = vi.fn();
const mockHandleCut = vi.fn();
const mockHandlePaste = vi.fn();

vi.mock('../../../src/hooks/useClipboardOperations', () => ({
  useClipboardOperations: () => ({
    handleCopy: mockHandleCopy,
    handleCut: mockHandleCut,
    handlePaste: mockHandlePaste,
    canCopyOrCut: false,
    canPaste: false,
  }),
}));

const mockHideRows = vi.fn();
const mockUnhideSelection = vi.fn();

vi.mock('../../../src/hooks/useHideOperations', () => ({
  useHideOperations: () => ({
    hideRows: mockHideRows,
    unhideSelection: mockUnhideSelection,
    showAll: vi.fn(),
    unhideRange: vi.fn(),
    getHiddenInSelectionCount: vi.fn().mockReturnValue(0),
  }),
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

const simulateKeyPress = (
  key: string,
  options: Partial<KeyboardEventInit> = {},
): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  window.dispatchEvent(event);
  return event;
};

const makeTasks = (count: number): Task[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `task-${i + 1}`,
    name: `Task ${i + 1}`,
    startDate: '2025-01-10',
    endDate: '2025-01-17',
    duration: 7,
    progress: 0,
    color: '#3b82f6',
    order: i,
    type: 'task' as const,
    metadata: {},
  }));

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useKeyboardShortcuts', () => {
  let undoSpy: ReturnType<typeof vi.fn>;
  let redoSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    undoSpy = vi.fn();
    redoSpy = vi.fn();

    useHistoryStore.setState({
      undoStack: [],
      redoStack: [],
      isUndoing: false,
      isRedoing: false,
    });
    vi.spyOn(useHistoryStore.getState(), 'undo').mockImplementation(undoSpy);
    vi.spyOn(useHistoryStore.getState(), 'redo').mockImplementation(redoSpy);

    useTaskStore.setState({
      tasks: makeTasks(3),
      selectedTaskIds: [],
      lastSelectedTaskId: null,
      activeCell: { taskId: null, field: null },
      isEditingCell: false,
    });

    useChartStore.setState({
      showDependencies: true,
      showTodayMarker: true,
      showProgress: true,
      showHolidays: true,
    });

    useUIStore.setState({
      isExportDialogOpen: false,
      isHelpPanelOpen: false,
      isWelcomeTourOpen: false,
    });

    useClipboardStore.setState({ activeMode: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Undo / Redo ────────────────────────────────────────────────────────

  describe('Undo/Redo shortcuts', () => {
    it('should call undo on Ctrl+Z', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('z', { ctrlKey: true });
      expect(undoSpy).toHaveBeenCalledTimes(1);
      expect(redoSpy).not.toHaveBeenCalled();
    });

    it('should call redo on Ctrl+Shift+Z', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('z', { ctrlKey: true, shiftKey: true });
      expect(redoSpy).toHaveBeenCalledTimes(1);
      expect(undoSpy).not.toHaveBeenCalled();
    });

    it('should call redo on Ctrl+Y', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('y', { ctrlKey: true });
      expect(redoSpy).toHaveBeenCalledTimes(1);
      expect(undoSpy).not.toHaveBeenCalled();
    });

    it('should work with uppercase keys', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('Z', { ctrlKey: true });
      expect(undoSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ── File operations ────────────────────────────────────────────────────

  describe('File operation shortcuts', () => {
    it('should call handleSave on Ctrl+S', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('s', { ctrlKey: true });
      expect(mockHandleSave).toHaveBeenCalledTimes(1);
      expect(mockHandleSaveAs).not.toHaveBeenCalled();
    });

    it('should call handleSaveAs on Ctrl+Shift+S', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('s', { ctrlKey: true, shiftKey: true });
      expect(mockHandleSaveAs).toHaveBeenCalledTimes(1);
      expect(mockHandleSave).not.toHaveBeenCalled();
    });

    it('should call handleOpen on Ctrl+O', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('o', { ctrlKey: true });
      expect(mockHandleOpen).toHaveBeenCalledTimes(1);
    });

    it('should call handleNew on Ctrl+Alt+N', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('n', { ctrlKey: true, altKey: true });
      expect(mockHandleNew).toHaveBeenCalledTimes(1);
    });

    it('should open export dialog on Ctrl+E', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('e', { ctrlKey: true });
      expect(useUIStore.getState().isExportDialogOpen).toBe(true);
    });
  });

  // ── Clipboard ──────────────────────────────────────────────────────────

  describe('Clipboard shortcuts', () => {
    it('should call handleCopy on Ctrl+C', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('c', { ctrlKey: true });
      expect(mockHandleCopy).toHaveBeenCalledTimes(1);
    });

    it('should call handleCut on Ctrl+X', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('x', { ctrlKey: true });
      expect(mockHandleCut).toHaveBeenCalledTimes(1);
    });

    it('should call handlePaste on Ctrl+V', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('v', { ctrlKey: true });
      expect(mockHandlePaste).toHaveBeenCalledTimes(1);
    });
  });

  // ── ESC key ────────────────────────────────────────────────────────────

  describe('ESC key – dialog close priority', () => {
    it('should close export dialog first when it is open', () => {
      useUIStore.setState({
        isExportDialogOpen: true,
        isHelpPanelOpen: true,
        isWelcomeTourOpen: true,
      });
      useClipboardStore.setState({ activeMode: 'copy' });
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('Escape');

      expect(useUIStore.getState().isExportDialogOpen).toBe(false);
      // Lower-priority dialogs must stay open
      expect(useUIStore.getState().isHelpPanelOpen).toBe(true);
    });

    it('should close help panel when export dialog is closed', () => {
      useUIStore.setState({
        isExportDialogOpen: false,
        isHelpPanelOpen: true,
        isWelcomeTourOpen: true,
      });
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('Escape');

      expect(useUIStore.getState().isHelpPanelOpen).toBe(false);
      expect(useUIStore.getState().isWelcomeTourOpen).toBe(true);
    });

    it('should close welcome tour when help panel is also closed', () => {
      useUIStore.setState({
        isExportDialogOpen: false,
        isHelpPanelOpen: false,
        isWelcomeTourOpen: true,
      });
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('Escape');

      expect(useUIStore.getState().isWelcomeTourOpen).toBe(false);
    });

    it('should clear clipboard when no dialog is open', () => {
      useClipboardStore.setState({ activeMode: 'copy' });
      const clearSpy = vi.spyOn(useClipboardStore.getState(), 'clearClipboard');
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('Escape');

      expect(clearSpy).toHaveBeenCalledTimes(1);
    });

    it('should do nothing when no dialog is open and clipboard is empty', () => {
      const clearSpy = vi.spyOn(useClipboardStore.getState(), 'clearClipboard');
      renderHook(() => useKeyboardShortcuts());

      const event = simulateKeyPress('Escape');

      expect(clearSpy).not.toHaveBeenCalled();
      // No handler consumed the event, so it should not be prevented
      expect(event.defaultPrevented).toBe(false);
    });
  });

  // ── Help panel ─────────────────────────────────────────────────────────

  describe('? key (help panel)', () => {
    it('should open help panel on ? key', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('?');
      expect(useUIStore.getState().isHelpPanelOpen).toBe(true);
    });

    it('should open help panel on Shift+/ (US keyboard ?)', () => {
      // On US keyboards ? is produced by Shift+/ so shiftKey is true.
      // The handler explicitly allows this case before the shiftKey guard.
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('?', { shiftKey: true });
      expect(useUIStore.getState().isHelpPanelOpen).toBe(true);
    });

    it('should not open help panel when a modifier is held', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('?', { ctrlKey: true });
      expect(useUIStore.getState().isHelpPanelOpen).toBe(false);
    });

    it('should not open help panel when altKey is held', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('?', { altKey: true });
      expect(useUIStore.getState().isHelpPanelOpen).toBe(false);
    });

    it('should not open help panel when a cell is active', () => {
      useTaskStore.setState({
        activeCell: { taskId: 'task-1', field: 'name' },
      });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('?');
      expect(useUIStore.getState().isHelpPanelOpen).toBe(false);
    });
  });

  // ── Input-element filtering ────────────────────────────────────────────

  describe('Input element filtering', () => {
    it('should not trigger shortcuts when typing in a text input', () => {
      renderHook(() => useKeyboardShortcuts());

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'z',
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(undoSpy).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });

    it('should not trigger shortcuts when typing in a textarea', () => {
      renderHook(() => useKeyboardShortcuts());

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 's',
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(mockHandleSave).not.toHaveBeenCalled();
      document.body.removeChild(textarea);
    });

    it('should not trigger single-key shortcuts when a select element is focused', () => {
      renderHook(() => useKeyboardShortcuts());

      const select = document.createElement('select');
      document.body.appendChild(select);
      select.focus();
      select.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'd',
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(useChartStore.getState().showDependencies).toBe(true);
      document.body.removeChild(select);
    });

    it('should not trigger shortcuts in contentEditable elements', () => {
      // jsdom does not propagate the contentEditable attribute to
      // isContentEditable, so we use Object.defineProperty to set the
      // property directly on the element before dispatching the event.
      renderHook(() => useKeyboardShortcuts());

      const div = document.createElement('div');
      Object.defineProperty(div, 'isContentEditable', {
        value: true,
        writable: true,
        configurable: true,
      });
      document.body.appendChild(div);
      div.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'y',
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(redoSpy).not.toHaveBeenCalled();
      document.body.removeChild(div);
    });

    it('should trigger shortcuts when focused on a non-input element', () => {
      renderHook(() => useKeyboardShortcuts());

      const div = document.createElement('div');
      document.body.appendChild(div);
      div.focus();
      div.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'z',
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(undoSpy).toHaveBeenCalledTimes(1);
      document.body.removeChild(div);
    });
  });

  // ── Event lifecycle ────────────────────────────────────────────────────

  describe('Event cleanup', () => {
    it('should remove event listener on unmount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useKeyboardShortcuts());
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
      );

      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
      );
    });

    it('should not re-register the listener on re-renders', () => {
      const addListenerSpy = vi.spyOn(window, 'addEventListener');

      const { rerender } = renderHook(() => useKeyboardShortcuts());
      const countAfterMount = addListenerSpy.mock.calls.filter(
        ([event]) => event === 'keydown',
      ).length;

      // Multiple re-renders must not add extra listeners.
      rerender();
      rerender();
      useChartStore.setState({ showDependencies: false });
      rerender();
      useTaskStore.setState({ selectedTaskIds: ['task-1'] });
      rerender();

      const countAfterRerenders = addListenerSpy.mock.calls.filter(
        ([event]) => event === 'keydown',
      ).length;

      expect(countAfterRerenders).toBe(countAfterMount);
    });
  });

  // ── Mac vs Windows ─────────────────────────────────────────────────────
  //
  // IS_MAC is a module-level constant evaluated once at import time.
  // jsdom exposes navigator.platform as '' (empty) and does not provide
  // navigator.userAgentData, so IS_MAC is always false in the test
  // environment.  We therefore verify ctrlKey-based behaviour (the
  // non-Mac path) and confirm that metaKey alone is correctly ignored.

  describe('Mac vs Windows modifier key', () => {
    it('should use ctrlKey as the modifier (IS_MAC is false in jsdom)', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('z', { ctrlKey: true });
      expect(undoSpy).toHaveBeenCalledTimes(1);
    });

    it('should not trigger shortcuts on metaKey alone (IS_MAC is false in jsdom)', () => {
      renderHook(() => useKeyboardShortcuts());
      // metaKey without ctrlKey — should be a no-op on non-Mac platforms.
      simulateKeyPress('z', { metaKey: true });
      expect(undoSpy).not.toHaveBeenCalled();
    });
  });

  // ── View toggles ───────────────────────────────────────────────────────

  describe('View toggle shortcuts', () => {
    it('should toggle dependencies on D key', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('d');
      expect(useChartStore.getState().showDependencies).toBe(false);
    });

    it('should toggle today marker on T key', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('t');
      expect(useChartStore.getState().showTodayMarker).toBe(false);
    });

    it('should toggle progress on P key', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('p');
      expect(useChartStore.getState().showProgress).toBe(false);
    });

    it('should toggle holidays on H key', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('h');
      expect(useChartStore.getState().showHolidays).toBe(false);
    });

    it('should not fire view toggles when modifier keys are held', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('d', { ctrlKey: true });
      expect(useChartStore.getState().showDependencies).toBe(true);
      simulateKeyPress('d', { altKey: true });
      expect(useChartStore.getState().showDependencies).toBe(true);
      simulateKeyPress('d', { shiftKey: true });
      expect(useChartStore.getState().showDependencies).toBe(true);
    });

    it('should not fire view toggles when a cell is active', () => {
      useTaskStore.setState({
        activeCell: { taskId: 'task-1', field: 'name' },
      });
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('d');
      expect(useChartStore.getState().showDependencies).toBe(true);

      simulateKeyPress('t');
      expect(useChartStore.getState().showTodayMarker).toBe(true);
    });

    it('should work with uppercase keys', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('D');
      expect(useChartStore.getState().showDependencies).toBe(false);
    });

    it('should call fitToView on F key', () => {
      const fitToViewSpy = vi.spyOn(useChartStore.getState(), 'fitToView');
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('f');
      expect(fitToViewSpy).toHaveBeenCalledTimes(1);
    });

    it('should not call fitToView when a cell is active', () => {
      useTaskStore.setState({
        activeCell: { taskId: 'task-1', field: 'name' },
      });
      const fitToViewSpy = vi.spyOn(useChartStore.getState(), 'fitToView');
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('f');
      expect(fitToViewSpy).not.toHaveBeenCalled();
    });
  });

  // ── Delete key ─────────────────────────────────────────────────────────

  describe('Delete key', () => {
    it('should delete selected tasks on Delete', () => {
      useTaskStore.setState({ selectedTaskIds: ['task-1'] });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('Delete');
      expect(useTaskStore.getState().tasks).toHaveLength(2);
    });

    it('should not delete when no tasks are selected', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('Delete');
      expect(useTaskStore.getState().tasks).toHaveLength(3);
    });

    it('should not delete on Delete when isEditingCell is true', () => {
      useTaskStore.setState({
        selectedTaskIds: ['task-1'],
        isEditingCell: true,
      });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('Delete');
      expect(useTaskStore.getState().tasks).toHaveLength(3);
    });
  });

  // ── Ctrl++ / Ctrl+- ────────────────────────────────────────────────────

  describe('Ctrl++ / Ctrl+- row insert/delete shortcuts', () => {
    it('should insert one row above when a single task is selected via Ctrl++', () => {
      useTaskStore.setState({ selectedTaskIds: ['task-2'] });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('+', { ctrlKey: true });
      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(4);
      const sorted = [...tasks].sort((a, b) => a.order - b.order);
      expect(sorted[1].name).toBe('New Task');
      expect(sorted[2].id).toBe('task-2');
    });

    it('should insert N rows when N tasks are selected via Ctrl++', () => {
      useTaskStore.setState({
        selectedTaskIds: ['task-1', 'task-2', 'task-3'],
      });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('=', { ctrlKey: true });
      expect(useTaskStore.getState().tasks).toHaveLength(6);
    });

    it('should use topmost selected task as reference for Ctrl++', () => {
      useTaskStore.setState({ selectedTaskIds: ['task-3', 'task-2'] });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('+', { ctrlKey: true });
      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(5);
      const sorted = [...tasks].sort((a, b) => a.order - b.order);
      expect(sorted[0].id).toBe('task-1');
      expect(sorted[1].name).toBe('New Task');
      expect(sorted[2].name).toBe('New Task');
      expect(sorted[3].id).toBe('task-2');
    });

    it('should fall back to activeCell.taskId for Ctrl++ when no selection', () => {
      useTaskStore.setState({
        selectedTaskIds: [],
        activeCell: { taskId: 'task-2', field: 'name' },
      });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('+', { ctrlKey: true });
      expect(useTaskStore.getState().tasks).toHaveLength(4);
    });

    it('should do nothing for Ctrl++ when no selection and no active cell', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('+', { ctrlKey: true });
      expect(useTaskStore.getState().tasks).toHaveLength(3);
    });

    it('should not insert when editing a cell via Ctrl++', () => {
      useTaskStore.setState({
        selectedTaskIds: ['task-1'],
        isEditingCell: true,
      });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('+', { ctrlKey: true });
      expect(useTaskStore.getState().tasks).toHaveLength(3);
    });

    it('should delete selected tasks via Ctrl+-', () => {
      useTaskStore.setState({ selectedTaskIds: ['task-2'] });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('-', { ctrlKey: true });
      expect(useTaskStore.getState().tasks).toHaveLength(2);
      expect(
        useTaskStore.getState().tasks.find((t) => t.id === 'task-2'),
      ).toBeUndefined();
    });

    it('should delete selected tasks via Ctrl+_ (underscore alias)', () => {
      useTaskStore.setState({ selectedTaskIds: ['task-2'] });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('_', { ctrlKey: true });
      expect(useTaskStore.getState().tasks).toHaveLength(2);
      expect(
        useTaskStore.getState().tasks.find((t) => t.id === 'task-2'),
      ).toBeUndefined();
    });

    it('should not delete when editing a cell via Ctrl+-', () => {
      useTaskStore.setState({
        selectedTaskIds: ['task-1'],
        isEditingCell: true,
      });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('-', { ctrlKey: true });
      expect(useTaskStore.getState().tasks).toHaveLength(3);
    });

    it('should delete active cell task via Ctrl+- when no selection', () => {
      useTaskStore.setState({
        selectedTaskIds: [],
        activeCell: { taskId: 'task-2', field: 'name' },
      });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('-', { ctrlKey: true });
      expect(useTaskStore.getState().tasks).toHaveLength(2);
      expect(
        useTaskStore.getState().tasks.find((t) => t.id === 'task-2'),
      ).toBeUndefined();
    });

    it('should not delete when no selection and no active cell via Ctrl+-', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('-', { ctrlKey: true });
      expect(useTaskStore.getState().tasks).toHaveLength(3);
    });
  });

  // ── Indent / Outdent ───────────────────────────────────────────────────

  describe('Alt+Shift+Arrow indent/outdent shortcuts', () => {
    it('should indent task via Alt+Shift+Right with row selection', () => {
      useTaskStore.setState({ selectedTaskIds: ['task-2'] });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('ArrowRight', { altKey: true, shiftKey: true });
      const task2 = useTaskStore.getState().tasks.find((t) => t.id === 'task-2');
      expect(task2?.parent).toBe('task-1');
    });

    it('should indent task via Alt+Shift+Right with active cell only', () => {
      useTaskStore.setState({
        selectedTaskIds: [],
        activeCell: { taskId: 'task-2', field: 'name' },
      });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('ArrowRight', { altKey: true, shiftKey: true });
      const task2 = useTaskStore.getState().tasks.find((t) => t.id === 'task-2');
      expect(task2?.parent).toBe('task-1');
    });

    it('should outdent task via Alt+Shift+Left with active cell', () => {
      const tasks = makeTasks(3);
      tasks[1].parent = 'task-1';
      useTaskStore.setState({
        tasks,
        selectedTaskIds: [],
        activeCell: { taskId: 'task-2', field: 'name' },
      });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('ArrowLeft', { altKey: true, shiftKey: true });
      const task2 = useTaskStore
        .getState()
        .tasks.find((t) => t.id === 'task-2');
      expect(task2?.parent).toBeUndefined();
    });

    it('should not indent/outdent when editing a cell', () => {
      useTaskStore.setState({
        selectedTaskIds: ['task-2'],
        isEditingCell: true,
      });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('ArrowRight', { altKey: true, shiftKey: true });
      const task2 = useTaskStore.getState().tasks.find((t) => t.id === 'task-2');
      expect(task2?.parent).toBeUndefined();
    });

    it('should preventDefault for Alt+Shift+Right', () => {
      useTaskStore.setState({ selectedTaskIds: ['task-2'] });
      renderHook(() => useKeyboardShortcuts());
      const event = simulateKeyPress('ArrowRight', {
        altKey: true,
        shiftKey: true,
      });
      expect(event.defaultPrevented).toBe(true);
    });

    it('should preventDefault for Alt+Shift+Left', () => {
      const tasks = makeTasks(3);
      tasks[1].parent = 'task-1';
      useTaskStore.setState({ tasks, selectedTaskIds: ['task-2'] });
      renderHook(() => useKeyboardShortcuts());
      const event = simulateKeyPress('ArrowLeft', {
        altKey: true,
        shiftKey: true,
      });
      expect(event.defaultPrevented).toBe(true);
    });
  });

  // ── Group / Ungroup ────────────────────────────────────────────────────

  describe('Ctrl+G / Ctrl+Shift+G group/ungroup shortcuts', () => {
    it('should group selected tasks on Ctrl+G', () => {
      useTaskStore.setState({ selectedTaskIds: ['task-1', 'task-2'] });
      const groupSpy = vi.spyOn(useTaskStore.getState(), 'groupSelectedTasks');
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('g', { ctrlKey: true });
      expect(groupSpy).toHaveBeenCalledTimes(1);
    });

    it('should ungroup selected tasks on Ctrl+Shift+G', () => {
      useTaskStore.setState({ selectedTaskIds: ['task-1'] });
      const ungroupSpy = vi.spyOn(
        useTaskStore.getState(),
        'ungroupSelectedTasks',
      );
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('g', { ctrlKey: true, shiftKey: true });
      expect(ungroupSpy).toHaveBeenCalledTimes(1);
    });

    it('Ctrl+Shift+G must not also trigger Ctrl+G', () => {
      const groupSpy = vi.spyOn(useTaskStore.getState(), 'groupSelectedTasks');
      const ungroupSpy = vi.spyOn(
        useTaskStore.getState(),
        'ungroupSelectedTasks',
      );
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('g', { ctrlKey: true, shiftKey: true });
      expect(ungroupSpy).toHaveBeenCalledTimes(1);
      expect(groupSpy).not.toHaveBeenCalled();
    });

    it('should not act when editing a cell', () => {
      useTaskStore.setState({ isEditingCell: true });
      const groupSpy = vi.spyOn(useTaskStore.getState(), 'groupSelectedTasks');
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('g', { ctrlKey: true });
      expect(groupSpy).not.toHaveBeenCalled();
    });
  });

  // ── Hide / Unhide ──────────────────────────────────────────────────────

  describe('Ctrl+H / Ctrl+Shift+H hide/unhide shortcuts', () => {
    it('should hide selected rows on Ctrl+H', () => {
      useTaskStore.setState({ selectedTaskIds: ['task-1', 'task-2'] });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('h', { ctrlKey: true });
      expect(mockHideRows).toHaveBeenCalledWith(['task-1', 'task-2']);
    });

    it('should not call hideRows on Ctrl+H when no tasks are selected', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('h', { ctrlKey: true });
      expect(mockHideRows).not.toHaveBeenCalled();
    });

    it('should not consume the event on Ctrl+H when no tasks are selected', () => {
      renderHook(() => useKeyboardShortcuts());
      // With no selection the shortcut is a no-op; the browser default is
      // intentionally not suppressed. toggleHolidays must not fire either
      // because modKey is true (caught by handleSingleKeyShortcuts guard).
      const event = simulateKeyPress('h', { ctrlKey: true });
      expect(event.defaultPrevented).toBe(false);
      expect(mockHideRows).not.toHaveBeenCalled();
      expect(useChartStore.getState().showHolidays).toBe(true);
    });

    it('should call unhideSelection on Ctrl+Shift+H', () => {
      useTaskStore.setState({ selectedTaskIds: ['task-1', 'task-3'] });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('h', { ctrlKey: true, shiftKey: true });
      expect(mockUnhideSelection).toHaveBeenCalledWith(['task-1', 'task-3']);
    });

    it('Ctrl+H must not trigger toggleHolidays', () => {
      useTaskStore.setState({ selectedTaskIds: ['task-1'] });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('h', { ctrlKey: true });
      expect(useChartStore.getState().showHolidays).toBe(true);
    });

    it('should not hide rows on Ctrl+H when isEditingCell is true', () => {
      useTaskStore.setState({
        selectedTaskIds: ['task-1', 'task-2'],
        isEditingCell: true,
      });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('h', { ctrlKey: true });
      expect(mockHideRows).not.toHaveBeenCalled();
    });

    it('should not unhide rows on Ctrl+Shift+H when isEditingCell is true', () => {
      useTaskStore.setState({
        selectedTaskIds: ['task-1', 'task-3'],
        isEditingCell: true,
      });
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('h', { ctrlKey: true, shiftKey: true });
      expect(mockUnhideSelection).not.toHaveBeenCalled();
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('should not trigger on a key without a modifier', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('z');
      expect(undoSpy).not.toHaveBeenCalled();
      expect(redoSpy).not.toHaveBeenCalled();
    });

    it('should not trigger on a wrong key with modifier', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('a', { ctrlKey: true });
      expect(undoSpy).not.toHaveBeenCalled();
      expect(mockHandleSave).not.toHaveBeenCalled();
    });

    it('should handle multiple shortcuts in sequence', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('z', { ctrlKey: true });
      simulateKeyPress('y', { ctrlKey: true });
      simulateKeyPress('s', { ctrlKey: true });
      expect(undoSpy).toHaveBeenCalledTimes(1);
      expect(redoSpy).toHaveBeenCalledTimes(1);
      expect(mockHandleSave).toHaveBeenCalledTimes(1);
    });

    it('should call preventDefault for all handled shortcuts', () => {
      renderHook(() => useKeyboardShortcuts());
      const event = simulateKeyPress('s', { ctrlKey: true });
      expect(event.defaultPrevented).toBe(true);
    });
  });
});

// ── isTextInputElement unit tests ────────────────────────────────────────────

describe('isTextInputElement', () => {
  it('should return true for a text input', () => {
    const el = document.createElement('input');
    el.type = 'text';
    expect(isTextInputElement(el)).toBe(true);
  });

  it('should return true for a password input', () => {
    const el = document.createElement('input');
    el.type = 'password';
    expect(isTextInputElement(el)).toBe(true);
  });

  it('should return false for a checkbox input', () => {
    const el = document.createElement('input');
    el.type = 'checkbox';
    expect(isTextInputElement(el)).toBe(false);
  });

  it('should return true for a textarea', () => {
    const el = document.createElement('textarea');
    expect(isTextInputElement(el)).toBe(true);
  });

  it('should return true for a select element', () => {
    const el = document.createElement('select');
    expect(isTextInputElement(el)).toBe(true);
  });

  it('should return true for a contentEditable element', () => {
    const el = document.createElement('div');
    Object.defineProperty(el, 'isContentEditable', {
      value: true,
      writable: true,
      configurable: true,
    });
    expect(isTextInputElement(el)).toBe(true);
  });

  it('should return false for a plain div', () => {
    const el = document.createElement('div');
    expect(isTextInputElement(el)).toBe(false);
  });

  it('should return false for a button', () => {
    const el = document.createElement('button');
    expect(isTextInputElement(el)).toBe(false);
  });
});
