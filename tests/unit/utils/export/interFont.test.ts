/**
 * Unit tests for interFont.ts
 *
 * Verifies that registerInterFont correctly registers all three Inter
 * font variants (regular, italic, bold/semi-bold) with jsPDF.
 */

import { describe, it, expect, vi } from "vitest";
import { registerInterFont } from "../../../../src/utils/export/interFont";
import type { jsPDF } from "jspdf";

// ---------------------------------------------------------------------------
// Mock jsPDF instance
// ---------------------------------------------------------------------------

function createMockDoc(): {
  doc: jsPDF;
  addFileToVFS: ReturnType<typeof vi.fn>;
  addFont: ReturnType<typeof vi.fn>;
} {
  const addFileToVFS = vi.fn();
  const addFont = vi.fn();
  const doc = { addFileToVFS, addFont } as unknown as jsPDF;
  return { doc, addFileToVFS, addFont };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("registerInterFont", () => {
  it("calls addFileToVFS exactly three times (one per variant)", () => {
    const { doc, addFileToVFS } = createMockDoc();
    registerInterFont(doc);
    expect(addFileToVFS).toHaveBeenCalledTimes(3);
  });

  it("calls addFont exactly three times (one per variant)", () => {
    const { doc, addFont } = createMockDoc();
    registerInterFont(doc);
    expect(addFont).toHaveBeenCalledTimes(3);
  });

  it("registers Inter Regular with 'normal' style", () => {
    const { doc, addFileToVFS, addFont } = createMockDoc();
    registerInterFont(doc);

    expect(addFileToVFS).toHaveBeenCalledWith(
      "Inter-Regular.ttf",
      expect.any(String)
    );
    expect(addFont).toHaveBeenCalledWith("Inter-Regular.ttf", "Inter", "normal");
  });

  it("registers Inter Italic with 'italic' style", () => {
    const { doc, addFileToVFS, addFont } = createMockDoc();
    registerInterFont(doc);

    expect(addFileToVFS).toHaveBeenCalledWith(
      "Inter-Italic.ttf",
      expect.any(String)
    );
    expect(addFont).toHaveBeenCalledWith("Inter-Italic.ttf", "Inter", "italic");
  });

  it("registers Inter SemiBold with 'bold' style", () => {
    const { doc, addFileToVFS, addFont } = createMockDoc();
    registerInterFont(doc);

    expect(addFileToVFS).toHaveBeenCalledWith(
      "Inter-SemiBold.ttf",
      expect.any(String)
    );
    expect(addFont).toHaveBeenCalledWith("Inter-SemiBold.ttf", "Inter", "bold");
  });

  it("registers all three fonts under the same family name 'Inter'", () => {
    const { doc, addFont } = createMockDoc();
    registerInterFont(doc);

    const fontFamilies = (addFont.mock.calls as string[][]).map(
      (call) => call[1]
    );
    expect(fontFamilies).toEqual(["Inter", "Inter", "Inter"]);
  });

  it("passes a non-empty string as base64 data for each variant", () => {
    const { doc, addFileToVFS } = createMockDoc();
    registerInterFont(doc);

    for (const call of addFileToVFS.mock.calls as [string, string][]) {
      const base64Data = call[1];
      expect(typeof base64Data).toBe("string");
      expect(base64Data.length).toBeGreaterThan(0);
    }
  });

  it("wraps jsPDF errors in a descriptive Error message", () => {
    const addFileToVFS = vi.fn();
    const addFont = vi.fn().mockImplementationOnce(() => {
      throw new Error("jsPDF internal error");
    });
    const doc = { addFileToVFS, addFont } as unknown as jsPDF;

    expect(() => registerInterFont(doc)).toThrowError(
      /Failed to register Inter font for PDF export: jsPDF internal error/
    );
  });

  it("wraps non-Error throws in a descriptive Error message", () => {
    const addFileToVFS = vi.fn().mockImplementationOnce(() => {
      throw "unexpected string throw"; // non-Error throw to test String(err) branch
    });
    const addFont = vi.fn();
    const doc = { addFileToVFS, addFont } as unknown as jsPDF;

    expect(() => registerInterFont(doc)).toThrowError(
      /Failed to register Inter font for PDF export: unexpected string throw/
    );
  });
});
