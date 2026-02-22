/**
 * Unit tests for useSyncScroll hook
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSyncScroll } from "../../../src/hooks/useSyncScroll";

/** Creates a minimal mock element with scrollLeft and event listener tracking */
function createMockElement(): HTMLDivElement & {
  _listeners: Map<string, EventListener>;
} {
  const listeners = new Map<string, EventListener>();
  return {
    scrollLeft: 0,
    addEventListener: vi.fn((event: string, handler: EventListener) => {
      listeners.set(event, handler);
    }),
    removeEventListener: vi.fn((event: string) => {
      listeners.delete(event);
    }),
    _listeners: listeners,
  } as unknown as HTMLDivElement & { _listeners: Map<string, EventListener> };
}

describe("useSyncScroll", () => {
  let elA: ReturnType<typeof createMockElement>;
  let elB: ReturnType<typeof createMockElement>;
  let refA: React.RefObject<HTMLDivElement | null>;
  let refB: React.RefObject<HTMLDivElement | null>;

  beforeEach(() => {
    elA = createMockElement();
    elB = createMockElement();
    refA = { current: elA };
    refB = { current: elB };
  });

  it("should register scroll listeners on both elements", () => {
    renderHook(() => useSyncScroll(refA, refB));

    expect(elA.addEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    );
    expect(elB.addEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    );
  });

  it("should sync scrollLeft from A to B when A scrolls", () => {
    renderHook(() => useSyncScroll(refA, refB));

    elA.scrollLeft = 150;
    const scrollHandler = elA._listeners.get("scroll");
    scrollHandler?.(new Event("scroll"));

    expect(elB.scrollLeft).toBe(150);
  });

  it("should sync scrollLeft from B to A when B scrolls", () => {
    renderHook(() => useSyncScroll(refA, refB));

    elB.scrollLeft = 200;
    const scrollHandler = elB._listeners.get("scroll");
    scrollHandler?.(new Event("scroll"));

    expect(elA.scrollLeft).toBe(200);
  });

  it("should clean up listeners on unmount", () => {
    const { unmount } = renderHook(() => useSyncScroll(refA, refB));

    unmount();

    expect(elA.removeEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    );
    expect(elB.removeEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    );
  });

  it("should do nothing when refs are null", () => {
    const nullRefA = { current: null };
    const nullRefB = { current: null };

    // Should not throw
    renderHook(() => useSyncScroll(nullRefA, nullRefB));
  });

  it("should do nothing when one ref is null", () => {
    const nullRef = { current: null };

    renderHook(() => useSyncScroll(refA, nullRef));

    expect(elA.addEventListener).not.toHaveBeenCalled();
  });
});
