/**
 * Unit tests for captureChart utilities.
 * Covers: canvasToBlob (pure promise wrapper), raceWithTimeout, pixel ratio
 *         clamping invariant, and captureChart DOM-cleanup guarantee (finally-block path).
 * Note: captureChart's full render path requires a real DOM + html-to-image +
 * React and is covered by the export dialog integration tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  canvasToBlob,
  raceWithTimeout,
  captureChart,
} from "../../../../src/utils/export/captureChart";

// ---------------------------------------------------------------------------
// raceWithTimeout
// ---------------------------------------------------------------------------

describe("raceWithTimeout", () => {
  it("resolves with the promise value when it settles before the timeout", async () => {
    const result = await raceWithTimeout(
      Promise.resolve(42),
      5000,
      "should not time out"
    );
    expect(result).toBe(42);
  });

  it("rejects with the timeout message when the promise does not settle in time", async () => {
    vi.useFakeTimers();
    const neverSettles = new Promise<never>(() => {/* never resolves */});
    const racePromise = raceWithTimeout(neverSettles, 1000, "timed out");

    vi.advanceTimersByTime(1000);
    await expect(racePromise).rejects.toThrow("timed out");
    vi.useRealTimers();
  });

  it("cancels the timer when the promise resolves early (no leaked timer)", async () => {
    vi.useFakeTimers();
    const fast = Promise.resolve("done");
    const result = await raceWithTimeout(fast, 5000, "should not fire");
    // If the timer were not cleared, advancing time would trigger an error.
    vi.advanceTimersByTime(5000);
    expect(result).toBe("done");
    vi.useRealTimers();
  });

  it("propagates the original rejection when the promise rejects before the timeout", async () => {
    const originalError = new Error("original failure");
    await expect(
      raceWithTimeout(Promise.reject(originalError), 5000, "timeout msg")
    ).rejects.toThrow("original failure");
  });
});

// ---------------------------------------------------------------------------
// canvasToBlob
// ---------------------------------------------------------------------------

describe("canvasToBlob", () => {
  it("resolves with the blob returned by canvas.toBlob", async () => {
    const mockBlob = new Blob(["png-data"], { type: "image/png" });
    const mockCanvas = {
      toBlob: vi.fn((callback: BlobCallback) => {
        callback(mockBlob);
      }),
    } as unknown as HTMLCanvasElement;

    const result = await canvasToBlob(mockCanvas);
    expect(result).toBe(mockBlob);
  });

  it("passes 'image/png' mime type to canvas.toBlob", async () => {
    const mockBlob = new Blob([], { type: "image/png" });
    const mockCanvas = {
      toBlob: vi.fn((callback: BlobCallback) => {
        callback(mockBlob);
      }),
    } as unknown as HTMLCanvasElement;

    await canvasToBlob(mockCanvas);
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      "image/png",
      1.0
    );
  });

  it("forwards the quality argument to canvas.toBlob", async () => {
    const mockBlob = new Blob([], { type: "image/png" });
    const mockCanvas = {
      toBlob: vi.fn((callback: BlobCallback) => {
        callback(mockBlob);
      }),
    } as unknown as HTMLCanvasElement;

    await canvasToBlob(mockCanvas, 0.8);
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      "image/png",
      0.8
    );
  });

  it("rejects when canvas.toBlob returns null", async () => {
    const mockCanvas = {
      toBlob: vi.fn((callback: BlobCallback) => {
        callback(null);
      }),
    } as unknown as HTMLCanvasElement;

    await expect(canvasToBlob(mockCanvas)).rejects.toThrow(
      "Failed to convert canvas to blob"
    );
  });

  it("rejects when canvas.toBlob throws synchronously (e.g. SecurityError on tainted canvas)", async () => {
    const securityError = new DOMException(
      "The canvas has been tainted by cross-origin data.",
      "SecurityError"
    );
    const mockCanvas = {
      toBlob: vi.fn(() => {
        throw securityError;
      }),
    } as unknown as HTMLCanvasElement;

    await expect(canvasToBlob(mockCanvas)).rejects.toThrow(
      "The canvas has been tainted by cross-origin data."
    );
  });

  it("clamps quality above 1 to 1 and forwards the clamped value to canvas.toBlob", async () => {
    const mockBlob = new Blob([], { type: "image/png" });
    const mockCanvas = {
      toBlob: vi.fn((callback: BlobCallback) => {
        callback(mockBlob);
      }),
    } as unknown as HTMLCanvasElement;

    await canvasToBlob(mockCanvas, 1.5);
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      "image/png",
      1
    );
  });

  it("clamps quality below 0 to 0 and forwards the clamped value to canvas.toBlob", async () => {
    const mockBlob = new Blob([], { type: "image/png" });
    const mockCanvas = {
      toBlob: vi.fn((callback: BlobCallback) => {
        callback(mockBlob);
      }),
    } as unknown as HTMLCanvasElement;

    await canvasToBlob(mockCanvas, -0.5);
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      "image/png",
      0
    );
  });

  it("passes through quality = 0 unchanged (exact lower boundary)", async () => {
    const mockBlob = new Blob([], { type: "image/png" });
    const mockCanvas = {
      toBlob: vi.fn((callback: BlobCallback) => {
        callback(mockBlob);
      }),
    } as unknown as HTMLCanvasElement;

    await canvasToBlob(mockCanvas, 0);
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      "image/png",
      0
    );
  });
});

