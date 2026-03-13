/**
 * Unit tests for usePlaceholderNameEdit hook.
 *
 * Covers: initial state, click-to-activate, click-to-enter-edit, Enter/F2
 * start edit, Tab commit+navigate, Escape cancel, blur with/without value,
 * character-key starts edit with that character, and arrow-key navigation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePlaceholderNameEdit } from "../../../src/hooks/usePlaceholderNameEdit";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import { PLACEHOLDER_TASK_ID } from "../../../src/config/placeholderRow";
import type { KeyboardEvent, MouseEvent } from "react";
import type { RefObject } from "react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSetActiveCell = vi.fn();
const mockClearSelection = vi.fn();
const mockNavigateCell = vi.fn();
const mockCreateTask = vi.fn();

vi.mock("../../../src/store/slices/taskSlice", () => ({
  useTaskStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      setActiveCell: mockSetActiveCell,
      clearSelection: mockClearSelection,
      navigateCell: mockNavigateCell,
      selectedTaskIds: [],
      activeCell: { taskId: null, field: null },
    })
  ),
}));

vi.mock("../../../src/hooks/useIsPlaceholderSelected", () => ({
  useIsPlaceholderSelected: vi.fn(() => false),
}));

vi.mock("../../../src/hooks/useNewTaskCreation", () => ({
  useNewTaskCreation: vi.fn(() => ({ createTask: mockCreateTask })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal fake RefObject pointing to a div-like element. */
function makeDivRef(el: Partial<HTMLDivElement> = {}): RefObject<HTMLDivElement | null> {
  return { current: { focus: vi.fn(), closest: vi.fn(() => null), ...el } as unknown as HTMLDivElement };
}

/** Build a minimal fake RefObject pointing to an input-like element. */
function makeInputRef(el: Partial<HTMLInputElement> = {}): RefObject<HTMLInputElement | null> {
  return { current: { focus: vi.fn(), ...el } as unknown as HTMLInputElement };
}

/** Fire a synthetic keyboard event on a div (for handleKeyDown). */
function kbDiv(
  key: string,
  extra: Partial<KeyboardEvent<HTMLDivElement>> = {}
): KeyboardEvent<HTMLDivElement> {
  return {
    key,
    preventDefault: vi.fn(),
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    nativeEvent: { isComposing: false },
    ...extra,
  } as unknown as KeyboardEvent<HTMLDivElement>;
}

/** Fire a synthetic keyboard event on an input (for handleInputKeyDown). */
function kbInput(
  key: string,
  extra: Partial<KeyboardEvent<HTMLInputElement>> = {}
): KeyboardEvent<HTMLInputElement> {
  return {
    key,
    preventDefault: vi.fn(),
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...extra,
  } as unknown as KeyboardEvent<HTMLInputElement>;
}

/** Fire a synthetic mouse event (for handleClick). */
function mouseEvt(): MouseEvent {
  return { stopPropagation: vi.fn() } as unknown as MouseEvent;
}

