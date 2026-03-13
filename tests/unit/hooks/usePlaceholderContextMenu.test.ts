/**
 * Tests for usePlaceholderContextMenu hook.
 * Verifies context menu state management, item construction,
 * and store side-effects on right-click of the placeholder row.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { MouseEvent } from "react";
import { usePlaceholderContextMenu } from "@/hooks/usePlaceholderContextMenu";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockHandlePaste = vi.fn();
let mockCanPaste = false;

vi.mock("@/hooks/useClipboardOperations", () => ({
  useClipboardOperations: () => ({
    handlePaste: mockHandlePaste,
    canPaste: mockCanPaste,
  }),
}));

const mockSetSelectedTaskIds = vi.fn();
const mockSetActiveCell = vi.fn();

vi.mock("@/store/slices/taskSlice", () => ({
  useTaskStore: Object.assign(
    vi.fn(() => undefined),
    {
      getState: vi.fn(() => ({
        setSelectedTaskIds: mockSetSelectedTaskIds,
        setActiveCell: mockSetActiveCell,
      })),
    }
  ),
}));

vi.mock("@/config/placeholderRow", () => ({
  PLACEHOLDER_TASK_ID: "__new_task_placeholder__",
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMouseEvent(x = 100, y = 200): MouseEvent {
  return {
    preventDefault: vi.fn(),
    clientX: x,
    clientY: y,
  } as unknown as MouseEvent;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("usePlaceholderContextMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanPaste = false;
  });

  it("initialises with contextMenu null and empty items", () => {
    const { result } = renderHook(() => usePlaceholderContextMenu());

    expect(result.current.contextMenu).toBeNull();
    expect(result.current.contextMenuItems).toHaveLength(0);
  });

  it("opens context menu at pointer position on right-click", () => {
    const { result } = renderHook(() => usePlaceholderContextMenu());

    act(() => {
      result.current.handlePlaceholderContextMenu(makeMouseEvent(150, 300));
    });

    expect(result.current.contextMenu).toEqual({ x: 150, y: 300 });
  });

  it("prevents default browser context menu on right-click", () => {
    const { result } = renderHook(() => usePlaceholderContextMenu());
    const event = makeMouseEvent();

    act(() => {
      result.current.handlePlaceholderContextMenu(event);
    });

    expect(event.preventDefault).toHaveBeenCalledOnce();
  });

  it("selects placeholder row and clears active cell on right-click", () => {
    const { result } = renderHook(() => usePlaceholderContextMenu());

    act(() => {
      result.current.handlePlaceholderContextMenu(makeMouseEvent());
    });

    expect(mockSetSelectedTaskIds).toHaveBeenCalledWith(
      ["__new_task_placeholder__"],
      false
    );
    expect(mockSetActiveCell).toHaveBeenCalledWith(null, null);
  });

  it("exposes a paste menu item when context menu is open", () => {
    const { result } = renderHook(() => usePlaceholderContextMenu());

    act(() => {
      result.current.handlePlaceholderContextMenu(makeMouseEvent());
    });

    expect(result.current.contextMenuItems).toHaveLength(1);
    expect(result.current.contextMenuItems[0].id).toBe("paste");
    expect(result.current.contextMenuItems[0].label).toBe("Paste");
  });

  it("disables paste item when canPaste is false", () => {
    mockCanPaste = false;
    const { result } = renderHook(() => usePlaceholderContextMenu());

    act(() => {
      result.current.handlePlaceholderContextMenu(makeMouseEvent());
    });

    expect(result.current.contextMenuItems[0].disabled).toBe(true);
  });

  it("enables paste item when canPaste is true", () => {
    mockCanPaste = true;
    const { result } = renderHook(() => usePlaceholderContextMenu());

    act(() => {
      result.current.handlePlaceholderContextMenu(makeMouseEvent());
    });

    expect(result.current.contextMenuItems[0].disabled).toBe(false);
  });

  it("closes context menu and clears items when closeContextMenu is called", () => {
    const { result } = renderHook(() => usePlaceholderContextMenu());

    act(() => {
      result.current.handlePlaceholderContextMenu(makeMouseEvent());
    });
    expect(result.current.contextMenu).not.toBeNull();

    act(() => {
      result.current.closeContextMenu();
    });

    expect(result.current.contextMenu).toBeNull();
    expect(result.current.contextMenuItems).toHaveLength(0);
  });

  it("paste item onClick calls handlePaste", () => {
    const { result } = renderHook(() => usePlaceholderContextMenu());

    act(() => {
      result.current.handlePlaceholderContextMenu(makeMouseEvent());
    });

    act(() => {
      result.current.contextMenuItems[0].onClick();
    });

    expect(mockHandlePaste).toHaveBeenCalledOnce();
  });
});
