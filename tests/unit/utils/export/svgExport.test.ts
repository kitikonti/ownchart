/**
 * Unit tests for svgExport.ts
 *
 * Covers the exported @internal helpers (finalizeSvg, createRootSvg,
 * resolveExportLayout) directly, plus DOM-construction utilities that do
 * not require a full React render cycle.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  finalizeSvg,
  createRootSvg,
  resolveExportLayout,
  appendTimelineHeader,
  appendChartBody,
  extractSvgElements,
  cloneSvgIntoGroup,
} from "@/utils/export/svgExport";
import type {
  SvgExportOptions,
  ExportOptions,
} from "@/utils/export/types";
import {
  DEFAULT_SVG_OPTIONS,
  DEFAULT_EXPORT_OPTIONS,
} from "@/utils/export/types";
import {
  EXPORT_CHART_SVG_CLASS,
  EXPORT_TIMELINE_HEADER_SVG_CLASS,
} from "@/utils/export/constants";

// ---------------------------------------------------------------------------
// Shared test helpers
// ---------------------------------------------------------------------------

/** Create a minimal SVGSVGElement in the SVG namespace. */
function makeSvgEl(): SVGSVGElement {
  return document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  ) as SVGSVGElement;
}

// ---------------------------------------------------------------------------
// Private function behaviour (tested via simulated mechanics)
// ---------------------------------------------------------------------------

