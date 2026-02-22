/**
 * Unit tests for usePreventVerticalScroll hook
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePreventVerticalScroll } from "../../../src/hooks/usePreventVerticalScroll";

/** Creates a minimal mock element with scrollTop and event listener tracking */
function createMockElement(): HTMLElement & {
  _listeners: Map<string, EventListener>;
} {
  const listeners = new Map<string, EventListener>();
  return {
    scrollTop: 0,
    addEventListener: vi.fn((event: string, handler: EventListener) => {
      listeners.set(event, handler);
    }),
    removeEventListener: vi.fn((event: string) => {
      listeners.delete(event);
    }),
    _listeners: listeners,
  } as unknown as HTMLElement & { _listeners: Map<string, EventListener> };
}

describe("usePreventVerticalScroll", () => {
  it("should register a scroll listener on the element", () => {
    const el = createMockElement();
    const ref = { current: el };

    renderHook(() => usePreventVerticalScroll(ref));

    expect(el.addEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    );
  });

  it("should reset scrollTop to 0 when element scrolls vertically", () => {
    const el = createMockElement();
    const ref = { current: el };

    renderHook(() => usePreventVerticalScroll(ref));

    el.scrollTop = 50;
    const scrollHandler = el._listeners.get("scroll");
    scrollHandler?.(new Event("scroll"));

    expect(el.scrollTop).toBe(0);
  });

  it("should not modify scrollTop when already 0", () => {
    const el = createMockElement();
    const ref = { current: el };

    renderHook(() => usePreventVerticalScroll(ref));

    el.scrollTop = 0;
    const scrollHandler = el._listeners.get("scroll");
    scrollHandler?.(new Event("scroll"));

    expect(el.scrollTop).toBe(0);
  });

  it("should do nothing when ref is null", () => {
    const ref = { current: null };

    // Should not throw
    expect(() => {
      renderHook(() => usePreventVerticalScroll(ref));
    }).not.toThrow();
  });

  it("should clean up listener on unmount", () => {
    const el = createMockElement();
    const ref = { current: el };

    const { unmount } = renderHook(() => usePreventVerticalScroll(ref));
    unmount();

    expect(el.removeEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    );
  });
});
