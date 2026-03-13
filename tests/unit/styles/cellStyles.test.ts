/**
 * Tests for shared cell styling utilities.
 * Verifies density-aware CSS custom properties and active cell styling.
 */

import { describe, it, expect } from "vitest";
import {
  getCellStyle,
  getActiveCellStyle,
  getEditingCellStyle,
} from "@/styles/cellStyles";
import { CELL, Z_INDEX } from "@/styles/design-tokens";

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

  it("applies cellActive z-index", () => {
    const style = getActiveCellStyle("startDate");
    expect(style.zIndex).toBe(Z_INDEX.cellActive);
  });

  it("preserves name column paddingLeft behavior", () => {
    const style = getActiveCellStyle("name");
    expect(style.paddingLeft).toBeUndefined();
    expect(style.boxShadow).toBe(CELL.activeBorderShadow);
  });
});

describe("getEditingCellStyle", () => {
  it("extends base cell style with active border shadow", () => {
    const style = getEditingCellStyle("startDate");
    expect(style.height).toBe("var(--density-row-height)");
    expect(style.paddingTop).toBe("var(--density-cell-padding-y)");
    expect(style.paddingBottom).toBe("var(--density-cell-padding-y)");
    expect(style.paddingRight).toBe("var(--density-cell-padding-x)");
    expect(style.fontSize).toBe("var(--density-font-size-cell)");
    expect(style.boxShadow).toBe(CELL.activeBorderShadow);
  });

  it("applies cellEditing z-index — higher than cellActive", () => {
    const editingStyle = getEditingCellStyle("startDate");
    const activeStyle = getActiveCellStyle("startDate");
    expect(editingStyle.zIndex).toBe(Z_INDEX.cellEditing);
    expect(Number(editingStyle.zIndex)).toBeGreaterThan(Number(activeStyle.zIndex));
  });

  it("omits paddingLeft for name column (hierarchy handles indentation)", () => {
    const style = getEditingCellStyle("name");
    expect(style.paddingLeft).toBeUndefined();
    expect(style.boxShadow).toBe(CELL.activeBorderShadow);
  });

  it("includes paddingLeft for non-name columns", () => {
    const style = getEditingCellStyle("startDate");
    expect(style.paddingLeft).toBe("var(--density-cell-padding-x)");
  });
});

describe("shared border shadow invariant", () => {
  it("getActiveCellStyle and getEditingCellStyle share the same boxShadow value", () => {
    // Both states use the same brand-colored inset shadow — only z-index differs.
    // If this fails, buildFocusedCellStyle's DRY contract has been broken.
    const active = getActiveCellStyle("startDate");
    const editing = getEditingCellStyle("startDate");
    expect(active.boxShadow).toBe(editing.boxShadow);
  });
});