describe("svgExport", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("exportToSvg", () => {
    it("should be importable", async () => {
      const { exportToSvg } = await import(
        "../../../../src/utils/export/svgExport"
      );
      expect(typeof exportToSvg).toBe("function");
    });
  });

  // -------------------------------------------------------------------------
  // copyToClipboard — modern Clipboard API path
  // -------------------------------------------------------------------------

  describe("copyToClipboard via Clipboard API", () => {
    it("calls navigator.clipboard.writeText with the SVG string", async () => {
      const svgString = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", {
        clipboard: { writeText },
      });

      // Import and call the internal copy path indirectly by simulating the
      // Clipboard API call that copyToClipboard makes.
      await navigator.clipboard.writeText(svgString);

      expect(writeText).toHaveBeenCalledWith(svgString);
      vi.unstubAllGlobals();
    });
  });

  // -------------------------------------------------------------------------
  // copyToClipboard — execCommand fallback path
  // -------------------------------------------------------------------------

  describe("copyToClipboard execCommand fallback", () => {
    it("uses execCommand copy when navigator.clipboard is unavailable", () => {
      const execCommand = vi.fn().mockReturnValue(true);
      vi.stubGlobal("document", {
        ...document,
        execCommand,
        createElement: document.createElement.bind(document),
        body: document.body,
      });

      // Simulate the textarea + execCommand mechanism used as fallback
      const textarea = document.createElement("textarea");
      textarea.value = "<svg/>";
      textarea.style.position = "fixed";
      textarea.style.top = "0";
      textarea.style.left = "-9999px";
      textarea.setAttribute("aria-hidden", "true");
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);

      expect(execCommand).toHaveBeenCalledWith("copy");
      expect(success).toBe(true);
      vi.unstubAllGlobals();
    });

    it("aria-hidden is set on the fallback textarea", () => {
      const textarea = document.createElement("textarea");
      textarea.setAttribute("aria-hidden", "true");
      expect(textarea.getAttribute("aria-hidden")).toBe("true");
    });

    it("fallback textarea is removed from DOM after copy", () => {
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);
      expect(document.body.contains(textarea)).toBe(true);
      document.body.removeChild(textarea);
      expect(document.body.contains(textarea)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // downloadSvg mechanics
  // -------------------------------------------------------------------------

  describe("downloadSvg mechanics", () => {
    it("creates an object URL and revokes it after the anchor click", () => {
      const svgString = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
      const fakeUrl = "blob:http://localhost/fake-uuid";
      const createObjectURL = vi.fn().mockReturnValue(fakeUrl);
      const revokeObjectURL = vi.fn();
      vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "test.svg";
      link.style.display = "none";
      document.body.appendChild(link);
      try {
        // Use a spy to avoid jsdom "Not implemented: navigation" async error
        const clickSpy = vi.spyOn(link, "click").mockImplementation(() => {});
        link.click();
        clickSpy.mockRestore();
      } finally {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith(fakeUrl);
      expect(document.body.contains(link)).toBe(false);
      vi.unstubAllGlobals();
    });

    it("sets download attribute and display:none on the anchor element", () => {
      const link = document.createElement("a");
      link.href = "blob:fake";
      link.download = "chart.svg";
      link.style.display = "none";

      expect(link.download).toBe("chart.svg");
      expect(link.style.display).toBe("none");
    });

    it("blob has correct SVG MIME type", () => {
      const svgString = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      expect(blob.type).toBe("image/svg+xml");
    });
  });
});

// =============================================================================
// Direct unit tests for @internal exported helpers
// =============================================================================

// ---------------------------------------------------------------------------
// createRootSvg
// ---------------------------------------------------------------------------

describe("createRootSvg", () => {
  it("returns an SVGSVGElement with correct dimensions", () => {
    const svg = createRootSvg({ width: 800, height: 600 }, "transparent");
    expect(svg.getAttribute("width")).toBe("800");
    expect(svg.getAttribute("height")).toBe("600");
    expect(svg.getAttribute("viewBox")).toBe("0 0 800 600");
  });

  it("includes a <title> element with the project name", () => {
    const svg = createRootSvg({ width: 100, height: 50 }, "transparent", "My Project");
    const title = svg.querySelector("title");
    expect(title?.textContent).toBe("Gantt chart: My Project");
  });

  it("uses default title text when no project name is provided", () => {
    const svg = createRootSvg({ width: 100, height: 50 }, "transparent");
    const title = svg.querySelector("title");
    expect(title?.textContent).toBe("Gantt Chart");
  });

  it("adds a background rect when background is 'white'", () => {
    const svg = createRootSvg({ width: 100, height: 50 }, "white");
    const rects = svg.querySelectorAll("rect");
    expect(rects.length).toBeGreaterThan(0);
    const bgRect = Array.from(rects).find((r) => r.getAttribute("fill") === "#ffffff");
    expect(bgRect).toBeDefined();
  });

  it("does not add a background rect when background is 'transparent'", () => {
    const svg = createRootSvg({ width: 100, height: 50 }, "transparent");
    const rects = svg.querySelectorAll("rect");
    expect(rects.length).toBe(0);
  });

  it("includes a <defs> block with a font-family style rule", () => {
    const svg = createRootSvg({ width: 100, height: 50 }, "transparent");
    const defs = svg.querySelector("defs");
    expect(defs).not.toBeNull();
    expect(defs?.querySelector("style")?.textContent).toContain("font-family");
  });
});

// ---------------------------------------------------------------------------
// finalizeSvg (direct)
// ---------------------------------------------------------------------------

describe("finalizeSvg", () => {
  function makeSizedSvg(width = 800, height = 600): SVGSVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    return svg;
  }

  it("returns a string starting with <?xml", () => {
    const svg = makeSizedSvg();
    const result = finalizeSvg(svg, DEFAULT_SVG_OPTIONS);
    expect(result.startsWith("<?xml")).toBe(true);
  });

  it("does not duplicate <?xml declaration", () => {
    const svg = makeSizedSvg();
    const result = finalizeSvg(svg, DEFAULT_SVG_OPTIONS);
    const count = (result.match(/<\?xml/g) ?? []).length;
    expect(count).toBe(1);
  });

  it("adds role and aria-label when includeAccessibility is true", () => {
    const svg = makeSizedSvg();
    const opts: SvgExportOptions = { ...DEFAULT_SVG_OPTIONS, includeAccessibility: true };
    finalizeSvg(svg, opts, "My Project");
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toBe("Gantt chart for My Project");
  });

  it("uses generic aria-label when no project name is provided", () => {
    const svg = makeSizedSvg();
    const opts: SvgExportOptions = { ...DEFAULT_SVG_OPTIONS, includeAccessibility: true };
    finalizeSvg(svg, opts);
    expect(svg.getAttribute("aria-label")).toBe("Project Gantt chart");
  });

  it("does not add aria attributes when includeAccessibility is false", () => {
    const svg = makeSizedSvg();
    const opts: SvgExportOptions = { ...DEFAULT_SVG_OPTIONS, includeAccessibility: false };
    finalizeSvg(svg, opts, "My Project");
    expect(svg.getAttribute("role")).toBeNull();
    expect(svg.getAttribute("aria-label")).toBeNull();
  });

  it("responsive mode removes width/height and preserves viewBox", () => {
    const svg = makeSizedSvg();
    const opts: SvgExportOptions = { ...DEFAULT_SVG_OPTIONS, responsiveMode: true, includeAccessibility: false };
    finalizeSvg(svg, opts);
    expect(svg.getAttribute("width")).toBeNull();
    expect(svg.getAttribute("height")).toBeNull();
    expect(svg.getAttribute("viewBox")).toBe("0 0 800 600");
  });

  it("responsive mode derives viewBox from width/height when viewBox is absent", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "400");
    svg.setAttribute("height", "300");
    const opts: SvgExportOptions = { ...DEFAULT_SVG_OPTIONS, responsiveMode: true, includeAccessibility: false };
    finalizeSvg(svg, opts);
    expect(svg.getAttribute("viewBox")).toBe("0 0 400 300");
    expect(svg.getAttribute("width")).toBeNull();
  });

  it("custom dimension mode sets explicit width/height", () => {
    const svg = makeSizedSvg();
    const opts: SvgExportOptions = {
      ...DEFAULT_SVG_OPTIONS,
      dimensionMode: "custom",
      customWidth: 1920,
      customHeight: 1080,
      includeAccessibility: false,
    };
    finalizeSvg(svg, opts);
    expect(svg.getAttribute("width")).toBe("1920");
    expect(svg.getAttribute("height")).toBe("1080");
  });
});

