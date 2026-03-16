/**
 * Unit tests for formVariantClasses shared style config.
 * Verifies that both variants exist and contain the required
 * focus-visibility classes to prevent regressions in form field styling.
 */

import { describe, it, expect } from "vitest";
import { formControlVariantClasses } from "@/components/common/formVariantClasses";

describe("formControlVariantClasses", () => {
  it("exports an object with 'default' and 'figma' keys", () => {
    expect(formControlVariantClasses).toHaveProperty("default");
    expect(formControlVariantClasses).toHaveProperty("figma");
  });

  it("both variants are non-empty strings", () => {
    expect(typeof formControlVariantClasses.default).toBe("string");
    expect(formControlVariantClasses.default.length).toBeGreaterThan(0);

    expect(typeof formControlVariantClasses.figma).toBe("string");
    expect(formControlVariantClasses.figma.length).toBeGreaterThan(0);
  });

  describe("default variant", () => {
    it("contains focus-visible:outline-none to suppress default outline", () => {
      expect(formControlVariantClasses.default).toContain("focus-visible:outline-none");
    });

    it("contains a focus-visible ring class for visible focus indication", () => {
      expect(formControlVariantClasses.default).toContain("focus-visible:ring-");
    });

    it("contains border-slate-300 as default border color", () => {
      expect(formControlVariantClasses.default).toContain("border-slate-300");
    });
  });

  describe("figma variant", () => {
    it("contains focus-visible:outline-none to suppress default outline", () => {
      expect(formControlVariantClasses.figma).toContain("focus-visible:outline-none");
    });

    it("contains a focus-visible ring class for visible focus indication", () => {
      expect(formControlVariantClasses.figma).toContain("focus-visible:ring-");
    });

    it("contains border-slate-300 as default border color", () => {
      expect(formControlVariantClasses.figma).toContain("border-slate-300");
    });
  });

  it("default and figma variants are different strings", () => {
    expect(formControlVariantClasses.default).not.toBe(formControlVariantClasses.figma);
  });
});
