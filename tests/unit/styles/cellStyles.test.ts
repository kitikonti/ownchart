/**
 * Tests for shared cell styling utilities.
 * Verifies density-aware CSS custom properties and active cell styling.
 */

import { describe, it, expect } from "vitest";
import { getCellStyle, getActiveCellStyle } from "../../../src/styles/cellStyles";
import { CELL } from "../../../src/styles/design-tokens";

describe("getCellStyle", () => {
  it("returns density-aware CSS custom properties", () => {
    const style = getCellStyle("startDate");
    expect(style.height).toBe("var(--density-row-height)");
    expect(style.paddingTop).toBe("var(--density-cell-padding-y)");
    expect(style.paddingBottom).toBe("var(--density-cell-padding-y)");
    expect(style.paddingRight).toBe("var(--density-cell-padding-x)");
    expect(style.fontSize).toBe("var(--density-font-size-cell)");
  });

  it("includes paddingLeft for non-name columns", () => {
    const style = getCellStyle("startDate");
    expect(style.paddingLeft).toBe("var(--density-cell-padding-x)");
  });

  it("omits paddingLeft for name column (hierarchy handles indentation)", () => {
    const style = getCellStyle("name");
    expect(style.paddingLeft).toBeUndefined();
  });
});

describe("getActiveCellStyle", () => {
  it("extends base cell style with active border shadow", () => {
    const style = getActiveCellStyle("startDate");
    expect(style.height).toBe("var(--density-row-height)");
    expect(style.boxShadow).toBe(CELL.activeBorderShadow);
  });

  it("preserves name column paddingLeft behavior", () => {
    const style = getActiveCellStyle("name");
    expect(style.paddingLeft).toBeUndefined();
    expect(style.boxShadow).toBe(CELL.activeBorderShadow);
  });
});
