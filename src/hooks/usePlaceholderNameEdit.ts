/**
 * usePlaceholderNameEdit — editing state, focus management, and keyboard
 * handling for the placeholder row's name cell.
 *
 * Extracted from PlaceholderNameCell to keep the component under 100 LOC
 * and to make the editing logic independently testable.
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type RefObject,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useTaskStore } from "../store/slices/taskSlice";
import { useIsPlaceholderSelected } from "./useIsPlaceholderSelected";
import { useNewTaskCreation } from "./useNewTaskCreation";
import { PLACEHOLDER_TASK_ID } from "../config/placeholderRow";
import { ARROW_NAV } from "../config/keyboardNavigation";
import { SCROLL_DRIVER_SELECTOR } from "../config/layoutConstants";

interface UsePlaceholderNameEditReturn {
  isEditing: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  isNameActive: boolean;
  isSelected: boolean;
  showActiveBorder: boolean;
  handleClick: (e: MouseEvent) => void;
  handleKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  handleInputBlur: () => void;
  handleInputKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  handleCompositionStart: () => void;
  handleCompositionEnd: () => void;
}

export function usePlaceholderNameEdit(
  cellRef: RefObject<HTMLDivElement>,
  inputRef: RefObject<HTMLInputElement>
): UsePlaceholderNameEditReturn {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  // Track IME composition state so blur during active composition does not
  // commit the raw/partial input string (e.g., romaji mid-conversion on CJK
  // keyboards). Set via onCompositionStart / onCompositionEnd events.
  const isComposingRef = useRef(false);

  const setActiveCell = useTaskStore((s) => s.setActiveCell);
  const clearSelection = useTaskStore((s) => s.clearSelection);
  const navigateCell = useTaskStore((s) => s.navigateCell);
  const isSelected = useIsPlaceholderSelected();
  const isNameActive = useTaskStore(
    (s) =>
      s.activeCell.taskId === PLACEHOLDER_TASK_ID &&
      s.activeCell.field === "name"
  );

  const { createTask } = useNewTaskCreation();

  // Scroll the outerScrollRef (vertical scroll driver) so the placeholder is visible.
  // Must NOT use el.scrollIntoView() — desyncs TaskTable from Timeline (GitHub #16).
  // cellRef intentionally omitted from deps: the ref object is a stable identity
  // (React guarantees it never changes); .current is read imperatively inside
  // the callback, not captured in the closure.
  const scrollIntoView = useCallback(() => {
    const el = cellRef.current;
    if (!el) return;
    const outerScroll = el.closest(SCROLL_DRIVER_SELECTOR);
    if (!outerScroll) return;
    const outerRect = outerScroll.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    if (elRect.bottom > outerRect.bottom) {
      outerScroll.scrollTop += elRect.bottom - outerRect.bottom;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus cell when it becomes active (not editing).
  // preventScroll: true prevents desyncing TaskTable from Timeline (GitHub #16).
  useEffect(() => {
    if (isNameActive && !isEditing && cellRef.current) {
      cellRef.current.focus({ preventScroll: true });
      scrollIntoView();
    }
  }, [isNameActive, isEditing, cellRef, scrollIntoView]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
      scrollIntoView();
    }
  }, [isEditing, inputRef, scrollIntoView]);

  // Commits the new task if a name was entered; otherwise discards the edit.
  const commitOrCancel = useCallback((): void => {
    const trimmed = inputValue.trim();
    if (trimmed) createTask(trimmed);
    setIsEditing(false);
    setInputValue("");
  }, [inputValue, createTask]);

  const cancelEdit = useCallback((): void => {
    setIsEditing(false);
    setInputValue("");
  }, []);

  const handleClick = useCallback(
    (e: MouseEvent): void => {
      e.stopPropagation();
      clearSelection();
      if (isNameActive && !isEditing) {
        setIsEditing(true);
      } else if (!isNameActive) {
        setActiveCell(PLACEHOLDER_TASK_ID, "name");
      }
    },
    [clearSelection, isNameActive, isEditing, setActiveCell]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>): void => {
      if (isEditing) return;

      // Arrow key navigation — matches PlaceholderDataCell / Cell.tsx contract
      const direction = ARROW_NAV[e.key];
      if (direction) {
        e.preventDefault();
        navigateCell(direction);
        return;
      }

      if (e.key === "Enter" || e.key === "F2") {
        e.preventDefault();
        setIsEditing(true);
      } else if (e.key === "Tab") {
        e.preventDefault();
        navigateCell(e.shiftKey ? "left" : "right");
      } else if (
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.nativeEvent.isComposing
      ) {
        e.preventDefault();
        setInputValue(e.key);
        setIsEditing(true);
      } else if (e.key === "Escape") {
        setActiveCell(null, null);
      }
    },
    [isEditing, navigateCell, setActiveCell]
  );

  // Guard: skip commit on blur if IME composition is still active.
  // Without this, blurring during CJK input commits the raw romaji/pinyin
  // rather than the composed character (GitHub #16 pattern).
  const handleInputBlur = useCallback((): void => {
    if (isComposingRef.current) return;
    commitOrCancel();
  }, [commitOrCancel]);

  const handleCompositionStart = useCallback((): void => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback((): void => {
    isComposingRef.current = false;
  }, []);

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitOrCancel();
      } else if (e.key === "Tab") {
        e.preventDefault();
        commitOrCancel();
        navigateCell(e.shiftKey ? "left" : "right");
      } else if (e.key === "Escape") {
        // cancelEdit sets isEditing=false → the useEffect above re-focuses the cell
        cancelEdit();
      }
    },
    [commitOrCancel, cancelEdit, navigateCell]
  );

  return {
    isEditing,
    inputValue,
    setInputValue,
    isNameActive,
    isSelected,
    // Active border when either editing or cell is keyboard-focused (name-active).
    showActiveBorder: isEditing || isNameActive,
    handleClick,
    handleKeyDown,
    handleInputBlur,
    handleInputKeyDown,
    handleCompositionStart,
    handleCompositionEnd,
  };
}
