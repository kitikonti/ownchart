/**
 * Unit tests for useDeviceDetection hook
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDeviceDetection } from "../../../src/hooks/useDeviceDetection";

type ChangeListener = (e: MediaQueryListEvent) => void;

interface MatchMediaMock {
  listeners: Map<string, ChangeListener>;
  setNarrow: (value: boolean) => void;
  setCoarse: (value: boolean) => void;
}

/** Mocks window.matchMedia with controllable narrow/coarse state */
function setupMatchMedia(
  narrow: boolean,
  coarse: boolean
): MatchMediaMock {
  const state: Record<string, boolean> = {
    "(max-width: 768px)": narrow,
    "(pointer: coarse)": coarse,
  };
  const listeners = new Map<string, ChangeListener>();

  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: state[query] ?? false,
      media: query,
      addEventListener: (
        ...[, handler]: [string, ChangeListener]
      ): void => {
        listeners.set(query, handler);
      },
      removeEventListener: (): void => {
        listeners.delete(query);
      },
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );

  return {
    listeners,
    setNarrow: (value: boolean): void => {
      state["(max-width: 768px)"] = value;
      const handler = listeners.get("(max-width: 768px)");
      if (handler) {
        handler({ matches: value } as MediaQueryListEvent);
      }
    },
    setCoarse: (value: boolean): void => {
      state["(pointer: coarse)"] = value;
      const handler = listeners.get("(pointer: coarse)");
      if (handler) {
        handler({ matches: value } as MediaQueryListEvent);
      }
    },
  };
}

describe("useDeviceDetection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should not block desktop (wide viewport + fine pointer)", () => {
    setupMatchMedia(false, false);
    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.isMobileDevice).toBe(false);
    expect(result.current.shouldShowMobileBlock).toBe(false);
  });

  it("should block mobile (narrow viewport + coarse pointer)", () => {
    setupMatchMedia(true, true);
    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.isMobileDevice).toBe(true);
    expect(result.current.shouldShowMobileBlock).toBe(true);
  });

  it("should not block narrow desktop window (narrow + fine pointer)", () => {
    setupMatchMedia(true, false);
    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.isMobileDevice).toBe(false);
    expect(result.current.shouldShowMobileBlock).toBe(false);
  });

  it("should not block touch-enabled desktop (wide + coarse pointer)", () => {
    setupMatchMedia(false, true);
    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.isMobileDevice).toBe(false);
    expect(result.current.shouldShowMobileBlock).toBe(false);
  });

  it("should react to orientation change (narrow→wide)", () => {
    const { setNarrow } = setupMatchMedia(true, true);
    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.isMobileDevice).toBe(true);

    act(() => {
      setNarrow(false);
    });

    expect(result.current.isMobileDevice).toBe(false);
    expect(result.current.shouldShowMobileBlock).toBe(false);
  });

  it("should stop blocking after dismiss()", () => {
    setupMatchMedia(true, true);
    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.shouldShowMobileBlock).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.isDismissed).toBe(true);
    expect(result.current.shouldShowMobileBlock).toBe(false);
    // Still detected as mobile, just dismissed
    expect(result.current.isMobileDevice).toBe(true);
  });

  it("should clean up listeners on unmount", () => {
    const { listeners } = setupMatchMedia(false, false);
    const { unmount } = renderHook(() => useDeviceDetection());

    expect(listeners.size).toBe(2);

    unmount();

    expect(listeners.size).toBe(0);
  });
});
