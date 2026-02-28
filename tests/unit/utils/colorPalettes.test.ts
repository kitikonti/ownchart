/**
 * Tests for colorPalettes — palette data integrity and lookup functions
 */

import { describe, it, expect } from "vitest";
import {
  COLOR_PALETTES,
  CATEGORY_LABELS,
  PALETTE_CATEGORIES,
  PALETTES_BY_CATEGORY,
  DEFAULT_PALETTE_ID,
  getPaletteById,
  type PaletteCategory,
} from "../../../src/utils/colorPalettes";

describe("colorPalettes", () => {
  // ── Data Integrity ──────────────────────────────────────────────────────

  describe("data integrity", () => {
    it("has 27 palettes", () => {
      expect(COLOR_PALETTES).toHaveLength(27);
    });

    it("all palettes have unique IDs", () => {
      const ids = COLOR_PALETTES.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("all palettes have 8-10 colors", () => {
      for (const palette of COLOR_PALETTES) {
        expect(
          palette.colors.length,
          `${palette.id} has ${palette.colors.length} colors`,
        ).toBeGreaterThanOrEqual(8);
        expect(
          palette.colors.length,
          `${palette.id} has ${palette.colors.length} colors`,
        ).toBeLessThanOrEqual(10);
      }
    });

    it("all colors are valid lowercase 7-char hex codes", () => {
      const hexRegex = /^#[0-9a-f]{6}$/;
      for (const palette of COLOR_PALETTES) {
        for (const color of palette.colors) {
          expect(
            color,
            `${palette.id}: "${color}" is not valid lowercase hex`,
          ).toMatch(hexRegex);
        }
      }
    });

    it("all palettes have a non-empty name", () => {
      for (const palette of COLOR_PALETTES) {
        expect(palette.name.length).toBeGreaterThan(0);
      }
    });

    it("all palettes reference a valid category", () => {
      for (const palette of COLOR_PALETTES) {
        expect(PALETTE_CATEGORIES).toContain(palette.category);
      }
    });

    it("every category has at least one palette", () => {
      for (const category of PALETTE_CATEGORIES) {
        const count = COLOR_PALETTES.filter(
          (p) => p.category === category,
        ).length;
        expect(
          count,
          `category "${category}" has no palettes`,
        ).toBeGreaterThan(0);
      }
    });
  });

  // ── DEFAULT_PALETTE_ID ──────────────────────────────────────────────────

  describe("DEFAULT_PALETTE_ID", () => {
    it("points to an existing palette", () => {
      const palette = getPaletteById(DEFAULT_PALETTE_ID);
      expect(palette).toBeDefined();
    });

    it("is tableau-10", () => {
      expect(DEFAULT_PALETTE_ID).toBe("tableau-10");
    });
  });

  // ── getPaletteById ──────────────────────────────────────────────────────

  describe("getPaletteById", () => {
    it("returns the correct palette for a valid ID", () => {
      const palette = getPaletteById("tableau-10");
      expect(palette).toBeDefined();
      expect(palette!.name).toBe("Tableau 10");
      expect(palette!.category).toBe("classic");
      expect(palette!.colors).toHaveLength(10);
    });

    it("returns undefined for an invalid ID", () => {
      expect(getPaletteById("nonexistent")).toBeUndefined();
    });

    it("returns undefined for an empty string", () => {
      expect(getPaletteById("")).toBeUndefined();
    });

    it("finds palettes from each category", () => {
      expect(getPaletteById("d3-category10")?.category).toBe("classic");
      expect(getPaletteById("highcharts")?.category).toBe("professional");
      expect(getPaletteById("material-design")?.category).toBe("design");
      expect(getPaletteById("bold")?.category).toBe("vibrant");
      expect(getPaletteById("okabe-ito")?.category).toBe("soft");
    });
  });

  // ── CATEGORY_LABELS ─────────────────────────────────────────────────────

  describe("CATEGORY_LABELS", () => {
    it("has labels for all 5 categories", () => {
      const categories: PaletteCategory[] = [
        "classic",
        "professional",
        "design",
        "vibrant",
        "soft",
      ];
      for (const cat of categories) {
        expect(CATEGORY_LABELS[cat]).toBeDefined();
        expect(CATEGORY_LABELS[cat].length).toBeGreaterThan(0);
      }
    });
  });

  // ── PALETTE_CATEGORIES ──────────────────────────────────────────────────

  describe("PALETTE_CATEGORIES", () => {
    it("contains all 5 categories", () => {
      expect(PALETTE_CATEGORIES).toHaveLength(5);
      expect(PALETTE_CATEGORIES).toContain("classic");
      expect(PALETTE_CATEGORIES).toContain("professional");
      expect(PALETTE_CATEGORIES).toContain("design");
      expect(PALETTE_CATEGORIES).toContain("vibrant");
      expect(PALETTE_CATEGORIES).toContain("soft");
    });

    it("matches the keys of CATEGORY_LABELS", () => {
      const labelKeys = Object.keys(CATEGORY_LABELS) as PaletteCategory[];
      expect(PALETTE_CATEGORIES).toEqual(labelKeys);
    });
  });

  // ── PALETTES_BY_CATEGORY ────────────────────────────────────────────────

  describe("PALETTES_BY_CATEGORY", () => {
    it("has an entry for every category", () => {
      for (const category of PALETTE_CATEGORIES) {
        expect(PALETTES_BY_CATEGORY[category]).toBeDefined();
        expect(PALETTES_BY_CATEGORY[category].length).toBeGreaterThan(0);
      }
    });

    it("groups palettes correctly", () => {
      for (const category of PALETTE_CATEGORIES) {
        for (const palette of PALETTES_BY_CATEGORY[category]) {
          expect(palette.category).toBe(category);
        }
      }
    });

    it("total palettes across all categories equals COLOR_PALETTES length", () => {
      const total = PALETTE_CATEGORIES.reduce(
        (sum, cat) => sum + PALETTES_BY_CATEGORY[cat].length,
        0,
      );
      expect(total).toBe(COLOR_PALETTES.length);
    });

    it("has expected counts per category", () => {
      expect(PALETTES_BY_CATEGORY.classic).toHaveLength(4);
      expect(PALETTES_BY_CATEGORY.professional).toHaveLength(7);
      expect(PALETTES_BY_CATEGORY.design).toHaveLength(4);
      expect(PALETTES_BY_CATEGORY.vibrant).toHaveLength(7);
      expect(PALETTES_BY_CATEGORY.soft).toHaveLength(5);
    });
  });
});
