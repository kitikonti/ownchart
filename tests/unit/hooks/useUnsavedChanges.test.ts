/**
 * Tests for useUnsavedChanges hook.
 * Verifies that the beforeunload event listener is registered and warns the
 * user only when there are unsaved changes (isDirty === true).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { act } from "@testing-library/react";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { useFileStore } from "@/store/slices/fileSlice";

// ─── Setup ───

beforeEach(() => {
  useFileStore.setState({ isDirty: false });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Tests ───

describe("useUnsavedChanges", () => {
  it("should not prevent navigation when there are no unsaved changes", () => {
    useFileStore.setState({ isDirty: false });

    renderHook(() => useUnsavedChanges());

    const preventDefaultSpy = vi.fn();
    const event = new Event("beforeunload", { cancelable: true }) as BeforeUnloadEvent;
    Object.defineProperty(event, "returnValue", { writable: true, value: "" });
    Object.defineProperty(event, "preventDefault", { value: preventDefaultSpy });

    window.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it("should prevent navigation when there are unsaved changes", () => {
    useFileStore.setState({ isDirty: true });

    renderHook(() => useUnsavedChanges());

    const event = new Event("beforeunload", { cancelable: true }) as BeforeUnloadEvent;
    Object.defineProperty(event, "returnValue", { writable: true, value: "" });
    const preventDefaultSpy = vi.fn();
    Object.defineProperty(event, "preventDefault", { value: preventDefaultSpy });

    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
  });

  it("should react to isDirty changing from false to true without re-registering listener", () => {
    useFileStore.setState({ isDirty: false });

    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    renderHook(() => useUnsavedChanges());

    // After initial render: one beforeunload listener registered
    const beforeUnloadAddCount = addSpy.mock.calls.filter(
      ([type]) => type === "beforeunload"
    ).length;
    expect(beforeUnloadAddCount).toBe(1);

    // Change isDirty without re-mounting
    act(() => {
      useFileStore.setState({ isDirty: true });
    });

    // The beforeunload listener should NOT have been re-registered
    const afterChangeAddCount = addSpy.mock.calls.filter(
      ([type]) => type === "beforeunload"
    ).length;
    expect(afterChangeAddCount).toBe(1);

    // Now fire the event — should prevent navigation
    const event = new Event("beforeunload", { cancelable: true }) as BeforeUnloadEvent;
    Object.defineProperty(event, "returnValue", { writable: true, value: "" });
    const preventDefaultSpy = vi.fn();
    Object.defineProperty(event, "preventDefault", { value: preventDefaultSpy });
    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("should remove the beforeunload listener on unmount", () => {
    useFileStore.setState({ isDirty: true });

    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useUnsavedChanges());

    unmount();

    const removedBeforeUnload = removeSpy.mock.calls.some(
      ([type]) => type === "beforeunload"
    );
    expect(removedBeforeUnload).toBe(true);

    removeSpy.mockRestore();
  });

  it("should not warn after isDirty resets to false", () => {
    useFileStore.setState({ isDirty: true });

    renderHook(() => useUnsavedChanges());

    act(() => {
      useFileStore.setState({ isDirty: false });
    });

    const event = new Event("beforeunload", { cancelable: true }) as BeforeUnloadEvent;
    Object.defineProperty(event, "returnValue", { writable: true, value: "" });
    const preventDefaultSpy = vi.fn();
    Object.defineProperty(event, "preventDefault", { value: preventDefaultSpy });

    window.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });
});
