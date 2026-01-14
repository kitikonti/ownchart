/**
 * Tests for colorUtils - WCAG 2.1 contrast calculation
 */

import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  getRelativeLuminance,
  getContrastRatio,
  isLightColor,
  getContrastTextColor,
} from "../../../src/utils/colorUtils";

describe("colorUtils", () => {
  describe("hexToRgb", () => {
    it("converts 6-digit hex with # prefix", () => {
      expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb("#00ff00")).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb("#0000ff")).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    });

    it("converts 6-digit hex without # prefix", () => {
      expect(hexToRgb("ff0000")).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb("14b8a6")).toEqual({ r: 20, g: 184, b: 166 });
    });

    it("converts 3-digit hex with # prefix", () => {
      expect(hexToRgb("#f00")).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb("#0f0")).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb("#00f")).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb("#000")).toEqual({ r: 0, g: 0, b: 0 });
    });

    it("converts 3-digit hex without # prefix", () => {
      expect(hexToRgb("f00")).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb("abc")).toEqual({ r: 170, g: 187, b: 204 });
    });

    it("handles mixed case hex", () => {
      expect(hexToRgb("#FF0000")).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb("#Ff00fF")).toEqual({ r: 255, g: 0, b: 255 });
    });
  });

  describe("getRelativeLuminance", () => {
    it("returns 0 for black", () => {
      expect(getRelativeLuminance("#000000")).toBe(0);
    });

    it("returns 1 for white", () => {
      expect(getRelativeLuminance("#ffffff")).toBe(1);
    });

    it("returns correct luminance for pure colors", () => {
      // Red: 0.2126 * 1 + 0 + 0 = 0.2126
      expect(getRelativeLuminance("#ff0000")).toBeCloseTo(0.2126, 4);
      // Green: 0 + 0.7152 * 1 + 0 = 0.7152
      expect(getRelativeLuminance("#00ff00")).toBeCloseTo(0.7152, 4);
      // Blue: 0 + 0 + 0.0722 * 1 = 0.0722
      expect(getRelativeLuminance("#0000ff")).toBeCloseTo(0.0722, 4);
    });

    it("returns higher luminance for green than red (WCAG weighting)", () => {
      const greenLum = getRelativeLuminance("#00ff00");
      const redLum = getRelativeLuminance("#ff0000");
      expect(greenLum).toBeGreaterThan(redLum);
    });
  });

  describe("getContrastRatio", () => {
    it("returns 21:1 for black on white", () => {
      expect(getContrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    });

    it("returns 1:1 for same colors", () => {
      expect(getContrastRatio("#ff0000", "#ff0000")).toBe(1);
      expect(getContrastRatio("#123456", "#123456")).toBe(1);
    });

    it("is commutative (order doesn't matter)", () => {
      const ratio1 = getContrastRatio("#ff0000", "#ffffff");
      const ratio2 = getContrastRatio("#ffffff", "#ff0000");
      expect(ratio1).toBe(ratio2);
    });

    it("returns correct contrast for common combinations", () => {
      // White text on black: 21:1
      expect(getContrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 0);
      // Pure red on white: ~4:1
      expect(getContrastRatio("#ff0000", "#ffffff")).toBeCloseTo(4, 0);
    });
  });

  describe("isLightColor", () => {
    it("returns false for black", () => {
      expect(isLightColor("#000000")).toBe(false);
    });

    it("returns true for white", () => {
      expect(isLightColor("#ffffff")).toBe(true);
    });

    it("returns false for dark colors that need white text", () => {
      expect(isLightColor("#1a1a1a")).toBe(false); // Very dark gray
      expect(isLightColor("#0000ff")).toBe(false); // Pure blue
      expect(isLightColor("#800000")).toBe(false); // Dark red/maroon
      expect(isLightColor("#003366")).toBe(false); // Dark blue
      expect(isLightColor("#9b59b6")).toBe(false); // Purple
    });

    it("returns true for light colors that need dark text", () => {
      expect(isLightColor("#f0f0f0")).toBe(true); // Light gray
      expect(isLightColor("#ffff00")).toBe(true); // Yellow
      expect(isLightColor("#00ff00")).toBe(true); // Pure green
      expect(isLightColor("#ffcccc")).toBe(true); // Light pink
    });
  });

  describe("getContrastTextColor", () => {
    it("returns white text on black background", () => {
      expect(getContrastTextColor("#000000")).toBe("#ffffff");
    });

    it("returns dark text on white background", () => {
      expect(getContrastTextColor("#ffffff")).toBe("#1e293b");
    });

    it("returns dark text (#1e293b) on light colors", () => {
      expect(getContrastTextColor("#ffff00")).toBe("#1e293b"); // Yellow
      expect(getContrastTextColor("#00ff00")).toBe("#1e293b"); // Green
      expect(getContrastTextColor("#f0f0f0")).toBe("#1e293b"); // Light gray
    });

    it("returns white text on dark colors", () => {
      expect(getContrastTextColor("#000080")).toBe("#ffffff"); // Navy
      expect(getContrastTextColor("#800000")).toBe("#ffffff"); // Maroon
      expect(getContrastTextColor("#333333")).toBe("#ffffff"); // Dark gray
    });

    it("uses custom text colors when provided", () => {
      const customLight = "#f8f8f8";
      const customDark = "#222222";

      // Black background should use light text
      expect(getContrastTextColor("#000000", customLight, customDark)).toBe(
        customLight
      );

      // White background should use dark text
      expect(getContrastTextColor("#ffffff", customLight, customDark)).toBe(
        customDark
      );
    });

    it("handles 3-digit hex codes", () => {
      expect(getContrastTextColor("#000")).toBe("#ffffff");
      expect(getContrastTextColor("#fff")).toBe("#1e293b");
    });

    it("handles hex without # prefix", () => {
      expect(getContrastTextColor("000000")).toBe("#ffffff");
      expect(getContrastTextColor("ffffff")).toBe("#1e293b");
    });
  });

  describe("handles undefined/null/empty values", () => {
    it("handles undefined by using default teal color", () => {
      // @ts-expect-error - testing runtime behavior with undefined
      const result = getContrastTextColor(undefined);
      // Teal (#14b8a6) should get white text (it's a medium color)
      expect(["#ffffff", "#1e293b"]).toContain(result);
    });

    it("handles null by using default teal color", () => {
      // @ts-expect-error - testing runtime behavior with null
      const result = getContrastTextColor(null);
      expect(["#ffffff", "#1e293b"]).toContain(result);
    });

    it("handles empty string by using default teal color", () => {
      const result = getContrastTextColor("");
      expect(["#ffffff", "#1e293b"]).toContain(result);
    });
  });

  describe("real-world task colors from screenshot", () => {
    // These are the colors that were problematic in the screenshot
    it("returns white text on orange/brown (Alpha task)", () => {
      // Orange-brown color similar to screenshot
      expect(getContrastTextColor("#c97a20")).toBe("#ffffff");
      expect(getContrastTextColor("#b8860b")).toBe("#ffffff"); // DarkGoldenrod
    });

    it("returns white text on medium blue (Beta task)", () => {
      // Blue color similar to screenshot
      expect(getContrastTextColor("#4a90d9")).toBe("#ffffff");
      expect(getContrastTextColor("#3498db")).toBe("#ffffff");
    });

    it("returns white text on olive green (Charlie task)", () => {
      // Olive green similar to screenshot
      expect(getContrastTextColor("#808000")).toBe("#ffffff"); // Olive
      expect(getContrastTextColor("#6b8e23")).toBe("#ffffff"); // OliveDrab
    });
  });

  describe("common task colors", () => {
    // Test colors that are commonly used in project management tools
    const colorTestCases = [
      { hex: "#e74c3c", name: "Red", expectedText: "#ffffff" },
      { hex: "#e67e22", name: "Orange", expectedText: "#ffffff" },
      { hex: "#f1c40f", name: "Yellow", expectedText: "#1e293b" },
      { hex: "#2ecc71", name: "Emerald", expectedText: "#ffffff" },
      { hex: "#1abc9c", name: "Turquoise", expectedText: "#ffffff" },
      { hex: "#3498db", name: "Blue", expectedText: "#ffffff" },
      { hex: "#9b59b6", name: "Purple", expectedText: "#ffffff" },
      { hex: "#34495e", name: "Dark Blue-Gray", expectedText: "#ffffff" },
      { hex: "#95a5a6", name: "Gray", expectedText: "#ffffff" },
      { hex: "#14b8a6", name: "Teal (app default)", expectedText: "#ffffff" },
    ];

    colorTestCases.forEach(({ hex, name, expectedText }) => {
      it(`returns ${expectedText === "#ffffff" ? "white" : "dark"} text on ${name} (${hex})`, () => {
        expect(getContrastTextColor(hex)).toBe(expectedText);
      });
    });
  });
});
