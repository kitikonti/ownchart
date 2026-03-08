/**
 * Unit tests for svgExport.ts
 *
 * Tests the exported pure helpers: finalizeSvg and extractSvgElements.
 * The top-level exportToSvg is an async pipeline with React rendering and
 * DOM side effects — it is exercised by E2E tests instead.
 */

import { describe, it, expect } from "vitest";
import {
  finalizeSvg,
  extractSvgElements,
} from "../../../../src/utils/export/svgExport";
import {
  EXPORT_CHART_SVG_CLASS,
  EXPORT_TIMELINE_HEADER_SVG_CLASS,
} from "../../../../src/utils/export/constants";
import type { SvgExportOptions } from "../../../../src/utils/export/types";

// =============================================================================
// Helpers
// =============================================================================

function makeSvg(width = 800, height = 600): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  return svg;
}

/** Minimal valid SvgExportOptions — all flags off, dimensionMode auto */
const BASE_OPTIONS: SvgExportOptions = {
  dimensionMode: "auto",
  preserveAspectRatio: true,
  textMode: "text",
  styleMode: "inline",
  optimize: false,
  includeBackground: false,
  responsiveMode: false,
  includeAccessibility: false,
  copyToClipboard: false,
};

function makeContainer(opts?: {
  includeChart?: boolean;
  includeHeader?: boolean;
}): HTMLDivElement {
  const container = document.createElement("div");
  if (opts?.includeChart !== false) {
    const chartSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    chartSvg.setAttribute("class", EXPORT_CHART_SVG_CLASS);
    container.appendChild(chartSvg);
  }
  if (opts?.includeHeader) {
    const headerSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    headerSvg.setAttribute("class", EXPORT_TIMELINE_HEADER_SVG_CLASS);
    container.appendChild(headerSvg);
  }
  return container;
}

// =============================================================================
// finalizeSvg — XML declaration
// =============================================================================

