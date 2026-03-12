/**
 * Unit tests for formVariantClasses shared style config.
 * Verifies that both variants exist and contain the required
 * focus-visibility classes to prevent regressions in form field styling.
 */

import { describe, it, expect } from "vitest";
import { formVariantClasses } from "../../../../src/components/common/formVariantClasses";

describe("formVariantClasses", () => {
  it("exports an object with 'default' and 'figma' keys", () => {
    expect(formVariantClasses).toHaveProperty("default");
    expect(formVariantClasses).toHaveProperty("figma");
  });

  it("both variants are non-empty strings", () => {
    expect(typeof formVariantClasses.default).toBe("string");
    expect(formVariantClasses.default.length).toBeGreaterThan(0);

    expect(typeof formVariantClasses.figma).toBe("string");
    expect(formVariantClasses.figma.length).toBeGreaterThan(0);
  });

  describe("default variant", () => {
    it("contains focus-visible:outline-none to suppress default outline", () => {
      expect(formVariantClasses.default).toContain("focus-visible:outline-none");
    });

    it("contains a focus-visible ring class for visible focus indication", () => {
      expect(formVariantClasses.default).toContain("focus-visible:ring-");
    });

    it("contains border-neutral-300 as default border color", () => {
      expect(formVariantClasses.default).toContain("border-neutral-300");
    });
  });

  describe("figma variant", () => {
    it("contains focus-visible:outline-none to suppress default outline", () => {
      expect(formVariantClasses.figma).toContain("focus-visible:outline-none");
    });

    it("contains a focus-visible ring class for visible focus indication", () => {
      expect(formVariantClasses.figma).toContain("focus-visible:ring-");
    });

    it("contains border-neutral-200 as default border color", () => {
      expect(formVariantClasses.figma).toContain("border-neutral-200");
    });
  });

  it("default and figma variants are different strings", () => {
    expect(formVariantClasses.default).not.toBe(formVariantClasses.figma);
  });
});
