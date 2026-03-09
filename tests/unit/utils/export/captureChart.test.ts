/**
 * Unit tests for captureChart utilities.
 * Covers: canvasToBlob (pure promise wrapper).
 * Note: captureChart itself requires a real DOM + html-to-image + React and is
 * covered by the export dialog integration tests.
 */

import { describe, it, expect, vi } from "vitest";
import { canvasToBlob } from "../../../../src/utils/export/captureChart";

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
