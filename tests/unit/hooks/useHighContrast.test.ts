/**
 * Unit tests for useHighContrast hook
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHighContrast } from "@/hooks/useHighContrast";
import { useUIStore } from "@/store/slices/uiSlice";

describe("useHighContrast", () => {
  beforeEach(() => {
    useUIStore.setState({ isHighContrast: false });
    delete document.documentElement.dataset.highContrast;
  });

  afterEach(() => {
    delete document.documentElement.dataset.highContrast;
  });

  it("should not set data attribute when high contrast is off", () => {
    renderHook(() => useHighContrast());
    expect(document.documentElement.dataset.highContrast).toBeUndefined();
  });

  it("should set data-high-contrast attribute when enabled", () => {
    renderHook(() => useHighContrast());

    act(() => {
      useUIStore.getState().enableHighContrast();
    });

    expect(document.documentElement.dataset.highContrast).toBe("true");
  });

  it("should remove data-high-contrast attribute when disabled", () => {
    useUIStore.setState({ isHighContrast: true });
    renderHook(() => useHighContrast());

    // Should be set initially
    expect(document.documentElement.dataset.highContrast).toBe("true");

    act(() => {
      useUIStore.getState().disableHighContrast();
    });

    expect(document.documentElement.dataset.highContrast).toBeUndefined();
  });

  it("should toggle data attribute on state toggle", () => {
    renderHook(() => useHighContrast());

    act(() => {
      useUIStore.getState().toggleHighContrast();
    });
    expect(document.documentElement.dataset.highContrast).toBe("true");

    act(() => {
      useUIStore.getState().toggleHighContrast();
    });
    expect(document.documentElement.dataset.highContrast).toBeUndefined();
  });
});