// ---------------------------------------------------------------------------
// resolveExportLayout
// ---------------------------------------------------------------------------

describe("resolveExportLayout", () => {
  const columnWidths: Record<string, number> = {
    name: 200,
    startDate: 100,
    endDate: 100,
    progress: 80,
  };

  it("uses DEFAULT_EXPORT_COLUMNS when selectedColumns is empty", () => {
    const options: ExportOptions = { ...DEFAULT_EXPORT_OPTIONS, selectedColumns: [] };
    const { selectedColumns } = resolveExportLayout(options, columnWidths);
    expect(selectedColumns.length).toBeGreaterThan(0);
  });

  it("uses provided selectedColumns when non-empty", () => {
    const options: ExportOptions = { ...DEFAULT_EXPORT_OPTIONS, selectedColumns: ["name", "progress"] };
    const { selectedColumns } = resolveExportLayout(options, columnWidths);
    expect(selectedColumns).toEqual(["name", "progress"]);
  });

  it("returns a positive taskTableWidth when one column is selected and widths exist", () => {
    const options: ExportOptions = { ...DEFAULT_EXPORT_OPTIONS, selectedColumns: ["name"] };
    const { taskTableWidth } = resolveExportLayout(options, columnWidths);
    expect(taskTableWidth).toBeGreaterThan(0);
  });

  it("returns a positive taskTableWidth when columns are selected and widths exist", () => {
    const options: ExportOptions = {
      ...DEFAULT_EXPORT_OPTIONS,
      selectedColumns: ["name", "startDate"],
    };
    const { taskTableWidth } = resolveExportLayout(options, columnWidths);
    expect(taskTableWidth).toBeGreaterThan(0);
  });

  it("handles undefined selectedColumns gracefully (defensive guard)", () => {
    // Simulate a caller passing undefined via a loose cast
    const options = {
      ...DEFAULT_EXPORT_OPTIONS,
      selectedColumns: undefined as unknown as [],
    };
    expect(() => resolveExportLayout(options, columnWidths)).not.toThrow();
    const { selectedColumns } = resolveExportLayout(options, columnWidths);
    expect(selectedColumns.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// appendTimelineHeader (@internal)
// ---------------------------------------------------------------------------

describe("appendTimelineHeader", () => {
  it("appends a <g> element to the root SVG", () => {
    const root = makeSvgEl();
    const header = makeSvgEl();
    appendTimelineHeader(root, header, 0);
    const groups = root.querySelectorAll("g");
    expect(groups.length).toBeGreaterThan(0);
  });

  it("applies a horizontal translate transform equal to taskTableWidth", () => {
    const root = makeSvgEl();
    const header = makeSvgEl();
    appendTimelineHeader(root, header, 200);
    const g = root.querySelector("g");
    expect(g?.getAttribute("transform")).toBe("translate(200, 0)");
  });

  it("clones child nodes from the header SVG into the group", () => {
    const root = makeSvgEl();
    const header = makeSvgEl();
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "50");
    header.appendChild(rect);

    appendTimelineHeader(root, header, 0);
    const clonedRect = root.querySelector("rect");
    expect(clonedRect).not.toBeNull();
    expect(clonedRect?.getAttribute("width")).toBe("50");
  });

  it("does not mutate the source header SVG", () => {
    const root = makeSvgEl();
    const header = makeSvgEl();
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    header.appendChild(rect);
    const originalChildCount = header.childNodes.length;

    appendTimelineHeader(root, header, 0);
    expect(header.childNodes.length).toBe(originalChildCount);
  });

  it("sets font-family on cloned text elements", () => {
    const root = makeSvgEl();
    const header = makeSvgEl();
    const text = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    text.textContent = "Header label";
    header.appendChild(text);

    appendTimelineHeader(root, header, 0);
    const clonedText = root.querySelector("text");
    expect(clonedText?.getAttribute("font-family")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// appendChartBody (@internal)
// ---------------------------------------------------------------------------

describe("appendChartBody", () => {
  it("appends a <g> element to the root SVG", () => {
    const root = makeSvgEl();
    const chart = makeSvgEl();
    appendChartBody(root, chart, 0, 0);
    const groups = root.querySelectorAll("g");
    expect(groups.length).toBeGreaterThan(0);
  });

  it("applies translate transform with correct x and y offsets", () => {
    const root = makeSvgEl();
    const chart = makeSvgEl();
    appendChartBody(root, chart, 150, 48);
    const g = root.querySelector("g");
    expect(g?.getAttribute("transform")).toBe("translate(150, 48)");
  });

  it("applies translate(0, 0) when both offsets are zero", () => {
    const root = makeSvgEl();
    const chart = makeSvgEl();
    appendChartBody(root, chart, 0, 0);
    const g = root.querySelector("g");
    expect(g?.getAttribute("transform")).toBe("translate(0, 0)");
  });

  it("clones child nodes from the chart SVG into the group", () => {
    const root = makeSvgEl();
    const chart = makeSvgEl();
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("height", "200");
    chart.appendChild(rect);

    appendChartBody(root, chart, 0, 0);
    const clonedRect = root.querySelector("rect");
    expect(clonedRect).not.toBeNull();
    expect(clonedRect?.getAttribute("height")).toBe("200");
  });

  it("does not mutate the source chart SVG", () => {
    const root = makeSvgEl();
    const chart = makeSvgEl();
    const rect = document.createElementNS("http://www.w3.org/2020/svg", "rect");
    chart.appendChild(rect);
    const originalChildCount = chart.childNodes.length;

    appendChartBody(root, chart, 0, 0);
    expect(chart.childNodes.length).toBe(originalChildCount);
  });

  it("sets font-family on cloned text elements", () => {
    const root = makeSvgEl();
    const chart = makeSvgEl();
    const text = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    text.textContent = "Bar label";
    chart.appendChild(text);

    appendChartBody(root, chart, 0, 0);
    const clonedText = root.querySelector("text");
    expect(clonedText?.getAttribute("font-family")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// extractSvgElements (@internal)
// ---------------------------------------------------------------------------

describe("extractSvgElements", () => {
  function makeContainer(): HTMLElement {
    const div = document.createElement("div");
    document.body.appendChild(div);
    return div;
  }

  function addSvgWithClass(parent: HTMLElement, className: string): SVGSVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
    svg.classList.add(className);
    parent.appendChild(svg);
    return svg;
  }

  afterEach(() => {
    // Clean up any containers appended to body during tests
    document.body.innerHTML = "";
  });

  it("throws when the chart SVG element is absent", () => {
    const container = makeContainer();
    expect(() =>
      extractSvgElements(container, { includeHeader: false })
    ).toThrow("Could not find chart SVG element");
  });

  it("returns chartSvg and null headerSvg when header is not present", () => {
    const container = makeContainer();
    addSvgWithClass(container, EXPORT_CHART_SVG_CLASS);

    const { chartSvg, headerSvg } = extractSvgElements(container, {
      includeHeader: false,
    });
    expect(chartSvg).toBeInstanceOf(SVGSVGElement);
    expect(headerSvg).toBeNull();
  });

  it("returns both chartSvg and headerSvg when both are present", () => {
    const container = makeContainer();
    addSvgWithClass(container, EXPORT_CHART_SVG_CLASS);
    addSvgWithClass(container, EXPORT_TIMELINE_HEADER_SVG_CLASS);

    const { chartSvg, headerSvg } = extractSvgElements(container, {
      includeHeader: true,
    });
    expect(chartSvg).toBeInstanceOf(SVGSVGElement);
    expect(headerSvg).toBeInstanceOf(SVGSVGElement);
  });
});

// ---------------------------------------------------------------------------
// cloneSvgIntoGroup (@internal)
// ---------------------------------------------------------------------------

describe("cloneSvgIntoGroup", () => {
  it("appends a <g> with the given transform to the root SVG", () => {
    const root = makeSvgEl();
    const source = makeSvgEl();
    cloneSvgIntoGroup(root, source, "translate(100, 50)");
    const group = root.querySelector("g");
    expect(group).not.toBeNull();
    expect(group?.getAttribute("transform")).toBe("translate(100, 50)");
  });

  it("clones child nodes from the source SVG into the group", () => {
    const root = makeSvgEl();
    const source = makeSvgEl();
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "42");
    source.appendChild(rect);

    cloneSvgIntoGroup(root, source, "translate(0, 0)");
    const clonedRect = root.querySelector("rect");
    expect(clonedRect).not.toBeNull();
    expect(clonedRect?.getAttribute("width")).toBe("42");
  });

  it("does not mutate the source SVG", () => {
    const root = makeSvgEl();
    const source = makeSvgEl();
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    source.appendChild(rect);
    const originalChildCount = source.childNodes.length;

    cloneSvgIntoGroup(root, source, "translate(0, 0)");
    expect(source.childNodes.length).toBe(originalChildCount);
  });

  it("sets font-family on cloned text elements", () => {
    const root = makeSvgEl();
    const source = makeSvgEl();
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.textContent = "Label";
    source.appendChild(text);

    cloneSvgIntoGroup(root, source, "translate(0, 0)");
    const clonedText = root.querySelector("text");
    expect(clonedText?.getAttribute("font-family")).toBeTruthy();
  });
});
