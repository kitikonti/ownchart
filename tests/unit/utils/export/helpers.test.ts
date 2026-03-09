/**
 * Unit tests for export helper functions.
 * Covers: estimateFileSize, generateExportFilename, setFontFamilyOnTextElements,
 *         createOffscreenContainer, removeOffscreenContainer, cloneSvgChildrenIntoGroup.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  estimateFileSize,
  generateExportFilename,
  setFontFamilyOnTextElements,
  createOffscreenContainer,
  removeOffscreenContainer,
  cloneSvgChildrenIntoGroup,
} from "../../../../src/utils/export/helpers";

// ---------------------------------------------------------------------------
// estimateFileSize
// ---------------------------------------------------------------------------

describe("estimateFileSize", () => {
  it("returns em dash for zero-width image", () => {
    expect(estimateFileSize(0, 100)).toBe("—");
  });

  it("returns em dash for zero-height image", () => {
    expect(estimateFileSize(100, 0)).toBe("—");
  });

  it("returns em dash for 0×0 image", () => {
    expect(estimateFileSize(0, 0)).toBe("—");
  });

  it("returns bytes unit for very small images", () => {
    // 10×10 = 100px × 4 bytes × 0.35 = 140 bytes
    const result = estimateFileSize(10, 10);
    expect(result).toMatch(/^~\d+ B$/);
  });

  it("returns KB unit for medium images", () => {
    // 100×100 = 10000px × 4 × 0.35 = 14000 bytes = ~13.7 KB
    const result = estimateFileSize(100, 100);
    expect(result).toMatch(/^~[\d.]+ KB$/);
  });

  it("returns MB unit for large images", () => {
    // 2000×2000 = 4M px × 4 × 0.35 = 5.6 MB
    const result = estimateFileSize(2000, 2000);
    expect(result).toMatch(/^~[\d.]+ MB$/);
  });

  it("includes tilde prefix for estimates", () => {
    expect(estimateFileSize(500, 500)).toMatch(/^~/);
  });
});

// ---------------------------------------------------------------------------
// generateExportFilename
// ---------------------------------------------------------------------------

describe("generateExportFilename", () => {
  beforeEach(() => {
    // Fix the date so the timestamp is deterministic
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T10:30:45"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses sanitized project name as base", () => {
    const result = generateExportFilename("My Project", "pdf");
    expect(result).toBe("My-Project-20250615-103045.pdf");
  });

  it("falls back to 'gantt-chart' when projectName is undefined", () => {
    const result = generateExportFilename(undefined, "svg");
    expect(result).toBe("gantt-chart-20250615-103045.svg");
  });

  it("falls back to 'gantt-chart' when projectName is empty string", () => {
    // Empty string is falsy, so the helper uses the 'gantt-chart' fallback directly
    const result = generateExportFilename("", "png");
    expect(result).toMatch(/^gantt-chart-/);
    expect(result).toMatch(/\.png$/);
  });

  it("appends the correct file extension", () => {
    const result = generateExportFilename("Test", "png");
    expect(result.endsWith(".png")).toBe(true);
  });

  it("zero-pads month and day values", () => {
    vi.setSystemTime(new Date("2025-01-05T09:05:03"));
    const result = generateExportFilename("P", "pdf");
    expect(result).toContain("-20250105-090503.");
  });
});

// ---------------------------------------------------------------------------
// setFontFamilyOnTextElements
// ---------------------------------------------------------------------------

describe("setFontFamilyOnTextElements", () => {
  function makeSvgElement(tag: string): Element {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
  }

  it("sets font-family attribute on <text> elements", () => {
    const el = makeSvgElement("text");
    setFontFamilyOnTextElements(el);
    expect(el.getAttribute("font-family")).toBeTruthy();
  });

  it("sets font-family attribute on <tspan> elements", () => {
    const el = makeSvgElement("tspan");
    setFontFamilyOnTextElements(el);
    expect(el.getAttribute("font-family")).toBeTruthy();
  });

  it("normalises numeric font-weight 600 to 'bold' on text elements", () => {
    const el = makeSvgElement("text");
    el.setAttribute("font-weight", "600");
    setFontFamilyOnTextElements(el);
    expect(el.getAttribute("font-weight")).toBe("bold");
  });

  it("normalises numeric font-weight 700 to 'bold' on text elements", () => {
    const el = makeSvgElement("text");
    el.setAttribute("font-weight", "700");
    setFontFamilyOnTextElements(el);
    expect(el.getAttribute("font-weight")).toBe("bold");
  });

  it("leaves other font-weight values unchanged", () => {
    const el = makeSvgElement("text");
    el.setAttribute("font-weight", "normal");
    setFontFamilyOnTextElements(el);
    expect(el.getAttribute("font-weight")).toBe("normal");
  });

  it("replaces font-family in inline style on any element", () => {
    const el = makeSvgElement("g");
    // Set a distinctly different font so we can verify it was replaced
    el.setAttribute("style", "font-family: Comic Sans MS; color: red;");
    setFontFamilyOnTextElements(el);
    const style = el.getAttribute("style") || "";
    // The original standalone font-family value should be replaced by SVG_FONT_FAMILY
    expect(style).not.toContain("Comic Sans");
    expect(style).toContain("Inter");
  });

  it("normalises font-weight in inline style on any element", () => {
    const el = makeSvgElement("g");
    el.setAttribute("style", "font-weight: 700;");
    setFontFamilyOnTextElements(el);
    const style = el.getAttribute("style") || "";
    expect(style).toContain("font-weight: bold");
  });

  it("processes child elements recursively", () => {
    const parent = makeSvgElement("g");
    const child = makeSvgElement("text");
    parent.appendChild(child);
    setFontFamilyOnTextElements(parent);
    expect(child.getAttribute("font-family")).toBeTruthy();
  });

  it("does not modify elements without style attribute (no-op on non-text without style)", () => {
    const el = makeSvgElement("rect");
    // Should not throw
    expect(() => setFontFamilyOnTextElements(el)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// createOffscreenContainer / removeOffscreenContainer
// ---------------------------------------------------------------------------

describe("createOffscreenContainer", () => {
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    // Ensure cleanup even if a test fails
    if (container && container.parentNode) {
      container.remove();
    }
    container = null;
  });

  it("appends the container to document.body", () => {
    container = createOffscreenContainer(800, 600, "white");
    expect(document.body.contains(container)).toBe(true);
  });

  it("sets the correct width and height via inline style", () => {
    container = createOffscreenContainer(1024, 768, "white");
    expect(container.style.width).toBe("1024px");
    expect(container.style.height).toBe("768px");
  });

  it("uses white background when background is 'white'", () => {
    container = createOffscreenContainer(100, 100, "white");
    expect(container.style.background).toBe("rgb(255, 255, 255)");
  });

  it("uses transparent background when background is 'transparent'", () => {
    container = createOffscreenContainer(100, 100, "transparent");
    expect(container.style.background).toBe("transparent");
  });

  it("starts hidden (opacity 0)", () => {
    container = createOffscreenContainer(100, 100, "white");
    expect(container.style.opacity).toBe("0");
  });

  it("has pointer-events none to avoid blocking interaction", () => {
    container = createOffscreenContainer(100, 100, "white");
    expect(container.style.pointerEvents).toBe("none");
  });
});

describe("removeOffscreenContainer", () => {
  it("removes the container from the DOM", () => {
    const container = createOffscreenContainer(100, 100, "white");
    expect(document.body.contains(container)).toBe(true);
    removeOffscreenContainer(container);
    expect(document.body.contains(container)).toBe(false);
  });

  it("does not throw when called on an already-detached container", () => {
    const container = createOffscreenContainer(100, 100, "white");
    removeOffscreenContainer(container);
    // Calling remove() a second time on a detached element is a no-op
    expect(() => removeOffscreenContainer(container)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// cloneSvgChildrenIntoGroup
// ---------------------------------------------------------------------------

describe("cloneSvgChildrenIntoGroup", () => {
  function makeSvgElement(tag: string): SVGElement {
    return document.createElementNS(
      "http://www.w3.org/2000/svg",
      tag
    ) as SVGElement;
  }

  it("clones all child nodes from source into group", () => {
    const source = makeSvgElement("g");
    const child1 = makeSvgElement("text");
    const child2 = makeSvgElement("rect");
    source.appendChild(child1);
    source.appendChild(child2);

    const group = makeSvgElement("g");
    cloneSvgChildrenIntoGroup(source, group);

    expect(group.children).toHaveLength(2);
  });

  it("normalises font-family on cloned <text> children", () => {
    const source = makeSvgElement("g");
    const textEl = makeSvgElement("text");
    source.appendChild(textEl);

    const group = makeSvgElement("g");
    cloneSvgChildrenIntoGroup(source, group);

    const clonedText = group.querySelector("text");
    expect(clonedText?.getAttribute("font-family")).toBeTruthy();
  });

  it("does not mutate the original source children", () => {
    const source = makeSvgElement("g");
    const textEl = makeSvgElement("text");
    source.appendChild(textEl);

    const group = makeSvgElement("g");
    cloneSvgChildrenIntoGroup(source, group);

    // The original text element should not have font-family set
    // (the normalisation runs on the clone inside `group`, not the source)
    expect(textEl.getAttribute("font-family")).toBeNull();
  });

  it("handles an empty source without throwing", () => {
    const source = makeSvgElement("g");
    const group = makeSvgElement("g");
    expect(() => cloneSvgChildrenIntoGroup(source, group)).not.toThrow();
    expect(group.children).toHaveLength(0);
  });
});