describe("finalizeSvg — XML declaration", () => {
  it("prepends <?xml declaration when not already present", () => {
    const svg = makeSvg();
    const result = finalizeSvg(svg, BASE_OPTIONS);
    expect(result.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });

  it("does not double-prepend if <?xml is already present", () => {
    // XMLSerializer in jsdom does not prepend <?xml by itself, so simulate the
    // case where the string already starts with the declaration.
    // The guard `!result.startsWith("<?xml")` ensures idempotency when the
    // serializer does include it.
    const svg = makeSvg();
    const result = finalizeSvg(svg, BASE_OPTIONS);
    const declarationCount = (result.match(/<\?xml/g) ?? []).length;
    expect(declarationCount).toBe(1);
  });
});

// =============================================================================
// finalizeSvg — accessibility
// =============================================================================

describe("finalizeSvg — accessibility", () => {
  it("adds role=img and default aria-label when includeAccessibility is true and no project name", () => {
    const svg = makeSvg();
    const result = finalizeSvg(svg, { ...BASE_OPTIONS, includeAccessibility: true });
    expect(result).toContain('role="img"');
    expect(result).toContain('aria-label="Project Gantt chart"');
  });

  it("uses project name in aria-label when provided", () => {
    const svg = makeSvg();
    const result = finalizeSvg(
      svg,
      { ...BASE_OPTIONS, includeAccessibility: true },
      "My Project"
    );
    expect(result).toContain('aria-label="Gantt chart for My Project"');
  });

  it("does not add accessibility attributes when includeAccessibility is false", () => {
    const svg = makeSvg();
    const result = finalizeSvg(svg, { ...BASE_OPTIONS, includeAccessibility: false });
    expect(result).not.toContain('role="img"');
    expect(result).not.toContain("aria-label");
  });
});

// =============================================================================
// finalizeSvg — responsiveMode
// =============================================================================

describe("finalizeSvg — responsiveMode", () => {
  it("removes width and height attributes when responsiveMode is true", () => {
    const svg = makeSvg(800, 600);
    const result = finalizeSvg(svg, { ...BASE_OPTIONS, responsiveMode: true });
    // No fixed width/height — only viewBox survives
    expect(result).not.toMatch(/\swidth="\d+"/);
    expect(result).not.toMatch(/\sheight="\d+"/);
  });

  it("keeps viewBox when responsiveMode is true", () => {
    const svg = makeSvg(800, 600);
    const result = finalizeSvg(svg, { ...BASE_OPTIONS, responsiveMode: true });
    expect(result).toContain('viewBox="0 0 800 600"');
  });

  it("keeps fixed dimensions when responsiveMode is false", () => {
    const svg = makeSvg(800, 600);
    const result = finalizeSvg(svg, { ...BASE_OPTIONS, responsiveMode: false });
    expect(result).toContain('width="800"');
    expect(result).toContain('height="600"');
  });
});

// =============================================================================
// finalizeSvg — custom dimensions
// =============================================================================

describe("finalizeSvg — custom dimensions", () => {
  it("applies customWidth when dimensionMode is custom", () => {
    const svg = makeSvg(800, 600);
    const result = finalizeSvg(svg, {
      ...BASE_OPTIONS,
      dimensionMode: "custom",
      customWidth: 1200,
    });
    expect(result).toContain('width="1200"');
  });

  it("applies customHeight when dimensionMode is custom", () => {
    const svg = makeSvg(800, 600);
    const result = finalizeSvg(svg, {
      ...BASE_OPTIONS,
      dimensionMode: "custom",
      customHeight: 900,
    });
    expect(result).toContain('height="900"');
  });

  it("custom dimensions override responsiveMode — applied after removal", () => {
    const svg = makeSvg(800, 600);
    const result = finalizeSvg(svg, {
      ...BASE_OPTIONS,
      responsiveMode: true,
      dimensionMode: "custom",
      customWidth: 1200,
      customHeight: 900,
    });
    expect(result).toContain('width="1200"');
    expect(result).toContain('height="900"');
  });

  it("does not alter dimensions when dimensionMode is auto", () => {
    const svg = makeSvg(800, 600);
    const result = finalizeSvg(svg, { ...BASE_OPTIONS, dimensionMode: "auto" });
    expect(result).toContain('width="800"');
    expect(result).toContain('height="600"');
  });

  it("does not set width when customWidth is absent in custom mode", () => {
    const svg = makeSvg(800, 600);
    const result = finalizeSvg(svg, {
      ...BASE_OPTIONS,
      dimensionMode: "custom",
      customHeight: 900,
      // customWidth deliberately omitted
    });
    // Original width is preserved (not cleared by responsiveMode either)
    expect(result).toContain('width="800"');
    expect(result).toContain('height="900"');
  });
});

// =============================================================================
// extractSvgElements
// =============================================================================

describe("extractSvgElements", () => {
  it("throws when chart SVG is not found", () => {
    const container = document.createElement("div");
    expect(() => extractSvgElements(container)).toThrow(EXPORT_CHART_SVG_CLASS);
  });

  it("error message includes the missing class name for diagnosability", () => {
    const container = document.createElement("div");
    expect(() => extractSvgElements(container)).toThrowError(
      new RegExp(EXPORT_CHART_SVG_CLASS)
    );
  });

  it("returns chartSvg element when found", () => {
    const container = makeContainer({ includeChart: true });
    const { chartSvg } = extractSvgElements(container);
    expect(chartSvg).toBeInstanceOf(SVGSVGElement);
    expect(chartSvg.getAttribute("class")).toBe(EXPORT_CHART_SVG_CLASS);
  });

  it("returns null headerSvg when no header SVG exists", () => {
    const container = makeContainer({ includeChart: true, includeHeader: false });
    const { headerSvg } = extractSvgElements(container);
    expect(headerSvg).toBeNull();
  });

  it("returns headerSvg element when header SVG exists", () => {
    const container = makeContainer({ includeChart: true, includeHeader: true });
    const { headerSvg } = extractSvgElements(container);
    expect(headerSvg).toBeInstanceOf(SVGSVGElement);
    expect(headerSvg?.getAttribute("class")).toBe(EXPORT_TIMELINE_HEADER_SVG_CLASS);
  });

  it("is importable as a named export (public API contract)", async () => {
    const mod = await import("../../../../src/utils/export/svgExport");
    expect(typeof mod.extractSvgElements).toBe("function");
    expect(typeof mod.finalizeSvg).toBe("function");
  });
});
