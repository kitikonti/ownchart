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
      expect.any(Function),
      { passive: true }
    );
    expect(elB.addEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
      { passive: true }
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

  it("should block echoed scroll events using the isSyncing guard", () => {
    // When syncAtoB sets elB.scrollLeft, some browsers fire a scroll event on B.
    // The isSyncing guard must prevent that echoed event from triggering syncBtoA,
    // which would create an infinite feedback loop.
    //
    // Test strategy: trigger syncAtoB, then immediately change elB.scrollLeft to a
    // DIFFERENT sentinel value and fire B's scroll handler. If the guard is working,
    // A must NOT be updated to the sentinel value (it stays at the original A value).
    renderHook(() => useSyncScroll(refA, refB));

    const scrollHandlerA = elA._listeners.get("scroll");
    const scrollHandlerB = elB._listeners.get("scroll");

    // Step 1: A scrolls to 300; syncAtoB sets B to 300 and raises isSyncing flag
    elA.scrollLeft = 300;
    scrollHandlerA?.(new Event("scroll"));
    expect(elB.scrollLeft).toBe(300);

    // Step 2: While isSyncing is still true (rAF hasn't fired), simulate an echoed
    // scroll on B by mutating B's scrollLeft to a different value and firing the
    // handler. The guard must prevent A from being updated.
    elB.scrollLeft = 999; // sentinel value distinct from 300
    scrollHandlerB?.(new Event("scroll"));

    // A must NOT have been updated to 999 — guard blocked the echo
    expect(elA.scrollLeft).toBe(300);
  });
});
