/**
 * Tests for useExportPreview hook.
 *
 * Covers: initial state, disabled/empty-tasks early exit, full render cycle
 * producing a data URL, DOM cleanup on unmount, and error propagation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { DEFAULT_EXPORT_OPTIONS } from "../../../src/utils/export/types";

// ---------------------------------------------------------------------------
// Hoisted mock state (vi.mock factories are hoisted above variable declarations)
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => {
  const mockUnmount = vi.fn();
  const mockRender = vi.fn();
  const mockCreateRoot = vi.fn(() => ({ render: mockRender, unmount: mockUnmount }));

  const mockDataUrl = "data:image/png;base64,MOCKPREVIEW";
  const mockCanvas = { toDataURL: vi.fn(() => mockDataUrl) };
  const mockToCanvas = vi.fn(() => Promise.resolve(mockCanvas));

  const mockDimensions = { width: 800, height: 600 };
  const mockCalculateDimensions = vi.fn(() => mockDimensions);

  return {
    mockUnmount,
    mockRender,
    mockCreateRoot,
    mockDataUrl,
    mockCanvas,
    mockToCanvas,
    mockDimensions,
    mockCalculateDimensions,
  };
});

vi.mock("react-dom/client", () => ({
  createRoot: mocks.mockCreateRoot,
}));

vi.mock("html-to-image", () => ({
  toCanvas: mocks.mockToCanvas,
}));

vi.mock("../../../src/utils/export/exportLayout", () => ({
  calculateExportDimensions: mocks.mockCalculateDimensions,
}));

vi.mock("../../../src/components/Export/ExportRenderer", () => ({
  ExportRenderer: vi.fn(() => null),
}));

import { useExportPreview } from "../../../src/hooks/useExportPreview";
import { makeTask } from "../helpers/taskFactory";

const defaultParams = {
  tasks: [makeTask({ id: "t1" })],
  options: DEFAULT_EXPORT_OPTIONS,
  columnWidths: {},
  currentAppZoom: 1,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useExportPreview", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.mockRender.mockImplementation(() => {});
    mocks.mockToCanvas.mockResolvedValue(mocks.mockCanvas);
    mocks.mockCalculateDimensions.mockReturnValue(mocks.mockDimensions);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  it("returns null initial state before any render completes", () => {
    const { result } = renderHook(() => useExportPreview(defaultParams));

    expect(result.current.previewDataUrl).toBeNull();
    expect(result.current.isRendering).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.previewDimensions).toEqual({ width: 0, height: 0 });
  });

  // ── Disabled / empty tasks early exit ─────────────────────────────────────

  it("does not render when enabled=false, returns nulls", async () => {
    const { result } = renderHook(() =>
      useExportPreview({ ...defaultParams, enabled: false })
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mocks.mockCreateRoot).not.toHaveBeenCalled();
    expect(result.current.previewDataUrl).toBeNull();
    expect(result.current.isRendering).toBe(false);
  });

  it("does not render when tasks array is empty", async () => {
    const { result } = renderHook(() =>
      useExportPreview({ ...defaultParams, tasks: [] })
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mocks.mockCreateRoot).not.toHaveBeenCalled();
    expect(result.current.previewDataUrl).toBeNull();
    expect(result.current.isRendering).toBe(false);
  });

  // ── Full render cycle ──────────────────────────────────────────────────────

  it("produces a data URL and correct dimensions after debounce + async", async () => {
    const { result } = renderHook(() => useExportPreview(defaultParams));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.previewDataUrl).toBe(mocks.mockDataUrl);
    expect(result.current.previewDimensions).toEqual(mocks.mockDimensions);
    expect(result.current.isRendering).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("passes white hex to toCanvas backgroundColor when background is white", async () => {
    renderHook(() =>
      useExportPreview({
        ...defaultParams,
        options: { ...DEFAULT_EXPORT_OPTIONS, background: "white" },
      })
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mocks.mockToCanvas).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ backgroundColor: "#ffffff" })
    );
  });

  it("passes undefined backgroundColor to toCanvas when background is transparent", async () => {
    renderHook(() =>
      useExportPreview({
        ...defaultParams,
        options: { ...DEFAULT_EXPORT_OPTIONS, background: "transparent" },
      })
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mocks.mockToCanvas).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ backgroundColor: undefined })
    );
  });

  // ── DOM cleanup on unmount ─────────────────────────────────────────────────

  it("removes appended DOM nodes on unmount", async () => {
    const appendSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(document.body, "removeChild");

    const { unmount } = renderHook(() => useExportPreview(defaultParams));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(appendSpy).toHaveBeenCalled();

    act(() => {
      unmount();
    });

    expect(removeSpy).toHaveBeenCalled();
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  it("sets error state when toCanvas rejects", async () => {
    mocks.mockToCanvas.mockRejectedValueOnce(new Error("Canvas capture failed"));

    const { result } = renderHook(() => useExportPreview(defaultParams));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.error).toBe("Canvas capture failed");
    expect(result.current.previewDataUrl).toBeNull();
    expect(result.current.isRendering).toBe(false);
  });

  it("sets generic error message when a non-Error is thrown", async () => {
    mocks.mockToCanvas.mockRejectedValueOnce("something went wrong");

    const { result } = renderHook(() => useExportPreview(defaultParams));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.error).toBe("Preview generation failed");
  });

  // ── Options key coverage — regression for missing fields ───────────────────

  it("triggers re-render when includeHeader option changes", async () => {
    // Regression test: includeHeader was previously omitted from createOptionsKey,
    // so toggling it would not trigger a new preview render.
    const { rerender } = renderHook(
      ({ includeHeader }: { includeHeader: boolean }) =>
        useExportPreview({
          ...defaultParams,
          options: { ...DEFAULT_EXPORT_OPTIONS, includeHeader },
        }),
      { initialProps: { includeHeader: false } }
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const renderCountBefore = mocks.mockCreateRoot.mock.calls.length;
    expect(renderCountBefore).toBeGreaterThan(0);

    rerender({ includeHeader: true });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mocks.mockCreateRoot.mock.calls.length).toBeGreaterThan(
      renderCountBefore
    );
  });
});