/** Set the Zustand store selector state so isNameActive = true. */
function setNameActive(active: boolean): void {
  vi.mocked(useTaskStore).mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      setActiveCell: mockSetActiveCell,
      clearSelection: mockClearSelection,
      navigateCell: mockNavigateCell,
      selectedTaskIds: [],
      activeCell: active
        ? { taskId: PLACEHOLDER_TASK_ID, field: "name" }
        : { taskId: null, field: null },
    })
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("usePlaceholderNameEdit", () => {
  let cellRef: ReturnType<typeof makeDivRef>;
  let inputRef: ReturnType<typeof makeInputRef>;

  beforeEach(() => {
    vi.clearAllMocks();
    cellRef = makeDivRef();
    inputRef = makeInputRef();
    // Default: not name-active
    setNameActive(false);
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------
  describe("initial state", () => {
    it("should start with isEditing=false and empty inputValue", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));
      expect(result.current.isEditing).toBe(false);
      expect(result.current.inputValue).toBe("");
    });

    it("should return isNameActive=false when activeCell is not on placeholder", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));
      expect(result.current.isNameActive).toBe(false);
    });

    it("should return showActiveBorder=false when not editing and not active", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));
      expect(result.current.showActiveBorder).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // handleClick — activate or enter edit
  // -------------------------------------------------------------------------
  describe("handleClick", () => {
    it("should set active cell when cell is not yet active", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleClick(mouseEvt());
      });

      expect(mockSetActiveCell).toHaveBeenCalledWith(PLACEHOLDER_TASK_ID, "name");
      expect(result.current.isEditing).toBe(false);
    });

    it("should enter editing mode on second click when cell is already active", () => {
      setNameActive(true);
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleClick(mouseEvt());
      });

      expect(result.current.isEditing).toBe(true);
    });

    it("should call clearSelection on every click", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleClick(mouseEvt());
      });

      expect(mockClearSelection).toHaveBeenCalledOnce();
    });

    it("should stop propagation", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));
      const evt = mouseEvt();

      act(() => {
        result.current.handleClick(evt);
      });

      expect(evt.stopPropagation).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // handleKeyDown — cell not in edit mode
  // -------------------------------------------------------------------------
  describe("handleKeyDown (cell focused, not editing)", () => {
    it("should enter editing on Enter key", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleKeyDown(kbDiv("Enter"));
      });

      expect(result.current.isEditing).toBe(true);
    });

    it("should enter editing on F2 key", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleKeyDown(kbDiv("F2"));
      });

      expect(result.current.isEditing).toBe(true);
    });

    it("should navigate right on Tab", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleKeyDown(kbDiv("Tab", { shiftKey: false }));
      });

      expect(mockNavigateCell).toHaveBeenCalledWith("right");
    });

    it("should navigate left on Shift+Tab", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleKeyDown(kbDiv("Tab", { shiftKey: true }));
      });

      expect(mockNavigateCell).toHaveBeenCalledWith("left");
    });

    it("should navigate via arrow keys", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => { result.current.handleKeyDown(kbDiv("ArrowUp")); });
      expect(mockNavigateCell).toHaveBeenCalledWith("up");

      act(() => { result.current.handleKeyDown(kbDiv("ArrowDown")); });
      expect(mockNavigateCell).toHaveBeenCalledWith("down");

      act(() => { result.current.handleKeyDown(kbDiv("ArrowLeft")); });
      expect(mockNavigateCell).toHaveBeenCalledWith("left");

      act(() => { result.current.handleKeyDown(kbDiv("ArrowRight")); });
      expect(mockNavigateCell).toHaveBeenCalledWith("right");
    });

    it("should start editing and pre-fill input when a printable character is pressed", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleKeyDown(kbDiv("a"));
      });

      expect(result.current.isEditing).toBe(true);
      expect(result.current.inputValue).toBe("a");
    });

    it("should NOT start editing for ctrl+key combinations", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleKeyDown(kbDiv("a", { ctrlKey: true }));
      });

      expect(result.current.isEditing).toBe(false);
    });

    it("should clear active cell on Escape", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleKeyDown(kbDiv("Escape"));
      });

      expect(mockSetActiveCell).toHaveBeenCalledWith(null, null);
    });
  });

  // -------------------------------------------------------------------------
  // handleInputKeyDown — cell in edit mode
  // -------------------------------------------------------------------------
  describe("handleInputKeyDown (editing)", () => {
    it("should commit task and exit editing on Enter when value is non-empty", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      // Enter editing mode with a value
      act(() => {
        result.current.handleKeyDown(kbDiv("Enter"));
        result.current.setInputValue("My Task");
      });

      act(() => {
        result.current.handleInputKeyDown(kbInput("Enter"));
      });

      expect(mockCreateTask).toHaveBeenCalledWith("My Task");
      expect(result.current.isEditing).toBe(false);
      expect(result.current.inputValue).toBe("");
    });

    it("should cancel (not commit) on Enter when value is empty or whitespace", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleKeyDown(kbDiv("Enter"));
      });

      // inputValue is "" (default)
      act(() => {
        result.current.handleInputKeyDown(kbInput("Enter"));
      });

      expect(mockCreateTask).not.toHaveBeenCalled();
      expect(result.current.isEditing).toBe(false);
    });

    it("should commit task and navigate on Tab when value is non-empty", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleKeyDown(kbDiv("Enter"));
        result.current.setInputValue("Tab Task");
      });

      act(() => {
        result.current.handleInputKeyDown(kbInput("Tab", { shiftKey: false }));
      });

      expect(mockCreateTask).toHaveBeenCalledWith("Tab Task");
      expect(mockNavigateCell).toHaveBeenCalledWith("right");
      expect(result.current.isEditing).toBe(false);
    });

    it("should cancel and navigate on Shift+Tab when value is empty", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleKeyDown(kbDiv("Enter"));
        // inputValue stays ""
      });

      act(() => {
        result.current.handleInputKeyDown(kbInput("Tab", { shiftKey: true }));
      });

      expect(mockCreateTask).not.toHaveBeenCalled();
      expect(mockNavigateCell).toHaveBeenCalledWith("left");
      expect(result.current.isEditing).toBe(false);
    });

    it("should cancel editing on Escape without committing", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleKeyDown(kbDiv("Enter"));
        result.current.setInputValue("Discarded");
      });

      act(() => {
        result.current.handleInputKeyDown(kbInput("Escape"));
      });

      expect(mockCreateTask).not.toHaveBeenCalled();
      expect(result.current.isEditing).toBe(false);
      expect(result.current.inputValue).toBe("");
    });
  });

  // -------------------------------------------------------------------------
  // handleInputBlur
  // -------------------------------------------------------------------------
  describe("handleInputBlur", () => {
    it("should commit task on blur when value is non-empty", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleKeyDown(kbDiv("Enter"));
        result.current.setInputValue("Blur Task");
      });

      act(() => {
        result.current.handleInputBlur();
      });

      expect(mockCreateTask).toHaveBeenCalledWith("Blur Task");
      expect(result.current.isEditing).toBe(false);
    });

    it("should cancel edit on blur when value is empty", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleKeyDown(kbDiv("Enter"));
        // value stays ""
      });

      act(() => {
        result.current.handleInputBlur();
      });

      expect(mockCreateTask).not.toHaveBeenCalled();
      expect(result.current.isEditing).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // showActiveBorder
  // -------------------------------------------------------------------------
  describe("showActiveBorder", () => {
    it("should be true when editing", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleKeyDown(kbDiv("Enter"));
      });

      expect(result.current.showActiveBorder).toBe(true);
    });

    it("should be true when cell is name-active (not editing)", () => {
      setNameActive(true);
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));
      expect(result.current.showActiveBorder).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // IME composition handling
  // -------------------------------------------------------------------------
  describe("IME composition guard (handleInputBlur)", () => {
    it("should not commit on blur while composition is active", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleKeyDown(kbDiv("Enter"));
        result.current.setInputValue("テスト");
      });

      // Start composition (e.g. CJK input in progress)
      act(() => {
        result.current.handleCompositionStart();
      });

      // Blur fires during active composition — should NOT commit
      act(() => {
        result.current.handleInputBlur();
      });

      expect(mockCreateTask).not.toHaveBeenCalled();
      // Still editing (composition not finished)
      expect(result.current.isEditing).toBe(true);
    });

    it("should commit on blur after composition ends", () => {
      const { result } = renderHook(() => usePlaceholderNameEdit(cellRef, inputRef));

      act(() => {
        result.current.handleKeyDown(kbDiv("Enter"));
        result.current.setInputValue("テスト");
      });

      act(() => {
        result.current.handleCompositionStart();
      });

      // Composition ends (user confirmed character)
      act(() => {
        result.current.handleCompositionEnd();
      });

      // Now blur fires — should commit
      act(() => {
        result.current.handleInputBlur();
      });

      expect(mockCreateTask).toHaveBeenCalledWith("テスト");
      expect(result.current.isEditing).toBe(false);
    });
  });
});
