/**
 * Unit tests for captureChart utilities.
 * Covers: canvasToBlob (pure promise wrapper) and raceWithTimeout.
 * Note: captureChart itself requires a real DOM + html-to-image + React and is
 * covered by the export dialog integration tests.
 */

import { describe, it, expect, vi } from "vitest";
import {
  canvasToBlob,
  raceWithTimeout,
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
});
