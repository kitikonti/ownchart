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
}

export function usePlaceholderNameEdit(
  cellRef: RefObject<HTMLDivElement | null>,
  inputRef: RefObject<HTMLInputElement | null>
): UsePlaceholderNameEditReturn {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

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
  // Stable callback (empty deps) — reads cellRef.current at call time.
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
  }, [cellRef]);

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

  const commitNewTask = useCallback((): void => {
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
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setInputValue(e.key);
        setIsEditing(true);
      } else if (e.key === "Escape") {
        setActiveCell(null, null);
      }
    },
    [isEditing, navigateCell, setActiveCell]
  );

  const handleInputBlur = useCallback((): void => {
    if (inputValue.trim()) {
      commitNewTask();
    } else {
      cancelEdit();
    }
  }, [inputValue, commitNewTask, cancelEdit]);

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (inputValue.trim()) {
          commitNewTask();
        } else {
          cancelEdit();
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        if (inputValue.trim()) {
          commitNewTask();
        } else {
          cancelEdit();
        }
        navigateCell(e.shiftKey ? "left" : "right");
      } else if (e.key === "Escape") {
        // cancelEdit sets isEditing=false → the useEffect above re-focuses the cell
        cancelEdit();
      }
    },
    [inputValue, commitNewTask, cancelEdit, navigateCell]
  );

  return {
    isEditing,
    inputValue,
    setInputValue,
    isNameActive,
    isSelected,
    showActiveBorder: isEditing || isNameActive,
    handleClick,
    handleKeyDown,
    handleInputBlur,
    handleInputKeyDown,
  };
}
