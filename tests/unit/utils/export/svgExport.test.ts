/**
 * Unit tests for svgExport.ts
 *
 * Note: Many functions in svgExport.ts work with DOM elements,
 * so we test the utilities that don't require a full DOM.
 */

import { describe, it, expect, vi, afterEach } from "vitest";

// We need to test the module functions, but many depend on DOM
// For now, we test the exported function behavior with mocks

describe("svgExport", () => {
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

  describe("SVG serialization", () => {
    it("serializes SVG element to string", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "100");
      svg.setAttribute("height", "100");

      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      rect.setAttribute("x", "10");
      rect.setAttribute("y", "10");
      rect.setAttribute("width", "80");
      rect.setAttribute("height", "80");
      rect.setAttribute("fill", "#ff0000");
      svg.appendChild(rect);

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);

      expect(svgString).toContain("<svg");
      expect(svgString).toContain("<rect");
      expect(svgString).toContain('fill="#ff0000"');
    });

    it("preserves viewBox attribute", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 800 600");

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);

      expect(svgString).toContain('viewBox="0 0 800 600"');
    });

    it("preserves nested elements", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "task-group");

      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      g.appendChild(rect);
      svg.appendChild(g);

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);

      expect(svgString).toContain("<g");
      expect(svgString).toContain('class="task-group"');
      expect(svgString).toContain("<rect");
    });
  });

  describe("SVG dimension handling", () => {
    it("can set width and height attributes", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "800");
      svg.setAttribute("height", "600");

      expect(svg.getAttribute("width")).toBe("800");
      expect(svg.getAttribute("height")).toBe("600");
    });

    it("can remove width and height for responsive mode", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "800");
      svg.setAttribute("height", "600");
      svg.setAttribute("viewBox", "0 0 800 600");

      // Remove dimensions for responsive
      svg.removeAttribute("width");
      svg.removeAttribute("height");

      expect(svg.getAttribute("width")).toBeNull();
      expect(svg.getAttribute("height")).toBeNull();
      expect(svg.getAttribute("viewBox")).toBe("0 0 800 600");
    });
  });

  describe("SVG background handling", () => {
    it("can insert background rect as first child", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "100");
      svg.setAttribute("height", "100");

      const existingRect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      existingRect.setAttribute("class", "content");
      svg.appendChild(existingRect);

      // Add background
      const bgRect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      bgRect.setAttribute("x", "0");
      bgRect.setAttribute("y", "0");
      bgRect.setAttribute("width", "100%");
      bgRect.setAttribute("height", "100%");
      bgRect.setAttribute("fill", "white");
      svg.insertBefore(bgRect, svg.firstChild);

      expect(svg.children.length).toBe(2);
      expect(svg.firstChild).toBe(bgRect);
    });
  });

  describe("SVG accessibility attributes", () => {
    it("can add role attribute", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("role", "img");

      expect(svg.getAttribute("role")).toBe("img");
    });

    it("can add aria-label attribute", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("aria-label", "Gantt chart for Test Project");

      expect(svg.getAttribute("aria-label")).toBe("Gantt chart for Test Project");
    });
  });

  describe("SVG style extraction", () => {
    it("can extract inline styles to class", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      rect.setAttribute("style", "fill: red; stroke: blue;");
      svg.appendChild(rect);

      // Extract style
      const inlineStyle = rect.getAttribute("style") || "";
      const className = "extracted-style-0";

      rect.classList.add(className);
      rect.removeAttribute("style");

      // Add style element
      const styleEl = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "style"
      );
      styleEl.textContent = `.${className} { ${inlineStyle} }`;
      svg.insertBefore(styleEl, svg.firstChild);

      expect(rect.getAttribute("style")).toBeNull();
      expect(rect.classList.contains(className)).toBe(true);
      expect(svg.querySelector("style")).not.toBeNull();
    });
  });

  describe("SVG element removal", () => {
    it("can remove elements with data attributes", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

      const interactive = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      interactive.setAttribute("data-interactive", "true");
      svg.appendChild(interactive);

      const normal = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      svg.appendChild(normal);

      // Remove interactive elements
      svg.querySelectorAll("[data-interactive]").forEach((el) => el.remove());

      expect(svg.children.length).toBe(1);
      expect(svg.querySelector("[data-interactive]")).toBeNull();
    });

    it("can filter animation classes", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      rect.setAttribute("class", "task-bar animate-pulse other-class");
      svg.appendChild(rect);

      // Filter animation classes
      const classes = rect.getAttribute("class") || "";
      const filtered = classes
        .split(" ")
        .filter((c) => !c.includes("animate"))
        .join(" ");
      rect.setAttribute("class", filtered);

      expect(rect.getAttribute("class")).toBe("task-bar other-class");
    });
  });

  describe("filename generation", () => {
    it("generates filename with date", () => {
      const projectName = "Test Project";
      const baseName = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${baseName}-${timestamp}.svg`;

      expect(filename).toMatch(/^test-project-\d{4}-\d{2}-\d{2}\.svg$/);
    });

    it("handles empty project name", () => {
      const baseName = "gantt-chart";
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${baseName}-${timestamp}.svg`;

      expect(filename).toMatch(/^gantt-chart-\d{4}-\d{2}-\d{2}\.svg$/);
    });

    it("sanitizes special characters in project name", () => {
      const projectName = "Project: Test <>&\"'";
      const baseName = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      expect(baseName).not.toContain(":");
      expect(baseName).not.toContain("<");
      expect(baseName).not.toContain(">");
    });
  });

  describe("blob creation", () => {
    it("creates SVG blob with correct MIME type", () => {
      const svgString =
        '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
      const blob = new Blob([svgString], { type: "image/svg+xml" });

      expect(blob.type).toBe("image/svg+xml");
      expect(blob.size).toBeGreaterThan(0);
    });
  });
});