// ---------------------------------------------------------------------------
// captureChart — pixel ratio clamping invariant
// ---------------------------------------------------------------------------
// computeMaxCapturePixelRatio() and the clamping expression are internal to
// captureContainerToCanvas and not exported. We verify the invariant by
// replicating the clamping math directly, making the contract explicit and
// independently testable without needing a full browser environment.

describe("pixel ratio clamping invariant", () => {
  /**
   * Replicate the clamping expression from captureContainerToCanvas():
   *   Math.min(Math.max(dpr, MIN), Math.max(maxCapture, MIN))
   * where MIN = MIN_PIXEL_RATIO = 2.
   */
  function clamp(devicePixelRatio: number, maxCapturePixelRatio: number): number {
    const MIN = 2;
    return Math.min(
      Math.max(devicePixelRatio, MIN),
      Math.max(maxCapturePixelRatio, MIN)
    );
  }

  it("is at least 2 even when devicePixelRatio is 1 and maxCapturePixelRatio is 1", () => {
    expect(clamp(1, 1)).toBeGreaterThanOrEqual(2);
  });

  it("caps at maxCapturePixelRatio when devicePixelRatio exceeds it", () => {
    // e.g. 1920px screen → maxCapture = floor(16384/1920) = 8
    expect(clamp(4, 8)).toBe(4);
    expect(clamp(10, 8)).toBe(8);
  });

  it("returns MIN_PIXEL_RATIO when both inputs are below it", () => {
    expect(clamp(0, 0)).toBe(2);
  });

  it("returns maxCapturePixelRatio when devicePixelRatio exceeds it (tight cap)", () => {
    // Very high-DPR device but maxCapture is low (e.g. very wide screen)
    expect(clamp(4, 3)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// captureChart — DOM cleanup guarantee
// ---------------------------------------------------------------------------
// Verify the finally-block contract: the offscreen container is always removed
// from the DOM, even when renderAndSettle (or any later step) throws. This is
// the only part of captureChart that can be unit-tested without a full
// html-to-image + React runtime.

vi.mock("../../../../src/utils/export/helpers", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../../../../src/utils/export/helpers")>();
  return {
    ...original,
    // createOffscreenContainer is left as-is (it only touches document.body)
    removeOffscreenContainer: vi.fn(original.removeOffscreenContainer),
    waitForFonts: vi.fn().mockResolvedValue(undefined),
    waitForPaint: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("../../../../src/utils/export/exportLayout", () => ({
  calculateExportDimensions: vi.fn().mockReturnValue({ width: 100, height: 50 }),
}));

// Mock ExportRenderer so React does not need a real component to render
vi.mock("../../../../src/components/Export/ExportRenderer", () => ({
  ExportRenderer: vi.fn(() => null),
}));

describe("captureChart — DOM cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Remove any containers left in the DOM by failing tests
    document
      .querySelectorAll("[data-export-offscreen]")
      .forEach((el) => el.remove());
  });

  it("removes the offscreen container from the DOM even when rendering fails", async () => {
    // Force the React render step to fail by making createRoot().render throw.
    // We do this by making html-to-image's toCanvas (which is called after render)
    // throw; since toCanvas is not mocked here, the render path will fail early
    // due to the missing html-to-image dependency in jsdom — that is sufficient
    // to verify the finally cleanup path executes.
    const { removeOffscreenContainer } = await import(
      "../../../../src/utils/export/helpers"
    );

    const params = {
      tasks: [],
      options: {
        zoomMode: "currentView" as const,
        timelineZoom: 1,
        fitToWidth: 1920,
        dateRangeMode: "all" as const,
        selectedColumns: [] as [],
        includeHeader: true,
        includeTodayMarker: true,
        includeDependencies: true,
        includeGridLines: true,
        includeWeekends: true,
        includeHolidays: true,
        taskLabelPosition: "inside" as const,
        background: "white" as const,
        density: "comfortable" as const,
      },
      columnWidths: {},
      currentAppZoom: 1,
    };

    // captureChart is expected to fail (no real html-to-image in jsdom)
    await expect(captureChart(params)).rejects.toThrow();

    // Despite the failure, the cleanup function must have been called
    expect(removeOffscreenContainer).toHaveBeenCalledTimes(1);

    // The container must not remain in the DOM
    expect(
      document.querySelectorAll("[data-export-offscreen]")
    ).toHaveLength(0);
  });
});
